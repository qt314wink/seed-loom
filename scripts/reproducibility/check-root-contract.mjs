#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../../package.json', import.meta.url)));
const lock = JSON.parse(await readFile(new URL('../../package-lock.json', import.meta.url)));
const root = lock.packages?.[''];

assert.equal(lock.lockfileVersion, 3, 'the root lockfile must use lockfileVersion 3');
assert.ok(root, 'the root package must be represented in package-lock.json');
assert.equal(lock.name, manifest.name, 'lockfile and manifest names differ');
assert.equal(lock.version, manifest.version, 'lockfile and manifest versions differ');
assert.deepEqual(root.dependencies ?? {}, manifest.dependencies ?? {}, 'runtime dependency contract is stale');
assert.deepEqual(root.devDependencies ?? {}, manifest.devDependencies ?? {}, 'development dependency contract is stale');
console.log(`Root dependency contract is frozen by package-lock.json (${Object.keys(lock.packages).length} package records).`);
