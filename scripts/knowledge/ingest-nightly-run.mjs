#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [inputArg] = process.argv.slice(2);
if(!inputArg){ console.error('usage: node scripts/knowledge/ingest-nightly-run.mjs <run-bundle.json>'); process.exit(2); }
const root=process.cwd();
const bundle=JSON.parse(fs.readFileSync(path.resolve(inputArg),'utf8'));
const required=['run','sources','observations','relationships','stageAcks'];
for(const key of required) if(!(key in bundle)) throw new Error(`bundle missing ${key}`);
if(bundle.observations.length!==5) throw new Error('nightly bundle must contain exactly five observations');
if(bundle.run.type!=='ResearchRun') throw new Error('invalid run type');
if(bundle.observations.some(o=>o.approvalState!=='candidate')) throw new Error('daily intake may only create candidate observations');
if(bundle.run.repositoryActions?.length) throw new Error('daily intake cannot execute repository actions');
const write=(dir,id,obj)=>{
  const safe=id.replace(/[:/]/g,'-'); const target=path.join(root,'knowledge',dir,`${safe}.json`);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  if(fs.existsSync(target)) throw new Error(`immutable record exists: ${target}`);
  fs.writeFileSync(target,JSON.stringify(obj,null,2)+'\n'); return target;
};
const written=[];
for(const s of bundle.sources) written.push(write('sources',s.sourceId,s));
for(const o of bundle.observations) written.push(write('observations',o.observationId,o));
for(const r of bundle.relationships) written.push(write('relationships',r.relationshipId,r));
written.push(write('runs',bundle.run.runId,bundle.run));
written.push(write('runs',`${bundle.run.runId}-acks`,bundle.stageAcks));
const receipt={runId:bundle.run.runId,createdAt:new Date().toISOString(),files:written.map(f=>path.relative(root,f)),sha256:{}};
for(const f of written) receipt.sha256[path.relative(root,f)]=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
write('receipts',`${bundle.run.runId}-ingest`,receipt);
console.log(JSON.stringify(receipt,null,2));
