#!/usr/bin/env node
// Post-merge hardening regression tests.
// Covers the four unresolved PR #23 Copilot review findings:
//  1. serve-workbench path boundary (prefix collision + decoded traversal)
//  2. emit-jsonl array flattening + stable identifiers across record types
//  3. run.schema.json requires proposedExperiments (daily intake contract)
//  4. weekly-review baseline window defined + legacy capturedAt derivation
// Exit 0 = all pass, 1 = any failure. Deterministic: no wall-clock in
// assertions except the weekly-review smoke run, which only checks exit code.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { resolveWithin } from './lib/safe-path.mjs';

const root = process.cwd();
let failures = 0;
function check(name, condition, detail = '') {
  if (condition) console.log(`PASS ${name}`);
  else { console.error(`FAIL ${name} ${detail}`); failures++; }
}

// --- 1. Path boundary ---
const base = path.join(os.tmpdir(), 'hardening-wb-base');
fs.rmSync(base, { recursive: true, force: true });
fs.mkdirSync(base, { recursive: true });
fs.writeFileSync(path.join(base, 'index.html'), 'ok');
fs.mkdirSync(path.join(base, 'sub'));
fs.writeFileSync(path.join(base, 'sub', 'data.json'), '{}');
const sibling = base + '-evil';
fs.mkdirSync(sibling, { recursive: true });
fs.writeFileSync(path.join(sibling, 'secret.txt'), 'nope');
const outside = path.join(os.tmpdir(), 'hardening-wb-outside-secret.txt');
fs.writeFileSync(outside, 'nope');
const link = path.join(base, 'linked-secret.txt');
let symlinkCreated = false;
try {
  fs.symlinkSync(outside, link, 'file');
  symlinkCreated = true;
} catch {
  // Symlink creation may be unavailable on Windows without developer mode.
}

check('T1.1 root maps to index.html', resolveWithin(base, '/') === path.join(base, 'index.html'));
check('T1.2 nested file allowed', resolveWithin(base, '/sub/data.json') === path.join(base, 'sub', 'data.json'));
check('T1.3 query string ignored', resolveWithin(base, '/sub/data.json?v=2') === path.join(base, 'sub', 'data.json'));
check('T1.4 prefix-collision sibling rejected', resolveWithin(base, '/../' + path.basename(sibling) + '/secret.txt') === null);
check('T1.5 plain traversal rejected', resolveWithin(base, '/../../etc/passwd') === null);
check('T1.6 encoded traversal (%2e%2e%2f) rejected', resolveWithin(base, '/%2e%2e%2f%2e%2e%2fetc/passwd') === null);
check('T1.7 mixed-case encoded traversal rejected', resolveWithin(base, '/%2E%2E/%2e%2E/etc/passwd') === null);
check('T1.8 invalid percent-encoding rejected', resolveWithin(base, '/%zz') === null);
// On POSIX a backslash is a literal filename char, so it resolves inside base
// (safe); the invariant that matters is that nothing outside base is returned.
{
  const r = resolveWithin(base, '/..%5c..%5csecret');
  check('T1.9 encoded backslash cannot escape base', r === null || r.startsWith(base + path.sep));
}
check('T1.10 symlink escape rejected', !symlinkCreated || resolveWithin(base, '/linked-secret.txt') === null);
fs.rmSync(base, { recursive: true, force: true });
fs.rmSync(sibling, { recursive: true, force: true });
fs.rmSync(outside, { force: true });

// --- 2. emit-jsonl ---
const fix = fs.mkdtempSync(path.join(os.tmpdir(), 'hardening-jsonl-'));
fs.mkdirSync(path.join(fix, 'knowledge', 'runs'), { recursive: true });
fs.mkdirSync(path.join(fix, 'knowledge', 'sources'), { recursive: true });
fs.mkdirSync(path.join(fix, 'knowledge', 'observations'), { recursive: true });
fs.writeFileSync(path.join(fix, 'knowledge', 'runs', 'acks-test.json'),
  JSON.stringify([{ ackId: 'ack:2', stage: 'vet', status: 'passed' }, { ackId: 'ack:1', stage: 'collect', status: 'passed' }]));
fs.writeFileSync(path.join(fix, 'knowledge', 'sources', 'src-test.json'),
  JSON.stringify({ sourceId: 'src:legacy-shape', url: 'https://example.gov/x', sourceClass: 'primary-government' }));
fs.writeFileSync(path.join(fix, 'knowledge', 'observations', 'obs-test.json'),
  JSON.stringify({ observationId: 'obs:legacy-shape', type: 'Observation' }));
fs.writeFileSync(path.join(fix, 'knowledge', 'observations', 'obs-anon.json'),
  JSON.stringify({ type: 'Observation', claim: 'no known identifier fields' }));
const jl = spawnSync('node', [path.join(root, 'scripts/knowledge/emit-jsonl.mjs')], { cwd: fix, encoding: 'utf8' });
check('T2.1 emit-jsonl exits 0 on arrays and legacy identifier shapes', jl.status === 0, jl.stderr);
const lines = (jl.stdout || '').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
check('T2.2 array file flattened to one line per record', lines.length === 5, `got ${lines.length}`);
const ids = lines.map((r) => r.ackId ?? r.sourceId ?? r.observationId ?? (typeof r === 'object' ? '<anon>' : null));
check('T2.3 records sorted by derived identifier', JSON.stringify(ids) === JSON.stringify(['ack:1', 'ack:2', '<anon>', 'obs:legacy-shape', 'src:legacy-shape']), JSON.stringify(ids));
check('T2.3b exactly one record needed the anon: fallback', ids.filter((x) => x === '<anon>').length === 1);
const jl2 = spawnSync('node', [path.join(root, 'scripts/knowledge/emit-jsonl.mjs')], { cwd: fix, encoding: 'utf8' });
check('T2.4 emit-jsonl deterministic across runs', jl2.status === 0 && jl2.stdout === jl.stdout);
// real repo must not throw either
const jlReal = spawnSync('node', [path.join(root, 'scripts/knowledge/emit-jsonl.mjs')], { cwd: root, encoding: 'utf8' });
check('T2.5 emit-jsonl exits 0 on canonical knowledge dirs', jlReal.status === 0, jlReal.stderr.slice(0, 400));
fs.rmSync(fix, { recursive: true, force: true });

// --- 3. run schema requires proposedExperiments ---
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const runSchema = JSON.parse(fs.readFileSync(path.join(root, 'knowledge/schema/run.schema.json'), 'utf8'));
ajv.addSchema(runSchema, runSchema.$id);
const validateRun = ajv.getSchema(runSchema.$id);
const runOk = {
  schemaVersion: '1.1.0', runId: 'run:hardening:test', type: 'ResearchRun', ingestionMode: 'synthetic',
  retrievalWindow: { from: '2026-08-01T00:00:00Z', to: '2026-08-02T00:00:00Z' },
  newObservations: [], updatedObservations: [], candidatePatterns: [], newRelationships: [],
  contradictions: [], opportunities: [], proposedExperiments: [], repositoryActions: [],
  noChangeReceipts: [], collectionFailures: []
};
const runMissing = JSON.parse(JSON.stringify(runOk));
delete runMissing.proposedExperiments;
check('T3.1 run with proposedExperiments validates', validateRun(runOk) === true, JSON.stringify(validateRun.errors));
check('T3.2 run without proposedExperiments is invalid', validateRun(runMissing) === false);
for (const canonical of ['run-example.json', 'run-nightly-reconstructed-2026-07-30.json']) {
  const p = path.join(root, 'knowledge/runs', canonical);
  if (!fs.existsSync(p)) { check(`T3.3 canonical ${canonical} present`, false, 'missing'); continue; }
  const rec = JSON.parse(fs.readFileSync(p, 'utf8'));
  check(`T3.3 canonical ${canonical} declares proposedExperiments`, Array.isArray(rec.proposedExperiments));
}

// --- 4. weekly-review ---
const wrFix = fs.mkdtempSync(path.join(os.tmpdir(), 'hardening-weekly-'));
fs.mkdirSync(path.join(wrFix, 'knowledge', 'observations'), { recursive: true });
// legacy record: no capturedAt, dated id must derive it; 14 days old -> baseline branch
const old = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
const stamp = old.toISOString().slice(0, 10);
fs.writeFileSync(path.join(wrFix, 'knowledge', 'observations', `obs-${stamp}-legacy.json`),
  JSON.stringify({ observationId: `obs:${stamp}:legacy`, type: 'Observation', actorRefs: ['actor:a'] }));
// record with no derivable date at all -> unclassified, not NaN crash
fs.writeFileSync(path.join(wrFix, 'knowledge', 'observations', 'obs-nodate.json'),
  JSON.stringify({ id: 'obs:undated', type: 'Observation' }));
const wr = spawnSync('node', [path.join(root, 'scripts/knowledge/weekly-review.mjs')], { cwd: wrFix, encoding: 'utf8' });
check('T4.1 weekly-review exits 0 with legacy observations in baseline branch', wr.status === 0, wr.stderr.slice(0, 400));
let wrReport = {};
try { wrReport = JSON.parse(wr.stdout); } catch { /* handled below */ }
check('T4.2 legacy observation classified into baseline via id-derived date', wrReport.baselineCount === 1, wr.stdout.slice(0, 300));
check('T4.3 undated observation reported unclassified, not dropped silently', (wrReport.unclassifiedObservations ?? []).includes('obs:undated'));
const wrReal = spawnSync('node', [path.join(root, 'scripts/knowledge/weekly-review.mjs')], { cwd: root, encoding: 'utf8' });
check('T4.4 knowledge:weekly exits 0 on canonical repo', wrReal.status === 0, wrReal.stderr.slice(0, 400));
fs.rmSync(wrFix, { recursive: true, force: true });

console.log(failures === 0 ? 'ALL HARDENING TESTS PASS' : `HARDENING FAILURES: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
