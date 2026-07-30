#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const knowledge = path.join(root, 'knowledge');
const recordDirs = ['sources','entities','observations','patterns','relationships','opportunities','strategies','experiments','runs'];
const records = [];
for (const dir of recordDirs) {
  const absolute = path.join(knowledge, dir);
  if (!fs.existsSync(absolute)) continue;
  for (const file of fs.readdirSync(absolute).filter((name) => name.endsWith('.json')).sort()) {
    const relative = path.join('knowledge', dir, file).replaceAll('\\', '/');
    const value = JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
    records.push({ id: value.id ?? value.runId, type: value.type, path: relative });
  }
}
records.sort((a,b) => a.id.localeCompare(b.id));
const payload = JSON.stringify(records, null, 2) + '\n';
const digest = crypto.createHash('sha256').update(payload).digest('hex');
fs.mkdirSync(path.join(knowledge, 'indexes'), { recursive: true });
fs.writeFileSync(path.join(knowledge, 'indexes', 'records.json'), payload);
fs.mkdirSync(path.join(knowledge, 'receipts'), { recursive: true });
fs.writeFileSync(path.join(knowledge, 'receipts', 'index.sha256'), `${digest}  records.json\n`);
console.log(`INDEXED ${records.length} records ${digest}`);
