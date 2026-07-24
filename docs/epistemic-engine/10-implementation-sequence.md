# Epistemic Design Engine — Bounded Implementation Sequence

Status: normative execution gate
Version: 0.1.0
Depends on: `09-repository-boundary.md`

## Governing rule

No implementation phase may begin until the prior phase produces executable evidence and a reviewed contract. Documentation breadth is not a substitute for a working vertical slice.

## Phase 0 — Boundary acceptance

Deliverables:

- repository responsibility map;
- dependency direction;
- explicit non-goals;
- mutation authority set to none;
- storage ownership assigned to the MelodicBloom data platform.

Gate: Jennipher approves the ownership boundary.

## Phase 1 — `solveField()` deterministic core

Allowed paths:

```text
packages/reasoning-core/**
packages/schemas/reasoning/**
docs/epistemic-engine/fixtures/**
```

Input:

```text
field definition
current value or unknown state
constraints
available evidence references
question budget
resolution policy
```

Output:

```text
candidate values
assumptions
alternatives
unresolved tensions
selected or deferred resolution
quality results
provenance receipt
```

Required behavior:

- deterministic fixture execution;
- no network calls;
- no persistent database;
- no UI;
- no agents;
- no repository mutation;
- explicit unresolved result when evidence is insufficient;
- append-only correction semantics in emitted records.

QA:

- schema validation;
- deterministic snapshot;
- contradiction detection;
- unsupported-claim count;
- evidence coverage;
- reversal/supersession fixture;
- invalid input and absent evidence cases.

## Phase 2 — Provider-neutral evidence adapter

Only after Phase 1 merges.

Purpose: translate provider output into the Phase 1 input contract without allowing provider language to become canonical semantics.

Required:

- untrusted-output boundary;
- provider and model metadata;
- local validation;
- disagreement records;
- provider failure fallback;
- no hidden persistence.

## Phase 3 — Persistence adapter

Owned jointly by the Seed Loom contract and MelodicBloom storage implementation.

Seed Loom supplies storage-neutral interfaces. The MelodicBloom data platform supplies migrations and durable records.

Required:

- append-only writes;
- idempotency keys;
- historical reconstruction;
- superseding records rather than edits;
- transaction rollback tests;
- no direct product-repository table access.

## Phase 4 — Read-only runtime integration

Agent Runtime may call `solveField()` only from a read-only, allowlisted audit workflow.

Required:

- signed task;
- default-deny policy;
- read-only GitHub App permissions;
- immutable execution receipt;
- no branches, patches, pull requests, merges, deployments, or secret changes.

Promotion gate: repeated successful audits with no policy violations and explicit Jennipher approval.

## Phase 5 — Human review surface

A UI may be added only after the deterministic core, persistence adapter, and read-only execution path are verified.

The UI must show:

- evidence;
- candidate values;
- assumptions;
- alternatives;
- preserved paradoxes;
- confidence and uncertainty;
- selected resolution;
- provenance;
- reversal and correction history.

The UI may not silently resolve incomplete fields.

## Phase 6 — Bounded mutation proposal

The system may propose changes, but not apply them automatically.

Required:

- exact repository and allowed paths;
- base SHA;
- changed-file inventory;
- patch preview;
- QA plan;
- rollback plan;
- human approval.

Actual mutation authority remains an Agent Runtime concern and requires a separate promotion decision.

## Stop conditions

Stop the implementation when:

- a required edit falls outside allowed paths;
- the canonical owner is ambiguous;
- schemas conflict with Analyzer Core or the evidence ledger;
- a provider-specific field enters a canonical schema;
- deterministic fixtures cannot be produced;
- persistence would overwrite a prior record;
- runtime mutation is required to demonstrate the slice;
- UI work begins before the reasoning contract is executable.

## Definition of done

The Epistemic Design Engine is not considered implemented merely because its documents exist. The first implementation milestone is complete only when one deterministic `solveField()` fixture passes all contract, contradiction, traceability, and provenance checks without network, persistence, UI, or mutation authority.
