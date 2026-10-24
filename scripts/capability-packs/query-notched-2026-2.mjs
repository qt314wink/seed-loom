#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const packDir = path.join(root, 'capability-packs', 'notch-2026.2');
const verifier = path.join(root, 'scripts', 'capability-packs', 'verify-notched-2026-2.mjs');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(packDir, file), 'utf8'));
const fail = (message) => {
  throw new Error(`NOTCH_CAPABILITY_QUERY_INVALID: ${message}`);
};

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const match = argument.match(/^--(scene|adapter)=(.+)$/);
    if (match) {
      values[match[1]] = match[2];
      continue;
    }
    if (argument === '--scene' || argument === '--adapter') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) fail(`missing value for ${argument}`);
      values[argument.slice(2)] = value;
      index += 1;
      continue;
    }
    fail(`unsupported argument ${argument}; use --scene <scene:id> [--adapter <adapter:id>]`);
  }
  return values;
}

function verifiedReceipt() {
  const run = spawnSync(process.execPath, [verifier], { cwd: root, encoding: 'utf8' });
  if (run.status !== 0) fail(run.stderr || 'capability-pack verification failed');
  return JSON.parse(run.stdout);
}

const options = parseArgs(process.argv.slice(2));
const pack = readJson('notch-capability-pack.json');
const sourceManifest = readJson('source-manifest.json');
const receipt = verifiedReceipt();
const familiesById = new Map(pack.capabilityFamilies.map((family) => [family.id, family]));
const adaptersById = new Map(pack.adapterContracts.map((adapter) => [adapter.id, adapter]));
const sourcesById = new Map(sourceManifest.sources.map((source) => [source.id, source]));

if (!options.scene) {
  const catalog = {
    schemaVersion: 'seed-loom.capability-query.v0.1',
    pack: {
      id: receipt.packId,
      status: receipt.packStatus,
      digest: receipt.digest,
      sourceManifestId: receipt.sourceManifestId
    },
    catalog: {
      sceneRecipes: pack.sceneRecipes.map(({ id, name, purpose, targetAdapters }) => ({ id, name, purpose, targetAdapters })),
      adapterContracts: pack.adapterContracts.map(({ id, target, mode }) => ({ id, target, mode }))
    },
    usage: 'npm run capability:notch:query -- --scene scene:radial-field-bloom --adapter adapter:shader-gallery'
  };
  console.log(JSON.stringify(catalog, null, 2));
  process.exit(0);
}

const scene = pack.sceneRecipes.find((candidate) => candidate.id === options.scene);
if (!scene) fail(`unknown scene ${options.scene}`);
if (options.adapter && !scene.targetAdapters.includes(options.adapter)) {
  fail(`${options.adapter} is not an adapter for ${scene.id}`);
}
const selectedAdapters = (options.adapter ? [options.adapter] : scene.targetAdapters)
  .map((adapterId) => adaptersById.get(adapterId));
if (selectedAdapters.some((adapter) => !adapter)) fail('scene references an unknown adapter');
const families = scene.usesFamilies.map((familyId) => familiesById.get(familyId));
if (families.some((family) => !family)) fail('scene references an unknown capability family');
const sourceRefs = [...new Set(families.flatMap((family) => family.sourceRefs))].sort();
const sources = sourceRefs.map((sourceRef) => sourcesById.get(sourceRef));
if (sources.some((source) => !source)) fail('selected family references an unknown source');

const result = {
  schemaVersion: 'seed-loom.capability-query.v0.1',
  pack: {
    id: receipt.packId,
    status: receipt.packStatus,
    digest: receipt.digest,
    sourceManifestId: receipt.sourceManifestId,
    userSuppliedManualLocatorCount: receipt.userSuppliedManualLocatorCount
  },
  selection: {
    scene,
    capabilityFamilies: families,
    adapterContracts: selectedAdapters,
    authoritativeSources: sources
  },
  boundaries: {
    canonical: pack.canonicalBoundary,
    governance: pack.governance,
    locatorLedger: sourceManifest.locatorLedger
  }
};
console.log(JSON.stringify(result, null, 2));
