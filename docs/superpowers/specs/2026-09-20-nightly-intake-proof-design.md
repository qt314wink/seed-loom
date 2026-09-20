# Nightly Intake Proof Design

**Date:** 2026-09-20  
**Repository:** `qt314wink/seed-loom`  
**Branch:** `feat/nightly-intake-proof`  
**Base:** `codex/repair-seed-loom-reproducibility-boundary` at `48685d9532755a2cdd77845d02d8454f57d982d0`

## Purpose

Automate proof of one real delivered NightlyRunBundle without creating a second knowledge authority or weakening Seed Loom issue #24. The automation proves that a reviewed intake bundle can be ingested twice from clean state with equivalent governed results, appears in Graph Workbench, preserves candidate-only governance, and fails closed on invalid intake.

This design does not automate knowledge acceptance, strategy approval, experiment execution, Genesis promotion, merge, deployment, public publication, spending, or external outreach.

## Source-of-truth boundary

Canonical knowledge remains Git-versioned JSON under `knowledge/**`.

Raw nightly bundles live under `ops/nightly-intake/**` as immutable delivery envelopes. They are provenance inputs, not canonical observations or strategy records. Canonical records are produced only by the existing `scripts/knowledge/ingest-nightly-run.mjs` path.

The canonical ingest script remains authoritative for:
- exactly five observations;
- `ResearchRun` + `ingestionMode=delivered`;
- observation `approvalState=candidate`;
- 13 required stage acknowledgements;
- deferred Genesis with `allowedTransition=false`;
- repository actions remaining `status=proposed` and `executed=false`;
- schema validation and immutable writes.

## Architecture

Add one proof orchestrator and one CI workflow.

`scripts/knowledge/prove-nightly-ingest.mjs` receives one reviewed bundle path. It creates two isolated disposable worktrees from the same commit, runs the canonical ingest + Seed Loom verification sequence in each, builds Graph Workbench, derives a deterministic proof summary from canonical outputs, and compares A/B digests.

A malformed derivative of the same bundle is then executed in another disposable worktree. The malformed run must fail and leave no canonical records for the rejected run.

`.github/workflows/nightly-intake-proof.yml` installs from the authoritative lockfile with Node 22 and `npm ci`, resolves exactly one intake bundle, runs the proof helper, and uploads the proof report. The workflow never commits generated canonical knowledge and has `contents: read`.

## Inputs

First supported input:
`ops/nightly-intake/YYYY-MM-DD.json`

Workflow modes:
1. `workflow_dispatch` with required `bundle_path`.
2. Pull-request execution when exactly one `ops/nightly-intake/*.json` file is changed. Zero or multiple changed intake bundles fail with a clear message rather than guessing.

## Determinism contract

The existing ingest receipt contains a volatile `createdAt`, so literal receipt bytes are not used as the A/B equivalence criterion.

The proof helper creates a canonical summary from deterministic fields:
- input bundle SHA-256;
- normalized bundle digest;
- run ID;
- sorted emitted canonical file paths;
- SHA-256 of each emitted canonical file;
- Graph Workbench `sha256`;
- sorted unresolved review queues;
- sorted control receipt/projection/candidate digests;
- candidate-status assertion;
- Genesis-deferred assertion.

The canonical summary is serialized with stable key ordering and hashed. Run A and B must produce the same canonical proof digest.

Human timestamps may remain in diagnostic output but are excluded from equality.

## Socratic assessments

The nightly normalizer already preserves `socraticAssessments`, but current ingest does not validate or persist them.

This change will:
- compile `knowledge/schema/socratic-assessment.schema.json`;
- validate every supplied assessment;
- require assessment `observationId` to reference one of the five bundled observations;
- persist assessments under `knowledge/runs/socratic-assessments/`;
- include them in the ingest receipt/file digest set.

This is preservation of existing evidence, not a new ontology.

## Observation extension boundary

Current canonical `observation.schema.json` uses `additionalProperties:false` and does not permit `consultancyImplications` or `projectDispositionImplications`.

This proof work must not widen Observation merely to accommodate nightly briefing metadata.

Those fields may remain in the immutable raw intake envelope or a future explicitly designed downstream strategy/disposition layer. Their absence from canonical Observation records is not silently rewritten as acceptance.

## Graph Workbench assertions

After ingestion and verification, assert:
- the exact `runId` exists;
- all five observation IDs exist;
- each observation remains candidate/unaccepted;
- the Genesis stage acknowledgement remains deferred;
- all expected support relationships exist;
- unresolved review queues remain represented.

The proof must assert records, not merely test that `tools/graph-workbench/data.json` exists.

## Failure behavior

Generate one malformed derivative by violating an intake invariant before canonical writing, for example:
- change Genesis `allowedTransition` to true; or
- remove one of the five observations.

Expected result:
- ingest returns non-zero;
- no source, observation, relationship, run, stage-ack, Socratic, or ingest receipt for the malformed run exists afterward;
- no strategy or Genesis record is promoted;
- disposable worktree may contain proof diagnostics only.

## CI boundary

Workflow permissions: `contents: read`.

No push token, deployment secret, model API, paid service, external mutation, or auto-merge.

Existing workflows remain authoritative:
- Root Reproducibility Boundary;
- Knowledge Controls;
- Knowledge Integrity;
- Graph Workbench build through existing scripts.

The new workflow composes these contracts; it does not duplicate their implementations.

## Definition of done

The bounded milestone is complete only when:
1. one real reviewed delivered bundle dry-runs successfully;
2. clean A and B ingests succeed;
3. A/B canonical proof digests match;
4. the exact run + five observations appear in Graph Workbench;
5. observations remain candidate;
6. Genesis remains deferred;
7. supplied Socratic assessments validate and persist;
8. malformed intake fails with no partial canonical state;
9. the workflow uploads one machine-readable proof artifact;
10. no merge, deploy, publication, acceptance, Genesis transition, spending, or external mutation occurs.

## Explicit non-goals

- automatic nightly research collection;
- automatic strategy promotion;
- automatic experiment execution;
- automatic Genesis dossiers;
- automatic main-branch commits;
- a new knowledge database;
- a new graph engine;
- expansion of Observation schema for consultancy metadata;
- cross-repository agent promotion.
