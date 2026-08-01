# Seed Loom Strategy-Genesis Engine

## Status and control links

- Repository: https://github.com/qt314wink/seed-loom
- Implementation branch: `feat/strategy-genesis-engine-v0`
- Draft pull request: https://github.com/qt314wink/seed-loom/pull/23
- Swarm execution issue: https://github.com/qt314wink/seed-loom/issues/24
- Full Kimi handoff: `docs/strategy-genesis/KIMI_SWARM_FULL_SCOPE_HANDOFF.md`
- Machine workplan: `docs/strategy-genesis/kimi-swarm-workplan.json`

PR #23 must remain draft until every required control, negative fixture, deterministic rerun, and independent verification gate passes.

## What this system is

The Strategy-Genesis Engine is a repository-native research, provenance, reasoning, and governance subsystem. It converts external and internal evidence into inspectable observations, relationships, candidate patterns, opportunities, bounded strategies, experiments, and—only after explicit human approval—repository-genesis dossiers.

It is designed to recognize meaningful change without confusing attention with demand, repetition with corroboration, inference with fact, or strategic possibility with permission to act.

It is not an autonomous venture studio, fact authority, graph database, or repository-creation bot. It may collect, validate, compare, challenge, score, visualize, and propose. It may not accept knowledge, merge code, create production repositories, spend money, contact external parties, submit applications, or erase prior evidence without an explicit authorized gate.

## Source of truth

Canonical knowledge lives as Git-versioned JSON under `knowledge/**`.

```text
knowledge/
├── config/            Governance and budget policy
├── entities/          Actors and other durable entities
├── sources/           Source metadata and evidence identity
├── observations/      Fact/inference-separated claims
├── relationships/     Explicit directed graph edges
├── patterns/          Candidate repeated mechanisms
├── opportunities/     Governed opportunity assessments
├── strategies/        Bounded strategic recommendations
├── experiments/       Reversible tests and outcomes
├── runs/              Research and pipeline run records
├── receipts/          Hashes, acknowledgements, and proof artifacts
├── telemetry/         Local JSONL execution telemetry
├── quarantine/        Unapproved or unsafe candidate exports
├── indexes/           Deterministic disposable projections
└── schema/            Machine-checkable JSON contracts
```

Generated graph views, indexes, DuckDB files, telemetry backends, Jaeger traces, dashboards, and browser projections are disposable. They may be rebuilt from canonical files and must never become a competing source of truth.

## Pipeline

The governed execution order is:

```text
collect → vet → normalize → observe → inquire → interpret → relate
→ pattern → opportunity → strategy → experiment → genesis → publish
```

Every stage must emit an acknowledgement. A missing acknowledgement is a failure. A failed stage stops the pipeline. `unknown`, `deferred`, and `no-change` are valid outcomes; unsupported certainty is not.

## Control system

### Source independence

Detects repeated or dependent evidence so confidence reflects independent evidence streams rather than article count.

Required detection includes:

- exact and canonical URL duplication
- syndicated copies
- shared press releases or upstream studies
- common DOI or policy ancestry
- circular citation
- repeated analyst language
- publisher or author dependence

Ambiguous similarity creates a review candidate; it never silently merges records.

### Temporal validity and decay

Maintains base confidence while generating a time-indexed effective-confidence projection. It handles stale sources, expired grants, changed terms, revised laws, closed procurement windows, superseded policies, and expiring opportunities.

Original confidence is immutable. Expiry and decay are projections with their own receipts.

### Claim identity and semantic duplicates

Creates deterministic claim fingerprints using normalized subject, action, object, date, jurisdiction, quantities, polarity, and policy status. Similar claims become duplicate candidates, not automatic merges. Negation, changed quantities, changed dates, and changed jurisdictions must remain distinguishable.

### Corrections, retractions, and supersession

Corrections are immutable events. Supported events include:

- `CORRECTS`
- `RETRACTS`
- `INVALIDATES`
- `SUPERSEDES`
- `RESTORES`
- `DELETES_AT_SOURCE`
- `REVISES_SCOPE`

Original records remain addressable. Dependent observations, patterns, strategies, and decisions receive explicit impact assessments.

### Sensitive data and rights

Every ingestible artifact must receive a data classification and rights treatment. Secrets fail closed. Unknown personal data is quarantined. Health, financial, application, confidential, licensed, copyrighted, or private-repository material requires purpose, minimization, access, retention, and approval metadata.

Store source facts, short necessary excerpts, hashes, and summaries—not full copyrighted works for convenience.

### Confidence calibration

Predictions and later outcomes are recorded separately. Calibration reports include Brier score, reliability bands, sample size, unresolved predictions, domain separation, overconfidence, and underconfidence. Small samples cannot automatically alter governance thresholds.

### Budget governance

`knowledge/config/governance.json` defines runtime and operational ceilings, including source count, network calls, execution time, artifact size, telemetry size, graph growth, experiment cost, external-service spend, and concurrent experiments.

Unknown spend fails closed for spend-authorizing transitions. Partial research may finish with a budget-exhaustion receipt, but limits may not be silently exceeded.

### Notebook boundary

Notebooks are exploratory only. They may export explicit manifests into:

```text
knowledge/quarantine/notebook-exports/<exportId>/
```

They may not write directly to canonical knowledge directories. Promotion requires schema validation, source vetting, duplicate checks, sensitive-data scanning, ordinary governance, and human approval.

## Installation

Requirements:

- Git
- Node.js 20 or newer
- npm
- Docker only for optional Jaeger observability

```bash
git clone https://github.com/qt314wink/seed-loom.git
cd seed-loom
git checkout feat/strategy-genesis-engine-v0
npm install
npm run knowledge:setup
npm run knowledge:doctor
```

## Primary operation commands

```bash
npm run knowledge:setup
npm run knowledge:doctor
npm run knowledge:test
npm run knowledge:validate
npm run knowledge:run
npm run knowledge:verify
npm run knowledge:weekly
npm run knowledge:ingest -- path/to/nightly-run-bundle.json
```

After the full control layer is implemented, the canonical verification sequence is expected to be:

```bash
npm run knowledge:setup
npm run knowledge:controls
npm run knowledge:verify
npm run knowledge:verify
npm run knowledge:graph:build
```

The two verification runs must produce identical deterministic artifacts for unchanged inputs.

## Nightly operation manual

1. Run tests before ingestion.
2. Receive one immutable nightly bundle containing the run, sources, observations, relationships, and stage acknowledgements.
3. Enforce source, network, runtime, graph-growth, storage, telemetry, and spend budgets.
4. Scan for secrets, sensitive data, rights issues, and prohibited content.
5. Validate schemas and identifiers.
6. Analyze source independence and citation ancestry.
7. detect semantic duplicate candidates.
8. Apply temporal-validity projections without altering base confidence.
9. Process corrections and invalidation impacts.
10. Ingest only candidate-level records.
11. Check relationship endpoints and graph integrity.
12. Rebuild indexes, receipts, telemetry, and the Graph Workbench projection.
13. Publish the human briefing only after all required acknowledgements are present.
14. Keep genesis deferred during daily runs.

A daily cycle may produce exactly five observations under the current contract. It may produce fewer only when a no-change or collection-failure policy explicitly permits it and records why.

## Weekly operation manual

Run:

```bash
npm run knowledge:weekly
```

The weekly process compares the current seven-day window with the prior four-week baseline and examines:

- actor behavior by class
- source coverage and independence
- strengthened, weakened, contradicted, or expired patterns
- confidence changes versus world changes
- counterevidence and alternative explanations
- opportunity and repository implications
- calibration and prediction outcomes
- expired decisions and unresolved review queues
- experiment results and promotion debt

The output is limited to no more than three strategies, two experiments, and one genesis candidate unless an exceptional event is documented.

## Graph exploration

Build and serve the local Graph Workbench:

```bash
npm run knowledge:graph:build
npm run knowledge:graph
```

Open:

```text
http://127.0.0.1:4177
```

The workbench is a projection. It should expose:

- node and edge search
- source-to-strategy provenance paths
- receipts and content hashes
- stage acknowledgements
- source-independence clusters
- duplicate candidates
- effective confidence and expiry
- correction and invalidation chains
- sensitivity labels
- calibration state
- budget use
- notebook origin
- unresolved review queues
- graph deltas between runs

## Observability

Default local observability:

```bash
npm run knowledge:verify:observed
```

Telemetry is written as newline-delimited JSON under:

```text
knowledge/telemetry/pipeline-events.jsonl
```

Optional local Jaeger:

```bash
npm run observability:up
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318 npm run knowledge:verify:observed
```

Open `http://127.0.0.1:16686`, inspect service `seed-loom-knowledge`, and stop with:

```bash
npm run observability:down
```

Observability records execution. It does not store canonical evidence.

## Failure and recovery manual

### Invalid or unsafe input

Move the candidate bundle into quarantine and emit a receipt naming the failed rule, affected records, and remediation path.

### Duplicate immutable identifier

If content is identical, report a safe duplicate. If content differs under the same immutable identifier, reject it as a provenance violation.

### Missing source or relationship endpoint

Reject publication, retain available records, and emit an orphan or missing-source report.

### Collection failure

Preserve successful evidence, record unobserved domains, and emit a partial-run receipt. Do not imply complete coverage.

### Correction or retraction

Create a correction event; never overwrite the original. Generate impact assessments for all dependent records and queue them for review.

### Budget exhaustion

Stop the affected stage, emit consumed and remaining budget, preserve partial safe outputs, and do not silently continue.

### Sensitive-data or secret detection

Secrets reject immediately. Unknown personal or restricted material enters quarantine. Do not place raw sensitive content in logs, receipts, telemetry, or Git history.

### Non-deterministic output

Fail verification, preserve both output digests, identify unstable fields such as current timestamps or unordered iteration, and do not merge until repeated runs agree.

### Rollback

Because canonical changes are Git-versioned, rollback is performed through a reviewed revert or superseding record. Never delete historical evidence merely to make the current graph appear clean.

## Human approval boundaries

Explicit approval is required before:

- accepting candidate knowledge
- changing confidence thresholds or governance policy
- approving an experiment with cost or participant impact
- spending funds
- contacting external parties
- submitting a grant or application
- publishing market or factual claims externally
- creating a production repository
- merging implementation changes

No role may both propose and approve the same transition.

## Swarm execution rules

Kimi agents should use issue #24 as the implementation ledger and PR #23 as the review boundary. Each workstream requires a lead and an independent verifier. Parallel work is allowed only where the machine workplan has no dependency conflict.

Every workstream must deliver:

1. scripts and schemas
2. positive fixtures
3. adversarial negative fixtures
4. deterministic receipts
5. CI integration
6. Graph Workbench representation
7. operator documentation
8. two identical test runs
9. independent verifier sign-off
10. known limitations and rollback notes

## Merge definition of done

PR #23 may leave draft status only when:

- every control is implemented and schema-valid
- positive and negative fixtures pass for the intended reason
- a clean install succeeds
- two complete verification runs produce identical artifacts
- one real nightly cycle is demonstrated
- no heuristic mutates canonical records
- source dependence cannot inflate confidence
- temporal decay does not alter base confidence
- semantic duplicates are never silently merged
- corrections preserve the original and propagate impact
- secrets reject and sensitive unknowns quarantine
- unknown spend fails closed
- notebooks export only to quarantine
- unresolved predictions do not contaminate calibration
- daily automation cannot accept knowledge or advance genesis
- Graph Workbench exposes control outputs and unresolved queues
- an independent verifier records a merge recommendation

## Key documentation

- `architecture.md` — system purpose, roles, reasoning model, and genesis gates
- `operations.md` — weekly run and governance contract
- `SETUP.md` — local installation and initial verification
- `GRAPH_AND_OBSERVABILITY.md` — graph projection and telemetry architecture
- `innovations-and-gaps.md` — tailored mechanisms and sequencing
- `KIMI_SWARM_FULL_SCOPE_HANDOFF.md` — complete swarm implementation scope
- `kimi-swarm-workplan.json` — machine-readable workstream dependencies
- `protocols/pipeline-verification.md` — proof order and acceptance conditions
- `protocols/implementation-boundaries.md` — source-of-truth and authority limits
- `knowledge/config/governance.json` — candidate operational and budget defaults
