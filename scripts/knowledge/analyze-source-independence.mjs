#!/usr/bin/env node
// WS1 — Source independence analysis.
// Contract: docs/strategy-genesis/CONTROLS_SPEC.md, handoff section A.
// Detects non-independent evidence streams among source records and emits an
// IndependenceReport (knowledge/schema/independence-report.schema.json).
// Heuristic output only: NEVER mutates input/canonical records.
//
// CLI:
//   node scripts/knowledge/analyze-source-independence.mjs
//     [--input <fixture-file.json | dir>]     default: canonical knowledge/sources (+observations)
//     [--sources <dir>] [--observations <dir>]
//     [--out <dir>]                           default: knowledge/receipts/source-independence
//     [--now <ISO8601>]                       mandatory in fixture mode; fixes evaluation instant
//     [--config knowledge/config/governance.json]
//
// Exit codes: 0 ok, 1 policy/config violation (fail closed), 2 usage/IO error.
import fs from 'node:fs';
import path from 'node:path';
import { digest, canonicalStringify, fileDigest } from './lib/canonical-json.mjs';

const CONTROL = 'WS1';
const AREA = 'source-independence';

// ---------------------------------------------------------------------------
// URL normalization (deterministic, pure string ops)
// ---------------------------------------------------------------------------
const TRACKING_PARAMS = new Set([
  'fbclid', 'gclid', 'dclid', 'msclkid', 'twclid', 'yclid', 'mc_cid', 'mc_eid',
  'ref', 'ref_src', 'igshid', 'ocid', 'cmpid', '_hsenc', '_hsmi', 'spm', 'scm',
  'vero_id', 'wprid', 'gad_source', 'gbraid', 'wbraid', 'si', 'feature'
]);

export function normalizeUrl(raw) {
  if (typeof raw !== 'string') return null;
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const protocol = 'https:'; // scheme-insensitive canonical form
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const port = u.port ? `:${u.port}` : '';
  const pathname = u.pathname.replace(/\/+$/, '');
  const kept = [];
  for (const [k, v] of u.searchParams.entries()) {
    const key = k.toLowerCase();
    if (key.startsWith('utm_') || TRACKING_PARAMS.has(key)) continue;
    kept.push([key, v]);
  }
  kept.sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0) : a[0] < b[0] ? -1 : 1));
  const query = kept.map(([k, v]) => `${k}=${v}`).join('&');
  return `${protocol}//${host}${port}${pathname}${query ? `?${query}` : ''}`;
}

// ---------------------------------------------------------------------------
// Text normalization + similarity (deterministic, no embeddings)
// ---------------------------------------------------------------------------
const STOPWORDS = new Set((
  'a an the and or of to in on for with by at from as is are was were be been ' +
  'it its this that these those said says say according new over after amid ' +
  'will would could can has have had not no more most other into about via'
).split(' '));

export function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenSet(text) {
  return new Set(normalizeText(text).split(' ').filter((t) => t && !STOPWORDS.has(t)));
}

export function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

export function ngrams(text, n) {
  const toks = normalizeText(text).split(' ').filter((t) => t && !STOPWORDS.has(t));
  const out = new Set();
  for (let i = 0; i + n <= toks.length; i += 1) out.add(toks.slice(i, i + n).join(' '));
  return out;
}

// Similarity thresholds (documented in the WS1 final report):
//   title Jaccard >= 0.90            -> copied title (strong, syndication support)
//   lead  Jaccard >= 0.80            -> copied lead  (strong, syndication support)
//   title Jaccard in [0.55, 0.90)    -> ambiguous-similarity (review only)
//   lead  Jaccard in [0.40, 0.80)    -> ambiguous-similarity (review only)
//   shared distinctive 4-grams >= 3  -> analyst-echo (review only)
const THRESH = {
  titleCopied: 0.9,
  leadCopied: 0.8,
  titleAmbiguousLow: 0.55,
  leadAmbiguousLow: 0.4,
  analystEchoMinShared4Grams: 3
};

// ---------------------------------------------------------------------------
// Input loading
// ---------------------------------------------------------------------------
function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Normalize one raw record into the analyzer's internal source shape.
// Supports canonical Source records and reconstructed source bundles.
function toInternalSource(raw, originPath, warnings) {
  const id = raw.id ?? raw.sourceId ?? null;
  const url = raw.url ?? null;
  if (!id || !url) return null;
  return {
    id,
    url,
    canonicalUrl: normalizeUrl(url),
    publisher: raw.publisher ?? (hostOf(url) || 'unknown'),
    publishedAt: raw.publishedAt ?? null,
    sourceClass: raw.sourceClass ?? null,
    independenceKey: raw.independenceKey ?? null,
    title: raw.title ?? null,
    lead: raw.lead ?? raw.firstParagraph ?? null,
    analystNote: raw.analystNote ?? null,
    syndicatedFrom: raw.syndicatedFrom ?? raw.wireService ?? null,
    upstream: raw.upstream ?? {},
    doi: raw.doi ?? raw.upstream?.doi ?? null,
    upstreamReport: raw.upstreamReport ?? raw.upstream?.report ?? null,
    policyDocument: raw.policyDocument ?? raw.upstream?.policyDocument ?? null,
    cites: Array.isArray(raw.cites) ? raw.cites.slice() : [],
    citedBy: Array.isArray(raw.citedBy) ? raw.citedBy.slice() : [],
    originPath
  };
}

function loadSourcesFromDir(dir, warnings) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  for (const f of files) {
    const p = path.join(dir, f);
    const raw = readJson(p);
    if (Array.isArray(raw.sources) && !raw.url) {
      // Reconstructed source bundle: expand, keeping bundle provenance.
      for (const entry of raw.sources.slice().sort((a, b) => String(a.sourceId).localeCompare(String(b.sourceId)))) {
        const s = toInternalSource(entry, `${p}#${entry.sourceId}`, warnings);
        if (s) out.push(s);
      }
      warnings.push({
        rule: 'bundle-expanded',
        detail: `Expanded source bundle ${f} into ${raw.sources.length} source records for analysis.`,
        members: raw.sources.map((s) => String(s.sourceId)).sort()
      });
      continue;
    }
    const s = toInternalSource(raw, p, warnings);
    if (s) out.push(s);
  }
  return out;
}

function loadObservationsFromDir(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  for (const f of files) {
    const p = path.join(dir, f);
    const raw = readJson(p);
    const id = raw.id ?? raw.observationId ?? null;
    if (!id) continue;
    out.push({
      id,
      claim: raw.claim ?? raw.title ?? '',
      significance: raw.significance ?? '',
      sourceRefs: Array.isArray(raw.sourceRefs) ? raw.sourceRefs.slice() : [],
      originPath: p
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Union-find over strong (merge-grade) signals
// ---------------------------------------------------------------------------
function makeUnionFind(items) {
  const parent = new Map(items.map((x) => [x, x]));
  const find = (x) => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r);
    let cur = x;
    while (parent.get(cur) !== r) {
      const next = parent.get(cur);
      parent.set(cur, r);
      cur = next;
    }
    return r;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    parent.set(ra < rb ? rb : ra, ra < rb ? ra : rb);
  };
  return { find, union };
}

// ---------------------------------------------------------------------------
// Core analysis (pure, deterministic)
// ---------------------------------------------------------------------------
export function analyze({ sources, observations = [], config }) {
  if (!config || !Number.isInteger(config?.confidence?.minimumIndependentStreamsForPattern)) {
    const err = new Error('CONFIG-MISSING: governance.confidence.minimumIndependentStreamsForPattern is required');
    err.rule = 'config-minimum-independent-streams';
    throw err;
  }
  const warnings = [];
  const sorted = sources.slice().sort((a, b) => a.id.localeCompare(b.id));
  const ids = sorted.map((s) => s.id);

  // Observation text per source (analyst language evidence, rule 8).
  const obsTextBySource = new Map(ids.map((id) => [id, []]));
  for (const o of observations.slice().sort((a, b) => a.id.localeCompare(b.id))) {
    for (const ref of o.sourceRefs.slice().sort()) {
      if (obsTextBySource.has(ref)) obsTextBySource.get(ref).push(`${o.claim} ${o.significance}`.trim());
    }
  }

  const uf = makeUnionFind(ids);
  // pairwise strong evidence, keyed "idA|idB" (sorted), array of signals
  const pairEvidence = new Map();
  const addEvidence = (a, b, signal) => {
    const key = [a, b].sort().join('|');
    if (!pairEvidence.has(key)) pairEvidence.set(key, []);
    pairEvidence.get(key).push(signal);
  };

  const byRawUrl = new Map();
  const byCanonUrl = new Map();
  const byKey = new Map();
  const byWire = new Map();
  const byDoi = new Map();
  const byReport = new Map();
  const byPolicy = new Map();
  for (const s of sorted) {
    if (s.url) {
      if (!byRawUrl.has(s.url)) byRawUrl.set(s.url, []);
      byRawUrl.get(s.url).push(s.id);
    }
    if (s.canonicalUrl) {
      if (!byCanonUrl.has(s.canonicalUrl)) byCanonUrl.set(s.canonicalUrl, []);
      byCanonUrl.get(s.canonicalUrl).push(s.id);
    }
    if (s.independenceKey) {
      if (!byKey.has(s.independenceKey)) byKey.set(s.independenceKey, []);
      byKey.get(s.independenceKey).push(s.id);
    }
    if (s.syndicatedFrom) {
      const w = s.syndicatedFrom.toLowerCase().trim();
      if (!byWire.has(w)) byWire.set(w, []);
      byWire.get(w).push(s.id);
    }
    if (s.doi) {
      const d = s.doi.toLowerCase().trim();
      if (!byDoi.has(d)) byDoi.set(d, []);
      byDoi.get(d).push(s.id);
    }
    if (s.upstreamReport) {
      const r = s.upstreamReport.toLowerCase().trim();
      if (!byReport.has(r)) byReport.set(r, []);
      byReport.get(r).push(s.id);
    }
    if (s.policyDocument) {
      const p = s.policyDocument.toLowerCase().trim();
      if (!byPolicy.has(p)) byPolicy.set(p, []);
      byPolicy.get(p).push(s.id);
    }
  }

  const linkGroup = (groupMap, makeSignal, strong = true) => {
    for (const value of Array.from(groupMap.keys()).sort()) {
      const members = groupMap.get(value).slice().sort();
      for (let i = 0; i < members.length; i += 1) {
        for (let j = i + 1; j < members.length; j += 1) {
          addEvidence(members[i], members[j], makeSignal(value, members));
          if (strong) uf.union(members[i], members[j]);
        }
      }
    }
  };

  linkGroup(byRawUrl, (v, m) => ({
    signal: 'raw-url-identical',
    detail: `Sources ${m.join(', ')} share byte-identical URL ${v}.`,
    confidence: 1.0
  }));
  linkGroup(byCanonUrl, (v, m) => ({
    signal: 'canonical-url-equal',
    detail: `Sources ${m.join(', ')} normalize to the same canonical URL ${v} (protocol/www/trailing-slash/tracking-params stripped).`,
    confidence: 0.98
  }));
  linkGroup(byKey, (v, m) => ({
    signal: 'shared-independence-key',
    detail: `Sources ${m.join(', ')} declare the same independenceKey "${v}".`,
    confidence: 0.95
  }));
  linkGroup(byWire, (v, m) => ({
    signal: 'shared-wire-origin',
    detail: `Sources ${m.join(', ')} declare the same originating publisher/wire "${v}".`,
    confidence: 0.95
  }));
  linkGroup(byDoi, (v, m) => ({
    signal: 'shared-doi',
    detail: `Sources ${m.join(', ')} reference the same upstream DOI "${v}".`,
    confidence: 0.95
  }));
  linkGroup(byReport, (v, m) => ({
    signal: 'shared-upstream-report',
    detail: `Sources ${m.join(', ')} reference the same upstream report "${v}".`,
    confidence: 0.9
  }));
  linkGroup(byPolicy, (v, m) => ({
    signal: 'shared-policy-document',
    detail: `Sources ${m.join(', ')} reference the same policy document "${v}".`,
    confidence: 0.9
  }));

  // Copied title/lead (strong) — collected pairwise.
  const byId = new Map(sorted.map((s) => [s.id, s]));
  const ambiguousPairs = [];
  const echoPairs = [];
  for (let i = 0; i < sorted.length; i += 1) {
    for (let j = i + 1; j < sorted.length; j += 1) {
      const a = sorted[i];
      const b = sorted[j];
      const titleSim = a.title && b.title ? jaccard(tokenSet(a.title), tokenSet(b.title)) : 0;
      const leadSim = a.lead && b.lead ? jaccard(tokenSet(a.lead), tokenSet(b.lead)) : 0;
      if (titleSim >= THRESH.titleCopied) {
        addEvidence(a.id, b.id, {
          signal: 'copied-title',
          detail: `Normalized title token Jaccard ${titleSim.toFixed(2)} >= ${THRESH.titleCopied} between ${a.id} and ${b.id}.`,
          confidence: 0.9
        });
        if (a.publisher !== b.publisher || a.canonicalUrl !== b.canonicalUrl) uf.union(a.id, b.id);
      }
      if (leadSim >= THRESH.leadCopied) {
        addEvidence(a.id, b.id, {
          signal: 'copied-lead',
          detail: `Normalized lead token Jaccard ${leadSim.toFixed(2)} >= ${THRESH.leadCopied} between ${a.id} and ${b.id}.`,
          confidence: 0.9
        });
        if (a.publisher !== b.publisher || a.canonicalUrl !== b.canonicalUrl) uf.union(a.id, b.id);
      }
      const titleAmbiguous = titleSim >= THRESH.titleAmbiguousLow && titleSim < THRESH.titleCopied;
      const leadAmbiguous = leadSim >= THRESH.leadAmbiguousLow && leadSim < THRESH.leadCopied;
      if (titleAmbiguous || leadAmbiguous) {
        ambiguousPairs.push({ a: a.id, b: b.id, titleSim, leadSim });
      }
      // Analyst-echo: shared distinctive 4-grams across analyst language.
      const textA = [a.lead, a.analystNote, ...(obsTextBySource.get(a.id) || [])].filter(Boolean).join(' ');
      const textB = [b.lead, b.analystNote, ...(obsTextBySource.get(b.id) || [])].filter(Boolean).join(' ');
      if (textA && textB) {
        const gA = ngrams(textA, 4);
        const gB = ngrams(textB, 4);
        let shared = 0;
        for (const g of gA) if (gB.has(g)) shared += 1;
        if (shared >= THRESH.analystEchoMinShared4Grams) {
          echoPairs.push({ a: a.id, b: b.id, shared });
        }
      }
    }
  }

  // ---- Strong clusters (merge-grade): exactly ONE originating stream each.
  const components = new Map(); // root -> member ids
  for (const id of ids) {
    const root = uf.find(id);
    if (!components.has(root)) components.set(root, []);
    components.get(root).push(id);
  }
  const componentList = Array.from(components.values())
    .map((m) => m.slice().sort())
    .sort((x, y) => x[0].localeCompare(y[0]));

  // Relationship precedence for merged clusters.
  const PRECEDENCE = ['exact-duplicate', 'syndication', 'shared-upstream'];
  const SIGNAL_TO_REL = {
    'raw-url-identical': 'exact-duplicate',
    'canonical-url-equal': 'exact-duplicate',
    'shared-independence-key': 'syndication',
    'shared-wire-origin': 'syndication',
    'copied-title': 'syndication',
    'copied-lead': 'syndication',
    'shared-doi': 'shared-upstream',
    'shared-upstream-report': 'shared-upstream',
    'shared-policy-document': 'shared-upstream'
  };

  const clusters = [];
  const strongComponentOf = new Map(); // id -> component index
  componentList.forEach((members, idx) => members.forEach((id) => strongComponentOf.set(id, idx)));

  const clusterIdFor = (relationship, members) =>
    `cluster:${digest({ relationship, members }).slice(0, 12)}`;

  for (const members of componentList) {
    if (members.length < 2) continue; // singleton = its own stream, no cluster
    const evidence = [];
    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        const key = [members[i], members[j]].sort().join('|');
        for (const ev of pairEvidence.get(key) || []) {
          if (SIGNAL_TO_REL[ev.signal]) evidence.push(ev);
        }
      }
    }
    // Deduplicate identical signals deterministically.
    evidence.sort((x, y) => x.signal.localeCompare(y.signal) || x.detail.localeCompare(y.detail));
    const seen = new Set();
    const deduped = evidence.filter((ev) => {
      const k = `${ev.signal}::${ev.detail}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    let relationship = PRECEDENCE.find((rel) => deduped.some((ev) => SIGNAL_TO_REL[ev.signal] === rel));
    if (!relationship) relationship = 'syndication';

    // Origin candidates: explicit wire origin wins; otherwise earliest publishedAt
    // (nulls last), ties broken by id. Multiple earliest ties => ambiguous origin.
    const memberRecs = members.map((id) => byId.get(id));
    let originCandidates;
    const wireValues = Array.from(new Set(memberRecs.map((r) => (r.syndicatedFrom || '').toLowerCase().trim()).filter(Boolean))).sort();
    let originAmbiguous = false;
    const wirePublisherMatch = memberRecs.filter((r) => wireValues.includes((r.publisher || '').toLowerCase().trim()));
    if (wirePublisherMatch.length > 0) {
      originCandidates = wirePublisherMatch.map((r) => r.id).sort();
    } else if (relationship === 'shared-upstream') {
      const upstreamIds = Array.from(new Set(memberRecs.flatMap((r) =>
        [r.doi ? `doi:${r.doi.toLowerCase().trim()}` : null,
         r.upstreamReport ? `report:${r.upstreamReport.toLowerCase().trim()}` : null,
         r.policyDocument ? `policy:${r.policyDocument.toLowerCase().trim()}` : null].filter(Boolean)))).sort();
      originCandidates = upstreamIds.length > 0 ? upstreamIds : [members[0]];
    } else {
      const dated = memberRecs.filter((r) => r.publishedAt);
      if (dated.length > 0) {
        const earliest = dated.map((r) => r.publishedAt).sort()[0];
        const atEarliest = dated.filter((r) => r.publishedAt === earliest).map((r) => r.id).sort();
        originCandidates = atEarliest;
        originAmbiguous = atEarliest.length > 1;
      } else {
        originCandidates = [members[0]];
        originAmbiguous = true;
      }
    }

    const inferredOnly = deduped.every((ev) => ev.signal === 'copied-title' || ev.signal === 'copied-lead');
    // exact-duplicate clusters are the same canonical document by definition, so
    // origin ambiguity is moot there; for syndication/shared-upstream an
    // ambiguous origin (or inference-only syndication) needs human review.
    const manualReviewRequired =
      (originAmbiguous && relationship !== 'exact-duplicate') ||
      (inferredOnly && relationship === 'syndication');
    const confidence = Math.max(...deduped.map((ev) => ev.confidence));

    clusters.push({
      clusterId: clusterIdFor(relationship, members),
      relationship,
      originCandidates,
      members,
      confidence,
      independentStreams: 1,
      evidence: deduped,
      manualReviewRequired
    });
  }

  // ---- Citation cycles (review-only; never merged into streams).
  // Build directed graph; self-citations are removed before cycle detection
  // (a self-citation is NOT a 2-node cycle and is reported only as info).
  const canonUrlToId = new Map();
  for (const s of sorted) {
    if (s.canonicalUrl && !canonUrlToId.has(s.canonicalUrl)) canonUrlToId.set(s.canonicalUrl, s.id);
    if (s.url && !canonUrlToId.has(s.url)) canonUrlToId.set(s.url, s.id);
  }
  const resolveRef = (ref) => {
    if (byId.has(ref)) return ref;
    const norm = normalizeUrl(ref);
    if (norm && canonUrlToId.has(norm)) return canonUrlToId.get(norm);
    if (canonUrlToId.has(ref)) return canonUrlToId.get(ref);
    return null;
  };
  const edges = new Map(ids.map((id) => [id, new Set()]));
  const selfCitations = [];
  for (const s of sorted) {
    const refs = new Set([...s.cites.map(resolveRef).filter(Boolean)]);
    for (const r of s.citedBy.map(resolveRef).filter(Boolean)) {
      // citedBy X == X cites s
      if (r === s.id) continue;
      if (!edges.has(r)) edges.set(r, new Set());
      edges.get(r).add(s.id);
    }
    for (const r of refs) {
      if (r === s.id) {
        selfCitations.push(s.id);
        continue;
      }
      edges.get(s.id).add(r);
    }
  }
  for (const id of selfCitations.sort()) {
    warnings.push({
      rule: 'self-citation-ignored',
      detail: `${id} cites itself; self-citations are excluded from cycle detection.`,
      members: [id]
    });
  }

  // Tarjan SCC (iterative, deterministic traversal order).
  const sccs = [];
  {
    const index = new Map();
    const low = new Map();
    const onStack = new Set();
    const stack = [];
    let counter = 0;
    for (const start of ids) {
      if (index.has(start)) continue;
      const work = [[start, 0]];
      while (work.length > 0) {
        const [node, ci] = work[work.length - 1];
        if (ci === 0) {
          index.set(node, counter);
          low.set(node, counter);
          counter += 1;
          stack.push(node);
          onStack.add(node);
        }
        const succ = Array.from(edges.get(node) || []).sort();
        if (ci < succ.length) {
          work[work.length - 1][1] = ci + 1;
          const m = succ[ci];
          if (!index.has(m)) {
            work.push([m, 0]);
          } else if (onStack.has(m)) {
            low.set(node, Math.min(low.get(node), index.get(m)));
          }
        } else {
          if (low.get(node) === index.get(node)) {
            const scc = [];
            let w;
            do {
              w = stack.pop();
              onStack.delete(w);
              scc.push(w);
            } while (w !== node);
            if (scc.length >= 2) sccs.push(scc.sort());
          }
          work.pop();
          if (work.length > 0) {
            const parent = work[work.length - 1][0];
            low.set(parent, Math.min(low.get(parent), low.get(node)));
          }
        }
      }
    }
    sccs.sort((a, b) => a[0].localeCompare(b[0]));
  }

  for (const scc of sccs) {
    const cycleEdges = [];
    for (const from of scc) {
      for (const to of Array.from(edges.get(from) || []).sort()) {
        if (scc.includes(to)) cycleEdges.push(`${from} -> ${to}`);
      }
    }
    cycleEdges.sort();
    const streams = new Set(scc.map((id) => strongComponentOf.get(id))).size;
    clusters.push({
      clusterId: clusterIdFor('citation-cycle', scc),
      relationship: 'citation-cycle',
      originCandidates: [scc[0]],
      members: scc,
      confidence: 0.85,
      independentStreams: streams,
      evidence: [{
        signal: scc.length === 2 ? 'mutual-citation' : 'citation-cycle-path',
        detail: `Citation cycle across ${scc.length} sources: ${cycleEdges.join('; ')}.`,
        confidence: 0.85
      }],
      manualReviewRequired: true
    });
    warnings.push({
      rule: 'citation-cycle',
      detail: `Sources ${scc.join(', ')} form a citation cycle (${cycleEdges.join('; ')}); independence cannot be assumed.`,
      members: scc
    });
  }

  // ---- Analyst-echo + ambiguous-similarity (review-only, NEVER merged).
  const strongLinked = (a, b) => strongComponentOf.get(a) === strongComponentOf.get(b);
  const sameScc = (a, b) => sccs.some((scc) => scc.includes(a) && scc.includes(b));
  for (const { a, b, shared } of echoPairs.sort((x, y) => x.a.localeCompare(y.a) || x.b.localeCompare(y.b))) {
    if (strongLinked(a, b) || sameScc(a, b)) continue;
    const members = [a, b].sort();
    clusters.push({
      clusterId: clusterIdFor('analyst-echo', members),
      relationship: 'analyst-echo',
      originCandidates: [members[0]],
      members,
      confidence: 0.6,
      independentStreams: 2,
      evidence: [{
        signal: 'shared-analyst-language',
        detail: `${members.join(' and ')} share ${shared} distinctive 4-grams of analyst language (>= ${THRESH.analystEchoMinShared4Grams}) despite distinct independence keys.`,
        confidence: 0.6
      }],
      manualReviewRequired: true
    });
  }
  for (const { a, b, titleSim, leadSim } of ambiguousPairs.sort((x, y) => x.a.localeCompare(y.a) || x.b.localeCompare(y.b))) {
    if (strongLinked(a, b) || sameScc(a, b)) continue;
    if (echoPairs.some((p) => (p.a === a && p.b === b) || (p.a === b && p.b === a))) continue;
    const members = [a, b].sort();
    const evidence = [];
    if (titleSim >= THRESH.titleAmbiguousLow && titleSim < THRESH.titleCopied) {
      evidence.push({
        signal: 'title-similarity-band',
        detail: `Title token Jaccard ${titleSim.toFixed(2)} in ambiguous band [${THRESH.titleAmbiguousLow}, ${THRESH.titleCopied}) for ${members.join(' and ')}.`,
        confidence: Math.round(titleSim * 100) / 100
      });
    }
    if (leadSim >= THRESH.leadAmbiguousLow && leadSim < THRESH.leadCopied) {
      evidence.push({
        signal: 'lead-similarity-band',
        detail: `Lead token Jaccard ${leadSim.toFixed(2)} in ambiguous band [${THRESH.leadAmbiguousLow}, ${THRESH.leadCopied}) for ${members.join(' and ')}.`,
        confidence: Math.round(leadSim * 100) / 100
      });
    }
    if (evidence.length === 0) continue;
    evidence.sort((x, y) => x.signal.localeCompare(y.signal));
    clusters.push({
      clusterId: clusterIdFor('ambiguous-similarity', members),
      relationship: 'ambiguous-similarity',
      originCandidates: members,
      members,
      confidence: Math.max(...evidence.map((e) => e.confidence)),
      independentStreams: 2,
      evidence,
      manualReviewRequired: true
    });
  }

  clusters.sort((x, y) => x.clusterId.localeCompare(y.clusterId));

  const clusteredIds = new Set(clusters.filter((c) => PRECEDENCE.includes(c.relationship)).flatMap((c) => c.members));
  const unclusteredSources = ids.filter((id) => !clusteredIds.has(id));
  const independentStreamCount =
    clusters.filter((c) => PRECEDENCE.includes(c.relationship)).length + unclusteredSources.length;
  const reviewQueue = clusters.filter((c) => c.manualReviewRequired).map((c) => c.clusterId).sort();

  return {
    type: 'IndependenceReport',
    control: CONTROL,
    config: {
      minimumIndependentStreamsForPattern: config.confidence.minimumIndependentStreamsForPattern
    },
    sourcesAnalyzed: ids.length,
    observationsAnalyzed: observations.length,
    clusters,
    unclusteredSources,
    independentStreamCount,
    reviewQueue,
    warnings: warnings.sort((x, y) => x.rule.localeCompare(y.rule) || x.detail.localeCompare(y.detail))
  };
}

/**
 * Analyze one self-describing fixture object ({ sources, observations }).
 * Used by the WS1 test harness and by `--input <fixture-file>` CLI runs.
 * Never mutates the fixture.
 */
export function analyzeFixture(fixture, config) {
  const sources = (fixture.sources || [])
    .map((s, i) => toInternalSource(s, `fixture:${fixture.fixtureId ?? 'unknown'}#sources[${i}]`, []))
    .filter(Boolean);
  const observations = (fixture.observations || []).map((o, i) => ({
    id: o.id ?? o.observationId ?? `obs:fixture:${i}`,
    claim: o.claim ?? '',
    significance: o.significance ?? '',
    sourceRefs: Array.isArray(o.sourceRefs) ? o.sourceRefs : [],
    originPath: `fixture:${fixture.fixtureId ?? 'unknown'}#observations[${i}]`
  }));
  return analyze({ sources, observations, config });
}

// ---------------------------------------------------------------------------
// Report assembly + IO
// ---------------------------------------------------------------------------
export function buildReport({ analysis, generatedAt, inputMode, inputFiles }) {
  const base = {
    reportId: 'independence-report:placeholder',
    type: 'IndependenceReport',
    control: CONTROL,
    generatedAt,
    ...analysis,
    input: inputFiles
  };
  const reportId = `independence-report:${digest({ ...base, reportId: undefined, generatedAt: undefined }).slice(0, 12)}`;
  return { ...base, reportId };
}

/** Digest-stable view: excludes volatile fields (generatedAt). */
export function reportDigest(report) {
  const { generatedAt, ...stable } = report;
  return digest(stable);
}

function parseArgs(argv) {
  const args = { out: path.join('knowledge', 'receipts', AREA), config: path.join('knowledge', 'config', 'governance.json') };
  for (let i = 2; i < argv.length; i += 1) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--input') { args.input = v; i += 1; } else if (k === '--sources') { args.sources = v; i += 1; } else if (k === '--observations') { args.observations = v; i += 1; } else if (k === '--out') { args.out = v; i += 1; } else if (k === '--now') { args.now = v; i += 1; } else if (k === '--config') { args.config = v; i += 1; } else if (k === '--fixtures') { args.fixtures = true; } else {
      console.error(`FAIL unknown argument ${k}`);
      process.exit(2);
    }
  }
  return args;
}

async function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv);
  if (!fs.existsSync(args.config)) {
    console.error(`FAIL config-minimum-independent-streams: config file ${args.config} not found`);
    process.exit(1);
  }
  const config = readJson(args.config);
  const warnings = [];
  let sources = [];
  let observations = [];
  let inputMode = 'canonical';
  const inputFiles = { mode: 'canonical', sources: [], observations: [] };

  if (args.input && fs.existsSync(args.input) && fs.statSync(args.input).isFile()) {
    // Fixture file: { fixtureId, sources: [...], observations: [...] }
    inputMode = 'fixture';
    const fixture = readJson(args.input);
    if (!args.now) {
      console.error('FAIL usage: --now is mandatory in fixture mode');
      process.exit(2);
    }
    sources = (fixture.sources || []).map((s, i) => toInternalSource(s, `${args.input}#sources[${i}]`, warnings)).filter(Boolean);
    observations = (fixture.observations || []).map((o, i) => ({
      id: o.id ?? o.observationId ?? `obs:fixture:${i}`,
      claim: o.claim ?? '',
      significance: o.significance ?? '',
      sourceRefs: Array.isArray(o.sourceRefs) ? o.sourceRefs : [],
      originPath: `${args.input}#observations[${i}]`
    }));
    const fh = await fileDigest(args.input);
    inputFiles.mode = 'fixture';
    inputFiles.sources = sources.map((s) => ({ id: s.id, path: s.originPath, sha256: fh }));
    inputFiles.observations = observations.map((o) => ({ id: o.id, path: o.originPath, sha256: fh }));
  } else {
    const srcDir = args.input || args.sources || path.join('knowledge', 'sources');
    const obsDir = args.observations || path.join('knowledge', 'observations');
    inputMode = args.input ? 'input-dir' : 'canonical';
    sources = loadSourcesFromDir(srcDir, warnings);
    observations = loadObservationsFromDir(obsDir);
    inputFiles.mode = inputMode;
    // Deduplicate file digests by path.
    const digestCache = new Map();
    const fd = async (p) => {
      const rel = path.relative(root, p).replaceAll('\\', '/');
      if (!digestCache.has(rel)) digestCache.set(rel, await fileDigest(p));
      return digestCache.get(rel);
    };
    const seenSrc = new Set();
    for (const s of sources) {
      const [file] = s.originPath.split('#');
      const rel = path.relative(root, file).replaceAll('\\', '/');
      const key = `${s.id}|${rel}`;
      if (seenSrc.has(key)) continue;
      seenSrc.add(key);
      inputFiles.sources.push({ id: s.id, path: s.originPath.includes('#') ? `${rel}${s.originPath.slice(s.originPath.indexOf('#'))}` : rel, sha256: await fd(file) });
    }
    for (const o of observations) {
      const rel = path.relative(root, o.originPath).replaceAll('\\', '/');
      inputFiles.observations.push({ id: o.id, path: rel, sha256: await fd(o.originPath) });
    }
    inputFiles.sources.sort((a, b) => a.id.localeCompare(b.id));
    inputFiles.observations.sort((a, b) => a.id.localeCompare(b.id));
  }

  const analysis = analyze({ sources, observations, config });
  analysis.warnings = [...warnings, ...analysis.warnings]
    .sort((a, b) => a.rule.localeCompare(b.rule) || a.detail.localeCompare(b.detail));

  const generatedAt = args.now ?? new Date().toISOString();
  const report = buildReport({ analysis, generatedAt, inputMode, inputFiles });

  fs.mkdirSync(args.out, { recursive: true });
  const stamp = args.now
    ? args.now.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
    : generatedAt.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const reportPath = path.join(args.out, `${AREA}-report-${stamp}.json`);
  fs.writeFileSync(reportPath, `${canonicalStringify(report)}\n`);

  const d = reportDigest(report);
  const receipt = {
    receiptId: `receipt:${AREA}:${stamp}`,
    control: CONTROL,
    generatedAt,
    inputs: inputFiles.sources.concat(inputFiles.observations),
    results: {
      reportPath: path.relative(root, reportPath).replaceAll('\\', '/'),
      reportId: report.reportId,
      sourcesAnalyzed: report.sourcesAnalyzed,
      observationsAnalyzed: report.observationsAnalyzed,
      clusterCount: report.clusters.length,
      independentStreamCount: report.independentStreamCount,
      reviewQueueSize: report.reviewQueue.length
    },
    violations: [],
    digest: digest({
      reportId: report.reportId,
      clusters: report.clusters,
      independentStreamCount: report.independentStreamCount,
      reviewQueue: report.reviewQueue,
      warnings: report.warnings
    })
  };
  const receiptPath = path.join(args.out, `${AREA}-receipt-${stamp}.json`);
  fs.writeFileSync(receiptPath, `${canonicalStringify(receipt)}\n`);

  console.log(`INFO analyzed ${report.sourcesAnalyzed} sources, ${report.observationsAnalyzed} observations`);
  console.log(`INFO clusters=${report.clusters.length} independentStreams=${report.independentStreamCount} reviewQueue=${report.reviewQueue.length}`);
  for (const w of report.warnings) console.log(`WARN ${w.rule}: ${w.detail}`);
  console.log(`PASS report written ${path.relative(root, reportPath)}`);
  console.log(`DIGEST ${AREA} ${d}`);
  process.exit(0);
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href;
if (isMain) {
  main().catch((e) => {
    if (e.rule) {
      console.error(`FAIL ${e.rule}: ${e.message}`);
      process.exit(1);
    }
    console.error(`FAIL io-error: ${e.message}`);
    process.exit(2);
  });
}
