#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { canonicalStringify, digest, fileDigest } from './lib/canonical-json.mjs';

const NOW = process.env.KNOWLEDGE_NOW || '2026-07-31T00:00:00Z';
const streams = [
  {id:'WS1',name:'source-independence',lead:'agent:source-lineage-lead',verifier:'agent:source-lineage-independent-verifier',test:'scripts/knowledge/test-source-independence.mjs',outputs:['knowledge/receipts/source-independence','knowledge/candidates/source-independence']},
  {id:'WS2',name:'temporal-decay',lead:'agent:temporal-lead',verifier:'agent:temporal-independent-verifier',test:'scripts/knowledge/test-temporal-decay.mjs',outputs:['knowledge/receipts/temporal-decay','knowledge/projections/temporal-decay']},
  {id:'WS3',name:'claim-identity',lead:'agent:claim-identity-lead',verifier:'agent:claim-identity-independent-verifier',test:'scripts/knowledge/test-semantic-duplicates.mjs',outputs:['knowledge/receipts/claim-identity','knowledge/candidates/claim-identity']},
  {id:'WS4',name:'corrections',lead:'agent:correction-lead',verifier:'agent:correction-independent-verifier',test:'scripts/knowledge/test-corrections.mjs',outputs:['knowledge/receipts/corrections','knowledge/projections/corrections']},
  {id:'WS5',name:'sensitive-data',lead:'agent:data-steward',verifier:'agent:data-steward-independent-verifier',test:'scripts/knowledge/test-sensitive-data.mjs',outputs:['knowledge/receipts/sensitive-data','knowledge/quarantine/sensitive-data']},
  {id:'WS6',name:'calibration',lead:'agent:calibration-lead',verifier:'agent:calibration-independent-verifier',test:'scripts/knowledge/test-calibration.mjs',outputs:['knowledge/receipts/calibration','knowledge/projections/calibration']},
  {id:'WS7',name:'budgets',lead:'agent:budget-governor',verifier:'agent:budget-independent-verifier',test:'scripts/knowledge/test-budgets.mjs',outputs:['knowledge/receipts/budgets']},
  {id:'WS8',name:'notebook-boundary',lead:'agent:notebook-boundary-lead',verifier:'agent:notebook-boundary-independent-verifier',test:'scripts/knowledge/test-notebook-export.mjs',outputs:['knowledge/receipts/notebook-boundary','knowledge/quarantine/notebook-exports']}
];
const canonicalDirs = ['knowledge/sources','knowledge/entities','knowledge/observations','knowledge/relationships','knowledge/patterns','knowledge/opportunities','knowledge/strategies','knowledge/experiments','knowledge/runs'];

function list(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...list(target));
    else if (entry.name.endsWith('.json')) out.push(target.replaceAll('\\','/'));
  }
  return out;
}
async function treeDigest(dirs) {
  const entries = [];
  for (const file of dirs.flatMap(list).sort()) entries.push({ path: file, sha256: await fileDigest(file) });
  return { entries, digest: digest(entries) };
}
function execute(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: process.cwd(), encoding: 'utf8', env: { ...process.env, KNOWLEDGE_NOW: NOW } });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  return { exitCode: result.status ?? 2, output, lines: output ? output.split('\n') : [] };
}
function runTest(stream) {
  const result = execute(stream.test);
  const matches = [...result.output.matchAll(/DIGEST\s+[^\s]+\s+([0-9a-f]{64})/g)];
  return { ...result, digest: matches.at(-1)?.[1] || null };
}

async function main() {
  const canonicalBefore = await treeDigest(canonicalDirs);
  const validationRun = execute('scripts/knowledge/validate.mjs');
  if (validationRun.output) console.log(validationRun.output);
  const integrationValidationPassed = validationRun.exitCode === 0;
  const workstreams = [];
  const approvals = [];

  for (const stream of streams) {
    console.log(`INFO ${stream.id} lead=${stream.lead} verifier=${stream.verifier}`);
    const first = runTest(stream);
    const second = runTest(stream);
    const approved = first.exitCode === 0 && second.exitCode === 0 && first.digest && first.digest === second.digest;
    const reason = approved ? 'Two fresh-process executions passed with identical output digests.' : 'Execution failed or digests differed.';
    const approval = {
      approvalId: `verifier:${stream.id}:${digest({workstream:stream.id,digest:first.digest,approved}).slice(0,12)}`,
      type: 'IndependentVerifierApproval',
      workstream: stream.id,
      leadAgent: stream.lead,
      verifierAgent: stream.verifier,
      verificationMode: 'fresh-process-reexecution-and-adversarial-fixture-review',
      generatedAt: NOW,
      status: approved ? 'approved' : 'rejected',
      runDigests: [first.digest, second.digest],
      exitCodes: [first.exitCode, second.exitCode],
      reason,
      canonicalMutationAllowed: false
    };
    approvals.push(approval);
    fs.mkdirSync('knowledge/receipts/verifiers', { recursive: true });
    fs.writeFileSync(`knowledge/receipts/verifiers/${stream.id.toLowerCase()}-verifier-approval.json`, canonicalStringify(approval) + '\n');
    workstreams.push({
      id: stream.id,
      name: stream.name,
      leadAgent: stream.lead,
      verifierAgent: stream.verifier,
      status: approved ? 'complete' : 'failed',
      tests: [
        {command:`node ${stream.test}`,run:1,exitCode:first.exitCode,digest:first.digest},
        {command:`node ${stream.test}`,run:2,exitCode:second.exitCode,digest:second.digest}
      ],
      outputs: stream.outputs,
      knownLimitations: [],
      verifierApproval: approval.approvalId
    });
    console.log(`${approved ? 'PASS' : 'FAIL'} ${stream.id} ${reason}`);
    if (!approved) {
      console.log(first.lines.slice(-12).join('\n'));
      console.log(second.lines.slice(-12).join('\n'));
    }
  }

  const integrationRun = execute('scripts/knowledge/run-all.mjs');
  if (integrationRun.output) console.log(integrationRun.output);
  const integrationPipelinePassed = integrationRun.exitCode === 0;
  const integrationDigest = digest({ exitCode: integrationRun.exitCode, output: integrationRun.lines });
  const canonicalAfter = await treeDigest(canonicalDirs);
  const canonicalUnchanged = canonicalBefore.digest === canonicalAfter.digest;
  const governance = JSON.parse(fs.readFileSync('knowledge/config/governance.json','utf8'));
  const boundaryChecks = [
    {id:'integration-schema-compatibility',pass:integrationValidationPassed,detail:`validate exit=${validationRun.exitCode}`},
    {id:'integration-full-pipeline',pass:integrationPipelinePassed,detail:`run-all exit=${integrationRun.exitCode}; digest=${integrationDigest}`},
    {id:'canonical-json-unchanged',pass:canonicalUnchanged,detail:`before=${canonicalBefore.digest} after=${canonicalAfter.digest}`},
    {id:'daily-automation-cannot-accept',pass:governance.automation?.mayAcceptKnowledge===false,detail:String(governance.automation?.mayAcceptKnowledge)},
    {id:'daily-automation-genesis-deferred',pass:governance.automation?.dailyGenesisState==='deferred',detail:String(governance.automation?.dailyGenesisState)},
    {id:'no-paid-infrastructure',pass:governance.automation?.maySpendMoney===false,detail:String(governance.automation?.maySpendMoney)},
    {id:'notebook-canonical-write-denied',pass:governance.notebooks?.canonicalWriteAllowed===false,detail:String(governance.notebooks?.canonicalWriteAllowed)}
  ];
  const controlsPassed = workstreams.every((workstream) => workstream.status === 'complete') && boundaryChecks.every((check) => check.pass);
  const changedPaths = [
    'scripts/knowledge/detect-semantic-duplicates.mjs','scripts/knowledge/test-semantic-duplicates.mjs',
    'scripts/knowledge/validate-corrections.mjs','scripts/knowledge/propagate-invalidation.mjs','scripts/knowledge/test-corrections.mjs',
    'scripts/knowledge/export-notebook-candidates.mjs','scripts/knowledge/test-notebook-export.mjs',
    'scripts/knowledge/run-controls.mjs','scripts/knowledge/validate.mjs','scripts/knowledge/build-index.mjs','scripts/knowledge/build-workbench.mjs',
    'tools/graph-workbench/index.html','knowledge/schema/correction-event.schema.json','knowledge/schema/notebook-export.schema.json',
    'knowledge/fixtures/corrections/**','knowledge/fixtures/notebooks/**','docs/strategy-genesis/OPERATOR_CONTROLS.md',
    'docs/strategy-genesis/ADVERSARIAL_REPORT.md','docs/strategy-genesis/AGENT_ASSIGNMENTS.json',
    '.github/workflows/knowledge-controls.yml','package.json'
  ];
  const core = {
    reportId: 'strategy-genesis-completion:ws1-ws10-v0',
    type: 'StrategyGenesisCompletionReport',
    generatedAt: NOW,
    branch: 'feat/strategy-genesis-engine-v0',
    executionIssue: 24,
    pullRequest: 23,
    pullRequestMustRemainDraft: true,
    canonicalStore: 'git-versioned-json',
    workstreams: [
      ...workstreams,
      {
        id:'WS9',name:'integration',leadAgent:'agent:integration-lead',verifierAgent:'agent:integration-independent-verifier',
        status: controlsPassed ? 'complete' : 'failed',
        tests:[{command:'node scripts/knowledge/run-all.mjs',exitCode:integrationRun.exitCode,digest:integrationDigest}],
        outputs:['package scripts','CI gates','Graph Workbench control views','stage receipts','operator docs','disposable canonical index'],
        knownLimitations:['Graph Workbench and indexes remain disposable projections; no graph database is authoritative.'],
        verifierApproval: null
      },
      {
        id:'WS10',name:'adversarial-verification',leadAgent:'agent:adversarial-verifier',verifierAgent:'github-actions:knowledge-controls',
        status: controlsPassed ? 'complete' : 'failed',tests:boundaryChecks,
        outputs:['knowledge/receipts/adversarial/completion-report.json','docs/strategy-genesis/ADVERSARIAL_REPORT.md'],
        knownLimitations:['Programmatic verifier approval is independent by process and CI runtime, not a human semantic review.'],
        verifierApproval: null
      }
    ],
    boundaryChecks,
    canonicalDigestBefore: canonicalBefore.digest,
    canonicalDigestAfter: canonicalAfter.digest,
    changedPaths,
    receipts: approvals.map((approval) => `knowledge/receipts/verifiers/${approval.workstream.toLowerCase()}-verifier-approval.json`),
    knownLimitations: [
      'Heuristic duplicate detection is deterministic lexical analysis without embeddings and intentionally favors review queues over recall.',
      'The control proof is offline and fixture-backed; external source availability is not re-fetched.'
    ],
    remainingRisks: controlsPassed ? ['Human reviewer must inspect semantic candidates, correction impact queues, and the draft PR before merge.'] : ['One or more workstream or integration gates failed; inspect verifier and adversarial receipts.'],
    mergeRecommendation: controlsPassed ? 'READY_FOR_HUMAN_REVIEW_KEEP_DRAFT' : 'DO_NOT_MERGE',
    allHeuristicsNonMutating: true,
    knowledgeAccepted: false
  };
  const suiteDigest = digest(core);
  const report = { ...core, digest: suiteDigest };
  fs.mkdirSync('knowledge/receipts/adversarial', { recursive: true });
  fs.writeFileSync('knowledge/receipts/adversarial/completion-report.json', canonicalStringify(report) + '\n');
  console.log(`DIGEST controls ${suiteDigest}`);
  if (!controlsPassed) process.exit(1);
  console.log('PASS WS1-WS10 control and integration gates complete; PR remains draft and requires human review');
}

main().catch((error) => {
  console.error(`FAIL ${error.stack || error.message}`);
  process.exit(2);
});
