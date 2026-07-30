// WS7 budget-governor test harness. Contract: docs/strategy-genesis/CONTROLS_SPEC.md §8.
//  1. Compiles knowledge/schema/budget-receipt.schema.json (ajv draft 2020-12) and
//     validates every receipt produced by fixture runs.
//  2. Runs every fixture in knowledge/fixtures/budgets/{positive,negative} through
//     the CLI with fixed --now 2026-07-31T00:00:00Z, honouring the fixture's
//     self-described expectation / expectedRule / expectRules / forbidRules /
//     assert, plus optional configOverride / configRemove (written to a temp
//     config) and priorSpend (prior WS7 receipts written to a temp dir and fed
//     via --prior-spend).
//  3. Asserts input immutability: SHA-256 of every fixture file before == after.
//  4. Runs every fixture TWICE with the same --now, asserts identical receipt
//     digests, writes the canonical receipt for the primary positive fixture
//     into knowledge/receipts/budgets/, and prints "DIGEST budgets <hex>"
//     (digest of the sorted fixtureId->receipt-digest map).
// Exit 0 only if every check holds.

import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { canonicalize, digest, fileDigest } from './lib/canonical-json.mjs';

const NOW = '2026-07-31T00:00:00Z';
const LABEL = '20260731T000000Z';
const FIXTURE_ROOT = 'knowledge/fixtures/budgets';
const SCRIPT = 'scripts/knowledge/enforce-budgets.mjs';
const SCHEMA_PATH = 'knowledge/schema/budget-receipt.schema.json';
const DEFAULT_CONFIG = 'knowledge/config/governance.json';
const CANONICAL_OUT = 'knowledge/receipts/budgets';
const CANONICAL_FIXTURE = 'budgets:pos:within-budget';

const failures = [];
const pass = (msg) => console.log(`PASS ${msg}`);
const fail = (msg) => { failures.push(msg); console.log(`FAIL ${msg}`); };
const info = (msg) => console.log(`INFO ${msg}`);

async function listJson(dir) {
  const out = [];
  for (const name of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) out.push(...await listJson(p));
    else if (name.name.endsWith('.json')) out.push(p);
  }
  return out;
}

function runCli(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: process.cwd(), encoding: 'utf8' });
  return { code: res.status, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

function deepMerge(base, override) {
  if (Array.isArray(override) || typeof override !== 'object' || override === null) return override;
  const out = { ...(base ?? {}) };
  for (const [k, v] of Object.entries(override)) out[k] = deepMerge(base?.[k], v);
  return out;
}

function removePath(obj, dotted) {
  const keys = dotted.split('.');
  let cur = obj;
  for (const k of keys.slice(0, -1)) { cur = cur?.[k]; if (cur == null) return; }
  delete cur[keys.at(-1)];
}

/** Resolve "decisions.<dim>.<field>" / "exhaustion.<dim>.<field>" against a receipt. */
function resolveAssertTarget(receipt, dotted) {
  const [section, ...rest] = dotted.split('.');
  const field = rest.at(-1);
  const dim = rest.slice(0, -1).join('.');
  const list = section === 'decisions' ? receipt.results.decisions
    : section === 'exhaustion' ? receipt.results.exhaustion : null;
  if (!list) return { error: `unknown assert section '${section}'` };
  const entry = list.find((e) => e.dimension === dim);
  if (!entry) return { error: `no ${section} entry for dimension '${dim}'` };
  return { value: entry[field] };
}

function checkAsserts(fid, assert, receipt) {
  for (const [pathExpr, cond] of Object.entries(assert)) {
    const { value, error } = resolveAssertTarget(receipt, pathExpr);
    if (error) { fail(`${fid}: assert ${pathExpr}: ${error}`); continue; }
    const ops = (cond && typeof cond === 'object' && !Array.isArray(cond) && ('eq' in cond || 'ne' in cond || 'gte' in cond || 'lte' in cond)) ? cond : { eq: cond };
    for (const [op, expected] of Object.entries(ops)) {
      const same = JSON.stringify(canonicalize(value)) === JSON.stringify(canonicalize(expected));
      let ok; let desc;
      if (op === 'eq') { ok = same; desc = `eq ${JSON.stringify(expected)}`; }
      else if (op === 'ne') { ok = !same; desc = `ne ${JSON.stringify(expected)}`; }
      else if (op === 'gte') { ok = typeof value === 'number' && value >= expected; desc = `gte ${expected}`; }
      else if (op === 'lte') { ok = typeof value === 'number' && value <= expected; desc = `lte ${expected}`; }
      else { ok = false; desc = `unknown op ${op}`; }
      if (ok) pass(`${fid}: ${pathExpr} ${desc} (got ${JSON.stringify(value)})`);
      else fail(`${fid}: ${pathExpr} expected ${desc}, got ${JSON.stringify(value)}`);
    }
  }
}

async function main() {
  // 0. Compile receipt schema.
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(await readFile(SCHEMA_PATH, 'utf8')));
  pass('schema budget-receipt.schema.json compiled');

  const fixtureFiles = [
    ...await listJson(path.join(FIXTURE_ROOT, 'positive')),
    ...await listJson(path.join(FIXTURE_ROOT, 'negative')),
  ].sort((a, b) => a.localeCompare(b));
  if (fixtureFiles.length === 0) fail(`no fixtures found under ${FIXTURE_ROOT}`);
  const hashesBefore = new Map();
  for (const f of fixtureFiles) hashesBefore.set(f, await fileDigest(f));
  info(`hashed ${fixtureFiles.length} fixture file(s) before run`);

  const tmp = await mkdtemp(path.join(tmpdir(), 'ws7-budgets-'));
  const baseConfig = JSON.parse(await readFile(DEFAULT_CONFIG, 'utf8'));
  const receiptDigests = {};

  for (const file of fixtureFiles) {
    const fixture = JSON.parse(await readFile(file, 'utf8'));
    const fid = fixture.fixtureId ?? path.basename(file);
    for (const key of ['fixtureId', 'description', 'expectation', 'declaration']) {
      if (!(key in fixture)) fail(`${fid}: fixture missing self-describing field '${key}'`);
    }

    // Fixture-specific config + prior-spend setup in tmp.
    const ftmp = path.join(tmp, fid.replaceAll(':', '_'));
    await mkdir(ftmp, { recursive: true });
    let configPath = DEFAULT_CONFIG;
    if (fixture.configOverride || fixture.configRemove) {
      let cfg = structuredClone(baseConfig);
      if (fixture.configOverride) cfg = deepMerge(cfg, fixture.configOverride);
      for (const p of fixture.configRemove ?? []) removePath(cfg, p);
      configPath = path.join(ftmp, 'governance.json');
      await writeFile(configPath, JSON.stringify(cfg, null, 2), 'utf8');
    }
    const cliArgs = ['--input', file, '--now', NOW, '--config', configPath, '--out', path.join(ftmp, 'receipts')];
    if (fixture.priorSpend) {
      const priorDir = path.join(ftmp, 'prior');
      await mkdir(priorDir, { recursive: true });
      for (const [i, prior] of fixture.priorSpend.entries()) {
        await writeFile(path.join(priorDir, `prior-${i}.json`), JSON.stringify(prior, null, 2), 'utf8');
      }
      cliArgs.push('--prior-spend', priorDir);
    }

    // Run TWICE with fixed --now for per-fixture determinism.
    const run1 = runCli(cliArgs);
    const run2 = runCli(cliArgs);
    const receiptPath = path.join(ftmp, 'receipts', `budgets-receipt-${LABEL}.json`);
    let receipt;
    try {
      receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
    } catch (err) {
      fail(`${fid}: cannot read CLI receipt: ${err.message} (exit ${run2.code}; stderr ${run2.stderr.slice(0, 200)})`);
      continue;
    }
    if (run1.code !== run2.code) fail(`${fid}: exit codes differ across runs (${run1.code} vs ${run2.code})`);
    if (!validate(receipt)) fail(`${fid}: receipt failed schema validation: ${JSON.stringify(validate.errors)}`);
    else pass(`${fid}: receipt validates against schema`);

    const d1 = run1.stdout.match(/DIGEST budgets ([0-9a-f]{64})/)?.[1];
    const d2 = run2.stdout.match(/DIGEST budgets ([0-9a-f]{64})/)?.[1];
    if (!d1 || !d2) fail(`${fid}: missing DIGEST line in CLI output`);
    else if (d1 !== d2) fail(`${fid}: non-deterministic digests ${d1} != ${d2}`);
    else if (receipt.digest !== d2) fail(`${fid}: receipt digest ${receipt.digest} != printed DIGEST ${d2}`);
    else pass(`${fid}: deterministic digest across two runs ${d2.slice(0, 12)}...`);
    receiptDigests[fid] = d2;

    const rules = [
      ...receipt.violations.map((v) => v.rule),
      ...receipt.results.decisions.map((d) => d.rule).filter(Boolean),
    ];
    if (fixture.expectation === 'pass') {
      if (run2.code !== 0) fail(`${fid}: expected exit 0, got ${run2.code}: ${run2.stdout.trim().split('\n').slice(0, 3).join(' | ')}`);
      else pass(`${fid}: CLI exited 0`);
      if (receipt.violations.length !== 0) fail(`${fid}: unexpected violations ${JSON.stringify(receipt.violations)}`);
      if (receipt.results.decisions.some((d) => d.verdict !== 'allow')) fail(`${fid}: positive fixture has a non-allow decision`);
    } else if (fixture.expectation === 'fail') {
      if (run2.code !== 1) fail(`${fid}: expected exit 1 for negative fixture, got ${run2.code}`);
      else pass(`${fid}: CLI exited 1 as expected`);
      if (fixture.expectedRule) {
        if (rules.includes(fixture.expectedRule)) pass(`${fid}: named rule ${fixture.expectedRule} fired`);
        else fail(`${fid}: expected rule ${fixture.expectedRule}, got rules ${JSON.stringify(rules)}`);
      }
    } else {
      fail(`${fid}: unsupported expectation '${fixture.expectation}'`);
    }
    for (const r of fixture.expectRules ?? []) {
      if (rules.includes(r)) pass(`${fid}: rule ${r} present (distinguishable)`);
      else fail(`${fid}: expected rule ${r} among ${JSON.stringify(rules)}`);
    }
    for (const r of fixture.forbidRules ?? []) {
      if (rules.includes(r)) fail(`${fid}: forbidden rule ${r} fired`);
      else pass(`${fid}: forbidden rule ${r} absent`);
    }
    // No-silent-excess invariant: consumed never exceeds limit on any decision.
    for (const d of receipt.results.decisions) {
      if (d.limit !== null && d.priorConsumed + d.consumed > d.limit) {
        fail(`${fid}: silent excess on ${d.dimension}: prior ${d.priorConsumed} + consumed ${d.consumed} > limit ${d.limit}`);
      }
    }
    if (fixture.assert) checkAsserts(fid, fixture.assert, receipt);
  }

  // 3. Input immutability.
  for (const [f, before] of hashesBefore) {
    const after = await fileDigest(f);
    if (after === before) pass(`immutable input ${f}`);
    else fail(`input mutated by control run: ${f} (${before} -> ${after})`);
  }

  // 4. Canonical receipt: primary positive fixture into knowledge/receipts/budgets,
  //    run twice, byte-identical, schema-valid, exit 0.
  const canonicalFixture = fixtureFiles.find((f) => f.includes('pos-within-budget'));
  const canonArgs = ['--input', canonicalFixture, '--now', NOW, '--out', CANONICAL_OUT];
  const c1 = runCli(canonArgs);
  const canonPath = path.join(CANONICAL_OUT, `budgets-receipt-${LABEL}.json`);
  const bytes1 = await fileDigest(canonPath);
  const c2 = runCli(canonArgs);
  const bytes2 = await fileDigest(canonPath);
  if (c1.code !== 0 || c2.code !== 0) fail(`canonical fixture run exit codes ${c1.code}/${c2.code}, expected 0`);
  if (bytes1 === bytes2) pass('canonical receipt file bytes stable across repeated runs');
  else fail(`canonical receipt bytes changed across runs: ${bytes1} -> ${bytes2}`);
  const canonReceipt = JSON.parse(await readFile(canonPath, 'utf8'));
  if (!validate(canonReceipt)) fail(`canonical receipt failed schema validation: ${JSON.stringify(validate.errors)}`);
  else pass(`canonical receipt ${canonPath} validates against schema`);

  await rm(tmp, { recursive: true, force: true });
  const suiteDigest = digest(Object.fromEntries(Object.entries(receiptDigests).sort(([a], [b]) => a.localeCompare(b))));
  console.log(`DIGEST budgets ${suiteDigest}`);
  if (failures.length) {
    console.log(`FAIL ${failures.length} check(s) failed`);
    process.exit(1);
  }
  console.log(`PASS all budgets checks passed (${fixtureFiles.length} fixtures)`);
  process.exit(0);
}

main().catch((err) => { console.error(`FAIL harness error: ${err.stack || err.message}`); process.exit(2); });
