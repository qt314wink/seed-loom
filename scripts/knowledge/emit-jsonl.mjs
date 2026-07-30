#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dirs = ['entities','observations','patterns','relationships','opportunities','experiments','runs'];
const records = [];
for (const dir of dirs) {
  const absolute = path.join(root, 'knowledge', dir);
  if (!fs.existsSync(absolute)) continue;
  for (const file of fs.readdirSync(absolute).filter((name) => name.endsWith('.json')).sort()) {
    records.push(JSON.parse(fs.readFileSync(path.join(absolute, file), 'utf8')));
  }
}
records.sort((a,b) => (a.id ?? a.runId).localeCompare(b.id ?? b.runId));
process.stdout.write(records.map((record) => JSON.stringify(record)).join('\n') + (records.length ? '\n' : ''));
