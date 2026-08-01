#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const env={...process.env,KNOWLEDGE_NOW:'2026-07-31T20:00:00Z'};
const first=spawnSync(process.execPath,['scripts/knowledge/integrity-engine.mjs'],{cwd:process.cwd(),encoding:'utf8',env});
assert.equal(first.status,0,first.stderr||first.stdout);
const firstReceipt=JSON.parse(fs.readFileSync('knowledge/receipts/integrity/latest.json','utf8'));
assert.equal(firstReceipt.status,'passed');
assert.equal(firstReceipt.boundaries.canonicalMutationAllowed,false);
assert.equal(firstReceipt.boundaries.knowledgeAcceptanceAllowed,false);
assert.equal(firstReceipt.boundaries.repositoryGenesisAllowed,false);
assert.equal(firstReceipt.boundaries.externalSpendAllowed,false);
assert.ok(firstReceipt.recordCount>0);
assert.equal(firstReceipt.provenanceFailures.length,0);
assert.equal(firstReceipt.governanceFailures.length,0);

const second=spawnSync(process.execPath,['scripts/knowledge/integrity-engine.mjs'],{cwd:process.cwd(),encoding:'utf8',env});
assert.equal(second.status,0,second.stderr||second.stdout);
const secondReceipt=JSON.parse(fs.readFileSync('knowledge/receipts/integrity/latest.json','utf8'));
assert.equal(firstReceipt.inventoryDigest,secondReceipt.inventoryDigest);
assert.equal(firstReceipt.receiptDigest,secondReceipt.receiptDigest);
console.log(`PASS Phase B integrity engine ${secondReceipt.receiptDigest}`);
