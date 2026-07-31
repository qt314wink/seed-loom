#!/usr/bin/env node

const VERSION = '1.1.0';

function clone(value) {
  return structuredClone(value);
}

function normalizeAliasedId(record, canonicalKey, legacyKey, expectedPrefix) {
  const next = clone(record);
  const canonical = next[canonicalKey];
  const legacy = next[legacyKey];

  if (canonical && legacy && canonical !== legacy) {
    throw new Error(`identifier conflict: ${canonicalKey}=${canonical} does not match ${legacyKey}=${legacy}`);
  }

  const id = canonical ?? legacy;
  if (!id) throw new Error(`missing identifier: expected ${canonicalKey} or ${legacyKey}`);
  if (!id.startsWith(expectedPrefix)) throw new Error(`invalid identifier prefix for ${id}; expected ${expectedPrefix}`);

  next[canonicalKey] = id;
  delete next[legacyKey];
  next.schemaVersion ??= VERSION;
  return next;
}

function normalizeSource(source) {
  return normalizeAliasedId(source, 'id', 'sourceId', 'source:');
}

function normalizeObservation(observation) {
  const next = normalizeAliasedId(observation, 'id', 'observationId', 'obs:');
  if (next.approvalState === 'pending') next.approvalState = 'candidate';
  return next;
}

function normalizeRelationship(relationship) {
  return normalizeAliasedId(relationship, 'id', 'relationshipId', 'rel:');
}

function normalizeRun(run) {
  const next = clone(run);
  next.schemaVersion ??= VERSION;
  next.ingestionMode ??= 'delivered';
  next.proposedExperiments ??= [];
  return next;
}

function normalizeStageAck(ack) {
  const next = clone(ack);
  next.schemaVersion ??= VERSION;
  return next;
}

export function normalizeNightlyBundle(bundle) {
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
    throw new Error('nightly bundle must be an object');
  }

  const required = ['run', 'sources', 'observations', 'relationships', 'stageAcks'];
  for (const key of required) {
    if (!(key in bundle)) throw new Error(`bundle missing ${key}`);
  }

  if (!Array.isArray(bundle.sources) || !Array.isArray(bundle.observations) || !Array.isArray(bundle.relationships) || !Array.isArray(bundle.stageAcks)) {
    throw new Error('sources, observations, relationships, and stageAcks must be arrays');
  }

  return {
    run: normalizeRun(bundle.run),
    sources: bundle.sources.map(normalizeSource),
    observations: bundle.observations.map(normalizeObservation),
    relationships: bundle.relationships.map(normalizeRelationship),
    stageAcks: bundle.stageAcks.map(normalizeStageAck),
    ...(bundle.socraticAssessments ? { socraticAssessments: clone(bundle.socraticAssessments) } : {})
  };
}

export const NIGHTLY_CONTRACT_VERSION = VERSION;
