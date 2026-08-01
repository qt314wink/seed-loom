# Phase B — Knowledge Integrity Engine

## Purpose

Phase B consolidates structural, provenance, and governance checks behind one deterministic entry point. It does not accept knowledge, modify canonical records, execute repository actions, advance genesis, or spend external funds.

## Commands

- `npm run knowledge:integrity` runs the engine and writes `knowledge/receipts/integrity/latest.json`.
- `npm run knowledge:test:integrity` runs the engine twice with a fixed clock and proves deterministic inventory and receipt digests.
- `npm run knowledge:verify` now includes the Phase B proof.

## Checks in this slice

The engine inventories all canonical JSON records, computes a deterministic graph inventory digest, invokes schema validation, invokes the Phase A contract test, verifies stable record identifiers, resolves observation source references, resolves relationship endpoints and evidence references, and enforces the existing governance denials for automated acceptance, daily genesis, spending, and notebook writes.

## Receipt contract

The integrity receipt contains engine version, run time, pass or fail state, record count, inventory digest, subprocess exit states and output digests, provenance failures, governance failures, explicit authority boundaries, and a receipt digest.

`latest.json` is a generated verification projection. It is reproducible and may be overwritten by the next integrity run. Canonical observations, relationships, sources, runs, and decisions remain immutable unless an approved correction or supersession protocol is used.

## Failure behavior

Any schema failure, unresolved required reference, missing stable identifier, or governance-denial violation causes a non-zero exit. The engine reports failures; it does not repair or silently rewrite records.

## Current boundary

This first Phase B slice intentionally reuses the existing schema validator and Phase A adapter proof. Source independence, temporal projection, semantic duplicate analysis, correction propagation, sensitive-data scanning, calibration, budget enforcement, and notebook quarantine remain separately governed controls and will be integrated through stable interfaces rather than folded into one opaque script.

## Definition of done for Phase B

Phase B is complete only when the integrity command and deterministic test pass in CI, the same fixed-input run produces the same receipt digest twice, every failure category has a negative fixture, and the Graph Workbench can expose integrity receipts and failure queues without treating them as canonical knowledge.
