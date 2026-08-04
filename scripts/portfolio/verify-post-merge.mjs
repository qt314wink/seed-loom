#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

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

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function gitValue(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function runCommand(command, args, index) {
  return new Promise((resolveRun) => {
    const label = `${String(index + 1).padStart(2, '0')}-${[command, ...args].join('-').replace(/[^a-zA-Z0-9.-]+/g, '-')}`;
    const stdoutPath = resolve(stageLogDir, `${label}.stdout.log`);
    const stderrPath = resolve(stageLogDir, `${label}.stderr.log`);
    let stdout = '';
    let stderr = '';
    let settled = false;
    const startedAt = new Date().toISOString();

    const finish = async ({ code, signal, error = null }) => {
      if (settled) return;
      settled = true;
      if (error) stderr += `${error.stack || error.message}\n`;
      await Promise.all([
        writeFile(stdoutPath, stdout),
        writeFile(stderrPath, stderr)
      ]);
      resolveRun({
        command: [command, ...args].join(' '),
        startedAt,
        completedAt: new Date().toISOString(),
        status: code === 0 && !error ? 'passed' : 'failed',
        exitCode: code,
        signal,
        stdoutLog: relative(process.cwd(), stdoutPath),
        stderrLog: relative(process.cwd(), stderrPath),
        stdoutSha256: sha256(stdout),
        stderrSha256: sha256(stderr),
        stdoutTail: stdout.slice(-12000),
        stderrTail: stderr.slice(-12000)
      });
    };

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
    child.on('error', (error) => finish({ code: null, signal: null, error }));
    child.on('close', (code, signal) => finish({ code, signal }));
  });
}

const results = [];
for (let index = 0; index < commands.length; index += 1) {
  const [command, args] = commands[index];
  const result = await runCommand(command, args, index);
  results.push(result);
  if (result.status !== 'passed') break;
}

const branch = process.env.GITHUB_REF_NAME || gitValue(['branch', '--show-current']);
const commit = process.env.GITHUB_SHA || gitValue(['rev-parse', 'HEAD']);
const passed = results.length === commands.length && results.every((result) => result.status === 'passed');

const deterministicProof = {
  type: 'PostMergeVerificationProof',
  schemaVersion: '1.0.0',
  branch,
  commit,
  results: results.map((result) => ({
    command: result.command,
    status: result.status,
    exitCode: result.exitCode,
    signal: result.signal,
    stdoutSha256: result.stdoutSha256,
    stderrSha256: result.stderrSha256
  })),
  passed
};

const receipt = {
  type: 'PostMergeVerificationReceipt',
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  branch,
  commit,
  results,
  passed,
  proofDigest: sha256(JSON.stringify(deterministicProof))
};
receipt.receiptDigest = sha256(JSON.stringify(receipt));

const out = resolve(receiptDir, 'latest.json');
await writeFile(out, JSON.stringify(receipt, null, 2) + '\n');
console.log(`\nWrote ${out}`);
console.log(`Proof digest: ${receipt.proofDigest}`);
console.log(`Overall result: ${receipt.passed ? 'PASSED' : 'FAILED'}`);
if (!receipt.passed) process.exitCode = 1;
