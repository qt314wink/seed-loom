#!/usr/bin/env node
/**
 * Seed Loom creative mechanisms: reference lookup and bounded web-SVG compiler.
 * No network, filesystem writes, Notch automation, or repository mutation.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = p => JSON.parse(fs.readFileSync(path.join(packageRoot, p), 'utf8'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ensure = (condition, message) => { if (!condition) throw new Error(message); };

export function loadRegistry() {
  return {
    catalog: readJson('catalog/notch-2026.2.json'),
    registry: readJson('catalog/mechanisms.json'),
    schema: readJson('schema/creative-mechanisms.schema.json')
  };
}

export function validateRegistry({catalog, registry, schema}) {
  const ajv = new Ajv2020({allErrors: true, strict: true});
  addFormats(ajv);
  const validator = ajv.compile(schema);
  ensure(validator(registry), 'registry JSON Schema violation: ' + JSON.stringify(validator.errors));
  ensure(catalog.schema === 'melodicbloom.notch-reference-links/0.1', 'catalog schema mismatch');
  ensure(catalog.release === '2026.2' && catalog.provider === 'Notch', 'source release mismatch');
  ensure(catalog.baseUrl === 'https://manual.notch.one/2026.2/en/docs/reference/nodes/', 'unapproved source root');
  const urls = new Set();
  let reviewed = 0;
  for (const ref of catalog.links) {
    ensure(typeof ref.path === 'string' && /^[a-z0-9/-]+\/$/.test(ref.path), 'invalid node path');
    ensure(ref.url === catalog.baseUrl + ref.path, 'untrusted catalog URL: ' + ref.path);
    ensure(!urls.has(ref.url), 'duplicate catalog URL: ' + ref.url);
    ensure(['linked-only', 'selectively-reviewed'].includes(ref.status), 'unknown source status');
    urls.add(ref.url);
    if (ref.status === 'selectively-reviewed') reviewed++;
  }
  const ids = new Set();
  for (const rec of registry.records) {
    ensure(!ids.has(rec.id), 'duplicate canonical ID ' + rec.id);
    ids.add(rec.id);
    ensure(rec.reviewState === 'candidate', 'unapproved content promoted');
    ensure(rec.source.release === catalog.release, 'mismatched source release');
    ensure(rec.source.url.startsWith(catalog.baseUrl), 'off-domain source citation');
    ensure(catalog.links.some(l => l.url === rec.source.url && l.status === 'selectively-reviewed'), 'review claim lacks inspected source: ' + rec.id);
    ensure(Object.values(rec.portableTargets).every(s => s !== 'production-verified'), 'unverified production claim');
    ensure(rec.notchParameterLabels.every(p => !p.includes('://')), 'parameter label cannot be source URL');
  }
  ensure(reviewed === registry.records.length, 'reviewed source count does not reconcile with candidate registry');
  ensure(registry.records.filter(r => r.portableTargets['web-svg'] === 'implemented-original-approximation').map(r => r.id).join(',') === 'pattern.truchet', 'unimplemented SVG compiler advertised');
  return {
    sourceLinks: catalog.links.length,
    reviewed,
    linkedOnly: catalog.links.length - reviewed,
    candidates: registry.records.length,
    registrySha256: digest(JSON.stringify(registry)),
    catalogSha256: digest(JSON.stringify(catalog))
  };
}

const integerInRange = (value, name, min, max) => {
  ensure(Number.isInteger(value) && value >= min && value <= max, name + ' must be an integer in [' + min + ',' + max + ']');
  return value;
};
const numberInRange = (value, name, min, max) => {
  ensure(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max, name + ' must be finite within [' + min + ',' + max + ']');
  return value;
};
const hex = (value, name) => {
  ensure(typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value), name + ' must be a six-digit hex color');
  return value.toLowerCase();
};
function tileOrientation(seed, x, y) {
  let v = (seed ^ Math.imul(x + 1, 0x9e3779b1) ^ Math.imul(y + 1, 0x85ebca6b)) >>> 0;
  v = Math.imul(v ^ (v >>> 16), 0x7feb352d);
  v = Math.imul(v ^ (v >>> 15), 0x846ca68b);
  return (v ^ (v >>> 16)) & 1;
}

/**
 * An original, deterministic SVG approximation of the square-tile
 * quarter-circle Truchet pattern. Not a reproduction of Notch's renderer.
 */
export function compileTruchetSvg({
  seed = 9, grid = 12, tile = 32, strokeWidth = 2,
  ink = '#c0f9f0', paper = '#18182b'
} = {}) {
  integerInRange(seed, 'seed', 0, 4294967295);
  integerInRange(grid, 'grid', 1, 64);
  integerInRange(tile, 'tile', 8, 128);
  numberInRange(strokeWidth, 'strokeWidth', 0.25, tile / 2);
  hex(ink, 'ink');
  hex(paper, 'paper');
  const size = grid * tile;
  const h = tile / 2;
  const arcs = [];
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const orientation = tileOrientation(seed, x, y);
      const d = orientation === 0
        ? 'M ' + h + ' 0 A ' + h + ' ' + h + ' 0 0 0 0 ' + h +
          ' M ' + tile + ' ' + h + ' A ' + h + ' ' + h + ' 0 0 0 ' + h + ' ' + tile
        : 'M ' + h + ' 0 A ' + h + ' ' + h + ' 0 0 1 ' + tile + ' ' + h +
          ' M 0 ' + h + ' A ' + h + ' ' + h + ' 0 0 1 ' + h + ' ' + tile;
      arcs.push('<path transform="translate(' + (x * tile) + ' ' + (y * tile) + ')" d="' + d + '"/>');
    }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size +
    '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size +
    '" role="img" aria-label="Original seeded Truchet pattern approximation">' +
    '<rect width="100%" height="100%" fill="' + paper + '"/>' +
    '<g fill="none" stroke="' + ink + '" stroke-width="' + strokeWidth +
    '" stroke-linecap="round">' + arcs.join('') + '</g></svg>\n';
}

function parseOptions(tokens) {
  const options = {};
  const allowed = new Set(['seed', 'grid', 'tile', 'strokeWidth', 'ink', 'paper', 'target']);
  for (const token of tokens) {
    const matched = /^--([A-Za-z]+)=(.*)$/.exec(token);
    ensure(matched && allowed.has(matched[1]), 'unexpected option ' + token);
    const key = matched[1];
    ensure(!(key in options), 'duplicate option ' + key);
    options[key] = ['ink', 'paper', 'target'].includes(key) ? matched[2] : Number(matched[2]);
  }
  return options;
}

export function resolveMechanism(id, target = 'web-svg') {
  const {catalog, registry, schema} = loadRegistry();
  validateRegistry({catalog, registry, schema});
  const mechanism = registry.records.find(r => r.id === id);
  ensure(mechanism, 'unknown mechanism: ' + id);
  const status = mechanism.portableTargets[target] || 'unsupported';
  return {
    contract: registry.schema,
    id, target, source: mechanism.source, sourceParameterLabels: mechanism.notchParameterLabels,
    status, executable: id === 'pattern.truchet' && target === 'web-svg',
    semanticRisks: mechanism.semanticRisks,
    requiresNativeVerification: target === 'notch' || status === 'translation-candidate-unverified'
  };
}

function main(args) {
  const [command, id, ...rest] = args;
  if (command === 'validate') {
    ensure(!id, 'validate accepts no arguments');
    process.stdout.write(JSON.stringify(validateRegistry(loadRegistry()), null, 2) + '\n');
  } else if (command === 'list') {
    ensure(!id, 'list accepts no arguments');
    const {registry} = loadRegistry();
    process.stdout.write(JSON.stringify(registry.records.map(r => ({id:r.id,kind:r.kind,targets:r.portableTargets})), null, 2) + '\n');
  } else if (command === 'inspect') {
    ensure(id && rest.length === 0, 'inspect requires one ID');
    const r = loadRegistry().registry.records.find(r => r.id === id);
    ensure(r, 'unknown ID ' + id);
    process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  } else if (command === 'resolve') {
    ensure(id, 'resolve requires one ID');
    const options = parseOptions(rest);
    ensure(Object.keys(options).every(x => x === 'target'), 'resolve only accepts --target');
    process.stdout.write(JSON.stringify(resolveMechanism(id, options.target), null, 2) + '\n');
  } else if (command === 'compile') {
    ensure(id === 'pattern.truchet', 'compiler unavailable: only pattern.truchet is implemented');
    const options = parseOptions(rest);
    ensure(!options.target || options.target === 'web-svg', 'unsupported compile target');
    delete options.target;
    const svg = compileTruchetSvg(options);
    const receipt = {
      engine: 'seed-loom/web-svg-truchet/0.1',
      mechanism: id, source: 'source:notch:manual-2026.2',
      fidelity: 'original-approximation', parameters: options,
      outputSha256: digest(svg), bytes: Buffer.byteLength(svg)
    };
    process.stderr.write('RECEIPT ' + JSON.stringify(receipt) + '\n');
    process.stdout.write(svg);
  } else {
    throw new Error('Usage: registry.mjs validate | list | inspect <id> | resolve <id> [--target=web-svg] | compile pattern.truchet [--seed=9 --grid=12 --tile=32 --strokeWidth=2 --ink=#c0f9f0 --paper=#18182b]');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch(error) { process.stderr.write('BLOCKED ' + error.message + '\n'); process.exitCode = 1; }
}
