#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Baseline comparison window: five 7-day windows (35 days), matching the
// weekly cadence contract in protocols/pipeline-verification.md.
const BASELINE_WINDOWS = 5;

// Legacy observations may omit capturedAt; validation derives it from the
// dated record id. Mirror that derivation here so raw reads do not produce
// NaN ages and silently drop legacy records.
function dateFromId(id) {
  const m = String(id || '').match(/(20\d{2})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T00:00:00Z` : null;
}

const root = process.cwd();
const observationsDir = path.join(root, 'knowledge', 'observations');
const now = new Date();
const sevenDays = 7 * 24 * 60 * 60 * 1000;
const current = [];
const baseline = [];
const unclassified = [];
if (fs.existsSync(observationsDir)) {
  for (const file of fs.readdirSync(observationsDir).filter((name) => name.endsWith('.json'))) {
    const value = JSON.parse(fs.readFileSync(path.join(observationsDir, file), 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.type !== 'Observation') continue;
    // Note: new Date(null) is the epoch, not NaN — an explicit null check is
    // required so undated records are reported instead of silently ageing out.
    const rawCaptured = value.capturedAt ?? dateFromId(value.id ?? value.observationId);
    const age = rawCaptured == null ? NaN : now - new Date(rawCaptured);
    if (!Number.isFinite(age)) {
      unclassified.push(value.id ?? value.observationId ?? file);
      continue;
    }
    if (age <= sevenDays) current.push(value);
    else if (age <= BASELINE_WINDOWS * sevenDays) baseline.push(value);
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
  unclassifiedObservations: unclassified.sort(),
  actorReferenceCounts: Object.fromEntries(Object.entries(actorCounts).sort()),
  note: 'Interpretation and strategy require protocol review; this script performs deterministic aggregation only.'
};
console.log(JSON.stringify(report, null, 2));
