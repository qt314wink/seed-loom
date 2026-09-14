#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { digest } from './lib/canonical-json.mjs';

const root = process.cwd();
const dirs = ['sources','entities','observations','patterns','relationships','opportunities','strategies','experiments','runs'];

// Canonical record types use different stable identifier fields. Arrays of
// records (e.g. stage-ack files under knowledge/runs) are flattened so every
// emitted line is a single record. Records without any known identifier fall
// back to a deterministic content-derived id.
const ID_KEYS = ['id','runId','observationId','sourceId','ackId','bundleId','ledgerId','receiptId','patternId','opportunityId','strategyId','experimentId'];
function recordId(record) {
  for (const key of ID_KEYS) {
    if (typeof record[key] === 'string' && record[key]) return record[key];
  }
  return `anon:${digest(record).slice(0, 16)}`;
}

const records = [];
for (const dir of dirs) {
  const absolute = path.join(root, 'knowledge', dir);
  if (!fs.existsSync(absolute)) continue;
  for (const file of fs.readdirSync(absolute).filter((name) => name.endsWith('.json')).sort()) {
    const parsed = JSON.parse(fs.readFileSync(path.join(absolute, file), 'utf8'));
    const entries = Array.isArray(parsed) ? parsed : [parsed];
    for (const entry of entries) {
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) records.push(entry);
      else process.stderr.write(`emit-jsonl: skipped non-object entry in ${path.join('knowledge', dir, file)}\n`);
    }
  }
}

const keyedRecords = records.map((record) => ({ record, sortKey: recordId(record) }));
keyedRecords.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
process.stdout.write(keyedRecords.map(({ record }) => JSON.stringify(record)).join('\n') + (records.length ? '\n' : ''));
