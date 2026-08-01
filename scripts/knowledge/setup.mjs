#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dirs = [
  'knowledge/entities','knowledge/sources','knowledge/observations','knowledge/relationships',
  'knowledge/patterns','knowledge/opportunities','knowledge/strategies','knowledge/experiments',
  'knowledge/runs','knowledge/receipts','knowledge/indexes','knowledge/quarantine','knowledge/archive'
];

for (const dir of dirs) fs.mkdirSync(path.join(root, dir), { recursive: true });

const envExample = path.join(root, '.env.knowledge.example');
if (!fs.existsSync(envExample)) {
  fs.writeFileSync(envExample, [
    '# Optional; local verification does not require paid services.',
    'SEED_LOOM_KNOWLEDGE_MODE=local',
    'SEED_LOOM_FAIL_ON_WARNING=false',
    'SEED_LOOM_MAX_SOURCE_AGE_DAYS=30',
    'SEED_LOOM_MIN_GENESIS_CONFIDENCE=0.82',
    'SEED_LOOM_MIN_ACTOR_CLASSES=2',
    'SEED_LOOM_MIN_EVIDENCE_DIMENSIONS=6',
    ''
  ].join('\n'));
}

console.log(JSON.stringify({
  status: 'ready',
  mode: 'local-first',
  createdDirectories: dirs,
  next: ['npm run knowledge:doctor','npm run knowledge:test','npm run knowledge:run']
}, null, 2));
