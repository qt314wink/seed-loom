# Seed Loom Codex Instructions

## Purpose

Seed Loom converts raw signals into traceable systems and reusable artifacts. Preserve the repository's canonical operating chain:

```text
signal -> interpretation -> system -> artifact -> validation -> package
```

Read `agent/AGENT_MODE_HANDOFF.md` before substantial implementation work. When the `governed_builder` custom agent is used, also read `agent/GOVERNED_BUILDER.md` before editing files.

## Working agreements

- Work only from an explicit objective, bounded scope, and acceptance criteria. If any are missing, surface the gap before implementation rather than silently inventing requirements.
- Inspect the current implementation, tests, schemas, and relevant docs before proposing changes.
- Prefer the smallest coherent change that satisfies the approved scope. Do not perform unrelated refactors.
- Preserve provenance, determinism, evidence integrity, and human-review boundaries when touching governed pipelines.
- Treat failing validation as evidence. Do not weaken, skip, delete, or rewrite tests merely to obtain a passing run unless the approved change explicitly requires the test contract to change.
- Do not claim completion without validation evidence and a concise completion receipt.
- Do not commit, push, merge, release, deploy, rotate credentials, or mutate external systems unless that specific action is explicitly authorized for the current task.

## Validation routing

Choose checks according to the files and behavior changed:

- General TypeScript / application / package changes: `npm run check`
- Knowledge pipeline, contracts, integrity, provenance, or controls: `npm run knowledge:verify`
- Visual or interaction behavior: `npm run test:visual`
- SVG Filter Atlas changes: `npm run filters:check`

Run the narrowest relevant check first, then the broader required gate before claiming completion. If a required command cannot run in the current environment, report the exact command, why it could not run, and what evidence remains missing.

## Completion receipt

Every implementation handoff must report:

1. objective and acceptance criteria addressed;
2. evidence inspected before editing;
3. files changed and why;
4. validation commands run and their outcomes;
5. assumptions, unresolved questions, or missing evidence;
6. governance boundary observed;
7. next shippable action.

A future collaborator should be able to reconstruct intent, implementation scope, validation state, and remaining risk from the receipt.
