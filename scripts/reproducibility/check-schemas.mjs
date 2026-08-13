#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const directories = ['schemas', 'packages/schemas'];
const ajv = new Ajv2020({ strict: false, validateSchema: true });
let count = 0;
for (const directory of directories) {
  for (const name of (await readdir(directory)).filter((file) => file.endsWith('.json')).sort()) {
    const path = join(directory, name);
    const schema = JSON.parse(await readFile(path, 'utf8'));
    if (!ajv.validateSchema(schema)) throw new Error(`${path}: ${ajv.errorsText(ajv.errors)}`);
    count += 1;
  }
}
if (count === 0) throw new Error('No JSON schemas were found.');
console.log(`Validated ${count} JSON schemas.`);
