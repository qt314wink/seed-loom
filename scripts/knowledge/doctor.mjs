#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const checks = [];
const add = (name, ok, detail, severity = 'error') => checks.push({ name, ok, detail, severity });

add('node-version', Number(process.versions.node.split('.')[0]) >= 20, `Node ${process.versions.node}; require >=20`);
add('package-json', fs.existsSync(path.join(root, 'package.json')), 'package.json present');
add('schema-directory', fs.existsSync(path.join(root, 'knowledge/schema')), 'knowledge/schema present');
add('protocol-directory', fs.existsSync(path.join(root, 'protocols')), 'protocols present');
add('run-all-script', fs.existsSync(path.join(root, 'scripts/knowledge/run-all.mjs')), 'run-all script present');
add('lockfile', ['package-lock.json','npm-shrinkwrap.json'].some(f => fs.existsSync(path.join(root,f))), 'lockfile recommended for reproducible CI', 'warning');
add('ajv-installed', fs.existsSync(path.join(root, 'node_modules/ajv')), 'run npm install if absent');
add('ajv-formats-installed', fs.existsSync(path.join(root, 'node_modules/ajv-formats')), 'run npm install if absent');

const schemaFiles = fs.existsSync(path.join(root,'knowledge/schema'))
  ? fs.readdirSync(path.join(root,'knowledge/schema')).filter(f => f.endsWith('.json'))
  : [];
add('schemas-present', schemaFiles.length >= 10, `${schemaFiles.length} schema files found`);

const failures = checks.filter(c => !c.ok && c.severity === 'error');
const warnings = checks.filter(c => !c.ok && c.severity === 'warning');
console.log(JSON.stringify({ status: failures.length ? 'fail' : 'pass', checks, failures: failures.length, warnings: warnings.length }, null, 2));
process.exitCode = failures.length ? 1 : 0;
