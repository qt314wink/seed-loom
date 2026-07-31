#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const now = process.env.KNOWLEDGE_NOW || '2026-07-31T00:00:00Z';
const canonicalDirs = ['sources','entities','observations','relationships','patterns','opportunities','strategies','experiments','runs'];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
function digest(value) { return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex'); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function idOf(value, relative, index) {
  return value.id ?? value.runId ?? value.observationId ?? value.sourceId ?? value.relationshipId ?? value.ackId ?? value.assessmentId ?? value.bundleId ?? value.ledgerId ?? `aux:${digest(`${relative}#${index}`).slice(0,20)}`;
}
function expand(value) {
  if (Array.isArray(value)) return value;
  if (value.bundleId && Array.isArray(value.sources)) return value.sources.map((source) => ({ ...source, id: source.id ?? source.sourceId, type: source.type ?? 'Source', parentBundleRef: value.bundleId }));
  if (value.window && Array.isArray(value.observations)) return value.observations.map((observation) => ({ ...observation, type: observation.type ?? 'ObservationCandidate', parentBriefRef: `${value.window.start}:${value.window.end}` }));
  if (value.ledgerId && Array.isArray(value.cycles)) return [{ id: value.ledgerId, type: 'BackfillLedger', cycles: value.cycles }];
  return [value];
}
function run(name, args) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', env: { ...process.env, KNOWLEDGE_NOW: now } });
  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  const digestMatch = stdout.match(/DIGEST\s+[^\s]+\s+([0-9a-f]{64})/);
  return {
    name,
    command: [process.execPath, ...args].join(' '),
    startedAt: now,
    completedAt: now,
    exitCode: result.status ?? 2,
    stdout,
    stderr,
    outputDigest: digestMatch?.[1] ?? null
  };
}
function inventory() {
  const records = [];
  for (const dir of canonicalDirs) {
    for (const file of walk(path.join(root, 'knowledge', dir))) {
      const relative = path.relative(root, file).replaceAll('\\','/');
      try {
        const value = readJson(file);
        const expanded = expand(value);
        for (const [index, record] of expanded.entries()) {
          const id = idOf(record, relative, index);
          records.push({
            path: expanded.length > 1 ? `${relative}#${id}` : relative,
            containerPath: relative,
            type: record.type || 'AuxiliaryRecord',
            id,
            sha256: digest(record)
          });
        }
      } catch (error) {
        records.push({ path: relative, containerPath: relative, type: 'ParseFailure', id: null, error: error.message });
      }
    }
  }
  return records.sort((a,b) => a.path.localeCompare(b.path));
}
function provenanceChecks(records) {
  const failures = [];
  const ids = new Set(records.map((record) => record.id).filter(Boolean));
  for (const record of records) {
    if (record.error) failures.push({code:'JSON_PARSE_FAILURE',path:record.path,detail:record.error});
    if (!record.id && record.type !== 'ParseFailure') failures.push({code:'MISSING_STABLE_ID',path:record.path});
  }
  for (const file of walk(path.join(root,'knowledge','observations'))) {
    const value = readJson(file);
    for (const record of expand(value)) {
      for (const ref of record.sourceRefs || []) if (!ids.has(ref)) failures.push({code:'UNRESOLVED_SOURCE_REF',path:path.relative(root,file).replaceAll('\\','/'),ref});
    }
  }
  for (const file of walk(path.join(root,'knowledge','relationships'))) {
    const value = readJson(file);
    for (const record of expand(value)) {
      for (const ref of [record.from,record.to,...(record.evidenceRefs || [])].filter(Boolean)) if (!ids.has(ref)) failures.push({code:'UNRESOLVED_RELATIONSHIP_REF',path:path.relative(root,file).replaceAll('\\','/'),ref});
    }
  }
  return failures.sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
function governanceChecks() {
  const file = path.join(root,'knowledge','config','governance.json');
  if (!fs.existsSync(file)) return [{code:'MISSING_GOVERNANCE_CONFIG',path:'knowledge/config/governance.json'}];
  const governance = readJson(file);
  const failures = [];
  if (governance.automation?.mayAcceptKnowledge !== false) failures.push({code:'AUTOMATION_ACCEPTANCE_NOT_DENIED'});
  if (governance.automation?.dailyGenesisState !== 'deferred') failures.push({code:'DAILY_GENESIS_NOT_DEFERRED'});
  if (governance.automation?.maySpendMoney !== false) failures.push({code:'AUTOMATION_SPEND_NOT_DENIED'});
  if (governance.notebooks?.canonicalWriteAllowed !== false) failures.push({code:'NOTEBOOK_CANONICAL_WRITE_NOT_DENIED'});
  return failures;
}

const records = inventory();
const stages = [
  run('schema',['scripts/knowledge/validate.mjs']),
  run('contract',['scripts/knowledge/test-contract-phase-a.mjs']),
  run('source-independence',['scripts/knowledge/test-source-independence.mjs','--now',now]),
  run('claim-identity',['scripts/knowledge/test-semantic-duplicates.mjs'])
];
const provenanceFailures = provenanceChecks(records);
const governanceFailures = governanceChecks();
const status = stages.every((stage) => stage.exitCode === 0) && provenanceFailures.length === 0 && governanceFailures.length === 0 ? 'passed' : 'failed';
const core = {
  receiptId: `integrity:${now.replace(/[^0-9]/g,'').slice(0,14)}`,
  type: 'KnowledgeIntegrityReceipt',
  engineVersion: '0.4.0',
  generatedAt: now,
  status,
  recordCount: records.length,
  inventoryDigest: digest(records),
  stages: stages.map((stage) => ({
    name:stage.name,
    command:stage.command,
    exitCode:stage.exitCode,
    startedAt:stage.startedAt,
    completedAt:stage.completedAt,
    outputDigest:stage.outputDigest,
    stdoutDigest:digest(stage.stdout),
    stderrDigest:digest(stage.stderr)
  })),
  sourceIndependence: {
    status: stages.find((stage) => stage.name === 'source-independence')?.exitCode === 0 ? 'passed' : 'failed',
    reportLocation: 'knowledge/receipts/source-independence/',
    reviewQueueLocation: 'knowledge/candidates/source-independence/',
    baseConfidenceMutationAllowed: false,
    automaticMergeAllowed: false
  },
  claimIdentity: {
    status: stages.find((stage) => stage.name === 'claim-identity')?.exitCode === 0 ? 'passed' : 'failed',
    reportLocation: 'knowledge/candidates/claim-identity/',
    receiptLocation: 'knowledge/receipts/claim-identity/',
    fingerprintMethod: 'deterministic-normalized-claim-tuple-sha256',
    automaticMergeAllowed: false,
    canonicalObservationMutationAllowed: false,
    confidenceMutationAllowed: false,
    negationMayCollapseIntoAffirmation: false
  },
  provenanceFailures,
  governanceFailures,
  boundaries:{canonicalMutationAllowed:false,knowledgeAcceptanceAllowed:false,repositoryGenesisAllowed:false,externalSpendAllowed:false}
};
const receipt = { ...core, receiptDigest: digest(core) };
fs.mkdirSync(path.join(root,'knowledge','receipts','integrity'), { recursive: true });
const out = path.join(root,'knowledge','receipts','integrity','latest.json');
fs.writeFileSync(out, JSON.stringify(stable(receipt),null,2) + '\n');
console.log(JSON.stringify(receipt,null,2));
if (status !== 'passed') process.exit(1);
