# Nightly Intake Proof Automation Design

**Date:** 2026-08-14  
**Repository:** `qt314wink/seed-loom`  
**Branch:** `feat/nightly-intake-proof`  
**Base:** `codex/repair-seed-loom-reproducibility-boundary` @ `48685d9532755a2cdd77845d02d8454f57d982d0`

## Goal

Remove the need for Jennipher to manually ingest each delivered `NightlyRunBundle` while preserving Seed Loom as the sole canonical knowledge authority and satisfying Issue #24's real-bundle acceptance proof.

The automation must prove intake, determinism, Graph Workbench visibility, and atomic failure. It must not automatically accept knowledge, approve strategy, advance Genesis, merge code, deploy, publish externally, or mutate unrelated systems.

## Selected approach

Use a **stacked PR on the reproducibility branch** and compose the existing `knowledge:ingest`, `knowledge:verify`, `knowledge:graph:build`, and control machinery into a new proof workflow.

This was selected over two alternatives:

1. **Direct scheduled ingest to `main`** — rejected because it would mix automation with canonical promotion before Issue #24 passes and would weaken the human approval boundary.
2. **A separate ingestion service/repository** — rejected because it would create another source of truth and duplicate Seed Loom's existing contracts.

## Architecture

```text
Delivered NightlyRunBundle
        |
        v
ops/nightly-intake/<date>.json   (immutable intake envelope, noncanonical)
        |
        v
nightly-intake-proof.yml
        |
        +--> dry-run schema/contract validation
        |
        +--> clean proof environment A
        |      ingest -> controls -> verify -> graph -> canonical proof digest
        |
        +--> clean proof environment B
        |      ingest -> controls -> verify -> graph -> canonical proof digest
        |
        +--> compare A/B deterministic proof
        |
        +--> malformed derivative -> assert atomic failure
        |
        +--> machine-readable proof artifact
        |
        v
Human review / approval
```

The raw intake envelope is never canonical knowledge. Canonical records are produced only by `scripts/knowledge/ingest-nightly-run.mjs`.

## Components

### 1. `scripts/knowledge/prove-nightly-ingest.mjs`

Single-purpose proof coordinator. Responsibilities:

- accept one bundle path;
- compute and retain the immutable input SHA-256;
- run `knowledge:ingest --dry-run` before mutation;
- create two isolated clean working copies/worktrees from the same repository baseline;
- run actual ingestion and the required control/verification sequence in both;
- build Graph Workbench in both;
- compute a deterministic canonical proof digest that excludes volatile timestamps;
- verify exact run/five-observation presence in Graph Workbench;
- verify candidate-only state and deferred Genesis;
- construct and test one malformed derivative;
- assert failed ingest leaves no canonical partial writes;
- emit one machine-readable proof JSON outside canonical knowledge directories.

It does **not** create Strategy, Experiment, or Genesis records.

### 2. `.github/workflows/nightly-intake-proof.yml`

Initial triggers:

- `workflow_dispatch` with required `bundle_path`;
- pull requests affecting `ops/nightly-intake/**`, knowledge scripts/schemas, Graph Workbench, package manifests/lockfile, or this workflow.

The workflow uses `npm ci`, runs the proof coordinator, and uploads the resulting proof artifact. It has read-only repository contents permission and performs no commit/push step.

### 3. `ops/nightly-intake/`

Staging location for reviewed delivered envelopes. Files under this path are immutable inputs and are never treated as canonical knowledge.

The first real acceptance specimen should be the reviewed August 13 NightlyRunBundle once its bytes are placed on this branch.

### 4. Socratic assessment persistence

Current delivered bundles include `socraticAssessments`, but the current ingest script validates only run/source/observation/relationship/stage-ack records. The smallest safe change is to validate Socratic assessments against the existing `knowledge/schema/socratic-assessment.schema.json` and persist them under the run namespace, e.g. `knowledge/runs/socratic-assessments/`.

This does not create a new ontology or promotion layer.

### 5. Canonical proof digest

The current ingest receipt includes a live `createdAt`, so raw receipt bytes are not a valid deterministic comparison target.

The proof digest must be computed from deterministic fields only:

- input bundle SHA-256;
- normalized bundle digest;
- emitted canonical record paths;
- emitted canonical file SHA-256 map;
- Graph Workbench projection digest;
- unresolved review-queue digest;
- control receipt digests;
- candidate-only check;
- Genesis-deferred check.

Run A and B must produce the same canonical proof digest.

## Data and authority boundaries

### Allowed automated outputs

- disposable proof worktrees/directories;
- proof JSON/artifacts;
- canonical candidate records inside isolated proof environments;
- Graph Workbench projections inside isolated proof environments.

### Forbidden automated outputs

- accepted observations;
- approved strategies;
- executed experiments;
- Genesis promotion;
- direct writes to `main`;
- merge, deploy, publish, spend, outreach, application submission, or repository creation.

## Error handling

The workflow fails closed on:

- schema/contract mismatch;
- missing or extra observation IDs;
- noncandidate observation status;
- nondeferred Genesis;
- executed repository action;
- Graph Workbench omission of the exact run/five observations;
- A/B digest mismatch;
- malformed input leaving partial canonical state;
- inability to locate the reviewed bundle.

No generated receipt may be manually edited to force a pass.

## Test strategy

Use TDD for all new executable behavior.

Minimum tests:

1. valid delivered bundle passes preflight;
2. malformed bundle fails before canonical writes;
3. two isolated runs produce identical canonical proof digest;
4. candidate observations remain candidate;
5. Genesis remains deferred with `allowedTransition=false`;
6. exact run and five observations appear in Graph Workbench;
7. Socratic assessments validate and persist when present;
8. proof digest ignores only explicitly volatile metadata, not content changes;
9. existing knowledge/control tests remain green;
10. root reproducibility checks from the base branch remain green.

## Acceptance contract

This work is complete only when a **real delivered NightlyRunBundle**, not a synthetic fixture alone:

- contains exactly five observations;
- validates every canonical record;
- ingests twice from the same clean baseline;
- produces equal canonical proof digests;
- executes existing control families;
- appears in Graph Workbench with unresolved queues visible;
- preserves candidate-only observations;
- preserves deferred Genesis;
- fails atomically when malformed;
- yields a machine-readable CI proof artifact;
- performs no automatic canonical promotion to `main`.

## Scope exclusions

Explicitly out of scope for this PR:

- scheduled autonomous commit of nightly canonical records;
- automatic Strategy candidate generation;
- automatic Strategy approval;
- Experiment execution;
- Genesis eligibility/promotion;
- new agent roles;
- ontology expansion;
- new dashboard/product UI;
- external model calls.

Those can be considered only after Issue #24's proof passes.

## Follow-up after Issue #24

The next bounded change may generate typed **pending** Strategy candidates from already-validated observations/patterns/opportunities, while still stopping at human approval. Genesis remains a later eligibility + human approval gate.
