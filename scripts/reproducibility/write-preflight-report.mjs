#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trimEnd();
const names = ['install', 'contract', 'typescript', 'build', 'visual', 'schemas', 'artifact'];
const gates = Object.fromEntries(names.map((name) => [name, process.env[name.toUpperCase()] || 'not-run']));
const changes = git('status', '--porcelain=v1', '--untracked-files=all').split('\n').filter(Boolean);
const report = {
  type: 'SnowflakePreflightReport',
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  repository: process.env.GITHUB_REPOSITORY || null,
  branch: process.env.GITHUB_REF_NAME || git('branch', '--show-current'),
  commit: process.env.GITHUB_SHA || git('rev-parse', 'HEAD'),
  git: { clean: changes.length === 0, changes },
  gates,
  passed: changes.length === 0 && Object.values(gates).every((value) => value === 'success')
};
await mkdir('.reproducibility', { recursive: true });
await writeFile('.reproducibility/snowflake-preflight.json', `${JSON.stringify(report, null, 2)}\n`);
await appendFile(process.env.GITHUB_STEP_SUMMARY || '/dev/null', [
  '## Snowflake preflight',
  '',
  `Git state: **${report.git.clean ? 'clean' : 'dirty'}**`,
  ...Object.entries(gates).map(([name, outcome]) => `- ${name}: **${outcome}**`),
  '',
  `Overall: **${report.passed ? 'PASS' : 'FAIL'}**`
].join('\n'));
console.log(`Snowflake preflight: ${report.passed ? 'PASS' : 'FAIL'}`);
