# Knowledge schema version 1.1.0

Version `1.1.0` repairs the nightly-ingestion contract without rewriting historical canonical records.

## Canonical identifiers

| Record | Canonical identifier | Accepted legacy intake alias |
|---|---|---|
| Source | `id` | `sourceId` |
| Observation | `id` | `observationId` |
| Relationship | `id` | `relationshipId` |
| ResearchRun | `runId` | none |
| Stage acknowledgement | `ackId` | none |

Legacy aliases are accepted only in the in-memory nightly bundle adapter. Persisted records must use canonical schema fields. Conflicting canonical and legacy values fail closed.

## Compatibility policy

Minor schema versions may add optional fields, constrained enum values, or explicit adapters while preserving existing durable meaning. A change that removes a field, changes its meaning, or rewrites canonical records requires a major schema version and a separately reviewed migration plan.

Adapters must be deterministic, side-effect free, and testable. They may produce normalized candidate records or migration patches. They may not edit historical files in place.

## Daily ingestion requirements

A delivered nightly run must declare `ingestionMode: delivered`, contain exactly five observations, preserve all collection failures, include every required stage acknowledgement, defer repository genesis, and keep all observations in candidate approval state.
