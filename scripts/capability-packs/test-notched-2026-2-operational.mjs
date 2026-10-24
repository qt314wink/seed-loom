#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const script = (name) => path.join(root, 'scripts', 'capability-packs', name);
const run = (name, args = []) => spawnSync(process.execPath, [script(name), ...args], { cwd: root, encoding: 'utf8' });
const fail = (message) => {
  console.error(`NOTCH_CAPABILITY_OPERATIONAL_TEST_FAILED: ${message}`);
  process.exit(1);
};

const firstQuery = run('query-notched-2026-2.mjs', ['--scene=scene:radial-field-bloom', '--adapter=adapter:shader-gallery']);
const secondQuery = run('query-notched-2026-2.mjs', ['--scene=scene:radial-field-bloom', '--adapter=adapter:shader-gallery']);
const firstHandoff = run('emit-notched-handoff.mjs');
const secondHandoff = run('emit-notched-handoff.mjs');
for (const result of [firstQuery, secondQuery, firstHandoff, secondHandoff]) {
  if (result.status !== 0) fail(result.stderr || 'operational command failed');
}
if (firstQuery.stdout !== secondQuery.stdout) fail('query output is not deterministic');
if (firstHandoff.stdout !== secondHandoff.stdout) fail('handoff output is not deterministic');
const query = JSON.parse(firstQuery.stdout);
const handoff = JSON.parse(firstHandoff.stdout);
if (query.pack.status !== 'candidate' || handoff.packReceipt.packStatus !== 'candidate') fail('operational output must retain candidate state');
if (query.pack.digest !== handoff.packReceipt.digest || handoff.request.pack.expectedDigest !== handoff.packReceipt.digest) fail('request, query, and handoff digests do not agree');
if (handoff.adapter.id !== 'adapter:shader-gallery' || handoff.request.target.repository !== 'MelodicBloom/shader-gallery') fail('unexpected target adapter or repository');
if (handoff.request.target.baseSha !== '93a0bd01aaefbed7094f803cfdf1134087302196') fail('concrete target snapshot drifted');
if (!handoff.workOrder.limitations.some((item) => item.includes('stateless WebGL2 approximation'))) fail('handoff must disclose the feedback limitation');
console.log(`PASS notch operational pull layer ${handoff.packReceipt.digest}`);
