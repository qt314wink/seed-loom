#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { normalizeNightlyBundle } from './normalize-nightly-bundle.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inputArg = args.find((arg) => !arg.startsWith('--'));
if (!inputArg) {
  console.error('usage: node scripts/knowledge/ingest-nightly-run.mjs <run-bundle.json> [--dry-run]');
  process.exit(2);
}

const root = process.cwd();
const schemaDir = path.join(root, 'knowledge', 'schema');
const rawBundle = JSON.parse(fs.readFileSync(path.resolve(inputArg), 'utf8'));
const bundle = normalizeNightlyBundle(rawBundle);

if (bundle.observations.length !== 5) throw new Error('nightly bundle must contain exactly five observations');
if (bundle.run.type !== 'ResearchRun') throw new Error('invalid run type');
if (bundle.run.ingestionMode !== 'delivered') throw new Error('nightly automation ingest requires ingestionMode=delivered');
if (bundle.observations.some((observation) => observation.approvalState !== 'candidate')) {
  throw new Error('daily intake may only create candidate observations');
}
if (bundle.run.repositoryActions?.some((action) => action.executed !== false || action.status !== 'proposed')) {
  throw new Error('daily intake repository actions must remain unexecuted proposals');
}

const expectedStages = ['collect', 'vet', 'normalize', 'observe', 'inquire', 'interpret', 'relate', 'pattern', 'opportunity', 'strategy', 'experiment', 'genesis', 'publish'];
const actualStages = bundle.stageAcks.map((ack) => ack.stage);
if (actualStages.length !== expectedStages.length || new Set(actualStages).size !== expectedStages.length || expectedStages.some((stage) => !actualStages.includes(stage))) {
  throw new Error(`stage acknowledgements must contain exactly: ${expectedStages.join(', ')}`);
}
const genesisAck = bundle.stageAcks.find((ack) => ack.stage === 'genesis');
if (genesisAck?.status !== 'deferred' || genesisAck?.governance?.allowedTransition !== false) {
  throw new Error('daily genesis acknowledgement must be deferred and block transition');
}

const observationIds = bundle.observations.map((observation) => observation.id).sort();
const runObservationIds = [...bundle.run.newObservations].sort();
if (JSON.stringify(observationIds) !== JSON.stringify(runObservationIds)) {
  throw new Error('run.newObservations must exactly match bundled observation IDs');
}

const relationshipIds = bundle.relationships.map((relationship) => relationship.id).sort();
const runRelationshipIds = [...bundle.run.newRelationships].sort();
if (JSON.stringify(relationshipIds) !== JSON.stringify(runRelationshipIds)) {
  throw new Error('run.newRelationships must exactly match bundled relationship IDs');
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validators = {};
for (const [key, file] of Object.entries({
  run: 'run.schema.json',
  source: 'source.schema.json',
  observation: 'observation.schema.json',
  relationship: 'relationship.schema.json',
  stageAck: 'stage-ack.schema.json'
})) {
  const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, file), 'utf8'));
  validators[key] = ajv.compile(schema);
}

function assertValid(label, validator, record) {
  if (!validator(record)) {
    throw new Error(`${label} schema validation failed: ${JSON.stringify(validator.errors)}`);
  }
}

assertValid('run', validators.run, bundle.run);
for (const source of bundle.sources) assertValid(source.id, validators.source, source);
for (const observation of bundle.observations) assertValid(observation.id, validators.observation, observation);
for (const relationship of bundle.relationships) assertValid(relationship.id, validators.relationship, relationship);
for (const ack of bundle.stageAcks) assertValid(ack.ackId, validators.stageAck, ack);

const safeName = (id) => id.replace(/[:/]/g, '-');
const targetFor = (dir, id) => path.join(root, 'knowledge', dir, `${safeName(id)}.json`);
const planned = [];
for (const source of bundle.sources) planned.push({ target: targetFor('sources', source.id), record: source });
for (const observation of bundle.observations) planned.push({ target: targetFor('observations', observation.id), record: observation });
for (const relationship of bundle.relationships) planned.push({ target: targetFor('relationships', relationship.id), record: relationship });
planned.push({ target: targetFor('runs', bundle.run.runId), record: bundle.run });
for (const ack of bundle.stageAcks) planned.push({ target: targetFor('runs/stage-acks', ack.ackId), record: ack });

for (const { target } of planned) {
  if (fs.existsSync(target)) throw new Error(`immutable record exists: ${target}`);
}

const normalizedDigest = crypto.createHash('sha256').update(JSON.stringify(bundle)).digest('hex');
if (dryRun) {
  console.log(JSON.stringify({
    status: 'validated',
    dryRun: true,
    runId: bundle.run.runId,
    schemaVersion: bundle.run.schemaVersion,
    normalizedDigest,
    plannedFiles: planned.map(({ target }) => path.relative(root, target))
  }, null, 2));
  process.exit(0);
}

const written = [];
try {
  for (const { target, record } of planned) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
    written.push(target);
  }
} catch (error) {
  for (const target of written.reverse()) fs.rmSync(target, { force: true });
  throw error;
}

const receipt = {
  runId: bundle.run.runId,
  type: 'IngestReceipt',
  schemaVersion: '1.1.0',
  createdAt: new Date().toISOString(),
  ingestionMode: bundle.run.ingestionMode,
  normalizedDigest,
  files: written.map((file) => path.relative(root, file)),
  sha256: {}
};
for (const file of written) {
  receipt.sha256[path.relative(root, file)] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
const receiptTarget = targetFor('receipts', `${bundle.run.runId}-ingest`);
fs.mkdirSync(path.dirname(receiptTarget), { recursive: true });
fs.writeFileSync(receiptTarget, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(receipt, null, 2));
