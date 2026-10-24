#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const verifier = path.join(process.cwd(), 'scripts', 'capability-packs', 'verify-notched-2026-2.mjs');
const run = () => spawnSync(process.execPath, [verifier], { cwd: process.cwd(), encoding: 'utf8' });
const first = run();
const second = run();

if (first.status !== 0 || second.status !== 0) {
  console.error(first.stderr || second.stderr || 'capability-pack verifier failed');
  process.exit(1);
}

const firstReceipt = JSON.parse(first.stdout);
const secondReceipt = JSON.parse(second.stdout);
if (firstReceipt.digest !== secondReceipt.digest) {
  console.error(`non-deterministic pack digest: ${firstReceipt.digest} != ${secondReceipt.digest}`);
  process.exit(1);
}
if (firstReceipt.packStatus !== 'candidate') {
  console.error(`unexpected promotion state: ${firstReceipt.packStatus}`);
  process.exit(1);
}
if (firstReceipt.capabilityFamilyCount < 8 || firstReceipt.sceneRecipeCount < 5 || firstReceipt.adapterContractCount < 8) {
  console.error('capability pack is below its minimum bounded inventory');
  process.exit(1);
}
console.log(`PASS notch capability pack deterministic digest ${firstReceipt.digest}`);
