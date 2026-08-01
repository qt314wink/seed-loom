// WS6 confidence-calibration test harness. Contract: docs/strategy-genesis/CONTROLS_SPEC.md §8.
//  1. ajv-validates the calibration-event schema against every fixture event.
//  2. Runs every fixture in knowledge/fixtures/calibration/{positive,negative}
//     through the CLI with fixed --now 2026-07-31T00:00:00Z and checks each
//     fixture's self-described expectation / expectedRule / expectedWarnings /
//     assert (dotted paths into receipt.results).
//  3. Asserts HAND-COMPUTED Brier scores (constants below, arithmetic in comments).
//  4. Asserts governance-file immutability (SHA-256 of
//     knowledge/config/governance.json before == after every run) and fixture
//     input immutability.
//  5. Runs the full fixture suite TWICE with the same --now, asserts identical
//     receipt digests, and prints "DIGEST calibration <hex>".
// Exit 0 only if every check holds.

import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { canonicalize, digest, fileDigest } from './lib/canonical-json.mjs';

const NOW = '2026-07-31T00:00:00Z';
const LABEL = '20260731T000000Z';
const FIXTURE_ROOT = 'knowledge/fixtures/calibration';
const SCRIPT = 'scripts/knowledge/calibrate-confidence.mjs';
const SCHEMA_PATH = 'knowledge/schema/calibration-event.schema.json';
const GOVERNANCE_PATH = 'knowledge/config/governance.json';

// Hand-computed Brier scores (binary rule (p-o)^2):
//  pos-binary-brier-hand-computed: (0.01 + 0.49 + 0.16 + 0.04) / 4 = 0.175
//  pos-unresolved-reported:        (0.04 + 0.36) / 2 = 0.2 (unresolved excluded)
//  pos-domain-separation:          pricing (0.01+0.04)/2 = 0.025, model-capability (0.25+0.25)/2 = 0.25, overall 0.55/4 = 0.1375
//  pos-ambiguous-excluded:         only the clean event scores: 0.01
//  pos-sufficient-sample:          30 x 0.09 -> 0.09
//  neg-small-sample-perfect:       5 x 0 -> 0
const HAND_COMPUTED_BRIER = {
  'calibration:pos:binary-brier-hand-computed': 0.175,
  'calibration:pos:unresolved-reported': 0.2,
  'calibration:pos:domain-separation': 0.1375,
  'calibration:pos:ambiguous-excluded': 0.01,
  'calibration:pos:sufficient-sample-threshold-candidate': 0.09,
  'calibration:neg:small-sample-perfect': 0,
};

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

function getPath(obj, dotted) {
  return dotted.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function checkAssert(fixtureId, assert, results) {
  for (const [field, cond] of Object.entries(assert)) {
    const actual = getPath(results, field);
    const ops = (cond && typeof cond === 'object' && !Array.isArray(cond) && ('eq' in cond || 'gte' in cond || 'lte' in cond || 'ne' in cond)) ? cond : { eq: cond };
    for (const [op, expected] of Object.entries(ops)) {
      const same = JSON.stringify(canonicalize(actual)) === JSON.stringify(canonicalize(expected));
      let ok; let desc;
      if (op === 'eq') { ok = same; desc = `eq ${JSON.stringify(expected)}`; }
      else if (op === 'ne') { ok = !same; desc = `ne ${JSON.stringify(expected)}`; }
      else if (op === 'gte') { ok = typeof actual === 'number' && actual >= expected; desc = `gte ${expected}`; }
      else if (op === 'lte') { ok = typeof actual === 'number' && actual <= expected; desc = `lte ${expected}`; }
      else { ok = false; desc = `unknown op ${op}`; }
      if (ok) pass(`${fixtureId}: results.${field} ${desc} (got ${JSON.stringify(actual)})`);
      else fail(`${fixtureId}: results.${field} expected ${desc}, got ${JSON.stringify(actual)}`);
    }
  }
}

async function main() {
  // 0. Compile event schema.
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  const schema = JSON.parse(await readFile(SCHEMA_PATH, 'utf8'));
  const validateEvent = ajv.compile(schema);
  pass('schema calibration-event.schema.json compiled');

  // 1. Hash all fixture inputs AND governance.json BEFORE any run.
  const fixtureFiles = await listJson(FIXTURE_ROOT);
  if (fixtureFiles.length === 0) { fail(`no fixtures found under ${FIXTURE_ROOT}`); }
  const hashesBefore = new Map();
  for (const f of fixtureFiles) hashesBefore.set(f, await fileDigest(f));
  const governanceBefore = await fileDigest(GOVERNANCE_PATH);
  info(`hashed ${fixtureFiles.length} fixture file(s) + governance.json before run`);

  const tmp = await mkdtemp(path.join(tmpdir(), 'ws6-calibration-'));

  // 2. Per-fixture CLI runs.
  for (const file of fixtureFiles) {
    const fixture = JSON.parse(await readFile(file, 'utf8'));
    const fid = fixture.fixtureId ?? path.basename(file);
    for (const key of ['fixtureId', 'description', 'expectation']) {
      if (!(key in fixture)) fail(`${fid}: fixture missing self-describing field '${key}'`);
    }
    // 2a. Every fixture event must validate against the calibration-event schema
    //     (cross-field/binary rules are the control's job, not the schema's).
    const events = Array.isArray(fixture.events) ? fixture.events : [fixture.event];
    for (const ev of events) {
      if (validateEvent(ev)) pass(`${fid}: event ${ev.predictionId} validates against schema`);
      else fail(`${fid}: event ${ev.predictionId} failed schema validation: ${JSON.stringify(validateEvent.errors)}`);
    }

    const outDir = path.join(tmp, fid, 'receipts');
    const projDir = path.join(tmp, fid, 'projections');
    const { code, stdout, stderr } = runCli(['--input', file, '--now', NOW, '--out', outDir, '--projections-out', projDir]);
    if (stderr.trim()) fail(`${fid}: CLI wrote to stderr: ${stderr.trim().slice(0, 300)}`);
    let receipt;
    try {
      receipt = JSON.parse(await readFile(path.join(outDir, `calibration-receipt-${LABEL}.json`), 'utf8'));
    } catch (err) {
      fail(`${fid}: cannot read CLI receipt: ${err.message}`);
      continue;
    }
    // Receipt shape + digest self-consistency (SPEC §2/§3).
    if (receipt.control !== 'WS6') fail(`${fid}: receipt.control ${receipt.control} != WS6`);
    if (!/^receipt:calibration:/.test(receipt.receiptId ?? '')) fail(`${fid}: bad receiptId ${receipt.receiptId}`);
    if (receipt.digest !== digest({ results: receipt.results, violations: receipt.violations })) {
      fail(`${fid}: receipt digest is not sha256 of canonical {results, violations}`);
    }
    if (!new RegExp(`DIGEST calibration [0-9a-f]{64}`).test(stdout)) fail(`${fid}: CLI did not print a DIGEST line`);

    if (fixture.expectation === 'fail') {
      if (code !== 1) fail(`${fid}: expected CLI exit 1 for negative fixture, got ${code}`);
      else pass(`${fid}: CLI exited 1 as expected`);
      const rules = receipt.violations.map((v) => v.rule);
      if (fixture.expectedRule && rules.includes(fixture.expectedRule)) pass(`${fid}: named rule ${fixture.expectedRule} fired`);
      else fail(`${fid}: expected rule ${fixture.expectedRule}, got violations ${JSON.stringify(rules)}`);
      const hit = receipt.violations.find((v) => v.rule === fixture.expectedRule);
      if (hit && hit.record === events[0].predictionId) pass(`${fid}: violation pinned to prediction ${hit.record}`);
      if (receipt.results.scoredEventCount !== 0) fail(`${fid}: rejected event must not be scored, scoredEventCount=${receipt.results.scoredEventCount}`);
      else pass(`${fid}: rejected event excluded from scoring`);
    } else { // pass | review
      if (code !== 0) fail(`${fid}: expected CLI exit 0, got ${code}: ${stdout.trim().split('\n').slice(0, 3).join(' | ')}`);
      else pass(`${fid}: CLI exited 0`);
      if (receipt.violations.length !== 0) fail(`${fid}: unexpected violations ${JSON.stringify(receipt.violations)}`);
      if (fixture.assert) checkAssert(fid, fixture.assert, receipt.results);
      if (fixture.expectedWarnings) {
        const warnRules = receipt.results.warnings.map((w) => w.rule);
        for (const w of fixture.expectedWarnings) {
          if (warnRules.includes(w)) pass(`${fid}: warning ${w} surfaced`);
          else fail(`${fid}: expected warning ${w}; receipt has ${JSON.stringify(warnRules)}`);
        }
      }
      // Hand-computed Brier assertion (independent of fixture assert block).
      if (HAND_COMPUTED_BRIER[fid] !== undefined) {
        if (receipt.results.overall.brierScore === HAND_COMPUTED_BRIER[fid]) {
          pass(`${fid}: hand-computed Brier ${HAND_COMPUTED_BRIER[fid]} matches receipt`);
        } else {
          fail(`${fid}: hand-computed Brier ${HAND_COMPUTED_BRIER[fid]} != receipt ${receipt.results.overall.brierScore}`);
        }
      }
    }
    // Governance immutability after EVERY single run.
    if (await fileDigest(GOVERNANCE_PATH) !== governanceBefore) fail(`${fid}: control run mutated ${GOVERNANCE_PATH}`);
  }
  pass('governance.json untouched by every per-fixture run');

  // 3. Input immutability: SHA-256 before == after for every fixture.
  for (const [f, before] of hashesBefore) {
    const after = await fileDigest(f);
    if (after === before) pass(`immutable input ${f}`);
    else fail(`input mutated by control run: ${f} (${before} -> ${after})`);
  }

  // 4. Full-suite determinism: run TWICE with fixed --now into the canonical
  //    WS6 output dirs; negative fixtures legitimately force exit 1.
  const suiteArgs = ['--fixtures', '--now', NOW];
  const run1 = runCli(suiteArgs);
  const run2 = runCli(suiteArgs);
  for (const [i, r] of [[1, run1], [2, run2]]) {
    if (r.code === 1) pass(`suite run ${i}: exit 1 (negative fixtures reported as violations, as expected)`);
    else fail(`suite run ${i}: expected exit 1 due to negative fixtures, got ${r.code}`);
  }
  const receiptPath = path.join('knowledge/receipts/calibration', `calibration-receipt-${LABEL}.json`);
  const receipt1 = JSON.parse(await readFile(receiptPath, 'utf8'));
  const negativeRules = [];
  for (const f of fixtureFiles) {
    const fx = JSON.parse(await readFile(f, 'utf8'));
    if (fx.expectation === 'fail') negativeRules.push(fx.expectedRule);
  }
  const suiteViolationRules = receipt1.violations.map((v) => v.rule);
  for (const rule of negativeRules) {
    if (suiteViolationRules.includes(rule)) pass(`suite violations include ${rule}`);
    else fail(`suite violations missing ${rule}: ${JSON.stringify(suiteViolationRules)}`);
  }
  if (await fileDigest(GOVERNANCE_PATH) !== governanceBefore) fail(`suite runs mutated ${GOVERNANCE_PATH}`);
  else pass('governance.json untouched by suite runs');

  const digestRe = /DIGEST calibration ([0-9a-f]{64})/;
  const d1 = run1.stdout.match(digestRe)?.[1];
  const d2 = run2.stdout.match(digestRe)?.[1];
  if (!d1 || !d2) fail('missing DIGEST line in suite output');
  else if (d1 !== d2) fail(`non-deterministic digests: run1 ${d1} != run2 ${d2}`);
  else pass(`deterministic digests across two suite runs: ${d1}`);
  if (d1 && receipt1.digest !== d1) fail(`receipt digest ${receipt1.digest} != printed DIGEST ${d1}`);
  const bytes1 = await fileDigest(receiptPath);
  runCli(suiteArgs); // third run must still produce byte-identical receipt file
  const bytes2 = await fileDigest(receiptPath);
  if (bytes1 === bytes2) pass('receipt file bytes stable across repeated suite runs');
  else fail(`receipt file bytes changed across runs: ${bytes1} -> ${bytes2}`);

  await rm(tmp, { recursive: true, force: true });
  console.log(`DIGEST calibration ${d1 ?? 'unavailable'}`);
  if (failures.length) {
    console.log(`FAIL ${failures.length} check(s) failed`);
    process.exit(1);
  }
  console.log('PASS all calibration checks passed');
  process.exit(0);
}

main().catch((err) => { console.error(`FAIL harness error: ${err.stack || err.message}`); process.exit(2); });
