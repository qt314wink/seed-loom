#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packDir = path.join(root, 'capability-packs', 'notch-2026.2');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(packDir, file), 'utf8'));
const failure = (message) => {
  throw new Error(`NOTCH_CAPABILITY_PACK_INVALID: ${message}`);
};
const canonicalize = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};
const stableIdSet = (items, label) => {
  const ids = new Set();
  for (const item of items) {
    if (!item?.id || typeof item.id !== 'string') failure(`${label} record is missing a string id`);
    if (ids.has(item.id)) failure(`duplicate ${label} id ${item.id}`);
    ids.add(item.id);
  }
  return ids;
};
const requireNonEmptyStrings = (value, label) => {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== 'string' || entry.length === 0)) {
    failure(`${label} must be a non-empty string array`);
  }
};

const pack = readJson('notch-capability-pack.json');
const manifest = readJson('source-manifest.json');
const locatorLedger = readJson('user-supplied-locator-ledger.json');

if (pack.schemaVersion !== 'seed-loom.notch-capability-pack.v0.1') failure('unexpected pack schema version');
if (pack.id !== 'capability-pack:notch:2026.2:creative-systems') failure('unexpected pack id');
if (pack.status !== 'candidate') failure('candidate pack must not self-promote');
if (pack.sourceManifest !== './source-manifest.json') failure('source manifest reference changed');
if (!pack.canonicalBoundary?.sourceOfTruth || !pack.canonicalBoundary?.portableUnit) failure('canonical boundary is incomplete');
requireNonEmptyStrings(pack.canonicalBoundary.notCanonical, 'canonicalBoundary.notCanonical');
requireNonEmptyStrings(pack.canonicalBoundary.generatedOutputs, 'canonicalBoundary.generatedOutputs');

if (manifest.schemaVersion !== 'seed-loom.source-manifest.v0.1') failure('unexpected source manifest schema version');
if (manifest.locatorLedger !== './user-supplied-locator-ledger.json') failure('source manifest must reference the user-supplied locator ledger');
const sourceIds = stableIdSet(manifest.sources, 'source');
const urls = new Set();
for (const source of manifest.sources) {
  if (!source.url?.startsWith('https://manual.notch.one/2026.2/')) failure(`source ${source.id} is not a pinned official 2026.2 manual URL`);
  if (urls.has(source.url)) failure(`duplicate source URL ${source.url}`);
  urls.add(source.url);
  if (source.publisher !== 'Notch / 10Bit' || source.sourceClass !== 'official') failure(`source ${source.id} has invalid authority metadata`);
  if (source.version !== '2026.2' || !Number.isFinite(Date.parse(source.retrievedAt))) failure(`source ${source.id} lacks reproducible version or retrieval metadata`);
  if (!source.coverage || !source.status) failure(`source ${source.id} lacks coverage or extraction status`);
}

if (locatorLedger.schemaVersion !== 'seed-loom.user-supplied-locator-ledger.v0.1') failure('unexpected locator ledger schema version');
if (locatorLedger.id !== 'source-locator-ledger:notch:2026.2:user-supplied') failure('unexpected locator ledger id');
const manualBaseUrl = 'https://manual.notch.one/2026.2/en/docs/reference/nodes/';
if (locatorLedger.manualNodesBaseUrl !== manualBaseUrl) failure('locator ledger is not pinned to the official 2026.2 nodes base URL');
if (!Array.isArray(locatorLedger.locatorGroups) || locatorLedger.locatorGroups.length === 0) failure('locator ledger must contain groups');
const locatorGroupIds = stableIdSet(locatorLedger.locatorGroups, 'locator group');
const relativePaths = new Set();
const fullManualUrls = new Set();
for (const group of locatorLedger.locatorGroups) {
  requireNonEmptyStrings(group.relativePaths, `${group.id}.relativePaths`);
  if (!group.description) failure(`${group.id} lacks a description`);
  for (const relativePath of group.relativePaths) {
    if (!relativePath.endsWith('/') || relativePath.startsWith('/') || relativePath.includes('..')) {
      failure(`${group.id} contains an unsafe or non-canonical relative path ${relativePath}`);
    }
    if (relativePaths.has(relativePath)) failure(`duplicate user-supplied locator path ${relativePath}`);
    relativePaths.add(relativePath);
    const fullUrl = `${locatorLedger.manualNodesBaseUrl}${relativePath}`;
    if (!fullUrl.startsWith(manualBaseUrl) || fullManualUrls.has(fullUrl)) failure(`duplicate or invalid full locator URL ${fullUrl}`);
    fullManualUrls.add(fullUrl);
  }
}
if (!locatorGroupIds.has('group:core-node-categories') || !relativePaths.has('procedurals/')) {
  failure('locator ledger must preserve the supplied core categories, including procedurals');
}
if (!Array.isArray(locatorLedger.duplicateOccurrences)) failure('locator ledger must record duplicate occurrences');
let suppliedManualUrlOccurrenceCount = relativePaths.size;
for (const duplicate of locatorLedger.duplicateOccurrences) {
  if (!relativePaths.has(duplicate.relativePath) || !Number.isInteger(duplicate.occurrences) || duplicate.occurrences < 2 || !duplicate.reason) {
    failure('locator ledger contains an invalid duplicate-occurrence record');
  }
  suppliedManualUrlOccurrenceCount += duplicate.occurrences - 1;
}
if (fullManualUrls.size !== locatorLedger.expectedUniqueManualUrlCount) failure(`locator ledger expected ${locatorLedger.expectedUniqueManualUrlCount} unique URLs but has ${fullManualUrls.size}`);
if (suppliedManualUrlOccurrenceCount !== locatorLedger.expectedSuppliedManualUrlOccurrenceCount) failure(`locator ledger expected ${locatorLedger.expectedSuppliedManualUrlOccurrenceCount} supplied occurrences but has ${suppliedManualUrlOccurrenceCount}`);
if (!Array.isArray(locatorLedger.excludedDiscoveryUrls) || locatorLedger.excludedDiscoveryUrls.some((entry) => !entry?.url?.startsWith('https://www.google.com/search?') || !entry.reason)) {
  failure('discovery-only URLs must be explicitly excluded from the authoritative source set');
}

const familyIds = stableIdSet(pack.capabilityFamilies, 'capability family');
for (const family of pack.capabilityFamilies) {
  requireNonEmptyStrings(family.notchFamilies, `${family.id}.notchFamilies`);
  requireNonEmptyStrings(family.semanticOperators, `${family.id}.semanticOperators`);
  requireNonEmptyStrings(family.inputs, `${family.id}.inputs`);
  requireNonEmptyStrings(family.outputs, `${family.id}.outputs`);
  requireNonEmptyStrings(family.constraints, `${family.id}.constraints`);
  requireNonEmptyStrings(family.sourceRefs, `${family.id}.sourceRefs`);
  requireNonEmptyStrings(family.qa, `${family.id}.qa`);
  for (const sourceRef of family.sourceRefs) if (!sourceIds.has(sourceRef)) failure(`${family.id} references unknown source ${sourceRef}`);
}

const adapterIds = stableIdSet(pack.adapterContracts, 'adapter contract');
for (const adapter of pack.adapterContracts) {
  if (!['implementation', 'manifest', 'spec-only'].includes(adapter.mode)) failure(`${adapter.id} has invalid adapter mode`);
  if (adapter.mode === 'implementation' && adapter.id !== 'adapter:seed-loom') failure(`${adapter.id} cannot claim implementation from a shared candidate pack`);
  requireNonEmptyStrings(adapter.maps, `${adapter.id}.maps`);
  requireNonEmptyStrings(adapter.preserves, `${adapter.id}.preserves`);
  requireNonEmptyStrings(adapter.doesNotPromise, `${adapter.id}.doesNotPromise`);
  requireNonEmptyStrings(adapter.qa, `${adapter.id}.qa`);
}

const sceneIds = stableIdSet(pack.sceneRecipes, 'scene recipe');
for (const scene of pack.sceneRecipes) {
  requireNonEmptyStrings(scene.usesFamilies, `${scene.id}.usesFamilies`);
  requireNonEmptyStrings(scene.parameterContract, `${scene.id}.parameterContract`);
  requireNonEmptyStrings(scene.notchBuildOrder, `${scene.id}.notchBuildOrder`);
  requireNonEmptyStrings(scene.targetAdapters, `${scene.id}.targetAdapters`);
  requireNonEmptyStrings(scene.qa, `${scene.id}.qa`);
  for (const familyId of scene.usesFamilies) if (!familyIds.has(familyId)) failure(`${scene.id} references unknown family ${familyId}`);
  for (const adapterId of scene.targetAdapters) if (!adapterIds.has(adapterId)) failure(`${scene.id} references unknown adapter ${adapterId}`);
}

if (!pack.governance?.promotionRule || !pack.governance?.rightsBoundary) failure('governance is incomplete');
requireNonEmptyStrings(pack.governance.stopConditions, 'governance.stopConditions');
if (!pack.governance.rightsBoundary.includes('Do not mirror')) failure('rights boundary must prohibit source mirroring');

const canonicalInputs = {
  pack: JSON.parse(canonicalize(pack)),
  sourceManifest: JSON.parse(canonicalize(manifest)),
  userSuppliedLocatorLedger: JSON.parse(canonicalize(locatorLedger))
};
const digest = crypto.createHash('sha256').update(canonicalize(canonicalInputs)).digest('hex');
const receipt = {
  receiptVersion: 'seed-loom.capability-pack-receipt.v0.1',
  packId: pack.id,
  packStatus: pack.status,
  sourceManifestId: manifest.id,
  capabilityFamilyCount: pack.capabilityFamilies.length,
  sceneRecipeCount: pack.sceneRecipes.length,
  adapterContractCount: pack.adapterContracts.length,
  sourceCount: manifest.sources.length,
  userSuppliedManualLocatorCount: fullManualUrls.size,
  userSuppliedManualLocatorOccurrenceCount: suppliedManualUrlOccurrenceCount,
  digest,
  validation: [
    'official 2026.2 source URLs are unique and pinned',
    'all 128 unique user-supplied official Manual locators are preserved without copying source content',
    'all family source references resolve',
    'all scene family and adapter references resolve',
    'candidate pack makes no non-Seed-Loom implementation claim',
    'rights and promotion boundaries are present'
  ]
};
console.log(JSON.stringify(receipt, null, 2));
