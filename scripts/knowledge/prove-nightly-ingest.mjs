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

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['createdAt', 'generatedAt', 'updatedAt', 'sha256'].includes(key))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => [key, canonicalize(item)]));
}

function listJson(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? listJson(file) : entry.name.endsWith('.json') ? [file] : [];
  });
}

function targetFiles(bundle) {
  const safe = (id) => id.replace(/[:/]/g, '-');
  return [
    ...bundle.sources.map(({ id }) => `knowledge/sources/${safe(id)}.json`),
    ...bundle.observations.map(({ id }) => `knowledge/observations/${safe(id)}.json`),
    ...bundle.relationships.map(({ id }) => `knowledge/relationships/${safe(id)}.json`),
    `knowledge/runs/${safe(bundle.run.runId)}.json`,
    ...bundle.stageAcks.map(({ ackId }) => `knowledge/runs/stage-acks/${safe(ackId)}.json`),
    `knowledge/receipts/${safe(bundle.run.runId)}-ingest.json`
  ];
}

function proofTree(workspace) {
  const roots = [
    'knowledge/sources', 'knowledge/observations', 'knowledge/relationships',
    'knowledge/runs', 'knowledge/receipts', 'knowledge/projections',
    'knowledge/candidates', 'knowledge/quarantine', 'tools/graph-workbench/data.json'
  ];
  const records = [];
  for (const relative of roots) {
    const absolute = path.join(workspace, relative);
    const files = fs.existsSync(absolute) && fs.statSync(absolute).isDirectory() ? listJson(absolute) : (fs.existsSync(absolute) ? [absolute] : []);
    for (const file of files) {
      records.push({ path: path.relative(workspace, file).replaceAll('\\', '/'), record: canonicalize(JSON.parse(fs.readFileSync(file, 'utf8'))) });
    }
  }
  records.sort((a, b) => a.path.localeCompare(b.path));
  return records;
}

function canonicalDigest(workspace) {
  return digest(proofTree(workspace));
}

function runNode(workspace, args, env = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, ...env }
  });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  if (result.status !== 0) throw new Error(`${args.join(' ')} failed with exit ${result.status}:\n${output}`);
  return output;
}

function copyCleanWorkspace(target, bundle) {
  fs.cpSync(root, target, {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}.git${path.sep}`) && !source.endsWith(`${path.sep}.git`)
      && !source.includes(`${path.sep}node_modules${path.sep}`) && !source.endsWith(`${path.sep}node_modules`)
  });
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(target, 'node_modules'), 'dir');
  for (const relative of targetFiles(bundle)) {
    const targetPath = path.join(target, relative);
    if (fs.existsSync(targetPath)) fs.rmSync(targetPath, { force: true });
  }
}

function loadAndValidateBundle() {
  const bundle = JSON.parse(fs.readFileSync(input, 'utf8'));
  if (bundle.bundleType !== undefined && bundle.bundleType !== 'NightlyRunBundle') throw new Error('invalid bundleType');
  if (bundle.run?.type !== 'ResearchRun' || bundle.run?.ingestionMode !== 'delivered') throw new Error('bundle run contract failed');
  if (bundle.observations?.length !== 5) throw new Error('proof bundle must contain exactly five observations');
  if (bundle.observations.some(({ approvalState }) => approvalState !== 'candidate')) throw new Error('proof bundle contains non-candidate observation');
  if (bundle.run.repositoryActions?.some(({ status, executed }) => status !== 'proposed' || executed !== false)) throw new Error('repository action boundary failed');
  const genesis = bundle.stageAcks?.find(({ stage }) => stage === 'genesis');
  if (!genesis || genesis.status !== 'deferred' || genesis.governance?.allowedTransition !== false) throw new Error('Genesis boundary failed');
  const sourceManifestSha256 = digest(bundle.sources);
  if (bundle.provenance?.sourceManifestSha256 && bundle.provenance.sourceManifestSha256 !== sourceManifestSha256) throw new Error('bundle source-manifest provenance mismatch');

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const socraticSchema = JSON.parse(fs.readFileSync(path.join(root, 'knowledge/schema/socratic-assessment.schema.json'), 'utf8'));
  const validateSocratic = ajv.compile(socraticSchema);
  for (const assessment of bundle.socraticAssessments ?? []) {
    if (!validateSocratic(assessment)) throw new Error(`Socratic assessment schema failure: ${JSON.stringify(validateSocratic.errors)}`);
    if (!bundle.observations.some(({ id }) => id === assessment.observationId)) throw new Error(`unknown Socratic observation: ${assessment.observationId}`);
  }
  return bundle;
}

function proveValidRun(workspace, bundle) {
  const relativeBundle = path.relative(workspace, input);
  const proofNow = bundle.review?.reviewedAt || bundle.provenance?.collectedAt || bundle.run.retrievalWindow.from;
  runNode(workspace, ['scripts/knowledge/ingest-nightly-run.mjs', relativeBundle], { KNOWLEDGE_NOW: proofNow });
  runNode(workspace, ['scripts/knowledge/run-controls.mjs'], { KNOWLEDGE_NOW: proofNow });
  runNode(workspace, ['scripts/knowledge/build-workbench.mjs'], { KNOWLEDGE_NOW: proofNow });

  const expected = new Set(bundle.observations.map(({ id }) => id));
  const observed = listJson(path.join(workspace, 'knowledge/observations'))
    .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))
    .filter(({ id }) => expected.has(id));
  if (observed.length !== 5 || observed.some(({ approvalState }) => approvalState !== 'candidate')) throw new Error('candidate-only proof failed');

  const genesis = JSON.parse(fs.readFileSync(path.join(workspace, 'knowledge/runs/stage-acks', `ack-${bundle.stageAcks.find(({ stage }) => stage === 'genesis').ackId.replaceAll(':', '-')}.json`), 'utf8'));
  if (genesis.status !== 'deferred' || genesis.governance?.allowedTransition !== false) throw new Error('deferred Genesis proof failed');

  const workbench = path.join(workspace, 'tools/graph-workbench/data.json');
  if (!fs.existsSync(workbench)) throw new Error('Graph Workbench projection missing');
  const workbenchData = JSON.parse(fs.readFileSync(workbench, 'utf8'));
  const workbenchText = JSON.stringify(workbenchData);
  for (const id of expected) if (!workbenchText.includes(id)) throw new Error(`Graph Workbench missing ${id}`);

  return { canonicalDigest: canonicalDigest(workspace), proofDigest: digest(proofTree(workspace)) };
}

function proveAtomicFailure(workspace, bundle) {
  const before = canonicalDigest(workspace);
  const invalidPath = path.join(workspace, 'invalid-bundle.json');
  fs.writeFileSync(invalidPath, JSON.stringify({ ...bundle, observations: [] }));
  const result = spawnSync(process.execPath, ['scripts/knowledge/ingest-nightly-run.mjs', 'invalid-bundle.json'], { cwd: workspace, encoding: 'utf8' });
  if (result.status === 0 || !`${result.stdout || ''}\n${result.stderr || ''}`.includes('exactly five observations')) throw new Error('malformed bundle did not fail closed');
  if (before !== canonicalDigest(workspace)) throw new Error('malformed bundle changed canonical state');
}

const bundle = loadAndValidateBundle();
const bundleSha256 = sha256File(input);
const targetSet = targetFiles(bundle);
for (const relative of targetSet) {
  if (fs.existsSync(path.join(root, relative))) throw new Error(`proof specimen is already ingested on baseline: ${relative}`);
}

const workspaces = [
  fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-issue24-a-')),
  fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-issue24-b-'))
];
let runs;
try {
  workspaces.forEach((workspace) => copyCleanWorkspace(workspace, bundle));
  runs = workspaces.map((workspace) => proveValidRun(workspace, bundle));
  if (runs[0].canonicalDigest !== runs[1].canonicalDigest || runs[0].proofDigest !== runs[1].proofDigest) throw new Error('two isolated real ingests produced different governed digests');

  const atomicityWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-issue24-atomicity-'));
  try {
    copyCleanWorkspace(atomicityWorkspace, bundle);
    proveAtomicFailure(atomicityWorkspace, bundle);
  } finally {
    fs.rmSync(atomicityWorkspace, { recursive: true, force: true });
  }
} finally {
  workspaces.forEach((workspace) => fs.rmSync(workspace, { recursive: true, force: true }));
}

const report = {
  status: 'passed',
  issue: 24,
  bundle: path.relative(root, input).replaceAll('\\', '/'),
  bundleSha256,
  runId: bundle.run.runId,
  observations: 5,
  candidateOnly: true,
  genesis: 'deferred',
  repositoryActionsExecuted: false,
  socraticAssessmentsValidated: (bundle.socraticAssessments ?? []).length,
  graphWorkbench: 'present-and-identifies-all-five-observations',
  malformedBundleAtomicity: 'passed',
  isolatedRuns: runs,
  deterministic: true
};
if (outputArg) {
  const output = path.resolve(root, outputArg);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify(report, null, 2));
