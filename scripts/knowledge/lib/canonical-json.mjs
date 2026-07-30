// Shared canonical JSON + digest helpers for all knowledge control scripts.
// Contract: docs/strategy-genesis/CONTROLS_SPEC.md §3.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

/** Recursively sort object keys for deterministic serialization. */
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]);
    return out;
  }
  return value;
}

/** Canonical JSON string: sorted keys, 2-space indent, no trailing newline. */
export function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value), null, 2);
}

/** SHA-256 hex digest of the canonical JSON of a payload. */
export function digest(payload) {
  return createHash('sha256').update(canonicalStringify(payload), 'utf8').digest('hex');
}

/** SHA-256 hex digest of a file's raw bytes. */
export async function fileDigest(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}
