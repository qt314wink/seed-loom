#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const dirs = ['sources','entities','observations','patterns','relationships','opportunities','strategies','experiments','runs','receipts'];
const nodes = new Map();
const edges = [];
const idOf = (v) => v.id ?? v.runId ?? v.observationId ?? v.sourceId ?? v.relationshipId ?? v.ackId ?? v.assessmentId ?? null;
const typeOf = (v, dir) => v.type ?? ({sources:'Source',entities:'Actor',observations:'Observation',patterns:'Pattern',relationships:'Relationship',opportunities:'Opportunity',strategies:'Strategy',experiments:'Experiment',runs:'Run',receipts:'Receipt'}[dir] ?? 'Record');

for (const dir of dirs) {
  const absolute = path.join(root, 'knowledge', dir);
  if (!fs.existsSync(absolute)) continue;
  for (const file of fs.readdirSync(absolute).filter(f => f.endsWith('.json')).sort()) {
    const relative = path.join('knowledge', dir, file).replaceAll('\\','/');
    const raw = JSON.parse(fs.readFileSync(path.join(absolute, file), 'utf8'));
    const records = Array.isArray(raw) ? raw : raw.sources && !raw.type ? raw.sources : [raw];
    for (const record of records) {
      const id = idOf(record);
      if (!id) continue;
      const type = typeOf(record, dir);
      nodes.set(id, { id, type, label: record.title ?? record.name ?? record.claim ?? id, path: relative, confidence: record.confidence ?? null, status: record.status ?? record.approvalState ?? record.evidenceMaturity ?? null, record });
      if (type === 'Relationship' || record.from && record.to) edges.push({ id, from: record.from, to: record.to, predicate: record.predicate ?? 'RELATES_TO', confidence: record.confidence ?? null, explicit: true });
    }
  }
}

const refFields = {
  sourceRefs:'SUPPORTED_BY', counterevidenceRefs:'CONTRADICTED_BY', actorRefs:'INVOLVES', affectedRepositories:'APPLIES_TO',
  observationRefs:'DERIVED_FROM', opportunityRefs:'DERIVED_FROM', evidenceRefs:'SUPPORTED_BY', newObservations:'GENERATED',
  updatedObservations:'UPDATED', candidatePatterns:'GENERATED', newRelationships:'GENERATED', contradictions:'CONTRADICTS',
  opportunities:'GENERATED', proposedExperiments:'GENERATED', noChangeReceipts:'GENERATED'
};
for (const node of nodes.values()) {
  for (const [field,predicate] of Object.entries(refFields)) {
    const refs = node.record[field];
    if (!Array.isArray(refs)) continue;
    for (const target of refs) {
      if (typeof target !== 'string') continue;
      if (!nodes.has(target)) nodes.set(target,{id:target,type:target.startsWith('qt314wink/')||target.startsWith('MelodicBloom/')?'Repository':'Unresolved',label:target,path:null,confidence:null,status:'unresolved',record:{id:target}});
      edges.push({ id:`implicit:${node.id}:${predicate}:${target}`, from:node.id, to:target, predicate, confidence:node.confidence, explicit:false });
    }
  }
}
const payload = { generatedAt:new Date().toISOString(), canonicalRoot:'knowledge/', nodes:[...nodes.values()].sort((a,b)=>a.id.localeCompare(b.id)), edges:edges.sort((a,b)=>a.id.localeCompare(b.id)) };
const stable = JSON.stringify({nodes:payload.nodes,edges:payload.edges});
payload.sha256 = crypto.createHash('sha256').update(stable).digest('hex');
const out = path.join(root,'tools','graph-workbench','data.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(payload,null,2)+'\n');
console.log(JSON.stringify({output:path.relative(root,out),nodes:payload.nodes.length,edges:payload.edges.length,sha256:payload.sha256},null,2));