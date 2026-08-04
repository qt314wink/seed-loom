#!/usr/bin/env node
import { spawn } from 'node:child_process';
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

const receiptDir = resolve('knowledge/receipts/post-merge');
const stageLogDir = resolve(receiptDir, 'logs');
await mkdir(stageLogDir, { recursive: true });

function runCommand(command, args, index) {
  return new Promise((resolveRun) => {
    const label = `${String(index + 1).padStart(2, '0')}-${[command, ...args].join('-').replace(/[^a-zA-Z0-9.-]+/g, '-')}`;
    const stdoutPath = resolve(stageLogDir, `${label}.stdout.log`);
    const stderrPath = resolve(stageLogDir, `${label}.stderr.log`);
    let stdout = '';
    let stderr = '';
    const startedAt = new Date().toISOString();

    console.log(`\n==> ${[command, ...args].join(' ')}`);
    const child = spawn(command, args, {
      shell: false,
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe']
    });

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.on('error', async (error) => {
      stderr += `${error.stack || error.message}\n`;
      await Promise.all([
        writeFile(stdoutPath, stdout),
        writeFile(stderrPath, stderr)
      ]);
      resolveRun({
        command: [command, ...args].join(' '),
        startedAt,
        completedAt: new Date().toISOString(),
        status: 'failed',
        exitCode: null,
        signal: null,
        stdoutLog: stdoutPath,
        stderrLog: stderrPath,
        stdoutTail: stdout.slice(-12000),
        stderrTail: stderr.slice(-12000)
      });
    });
    child.on('close', async (code, signal) => {
      await Promise.all([
        writeFile(stdoutPath, stdout),
        writeFile(stderrPath, stderr)
      ]);
      resolveRun({
        command: [command, ...args].join(' '),
        startedAt,
        completedAt: new Date().toISOString(),
        status: code === 0 ? 'passed' : 'failed',
        exitCode: code,
        signal,
        stdoutLog: stdoutPath,
        stderrLog: stderrPath,
        stdoutTail: stdout.slice(-12000),
        stderrTail: stderr.slice(-12000)
      });
    });
  });
}

const results = [];
for (let index = 0; index < commands.length; index += 1) {
  const [command, args] = commands[index];
  const result = await runCommand(command, args, index);
  results.push(result);
  if (result.status !== 'passed') break;
}

const receipt = {
  type: 'PostMergeVerificationReceipt',
  generatedAt: new Date().toISOString(),
  branch: process.env.GITHUB_REF_NAME || null,
  commit: process.env.GITHUB_SHA || null,
  results,
  passed: results.length === commands.length && results.every((result) => result.status === 'passed')
};
const canonical = JSON.stringify(receipt);
receipt.digest = createHash('sha256').update(canonical).digest('hex');
const out = resolve(receiptDir, 'latest.json');
await writeFile(out, JSON.stringify(receipt, null, 2) + '\n');
console.log(`\nWrote ${out}`);
console.log(`Overall result: ${receipt.passed ? 'PASSED' : 'FAILED'}`);
if (!receipt.passed) process.exitCode = 1;
