#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const deployable = [
  /^(index\.html|package\.json|package-lock\.json|playwright\.config\.ts|tsconfig\.json|vercel\.json)$/,
  /^(src|packages\/svg-filter-atlas|tokens)\//
];

try {
  const before = process.env.VERCEL_GIT_PREVIOUS_SHA || 'HEAD^';
  const changed = execFileSync('git', ['diff', '--name-only', before, 'HEAD'], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  const shouldBuild = changed.some((path) => deployable.some((pattern) => pattern.test(path)));
  console.log(shouldBuild
    ? `Deployable change detected; building (${changed.length} changed paths).`
    : `No deployable change detected; skipping build (${changed.length} changed paths).`);
  process.exit(shouldBuild ? 1 : 0);
} catch (error) {
  console.error(`Unable to establish the changed-path boundary; building safely. ${error.message}`);
  process.exit(1);
}
