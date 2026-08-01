#!/usr/bin/env node
// WS1 self-test harness — source independence.
// Contract: docs/strategy-genesis/CONTROLS_SPEC.md §2, §3, §4, §8.
//
// - Validates every produced IndependenceReport against
//   knowledge/schema/independence-report.schema.json with ajv (draft 2020-12).
// - Runs ALL fixtures under knowledge/fixtures/source-independence/{positive,negative}.
//   Positive fixtures must produce their expected clusters; negative fixtures must
//   NOT produce their forbidden outcome (a silent pass = test failure).
// - Runs the whole fixture pass TWICE with fixed --now and asserts identical digests.
// - Prints "DIGEST source-independence <hex>"; exit 0 only if everything holds.
// - Emits one receipt per fixture into knowledge/receipts/source-independence/
//   and a review-candidates file into knowledge/candidates/source-independence/.
//
// Exit codes: 0 all checks pass, 1 one or more checks failed, 2 usage/IO error.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { digest, canonicalStringify, fileDigest } from './lib/canonical-json.mjs';
import { analyzeFixture, buildReport, reportDigest } from './analyze-source-independence.mjs';

const CONTROL = 'WS1';
const AREA = 'source-independence';
const FIXED_NOW = '2026-07-31T00:00:00Z';
const root = process.cwd();

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
let now = FIXED_NOW;
let receiptDir = path.join('knowledge', 'receipts', AREA);
let candidateDir = path.join('knowledge', 'candidates', AREA);
let fixtureRoot = path.join('knowledge', 'fixtures', AREA);
let configPath = path.join('knowledge', 'config', 'governance.json');
for (let i = 2; i < process.argv.length; i += 1) {
  const k = process.argv[i];
  const v = process.argv[i + 1];
  if (k === '--now') { now = v; i += 1; } else if (k === '--out') { receiptDir = v; i += 1; } else if (k === '--candidates') { candidateDir = v; i += 1; } else if (k === '--fixtures-dir') { fixtureRoot = v; i += 1; } else if (k === '--config') { configPath = v; i += 1; } else {
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
// Schema setup
// ---------------------------------------------------------------------------
if (!fs.existsSync(configPath)) {
  console.error(`FAIL config: ${configPath} not found`);
  process.exit(2);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
assertConfig(config);
function assertConfig(c) {
  if (!Number.isInteger(c?.confidence?.minimumIndependentStreamsForPattern)) {
    console.error('FAIL config-minimum-independent-streams: governance.confidence.minimumIndependentStreamsForPattern missing');
    process.exit(1);
  }
}

const schemaPath = path.join(root, 'knowledge', 'schema', 'independence-report.schema.json');
const ajv = new Ajv2020({ strict: true, allErrors: true });
addFormats(ajv);
const validateReport = ajv.compile(JSON.parse(fs.readFileSync(schemaPath, 'utf8')));

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
// One fixture pass: analyze + schema-validate + assert expectations.
// Returns { fixtureId: reportDigestHex } for determinism comparison.
// When collect=true, also returns reports/receipts for artifact emission.
// ---------------------------------------------------------------------------
async function runFixturePass({ assertExpectations }) {
  const digestMap = {};
  const artifacts = [];
  for (const { polarity, file } of fixtures) {
    const fixture = JSON.parse(fs.readFileSync(file, 'utf8'));
    const rel = path.relative(root, file).replaceAll('\\', '/');
    const label = `${polarity}/${path.basename(file, '.json')}`;

    // Fixture self-description (SPEC §4).
    for (const key of ['fixtureId', 'description', 'expectation', 'expectedRule']) {
      assert(key in fixture, `${label}: missing self-describing key ${key}`);
    }
    assert(
      ['pass', 'fail', 'review', 'quarantine', 'reject'].includes(fixture.expectation),
      `${label}: invalid expectation ${fixture.expectation}`
    );

    const analysis = analyzeFixture(fixture, config);
    const fh = await fileDigest(file);
    const report = buildReport({
      analysis,
      generatedAt: now,
      inputMode: 'fixture',
      inputFiles: {
        mode: 'fixture',
        sources: analysis ? (fixture.sources || []).map((s, i) => ({ id: s.id ?? `unknown:${i}`, path: `${rel}#sources[${i}]`, sha256: fh })) : [],
        observations: (fixture.observations || []).map((o, i) => ({ id: o.id ?? o.observationId ?? `obs:${i}`, path: `${rel}#observations[${i}]`, sha256: fh }))
      }
    });

    // Schema validation with ajv (SPEC §5).
    const ok = validateReport(report);
    assert(ok, `${label}: report failed schema validation: ${ajv.errorsText(validateReport.errors)}`);

    digestMap[fixture.fixtureId] = reportDigest(report);
    artifacts.push({ fixture, rel, report, fileDigestHex: fh, polarity });

    if (assertExpectations) assertFixtureExpectations(fixture, report, label);
  }
  return { digestMap, artifacts };
}

function assertFixtureExpectations(fixture, report, label) {
  const exp = fixture.expected ?? {};
  if ('totalClusters' in exp) {
    assert(report.clusters.length === exp.totalClusters,
      `${label}: expected ${exp.totalClusters} clusters, got ${report.clusters.length} (${report.clusters.map((c) => c.relationship).join(',') || 'none'})`);
  }
  if ('independentStreams' in exp) {
    assert(report.independentStreamCount === exp.independentStreams,
      `${label}: expected ${exp.independentStreams} independent streams, got ${report.independentStreamCount}`);
  }
  for (const want of exp.clusters ?? []) {
    const match = report.clusters.find((c) =>
      c.relationship === want.relationship &&
      (!('memberCount' in want) || c.members.length === want.memberCount) &&
      (!('manualReviewRequired' in want) || c.manualReviewRequired === want.manualReviewRequired));
    assert(match, `${label}: no cluster matching ${JSON.stringify(want)}; got ${JSON.stringify(report.clusters.map((c) => ({ r: c.relationship, n: c.members.length, mrr: c.manualReviewRequired })))}`);
  }
  for (const rel of exp.absentRelationships ?? []) {
    assert(!report.clusters.some((c) => c.relationship === rel),
      `${label}: forbidden relationship ${rel} present (expectedRule ${fixture.expectedRule} violated)`);
  }
  for (const group of exp.noClusterContaining ?? []) {
    assert(!report.clusters.some((c) => group.every((id) => c.members.includes(id))),
      `${label}: forbidden merge of ${group.join(' + ')} (expectedRule ${fixture.expectedRule} violated)`);
  }
  for (const needle of exp.warningsContaining ?? []) {
    assert(report.warnings.some((w) => w.rule.includes(needle) || w.detail.includes(needle)),
      `${label}: expected warning containing "${needle}"; got ${JSON.stringify(report.warnings.map((w) => w.rule))}`);
  }
  for (const origin of exp.originCandidatesInclude ?? []) {
    assert(report.clusters.some((c) => c.originCandidates.includes(origin)),
      `${label}: no cluster lists origin candidate "${origin}"`);
  }
  // Polarity semantics (SPEC §4): a negative fixture that passes the control
  // silently is a test failure. Here "passing silently" means the control
  // produced the forbidden merge/cycle, which the assertions above reject.
  if (fixture.expectation === 'review') {
    assert(report.reviewQueue.length > 0, `${label}: expectation=review but review queue is empty`);
    for (const cid of report.reviewQueue) {
      const c = report.clusters.find((x) => x.clusterId === cid);
      assert(c && c.manualReviewRequired === true, `${label}: review queue entry ${cid} not flagged manualReviewRequired`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main: schema-validity smoke, two deterministic passes, CLI smoke, receipts.
// ---------------------------------------------------------------------------
const main = async () => {
  test('T00 schema compiles and fixtures exist', () => {
    assert(validateReport != null, 'schema did not compile');
    assert(fixtures.length >= 8, `expected >= 8 fixtures, found ${fixtures.length}`);
    const pos = fixtures.filter((f) => f.polarity === 'positive').length;
    const neg = fixtures.filter((f) => f.polarity === 'negative').length;
    assert(pos >= 5 && neg >= 3, `expected >=5 positive and >=3 negative, found ${pos}/${neg}`);
  });

  // Pass 1 (assertions on) and pass 2 (digest-only) — SPEC §3 double run.
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

  // CLI smoke: run the analyzer end-to-end on canonical input with fixed --now.
  test('T02 analyzer CLI smoke run on canonical knowledge dirs', () => {
    const res = spawnSync(process.execPath, [
      path.join('scripts', 'knowledge', 'analyze-source-independence.mjs'),
      '--now', now
    ], { cwd: root, encoding: 'utf8' });
    assert(res.status === 0, `CLI exited ${res.status}: ${res.stderr || res.stdout}`);
    assert(/DIGEST source-independence [0-9a-f]{64}/.test(res.stdout), 'CLI did not print a DIGEST line');
    const reportFile = path.join(root, 'knowledge', 'receipts', AREA, `${AREA}-report-${now.replace(/[-:]/g, '')}.json`);
    assert(fs.existsSync(reportFile), `CLI report missing at ${reportFile}`);
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    const ok = validateReport(report);
    assert(ok, `CLI report failed schema validation: ${ajv.errorsText(validateReport.errors)}`);
  });

  // Emit per-fixture receipts + review candidates (deterministic content).
  test('T03 receipts and review candidates emitted', () => {
    fs.mkdirSync(receiptDir, { recursive: true });
    fs.mkdirSync(candidateDir, { recursive: true });
    const reviewCandidates = [];
    for (const { fixture, rel, report, fileDigestHex, polarity } of pass1.artifacts) {
      const receipt = {
        receiptId: `receipt:${AREA}:fixture:${fixture.fixtureId}`,
        control: CONTROL,
        generatedAt: now,
        inputs: [{ path: rel, sha256: fileDigestHex }],
        results: {
          fixtureId: fixture.fixtureId,
          polarity,
          expectation: fixture.expectation,
          expectedRule: fixture.expectedRule,
          reportId: report.reportId,
          reportDigest: reportDigest(report),
          clusterCount: report.clusters.length,
          relationships: report.clusters.map((c) => c.relationship).sort(),
          independentStreamCount: report.independentStreamCount,
          reviewQueue: report.reviewQueue,
          warnings: report.warnings.map((w) => w.rule).sort()
        },
        violations: [],
        digest: digest({
          fixtureId: fixture.fixtureId,
          reportId: report.reportId,
          clusters: report.clusters,
          independentStreamCount: report.independentStreamCount,
          reviewQueue: report.reviewQueue,
          warnings: report.warnings
        })
      };
      const out = path.join(receiptDir, `${AREA}-receipt-fixture-${fixture.fixtureId}.json`);
      fs.writeFileSync(out, `${canonicalStringify(receipt)}\n`);
      for (const c of report.clusters.filter((x) => x.manualReviewRequired)) {
        reviewCandidates.push({
          candidateId: `review-candidate:${c.clusterId}`,
          control: CONTROL,
          fixtureId: fixture.fixtureId,
          clusterId: c.clusterId,
          relationship: c.relationship,
          members: c.members,
          confidence: c.confidence,
          evidence: c.evidence,
          status: 'pending-human-review'
        });
      }
    }
    reviewCandidates.sort((a, b) => a.candidateId.localeCompare(b.candidateId));
    const candidatesDoc = {
      type: 'IndependenceReviewCandidates',
      control: CONTROL,
      generatedAt: now,
      note: 'Heuristic review queue only. Ambiguous similarity, analyst echoes, and citation cycles are NEVER auto-merged and never mutate canonical records.',
      candidates: reviewCandidates
    };
    fs.writeFileSync(
      path.join(candidateDir, `${AREA}-review-candidates.json`),
      `${canonicalStringify(candidatesDoc)}\n`
    );
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
