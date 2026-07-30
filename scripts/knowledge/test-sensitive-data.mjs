#!/usr/bin/env node
// WS5 self-test harness — sensitive-data and rights scanning.
// Contract: docs/strategy-genesis/CONTROLS_SPEC.md §2, §3, §4, §8.
//
// - ajv-validates record classifications against
//   knowledge/schema/data-classification.schema.json (root) and every scan
//   receipt against $defs.ScanReceipt.
// - Runs ALL fixtures under knowledge/fixtures/sensitive-data/{positive,negative}.
//   Positive fixtures must pass with the expected verdicts; negative fixtures
//   must fire their named rule (a silent pass = test failure).
// - Asserts redaction guarantees: no raw sensitive value (fixture-declared
//   forbiddenSubstrings) appears in receipts, patches, quarantine copies, or
//   CLI output — only redacted fingerprints.
// - Asserts canonical immutability: no file under canonical record dirs is
//   created, modified, or deleted by the scanner or this harness.
// - Runs the whole fixture pass TWICE with fixed --now and asserts identical
//   digests. Prints "DIGEST sensitive-data <hex>"; exit 0 only if all holds.
// - Emits one receipt per fixture into knowledge/receipts/sensitive-data/ and
//   quarantine/patch artifacts into knowledge/quarantine/sensitive-data/.
//
// Exit codes: 0 all checks pass, 1 one or more checks failed, 2 usage/IO error.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { digest, canonicalStringify, fileDigest } from './lib/canonical-json.mjs';
import {
  readConfig, extractRecords, recordRefOf, scanRecords, buildReceipt,
  writeSideArtifacts, TRUNCATION_MARKER, wordCount
} from './scan-sensitive-data.mjs';

const CONTROL = 'WS5';
const AREA = 'sensitive-data';
const FIXED_NOW = '2026-07-31T00:00:00Z';
const root = process.cwd();

// ---------------------------------------------------------------------------
// CLI args (--now mandatory; fixed for deterministic runs, SPEC §2/§3)
// ---------------------------------------------------------------------------
let now = FIXED_NOW;
let receiptDir = path.join('knowledge', 'receipts', AREA);
let quarantineDir = path.join('knowledge', 'quarantine', AREA);
let fixtureRoot = path.join('knowledge', 'fixtures', AREA);
let configPath = path.join('knowledge', 'config', 'governance.json');
for (let i = 2; i < process.argv.length; i += 1) {
  const k = process.argv[i];
  const v = process.argv[i + 1];
  if (k === '--now') { now = v; i += 1; } else if (k === '--out') { receiptDir = v; i += 1; } else if (k === '--quarantine') { quarantineDir = v; i += 1; } else if (k === '--fixtures-dir') { fixtureRoot = v; i += 1; } else if (k === '--config') { configPath = v; i += 1; } else {
    console.error(`FAIL unknown argument ${k}`);
    process.exit(2);
  }
}
if (!now) {
  console.error('FAIL usage: --now is mandatory and must be fixed for deterministic runs');
  process.exit(2);
}

const passes = [];
const failures = [];
const test = (name, fn) => {
  try {
    fn();
    passes.push(name);
    console.log(`PASS ${name}`);
  } catch (e) {
    failures.push({ name, error: e.message });
    console.log(`FAIL ${name}: ${e.message}`);
  }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

// ---------------------------------------------------------------------------
// Config (fail closed) + schema setup
// ---------------------------------------------------------------------------
let config;
try {
  config = readConfig(configPath);
} catch (e) {
  console.error(`FAIL ${e.rule ?? 'config'}: ${e.message}`);
  process.exit(e.rule ? 1 : 2);
}

const schemaPath = path.join(root, 'knowledge', 'schema', 'data-classification.schema.json');
// strictRequired: false — the schema's allOf if/then clauses require root-level
// properties conditionally; ajv's strictRequired would reject that pattern.
const ajv = new Ajv2020({ strict: true, strictRequired: false, allErrors: true });
addFormats(ajv);
const classificationSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
ajv.addSchema(classificationSchema);
const validateClassification = ajv.compile(classificationSchema);
const validateReceipt = ajv.compile({
  $ref: 'https://seed-loom/schemas/data-classification.schema.json#/$defs/ScanReceipt'
});

// ---------------------------------------------------------------------------
// Fixture discovery
// ---------------------------------------------------------------------------
function listFixtures() {
  const out = [];
  for (const polarity of ['positive', 'negative']) {
    const dir = path.join(fixtureRoot, polarity);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
      out.push({ polarity, file: path.join(dir, f) });
    }
  }
  return out;
}
const fixtures = listFixtures();
if (fixtures.length === 0) {
  console.error(`FAIL no fixtures found under ${fixtureRoot}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Canonical immutability snapshot (SPEC §1: control scripts NEVER write to
// canonical record directories).
// ---------------------------------------------------------------------------
const CANONICAL_DIRS = [
  'knowledge/observations', 'knowledge/sources', 'knowledge/runs', 'knowledge/entities',
  'knowledge/relationships', 'knowledge/patterns', 'knowledge/opportunities',
  'knowledge/strategies', 'knowledge/experiments', 'knowledge/fixtures',
  'knowledge/schema', 'knowledge/config'
];
function snapshotCanonical() {
  const entries = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) {
        entries.push(`${p.replaceAll('\\', '/')}:${createHash('sha256').update(fs.readFileSync(p)).digest('hex')}`);
      }
    }
  };
  for (const d of CANONICAL_DIRS) walk(d);
  return entries.sort();
}
const canonicalBefore = snapshotCanonical();

// ---------------------------------------------------------------------------
// Expectation assertions
// ---------------------------------------------------------------------------
function assertFixtureExpectations(fixture, verdicts, receipt, label) {
  const exp = fixture.expected ?? {};
  const byRef = new Map(verdicts.map((v) => [v.recordRef, v]));

  for (const want of exp.verdicts ?? []) {
    const got = byRef.get(want.recordRef);
    assert(got, `${label}: no verdict for ${want.recordRef}`);
    assert(got.action === want.action,
      `${label}: ${want.recordRef} expected action ${want.action}, got ${got.action} (rules: ${got.rulesFired.join(',') || 'none'})`);
    if (want.rule) {
      assert(got.rulesFired.includes(want.rule),
        `${label}: ${want.recordRef} expected rule ${want.rule}; fired: ${got.rulesFired.join(',') || 'none'}`);
    } else {
      assert(got.rulesFired.length === 0,
        `${label}: ${want.recordRef} expected no rules; fired: ${got.rulesFired.join(',')}`);
    }
  }

  if (fixture.expectation === 'pass') {
    assert(verdicts.every((v) => v.action === 'pass'), `${label}: expectation=pass but actions: ${verdicts.map((v) => `${v.recordRef}=${v.action}`).join(',')}`);
    assert(receipt.violations.length === 0, `${label}: expectation=pass but violations present`);
  } else if (fixture.expectation === 'reject') {
    assert(verdicts.some((v) => v.action === 'reject' && v.rulesFired.includes(fixture.expectedRule)),
      `${label}: expectation=reject but no reject verdict fired ${fixture.expectedRule}`);
    assert(receipt.violations.length > 0, `${label}: expectation=reject but receipt has no violations`);
  } else if (fixture.expectation === 'quarantine') {
    assert(verdicts.some((v) => v.action === 'quarantine' && v.rulesFired.includes(fixture.expectedRule)),
      `${label}: expectation=quarantine but no quarantine verdict fired ${fixture.expectedRule}`);
    assert(!verdicts.some((v) => v.action === 'reject'), `${label}: expectation=quarantine but a record was rejected`);
  } else if (fixture.expectation === 'fail') {
    assert(verdicts.some((v) => ['reject', 'minimize-candidate'].includes(v.action) && v.rulesFired.includes(fixture.expectedRule)),
      `${label}: expectation=fail but no reject/minimize-candidate verdict fired ${fixture.expectedRule}`);
  }
  // Polarity semantics (SPEC §4): a negative fixture whose target record is
  // silently passed is a test failure (covered by verdict assertions above).
}

function assertRedactionGuarantees(fixture, receipt, minimizePatches, quarantineDocs, label) {
  const haystacks = [
    { name: 'receipt', text: canonicalStringify(receipt) },
    ...minimizePatches.map((p) => ({ name: `patch:${p.patchId}`, text: canonicalStringify(p) })),
    ...quarantineDocs.map((q) => ({ name: `quarantine:${q.recordRef}`, text: canonicalStringify(q) }))
  ];
  for (const needle of fixture.expected?.forbiddenSubstrings ?? []) {
    for (const h of haystacks) {
      assert(!h.text.includes(needle), `${label}: raw sensitive value leaked into ${h.name}`);
    }
  }
  // Fingerprint shape: prefix <= 4 chars, 64-hex sha256, no full values.
  for (const v of receipt.results.verdicts) {
    for (const r of v.redactions) {
      assert(typeof r.prefix === 'string' && r.prefix.length <= 4, `${label}: redaction prefix too long (${r.prefix.length})`);
      assert(/^[0-9a-f]{64}$/.test(r.sha256), `${label}: redaction sha256 malformed`);
      assert(Number.isInteger(r.length) && r.length > 0, `${label}: redaction length missing`);
    }
    // Undeclared-personal quarantines name signal kinds, never values.
    if (v.rulesFired.includes('UNDECLARED_PERSONAL_DATA')) {
      const sig = v.rulesFired.filter((r) => r.startsWith('personal-signal:'));
      assert(sig.length > 0, `${label}: UNDECLARED_PERSONAL_DATA without personal-signal sub-rules`);
    }
  }
}

function assertMinimizePatch(fixture, minimizePatches, label) {
  const limit = fixture.expected?.minimizedWordLimit;
  if (limit == null) return;
  assert(minimizePatches.length > 0, `${label}: expected a minimize patch candidate, got none`);
  for (const p of minimizePatches) {
    assert(p.neverAutoApply === true && p.requiresHumanApproval === true,
      `${label}: patch ${p.patchId} missing neverAutoApply/requiresHumanApproval`);
    assert(p.proposedValue.endsWith(` ${TRUNCATION_MARKER}`), `${label}: patch missing ellipsis truncation marker`);
    const kept = p.proposedValue.split(/\s+/).filter((t) => t !== TRUNCATION_MARKER);
    assert(kept.length <= limit, `${label}: patch keeps ${kept.length} words > limit ${limit}`);
    assert(wordCount(p.proposedValue.replace(TRUNCATION_MARKER, '')) <= limit, `${label}: patch word count check failed`);
  }
}

// ---------------------------------------------------------------------------
// One fixture pass. Returns { digestMap, artifacts }.
// ---------------------------------------------------------------------------
async function runFixturePass({ assertExpectations }) {
  const digestMap = {};
  const artifacts = [];
  for (const { polarity, file } of fixtures) {
    const fixture = JSON.parse(fs.readFileSync(file, 'utf8'));
    const rel = path.relative(root, file).replaceAll('\\', '/');
    const label = `${polarity}/${path.basename(file, '.json')}`;

    for (const key of ['fixtureId', 'description', 'expectation', 'expectedRule']) {
      assert(key in fixture, `${label}: missing self-describing key ${key}`);
    }
    assert(['pass', 'fail', 'review', 'quarantine', 'reject'].includes(fixture.expectation),
      `${label}: invalid expectation ${fixture.expectation}`);

    const records = extractRecords(fixture);
    assert(records.length > 0, `${label}: fixture has no records`);

    // Classification metadata must itself be schema-valid when present.
    // Negative fixtures whose expectedRule is an intended metadata violation
    // (*_METADATA_MISSING) may legitimately fail standalone validation — the
    // schema failing closed on them is a feature; the scanner's quarantine/
    // reject verdict is what the fixture asserts.
    const metadataViolationExpected = fixture.expectedRule.endsWith('METADATA_MISSING');
    for (const r of records) {
      if (r.dataClassification) {
        const ok = validateClassification(r.dataClassification);
        if (!ok) {
          assert(metadataViolationExpected && fixture.expectation !== 'pass',
            `${label}: dataClassification failed schema validation: ${ajv.errorsText(validateClassification.errors)}`);
        }
      }
    }

    const recordsByRef = new Map(records.map((r, i) => [recordRefOf(r, i), r]));
    const { verdicts, minimizePatches } = scanRecords(records, config);
    const fh = await fileDigest(file);
    const receipt = buildReceipt({
      receiptId: `receipt:${AREA}:fixture:${fixture.fixtureId}`,
      generatedAt: now,
      inputs: [{ path: rel, sha256: fh }],
      verdicts,
      minimizePatches
    });

    const ok = validateReceipt(receipt);
    assert(ok, `${label}: receipt failed schema validation: ${ajv.errorsText(validateReceipt.errors)}`);

    const quarantineDocs = verdicts.filter((v) => v.action === 'quarantine')
      .map((v) => ({ recordRef: v.recordRef, ...{} , record: recordsByRef.get(v.recordRef) }));

    if (assertExpectations) {
      assertFixtureExpectations(fixture, verdicts, receipt, label);
      assertRedactionGuarantees(fixture, receipt, minimizePatches, quarantineDocs, label);
      assertMinimizePatch(fixture, minimizePatches, label);
    }

    digestMap[fixture.fixtureId] = receipt.digest;
    artifacts.push({ fixture, rel, polarity, recordsByRef, verdicts, minimizePatches, receipt, fileDigestHex: fh });
  }
  return { digestMap, artifacts };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const main = async () => {
  test('T00 schema compiles and fixtures exist', () => {
    assert(validateReceipt != null && validateClassification != null, 'schema did not compile');
    const pos = fixtures.filter((f) => f.polarity === 'positive').length;
    const neg = fixtures.filter((f) => f.polarity === 'negative').length;
    assert(pos >= 5 && neg >= 5, `expected >=5 positive and >=5 negative fixtures, found ${pos}/${neg}`);
  });

  let pass1;
  try {
    pass1 = await runFixturePass({ assertExpectations: true });
    for (const { fixture } of pass1.artifacts) {
      passes.push(`fixture:${fixture.fixtureId}`);
      console.log(`PASS fixture ${fixture.fixtureId} [${fixture.expectation}/${fixture.expectedRule}]`);
    }
  } catch (e) {
    failures.push({ name: 'fixture-pass-1', error: e.message });
    console.log(`FAIL fixture-pass-1: ${e.message}`);
    return finish();
  }

  let pass2;
  try {
    pass2 = await runFixturePass({ assertExpectations: true });
  } catch (e) {
    failures.push({ name: 'fixture-pass-2', error: e.message });
    console.log(`FAIL fixture-pass-2: ${e.message}`);
    return finish();
  }

  let aggregateDigest = null;
  test('T01 deterministic double run: identical digests with fixed --now', () => {
    const ids = Object.keys(pass1.digestMap).sort();
    assert(JSON.stringify(ids) === JSON.stringify(Object.keys(pass2.digestMap).sort()), 'fixture id sets differ between runs');
    for (const id of ids) {
      assert(pass1.digestMap[id] === pass2.digestMap[id], `digest mismatch for ${id}: ${pass1.digestMap[id]} vs ${pass2.digestMap[id]}`);
    }
    aggregateDigest = digest({ control: CONTROL, now, fixtures: pass1.digestMap });
  });

  // CLI negative smoke: secret fixture must exit 1 with SECRET_DETECTED and no leak.
  test('T02 scanner CLI rejects secret fixture (exit 1, no raw secret in output/artifacts)', () => {
    const negFile = path.join(fixtureRoot, 'negative', 'neg-secret-github-pat.json');
    const fixture = JSON.parse(fs.readFileSync(negFile, 'utf8'));
    const res = spawnSync(process.execPath, [
      path.join('scripts', 'knowledge', 'scan-sensitive-data.mjs'),
      '--input', negFile, '--out', receiptDir, '--quarantine', quarantineDir, '--now', now, '--config', configPath
    ], { cwd: root, encoding: 'utf8' });
    assert(res.status === 1, `CLI exited ${res.status}, expected 1: ${res.stdout} ${res.stderr}`);
    assert(res.stdout.includes('SECRET_DETECTED'), `CLI did not name SECRET_DETECTED: ${res.stdout}`);
    for (const needle of fixture.expected.forbiddenSubstrings) {
      assert(!res.stdout.includes(needle) && !res.stderr.includes(needle), 'CLI output leaked the raw secret');
    }
    const stamp = now.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const receiptFile = path.join(receiptDir, `${AREA}-receipt-${stamp}.json`);
    assert(fs.existsSync(receiptFile), `CLI receipt missing at ${receiptFile}`);
    const receiptText = fs.readFileSync(receiptFile, 'utf8');
    for (const needle of fixture.expected.forbiddenSubstrings) {
      assert(!receiptText.includes(needle), 'CLI receipt leaked the raw secret');
    }
    const receipt = JSON.parse(receiptText);
    const ok = validateReceipt(receipt);
    assert(ok, `CLI receipt failed schema validation: ${ajv.errorsText(validateReceipt.errors)}`);
    assert(receipt.results.verdicts.some((v) => v.action === 'reject' && v.redactions.length > 0),
      'CLI receipt lacks reject verdict with redaction fingerprints');
  });

  // CLI positive smoke: all-positive input must exit 0 and print a DIGEST line.
  test('T03 scanner CLI passes positive fixture dir (exit 0)', () => {
    const res = spawnSync(process.execPath, [
      path.join('scripts', 'knowledge', 'scan-sensitive-data.mjs'),
      '--input', path.join(fixtureRoot, 'positive'),
      '--out', receiptDir, '--quarantine', quarantineDir, '--now', now, '--config', configPath
    ], { cwd: root, encoding: 'utf8' });
    assert(res.status === 0, `CLI exited ${res.status}: ${res.stdout} ${res.stderr}`);
    assert(/DIGEST sensitive-data [0-9a-f]{64}/.test(res.stdout), 'CLI did not print a DIGEST line');
    const stamp = now.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const receiptFile = path.join(receiptDir, `${AREA}-receipt-${stamp}.json`);
    assert(fs.existsSync(receiptFile), `CLI receipt missing at ${receiptFile}`);
    const receipt = JSON.parse(fs.readFileSync(receiptFile, 'utf8'));
    const ok = validateReceipt(receipt);
    assert(ok, `CLI receipt failed schema validation: ${ajv.errorsText(validateReceipt.errors)}`);
  });

  // Emit per-fixture receipts + quarantine/patch artifacts (deterministic).
  test('T04 per-fixture receipts and quarantine/patch artifacts emitted', () => {
    fs.mkdirSync(receiptDir, { recursive: true });
    for (const { fixture, rel, recordsByRef, verdicts, minimizePatches, receipt } of pass1.artifacts) {
      const out = path.join(receiptDir, `${AREA}-receipt-fixture-${fixture.fixtureId}.json`);
      fs.writeFileSync(out, `${canonicalStringify(receipt)}\n`);
      const written = writeSideArtifacts({
        quarantineDir, root, recordsByRef, verdicts, minimizePatches, generatedAt: now
      });
      // Cross-check: receipt-declared artifact paths exist exactly as declared.
      for (const declared of [...receipt.results.quarantineFiles, ...receipt.results.minimizeCandidateFiles]) {
        assert(written.includes(declared), `${fixture.fixtureId}: declared artifact ${declared} not written`);
        assert(fs.existsSync(path.join(root, declared)), `${fixture.fixtureId}: artifact file missing at ${declared}`);
      }
      // Quarantine copies carry a redaction note.
      for (const v of verdicts.filter((x) => x.action === 'quarantine')) {
        const q = JSON.parse(fs.readFileSync(path.join(root, receipt.results.quarantineFiles.find((f) => f.includes(v.recordRef.replace(/[^A-Za-z0-9._-]/g, '_')))), 'utf8'));
        assert(typeof q.redactionNote === 'string' && q.redactionNote.length > 0, `${fixture.fixtureId}: quarantine copy lacks redaction note`);
      }
    }
  });

  test('T05 canonical record dirs untouched (no new/modified/deleted files)', () => {
    const after = snapshotCanonical();
    assert(JSON.stringify(after) === JSON.stringify(canonicalBefore),
      'canonical directories changed during WS5 scan/test run');
  });

  finish(aggregateDigest);
};

function finish(aggregateDigest = null) {
  console.log(`INFO passed=${passes.length} failed=${failures.length}`);
  if (aggregateDigest && failures.length === 0) {
    console.log(`DIGEST ${AREA} ${aggregateDigest}`);
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.log(`FAIL harness-error: ${e.message}`);
  process.exit(2);
});
