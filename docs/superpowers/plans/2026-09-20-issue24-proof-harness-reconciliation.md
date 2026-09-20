# Issue #24 Nightly Proof Harness Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use a subagent-driven implementation if available; otherwise execute task-by-task from the parent Codex session. Writers must be serialized. Read-only audits may run in parallel.

**Goal:** Reconcile the existing unmerged Issue #24 proof-harness implementation onto current `main`, reuse the already-committed September 10 NightlyRunBundle, persist its Socratic assessments, and produce the two-clean-run + graph + atomic-failure proof required to close the final infrastructure gate.

**Architecture:** Current `main` already contains the governed nightly intake bridge (`nightly-knowledge-ingest.yml` + `ingest-nightly-intake.mjs`). Do not replace it. Port only the missing proof behavior from PR #44 (`copilot/implement-bounded-proof-harness`) onto a fresh branch from current `main`, adapting it to the live intake path and bundle shape. Issue #24 remains the authority.

**Tech Stack:** Node.js 22.12+ (22.x preferred), npm 10.9.2, Git, GitHub Actions, AJV 8, existing Seed Loom knowledge scripts.

**Spec:** GitHub Issue #24 is authoritative. Current acceptance comments: 2026-09-08 build-ready execution contract and 2026-09-15 P0 approval. No new competing design authority should be created.

## Global Constraints

- Canonical repository: `qt314wink/seed-loom`.
- Working branch: `fix/issue24-proof-harness-reconcile-2026-09-20`.
- Baseline: current `main` at branch creation, `5f329ea08174e8c397d0627261661d3637b954b9`.
- Reuse exact intake specimen: `knowledge/intake/nightly/2026-09-10/nightly-run-bundle-2026-09-10.json`.
- Specimen Git blob: `ca6129be03f3a9f8de7587f51ce7e1166f380d7d`.
- Previously recorded specimen SHA-256: `35723cf256d336eece3f9b3c3ffa14d9db56d12e403a34c9d4040403d858ab3c`.
- Do not add another copy under `ops/nightly-intake/`.
- Do not modify canonical schemas unless a failing acceptance test proves Issue #24 impossible without it; stop instead.
- Do not auto-accept observations, execute strategy/experiments, advance Genesis, merge, deploy, spend, contact external parties, or publish.
- Do not merge PR #40 or #44 wholesale. They are stale and diverged. Port behavior selectively.
- Preserve the already-merged nightly bridge from PR #45.
- Exactly five observations; all remain `approvalState=candidate`.
- Genesis must remain `deferred` with `allowedTransition=false`.
- Repository actions must remain `status=proposed`, `executed=false`.

## Review Focus

1. **Stale donor branch:** port only behavior from PR #44; never overwrite current-main changes in ingest/package/workflows.
2. **Current bundle shape:** September 10 has no legacy `bundleType/review/provenance` top-level wrapper; proof provenance must come from tracked Git path/blob + raw SHA, not invented metadata.
3. **Socratic persistence:** five existing assessments must validate against the existing schema, reference the five bundled observations, participate in rollback, and appear in the ingest receipt.
4. **True isolation:** run A and B must start from the same clean baseline without pre-seeded generated receipts/indexes/workbench data.
5. **Atomic failure:** negative tests must compare canonical-tree digests before/after and prove zero residual writes, including late-write rollback.

---

### Task 1: Establish branch, environment, and donor-diff guard

**Files:**
- Create: `scripts/bootstrap-issue24-proof.sh`
- No production behavior changes.

**Interfaces:**
- Consumes: current-main package/lockfile; September 10 intake bundle.
- Produces: repeatable local/Codex bootstrap and baseline receipt.

- [ ] **Step 1: Verify branch and baseline before mutation**

Run:

```bash
git fetch origin --prune
git switch fix/issue24-proof-harness-reconcile-2026-09-20
git status --short
git merge-base --is-ancestor 5f329ea08174e8c397d0627261661d3637b954b9 HEAD
git rev-parse HEAD
```

Expected: clean tree; branch descends from the pinned main baseline.

- [ ] **Step 2: Add bootstrap script**

Create `scripts/bootstrap-issue24-proof.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

EXPECTED_REPO="qt314wink/seed-loom"
BUNDLE="knowledge/intake/nightly/2026-09-10/nightly-run-bundle-2026-09-10.json"
EXPECTED_BLOB="ca6129be03f3a9f8de7587f51ce7e1166f380d7d"

node -e '
const [major,minor]=process.versions.node.split(".").map(Number);
if (!(major === 20 && minor >= 19) && !(major >= 22)) {
  console.error("Seed Loom requires Node >=20.19 or >=22.12; current="+process.version);
  process.exit(1);
}
'

npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm run contract:check
npm run schemas:check

test -f "$BUNDLE"
actual_blob="$(git rev-parse "HEAD:$BUNDLE")"
test "$actual_blob" = "$EXPECTED_BLOB"

node scripts/knowledge/ingest-nightly-run.mjs "$BUNDLE" --dry-run
git diff --check
git status --short
```

- [ ] **Step 3: Run bootstrap**

Run:

```bash
chmod +x scripts/bootstrap-issue24-proof.sh
./scripts/bootstrap-issue24-proof.sh
```

Expected: dependency install + contract/schema checks pass; bundle dry-run validates.

- [ ] **Step 4: Commit bootstrap**

```bash
git add scripts/bootstrap-issue24-proof.sh
git commit -m "chore: add issue24 proof bootstrap"
```

---

### Task 2: Add failing Socratic-ingest tests

**Files:**
- Create: `scripts/knowledge/test-nightly-proof-harness.mjs`
- Later modify: `scripts/knowledge/ingest-nightly-run.mjs`

**Interfaces:**
- Consumes: `normalizeNightlyBundle()`, `socratic-assessment.schema.json`, canonical ingest CLI.
- Produces: regression tests for valid persistence, unknown-observation rejection, and rollback.

- [ ] **Step 1: Write the failing test harness**

The test must:
1. copy the September 10 bundle to a temp workspace;
2. invoke current `ingest-nightly-run.mjs --dry-run`;
3. assert dry-run planned files include five paths under `knowledge/runs/socratic-assessments/`;
4. invoke actual ingest in a clean temp workspace;
5. assert five assessment files exist and are listed in the ingest receipt;
6. mutate one assessment `observationId` to `obs:unknown`;
7. assert non-zero failure containing `unknown observation`;
8. assert canonical-tree digest before/after failed ingest is identical.

Core assertion shape:

```js
check(
  'dry run plans five Socratic records',
  dry.plannedFiles.filter((p) => p.startsWith('knowledge/runs/socratic-assessments/')).length === 5
);

check(
  'receipt includes five Socratic records',
  receipt.files.filter((p) => p.startsWith('knowledge/runs/socratic-assessments/')).length === 5
);
```

- [ ] **Step 2: Run test to prove RED**

Run:

```bash
node scripts/knowledge/test-nightly-proof-harness.mjs --socratic-only
```

Expected on current main: FAIL because ingest does not yet validate/persist Socratic assessments.

- [ ] **Step 3: Commit only the failing test**

```bash
git add scripts/knowledge/test-nightly-proof-harness.mjs
git commit -m "test: pin socratic nightly ingest behavior"
```

---

### Task 3: Port Socratic persistence from PR #44 without regressing current main

**Files:**
- Modify: `scripts/knowledge/ingest-nightly-run.mjs`

**Interfaces:**
- Consumes: `bundle.socraticAssessments ?? []`.
- Produces: schema-validated assessment files under `knowledge/runs/socratic-assessments/`, included in dry-run plan, atomic write set, and receipt hashes.

- [ ] **Step 1: Review donor patch, not donor file replacement**

Run:

```bash
git diff main..copilot/implement-bounded-proof-harness -- scripts/knowledge/ingest-nightly-run.mjs
```

Port only:
- `socratic-assessment.schema.json` validator registration;
- assessment schema validation;
- bundled-observation reference check;
- planned deterministic target paths;
- receipt creation inside the same atomic write/rollback block.

Do not remove current-main behavior.

- [ ] **Step 2: Implement minimal port**

Required semantics:

```js
for (const assessment of bundle.socraticAssessments ?? []) {
  assertValid(assessment.assessmentId, validators.socraticAssessment, assessment);
  if (!observationIds.includes(assessment.observationId)) {
    throw new Error(`Socratic assessment references unknown observation: ${assessment.observationId}`);
  }
  planned.push({
    target: targetFor('runs/socratic-assessments', assessment.assessmentId),
    record: assessment
  });
}
```

Receipt creation must be inside the same rollback-protected block as canonical writes.

- [ ] **Step 3: Run GREEN tests**

```bash
node scripts/knowledge/test-nightly-proof-harness.mjs --socratic-only
npm run knowledge:verify
```

Expected: Socratic regression passes; existing knowledge verification stays green.

- [ ] **Step 4: Commit**

```bash
git add scripts/knowledge/ingest-nightly-run.mjs scripts/knowledge/test-nightly-proof-harness.mjs
git commit -m "feat: persist nightly socratic assessments atomically"
```

---

### Task 4: Reconcile the proof coordinator to current-main intake semantics

**Files:**
- Create: `scripts/knowledge/prove-nightly-ingest.mjs`
- Modify: `scripts/knowledge/test-nightly-proof-harness.mjs`

**Interfaces:**
- Consumes: tracked intake bundle path; current canonical ingest; existing controls; Graph Workbench.
- Produces: one machine-readable proof JSON with A/B equivalence, graph assertions, and failure evidence.

- [ ] **Step 1: Use PR #44 only as donor logic**

Run:

```bash
git show copilot/implement-bounded-proof-harness:scripts/knowledge/prove-nightly-ingest.mjs > /tmp/pr44-prove-nightly-ingest.mjs
```

Do not copy its legacy assumptions:
- no required `bundle.bundleType`;
- no required `bundle.review`;
- no required top-level `bundle.provenance`;
- no default `ops/nightly-intake/2026-09-08.json`.

- [ ] **Step 2: Implement current provenance gate**

Default input:

```text
knowledge/intake/nightly/2026-09-10/nightly-run-bundle-2026-09-10.json
```

Require:
- path stays under `knowledge/intake/nightly/`;
- `git ls-files --error-unmatch <path>` succeeds;
- `git status --porcelain -- <path>` is empty;
- raw SHA-256 is computed before execution;
- current Git blob SHA is captured;
- normalized bundle has exactly five observations;
- `run.ingestionMode === 'delivered'`;
- all five observations are candidate;
- Genesis is deferred / blocked;
- repository actions remain unexecuted proposals.

- [ ] **Step 3: Add RED tests for provenance/current format**

Tests:
- September 10 tracked bundle passes provenance preflight.
- untracked copy fails.
- six-observation derivative fails.
- accepted-observation derivative fails.
- Genesis-enabled derivative fails.

Run:

```bash
node scripts/knowledge/test-nightly-proof-harness.mjs --preflight
```

Expected: RED until coordinator implements all checks.

- [ ] **Step 4: Implement isolated A/B runs**

Each workspace must:
1. be created from the same current branch content;
2. exclude `.git`, `node_modules`, prior `tools/graph-workbench/data.json`, and disposable generated proof outputs;
3. receive dependencies without copying canonical generated evidence;
4. run:
   - canonical ingest;
   - `npm run knowledge:verify`;
   - `npm run knowledge:graph:build`;
   - `npm run knowledge:verify`.

Use the same deterministic `KNOWLEDGE_NOW` derived from the bundle retrieval window for A and B.

- [ ] **Step 5: Commit**

```bash
git add scripts/knowledge/prove-nightly-ingest.mjs scripts/knowledge/test-nightly-proof-harness.mjs
git commit -m "feat: reconcile issue24 two-run proof coordinator"
```

---

### Task 5: Pin proof digest, graph assertions, and atomic falsification

**Files:**
- Modify: `scripts/knowledge/prove-nightly-ingest.mjs`
- Modify: `scripts/knowledge/test-nightly-proof-harness.mjs`

**Interfaces:**
- Produces deterministic `proofDigest` and explicit assertions.

- [ ] **Step 1: Canonical proof object**

The compared object must include exactly:

```json
{
  "baselineCommit": "<git sha>",
  "inputPath": "knowledge/intake/nightly/2026-09-10/nightly-run-bundle-2026-09-10.json",
  "inputGitBlob": "<blob sha>",
  "inputSha256": "<raw sha256>",
  "normalizedDigest": "<digest>",
  "runId": "run:nightly:2026-09-10",
  "observationIds": ["<sorted five ids>"],
  "relationshipIds": ["<sorted ids>"],
  "emittedFiles": ["<sorted paths>"],
  "emittedFileSha256": {"<path>":"<sha256>"},
  "graphProjectionDigest": "<sha256>",
  "unresolvedReviewQueueDigest": "<sha256>",
  "controlReceiptDigests": {"<path>":"<sha256>"},
  "candidateOnly": true,
  "genesisDeferred": true,
  "repositoryActionsExecuted": false
}
```

Exclude wall-clock timestamps, temp paths, CI run IDs, process IDs, and absolute paths from comparison.

- [ ] **Step 2: Graph assertions**

Parse `tools/graph-workbench/data.json` and require:
- exact `run:nightly:2026-09-10` node;
- exact five observation IDs;
- zero extra observation IDs from the acceptance run;
- candidate/unaccepted status for each;
- unresolved review queues remain represented;
- A/B graph digest equality.

- [ ] **Step 3: Negative tests**

Required mutations:
1. unknown Socratic observation reference;
2. candidate → approved;
3. Genesis `allowedTransition=true`;
4. late-write failure after several files have been written.

For each negative run:
- capture canonical-tree digest before;
- require non-zero exit;
- capture after;
- require equality;
- assert no partial acceptance-run files remain.

- [ ] **Step 4: Determinism sensitivity tests**

Test:
- two unchanged clean runs yield same proof digest;
- one deterministic content mutation changes proof digest;
- changing only excluded volatile metadata does not change proof digest.

- [ ] **Step 5: Run**

```bash
node scripts/knowledge/test-nightly-proof-harness.mjs
node scripts/knowledge/prove-nightly-ingest.mjs   knowledge/intake/nightly/2026-09-10/nightly-run-bundle-2026-09-10.json   --out=.reproducibility/issue24-nightly-proof.json
```

Expected: all assertions pass and proof JSON exists outside canonical knowledge directories.

- [ ] **Step 6: Commit**

```bash
git add scripts/knowledge/prove-nightly-ingest.mjs scripts/knowledge/test-nightly-proof-harness.mjs
git commit -m "test: prove nightly determinism graph and atomicity"
```

---

### Task 6: Add the read-only CI proof gate

**Files:**
- Create: `.github/workflows/nightly-intake-proof.yml`
- Modify: `package.json`

**Interfaces:**
- Consumes: proof coordinator.
- Produces: uploaded `issue24-nightly-proof` artifact; no repository write.

- [ ] **Step 1: Add package aliases**

Add:

```json
"knowledge:test:nightly-proof": "node scripts/knowledge/test-nightly-proof-harness.mjs",
"knowledge:prove-nightly": "node scripts/knowledge/prove-nightly-ingest.mjs"
```

Keep current `knowledge:test:hardening` and current `knowledge:verify` composition unchanged unless a test demonstrates inclusion is necessary.

- [ ] **Step 2: Add workflow**

Use immutable action refs:
- `actions/checkout@11d5960a326750d5838078e36cf38b85af677262`
- `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020`
- `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02`

Workflow requirements:
- `permissions: contents: read`;
- Node 22;
- `npm ci --ignore-scripts --no-audit --no-fund`;
- `npm run knowledge:test:nightly-proof`;
- `npm run knowledge:prove-nightly -- knowledge/intake/nightly/2026-09-10/nightly-run-bundle-2026-09-10.json --out=.reproducibility/issue24-nightly-proof.json`;
- upload only the machine-readable proof;
- no commit/push/merge/deploy.

Triggers:
- pull requests touching the proof helper/test, ingest/normalize scripts, relevant schemas, Graph Workbench builder, package manifests, the September 10 intake specimen, or this workflow;
- manual dispatch.

- [ ] **Step 3: Static workflow checks**

```bash
git diff --check
grep -q "permissions:" .github/workflows/nightly-intake-proof.yml
grep -q "contents: read" .github/workflows/nightly-intake-proof.yml
! grep -Eq "git push|deploy|release|curl .*api|gh pr merge" .github/workflows/nightly-intake-proof.yml
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/nightly-intake-proof.yml package.json
git commit -m "ci: add issue24 nightly proof gate"
```

---

### Task 7: Whole-branch verification and handoff

**Files:** no new behavior.

- [ ] **Step 1: Run proof-specific verification**

```bash
./scripts/bootstrap-issue24-proof.sh
npm run knowledge:test:nightly-proof
npm run knowledge:prove-nightly --   knowledge/intake/nightly/2026-09-10/nightly-run-bundle-2026-09-10.json   --out=.reproducibility/issue24-nightly-proof.json
```

- [ ] **Step 2: Run repository verification**

```bash
npm run knowledge:verify
npm run knowledge:graph:build
npm run knowledge:verify
```

If the environment supports Playwright system dependencies, also run:

```bash
npx playwright install --with-deps chromium
npm run verify:root
```

If it does not, do not claim root verification; rely on GitHub Actions and report the exact environmental blocker.

- [ ] **Step 3: Inspect scope**

```bash
git diff --name-only main...HEAD
git diff --check
git status --short
```

Expected change surface:
- `scripts/bootstrap-issue24-proof.sh`
- `scripts/knowledge/test-nightly-proof-harness.mjs`
- `scripts/knowledge/ingest-nightly-run.mjs`
- `scripts/knowledge/prove-nightly-ingest.mjs`
- `.github/workflows/nightly-intake-proof.yml`
- `package.json`
- this plan document only

Do not add another intake specimen unless the September 10 Git blob fails provenance verification.

- [ ] **Step 4: Independent verification**

Use one fresh read-only reviewer/subagent. Give it only:
- Issue #24 acceptance contract;
- current-main SHA;
- branch diff;
- proof JSON;
- exact command outputs.

Require verdict:
- `PROOF_READY_FOR_HUMAN_REVIEW`, or
- exact named failing gate.

The reviewer may not edit files.

- [ ] **Step 5: Prepare draft PR**

PR title:

```text
Reconcile Issue #24 real nightly two-run proof on current main
```

PR body must report:
- baseline SHA;
- donor PR #44 used selectively;
- September 10 bundle path, Git blob, raw SHA-256;
- exact five observation IDs;
- normalized digest;
- A proof digest;
- B proof digest;
- equality;
- graph assertions;
- malformed-input before/after digests;
- Socratic persistence result;
- candidate-only result;
- Genesis-deferred result;
- repository-actions result;
- test commands;
- CI artifact;
- unresolved limitations;
- explicit no-merge/no-deploy/no-promotion statement.

Do not merge.

---

## Subagent operating protocol

The parent Codex session owns branch state, integration, and final claims.

### Parallel read-only wave

Spawn at most three subagents concurrently:

1. **Ingest auditor**
   - compare current-main `ingest-nightly-run.mjs` with PR #44 donor;
   - return only minimal Socratic/atomicity hunks worth porting;
   - no writes.

2. **Proof-harness auditor**
   - review PR #44 `prove-nightly-ingest.mjs` against current September 10 bundle shape and current Issue #24;
   - enumerate stale assumptions and required adaptations;
   - no writes.

3. **CI/reproducibility auditor**
   - inspect current workflows, pinned actions, package scripts, and root/knowledge verification;
   - return the smallest non-duplicative CI composition;
   - no writes.

### Writer wave

After the parent reconciles audit findings:
- Writer A owns only `scripts/knowledge/ingest-nightly-run.mjs` + Socratic tests.
- Writer B owns only `scripts/knowledge/prove-nightly-ingest.mjs` + proof tests, and starts only after Writer A commits.
- Writer C owns only workflow/package/bootstrap after Writer B commits.

Never allow two writer agents to edit the same file concurrently.

### If/then rules

- **If** an auditor finds current main already satisfies a proposed change, **then** record no-change and do not port that donor hunk.
- **If** PR #44 conflicts with current-main behavior, **then** preserve current-main semantics and manually port only the acceptance behavior.
- **If** September 10 provenance cannot be verified byte-for-byte, **then** stop with `BLOCKED_REAL_BUNDLE_PROVENANCE`; do not substitute another bundle silently.
- **If** a test suggests changing a canonical schema/ontology, **then** stop and report the exact incompatibility before editing schemas.
- **If** A/B proof digests differ, **then** do not normalize away the difference until the differing fields are identified and classified as deterministic or truly volatile.
- **If** malformed input leaves any canonical write, **then** stop; atomicity is a hard failure.
- **If** any observation becomes accepted, any repository action executes, or Genesis advances, **then** stop immediately and preserve evidence.
- **If** root browser verification cannot run locally, **then** use GitHub Actions for that gate and state the local limitation; never call it passed without CI evidence.
- **If** all proof gates pass, **then** open a draft PR and request human review; do not merge or close Issue #24 automatically.

## Source references for the worker

- Issue #24: `https://github.com/qt314wink/seed-loom/issues/24`
- Current main at planning time: `5f329ea08174e8c397d0627261661d3637b954b9`
- Merged nightly bridge PR #45: `https://github.com/qt314wink/seed-loom/pull/45`
- Primary donor implementation PR #44: `https://github.com/qt314wink/seed-loom/pull/44`
- Secondary donor/reference PR #40: `https://github.com/qt314wink/seed-loom/pull/40`
- Dry-run evidence PR #47: `https://github.com/qt314wink/seed-loom/pull/47`
- September 10 intake specimen: `knowledge/intake/nightly/2026-09-10/nightly-run-bundle-2026-09-10.json`
- Canonical ingest: `scripts/knowledge/ingest-nightly-run.mjs`
- Current coordinator: `scripts/knowledge/ingest-nightly-intake.mjs`
- Current ingest workflow: `.github/workflows/nightly-knowledge-ingest.yml`
- Graph builder: `scripts/knowledge/build-workbench.mjs`
- Socratic schema: `knowledge/schema/socratic-assessment.schema.json`
