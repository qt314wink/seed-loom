# Subagent Protocol — Visual Mechanism Compiler v0

This file is the short operational version of the subagent rules in `CODEX_HANDOFF.md`.

## Parent rule

The parent agent owns scope, integration, acceptance and the final receipt. Subagents may analyze or implement bounded slices only.

## A — Contract/Evidence
- Read analyzer schema, validator, traceability and fixtures.
- Reuse existing semantics before adding fields.
- IF traceability breaks, STOP.
- Output: schema/type proposal + evidence map.

## B — Fixture/Determinism
- Build the `mirrored_liquid` fixture and replay tests.
- IF no real source evidence is available, label the fixture synthetic.
- IF normalized runs differ, fail the determinism gate.
- Output: input fixture + expected normalized result + tests.

## C — Mechanism Mapping
- Start after Contract/Evidence stabilizes.
- Map only supported signals.
- IF competing mechanisms remain plausible, preserve alternatives.
- IF Shader Grammar is required, emit an integration note only.
- Output: reason-coded mechanism candidates + refs.

## D — Case Study/QA
- Build the claim/evidence matrix.
- IF a claim is not measured, do not publish it as fact.
- IF evidence is not reproducible, downgrade/remove the claim.
- Output: evidence matrix + readiness verdict.

## Shared stop conditions

Do not deploy, merge, add secrets, refactor unrelated systems, add renderer code, or cross into Shader Grammar/WebGL implementation.
