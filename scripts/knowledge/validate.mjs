#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = process.cwd();
const schemaDir = path.join(root, 'knowledge', 'schema');
const dataDirs = ['sources','entities','observations','patterns','relationships','opportunities','strategies','experiments','runs'];
const schemaByType = {
  Source: 'source.schema.json',
  Observation: 'observation.schema.json',
  Actor: 'actor.schema.json',
  Relationship: 'relationship.schema.json',
  Pattern: 'pattern.schema.json',
  Opportunity: 'opportunity.schema.json',
  Strategy: 'strategy.schema.json',
  Experiment: 'experiment.schema.json',
  RepositoryGenesisDossier: 'genesis-dossier.schema.json',
  ResearchRun: 'run.schema.json'
};

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const schemas = new Map();
for (const name of Object.values(schemaByType)) {
  const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, name), 'utf8'));
  schemas.set(name, schema);
  ajv.addSchema(schema, schema.$id);
}

let failures = 0;
for (const dir of dataDirs) {
  const absolute = path.join(root, 'knowledge', dir);
  if (!fs.existsSync(absolute)) continue;
  for (const file of fs.readdirSync(absolute).filter((name) => name.endsWith('.json')).sort()) {
    const full = path.join(absolute, file);
    const record = JSON.parse(fs.readFileSync(full, 'utf8'));
    const schemaName = schemaByType[record.type];
    if (!schemaName) {
      console.error(`UNKNOWN_TYPE ${path.relative(root, full)} ${record.type}`);
      failures += 1;
      continue;
    }
    const validate = ajv.getSchema(schemas.get(schemaName).$id);
    if (!validate(record)) {
      console.error(`INVALID ${path.relative(root, full)}`);
      console.error(JSON.stringify(validate.errors, null, 2));
      failures += 1;
    } else {
      console.log(`VALID ${path.relative(root, full)}`);
    }
  }
}
if (failures) process.exit(1);
