#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const inputArg = process.argv.slice(2).find((arg) => !arg.startsWith('--')) || 'knowledge/intake/nightly/2026-10-01/nightly-run-bundle-2026-10-01.json';
const outputArg = process.argv.find((arg) => arg.startsWith('--out='))?.slice('--out='.length);
const input = path.resolve(root, inputArg);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const fileSha256 = (file) => sha256(fs.readFileSync(file));
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['createdAt', 'generatedAt', 'updatedAt', 'sha256'].includes(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => [key, canonicalize(item)]));
};
const digest = (value) => sha256(JSON.stringify(canonicalize(value)));
const safe = (id) => id.replace(/[:/]/g, '-');

function jsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? jsonFiles(file) : entry.name.endsWith('.json') ? [file] : [];
  });
}

function proofTree(workspace) {
  const paths = ['knowledge/sources','knowledge/observations','knowledge/relationships','knowledge/runs','knowledge/receipts','knowledge/projections','knowledge/candidates','knowledge/quarantine','tools/graph-workbench/data.json'];
  const records = [];
  for (const relative of paths) {
    const absolute = path.join(workspace, relative);
    const files = fs.existsSync(absolute) && fs.statSync(absolute).isDirectory() ? jsonFiles(absolute) : fs.existsSync(absolute) ? [absolute] : [];
    for (const file of files) records.push({ path: path.relative(workspace, file).replaceAll('\\', '/'), record: canonicalize(JSON.parse(fs.readFileSync(file, 'utf8'))) });
  }
  return records.sort((a, b) => a.path.localeCompare(b.path));
}

function runNode(workspace, args, env = {}) {
  const result = spawnSync(process.execPath, args, { cwd: workspace, encoding: 'utf8', env: { ...process.env, ...env } });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  if (result.status !== 0) throw new Error(`${args.join(' ')} failed (${result.status})\n${output}`);
  return output;
}

function targetFiles(bundle) {
  return [
    ...bundle.sources.map(({ id }) => `knowledge/sources/${safe(id)}.json`),
    ...bundle.observations.map(({ id }) => `knowledge/observations/${safe(id)}.json`),
    ...bundle.relationships.map(({ id }) => `knowledge/relationships/${safe(id)}.json`),
    `knowledge/runs/${safe(bundle.run.runId)}.json`,
    ...bundle.stageAcks.map(({ ackId }) => `knowledge/runs/stage-acks/${safe(ackId)}.json`),
    ...(bundle.socraticAssessments ?? []).map(({ assessmentId }) => `knowledge/runs/socratic-assessments/${safe(assessmentId)}.json`),
    `knowledge/receipts/${safe(bundle.run.runId)}-ingest.json`
  ];
}

function copyWorkspace(target, bundle) {
  fs.cpSync(root, target, { recursive: true, filter: (source) => !source.includes(`${path.sep}.git${path.sep}`) && !source.endsWith(`${path.sep}.git`) && !source.includes(`${path.sep}node_modules${path.sep}`) && !source.endsWith(`${path.sep}node_modules`) });
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(target, 'node_modules'), 'dir');
  for (const relative of targetFiles(bundle)) {
    const file = path.join(target, relative);
    if (fs.existsSync(file)) fs.rmSync(file, { recursive: true, force: true });
  }
}

function validateBundle(bundle) {
  if (bundle.run?.type !== 'ResearchRun' || bundle.run?.ingestionMode !== 'delivered') throw new Error('run contract failed');
  if (bundle.observations?.length !== 5) throw new Error('proof specimen must contain exactly five observations');
  if (bundle.observations.some(({ approvalState }) => approvalState !== 'candidate')) throw new Error('candidate-only boundary failed');
  if (bundle.run.repositoryActions?.some(({ status, executed }) => status !== 'proposed' || executed !== false)) throw new Error('repository action boundary failed');
  const genesis = bundle.stageAcks?.find(({ stage }) => stage === 'genesis');
  if (!genesis || genesis.status !== 'deferred' || genesis.governance?.allowedTransition !== false) throw new Error('Genesis boundary failed');

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(path.join(root, 'knowledge/schema/socratic-assessment.schema.json'), 'utf8'));
  const validate = ajv.compile(schema);
  for (const assessment of bundle.socraticAssessments ?? []) {
    if (!validate(assessment)) throw new Error(`Socratic schema failure: ${JSON.stringify(validate.errors)}`);
    if (!bundle.observations.some(({ id }) => id === assessment.observationId)) throw new Error(`unknown Socratic observation: ${assessment.observationId}`);
  }
}

function proveRun(workspace, bundle) {
  const relativeBundle = path.relative(workspace, input);
  const now = bundle.run.retrievalWindow.to;
  runNode(workspace, ['scripts/knowledge/ingest-nightly-run.mjs', relativeBundle], { KNOWLEDGE_NOW: now });
  runNode(workspace, ['scripts/knowledge/run-controls.mjs'], { KNOWLEDGE_NOW: now });
  runNode(workspace, ['scripts/knowledge/build-workbench.mjs'], { KNOWLEDGE_NOW: now });

  const expected = new Set(bundle.observations.map(({ id }) => id));
  const observed = jsonFiles(path.join(workspace, 'knowledge/observations')).map((file) => JSON.parse(fs.readFileSync(file, 'utf8'))).filter(({ id }) => expected.has(id));
  if (observed.length !== 5 || observed.some(({ approvalState }) => approvalState !== 'candidate')) throw new Error('candidate-only proof failed');
  const genesisAck = bundle.stageAcks.find(({ stage }) => stage === 'genesis');
  const genesisPath = path.join(workspace, 'knowledge/runs/stage-acks', `${safe(genesisAck.ackId)}.json`);
  const persistedGenesis = JSON.parse(fs.readFileSync(genesisPath, 'utf8'));
  if (persistedGenesis.status !== 'deferred' || persistedGenesis.governance?.allowedTransition !== false) throw new Error('deferred Genesis proof failed');
  const workbench = path.join(workspace, 'tools/graph-workbench/data.json');
  if (!fs.existsSync(workbench)) throw new Error('Graph Workbench projection missing');
  const workbenchText = fs.readFileSync(workbench, 'utf8');
  for (const id of expected) if (!workbenchText.includes(id)) throw new Error(`Graph Workbench missing ${id}`);
  return digest(proofTree(workspace));
}

function proveMalformedAtomicity(workspace, bundle) {
  const before = digest(proofTree(workspace));
  fs.writeFileSync(path.join(workspace, 'invalid-bundle.json'), JSON.stringify({ ...bundle, observations: [] }));
  const result = spawnSync(process.execPath, ['scripts/knowledge/ingest-nightly-run.mjs', 'invalid-bundle.json'], { cwd: workspace, encoding: 'utf8' });
  if (result.status === 0) throw new Error('malformed bundle unexpectedly succeeded');
  if (before !== digest(proofTree(workspace))) throw new Error('malformed bundle changed canonical state');
}

function proveLateReceiptRollback(workspace, bundle) {
  const before = digest(proofTree(workspace));
  const receipt = path.join(workspace, 'knowledge/receipts', `${safe(bundle.run.runId)}-ingest.json`);
  fs.mkdirSync(path.dirname(receipt), { recursive: true });
  fs.writeFileSync(receipt, '{"sentinel":"pre-existing-late-write-failure"}\n');
  const result = spawnSync(process.execPath, ['scripts/knowledge/ingest-nightly-run.mjs', path.relative(workspace, input)], { cwd: workspace, encoding: 'utf8', env: { ...process.env, KNOWLEDGE_NOW: bundle.run.retrievalWindow.to } });
  if (result.status === 0) throw new Error('late receipt collision unexpectedly succeeded');
  if (fs.readFileSync(receipt, 'utf8') !== '{"sentinel":"pre-existing-late-write-failure"}\n') throw new Error('pre-existing receipt was mutated');
  if (before !== digest(proofTree(workspace))) throw new Error('late receipt failure left partial canonical state');
}

const bundle = JSON.parse(fs.readFileSync(input, 'utf8'));
validateBundle(bundle);
const bundleSha256 = fileSha256(input);
for (const relative of targetFiles(bundle)) if (fs.existsSync(path.join(root, relative))) throw new Error(`proof specimen already exists on baseline: ${relative}`);

const workspaces = [fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-issue24-a-')), fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-issue24-b-'))];
let digests;
try {
  workspaces.forEach((workspace) => copyWorkspace(workspace, bundle));
  digests = workspaces.map((workspace) => proveRun(workspace, bundle));
  if (digests[0] !== digests[1]) throw new Error(`isolated proof digests differ: ${digests[0]} vs ${digests[1]}`);

  const malformed = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-issue24-malformed-'));
  try { copyWorkspace(malformed, bundle); proveMalformedAtomicity(malformed, bundle); } finally { fs.rmSync(malformed, { recursive: true, force: true }); }

  const late = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-issue24-late-'));
  try { copyWorkspace(late, bundle); proveLateReceiptRollback(late, bundle); } finally { fs.rmSync(late, { recursive: true, force: true }); }
} finally { workspaces.forEach((workspace) => fs.rmSync(workspace, { recursive: true, force: true })); }

const report = {
  status: 'passed',
  issue: 24,
  runId: bundle.run.runId,
  bundle: path.relative(root, input).replaceAll('\\', '/'),
  bundleSha256,
  observations: 5,
  candidateOnly: true,
  genesis: 'deferred',
  repositoryActionsExecuted: false,
  socraticAssessmentsValidated: (bundle.socraticAssessments ?? []).length,
  isolatedRunDigests: digests,
  deterministic: true,
  graphWorkbench: 'all-five-observations-present',
  malformedBundleAtomicity: 'passed',
  lateReceiptRollback: 'passed'
};
if (outputArg) { const out = path.resolve(root, outputArg); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`); }
console.log(JSON.stringify(report, null, 2));
