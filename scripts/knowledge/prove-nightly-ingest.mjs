#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const inputArg = process.argv.slice(2).find((arg) => !arg.startsWith('--')) || 'ops/nightly-intake/2026-09-08.json';
const outputArg = process.argv.find((arg) => arg.startsWith('--out='))?.slice('--out='.length);

function loadBundle(bundlePath) {
  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  if (bundle.bundleType !== 'NightlyRunBundle' || bundle.review?.status !== 'reviewed') {
    throw new Error('proof requires a reviewed NightlyRunBundle');
  }
  if (bundle.observations?.length !== 5) throw new Error('proof bundle must contain exactly five observations');
  const sourceManifestSha256 = crypto.createHash('sha256').update(JSON.stringify(bundle.sources)).digest('hex');
  if (bundle.provenance?.sourceManifestSha256 !== sourceManifestSha256) {
    throw new Error('bundle provenance does not match its source manifest');
  }
  const genesis = bundle.stageAcks?.find(({ stage }) => stage === 'genesis');
  if (!genesis) throw new Error('proof bundle must contain a genesis acknowledgement');
  const proofNow = bundle.review?.reviewedAt
    || bundle.provenance?.collectedAt
    || bundle.run?.retrievalWindow?.from
    || '1970-01-01T00:00:00Z';
  if (Number.isNaN(Date.parse(proofNow))) throw new Error(`invalid proof timestamp: ${proofNow}`);
  return {
    bundle,
    input: bundlePath,
    bundleSha256: crypto.createHash('sha256').update(fs.readFileSync(bundlePath)).digest('hex'),
    proofNow,
    expectedObservationIds: bundle.observations.map(({ id }) => id).sort(),
    genesisAckId: genesis.ackId,
    identity: bundle.bundleId || bundle.run.runId
  };
}

function copyWorkspace(target) {
  fs.cpSync(root, target, {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}.git${path.sep}`) && !source.endsWith(`${path.sep}.git`)
      && !source.includes(`${path.sep}node_modules${path.sep}`)
      && !source.endsWith(`${path.sep}node_modules`)
      && !source.endsWith(`${path.sep}tools${path.sep}graph-workbench${path.sep}data.json`)
  });
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(target, 'node_modules'), 'dir');
}

function run(workspace, args, proofNow) {
  const result = spawnSync(process.execPath, args, {
    cwd: workspace,
    encoding: 'utf8',
    env: { ...process.env, KNOWLEDGE_NOW: proofNow }
  });
  if (result.status !== 0) {
    throw new Error(`${args.join(' ')} failed (${result.status}):\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

function files(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : entry.name.endsWith('.json') ? [file] : [];
  });
}

function withoutVolatile(value) {
  if (Array.isArray(value)) return value.map(withoutVolatile);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['createdAt', 'sha256'].includes(key))
    .map(([key, item]) => [key, withoutVolatile(item)]));
}

function proofDigest(workspace) {
  const roots = [
    'knowledge/sources', 'knowledge/observations', 'knowledge/relationships',
    'knowledge/runs', 'knowledge/receipts', 'knowledge/projections',
    'knowledge/candidates', 'knowledge/quarantine', 'tools/graph-workbench/data.json'
  ];
  const records = [];
  for (const relative of roots) {
    const absolute = path.join(workspace, relative);
    const paths = fs.existsSync(absolute) && fs.statSync(absolute).isDirectory() ? files(absolute) : [absolute];
    for (const file of paths) {
      if (!fs.existsSync(file)) continue;
      const relativeFile = path.relative(workspace, file).replaceAll('\\', '/');
      records.push({ path: relativeFile, record: withoutVolatile(JSON.parse(fs.readFileSync(file, 'utf8'))) });
    }
  }
  records.sort((a, b) => a.path.localeCompare(b.path));
  return crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex');
}

function canonicalEntries(workspace) {
  return ['knowledge/sources', 'knowledge/observations', 'knowledge/relationships', 'knowledge/runs']
    .flatMap((relative) => files(path.join(workspace, relative)))
    .map((file) => path.relative(workspace, file).replaceAll('\\', '/'));
}

function canonicalDigest(workspace) {
  const records = canonicalEntries(workspace).map((relative) => ({
    path: relative,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(workspace, relative))).digest('hex')
  }));
  records.sort((a, b) => a.path.localeCompare(b.path));
  return crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex');
}

function proveValidRun(workspace, context) {
  run(workspace, [path.join(workspace, 'scripts/knowledge/ingest-nightly-run.mjs'), context.input], context.proofNow);
  run(workspace, [path.join(workspace, 'scripts/knowledge/run-controls.mjs')], context.proofNow);
  run(workspace, [path.join(workspace, 'scripts/knowledge/build-workbench.mjs')], context.proofNow);
  const observations = files(path.join(workspace, 'knowledge/observations'))
    .filter((file) => context.expectedObservationIds.includes(JSON.parse(fs.readFileSync(file, 'utf8')).id));
  const accepted = observations.filter((file) => JSON.parse(fs.readFileSync(file, 'utf8')).approvalState !== 'candidate');
  const genesisPath = path.join(workspace, 'knowledge/runs/stage-acks', `${context.genesisAckId.replaceAll(':', '-')}.json`);
  const genesis = JSON.parse(fs.readFileSync(genesisPath, 'utf8'));
  if (observations.length !== 5 || accepted.length || genesis.status !== 'deferred' || genesis.governance?.allowedTransition !== false) {
    throw new Error('valid proof run violated candidate-only or deferred-Genesis controls');
  }
  return { proofDigest: proofDigest(workspace), canonicalDigest: canonicalDigest(workspace) };
}

function proveBundle(context, runCount = 2) {
  const workspaces = Array.from({ length: runCount }, () => fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-nightly-')));
  try {
    workspaces.forEach(copyWorkspace);
    const runs = workspaces.map((workspace) => proveValidRun(workspace, context));
    if (runs.some((one) => one.proofDigest !== runs[0].proofDigest || one.canonicalDigest !== runs[0].canonicalDigest)) {
      throw new Error(`proof digests differ across isolated runs for ${context.identity}`);
    }
    return runs[0];
  } finally {
    workspaces.forEach((workspace) => fs.rmSync(workspace, { recursive: true, force: true }));
  }
}

function runExpectingFailure(workspace, invalidBundle, expectedMessage) {
  const before = canonicalDigest(workspace);
  const invalid = path.join(workspace, 'invalid-bundle.json');
  fs.writeFileSync(invalid, JSON.stringify(invalidBundle, null, 2));
  const result = spawnSync(process.execPath, [path.join(workspace, 'scripts/knowledge/ingest-nightly-run.mjs'), invalid], { cwd: workspace, encoding: 'utf8' });
  if (result.status === 0 || !`${result.stderr}${result.stdout}`.includes(expectedMessage)) {
    throw new Error(`invalid bundle did not fail closed on: ${expectedMessage}`);
  }
  const after = canonicalDigest(workspace);
  if (before !== after) throw new Error('invalid bundle changed canonical state');
}

function proveLateFailure(workspace, context) {
  // Make the last planned write target's directory read-only so writes for
  // sources/observations/relationships/run/stageAcks succeed first, and the
  // final socratic-assessment write fails partway through — proving that the
  // ingest script rolls back every already-written file on a late failure.
  const blockedDir = path.join(workspace, 'knowledge', 'runs', 'socratic-assessments');
  fs.mkdirSync(blockedDir, { recursive: true });
  fs.chmodSync(blockedDir, 0o555);
  const before = canonicalDigest(workspace);
  try {
    const result = spawnSync(process.execPath, [path.join(workspace, 'scripts/knowledge/ingest-nightly-run.mjs'), context.input], { cwd: workspace, encoding: 'utf8' });
    if (result.status === 0 || !`${result.stderr}${result.stdout}`.includes('EACCES')) throw new Error('late write failure did not fail closed');
  } finally {
    fs.chmodSync(blockedDir, 0o755);
  }
  if (before !== canonicalDigest(workspace)) throw new Error('late write failure changed canonical state');
  for (const id of [...context.bundle.sources, ...context.bundle.observations, ...context.bundle.relationships].map(({ id }) => id)) {
    const dir = id.startsWith('source:') ? 'sources' : id.startsWith('obs:') ? 'observations' : 'relationships';
    if (fs.existsSync(path.join(workspace, 'knowledge', dir, `${id.replaceAll(':', '-')}.json`))) throw new Error('late write failure left a partial record');
  }
  fs.rmSync(blockedDir, { recursive: true, force: true });
}

const input = path.resolve(inputArg);
const context = loadBundle(input);

const first = proveBundle(context);
const second = proveBundle(context);
if (first.proofDigest !== second.proofDigest || first.canonicalDigest !== second.canonicalDigest) {
  throw new Error('the two isolated proof runs did not produce canonically identical digests');
}

const atomicityWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-nightly-atomicity-'));
const lateFailureWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-nightly-late-'));
try {
  copyWorkspace(atomicityWorkspace);
  run(atomicityWorkspace, [path.join(atomicityWorkspace, 'scripts/knowledge/ingest-nightly-run.mjs'), context.input], context.proofNow);
  runExpectingFailure(atomicityWorkspace, { ...context.bundle, observations: [] }, 'exactly five observations');
  runExpectingFailure(atomicityWorkspace, { ...context.bundle, socraticAssessments: [{ ...context.bundle.socraticAssessments[0], observationId: 'obs:unknown' }] }, 'unknown observation');

  // Use a separate, still-empty workspace for the late-write-failure proof so
  // the pre-write immutability guard does not short-circuit before the
  // permission-blocked write is reached.
  copyWorkspace(lateFailureWorkspace);
  proveLateFailure(lateFailureWorkspace, context);
} finally {
  fs.rmSync(atomicityWorkspace, { recursive: true, force: true });
  fs.rmSync(lateFailureWorkspace, { recursive: true, force: true });
}

const report = {
  status: 'passed',
  bundle: path.relative(root, context.input),
  bundleSha256: context.bundleSha256,
  provenance: context.bundle.provenance,
  sourceEvidence: 'Declared URL references only; source content was not captured or re-fetched by this proof.',
  observations: 5,
  proofDigest: first.proofDigest,
  canonicalDigest: first.canonicalDigest,
  malformedBundleAtomicity: 'passed',
  socraticReferenceValidation: 'passed',
  lateWriteAtomicity: 'passed',
  candidateOnly: true,
  genesis: 'deferred'
};

if (outputArg) {
  const output = path.resolve(outputArg);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify(report, null, 2));
