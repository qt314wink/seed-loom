#!/usr/bin/env node
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const roots = process.argv.slice(2).map(resolve);
if (!roots.length) roots.push(process.cwd());

const terms = [
  { id: 'github-models-endpoint', re: /models\.github|github models|github_models_token|byok|inference api|azure inference/gi },
  { id: 'self-hosted-runner', re: /runs-on\s*:\s*(?:\[[^\]]*self-hosted|self-hosted)/gi },
  { id: 'unpinned-action', re: /uses\s*:\s*[^\s@]+@(?![0-9a-f]{40}\b)[^\s#]+/gi }
];
const ignored = new Set(['.git','node_modules','dist','build','coverage','.next','.astro','playwright-report','test-results']);
const textExt = /\.(?:md|json|ya?ml|m?[jt]sx?|tsx?|py|sh|env|toml|txt)$/i;
const findings = [];

async function walk(root, dir=root) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(root, path);
    else if (textExt.test(entry.name)) {
      const info = await stat(path);
      if (info.size > 2_000_000) continue;
      const content = await readFile(path, 'utf8');
      for (const term of terms) {
        term.re.lastIndex = 0;
        for (const match of content.matchAll(term.re)) {
          const line = content.slice(0, match.index).split('\n').length;
          findings.push({ root, file: relative(root, path), line, rule: term.id, match: match[0].slice(0, 180), disposition: 'review-required' });
        }
      }
    }
  }
}
for (const root of roots) await walk(root);
findings.sort((a,b)=>`${a.root}/${a.file}:${a.line}:${a.rule}`.localeCompare(`${b.root}/${b.file}:${b.line}:${b.rule}`));
const payload = { generatedAt: new Date().toISOString(), roots, findingCount: findings.length, findings };
const canonical = JSON.stringify(payload, null, 2) + '\n';
payload.digest = createHash('sha256').update(canonical).digest('hex');
const out = resolve('portfolio-provider-lifecycle-audit.json');
await writeFile(out, JSON.stringify(payload, null, 2) + '\n');
console.log(`Wrote ${out} with ${findings.length} findings.`);
process.exitCode = findings.some(f=>f.rule==='github-models-endpoint') ? 2 : 0;
