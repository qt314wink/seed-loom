# Change-Aware Provenance Collection Contract

Status: proposed implementation contract
Approval: Jennipher approved 2026-07-30

## Purpose

Prevent nightly collection from producing durable ledger noise when source evidence has not materially changed, while preserving auditable receipts for every run.

## Required classifications

Every normalized source comparison MUST resolve to exactly one status:

- `meaningful-change`: source content or normalized evidence changed in a decision-relevant way.
- `no-change`: collection succeeded and no decision-relevant field changed.
- `collection-failure`: source could not be collected, parsed, normalized, or verified.
- `confidence-change`: source facts remain stable but confidence, contradiction state, or evidence quality changed.

## Durable-write policy

Durable evidence records are committed only for `meaningful-change`, `collection-failure`, or `confidence-change`.

A successful `no-change` run emits a lightweight receipt containing:

- run timestamp
- source reference
- previous accepted record hash
- normalized candidate hash
- comparator version
- status
- reason code

The receipt MUST NOT rewrite or delete prior accepted records.

## Comparison boundary

The comparator evaluates normalized evidence, not raw formatting. Field-level differences MUST record:

- JSON pointer or semantic field path
- previous value hash
- candidate value hash
- materiality rule
- classification rationale

Materiality rules are versioned and deterministic.

## Acceptance tests

1. Repeated identical input yields `no-change` and a stable candidate hash.
2. A decision-relevant normalized field change yields `meaningful-change`.
3. A source timeout or parse failure yields `collection-failure` without replacing accepted evidence.
4. A confidence-only adjustment yields `confidence-change`.
5. Re-running the same fixture produces byte-stable receipts except for explicitly volatile run metadata.
6. Prior provenance records remain append-only.

## Approval gates

- No deletion or rewriting of prior provenance records.
- No analyzer, UI, Filter Atlas, deployment, or unrelated workflow changes.
- Comparator and materiality policy changes require fixture updates and reviewer approval.
