#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const commands = [
  ['npm', ['ci']],
  ['npm', ['run', 'knowledge:setup']],
  ['npm', ['run', 'knowledge:controls']],
  ['npm', ['run', 'knowledge:verify']],
  ['npm', ['run', 'knowledge:verify']],
  ['npm', ['run', 'knowledge:graph:build']],
  ['npm', ['run', 'build']]
];
const results = [];
for (const [command, args] of commands) {
  const startedAt = new Date().toISOString();
  const run = spawnSync(command, args, { encoding: 'utf8', shell: false });
  const completedAt = new Date().toISOString();
  results.push({
    command: [command, ...args].join(' '),
    startedAt,
    completedAt,
    status: run.status === 0 ? 'passed' : 'failed',
    exitCode: run.status,
    stdoutTail: (run.stdout || '').slice(-12000),
    stderrTail: (run.stderr || '').slice(-12000)
  });
  if (run.status !== 0) break;
}
const receipt = {
  type: 'PostMergeVerificationReceipt',
  generatedAt: new Date().toISOString(),
  branch: process.env.GITHUB_REF_NAME || null,
  commit: process.env.GITHUB_SHA || null,
  results,
  passed: results.length === commands.length && results.every(r => r.status === 'passed')
};
const canonical = JSON.stringify(receipt);
receipt.digest = createHash('sha256').update(canonical).digest('hex');
await mkdir(resolve('knowledge/receipts/post-merge'), { recursive: true });
const out = resolve('knowledge/receipts/post-merge/latest.json');
await writeFile(out, JSON.stringify(receipt, null, 2) + '\n');
console.log(`Wrote ${out}`);
if (!receipt.passed) process.exitCode = 1;
