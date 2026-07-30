#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dirs = ['entities','observations','patterns','relationships','opportunities','experiments','runs'];
const records = new Map();
const relationships = [];
for (const dir of dirs) {
  const absolute = path.join(root, 'knowledge', dir);
  if (!fs.existsSync(absolute)) continue;
  for (const file of fs.readdirSync(absolute).filter((name) => name.endsWith('.json'))) {
    const record = JSON.parse(fs.readFileSync(path.join(absolute, file), 'utf8'));
    const id = record.id ?? record.runId;
    if (id) records.set(id, record);
    if (record.type === 'Relationship') relationships.push(record);
  }
}
let failures = 0;
for (const rel of relationships.sort((a,b) => a.id.localeCompare(b.id))) {
  for (const endpoint of ['from','to']) {
    if (!records.has(rel[endpoint])) {
      console.error(`ORPHAN ${rel.id} ${endpoint}=${rel[endpoint]}`);
      failures += 1;
    }
  }
}
if (failures) process.exit(1);
console.log(`GRAPH_OK ${relationships.length} relationships`);
