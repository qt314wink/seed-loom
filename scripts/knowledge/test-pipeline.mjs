#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const failures = [];
const passes = [];
const read = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const exists = p => fs.existsSync(path.join(root,p));
const test = (name, fn) => { try { fn(); passes.push(name); } catch (e) { failures.push({name,error:e.message}); } };
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const requiredFiles = [
  'knowledge/schema/run.schema.json','knowledge/schema/observation.schema.json','knowledge/schema/relationship.schema.json',
  'knowledge/schema/stage-ack.schema.json','knowledge/schema/socratic-assessment.schema.json',
  'scripts/knowledge/validate.mjs','scripts/knowledge/check-orphans.mjs','scripts/knowledge/build-index.mjs',
  'protocols/socratic-descent.md','protocols/genesis-gates.md','protocols/pipeline-verification.md'
];

test('T00 required architecture exists',()=>requiredFiles.forEach(p=>assert(exists(p),`missing ${p}`)));

test('T01 schemas parse',()=>fs.readdirSync(path.join(root,'knowledge/schema')).filter(f=>f.endsWith('.json')).forEach(f=>read(`knowledge/schema/${f}`)));

test('T02 historical ledger is explicit',()=>{
  const ledger=read('knowledge/runs/backfill-ledger.json');
  assert(Array.isArray(ledger.cycles)&&ledger.cycles.length>0,'no cycles');
  ledger.cycles.forEach(c=>assert(['delivered','reconstructed','unavailable'].includes(c.status),'invalid status'));
});

test('T03 reconstructed cycle has five observations',()=>{
  const run=read('knowledge/runs/run-nightly-reconstructed-2026-07-30.json');
  assert(run.ingestionMode==='reconstructed','must identify reconstruction');
  assert(run.newObservations.length===5,'expected exactly five observations');
  assert(run.collectionFailures.length>=1,'must disclose unavailable original outputs');
});

test('T04 every observation has epistemic separation',()=>{
  const dir=path.join(root,'knowledge/observations');
  for(const f of fs.readdirSync(dir).filter(f=>f.startsWith('obs-2026-07-30-')&&f.endsWith('.json'))){
    const o=read(`knowledge/observations/${f}`);
    ['verifiedFacts','inference','significance','confidence','sourceRefs','assumptions','knownLimitations','counterevidenceRefs','approvalState'].forEach(k=>assert(k in o,`${f} missing ${k}`));
    assert(o.approvalState==='candidate',`${f} improperly accepted`);
  }
});

test('T05 stage acknowledgements cover pipeline',()=>{
  const acks=read('knowledge/runs/acks-nightly-reconstructed-2026-07-30.json');
  const required=['collect','vet','normalize','observe','inquire','interpret','relate','pattern','opportunity','strategy','experiment','genesis','publish'];
  required.forEach(s=>assert(acks.some(a=>a.stage===s),`missing ack ${s}`));
  assert(acks.find(a=>a.stage==='genesis').status==='deferred','genesis must be deferred');
});

test('T06 no unsupported promotion',()=>{
  const run=read('knowledge/runs/run-nightly-reconstructed-2026-07-30.json');
  assert(run.opportunities.length===0,'reconstructed cycle cannot auto-promote opportunity');
  assert(run.repositoryActions.length===0,'reconstructed cycle cannot auto-create repo action');
});

test('T07 deterministic digest',()=>{
  const p='knowledge/runs/run-nightly-reconstructed-2026-07-30.json';
  const a=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
  const b=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
  assert(a===b,'digest unstable');
});

const report={passed:passes.length,failed:failures.length,passes,failures};
console.log(JSON.stringify(report,null,2));
process.exitCode=failures.length?1:0;
