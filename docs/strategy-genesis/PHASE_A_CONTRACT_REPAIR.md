# Phase A — Nightly Contract Repair

Status: in progress on `feat/strategy-genesis-engine-v0` under draft PR #23.

## Purpose

Phase A removes structural disagreement between the nightly automation bundle, JSON Schemas, and the durable ingestion path. It does not alter accepted knowledge, merge records, create repositories, or broaden automation authority.

## Canonical contract

Durable source, observation, and relationship records use `id`. The ingestion adapter may accept the legacy aliases `sourceId`, `observationId`, and `relationshipId`, but it must remove those aliases before validation and persistence. If both forms are present and disagree, ingestion fails closed.

Research runs retain `runId` and stage acknowledgements retain `ackId` because those names are already part of their durable schema and reference vocabulary. Compatibility is explicit rather than hidden.

The current schema contract version is `1.1.0`. Newly normalized records receive this value. Existing historical records remain readable while migrations are reviewed; the adapter does not rewrite canonical files.

## Ingestion modes

A run must identify one of:

- `delivered`
- `reconstructed`
- `unavailable`
- `synthetic`

The retained nightly automation may ingest only `delivered` runs. Reconstructed and unavailable cycles require separate recovery protocols and can never be represented as original delivered output.

## Daily authority boundary

Every nightly observation must remain `approvalState: candidate`. Repository actions may appear only as records with `status: proposed` and `executed: false`. The genesis stage must be acknowledged as `deferred` with transition blocked.

## Compatibility adapter

`scripts/knowledge/normalize-nightly-bundle.mjs` performs an in-memory, deterministic normalization. It:

1. accepts canonical and approved legacy identifier keys;
2. rejects conflicting aliases;
3. assigns schema version `1.1.0` when absent;
4. assigns `ingestionMode: delivered` only when the legacy bundle omitted it;
5. maps legacy `approvalState: pending` to the daily candidate state in the normalized copy;
6. never writes or mutates canonical files.

## Ingestion sequence

`scripts/knowledge/ingest-nightly-run.mjs` now performs:

1. parse;
2. normalize;
3. authority checks;
4. complete stage-acknowledgement checks;
5. run-to-record referential checks;
6. JSON Schema validation;
7. immutable target preflight;
8. optional dry run;
9. atomic file creation with rollback on partial failure;
10. content-hashed receipt generation.

Stage acknowledgements are stored as individual records under `knowledge/runs/stage-acks/`, preventing an untyped array from being mistaken for a `ResearchRun` by the current validator.

## Commands

Run only the Phase A proof:

```bash
npm run knowledge:test:contract
```

Validate a bundle without writing:

```bash
npm run knowledge:ingest -- path/to/bundle.json --dry-run
```

Run the full knowledge verification chain:

```bash
npm run knowledge:verify
```

## Acceptance criteria

Phase A is complete only when:

- legacy aliases normalize to canonical IDs;
- conflicting aliases fail;
- `ingestionMode` validates;
- exactly five observation IDs match the bundled observations;
- relationship IDs match the run declaration;
- all thirteen pipeline stages are acknowledged exactly once;
- genesis is deferred;
- executed repository actions fail;
- dry-run produces no canonical writes;
- immutable collisions fail before any write;
- partial write failure rolls back newly created files;
- two identical dry runs produce the same normalized digest;
- a real checkout passes the contract test and full knowledge verification.

## Current limitation

The repository changes have been committed, but this environment could not resolve `github.com` for a fresh clone. Runtime execution remains a required proof before Phase A can be declared complete or PR #23 can advance from draft.
