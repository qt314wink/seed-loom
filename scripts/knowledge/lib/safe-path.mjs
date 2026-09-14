import fs from 'node:fs';
import path from 'node:path';

// Resolve a raw HTTP request path against a served base directory.
// Returns the absolute file path when the target is strictly inside base,
// otherwise null. Enforces the directory boundary with path.relative so that
// prefix-collision siblings (e.g. "graph-workbench-evil") and decoded
// traversal sequences (e.g. "%2e%2e%2f") cannot escape.
export function resolveWithin(base, requestPath) {
  const pathname = String(requestPath ?? '/').split('?')[0].split('#')[0];
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const name = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const file = path.resolve(base, name);
  const lexicalRel = path.relative(base, file);
  if (lexicalRel === '' || lexicalRel === '..' || lexicalRel.startsWith('..' + path.sep) || path.isAbsolute(lexicalRel)) return null;
  try {
    const realBase = fs.realpathSync(base);
    const realFile = fs.realpathSync(file);
    const realRel = path.relative(realBase, realFile);
    if (realRel === '' || realRel === '..' || realRel.startsWith('..' + path.sep) || path.isAbsolute(realRel)) return null;
    return realFile;
  } catch {
    return null;
  }
}
