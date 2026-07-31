#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const now = process.env.KNOWLEDGE_NOW || new Date().toISOString();
const canonicalDirs = ['sources','entities','observations','relationships','patterns','opportunities','strategies','experiments','runs'];

function walk(dir){
  if(!fs.existsSync(dir)) return [];
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...walk(full));
    else if(entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}
function stable(value){
  if(Array.isArray(value)) return value.map(stable);
  if(value && typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function digest(value){ return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex'); }
function readJson(file){ return JSON.parse(fs.readFileSync(file,'utf8')); }
function run(name,args){
  const startedAt=new Date().toISOString();
  const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',env:{...process.env,KNOWLEDGE_NOW:now}});
  return {name,command:[process.execPath,...args].join(' '),startedAt,completedAt:new Date().toISOString(),exitCode:result.status??2,stdout:(result.stdout||'').trim(),stderr:(result.stderr||'').trim()};
}
function inventory(){
  const records=[];
  for(const dir of canonicalDirs){
    for(const file of walk(path.join(root,'knowledge',dir))){
      try{ const value=readJson(file); records.push({path:path.relative(root,file).replaceAll('\\','/'),type:value.type||'Unknown',id:value.id||value.runId||value.ackId||null,sha256:digest(value)}); }
      catch(error){ records.push({path:path.relative(root,file).replaceAll('\\','/'),type:'ParseFailure',id:null,error:error.message}); }
    }
  }
  return records.sort((a,b)=>a.path.localeCompare(b.path));
}
function provenanceChecks(records){
  const failures=[];
  const ids=new Set(records.map(r=>r.id).filter(Boolean));
  for(const record of records){
    if(record.error) failures.push({code:'JSON_PARSE_FAILURE',path:record.path,detail:record.error});
    if(!record.id && record.type!=='ParseFailure') failures.push({code:'MISSING_STABLE_ID',path:record.path});
  }
  for(const file of walk(path.join(root,'knowledge','observations'))){
    const value=readJson(file);
    for(const ref of value.sourceRefs||[]) if(!ids.has(ref)) failures.push({code:'UNRESOLVED_SOURCE_REF',path:path.relative(root,file),ref});
  }
  for(const file of walk(path.join(root,'knowledge','relationships'))){
    const value=readJson(file);
    for(const ref of [value.from,value.to,...(value.evidenceRefs||[])].filter(Boolean)) if(!ids.has(ref)) failures.push({code:'UNRESOLVED_RELATIONSHIP_REF',path:path.relative(root,file),ref});
  }
  return failures;
}
function governanceChecks(){
  const file=path.join(root,'knowledge','config','governance.json');
  if(!fs.existsSync(file)) return [{code:'MISSING_GOVERNANCE_CONFIG',path:'knowledge/config/governance.json'}];
  const g=readJson(file); const failures=[];
  if(g.automation?.mayAcceptKnowledge!==false) failures.push({code:'AUTOMATION_ACCEPTANCE_NOT_DENIED'});
  if(g.automation?.dailyGenesisState!=='deferred') failures.push({code:'DAILY_GENESIS_NOT_DEFERRED'});
  if(g.automation?.maySpendMoney!==false) failures.push({code:'AUTOMATION_SPEND_NOT_DENIED'});
  if(g.notebooks?.canonicalWriteAllowed!==false) failures.push({code:'NOTEBOOK_CANONICAL_WRITE_NOT_DENIED'});
  return failures;
}

const records=inventory();
const stages=[
  run('schema',['scripts/knowledge/validate.mjs']),
  run('contract',['scripts/knowledge/test-contract-phase-a.mjs'])
];
const provenanceFailures=provenanceChecks(records);
const governanceFailures=governanceChecks();
const status=stages.every(s=>s.exitCode===0)&&provenanceFailures.length===0&&governanceFailures.length===0?'passed':'failed';
const core={receiptId:`integrity:${now.replace(/[^0-9]/g,'').slice(0,14)}`,type:'KnowledgeIntegrityReceipt',engineVersion:'0.1.0',generatedAt:now,status,recordCount:records.length,inventoryDigest:digest(records),stages:stages.map(s=>({name:s.name,command:s.command,exitCode:s.exitCode,startedAt:s.startedAt,completedAt:s.completedAt,stdoutDigest:digest(s.stdout),stderrDigest:digest(s.stderr)})),provenanceFailures,governanceFailures,boundaries:{canonicalMutationAllowed:false,knowledgeAcceptanceAllowed:false,repositoryGenesisAllowed:false,externalSpendAllowed:false}};
const receipt={...core,receiptDigest:digest(core)};
fs.mkdirSync(path.join(root,'knowledge','receipts','integrity'),{recursive:true});
const out=path.join(root,'knowledge','receipts','integrity','latest.json');
fs.writeFileSync(out,JSON.stringify(stable(receipt),null,2)+'\n');
console.log(JSON.stringify(receipt,null,2));
if(status!=='passed') process.exit(1);
