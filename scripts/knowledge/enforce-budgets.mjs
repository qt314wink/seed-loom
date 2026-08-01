// WS7 budget-governor: machine-enforced runtime/source/network/storage/experiment/
// spend ceilings for pipeline-run usage declarations. Contract:
// docs/strategy-genesis/CONTROLS_SPEC.md and handoff section
// "G. Machine-enforced budgets". Authoritative budgets:
// knowledge/config/governance.json (`budgets` block + `automation` block).
//
// Semantics (binding for WS7):
//  - Input: one usage declaration JSON (fixture-wrapped files carry it under
//    .declaration). Numeric request fields, WHEN PRESENT, must be finite numbers
//    > 0; zero/negative/non-numeric -> MALFORMED_DECLARATION, the whole
//    declaration is rejected and NO budget is consumed (fail closed).
//  - Ceilings (from --config, default knowledge/config/governance.json):
//      daily:    sources, networkCalls, runtimeSeconds, ingestedNodes,
//                retainedArtifactBytes, telemetryBytes  -> research-collection
//                dimensions; on exceed the run completes PARTIALLY up to the
//                ceiling (verdict 'partial', BUDGET-EXHAUSTION entry). A ceiling
//                is never silently exceeded.
//      weekly:   weeklyExperimentCost (sum of experiments[].costUsd) and
//                concurrentExperiments (count of experiments[].concurrent=true).
//                Over-budget experiments are DENIED in declaration order
//                (greedy grant until the next experiment would break the ceiling).
//      monthly:  externalServiceSpend = externalServiceSpendUsd + sum of granted
//                spendAuthorization costUsd. On exceed -> DENIED (money is never
//                partially spent by this control).
//  - UNKNOWN SPEND FAILS CLOSED: a spendAuthorization without a finite costUsd
//    >= 0 is denied with named rule UNKNOWN_SPEND.
//  - SPEND DISABLED: when governance automation.maySpendMoney is false, every
//    spend-authorizing transition (each spendAuthorization, and
//    externalServiceSpendUsd itself) is denied with named rule SPEND_DISABLED,
//    declared or not. UNKNOWN_SPEND is still emitted as its own decision so the
//    two rules remain distinguishable in the receipt.
//  - Prior consumption: --prior-spend <file|dir> (repeatable) reads prior WS7
//    budget receipts and accumulates their per-dimension `consumed` into
//    priorConsumed for the weekly and monthly windows (weeklyExperimentCost,
//    externalServiceSpend). This catches usage split across multiple
//    declarations to dodge a weekly/monthly ceiling. BOUNDARY: daily-window
//    dimensions are per-cycle and are NOT accumulated across declarations.
//  - Determinism: no wall-clock in evaluation. Evaluation instant comes from
//    --now (mandatory in fixture/test mode) or the declaration's runLabel; when
//    --now is absent the receipt generatedAt uses the real clock but is excluded
//    from the digest (SPEC §3).
//
// CLI: node scripts/knowledge/enforce-budgets.mjs
//   --input <declaration.json> [--prior-spend <file|dir> ...]
//   [--now <ISO8601>] [--config knowledge/config/governance.json]
//   [--out knowledge/receipts/budgets]
// Exit codes: 0 all decisions allow | 1 a ceiling was hit / denial / malformed /
//   missing config (reported with named rule) | 2 usage/IO error.

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, canonicalStringify, fileDigest } from './lib/canonical-json.mjs';

export const CONTROL = 'WS7';
export const CONTROL_NAME = 'budgets';

/** dimension -> {config path, window, kind} kind: partial=research collection, deny=money/experiments */
export const DIMENSIONS = {
  sources:               { path: ['budgets', 'daily', 'maxSources'],               window: 'daily',   kind: 'partial', rule: 'DAILY_SOURCE_CEILING' },
  networkCalls:          { path: ['budgets', 'daily', 'maxNetworkCalls'],          window: 'daily',   kind: 'partial', rule: 'DAILY_NETWORK_CALL_CEILING' },
  runtimeSeconds:        { path: ['budgets', 'daily', 'maxRuntimeSeconds'],        window: 'daily',   kind: 'partial', rule: 'DAILY_RUNTIME_CEILING' },
  ingestedNodes:         { path: ['budgets', 'daily', 'maxIngestedNodes'],         window: 'daily',   kind: 'partial', rule: 'DAILY_INGESTED_NODES_CEILING' },
  retainedArtifactBytes: { path: ['budgets', 'daily', 'maxRetainedArtifactBytes'], window: 'daily',   kind: 'partial', rule: 'DAILY_RETAINED_ARTIFACT_CEILING' },
  telemetryBytes:        { path: ['budgets', 'daily', 'maxTelemetryBytes'],        window: 'daily',   kind: 'partial', rule: 'DAILY_TELEMETRY_CEILING' },
  weeklyExperimentCost:  { path: ['budgets', 'weekly', 'maxExperimentBudgetUsd'],  window: 'weekly',  kind: 'deny',    rule: 'WEEKLY_EXPERIMENT_COST_CEILING' },
  concurrentExperiments: { path: ['budgets', 'weekly', 'maxConcurrentExperiments'],window: 'weekly',  kind: 'deny',    rule: 'CONCURRENT_EXPERIMENT_CEILING' },
  externalServiceSpend:  { path: ['budgets', 'monthly', 'maxExternalServiceSpendUsd'], window: 'monthly', kind: 'deny', rule: 'MONTHLY_EXTERNAL_SPEND_CEILING' },
};

/** declaration field -> dimension */
const REQUEST_FIELD = {
  sources: 'sourcesRequested',
  networkCalls: 'networkCallsRequested',
  runtimeSeconds: 'runtimeSeconds',
  retainedArtifactBytes: 'retainedArtifactBytes',
  telemetryBytes: 'telemetryBytes',
  ingestedNodes: 'ingestedNodes',
  externalServiceSpend: 'externalServiceSpendUsd',
};

const isPos = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const isNonNeg = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Validate declaration shape. Returns violation or null. Pure. */
export function validateDeclaration(decl) {
  const rec = decl.runLabel ?? '(unnamed-run)';
  if (!decl || typeof decl !== 'object' || Array.isArray(decl)) {
    return { rule: 'MALFORMED_DECLARATION', record: rec, detail: 'usage declaration is not a JSON object' };
  }
  for (const field of Object.values(REQUEST_FIELD)) {
    if (field in decl && !isPos(decl[field])) {
      return { rule: 'MALFORMED_DECLARATION', record: rec, detail: `field '${field}' must be a finite number > 0 when present, got ${JSON.stringify(decl[field])}` };
    }
  }
  if ('experiments' in decl) {
    if (!Array.isArray(decl.experiments)) {
      return { rule: 'MALFORMED_DECLARATION', record: rec, detail: "field 'experiments' must be an array" };
    }
    for (const [i, e] of decl.experiments.entries()) {
      if (!e || typeof e !== 'object' || typeof e.id !== 'string' || e.id.length === 0
        || !isPos(e.costUsd) || typeof e.concurrent !== 'boolean') {
        return { rule: 'MALFORMED_DECLARATION', record: rec, detail: `experiments[${i}] must be {id: non-empty string, costUsd: number > 0, concurrent: boolean}` };
      }
    }
  }
  if ('spendAuthorizations' in decl) {
    if (!Array.isArray(decl.spendAuthorizations)) {
      return { rule: 'MALFORMED_DECLARATION', record: rec, detail: "field 'spendAuthorizations' must be an array" };
    }
    for (const [i, s] of decl.spendAuthorizations.entries()) {
      if (!s || typeof s !== 'object' || typeof s.id !== 'string' || s.id.length === 0) {
        return { rule: 'MALFORMED_DECLARATION', record: rec, detail: `spendAuthorizations[${i}] must be an object with a non-empty string id` };
      }
    }
  }
  return null;
}

/** Resolve required budget config. Returns {limits, maySpendMoney, violation?}. */
export function resolveBudgetConfig(governance, configPath) {
  const limits = {};
  for (const [dim, spec] of Object.entries(DIMENSIONS)) {
    let v = governance;
    for (const key of spec.path) v = v?.[key];
    if (!isPos(v)) {
      return { violation: { rule: 'MISSING_BUDGET_CONFIG', record: configPath, detail: `governance config lacks a usable ${spec.path.join('.')} (finite number > 0); failing closed` } };
    }
    limits[dim] = v;
  }
  const maySpendMoney = governance?.automation?.maySpendMoney;
  if (typeof maySpendMoney !== 'boolean') {
    return { violation: { rule: 'MISSING_BUDGET_CONFIG', record: configPath, detail: 'governance config lacks automation.maySpendMoney (boolean); failing closed' } };
  }
  return { limits, maySpendMoney };
}

/**
 * Evaluate one declaration against limits. Pure function; never mutates inputs.
 * Returns {decisions, exhaustion, violations}.
 */
export function evaluateDeclaration(decl, { limits, maySpendMoney, priorConsumed = {} }) {
  const rec = decl.runLabel ?? '(unnamed-run)';
  const decisions = [];
  const exhaustion = [];
  const violations = [];
  const prior = (dim) => priorConsumed[dim] ?? 0;

  // 1. Research-collection daily dimensions: allow | partial up to ceiling.
  for (const dim of ['sources', 'networkCalls', 'runtimeSeconds', 'ingestedNodes', 'retainedArtifactBytes', 'telemetryBytes']) {
    const field = REQUEST_FIELD[dim];
    if (!(field in decl)) continue; // dimension not requested by this run
    const requested = decl[field];
    const limit = limits[dim];
    const spec = DIMENSIONS[dim];
    if (requested <= limit) {
      decisions.push({ dimension: dim, window: spec.window, limit, requested, priorConsumed: 0, consumed: requested, remaining: limit - requested, verdict: 'allow', rule: null });
    } else {
      const granted = limit;
      decisions.push({ dimension: dim, window: spec.window, limit, requested, priorConsumed: 0, consumed: granted, remaining: 0, verdict: 'partial', rule: spec.rule });
      exhaustion.push({ dimension: dim, window: spec.window, limit, requested, granted, dropped: requested - granted, rule: spec.rule });
      violations.push({ rule: spec.rule, record: rec, detail: `${dim} requested ${requested} exceeds ${spec.window} ceiling ${limit}; run completes partially up to ${granted}, ${requested - granted} dropped (no silent excess)` });
    }
  }

  // 2. Experiments: weekly cost ceiling (greedy grant in declaration order) and
  //    concurrent ceiling.
  const experiments = decl.experiments ?? [];
  if (experiments.length > 0) {
    const costLimit = limits.weeklyExperimentCost;
    const costPrior = prior('weeklyExperimentCost');
    const requestedCost = experiments.reduce((s, e) => s + e.costUsd, 0);
    let grantedCost = 0;
    const deniedByCost = [];
    for (const e of experiments) {
      if (costPrior + grantedCost + e.costUsd <= costLimit) grantedCost += e.costUsd;
      else deniedByCost.push(e.id);
    }
    const costRemaining = costLimit - costPrior - grantedCost;
    if (deniedByCost.length === 0) {
      decisions.push({ dimension: 'weeklyExperimentCost', window: 'weekly', limit: costLimit, requested: requestedCost, priorConsumed: costPrior, consumed: grantedCost, remaining: costRemaining, verdict: 'allow', rule: null });
    } else {
      const verdict = grantedCost > 0 ? 'partial' : 'deny';
      decisions.push({ dimension: 'weeklyExperimentCost', window: 'weekly', limit: costLimit, requested: requestedCost, priorConsumed: costPrior, consumed: grantedCost, remaining: costRemaining, verdict, rule: 'WEEKLY_EXPERIMENT_COST_CEILING' });
      exhaustion.push({ dimension: 'weeklyExperimentCost', window: 'weekly', limit: costLimit, requested: requestedCost, granted: grantedCost, dropped: requestedCost - grantedCost, rule: 'WEEKLY_EXPERIMENT_COST_CEILING', deniedExperiments: deniedByCost });
      violations.push({ rule: 'WEEKLY_EXPERIMENT_COST_CEILING', record: rec, detail: `weekly experiment cost ${requestedCost} USD (+ prior ${costPrior}) exceeds ceiling ${costLimit}; denied experiments: ${deniedByCost.join(', ')}` });
    }

    const concurrent = experiments.filter((e) => e.concurrent);
    if (concurrent.length > 0) {
      const concLimit = limits.concurrentExperiments;
      const grantedConc = concurrent.slice(0, concLimit).map((e) => e.id);
      const deniedConc = concurrent.slice(concLimit).map((e) => e.id);
      if (deniedConc.length === 0) {
        decisions.push({ dimension: 'concurrentExperiments', window: 'weekly', limit: concLimit, requested: concurrent.length, priorConsumed: 0, consumed: concurrent.length, remaining: concLimit - concurrent.length, verdict: 'allow', rule: null });
      } else {
        decisions.push({ dimension: 'concurrentExperiments', window: 'weekly', limit: concLimit, requested: concurrent.length, priorConsumed: 0, consumed: grantedConc.length, remaining: 0, verdict: 'partial', rule: 'CONCURRENT_EXPERIMENT_CEILING' });
        exhaustion.push({ dimension: 'concurrentExperiments', window: 'weekly', limit: concLimit, requested: concurrent.length, granted: grantedConc.length, dropped: deniedConc.length, rule: 'CONCURRENT_EXPERIMENT_CEILING', deniedExperiments: deniedConc });
        violations.push({ rule: 'CONCURRENT_EXPERIMENT_CEILING', record: rec, detail: `${concurrent.length} concurrent experiments exceed ceiling ${concLimit}; denied: ${deniedConc.join(', ')}` });
      }
    }
  }

  // 3. Spend-authorizing transitions: UNKNOWN_SPEND fails closed; SPEND_DISABLED
  //    when automation.maySpendMoney is false. Both rules stay distinguishable.
  const authorizations = decl.spendAuthorizations ?? [];
  const grantedAuthCost = [];
  for (const s of authorizations) {
    const dimName = `spendAuthorization:${s.id}`;
    const knownCost = 'costUsd' in s && isNonNeg(s.costUsd);
    if (!knownCost) {
      decisions.push({ dimension: dimName, window: 'monthly', limit: null, requested: null, priorConsumed: 0, consumed: 0, remaining: null, verdict: 'deny', rule: 'UNKNOWN_SPEND' });
      violations.push({ rule: 'UNKNOWN_SPEND', record: rec, detail: `spend authorization '${s.id}' has no declared, classifiable costUsd; spend-authorizing transitions fail closed` });
    }
    if (!maySpendMoney) {
      decisions.push({ dimension: dimName, window: 'monthly', limit: null, requested: knownCost ? s.costUsd : null, priorConsumed: 0, consumed: 0, remaining: null, verdict: 'deny', rule: 'SPEND_DISABLED' });
      violations.push({ rule: 'SPEND_DISABLED', record: rec, detail: `spend authorization '${s.id}' denied: governance automation.maySpendMoney is false` });
    } else if (knownCost) {
      decisions.push({ dimension: dimName, window: 'monthly', limit: null, requested: s.costUsd, priorConsumed: 0, consumed: s.costUsd, remaining: null, verdict: 'allow', rule: null });
      grantedAuthCost.push(s.costUsd);
    }
  }

  // 4. Monthly external service spend ceiling (accumulates prior receipts).
  const declaredExternal = 'externalServiceSpendUsd' in decl ? decl.externalServiceSpendUsd : 0;
  const requestedExternal = declaredExternal + grantedAuthCost.reduce((s, c) => s + c, 0);
  if (requestedExternal > 0) {
    const extLimit = limits.externalServiceSpend;
    const extPrior = prior('externalServiceSpend');
    if (!maySpendMoney) {
      decisions.push({ dimension: 'externalServiceSpend', window: 'monthly', limit: extLimit, requested: requestedExternal, priorConsumed: extPrior, consumed: 0, remaining: extLimit - extPrior, verdict: 'deny', rule: 'SPEND_DISABLED' });
      violations.push({ rule: 'SPEND_DISABLED', record: rec, detail: `external service spend of ${requestedExternal} USD denied: governance automation.maySpendMoney is false` });
    } else if (extPrior + requestedExternal <= extLimit) {
      decisions.push({ dimension: 'externalServiceSpend', window: 'monthly', limit: extLimit, requested: requestedExternal, priorConsumed: extPrior, consumed: requestedExternal, remaining: extLimit - extPrior - requestedExternal, verdict: 'allow', rule: null });
    } else {
      decisions.push({ dimension: 'externalServiceSpend', window: 'monthly', limit: extLimit, requested: requestedExternal, priorConsumed: extPrior, consumed: 0, remaining: Math.max(0, extLimit - extPrior), verdict: 'deny', rule: 'MONTHLY_EXTERNAL_SPEND_CEILING' });
      exhaustion.push({ dimension: 'externalServiceSpend', window: 'monthly', limit: extLimit, requested: requestedExternal, granted: 0, dropped: requestedExternal, rule: 'MONTHLY_EXTERNAL_SPEND_CEILING' });
      violations.push({ rule: 'MONTHLY_EXTERNAL_SPEND_CEILING', record: rec, detail: `external service spend ${requestedExternal} USD (+ prior ${extPrior}) exceeds monthly ceiling ${extLimit}; spend denied, money is never partially spent` });
    }
  }

  return { decisions, exhaustion, violations };
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
  console.error('Usage: node scripts/knowledge/enforce-budgets.mjs --input <declaration.json> [--prior-spend <file|dir> ...] [--now <ISO8601>] [--config <path>] [--out <dir>]');
  process.exit(2);
}

function buildReceipt({ label, generatedAt, runLabel, inputs, decisions, exhaustion, violations }) {
  const results = {
    runLabel,
    decisions,
    exhaustion,
    consumedBudget: Object.fromEntries(decisions.filter((d) => d.consumed > 0 || d.verdict !== 'allow').map((d) => [d.dimension, d.consumed])),
    remainingBudget: Object.fromEntries(decisions.filter((d) => d.remaining !== null).map((d) => [d.dimension, d.remaining])),
    exhaustionCount: exhaustion.length,
    denialCount: decisions.filter((d) => d.verdict === 'deny').length,
  };
  return {
    receiptId: `receipt:budgets:${label}`,
    control: CONTROL,
    generatedAt, // excluded from digest per SPEC §3
    inputs,
    results,
    violations,
    digest: digest({ results, violations }),
  };
}

export async function run(argv, { cwd = process.cwd(), stdout = console.log } = {}) {
  const args = [...argv];
  let input = null;
  const priorSpendPaths = [];
  let nowIso = null;
  let configPath = 'knowledge/config/governance.json';
  let outDir = 'knowledge/receipts/budgets';
  while (args.length) {
    const a = args.shift();
    if (a === '--input') { if (!args.length) usage('--input requires a value'); input = args.shift(); }
    else if (a === '--prior-spend') { if (!args.length) usage('--prior-spend requires a value'); priorSpendPaths.push(args.shift()); }
    else if (a === '--now') { if (!args.length) usage('--now requires a value'); nowIso = args.shift(); }
    else if (a === '--config') { if (!args.length) usage('--config requires a value'); configPath = args.shift(); }
    else if (a === '--out') { if (!args.length) usage('--out requires a value'); outDir = args.shift(); }
    else usage(`unknown argument: ${a}`);
  }
  if (!input) usage('--input <declaration.json> is required');

  let nowMs = null;
  if (nowIso) {
    nowMs = Date.parse(nowIso);
    if (Number.isNaN(nowMs)) usage(`--now '${nowIso}' is not a valid ISO8601 timestamp`);
  }
  const generatedAt = nowMs !== null ? new Date(nowMs).toISOString() : new Date().toISOString();
  const label = generatedAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  const inputDigests = [];
  // Prior receipts -> accumulated consumed per weekly/monthly dimension.
  const priorConsumed = {};
  let priorFiles = [];
  try {
    for (const p of priorSpendPaths) priorFiles.push(...await collectJsonFiles(path.resolve(cwd, p)));
  } catch (err) {
    console.error(`FAIL cannot read --prior-spend input: ${err.message}`);
    return { exitCode: 2 };
  }
  priorFiles = [...new Set(priorFiles)].sort((a, b) => a.localeCompare(b));
  for (const file of priorFiles) {
    const rel = path.relative(cwd, file);
    let prior;
    try {
      prior = JSON.parse(await readFile(file, 'utf8'));
    } catch (err) {
      console.error(`FAIL cannot parse prior receipt ${rel}: ${err.message}`);
      return { exitCode: 2 };
    }
    inputDigests.push({ path: rel, sha256: await fileDigest(file) });
    if (prior?.control !== CONTROL || !Array.isArray(prior?.results?.decisions)) {
      stdout(`WARN PRIOR_RECEIPT_IGNORED ${rel}: not a WS7 budget receipt; skipped`);
      continue;
    }
    for (const d of prior.results.decisions) {
      if ((d.dimension === 'externalServiceSpend' || d.dimension === 'weeklyExperimentCost') && isNonNeg(d.consumed)) {
        priorConsumed[d.dimension] = (priorConsumed[d.dimension] ?? 0) + d.consumed;
      }
    }
  }

  // Declaration input.
  const inputAbs = path.resolve(cwd, input);
  let parsed;
  try {
    parsed = JSON.parse(await readFile(inputAbs, 'utf8'));
  } catch (err) {
    console.error(`FAIL cannot read/parse declaration ${input}: ${err.message}`);
    return { exitCode: 2 };
  }
  inputDigests.push({ path: path.relative(cwd, inputAbs), sha256: await fileDigest(inputAbs) });
  // Fixture-wrapped files carry the declaration under .declaration.
  const decl = (parsed && typeof parsed === 'object' && parsed.declaration && parsed.fixtureId) ? parsed.declaration : parsed;
  const runLabel = decl?.runLabel ?? parsed?.fixtureId ?? '(unnamed-run)';

  // Governance config (fail closed on missing keys).
  let governance;
  try {
    governance = JSON.parse(await readFile(path.resolve(cwd, configPath), 'utf8'));
  } catch (err) {
    console.error(`FAIL cannot read config ${configPath}: ${err.message}`);
    return { exitCode: 2 };
  }
  // Repo-relative config reference keeps digest payloads free of absolute paths
  // (SPEC §3); out-of-tree configs (e.g. harness temp configs) use the basename.
  const relConfig = path.relative(cwd, path.resolve(cwd, configPath));
  const configRef = relConfig.startsWith('..') ? path.basename(configPath) : relConfig;
  const cfg = resolveBudgetConfig(governance, configRef);

  let decisions = []; let exhaustion = []; let violations = [];
  if (cfg.violation) {
    violations.push(cfg.violation);
  } else {
    const malformed = validateDeclaration(decl);
    if (malformed) {
      violations.push(malformed);
    } else {
      ({ decisions, exhaustion, violations } = evaluateDeclaration(decl, { limits: cfg.limits, maySpendMoney: cfg.maySpendMoney, priorConsumed }));
    }
  }

  const receipt = buildReceipt({ label, generatedAt, runLabel, inputs: inputDigests, decisions, exhaustion, violations });
  await mkdir(path.resolve(cwd, outDir), { recursive: true });
  const receiptPath = path.join(outDir, `budgets-receipt-${label}.json`);
  await writeFile(path.resolve(cwd, receiptPath), canonicalStringify(receipt) + '\n', 'utf8');

  for (const d of decisions) {
    const tag = d.verdict === 'allow' ? 'INFO' : 'FAIL';
    stdout(`${tag} decision ${d.dimension}: verdict=${d.verdict} requested=${d.requested} consumed=${d.consumed} remaining=${d.remaining}${d.rule ? ` rule=${d.rule}` : ''}`);
  }
  for (const e of exhaustion) stdout(`FAIL BUDGET-EXHAUSTION ${e.dimension}: granted ${e.granted} of ${e.requested} (rule=${e.rule})`);
  for (const v of violations) stdout(`FAIL ${v.rule} ${v.record}: ${v.detail}`);
  if (violations.length === 0) stdout(`INFO all ${decisions.length} budget decision(s) allow for ${runLabel}`);
  stdout(`INFO receipt ${receiptPath}`);
  stdout(`DIGEST ${CONTROL_NAME} ${receipt.digest}`);
  return { exitCode: violations.length ? 1 : 0, receipt, receiptPath };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  run(process.argv.slice(2)).then(({ exitCode }) => process.exit(exitCode))
    .catch((err) => { console.error(`FAIL unexpected error: ${err.stack || err.message}`); process.exit(2); });
}
