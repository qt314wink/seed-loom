// WS6 confidence-calibration: score resolved calibration events (Brier score,
// calibration bands, over/underconfidence deltas) WITHOUT ever mutating canonical
// records or knowledge/config/governance.json. Contract:
// docs/strategy-genesis/CONTROLS_SPEC.md and handoff section "F. Confidence
// calibration". Threshold values: knowledge/config/governance.json confidence block.
//
// Semantics (binding for WS6):
//  - Scoring is BINARY-ONLY (named rule): observedOutcome must be 0 or 1;
//    originalConfidence p is the predicted probability that predictedOutcome
//    occurs; Brier contribution = (p - o)^2. Multi-outcome / non-binary events
//    are rejected with NON_BINARY_OUTCOME. Multi-outcome calibration is out of
//    scope by design (documented restriction).
//  - Only status 'resolved' AND resolutionQuality 'clean' events are scored.
//  - UNRESOLVED predictions are EXCLUDED from scoring but REPORTED
//    (results.unresolved {count, predictionIds}); they never contaminate scores.
//  - AMBIGUOUS_RESOLUTION policy (documented choice: EXCLUDE, never down-weight):
//    resolutionQuality 'ambiguous' or 'contested' events are excluded from
//    scoring with a WARN and reported in results.excludedNonClean.
//  - RETROACTIVE LEAKAGE / TEMPORAL RULES (reject, exit 1):
//      OUTCOME_LEAKAGE        - any outcomeEvidence[].observedAt < predictionDate
//      TEMPORAL_INCONSISTENCY - evaluationDate < predictionDate (or unparseable dates)
//      UNRESOLVED_OUTCOME_FIELD - status 'unresolved' but observedOutcome present
//                               or outcomeEvidence non-empty
//      INVALID_CALIBRATION_EVENT - structural field/type failure
//      MISSING_CONFIDENCE_CONFIG - governance.json confidence block unusable (fail closed)
//  - Calibration bands (fixed, documented): '0.0-0.5', '0.5-0.6', '0.6-0.7',
//    '0.7-0.8', '0.8-0.9', '0.9-1.0'; buckets are [lo, hi) except the last which
//    includes 1.0. Only non-empty bands are reported, each with count,
//    meanPredicted, observedFrequency, calibrationDelta = meanPredicted -
//    observedFrequency (positive => overconfident in that band).
//  - SAMPLE ADEQUACY (documented): MIN_SAMPLE = 30 scored events. n < 30 per
//    domain or overall => WARN INSUFFICIENT_SAMPLE and thresholdChangeEligible =
//    false with reason; such runs CANNOT justify threshold changes.
//  - THRESHOLD GOVERNANCE: this script PROPOSES nothing. When the overall sample
//    is adequate (n >= 30) AND |overall calibrationDelta| >= 0.05 it emits only
//    the advisory marker 'threshold-review-candidate' (no values). Threshold
//    changes require a reviewed governance amendment; historical governance
//    values are never rewritten and this script NEVER writes to
//    knowledge/config/governance.json (the harness asserts immutability).
//  - DOMAIN SEPARATION: per-domain scores are computed separately and reported
//    alongside an explicit 'overall' aggregate; domains are never pooled silently.
//
// CLI: node scripts/knowledge/calibrate-confidence.mjs
//   [--input <file|dir> ...] [--fixtures] [--now <ISO8601>]
//   [--config knowledge/config/governance.json]
//   [--out knowledge/receipts/calibration]
//   [--projections-out knowledge/projections/calibration]
// Exit codes: 0 ok | 1 rule violation(s) reported | 2 usage/IO error.

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, canonicalStringify, fileDigest } from './lib/canonical-json.mjs';

export const CONTROL = 'WS6';
export const CONTROL_NAME = 'calibration';
export const MIN_SAMPLE = 30;
export const MISCALIBRATION_DELTA = 0.05;
export const BANDS = [
  { label: '0.0-0.5', lo: 0.0, hi: 0.5 },
  { label: '0.5-0.6', lo: 0.5, hi: 0.6 },
  { label: '0.6-0.7', lo: 0.6, hi: 0.7 },
  { label: '0.7-0.8', lo: 0.7, hi: 0.8 },
  { label: '0.8-0.9', lo: 0.8, hi: 0.9 },
  { label: '0.9-1.0', lo: 0.9, hi: 1.0 },
];

const round6 = (x) => {
  const r = Math.round(x * 1e6) / 1e6;
  return Object.is(r, -0) ? 0 : r;
};

const parseUtcMs = (iso) => {
  if (typeof iso !== 'string') return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
};

function bandFor(p) {
  for (const b of BANDS) {
    if (p >= b.lo && (p < b.hi || (b.hi === 1.0 && p <= 1.0))) return b.label;
  }
  return null; // unreachable for p in [0,1]
}

/** Structural validation of one event. Returns an error detail string or null. */
function structuralError(ev) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) return 'event is not an object';
  if (typeof ev.predictionId !== 'string' || ev.predictionId.length === 0) return 'missing/invalid predictionId';
  if (typeof ev.predictionDate !== 'string' || parseUtcMs(ev.predictionDate) === null) return 'missing/invalid predictionDate';
  if (typeof ev.originalConfidence !== 'number' || ev.originalConfidence < 0 || ev.originalConfidence > 1) return 'missing/invalid originalConfidence (need number in [0,1])';
  if (typeof ev.predictedOutcome !== 'string' || ev.predictedOutcome.length === 0) return 'missing/invalid predictedOutcome';
  if (typeof ev.evaluationDate !== 'string' || parseUtcMs(ev.evaluationDate) === null) return 'missing/invalid evaluationDate';
  if (!['clean', 'ambiguous', 'contested'].includes(ev.resolutionQuality)) return "missing/invalid resolutionQuality (need clean|ambiguous|contested)";
  if (typeof ev.domain !== 'string' || ev.domain.length === 0) return 'missing/invalid domain';
  if (!['resolved', 'unresolved'].includes(ev.status)) return "missing/invalid status (need resolved|unresolved)";
  if (ev.outcomeEvidence !== undefined) {
    if (!Array.isArray(ev.outcomeEvidence)) return 'outcomeEvidence must be an array';
    for (const e of ev.outcomeEvidence) {
      if (!e || typeof e !== 'object' || typeof e.ref !== 'string' || e.ref.length === 0) return 'outcomeEvidence[] missing ref';
      if (parseUtcMs(e.observedAt) === null) return 'outcomeEvidence[] missing/invalid observedAt';
    }
  }
  if (ev.notes !== undefined && typeof ev.notes !== 'string') return 'notes must be a string';
  return null;
}

/**
 * Classify one event. Pure; never mutates. Returns exactly one of:
 *   {violation} | {warning, excluded} | {unresolved} | {scored}
 */
export function classifyEvent(ev, sourceFile) {
  const ref = ev && typeof ev === 'object' && typeof ev.predictionId === 'string' ? ev.predictionId : '(unknown-prediction)';
  const at = { record: ref, sourceFile };
  const sErr = structuralError(ev);
  if (sErr) return { violation: { rule: 'INVALID_CALIBRATION_EVENT', ...at, detail: sErr } };

  const predMs = parseUtcMs(ev.predictionDate);
  const evalMs = parseUtcMs(ev.evaluationDate);
  if (evalMs < predMs) {
    return { violation: { rule: 'TEMPORAL_INCONSISTENCY', ...at, detail: `evaluationDate ${ev.evaluationDate} is before predictionDate ${ev.predictionDate}` } };
  }

  if (ev.status === 'unresolved') {
    if (ev.observedOutcome !== undefined || (Array.isArray(ev.outcomeEvidence) && ev.outcomeEvidence.length > 0)) {
      return { violation: { rule: 'UNRESOLVED_OUTCOME_FIELD', ...at, detail: 'unresolved event carries observedOutcome/outcomeEvidence; an unresolved prediction must not smuggle in an outcome' } };
    }
    return { unresolved: { predictionId: ev.predictionId, domain: ev.domain } };
  }

  // status === 'resolved'
  if (ev.observedOutcome !== 0 && ev.observedOutcome !== 1) {
    return { violation: { rule: 'NON_BINARY_OUTCOME', ...at, detail: `scoring is binary-only; observedOutcome must be 0 or 1, got ${JSON.stringify(ev.observedOutcome ?? null)}` } };
  }
  for (const e of ev.outcomeEvidence ?? []) {
    if (parseUtcMs(e.observedAt) < predMs) {
      return { violation: { rule: 'OUTCOME_LEAKAGE', ...at, detail: `outcomeEvidence '${e.ref}' observedAt ${e.observedAt} predates predictionDate ${ev.predictionDate}; retroactive outcome leakage rejected` } };
    }
  }
  if (ev.resolutionQuality !== 'clean') {
    return {
      warning: { rule: 'AMBIGUOUS_RESOLUTION', ...at, detail: `resolutionQuality '${ev.resolutionQuality}' is not 'clean'; excluded from scoring per documented exclude-policy (never down-weighted)` },
      excluded: { predictionId: ev.predictionId, domain: ev.domain, resolutionQuality: ev.resolutionQuality },
    };
  }
  return {
    scored: {
      predictionId: ev.predictionId,
      domain: ev.domain,
      p: ev.originalConfidence,
      o: ev.observedOutcome,
      brier: round6(Math.pow(ev.originalConfidence - ev.observedOutcome, 2)),
      band: bandFor(ev.originalConfidence),
    },
  };
}

/** Score a set of scored events. Returns the per-group score block. */
export function scoreGroup(scoredEvents) {
  const n = scoredEvents.length;
  if (n === 0) {
    return { sampleSize: 0, brierScore: null, meanPredicted: null, observedFrequency: null, overconfidenceDelta: null, underconfidenceDelta: null, calibrationDelta: null, bands: [], insufficientSample: true };
  }
  const brierScore = round6(scoredEvents.reduce((s, e) => s + e.brier, 0) / n);
  const meanPredicted = round6(scoredEvents.reduce((s, e) => s + e.p, 0) / n);
  const observedFrequency = round6(scoredEvents.reduce((s, e) => s + e.o, 0) / n);
  const calibrationDelta = round6(meanPredicted - observedFrequency);
  const bands = [];
  for (const b of BANDS) {
    const inBand = scoredEvents.filter((e) => e.band === b.label);
    if (inBand.length === 0) continue;
    const bMean = round6(inBand.reduce((s, e) => s + e.p, 0) / inBand.length);
    const bObs = round6(inBand.reduce((s, e) => s + e.o, 0) / inBand.length);
    bands.push({ band: b.label, count: inBand.length, meanPredicted: bMean, observedFrequency: bObs, calibrationDelta: round6(bMean - bObs) });
  }
  return {
    sampleSize: n,
    brierScore,
    meanPredicted,
    observedFrequency,
    calibrationDelta,
    overconfidenceDelta: round6(Math.max(0, calibrationDelta)),
    underconfidenceDelta: round6(Math.max(0, -calibrationDelta)),
    bands,
    insufficientSample: n < MIN_SAMPLE,
  };
}

async function collectJsonFiles(inputPath, out = []) {
  const stat = await import('node:fs/promises').then((fs) => fs.stat(inputPath));
  if (stat.isDirectory()) {
    const names = (await readdir(inputPath)).sort((a, b) => a.localeCompare(b));
    for (const name of names) await collectJsonFiles(path.join(inputPath, name), out);
  } else if (inputPath.endsWith('.json')) out.push(inputPath);
  return out;
}

/** Extract the event list from a parsed input file (fixture wrapper or bare). */
function eventsOf(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.events)) return parsed.events;
    if (parsed.event && typeof parsed.event === 'object') return [parsed.event];
    if (typeof parsed.predictionId === 'string') return [parsed];
  }
  return null;
}

function usage(msg) {
  console.error(`FAIL ${msg}`);
  console.error('Usage: node scripts/knowledge/calibrate-confidence.mjs [--input <file|dir> ...] [--fixtures] [--now <ISO8601>] [--config <path>] [--out <dir>] [--projections-out <dir>]');
  process.exit(2);
}

export async function run(argv, { cwd = process.cwd(), stdout = console.log } = {}) {
  const args = [...argv];
  const inputs = [];
  let fixturesMode = false;
  let nowIso = null;
  let configPath = 'knowledge/config/governance.json';
  let outDir = 'knowledge/receipts/calibration';
  let projectionsDir = 'knowledge/projections/calibration';
  while (args.length) {
    const a = args.shift();
    if (a === '--input') { if (!args.length) usage('--input requires a value'); inputs.push(args.shift()); }
    else if (a === '--fixtures') fixturesMode = true;
    else if (a === '--now') { if (!args.length) usage('--now requires a value'); nowIso = args.shift(); }
    else if (a === '--config') { if (!args.length) usage('--config requires a value'); configPath = args.shift(); }
    else if (a === '--out') { if (!args.length) usage('--out requires a value'); outDir = args.shift(); }
    else if (a === '--projections-out') { if (!args.length) usage('--projections-out requires a value'); projectionsDir = args.shift(); }
    else usage(`unknown argument: ${a}`);
  }
  if (fixturesMode && inputs.length === 0) inputs.push('knowledge/fixtures/calibration');
  if (inputs.length === 0) usage('no --input given (or use --fixtures)');

  const nowMs = nowIso ? parseUtcMs(nowIso) : Date.now();
  if (nowIso && nowMs === null) usage(`--now '${nowIso}' is not a valid ISO8601 timestamp`);
  const evaluatedAt = new Date(nowMs).toISOString();

  let governance;
  try {
    governance = JSON.parse(await readFile(path.resolve(cwd, configPath), 'utf8'));
  } catch (err) {
    console.error(`FAIL cannot read config ${configPath}: ${err.message}`);
    return { exitCode: 2 };
  }
  const conf = governance.confidence;
  if (!conf || typeof conf.experimentThreshold !== 'number' || typeof conf.genesisThreshold !== 'number' || conf.neverMutateBaseConfidence !== true) {
    const violation = { rule: 'MISSING_CONFIDENCE_CONFIG', record: configPath, detail: 'governance.json lacks a usable confidence block {experimentThreshold:number, genesisThreshold:number, neverMutateBaseConfidence:true}; failing closed' };
    stdout(`FAIL ${violation.rule}: ${violation.detail}`);
    const label = evaluatedAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const receipt = buildReceipt({ evaluatedAt, inputs: [], results: { governance: null }, violations: [violation], warnings: [], label });
    return { exitCode: 1, receipt, projection: null };
  }

  // Gather input files (deterministic order).
  let files = [];
  try {
    for (const input of inputs) files.push(...await collectJsonFiles(path.resolve(cwd, input)));
  } catch (err) {
    console.error(`FAIL cannot read input: ${err.message}`);
    return { exitCode: 2 };
  }
  files = [...new Set(files)].sort((a, b) => a.localeCompare(b));

  const scored = []; const unresolved = []; const excludedNonClean = [];
  const violations = []; const warnings = []; const inputDigests = [];
  for (const file of files) {
    const rel = path.relative(cwd, file);
    let parsed;
    try {
      parsed = JSON.parse(await readFile(file, 'utf8'));
    } catch (err) {
      violations.push({ rule: 'INVALID_INPUT_FILE', record: rel, detail: `cannot parse JSON: ${err.message}` });
      continue;
    }
    inputDigests.push({ path: rel, sha256: await fileDigest(file) });
    const events = eventsOf(parsed);
    if (events === null || events.length === 0) {
      violations.push({ rule: 'INVALID_INPUT_FILE', record: rel, detail: 'file contains no calibration event(s) (expected event, events array, or fixture wrapper)' });
      continue;
    }
    for (const ev of events) {
      const r = classifyEvent(ev, rel);
      if (r.violation) violations.push(r.violation);
      else if (r.warning) { warnings.push(r.warning); excludedNonClean.push(r.excluded); }
      else if (r.unresolved) unresolved.push(r.unresolved);
      else scored.push({ ...r.scored, sourceFile: rel });
    }
  }
  scored.sort((a, b) => a.predictionId.localeCompare(b.predictionId));
  unresolved.sort((a, b) => a.predictionId.localeCompare(b.predictionId));
  excludedNonClean.sort((a, b) => a.predictionId.localeCompare(b.predictionId));
  violations.sort((a, b) => (a.record + a.rule).localeCompare(b.record + b.rule));
  warnings.sort((a, b) => (a.record + a.rule).localeCompare(b.record + b.rule));

  // Per-domain scores (never pooled silently) + explicit overall aggregate.
  const domainNames = [...new Set(scored.map((e) => e.domain))].sort((a, b) => a.localeCompare(b));
  const domains = {};
  for (const d of domainNames) {
    domains[d] = scoreGroup(scored.filter((e) => e.domain === d));
    if (domains[d].insufficientSample) {
      warnings.push({ rule: 'INSUFFICIENT_SAMPLE', record: `domain:${d}`, detail: `domain '${d}' has n=${domains[d].sampleSize} scored events (< MIN_SAMPLE ${MIN_SAMPLE}); per-domain calibration cannot justify threshold changes` });
    }
  }
  const overall = scoreGroup(scored);
  if (overall.insufficientSample) {
    warnings.push({ rule: 'INSUFFICIENT_SAMPLE', record: 'overall', detail: `overall n=${overall.sampleSize} scored events (< MIN_SAMPLE ${MIN_SAMPLE}); run CANNOT justify threshold changes` });
  }
  warnings.sort((a, b) => (a.record + a.rule).localeCompare(b.record + b.rule));

  const thresholdChangeEligible = !overall.insufficientSample;
  const thresholdReviewCandidate = (thresholdChangeEligible && Math.abs(overall.calibrationDelta) >= MISCALIBRATION_DELTA)
    ? {
        advisory: 'threshold-review-candidate',
        absCalibrationDelta: round6(Math.abs(overall.calibrationDelta)),
        basis: { sampleSize: overall.sampleSize, calibrationDelta: overall.calibrationDelta, miscalibrationDeltaTrigger: MISCALIBRATION_DELTA },
        note: 'advisory only — this script proposes NO threshold values; threshold changes require a reviewed governance amendment and historical governance values are never rewritten',
      }
    : null;

  const results = {
    evaluatedAt,
    policy: {
      outcomeModel: 'binary-only',
      scoringRule: 'brier=(p-o)^2 with o in {0,1}; multi-outcome events rejected (NON_BINARY_OUTCOME)',
      nonCleanResolutionPolicy: 'exclude (ambiguous/contested never scored, never down-weighted)',
      minSample: MIN_SAMPLE,
      miscalibrationDeltaTrigger: MISCALIBRATION_DELTA,
      bands: BANDS.map((b) => b.label),
    },
    governance: {
      experimentThreshold: conf.experimentThreshold,
      genesisThreshold: conf.genesisThreshold,
      neverMutateBaseConfidence: conf.neverMutateBaseConfidence,
      note: 'read-only echo; this script never writes knowledge/config/governance.json',
    },
    scoredEventCount: scored.length,
    scoredEvents: scored,
    unresolved: { count: unresolved.length, predictions: unresolved },
    excludedNonClean: { count: excludedNonClean.length, predictions: excludedNonClean },
    domains,
    overall,
    thresholdChangeEligible,
    thresholdChangeIneligibleReason: thresholdChangeEligible ? null : `overall n=${overall.sampleSize} < MIN_SAMPLE ${MIN_SAMPLE} (INSUFFICIENT_SAMPLE)`,
    thresholdReviewCandidate,
  };

  const label = evaluatedAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const projection = {
    projectionId: `projection:calibration:${label}`,
    control: CONTROL,
    generatedAt: evaluatedAt, // deterministic when --now is injected; excluded from digests
    evaluatedAt,
    domains,
    overall,
    thresholdChangeEligible,
    thresholdReviewCandidate,
  };
  const receipt = buildReceipt({ evaluatedAt, inputs: inputDigests, results, violations, warnings, label });

  await mkdir(path.resolve(cwd, outDir), { recursive: true });
  await mkdir(path.resolve(cwd, projectionsDir), { recursive: true });
  const receiptPath = path.join(outDir, `calibration-receipt-${label}.json`);
  const projectionPath = path.join(projectionsDir, `calibration-projection-${label}.json`);
  await writeFile(path.resolve(cwd, receiptPath), canonicalStringify(receipt) + '\n', 'utf8');
  await writeFile(path.resolve(cwd, projectionPath), canonicalStringify(projection) + '\n', 'utf8');

  for (const w of warnings) stdout(`WARN ${w.rule} ${w.record}: ${w.detail}`);
  for (const v of violations) stdout(`FAIL ${v.rule} ${v.record}: ${v.detail}`);
  stdout(`INFO evaluated ${files.length} file(s) at ${evaluatedAt}: ${scored.length} scored, ${unresolved.length} unresolved (excluded, reported), ${excludedNonClean.length} non-clean (excluded), ${violations.length} violation(s), ${warnings.length} warning(s)`);
  stdout(`INFO overall brier=${overall.brierScore} n=${overall.sampleSize} thresholdChangeEligible=${thresholdChangeEligible}`);
  if (thresholdReviewCandidate) stdout(`WARN THRESHOLD_REVIEW_CANDIDATE advisory only: |calibrationDelta|=${thresholdReviewCandidate.absCalibrationDelta} >= ${MISCALIBRATION_DELTA} with n=${overall.sampleSize}; no values proposed`);
  stdout(`INFO receipt ${receiptPath}`);
  stdout(`INFO projection ${projectionPath}`);
  stdout(`DIGEST ${CONTROL_NAME} ${receipt.digest}`);
  return { exitCode: violations.length ? 1 : 0, receipt, projection, receiptPath, projectionPath };
}

function buildReceipt({ evaluatedAt, inputs, results, violations, warnings, label }) {
  const fullResults = { ...results, warnings };
  return {
    receiptId: `receipt:calibration:${label ?? evaluatedAt}`,
    control: CONTROL,
    generatedAt: evaluatedAt, // excluded from digest per SPEC §3
    evaluatedAt,
    inputs,
    results: fullResults,
    violations,
    digest: digest({ results: fullResults, violations }),
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  run(process.argv.slice(2)).then(({ exitCode }) => process.exit(exitCode))
    .catch((err) => { console.error(`FAIL unexpected error: ${err.stack || err.message}`); process.exit(2); });
}
