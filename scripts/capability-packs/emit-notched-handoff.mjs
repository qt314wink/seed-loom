#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const packDir = path.join(root, 'capability-packs', 'notch-2026.2');
const defaultRequest = path.join(packDir, 'handoffs', 'shader-gallery-radial-field-bloom.request.json');
const verifier = path.join(root, 'scripts', 'capability-packs', 'verify-notched-2026-2.mjs');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const fail = (message) => {
  throw new Error(`NOTCH_CAPABILITY_HANDOFF_INVALID: ${message}`);
};
const nonEmptyStrings = (value, label) => {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.length === 0)) fail(`${label} must be a non-empty string array`);
};

function parseArgs(argv) {
  if (argv.length === 0) return { request: defaultRequest };
  if (argv.length === 2 && argv[0] === '--request' && argv[1] && !argv[1].startsWith('--')) return { request: path.resolve(root, argv[1]) };
  if (argv.length === 1 && argv[0].startsWith('--request=')) return { request: path.resolve(root, argv[0].slice('--request='.length)) };
  fail('use no arguments for the vetted Shader Gallery request, or --request <relative-request.json>');
}

function verifiedReceipt() {
  const run = spawnSync(process.execPath, [verifier], { cwd: root, encoding: 'utf8' });
  if (run.status !== 0) fail(run.stderr || 'capability-pack verification failed');
  return JSON.parse(run.stdout);
}

function validateRequest(request) {
  const required = ['schemaVersion', 'id', 'pack', 'selection', 'target', 'role', 'objective', 'allowedScope', 'prohibitedScope', 'implementationOrders', 'validation', 'stopConditions', 'receiptRequirements'];
  for (const key of required) if (!(key in request)) fail(`request is missing ${key}`);
  if (request.schemaVersion !== 'seed-loom.capability-request.v0.1') fail('unexpected request schema version');
  if (!request.id.startsWith('capability-request:')) fail('request id must be a capability request id');
  if (!request.pack?.id?.startsWith('capability-pack:') || !/^[a-f0-9]{64}$/.test(request.pack.expectedDigest) || request.pack.status !== 'candidate') fail('request pack reference is invalid');
  if (!request.selection?.sceneId?.startsWith('scene:') || !request.selection?.adapterId?.startsWith('adapter:')) fail('request selection is invalid');
  if (!/^[^/\s]+\/[^/\s]+$/.test(request.target?.repository || '') || !/^[a-f0-9]{40}$/.test(request.target?.baseSha || '') || !request.target.baseRef || !Number.isFinite(Date.parse(request.target.observedAt))) fail('request target is invalid');
  if (!request.role || !request.objective) fail('request role and objective are required');
  for (const key of ['allowedScope', 'prohibitedScope', 'stopConditions', 'receiptRequirements']) nonEmptyStrings(request[key], key);
  if (!Array.isArray(request.implementationOrders) || request.implementationOrders.length === 0) fail('request must contain implementation orders');
  for (const order of request.implementationOrders) {
    if (!order?.id || !order.action || !order.invariant || !order.output) fail('implementation order is incomplete');
    nonEmptyStrings(order.paths, `${order.id}.paths`);
  }
  if (!Array.isArray(request.validation) || request.validation.length === 0) fail('request must contain validation');
  for (const validation of request.validation) {
    if (!validation?.command || !Number.isInteger(validation.expectedExitCode) || validation.expectedExitCode < 0 || !validation.evidence) fail('validation step is incomplete');
  }
}

const options = parseArgs(process.argv.slice(2));
if (!fs.existsSync(options.request)) fail(`request does not exist: ${options.request}`);
const request = readJson(options.request);
validateRequest(request);
const receipt = verifiedReceipt();
if (request.pack.id !== receipt.packId || request.pack.expectedDigest !== receipt.digest || request.pack.status !== receipt.packStatus) fail('request pack identity or digest does not match the verified local pack');

const pack = readJson(path.join(packDir, 'notch-capability-pack.json'));
const scene = pack.sceneRecipes.find((candidate) => candidate.id === request.selection.sceneId);
const adapter = pack.adapterContracts.find((candidate) => candidate.id === request.selection.adapterId);
if (!scene || !adapter) fail('request selects an unknown scene or adapter');
if (!scene.targetAdapters.includes(adapter.id)) fail('request adapter is not available for the selected scene');
if (adapter.target !== request.target.repository) fail(`request target ${request.target.repository} does not match adapter target ${adapter.target}`);
const families = scene.usesFamilies.map((familyId) => pack.capabilityFamilies.find((family) => family.id === familyId));
if (families.some((family) => !family)) fail('selected scene references an unknown family');

const handoff = {
  schemaVersion: 'seed-loom.capability-handoff.v0.1',
  request,
  packReceipt: {
    packId: receipt.packId,
    packStatus: receipt.packStatus,
    digest: receipt.digest
  },
  scene,
  families,
  adapter,
  workOrder: {
    sourceOfAuthority: [
      'The checked-out target repository contracts and license constraints.',
      'This request for scope, target snapshot, stop conditions, and required receipt.',
      'The verified candidate pack for portable mechanism intent and source boundaries.'
    ],
    authorityBoundary: 'This handoff authorizes only the request-defined implementation work after a receiver confirms the target base. It does not authorize commit, push, merge, publication, deployment, source mirroring, or candidate-pack promotion.',
    feedbackLoop: 'fixed-seed source and parameters -> generated preview and target checks -> receipt and human review -> optional adapter/pack promotion decision. The loop favors reversible evidence over automatic rollout.',
    expectedOutput: 'One target-local Radial Field Bloom specimen and its target-local QA receipt; no cross-repository mutation is performed by this emitter.',
    limitations: [
      'The portable Notch field-feedback concept is intentionally represented as a stateless WebGL2 approximation in this first target.',
      'The source locator ledger preserves URLs, not copied manual content or a claim that every locator has been semantically extracted.',
      'Passing target-local checks is evidence of target compatibility only, not Notch parity, physical correctness, accessibility certification, or production performance certification.'
    ]
  }
};
console.log(JSON.stringify(handoff, null, 2));
