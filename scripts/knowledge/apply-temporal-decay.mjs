// WS2 temporal-decay: compute TIME-INDEXED confidence projections for knowledge
// records WITHOUT mutating the source records. Contract:
// docs/strategy-genesis/CONTROLS_SPEC.md and handoff section "B. Temporal decay
// and validity". Policies: knowledge/config/governance.json decayPolicies.
//
// Semantics (binding for WS2):
//  - anchor = record.validFrom if present, else record.capturedAt (UTC ms).
//  - effectiveConfidence = round6(baseConfidence * 0.5^(daysSinceAnchor / halfLifeDays)),
//    floored at 0. baseConfidence is copied, NEVER mutated at source.
//  - expired       = validUntil present && evaluatedAt >  validUntil.
//  - reviewBy      = record.reviewBy if present, else anchor + reviewAfterDays.
//  - reviewRequired= evaluatedAt > reviewBy
//                    OR (termsChangedAt present && termsChangedAt <= evaluatedAt).
//  - OVERRIDES win over mathematical decay, precedence supersededBy > closedAt:
//      supersededBy (string ref)  -> override {type:'superseded', reference}
//      closedAt <= evaluatedAt    -> override {type:'closed', reference: closureRef || closedAt}
//    An override sets effectiveConfidence = 0 (the record no longer carries
//    evidential weight on its own; trust transfers to the override reference or
//    the opportunity is gone), expired = true, reviewRequired = false (supersession
//    / closure is a definitive state change, not a review request), and
//    decayReason = 'superseded-override' | 'closed-override' (never 'half-life-decay').
//  - Unknown evidence class -> 'default' policy + WARN UNKNOWN_EVIDENCE_CLASS.
//    Missing evidence class  -> 'default' policy + WARN MISSING_EVIDENCE_CLASS.
//  - Future-dated records (capturedAt or validFrom AFTER evaluatedAt) FAIL with
//    named rule FUTURE_DATED_RECORD and are excluded from projection entries.
//  - Missing confidence -> MISSING_CONFIDENCE; missing anchor -> MISSING_ANCHOR
//    (fail closed, record excluded).
//
// CLI: node scripts/knowledge/apply-temporal-decay.mjs
//   [--input <file|dir> ...] [--fixtures] [--now <ISO8601>]
//   [--config knowledge/config/governance.json]
//   [--out knowledge/receipts/temporal-decay]
//   [--projections-out knowledge/projections/temporal-decay]
// Exit codes: 0 ok | 1 rule violation(s) reported | 2 usage/IO error.

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, canonicalStringify, fileDigest } from './lib/canonical-json.mjs';

export const CONTROL = 'WS2';
export const CONTROL_NAME = 'temporal-decay';
const MS_PER_DAY = 86400000;

const round6 = (x) => {
  const r = Math.round(x * 1e6) / 1e6;
  return Object.is(r, -0) ? 0 : r;
};

const parseUtcMs = (iso) => {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
};

/** Resolve the decay policy for a record. Returns {policyName, policy, warnings}. */
export function resolvePolicy(record, decayPolicies) {
  const warnings = [];
  const cls = record.evidenceClass ?? record.domain ?? null;
  if (cls == null) {
    warnings.push({ rule: 'MISSING_EVIDENCE_CLASS', record: recordRefOf(record), detail: 'no evidenceClass/domain field; falling back to default policy' });
    return { policyName: 'default', policy: decayPolicies.default, warnings };
  }
  if (Object.hasOwn(decayPolicies, cls)) return { policyName: cls, policy: decayPolicies[cls], warnings };
  warnings.push({ rule: 'UNKNOWN_EVIDENCE_CLASS', record: recordRefOf(record), detail: `evidence class '${cls}' has no decayPolicy; falling back to default policy` });
  return { policyName: 'default', policy: decayPolicies.default, warnings };
}

function recordRefOf(record, fallback = null) {
  return record.id ?? record.observationId ?? record.recordId ?? fallback ?? '(unknown-record)';
}

/**
 * Evaluate one record at `nowMs` against resolved {policyName, policy}.
 * Pure function; never mutates `record`. Returns {entry?, violation?, warnings}.
 */
export function evaluateRecord(record, nowMs, policyName, policy, warnings = []) {
  const recordRef = recordRefOf(record);
  if (typeof record.confidence !== 'number' || record.confidence < 0 || record.confidence > 1) {
    return { violation: { rule: 'MISSING_CONFIDENCE', record: recordRef, detail: 'record has no numeric confidence in [0,1]; excluded from projection' }, warnings };
  }
  const capturedMs = record.capturedAt ? parseUtcMs(record.capturedAt) : null;
  const validFromMs = record.validFrom ? parseUtcMs(record.validFrom) : null;
  if (record.capturedAt && capturedMs === null) {
    return { violation: { rule: 'MISSING_ANCHOR', record: recordRef, detail: `capturedAt '${record.capturedAt}' is not a valid timestamp` }, warnings };
  }
  if (record.validFrom && validFromMs === null) {
    return { violation: { rule: 'MISSING_ANCHOR', record: recordRef, detail: `validFrom '${record.validFrom}' is not a valid timestamp` }, warnings };
  }
  const anchorMs = validFromMs ?? capturedMs;
  if (anchorMs === null) {
    return { violation: { rule: 'MISSING_ANCHOR', record: recordRef, detail: 'record has neither capturedAt nor validFrom; excluded from projection' }, warnings };
  }
  if ((capturedMs !== null && capturedMs > nowMs) || (validFromMs !== null && validFromMs > nowMs)) {
    return { violation: { rule: 'FUTURE_DATED_RECORD', record: recordRef, detail: 'capturedAt/validFrom is after evaluatedAt; future-dated records are rejected' }, warnings };
  }

  const baseConfidence = record.confidence;
  const daysSinceAnchor = round6((nowMs - anchorMs) / MS_PER_DAY);
  const reviewByMs = record.reviewBy ? parseUtcMs(record.reviewBy) : anchorMs + policy.reviewAfterDays * MS_PER_DAY;
  const validUntilMs = record.validUntil ? parseUtcMs(record.validUntil) : null;
  const termsChangedMs = record.termsChangedAt ? parseUtcMs(record.termsChangedAt) : null;
  const closedMs = record.closedAt ? parseUtcMs(record.closedAt) : null;

  // Override resolution: explicit supersession/closure beats mathematical decay.
  let override = null;
  if (typeof record.supersededBy === 'string' && record.supersededBy.length > 0) {
    override = { type: 'superseded', reference: record.supersededBy };
  } else if (closedMs !== null && closedMs <= nowMs) {
    override = { type: 'closed', reference: record.closureRef ?? record.closedAt };
  }

  const reviewReasons = [];
  if (reviewByMs !== null && nowMs > reviewByMs) reviewReasons.push('review-by-elapsed');
  if (termsChangedMs !== null && termsChangedMs <= nowMs) reviewReasons.push('terms-changed');

  let effectiveConfidence; let decayReason; let expired; let reviewRequired;
  if (override) {
    effectiveConfidence = 0;
    decayReason = `${override.type}-override`;
    expired = true;
    reviewRequired = false;
  } else {
    effectiveConfidence = round6(Math.max(0, baseConfidence * Math.pow(0.5, daysSinceAnchor / policy.halfLifeDays)));
    decayReason = 'half-life-decay';
    expired = validUntilMs !== null && nowMs > validUntilMs;
    reviewRequired = reviewReasons.length > 0;
  }

  const entry = {
    recordRef,
    evidenceClass: record.evidenceClass ?? record.domain ?? null,
    baseConfidence,
    effectiveConfidence,
    evaluatedAt: new Date(nowMs).toISOString(),
    validFrom: new Date(anchorMs).toISOString(),
    validUntil: validUntilMs !== null ? new Date(validUntilMs).toISOString() : null,
    reviewBy: reviewByMs !== null ? new Date(reviewByMs).toISOString() : null,
    daysSinceAnchor,
    decayPolicy: policyName,
    decayReason,
    expired,
    reviewRequired,
    reviewReasons,
    override,
    warnings: warnings.map((w) => w.rule),
  };
  return { entry, warnings };
}

async function collectJsonFiles(inputPath, out = []) {
  const stat = await import('node:fs/promises').then((fs) => fs.stat(inputPath));
  if (stat.isDirectory()) {
    const names = (await readdir(inputPath)).sort((a, b) => a.localeCompare(b));
    for (const name of names) await collectJsonFiles(path.join(inputPath, name), out);
  } else if (inputPath.endsWith('.json')) out.push(inputPath);
  return out;
}

function usage(msg) {
  console.error(`FAIL ${msg}`);
  console.error('Usage: node scripts/knowledge/apply-temporal-decay.mjs [--input <file|dir> ...] [--fixtures] [--now <ISO8601>] [--config <path>] [--out <dir>] [--projections-out <dir>]');
  process.exit(2);
}

export async function run(argv, { cwd = process.cwd(), stdout = console.log } = {}) {
  const args = [...argv];
  const inputs = [];
  let fixturesMode = false;
  let nowIso = null;
  let configPath = 'knowledge/config/governance.json';
  let outDir = 'knowledge/receipts/temporal-decay';
  let projectionsDir = 'knowledge/projections/temporal-decay';
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
  if (fixturesMode && inputs.length === 0) inputs.push('knowledge/fixtures/temporal');
  if (inputs.length === 0) inputs.push('knowledge/observations');

  const nowMs = nowIso ? parseUtcMs(nowIso) : Date.now();
  if (nowIso && nowMs === null) usage(`--now '${nowIso}' is not a valid ISO8601 timestamp`);
  const deterministic = nowIso !== null;
  const evaluatedAt = new Date(nowMs).toISOString();

  let governance;
  try {
    governance = JSON.parse(await readFile(path.resolve(cwd, configPath), 'utf8'));
  } catch (err) {
    console.error(`FAIL cannot read config ${configPath}: ${err.message}`);
    return { exitCode: 2 };
  }
  const decayPolicies = governance.decayPolicies;
  if (!decayPolicies || !decayPolicies.default
    || typeof decayPolicies.default.halfLifeDays !== 'number' || decayPolicies.default.halfLifeDays <= 0
    || typeof decayPolicies.default.reviewAfterDays !== 'number' || decayPolicies.default.reviewAfterDays < 0) {
    const violation = { rule: 'MISSING_DECAY_POLICY_CONFIG', record: configPath, detail: 'governance.json lacks a usable decayPolicies.default {halfLifeDays>0, reviewAfterDays>=0}; failing closed' };
    stdout(`FAIL ${violation.rule}: ${violation.detail}`);
    const receipt = buildReceipt({ evaluatedAt, deterministic, inputs: [], entries: [], violations: [violation], warnings: [] });
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

  const entries = []; const violations = []; const warnings = []; const inputDigests = [];
  for (const file of files) {
    const rel = path.relative(cwd, file);
    let parsed;
    let raw;
    try {
      raw = await readFile(file);
      parsed = JSON.parse(raw.toString('utf8'));
    } catch (err) {
      violations.push({ rule: 'INVALID_INPUT_FILE', record: rel, detail: `cannot parse JSON: ${err.message}` });
      continue;
    }
    inputDigests.push({ path: rel, sha256: await fileDigest(file) });
    // Fixture-wrapped files carry the record under .record; canonical dirs hold raw records.
    const record = (parsed && typeof parsed === 'object' && parsed.record && parsed.fixtureId) ? parsed.record : parsed;
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      violations.push({ rule: 'INVALID_INPUT_FILE', record: rel, detail: 'file does not contain a knowledge record object' });
      continue;
    }
    const { policyName, policy, warnings: policyWarnings } = resolvePolicy(record, decayPolicies);
    const result = evaluateRecord(record, nowMs, policyName, policy, policyWarnings);
    warnings.push(...result.warnings);
    if (result.violation) violations.push(result.violation);
    else entries.push({ ...result.entry, sourceFile: rel });
  }
  entries.sort((a, b) => a.recordRef.localeCompare(b.recordRef));
  violations.sort((a, b) => (a.record + a.rule).localeCompare(b.record + b.rule));
  warnings.sort((a, b) => (a.record + a.rule).localeCompare(b.record + b.rule));

  const label = evaluatedAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const projection = {
    projectionId: `projection:temporal-decay:${label}`,
    control: CONTROL,
    generatedAt: evaluatedAt, // deterministic when --now is injected; excluded from digests
    evaluatedAt,
    entries,
  };
  const receipt = buildReceipt({ evaluatedAt, deterministic, inputs: inputDigests, entries, violations, warnings, label });

  await mkdir(path.resolve(cwd, outDir), { recursive: true });
  await mkdir(path.resolve(cwd, projectionsDir), { recursive: true });
  const receiptPath = path.join(outDir, `temporal-decay-receipt-${label}.json`);
  const projectionPath = path.join(projectionsDir, `temporal-projection-${label}.json`);
  await writeFile(path.resolve(cwd, receiptPath), canonicalStringify(receipt) + '\n', 'utf8');
  await writeFile(path.resolve(cwd, projectionPath), canonicalStringify(projection) + '\n', 'utf8');

  for (const w of warnings) stdout(`WARN ${w.rule} ${w.record}: ${w.detail}`);
  for (const v of violations) stdout(`FAIL ${v.rule} ${v.record}: ${v.detail}`);
  stdout(`INFO evaluated ${files.length} file(s) at ${evaluatedAt}: ${entries.length} projection entries, ${violations.length} violation(s), ${warnings.length} warning(s)`);
  stdout(`INFO receipt ${receiptPath}`);
  stdout(`INFO projection ${projectionPath}`);
  stdout(`DIGEST ${CONTROL_NAME} ${receipt.digest}`);
  return { exitCode: violations.length ? 1 : 0, receipt, projection, receiptPath, projectionPath };
}

function buildReceipt({ evaluatedAt, inputs, entries, violations, warnings, label }) {
  const results = {
    projectionEntries: entries,
    entryCount: entries.length,
    expiredCount: entries.filter((e) => e.expired).length,
    reviewRequiredCount: entries.filter((e) => e.reviewRequired).length,
    overrideCount: entries.filter((e) => e.override).length,
    warnings,
  };
  return {
    receiptId: `receipt:temporal-decay:${label ?? evaluatedAt}`,
    control: CONTROL,
    generatedAt: evaluatedAt, // excluded from digest per SPEC §3
    evaluatedAt,
    inputs,
    results,
    violations,
    digest: digest({ results, violations }),
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  run(process.argv.slice(2)).then(({ exitCode }) => process.exit(exitCode))
    .catch((err) => { console.error(`FAIL unexpected error: ${err.stack || err.message}`); process.exit(2); });
}
