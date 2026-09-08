#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const inputArg = process.argv.find((arg) => !arg.startsWith('--')) || 'ops/nightly-intake/2026-09-08.json';
const outputArg = process.argv.find((arg) => arg.startsWith('--out='))?.slice('--out='.length);
const input = path.resolve(inputArg);
const bundle = JSON.parse(fs.readFileSync(input, 'utf8'));
const proofNow = '2026-09-08T00:00:00Z';

if (bundle.bundleType !== 'NightlyRunBundle' || bundle.review?.status !== 'reviewed') {
  throw new Error('proof requires a reviewed NightlyRunBundle');
}
if (bundle.observations?.length !== 5) throw new Error('proof bundle must contain exactly five observations');
const bundleSha256 = crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex');

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

function run(workspace, args) {
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
    .filter(([key]) => !['createdAt'].includes(key))
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
      const relativeFile = path.relative(workspace, file).replaceAll('\\', '/');
      records.push({ path: relativeFile, record: withoutVolatile(JSON.parse(fs.readFileSync(file, 'utf8'))) });
    }
  }
  records.sort((a, b) => a.path.localeCompare(b.path));
  return crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex');
}

function canonicalDigest(workspace) {
  const records = [];
  for (const relative of ['knowledge/sources', 'knowledge/observations', 'knowledge/relationships', 'knowledge/runs']) {
    for (const file of files(path.join(workspace, relative))) {
      records.push({
        path: path.relative(workspace, file).replaceAll('\\', '/'),
        sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
      });
    }
  }
  records.sort((a, b) => a.path.localeCompare(b.path));
  return crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex');
}

function proveValidRun(workspace) {
  run(workspace, [path.join(workspace, 'scripts/knowledge/ingest-nightly-run.mjs'), input]);
  run(workspace, [path.join(workspace, 'scripts/knowledge/run-controls.mjs')]);
  run(workspace, [path.join(workspace, 'scripts/knowledge/build-workbench.mjs')]);
  const observations = files(path.join(workspace, 'knowledge/observations'))
    .filter((file) => file.includes('nightly-2026-09-08'));
  const accepted = observations.filter((file) => JSON.parse(fs.readFileSync(file)).approvalState !== 'candidate');
  const genesis = JSON.parse(fs.readFileSync(path.join(workspace, 'knowledge/runs/stage-acks/ack-nightly-2026-09-08-genesis.json')));
  if (observations.length !== 5 || accepted.length || genesis.status !== 'deferred' || genesis.governance.allowedTransition !== false) {
    throw new Error('valid proof run violated candidate-only or deferred-Genesis controls');
  }
  return { proofDigest: proofDigest(workspace), canonicalDigest: canonicalDigest(workspace) };
}

function proveInvalidRun(workspace) {
  const before = canonicalDigest(workspace);
  const invalid = path.join(workspace, 'invalid-bundle.json');
  fs.writeFileSync(invalid, JSON.stringify({ ...bundle, observations: [] }, null, 2));
  const result = spawnSync(process.execPath, [path.join(workspace, 'scripts/knowledge/ingest-nightly-run.mjs'), invalid], {
    cwd: workspace, encoding: 'utf8'
  });
  if (result.status === 0 || !`${result.stderr}${result.stdout}`.includes('exactly five observations')) {
    throw new Error('invalid bundle did not fail closed');
  }
  const after = canonicalDigest(workspace);
  if (before !== after) throw new Error('invalid bundle changed canonical state');
}

const workspaces = [fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-nightly-')), fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-nightly-'))];
try {
  workspaces.forEach(copyWorkspace);
  const first = proveValidRun(workspaces[0]);
  const second = proveValidRun(workspaces[1]);
  if (first.proofDigest !== second.proofDigest || first.canonicalDigest !== second.canonicalDigest) {
    throw new Error(`proof digests differ: ${first.proofDigest} vs ${second.proofDigest}`);
  }
  proveInvalidRun(workspaces[0]);
  const report = {
    status: 'passed',
    bundle: path.relative(root, input),
    bundleSha256,
    provenance: bundle.provenance,
    observations: 5,
    proofDigest: first.proofDigest,
    canonicalDigest: first.canonicalDigest,
    invalidBundleAtomicity: 'passed',
    candidateOnly: true,
    genesis: 'deferred'
  };
  if (outputArg) {
    const output = path.resolve(outputArg);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  workspaces.forEach((workspace) => fs.rmSync(workspace, { recursive: true, force: true }));
}
