#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const relationshipDir = path.join(root, 'knowledge', 'relationships');
const counts = {};
let total = 0;
if (fs.existsSync(relationshipDir)) {
  for (const file of fs.readdirSync(relationshipDir).filter((name) => name.endsWith('.json')).sort()) {
    const rel = JSON.parse(fs.readFileSync(path.join(relationshipDir, file), 'utf8'));
    counts[rel.predicate] = (counts[rel.predicate] ?? 0) + 1;
    total += 1;
  }
}
console.log(JSON.stringify({ totalRelationships: total, byPredicate: Object.fromEntries(Object.entries(counts).sort()) }, null, 2));
