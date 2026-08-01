#!/usr/bin/env node
// WS5 — Sensitive-data and rights scanner.
// Contract: docs/strategy-genesis/CONTROLS_SPEC.md, handoff section E,
// knowledge/config/governance.json sensitiveData block, protocols/sensitive-data-and-rights.md.
//
// Scans candidate knowledge records for secrets, undeclared personal data,
// classification-metadata violations, and copyright-excerpt violations.
// Emits per-record verdicts {recordRef, detectedClass, declaredClass, action,
// rulesFired, redactions}; actions: pass | quarantine | reject | minimize-candidate.
// NEVER writes raw sensitive values: secrets are recorded only as a redacted
// fingerprint (prefix[<=4 chars] + length + sha256 of the match).
// NEVER writes to canonical record directories; output goes only to
// knowledge/receipts/sensitive-data/ and knowledge/quarantine/sensitive-data/.
//
// CLI:
//   node scripts/knowledge/scan-sensitive-data.mjs
//     [--input <file.json | dir>]   default: knowledge/observations (read-only)
//     [--out <dir>]                 default: knowledge/receipts/sensitive-data
//     [--quarantine <dir>]          default: knowledge/quarantine/sensitive-data
//     [--now <ISO8601>]             mandatory in fixture mode; fixes evaluation instant
//     [--config knowledge/config/governance.json]
//
// Exit codes: 0 = every record may be ingested as-is (all pass);
//             1 = policy violation (any reject / minimize-candidate) or missing config;
//             2 = usage/IO error.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { digest, canonicalStringify, fileDigest } from './lib/canonical-json.mjs';

const CONTROL = 'WS5';
const AREA = 'sensitive-data';
export const TRUNCATION_MARKER = '…[truncated]';

export const CLASSES = [
  'public', 'internal', 'confidential', 'restricted', 'personal',
  'sensitive-personal', 'health', 'financial', 'application', 'licensed',
  'copyrighted-excerpt', 'private-repository', 'secret', 'prohibited'
];
// Strictest tier (handoff E): missing governance metadata => reject.
const STRICT_CLASSES = ['health', 'financial', 'application', 'private-repository'];
const REQUIRED_GOVERNANCE_KEYS = ['purpose', 'minimization', 'accessBoundary', 'retention', 'approval'];

// ---------------------------------------------------------------------------
// Detection patterns (documented limits in protocols/sensitive-data-and-rights.md)
// ---------------------------------------------------------------------------
export const SECRET_PATTERNS = [
  { name: 'openai-api-key', re: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'github-pat', re: /\bghp_[A-Za-z0-9]{36,}\b/ },
  { name: 'github-fine-grained-pat', re: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/ },
  { name: 'aws-access-key-id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'slack-token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'jwt', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  { name: 'private-key-block', re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/ }
];
const PASSWORD_FIELD_RE = /(password|passwd|passphrase|pwd)$/i;

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/;
const DOB_KEY_RE = /^(dob|dateofbirth|birthdate)$/i;
const DOB_VALUE_RE = /\b(date of birth|dob)\b[:\s]*\d{4}-\d{2}-\d{2}/i;
const NAME_KEY_RE = /^(fullname|firstname|lastname|surname|givenname)$/i;
const IDENTIFIER_KEY_RE = /^(ssn|nationalid|passport|passportnumber|driverlicense|driverlicence|taxid)$/i;

const normKey = (k) => k.replace(/[^A-Za-z0-9]/g, '');

// ---------------------------------------------------------------------------
// Config (fail closed: SPEC §6)
// ---------------------------------------------------------------------------
export function readConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    const e = new Error(`config file ${configPath} not found`);
    e.rule = 'CONFIG_MISSING';
    throw e;
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const sd = config?.sensitiveData;
  const bad =
    !sd ||
    !['quarantine', 'reject'].includes(sd.defaultUnknownPersonalAction) ||
    sd.secretsAction !== 'reject' ||
    sd.prohibitedAction !== 'reject' ||
    !Number.isInteger(sd.maximumCopyrightExcerptWords) ||
    !Array.isArray(sd.requirePurposeFor) ||
    !Array.isArray(sd.requireRetentionFor);
  if (bad) {
    const e = new Error('governance.json sensitiveData block missing required keys');
    e.rule = 'CONFIG_MISSING_SENSITIVE_DATA';
    throw e;
  }
  return config;
}

// ---------------------------------------------------------------------------
// Record extraction: a JSON doc may be one record, an array of records, or a
// fixture/bundle object with a records array.
// ---------------------------------------------------------------------------
export function extractRecords(doc) {
  if (Array.isArray(doc)) return doc.filter((r) => r && typeof r === 'object');
  if (doc && typeof doc === 'object') {
    if (Array.isArray(doc.records)) return doc.records.filter((r) => r && typeof r === 'object');
    if ('fixtureId' in doc) return [];
    return [doc];
  }
  return [];
}

export function recordRefOf(record, index) {
  return record.recordRef ?? record.id ?? record.observationId ?? record.sourceId ?? `record:${index}`;
}

// ---------------------------------------------------------------------------
// String walking (deterministic: sorted by field path)
// ---------------------------------------------------------------------------
export function collectStrings(value, base = '') {
  const out = [];
  const walk = (v, p) => {
    if (typeof v === 'string') out.push({ path: p, value: v });
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`));
    else if (v && typeof v === 'object') {
      for (const k of Object.keys(v).sort()) walk(v[k], p ? `${p}.${k}` : k);
    }
  };
  walk(value, base);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function fingerprint(match) {
  return {
    prefix: match.slice(0, 4),
    length: match.length,
    sha256: createHash('sha256').update(match, 'utf8').digest('hex')
  };
}

// Secret scan: per field, then pairwise cross-field concatenation to catch a
// secret split across exactly two fields. Pairwise scan is bounded
// (<= MAX_PAIRWISE_FIELDS string fields) and documented as a known limit.
const MAX_PAIRWISE_FIELDS = 60;
export function scanSecrets(record) {
  const findings = [];
  const strings = collectStrings(record);
  for (const { path: p, value } of strings) {
    for (const { name, re } of SECRET_PATTERNS) {
      const m = value.match(re);
      if (m) findings.push({ rule: `secret-pattern:${name}`, field: p, ...fingerprint(m[0]) });
    }
    const last = normKey(p.split(/[.\[\]]/).filter(Boolean).pop() ?? '');
    if (PASSWORD_FIELD_RE.test(last) && value.trim().length > 0) {
      findings.push({ rule: 'password-in-field', field: p, ...fingerprint(value.trim()) });
    }
  }
  if (findings.length === 0 && strings.length >= 2 && strings.length <= MAX_PAIRWISE_FIELDS) {
    for (let i = 0; i < strings.length; i += 1) {
      for (let j = i + 1; j < strings.length; j += 1) {
        for (const [a, b] of [[strings[i], strings[j]], [strings[j], strings[i]]]) {
          const joined = a.value + b.value;
          for (const { name, re } of SECRET_PATTERNS) {
            const m = joined.match(re);
            if (m) {
              findings.push({
                rule: `secret-split-across-fields:${name}`,
                field: `${a.path}+${b.path}`,
                ...fingerprint(m[0])
              });
            }
          }
        }
      }
    }
  }
  // Deduplicate identical findings deterministically.
  const seen = new Set();
  return findings.filter((f) => {
    const k = `${f.rule}|${f.field}|${f.sha256}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => a.rule.localeCompare(b.rule) || a.field.localeCompare(b.field));
}

// Personal-data signals (only applied to records lacking dataClassification).
export function personalSignals(record) {
  const strings = collectStrings(record);
  const signals = new Set();
  const keys = strings.map((s) => normKey(s.path.split(/[.\[\]]/).filter(Boolean).pop() ?? ''));
  for (const { value } of strings) {
    if (EMAIL_RE.test(value)) signals.add('email');
    if (SSN_RE.test(value)) signals.add('ssn');
    if (DOB_VALUE_RE.test(value)) signals.add('dob');
  }
  keys.forEach((k, i) => {
    if (DOB_KEY_RE.test(k) && strings[i].value.trim()) signals.add('dob');
  });
  if (keys.some((k) => NAME_KEY_RE.test(k)) && keys.some((k) => IDENTIFIER_KEY_RE.test(k))) {
    signals.add('name-plus-identifier');
  }
  return [...signals].sort();
}

// ---------------------------------------------------------------------------
// Copyright helpers
// ---------------------------------------------------------------------------
const EXCERPT_FIELDS = ['excerpt', 'excerptText', 'text', 'content', 'body'];
export function findExcerptField(record) {
  for (const f of EXCERPT_FIELDS) {
    if (typeof record[f] === 'string' && record[f].trim()) return { field: f, text: record[f] };
  }
  return null;
}
export function wordCount(text) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}
export function minimizeExcerpt(text, maxWords) {
  const words = text.trim().split(/\s+/).slice(0, maxWords);
  return `${words.join(' ')} ${TRUNCATION_MARKER}`;
}

// ---------------------------------------------------------------------------
// Core per-record scan. Returns verdict {recordRef, detectedClass,
// declaredClass, action, rulesFired, redactions} plus side artifacts.
// ---------------------------------------------------------------------------
export function scanRecord(record, index, config) {
  const sd = config.sensitiveData;
  const recordRef = recordRefOf(record, index);
  const rules = new Set();
  const redactions = [];
  const declaredRaw = record.dataClassification?.class ?? null;
  const declaredClass = declaredRaw !== null && CLASSES.includes(declaredRaw) ? declaredRaw : null;
  let detectedClass = declaredClass ?? 'unclassified';
  let action = 'pass';
  let minimizePatch = null;

  const reject = (rule) => { action = 'reject'; rules.add(rule); };
  const quarantine = (rule) => { if (action !== 'reject') { action = 'quarantine'; rules.add(rule); } };

  // 1. Secrets / auth material take precedence over every other rule.
  const secretFindings = scanSecrets(record);
  if (secretFindings.length > 0) {
    reject('SECRET_DETECTED');
    for (const f of secretFindings) {
      rules.add(f.rule);
      redactions.push({ rule: f.rule, field: f.field, prefix: f.prefix, length: f.length, sha256: f.sha256 });
    }
    if (declaredRaw !== null && declaredClass === null) rules.add('INVALID_CLASS');
    return { recordRef, detectedClass: declaredClass ?? 'secret', declaredClass, action, rulesFired: [...rules].sort(), redactions, minimizePatch };
  }

  // 2. Unknown class label: fail closed.
  if (declaredRaw !== null && declaredClass === null) {
    reject('INVALID_CLASS');
    return { recordRef, detectedClass: 'unclassified', declaredClass: null, action, rulesFired: [...rules].sort(), redactions, minimizePatch };
  }

  // 3. Declared-class policies.
  if (declaredClass === 'prohibited') {
    reject('PROHIBITED_CLASS');
  } else if (declaredClass === 'secret') {
    reject('SECRET_DECLARED');
  } else if (STRICT_CLASSES.includes(declaredClass)) {
    const dc = record.dataClassification ?? {};
    const missing = REQUIRED_GOVERNANCE_KEYS.filter((k) => {
      if (k === 'approval') return !(dc.approval?.approvedBy && dc.approval?.approvedAt);
      return typeof dc[k] !== 'string' || dc[k].length === 0;
    });
    if (missing.length > 0) reject('STRICT_METADATA_MISSING');
  } else if (declaredClass === 'copyrighted-excerpt') {
    const dc = record.dataClassification ?? {};
    const missingMeta = ['license', 'permittedUse', 'excerptWordCount', 'deletionRequirement']
      .filter((k) => (k === 'excerptWordCount' ? !Number.isInteger(dc[k]) : typeof dc[k] !== 'string' || dc[k].length === 0));
    if (missingMeta.length > 0) {
      reject('COPYRIGHT_METADATA_MISSING');
    } else if (record.fullArticle === true) {
      reject('FULL_ARTICLE_INGESTION');
    } else {
      const excerpt = findExcerptField(record);
      const actual = excerpt ? wordCount(excerpt.text) : null;
      const effective = Math.max(actual ?? 0, dc.excerptWordCount ?? 0);
      if (effective > sd.maximumCopyrightExcerptWords) {
        if (excerpt) {
          action = 'minimize-candidate';
          rules.add('EXCERPT_TOO_LONG');
          minimizePatch = {
            patchId: `minimize-candidate:${createHash('sha256').update(recordRef, 'utf8').digest('hex').slice(0, 12)}`,
            control: CONTROL,
            recordRef,
            field: excerpt.field,
            operation: 'truncate-excerpt',
            originalWordCount: actual,
            proposedWordCount: sd.maximumCopyrightExcerptWords,
            truncationMarker: TRUNCATION_MARKER,
            proposedValue: minimizeExcerpt(excerpt.text, sd.maximumCopyrightExcerptWords),
            neverAutoApply: true,
            requiresHumanApproval: true
          };
        } else {
          reject('EXCERPT_TOO_LONG');
        }
      }
    }
  } else if (['personal', 'sensitive-personal', 'confidential', 'restricted'].includes(declaredClass)) {
    const dc = record.dataClassification ?? {};
    const missing = REQUIRED_GOVERNANCE_KEYS.filter((k) => {
      if (k === 'approval') return !(dc.approval?.approvedBy && dc.approval?.approvedAt);
      return typeof dc[k] !== 'string' || dc[k].length === 0;
    });
    if (missing.length > 0) quarantine('GOVERNED_METADATA_MISSING');
  } else if (declaredClass === 'licensed') {
    const dc = record.dataClassification ?? {};
    const missing = ['license', 'permittedUse', 'retention']
      .filter((k) => typeof dc[k] !== 'string' || dc[k].length === 0);
    if (missing.length > 0) quarantine('LICENSED_METADATA_MISSING');
  }
  // public / internal: no metadata required (internal is not in requirePurposeFor).

  // 4. Undeclared records: unknown personal data defaults to quarantine.
  if (declaredClass === null && action === 'pass') {
    const signals = personalSignals(record);
    if (signals.length > 0) {
      detectedClass = 'personal';
      if (sd.defaultUnknownPersonalAction === 'reject') reject('UNDECLARED_PERSONAL_DATA');
      else quarantine('UNDECLARED_PERSONAL_DATA');
      for (const s of signals) rules.add(`personal-signal:${s}`);
    }
  }

  return {
    recordRef,
    detectedClass,
    declaredClass,
    action,
    rulesFired: [...rules].sort(),
    redactions: redactions.sort((a, b) => a.rule.localeCompare(b.rule) || a.field.localeCompare(b.field)),
    minimizePatch
  };
}

export function scanRecords(records, config) {
  const verdicts = [];
  const minimizePatches = [];
  records.forEach((record, i) => {
    const v = scanRecord(record, i, config);
    verdicts.push(v);
    if (v.minimizePatch) minimizePatches.push(v.minimizePatch);
  });
  verdicts.sort((a, b) => a.recordRef.localeCompare(b.recordRef));
  minimizePatches.sort((a, b) => a.patchId.localeCompare(b.patchId));
  return { verdicts, minimizePatches };
}

// ---------------------------------------------------------------------------
// Receipt + quarantine artifacts (SPEC §2). Digest excludes generatedAt.
// ---------------------------------------------------------------------------
const safeName = (s) => s.replace(/[^A-Za-z0-9._-]/g, '_');

export function buildVerdictResults(verdicts) {
  const counts = { pass: 0, quarantine: 0, reject: 0, 'minimize-candidate': 0 };
  for (const v of verdicts) counts[v.action] += 1;
  return {
    recordsScanned: verdicts.length,
    counts,
    verdicts: verdicts.map(({ minimizePatch, ...v }) => v),
    quarantineFiles: verdicts.filter((v) => v.action === 'quarantine')
      .map((v) => `knowledge/quarantine/${AREA}/${safeName(v.recordRef)}.json`).sort(),
    minimizeCandidateFiles: verdicts.filter((v) => v.action === 'minimize-candidate')
      .map((v) => `knowledge/quarantine/${AREA}/minimize-candidates/${safeName(v.recordRef)}.json`).sort()
  };
}

export function violationsFromVerdicts(verdicts) {
  return verdicts
    .filter((v) => v.action === 'reject')
    .map((v) => ({
      rule: v.rulesFired[0] ?? 'REJECTED',
      record: v.recordRef,
      detail: `rejected; rules fired: ${v.rulesFired.join(', ')}`
    }))
    .sort((a, b) => a.record.localeCompare(b.record));
}

export function buildReceipt({ receiptId, generatedAt, inputs, verdicts, minimizePatches }) {
  const results = buildVerdictResults(verdicts);
  const violations = violationsFromVerdicts(verdicts);
  const receipt = {
    receiptId,
    control: CONTROL,
    generatedAt,
    inputs,
    results,
    violations,
    digest: digest({ results, violations })
  };
  return receipt;
}

export function quarantineDoc(record, verdict, generatedAt) {
  return {
    quarantineId: `quarantine:${AREA}:${createHash('sha256').update(verdict.recordRef, 'utf8').digest('hex').slice(0, 12)}`,
    control: CONTROL,
    recordRef: verdict.recordRef,
    detectedClass: verdict.detectedClass,
    rulesFired: verdict.rulesFired,
    redactionNote: 'Record quarantined by WS5 sensitive-data scan. The scan receipt carries no raw sensitive values (secrets appear only as redacted fingerprints; personal-data signals as signal kinds only). This holding copy is retained for human review and classification; it is NOT canonical knowledge.',
    recordedAt: generatedAt,
    record
  };
}

// Write quarantine copies + minimize-candidate patches. Returns written
// repo-relative paths (sorted). Only ever writes under knowledge/quarantine/sensitive-data/.
export function writeSideArtifacts({ quarantineDir, root, recordsByRef, verdicts, minimizePatches, generatedAt }) {
  const written = [];
  fs.mkdirSync(quarantineDir, { recursive: true });
  for (const v of verdicts.filter((x) => x.action === 'quarantine')) {
    const doc = quarantineDoc(recordsByRef.get(v.recordRef), v, generatedAt);
    const p = path.join(quarantineDir, `${safeName(v.recordRef)}.json`);
    fs.writeFileSync(p, `${canonicalStringify(doc)}\n`);
    written.push(path.relative(root, p).replaceAll('\\', '/'));
  }
  for (const patch of minimizePatches) {
    const dir = path.join(quarantineDir, 'minimize-candidates');
    fs.mkdirSync(dir, { recursive: true });
    const p = path.join(dir, `${safeName(patch.recordRef)}.json`);
    fs.writeFileSync(p, `${canonicalStringify(patch)}\n`);
    written.push(path.relative(root, p).replaceAll('\\', '/'));
  }
  return written.sort();
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const args = {
    input: null,
    out: path.join('knowledge', 'receipts', AREA),
    quarantine: path.join('knowledge', 'quarantine', AREA),
    now: null,
    config: path.join('knowledge', 'config', 'governance.json')
  };
  for (let i = 2; i < argv.length; i += 1) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--input') { args.input = v; i += 1; }
    else if (k === '--out') { args.out = v; i += 1; }
    else if (k === '--quarantine') { args.quarantine = v; i += 1; }
    else if (k === '--now') { args.now = v; i += 1; }
    else if (k === '--config') { args.config = v; i += 1; }
    else { console.error(`FAIL unknown argument ${k}`); process.exit(2); }
  }
  return args;
}

async function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv);
  const config = readConfig(args.config); // fail closed (throws with .rule)

  const inputPath = args.input ?? path.join('knowledge', 'observations');
  if (!fs.existsSync(inputPath)) {
    console.error(`FAIL io-error: input ${inputPath} not found`);
    process.exit(2);
  }
  const isFixtureFile = fs.statSync(inputPath).isFile();
  if (isFixtureFile && !args.now) {
    console.error('FAIL usage: --now is mandatory in fixture mode (file input)');
    process.exit(2);
  }

  const files = isFixtureFile
    ? [inputPath]
    : fs.readdirSync(inputPath).filter((f) => f.endsWith('.json')).sort()
      .map((f) => path.join(inputPath, f));

  const records = [];
  const recordsByRef = new Map();
  const inputs = [];
  for (const file of files) {
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    const recs = extractRecords(doc);
    const fh = await fileDigest(file);
    inputs.push({ path: path.relative(root, file).replaceAll('\\', '/'), sha256: fh });
    recs.forEach((r) => {
      const ref = recordRefOf(r, records.length);
      recordsByRef.set(ref, r);
      records.push(r);
    });
  }
  inputs.sort((a, b) => a.path.localeCompare(b.path));

  const { verdicts, minimizePatches } = scanRecords(records, config);
  const generatedAt = args.now ?? new Date().toISOString();
  writeSideArtifacts({ quarantineDir: args.quarantine, root, recordsByRef, verdicts, minimizePatches, generatedAt });

  const stamp = generatedAt.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const receipt = buildReceipt({
    receiptId: `receipt:${AREA}:${stamp}`,
    generatedAt,
    inputs,
    verdicts,
    minimizePatches
  });
  fs.mkdirSync(args.out, { recursive: true });
  const receiptPath = path.join(args.out, `${AREA}-receipt-${stamp}.json`);
  fs.writeFileSync(receiptPath, `${canonicalStringify(receipt)}\n`);

  const c = receipt.results.counts;
  console.log(`INFO scanned=${receipt.results.recordsScanned} pass=${c.pass} quarantine=${c.quarantine} reject=${c.reject} minimize-candidate=${c['minimize-candidate']}`);
  for (const v of verdicts.filter((x) => x.action !== 'pass')) {
    console.log(`WARN ${v.action.toUpperCase()} ${v.recordRef}: ${v.rulesFired.join(', ')}`);
  }
  for (const viol of receipt.violations) console.log(`FAIL ${viol.rule} on ${viol.record}`);
  console.log(`PASS receipt written ${path.relative(root, receiptPath).replaceAll('\\', '/')}`);
  console.log(`DIGEST ${AREA} ${receipt.digest}`);
  process.exit(receipt.violations.length > 0 || c['minimize-candidate'] > 0 ? 1 : 0);
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
