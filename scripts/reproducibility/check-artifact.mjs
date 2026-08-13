#!/usr/bin/env node
import { readdir, stat } from 'node:fs/promises';

const files = await readdir('dist', { recursive: true });
const entries = await Promise.all(files.map(async (name) => [name, await stat(`dist/${name}`)]));
const assets = entries.filter(([, metadata]) => metadata.isFile()).map(([name]) => name);
if (!assets.includes('index.html')) throw new Error('dist/index.html is missing');
let bytes = 0;
for (const [, metadata] of entries) if (metadata.isFile()) bytes += metadata.size;
if (bytes === 0) throw new Error('The build artifact is empty');
console.log(`Verified dist artifact: ${assets.length} files, ${bytes} bytes.`);
