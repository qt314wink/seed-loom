#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createHash } from 'node:crypto';
import { canonicalStringify, digest, fileDigest } from './lib/canonical-json.mjs';

const CONTROL='WS3';
const CONFIG={jaccardWeight:0.7,ngramWeight:0.3,duplicateCandidateThreshold:0.72,negationContrastThreshold:0.70,nearMissThreshold:0.45,timeMismatchPenalty:0.30,jurisdictionMismatchPenalty:0.25,numericMismatchPenalty:0.25};
const BOILERPLATE=[/^according to (?:reports|sources familiar with the matter),?\s*/i,/^it was reported that\s*/i,/^reports indicate that\s*/i,/^sources say that\s*/i];
const STOP=new Set('a an the and or of to in on for with by at from as is are was were be been its this that these those according reports sources familiar matter it reported public new'.split(' '));
const NEG=new Set(['not','never','no','neither','nor','without','denied','reject','rejected','failed']);
const JURIS=['european union','california','united states','united kingdom','canada','australia','new york','texas'];
const STATUS=new Set(['adopted','proposed','approved','rejected','retracted','superseded','closed','open']);
const SYN=new Map([['secured','raised'],['raise','raised'],['raises','raised'],['launches','launched'],['launch','launched'],['imposed','introduced']]);
const MONTHS={january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};

function parseArgs(argv){const out={}; for(let i=0;i<argv.length;i++){const a=argv[i]; if(a.startsWith('--')){const k=a.slice(2); const v=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true; out[k]=v;}} return out;}
function readJson(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function listJson(dir){if(!fs.existsSync(dir)) return []; return fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort().map(f=>path.join(dir,f));}
function shaText(s){return createHash('sha256').update(s).digest('hex');}
function escapeRe(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function normalizeDateText(text){return text.replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),\s*(\d{4})\b/gi,(_,m,d,y)=>`${y}-${MONTHS[m.toLowerCase()]}-${String(d).padStart(2,'0')}`);}
function applyAliases(text,aliases){let out=text; for(const {alias,canonical} of aliases.slice().sort((a,b)=>b.alias.length-a.alias.length)){out=out.replace(new RegExp(`\\b${escapeRe(alias)}\\b`,'gi'),canonical);} return out;}
function stripBoilerplate(text){let out=text.trim(); let changed=true; while(changed){changed=false; for(const re of BOILERPLATE){const n=out.replace(re,''); if(n!==out){out=n;changed=true;}}} return out;}
function tokens(text){return text.split(' ').filter(Boolean);}
function uniqSorted(xs){return [...new Set(xs)].sort();}
function setJaccard(a,b){const A=new Set(a),B=new Set(b); if(!A.size&&!B.size)return 1; let i=0; for(const x of A) if(B.has(x))i++; return i/(A.size+B.size-i);}
function ngrams(ts,n=2){const m=new Map(); for(let i=0;i+n<=ts.length;i++){const g=ts.slice(i,i+n).join(' ');m.set(g,(m.get(g)||0)+1);} return m;}
function cosine(a,b){const keys=new Set([...a.keys(),...b.keys()]);let dot=0,aa=0,bb=0;for(const k of keys){const x=a.get(k)||0,y=b.get(k)||0;dot+=x*y;aa+=x*x;bb+=y*y;}return aa&&bb?dot/Math.sqrt(aa*bb):0;}
function extractDates(text){return uniqSorted(text.match(/\b\d{4}-\d{2}-\d{2}\b/g)||[]);}
function extractNumbers(text){return uniqSorted((text.match(/\b\d+(?:\.\d+)?\b/g)||[]).filter(x=>!/^\d{4}$/.test(x)));}
function extractJurisdictions(text){return JURIS.filter(j=>text.includes(j));}
function extractStatuses(ts){return uniqSorted(ts.filter(t=>STATUS.has(t)));}
function hardMismatch(a,b){return {time:a.tuple.time.length&&b.tuple.time.length&&JSON.stringify(a.tuple.time)!==JSON.stringify(b.tuple.time),jurisdiction:a.tuple.jurisdiction.length&&b.tuple.jurisdiction.length&&JSON.stringify(a.tuple.jurisdiction)!==JSON.stringify(b.tuple.jurisdiction),numeric:a.numbers.length&&b.numbers.length&&JSON.stringify(a.numbers)!==JSON.stringify(b.numbers),status:a.statuses.length&&b.statuses.length&&JSON.stringify(a.statuses)!==JSON.stringify(b.statuses)};}

export function normalizeClaim(raw,aliases){
  let text=String(raw||'').normalize('NFKC').toLowerCase();
  text=stripBoilerplate(text); text=normalizeDateText(text); text=applyAliases(text,aliases);
  text=text.replace(/\bseries\s+([a-z])\b/g,'series-$1').replace(/[^a-z0-9-]+/g,' ').replace(/\s+/g,' ').trim();
  const rawTokens=tokens(text); const negated=rawTokens.some(t=>NEG.has(t))||/failed to|did not|does not|do not/.test(text);
  const fingerprintTokens=rawTokens.filter(t=>!STOP.has(t)&&!NEG.has(t)&&t!=='did'&&t!=='does'&&t!=='do');
  const normalizedTokens=fingerprintTokens.map(t=>SYN.get(t)||t);
  const normalized=normalizedTokens.join(' ');
  const fingerprintNormalized=fingerprintTokens.join(' ');
  const dates=extractDates(text); const jurisdictions=extractJurisdictions(text); const statuses=extractStatuses(normalizedTokens); const numbers=extractNumbers(text);
  const subject=normalizedTokens.slice(0,2).join(' '); const action=normalizedTokens[2]||''; const object=normalizedTokens.slice(3).join(' ');
  const tuple={subject,action,object,time:dates,jurisdiction:jurisdictions,negated};
  const fingerprintTuple={...tuple,action:fingerprintTokens[2]||'',object:fingerprintTokens.slice(3).join(' ')};
  const fingerprint=shaText(canonicalStringify({...fingerprintTuple,normalized:fingerprintNormalized}));
  return {normalized,normalizedTokens,tuple,fingerprint,numbers,statuses};
}

export function analyzeClaims(claims,aliases,meta={mode:'fixture',generatedAt:'2026-07-31T00:00:00Z',inputPath:'fixture'}){
  const normalized=claims.map(c=>({id:c.id??c.observationId, ...normalizeClaim(c.claim??c.title??'',aliases)})).sort((a,b)=>a.id.localeCompare(b.id));
  const candidates=[]; const pairScores=new Map();
  for(let i=0;i<normalized.length;i++) for(let j=i+1;j<normalized.length;j++){
    const a=normalized[i],b=normalized[j]; const tokenJaccard=setJaccard(a.normalizedTokens,b.normalizedTokens); const ngramCosine=cosine(ngrams(a.normalizedTokens),ngrams(b.normalizedTokens));
    let combined=CONFIG.jaccardWeight*tokenJaccard+CONFIG.ngramWeight*ngramCosine; const mm=hardMismatch(a,b);
    if(mm.time)combined-=CONFIG.timeMismatchPenalty;if(mm.jurisdiction)combined-=CONFIG.jurisdictionMismatchPenalty;if(mm.numeric)combined-=CONFIG.numericMismatchPenalty;if(mm.status)combined-=0.18;
    combined=Math.max(0,Math.min(1,combined)); const pair=[a.id,b.id].sort(); pairScores.set(pair.join('|'),combined);
    let relation=null,rationale='';
    if(a.tuple.negated!==b.tuple.negated && (tokenJaccard>=CONFIG.negationContrastThreshold || ngramCosine>=CONFIG.negationContrastThreshold)){relation='negation-contrast';rationale='High lexical overlap with opposite negation state; claims remain distinct.';}
    else if(!Object.values(mm).some(Boolean) && combined>=CONFIG.duplicateCandidateThreshold){relation='duplicate-candidate';rationale='Normalized lexical and n-gram similarity exceeds candidate threshold; human review required.';}
    else if(combined>=CONFIG.nearMissThreshold){relation='distinct';rationale=`Near-match retained as distinct due to ${Object.entries(mm).filter(([,v])=>v).map(([k])=>k).join(', ')||'material semantic differences'}.`;}
    if(relation){const similarity={tokenJaccard:Number(tokenJaccard.toFixed(6)),ngramCosine:Number(ngramCosine.toFixed(6)),combined:Number(combined.toFixed(6))};const candidateId=`dup-candidate:${digest({pair,relation,similarity}).slice(0,12)}`;candidates.push({candidateId,memberRefs:pair,similarity,sharedFingerprint:a.fingerprint===b.fingerprint,relation,rationale,manualReviewRequired:relation!=='distinct',status:'proposed'});}
  }
  candidates.sort((a,b)=>a.candidateId.localeCompare(b.candidateId));
  const claimsOut=normalized.map(({id,fingerprint,normalized,tuple})=>({id,fingerprint,normalized,tuple}));
  const inputSha=meta.inputSha||shaText(canonicalStringify(claims)); const inputClaims=claimsOut.map(c=>({id:c.id,path:meta.inputPath,sha256:inputSha}));
  const core={type:'DuplicateCandidateReport',control:CONTROL,generatedAt:meta.generatedAt,config:{aliasConfigVersion:meta.aliasConfigVersion||'1.0.0',...CONFIG},input:{mode:meta.mode||'fixture',claims:inputClaims},claimsAnalyzed:claimsOut.length,claims:claimsOut,candidates,reviewQueue:candidates.filter(c=>c.manualReviewRequired).map(c=>c.candidateId).sort(),warnings:[]};
  return {reportId:`duplicate-candidate-report:${digest(core).slice(0,12)}`,...core,pairScores:Object.fromEntries([...pairScores.entries()].sort())};
}

async function cli(){const args=parseArgs(process.argv.slice(2)); const now=args.now||new Date().toISOString(); const aliasPath=args.aliases||'knowledge/config/claim-aliases.json'; const aliasConfig=readJson(aliasPath); let claims=[],mode='canonical',inputPath='knowledge/observations';
  if(args.input){inputPath=args.input; if(fs.statSync(args.input).isDirectory()){claims=listJson(args.input).map(readJson);}else{const raw=readJson(args.input);claims=raw.claims||[raw];mode=raw.fixtureId?'fixture':'input-dir';}}
  else claims=listJson('knowledge/observations').map(readJson);
  const inputSha=fs.existsSync(inputPath)&&fs.statSync(inputPath).isFile()?await fileDigest(inputPath):shaText(canonicalStringify(claims));
  const analyzed=analyzeClaims(claims,aliasConfig.aliases,{mode,generatedAt:now,inputPath,inputSha,aliasConfigVersion:aliasConfig.version}); const {pairScores,...report}=analyzed;
  const outDir=args.out||'knowledge/candidates/claim-identity'; fs.mkdirSync(outDir,{recursive:true}); const label=now.replace(/[-:]/g,'').replace('.000',''); const reportPath=path.join(outDir,`duplicate-candidate-report-${label}.json`); fs.writeFileSync(reportPath,canonicalStringify(report)+'\n');
  const receiptPayload={control:CONTROL,reportId:report.reportId,candidates:report.candidates,reviewQueue:report.reviewQueue}; const receipt={receiptId:`claim-identity-receipt:${digest(receiptPayload).slice(0,12)}`,control:CONTROL,generatedAt:now,inputs:report.input.claims,results:{claimsAnalyzed:report.claimsAnalyzed,candidateCount:report.candidates.filter(c=>c.relation==='duplicate-candidate').length,negationContrastCount:report.candidates.filter(c=>c.relation==='negation-contrast').length,reviewQueue:report.reviewQueue,reportPath},violations:[],digest:digest(receiptPayload)};
  const receiptDir=args['receipt-out']||'knowledge/receipts/claim-identity'; fs.mkdirSync(receiptDir,{recursive:true}); fs.writeFileSync(path.join(receiptDir,`claim-identity-receipt-${label}.json`),canonicalStringify(receipt)+'\n');
  console.log(`DIGEST semantic-duplicates ${receipt.digest}`); console.log(`PASS surfaced ${report.reviewQueue.length} review candidate(s); no canonical records changed`);
}
if(import.meta.url===`file://${process.argv[1]}`) cli().catch(e=>{console.error(`FAIL ${e.stack||e.message}`);process.exit(2)});
