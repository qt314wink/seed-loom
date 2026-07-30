#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const observationsDir = path.join(root, 'knowledge', 'observations');
const now = new Date();
const sevenDays = 7 * 24 * 60 * 60 * 1000;
const current = [];
const baseline = [];
if (fs.existsSync(observationsDir)) {
  for (const file of fs.readdirSync(observationsDir).filter((name) => name.endsWith('.json'))) {
    const value = JSON.parse(fs.readFileSync(path.join(observationsDir, file), 'utf8'));
    const age = now - new Date(value.capturedAt);
    if (age <= sevenDays) current.push(value);
    else if (age <= five * sevenDays) baseline.push(value);
  }
}
const actorCounts = {};
for (const observation of current) {
  for (const actor of observation.actorRefs ?? []) actorCounts[actor] = (actorCounts[actor] ?? 0) + 1;
}
const report = {
  generatedAt: now.toISOString(),
  currentWindowCount: current.length,
  baselineCount: baseline.length,
  actorReferenceCounts: Object.fromEntries(Object.entries(actorCounts).sort()),
  note: 'Interpretation and strategy require protocol review; this script performs deterministic aggregation only.'
};
console.log(JSON.stringify(report, null, 2));
