#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const knowledge = path.join(root, 'knowledge');
const recordDirs = ['sources','entities','observations','patterns','relationships','opportunities','strategies','experiments','runs'];
const records = [];

const stableFallbackId = (relative, index) => `aux:${crypto.createHash('sha256').update(`${relative}#${index}`).digest('hex').slice(0, 20)}`;
const idOf = (value, relative, index) => value.id ?? value.runId ?? value.observationId ?? value.sourceId ?? value.relationshipId ?? value.ackId ?? value.assessmentId ?? value.bundleId ?? value.ledgerId ?? stableFallbackId(relative, index);
const typeOf = (value, dir) => value.type ?? ({sources:'Source',entities:'Actor',observations:'ObservationCandidate',patterns:'Pattern',relationships:'Relationship',opportunities:'Opportunity',strategies:'Strategy',experiments:'Experiment',runs:'Run'}[dir] ?? 'AuxiliaryRecord');

function expand(value, dir, relative) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.sources) && value.bundleId) {
    return value.sources.map((source) => ({ ...source, id: source.id ?? source.sourceId, type: source.type ?? 'Source', parentBundleRef: value.bundleId }));
  }
  if (Array.isArray(value.observations) && value.window) {
    return value.observations.map((observation) => ({ ...observation, type: observation.type ?? 'ObservationCandidate', parentBriefRef: `${value.window.start}:${value.window.end}` }));
  }
  if (Array.isArray(value.cycles) && value.ledgerId) {
    return [{ id: value.ledgerId, type: 'BackfillLedger', cycleCount: value.cycles.length, status: 'provenance-ledger' }];
  }
  return [value];
}

for (const dir of recordDirs) {
  const absolute = path.join(knowledge, dir);
  if (!fs.existsSync(absolute)) continue;
  for (const file of fs.readdirSync(absolute).filter((name) => name.endsWith('.json')).sort()) {
    const relative = path.join('knowledge', dir, file).replaceAll('\\', '/');
    const value = JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
    const expanded = expand(value, dir, relative);
    for (const [index, record] of expanded.entries()) {
      const id = idOf(record, relative, index);
      records.push({
        id,
        type: typeOf(record, dir),
        path: expanded.length > 1 ? `${relative}#${id}` : relative,
        containerPath: relative,
        canonical: true
      });
    }
  }
}
records.sort((a,b) => a.id.localeCompare(b.id) || a.path.localeCompare(b.path));
const payload = JSON.stringify(records, null, 2) + '\n';
const digest = crypto.createHash('sha256').update(payload).digest('hex');
fs.mkdirSync(path.join(knowledge, 'indexes'), { recursive: true });
fs.writeFileSync(path.join(knowledge, 'indexes', 'records.json'), payload);
fs.mkdirSync(path.join(knowledge, 'receipts'), { recursive: true });
fs.writeFileSync(path.join(knowledge, 'receipts', 'index.sha256'), `${digest}  records.json\n`);
console.log(`INDEXED ${records.length} records ${digest}`);
