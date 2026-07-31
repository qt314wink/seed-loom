#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { normalizeNightlyBundle } from './normalize-nightly-bundle.mjs';

const now = '2026-07-31T12:00:00Z';
const stages = ['collect', 'vet', 'normalize', 'observe', 'inquire', 'interpret', 'relate', 'pattern', 'opportunity', 'strategy', 'experiment', 'genesis', 'publish'];
const sources = Array.from({ length: 5 }, (_, index) => ({
  sourceId: `source:phase-a:${index + 1}`,
  type: 'Source',
  url: `https://example.com/source-${index + 1}`,
  publisher: 'Phase A Fixture',
  publishedAt: now,
  retrievedAt: now,
  sourceClass: 'primary',
  independenceKey: `fixture-stream-${index + 1}`,
  contentHash: null,
  notes: 'Synthetic compatibility fixture.'
}));
const observations = sources.map((source, index) => ({
  observationId: `obs:phase-a:${index + 1}`,
  type: 'Observation',
  capturedAt: now,
  claim: `Synthetic Phase A observation number ${index + 1} proves alias normalization without becoming accepted knowledge.`,
  verifiedFacts: [`Synthetic fact ${index + 1}`],
  inference: [],
  significance: 'Tests the nightly compatibility adapter.',
  confidence: 0.5,
  evidenceMaturity: 'candidate',
  sourceRefs: [source.sourceId],
  actorRefs: [],
  affectedRepositories: ['qt314wink/seed-loom'],
  assumptions: [],
  knownLimitations: ['Synthetic fixture only.'],
  counterevidenceRefs: [],
  approvalState: 'candidate'
}));
const relationships = observations.map((observation, index) => ({
  relationshipId: `rel:phase-a:${index + 1}`,
  type: 'Relationship',
  from: observation.observationId,
  predicate: 'SUPPORTED_BY',
  to: sources[index].sourceId,
  confidence: 1,
  evidenceRefs: [sources[index].sourceId],
  validFrom: now,
  validTo: null
}));
const stageAcks = stages.map((stage) => ({
  ackId: `ack:phase-a:${stage}`,
  runId: 'run:phase-a:compatibility',
  stage,
  status: stage === 'genesis' ? 'deferred' : 'passed',
  startedAt: now,
  completedAt: now,
  inputs: [],
  outputs: [],
  checks: [{ name: 'fixture', result: 'pass', detail: 'Synthetic contract check.' }],
  governance: {
    allowedTransition: stage === 'genesis' ? false : true,
    approvalRequired: stage === 'genesis',
    boundaryNotes: ['Synthetic fixture.']
  },
  provenance: {
    producer: 'phase-a-test',
    method: 'deterministic fixture',
    inputHashes: ['fixture']
  }
}));
const legacyBundle = {
  run: {
    runId: 'run:phase-a:compatibility',
    type: 'ResearchRun',
    retrievalWindow: { from: now, to: now },
    newObservations: observations.map((record) => record.observationId),
    updatedObservations: [],
    candidatePatterns: [],
    newRelationships: relationships.map((record) => record.relationshipId),
    contradictions: [],
    opportunities: [],
    proposedExperiments: [],
    repositoryActions: [],
    noChangeReceipts: [],
    collectionFailures: []
  },
  sources,
  observations,
  relationships,
  stageAcks
};

const normalized = normalizeNightlyBundle(legacyBundle);
assert.equal(normalized.run.schemaVersion, '1.1.0');
assert.equal(normalized.run.ingestionMode, 'delivered');
assert.equal(normalized.sources[0].id, sources[0].sourceId);
assert.ok(!('sourceId' in normalized.sources[0]));
assert.equal(normalized.observations[0].id, observations[0].observationId);
assert.ok(!('observationId' in normalized.observations[0]));
assert.equal(normalized.relationships[0].id, relationships[0].relationshipId);
assert.ok(!('relationshipId' in normalized.relationships[0]));

assert.throws(() => normalizeNightlyBundle({
  ...legacyBundle,
  sources: [{ ...sources[0], id: 'source:conflict:canonical' }, ...sources.slice(1)]
}), /identifier conflict/);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-loom-phase-a-'));
const fixturePath = path.join(tempDir, 'legacy-bundle.json');
fs.writeFileSync(fixturePath, `${JSON.stringify(legacyBundle, null, 2)}\n`);
const result = spawnSync(process.execPath, ['scripts/knowledge/ingest-nightly-run.mjs', fixturePath, '--dry-run'], {
  cwd: process.cwd(),
  encoding: 'utf8'
});
assert.equal(result.status, 0, result.stderr || result.stdout);
const receipt = JSON.parse(result.stdout);
assert.equal(receipt.status, 'validated');
assert.equal(receipt.dryRun, true);
assert.equal(receipt.schemaVersion, '1.1.0');
assert.equal(receipt.plannedFiles.length, 24);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log('PASS Phase A contract compatibility');
