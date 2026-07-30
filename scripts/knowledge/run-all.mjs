#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const commands = [
  ['node', ['scripts/knowledge/validate.mjs']],
  ['node', ['scripts/knowledge/check-orphans.mjs']],
  ['node', ['scripts/knowledge/build-index.mjs']],
  ['node', ['scripts/knowledge/graph-summary.mjs']]
];
for (const [command, args] of commands) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
