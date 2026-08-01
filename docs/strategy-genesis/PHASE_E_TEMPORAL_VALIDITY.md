# Phase E — Temporal Validity and Confidence Projection

Phase E evaluates how time affects the present usefulness of evidence without rewriting historical records.

## Purpose

Canonical confidence records the evidence assessment made at capture or review time. Phase E computes a disposable, time-indexed projection for current decision support.

The system must preserve both statements at once:

- what confidence was assigned then;
- how much decision weight that evidence should carry now.

The second statement is a projection. It never replaces the first.

## Canonical and derived boundaries

Canonical records may contain optional temporal metadata:

- `evidenceClass`
- `validFrom`
- `validUntil`
- `reviewBy`
- `termsChangedAt`
- `closedAt`
- `closureRef`
- `supersededBy`

The canonical `confidence` field is immutable during temporal evaluation.

Derived projections live under:

- `knowledge/projections/temporal-decay/`
- `knowledge/receipts/temporal-decay/`

They are disposable and reproducible from canonical JSON, governance policy, and an explicit evaluation time.

## Evaluation rules

The evaluation anchor is `validFrom` when present, otherwise `capturedAt`.

The default mathematical projection is:

`effectiveConfidence = baseConfidence × 0.5^(daysSinceAnchor / halfLifeDays)`

The result is rounded deterministically. The selected half-life and review window come from `knowledge/config/governance.json` according to `evidenceClass`.

An unknown or missing evidence class falls back to the default policy and emits a warning. It does not infer a more favorable class.

Explicit state transitions override decay:

- `supersededBy` sets projected decision weight to zero and links the replacement;
- an elapsed `closedAt` sets projected decision weight to zero and marks the record expired;
- an elapsed `validUntil` marks the record expired;
- an elapsed `reviewBy` or effective `termsChangedAt` requires review.

Future-dated anchors, missing confidence, invalid timestamps, and missing anchors fail closed and are excluded from usable projection entries.

## Commands

Run the temporal evaluator against canonical observations:

`npm run knowledge:temporal -- --now 2026-07-31T00:00:00Z`

Run the deterministic adversarial suite:

`npm run knowledge:test:temporal`

Run the integrated integrity engine:

`npm run knowledge:integrity`

Run the complete verification chain:

`npm run knowledge:verify`

Production, CI, audit, and comparison runs should inject an explicit `--now` or `KNOWLEDGE_NOW` value. Wall-clock execution is allowed for local exploration but cannot be used as deterministic proof.

## Governance

Phase E may emit projections, expiry flags, review queues, warnings, violations, and receipts.

It may not:

- change canonical confidence;
- rewrite a canonical record;
- delete stale evidence;
- silently close an opportunity;
- silently supersede an observation;
- accept knowledge;
- authorize strategy or repository genesis.

Expiry means a record should not carry current decision weight without review. It does not mean the historical record was false or should be erased.

## Required proof

Phase E is complete only when tests demonstrate:

- base confidence remains byte-for-byte unchanged;
- fresh, stale, expired, changed-terms, closed, and superseded fixtures produce the expected projections;
- future-dated and malformed records fail closed;
- unknown evidence classes use the default policy with warnings;
- explicit closure and supersession override mathematical decay;
- repeated fixed-time runs produce identical digests and byte-identical receipts;
- canonical records are not modified;
- the Integrity Engine records Phase E as a first-class stage.

## Current status

The temporal evaluator, projection schema, fixtures, and adversarial test harness existed from the WS2 implementation. Phase E formally integrates them with the canonical observation schema, package commands, the Integrity Engine, and the full verification chain. The pull request remains draft until CI and two fixed-time verification runs pass.
