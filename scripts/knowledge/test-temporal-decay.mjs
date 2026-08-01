// WS2 temporal-decay test harness. Contract: docs/strategy-genesis/CONTROLS_SPEC.md §8.
//  1. ajv-validates the temporal-projection schema against produced projections.
//  2. Runs every fixture in knowledge/fixtures/temporal/{positive,negative} through
//     the CLI with fixed --now 2026-07-31T00:00:00Z and checks each fixture's
//     self-described expectation / expectedRule / assert / expectedWarnings.
//  3. Asserts input immutability: SHA-256 of every fixture file before == after.
//  4. Runs the full fixture suite TWICE with the same --now, asserts identical
//     receipt digests, and prints "DIGEST temporal-decay <hex>".
// Exit 0 only if every check holds.

import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { canonicalize, fileDigest } from './lib/canonical-json.mjs';

const NOW = '2026-07-31T00:00:00Z';
const LABEL = '20260731T000000Z';
const FIXTURE_ROOT = 'knowledge/fixtures/temporal';
const SCRIPT = 'scripts/knowledge/apply-temporal-decay.mjs';
const SCHEMA_PATH = 'knowledge/schema/temporal-projection.schema.json';

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

function checkAssert(fixtureId, assert, entry) {
  for (const [field, cond] of Object.entries(assert)) {
    const actual = getPath(entry, field);
    const ops = (cond && typeof cond === 'object' && !Array.isArray(cond) && ('eq' in cond || 'gte' in cond || 'lte' in cond || 'ne' in cond)) ? cond : { eq: cond };
    for (const [op, expected] of Object.entries(ops)) {
      const same = JSON.stringify(canonicalize(actual)) === JSON.stringify(canonicalize(expected));
      let ok; let desc;
      if (op === 'eq') { ok = same; desc = `eq ${JSON.stringify(expected)}`; }
      else if (op === 'ne') { ok = !same; desc = `ne ${JSON.stringify(expected)}`; }
      else if (op === 'gte') { ok = typeof actual === 'number' && actual >= expected; desc = `gte ${expected}`; }
      else if (op === 'lte') { ok = typeof actual === 'number' && actual <= expected; desc = `lte ${expected}`; }
      else { ok = false; desc = `unknown op ${op}`; }
      if (ok) pass(`${fixtureId}: entry.${field} ${desc} (got ${JSON.stringify(actual)})`);
      else fail(`${fixtureId}: entry.${field} expected ${desc}, got ${JSON.stringify(actual)}`);
    }
  }
}

async function main() {
  // 0. Compile projection schema.
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  const schema = JSON.parse(await readFile(SCHEMA_PATH, 'utf8'));
  const validate = ajv.compile(schema);
  pass('schema temporal-projection.schema.json compiled');

  // 1. Hash all fixture inputs BEFORE any run.
  const fixtureFiles = await listJson(FIXTURE_ROOT);
  if (fixtureFiles.length === 0) { fail(`no fixtures found under ${FIXTURE_ROOT}`); }
  const hashesBefore = new Map();
  for (const f of fixtureFiles) hashesBefore.set(f, await fileDigest(f));
  info(`hashed ${fixtureFiles.length} fixture file(s) before run`);

  const tmp = await mkdtemp(path.join(tmpdir(), 'ws2-temporal-'));

  // 2. Per-fixture CLI runs.
  for (const file of fixtureFiles) {
    const fixture = JSON.parse(await readFile(file, 'utf8'));
    const fid = fixture.fixtureId ?? path.basename(file);
    for (const key of ['fixtureId', 'description', 'expectation']) {
      if (!(key in fixture)) fail(`${fid}: fixture missing self-describing field '${key}'`);
    }
    const outDir = path.join(tmp, fid, 'receipts');
    const projDir = path.join(tmp, fid, 'projections');
    const { code, stdout, stderr } = runCli(['--input', file, '--now', NOW, '--out', outDir, '--projections-out', projDir]);
    if (stderr.trim()) fail(`${fid}: CLI wrote to stderr: ${stderr.trim().slice(0, 300)}`);
    let receipt; let projection;
    try {
      receipt = JSON.parse(await readFile(path.join(outDir, `temporal-decay-receipt-${LABEL}.json`), 'utf8'));
      projection = JSON.parse(await readFile(path.join(projDir, `temporal-projection-${LABEL}.json`), 'utf8'));
    } catch (err) {
      fail(`${fid}: cannot read CLI outputs: ${err.message}`);
      continue;
    }
    if (!validate(projection)) fail(`${fid}: projection failed schema validation: ${JSON.stringify(validate.errors)}`);
    else pass(`${fid}: projection validates against schema`);

    if (fixture.expectation === 'fail') {
      if (code !== 1) fail(`${fid}: expected CLI exit 1 for negative fixture, got ${code}`);
      else pass(`${fid}: CLI exited 1 as expected`);
      const rules = receipt.violations.map((v) => v.rule);
      if (fixture.expectedRule && rules.includes(fixture.expectedRule)) pass(`${fid}: named rule ${fixture.expectedRule} fired`);
      else fail(`${fid}: expected rule ${fixture.expectedRule}, got violations ${JSON.stringify(rules)}`);
      const hit = receipt.violations.find((v) => v.rule === fixture.expectedRule);
      if (hit && hit.record === fixture.record.id) pass(`${fid}: violation pinned to record ${hit.record}`);
      if (projection.entries.length !== 0) fail(`${fid}: failing record must be excluded from projection entries, got ${projection.entries.length}`);
      else pass(`${fid}: failing record excluded from projection entries`);
    } else { // pass | review
      if (code !== 0) fail(`${fid}: expected CLI exit 0, got ${code}: ${stdout.trim().split('\n').slice(0, 3).join(' | ')}`);
      else pass(`${fid}: CLI exited 0`);
      if (receipt.violations.length !== 0) fail(`${fid}: unexpected violations ${JSON.stringify(receipt.violations)}`);
      if (projection.entries.length !== 1) { fail(`${fid}: expected exactly 1 projection entry, got ${projection.entries.length}`); continue; }
      const entry = projection.entries[0];
      if (entry.recordRef !== fixture.record.id) fail(`${fid}: recordRef ${entry.recordRef} != record id ${fixture.record.id}`);
      if (entry.baseConfidence !== fixture.record.confidence) fail(`${fid}: baseConfidence altered (${entry.baseConfidence} != ${fixture.record.confidence})`);
      else pass(`${fid}: baseConfidence copied unmutated (${entry.baseConfidence})`);
      if (fixture.expectation === 'review' && entry.reviewRequired !== true) fail(`${fid}: expectation 'review' but reviewRequired is false`);
      if (fixture.assert) checkAssert(fid, fixture.assert, entry);
      if (fixture.expectedWarnings) {
        const receiptWarns = receipt.results.warnings.map((w) => w.rule);
        for (const w of fixture.expectedWarnings) {
          if (receiptWarns.includes(w) && entry.warnings.includes(w)) pass(`${fid}: warning ${w} surfaced in receipt and entry`);
          else fail(`${fid}: expected warning ${w}; receipt has ${JSON.stringify(receiptWarns)}, entry has ${JSON.stringify(entry.warnings)}`);
        }
      }
      if (!new RegExp(`DIGEST temporal-decay [0-9a-f]{64}`).test(stdout)) fail(`${fid}: CLI did not print a DIGEST line`);
    }
  }

  // 3. Input immutability: SHA-256 before == after for every fixture.
  for (const [f, before] of hashesBefore) {
    const after = await fileDigest(f);
    if (after === before) pass(`immutable input ${f}`);
    else fail(`input mutated by control run: ${f} (${before} -> ${after})`);
  }

  // 4. Full-suite determinism: run TWICE with fixed --now into the canonical
  //    WS2 output dirs; negative fixtures legitimately force exit 1.
  const suiteArgs = ['--fixtures', '--now', NOW];
  const run1 = runCli(suiteArgs);
  const run2 = runCli(suiteArgs);
  for (const [i, r] of [[1, run1], [2, run2]]) {
    if (r.code === 1) pass(`suite run ${i}: exit 1 (negative fixtures reported as violations, as expected)`);
    else fail(`suite run ${i}: expected exit 1 due to negative fixtures, got ${r.code}`);
  }
  const receiptPath = path.join('knowledge/receipts/temporal-decay', `temporal-decay-receipt-${LABEL}.json`);
  const projectionPath = path.join('knowledge/projections/temporal-decay', `temporal-projection-${LABEL}.json`);
  const receipt1 = JSON.parse(await readFile(receiptPath, 'utf8'));
  const suiteProjection = JSON.parse(await readFile(projectionPath, 'utf8'));
  if (!validate(suiteProjection)) fail(`suite projection failed schema validation: ${JSON.stringify(validate.errors)}`);
  else pass('suite projection validates against schema');
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
  const positiveCount = fixtureFiles.length - negativeRules.length;
  if (receipt1.results.entryCount === positiveCount) pass(`suite entry count ${receipt1.results.entryCount} == ${positiveCount} positive fixtures`);
  else fail(`suite entry count ${receipt1.results.entryCount} != ${positiveCount}`);

  const digestRe = /DIGEST temporal-decay ([0-9a-f]{64})/;
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
  console.log(`DIGEST temporal-decay ${d1 ?? 'unavailable'}`);
  if (failures.length) {
    console.log(`FAIL ${failures.length} check(s) failed`);
    process.exit(1);
  }
  console.log('PASS all temporal-decay checks passed');
  process.exit(0);
}

main().catch((err) => { console.error(`FAIL harness error: ${err.stack || err.message}`); process.exit(2); });
