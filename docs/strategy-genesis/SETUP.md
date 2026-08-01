# Seed Loom Strategy-Genesis Setup

## Purpose

Run the knowledge system locally with no paid infrastructure, prove each layer, and only then enable CI or scheduled ingestion.

## Requirements

- Node.js 20 or newer
- npm
- Git
- A clean checkout of the target branch

## First run

```bash
npm install
npm run knowledge:setup
npm run knowledge:verify
```

Expected order:

1. `knowledge:doctor` verifies runtime, directories, schemas, and required packages.
2. `knowledge:test` runs deterministic architecture and governance tests.
3. `knowledge:run` validates records, checks relationships, rebuilds indexes, emits graph summaries, and writes receipts.

A failed stage must stop the run. Do not continue manually and then describe the pipeline as passing.

## Ingest a nightly bundle

```bash
npm run knowledge:ingest -- path/to/nightly-run-bundle.json
npm run knowledge:verify
```

The bundle must be immutable, candidate-only, source-backed, and include acknowledgements for every stage. Re-running the same bundle must either produce the same digest or be rejected as a duplicate. Changed content under an existing immutable identifier is a provenance violation.

## Weekly review

```bash
npm run knowledge:weekly
```

Weekly synthesis consumes accepted source-backed candidates and prior receipts. It does not independently invent evidence or authorize repository creation.

## Local-first operating mode

No database, vector service, graph server, paid observability tool, or hosted orchestrator is required for v0. JSON files are canonical; generated indexes, JSONL exports, summaries, and receipts are disposable derived artifacts.

## Failure handling

- Invalid source: move bundle to `knowledge/quarantine/` and record why.
- Partial collection: preserve successful records and emit a collection-failure receipt.
- Missing evidence: mark unknown; do not infer completion.
- Contradiction: create an explicit contradiction relationship rather than overwriting the earlier record.
- Correction: create a new version linked with `SUPERSEDES`; preserve the original.
- Governance failure: stop before opportunity, strategy, experiment, or genesis transition.

## Merge readiness

The branch is ready only when:

- clean install succeeds from the lockfile
- `npm run knowledge:verify` passes twice with identical generated digests
- negative fixtures fail for the intended reason
- CI reproduces local results
- no fixture or reconstructed cycle is represented as delivered evidence
- daily intake cannot transition genesis beyond deferred
- reviewer signs off on the constitution and boundary matrix
