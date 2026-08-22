#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const roots = ['schemas', 'packages'];
const ajv = new Ajv2020({ strict: false, validateSchema: true });

async function findSchemas(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      paths.push(...await findSchemas(path));
    } else if (entry.isFile() && entry.name.endsWith('.schema.json')) {
      paths.push(path);
    }
  }
  return paths;
}

const paths = (await Promise.all(roots.map(findSchemas))).flat().sort();
for (const path of paths) {
  const schema = JSON.parse(await readFile(path, 'utf8'));
  if (!ajv.validateSchema(schema)) throw new Error(`${path}: ${ajv.errorsText(ajv.errors)}`);
}
if (paths.length === 0) throw new Error('No JSON schemas were found.');
console.log(`Validated ${paths.length} JSON schemas.`);
