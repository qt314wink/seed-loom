# Epistemic Design Engine — Implementation Roadmap

Status: proposed v0.1

## Objective

Build the smallest executable system that can accept an incomplete entity, solve one missing field through reverse inference, preserve uncertainty and paradox, produce an actionable decision, compile a domain artifact, and emit a complete provenance trace.

The roadmap prevents documentation from outrunning implementation and implementation from bypassing governance.

## Phase 0 — Canonical specification

Deliverables:

- eight normative documents;
- cross-reference index;
- controlled vocabulary for epistemic states, derivation modes, resolution strategies, and lifecycle states;
- architecture decision record establishing the EDE as a layer within Seed-Loom.

Gate: no contradictory definitions across normative documents.  
Benchmark: 100% of normative terms have one canonical definition.  
QA: terminology lint, link check, architecture review.  
Life condition: documents remain `proposed` until schemas and one vertical slice exist.

## Phase 1 — Schema family

Create:

```txt
schemas/reasoning/reasoning-run.schema.json
schemas/reasoning/inquiry-question.schema.json
schemas/reasoning/inference.schema.json
schemas/reasoning/assumption.schema.json
schemas/reasoning/paradox.schema.json
schemas/reasoning/resolution.schema.json
schemas/reasoning/decision-record.schema.json
schemas/reasoning/field-solution.schema.json
schemas/reasoning/quality-record.schema.json
```

Gate: valid and invalid fixtures behave as expected.  
Benchmark: 100% schema coverage for required charter fields; zero ambiguous enums.  
QA: JSON Schema validation, fixture tests, backward-compatibility tests.  
Life condition: a schema may advance from draft only when used by at least one executable fixture.

## Phase 2 — Core TypeScript package

Create `packages/reasoning-engine` with modules:

```txt
frame.ts
classify.ts
inquire.ts
infer.ts
challenge.ts
preserve-paradox.ts
resolve.ts
decide.ts
explain.ts
record-provenance.ts
solve-field.ts
```

Initial API:

```ts
solveField(input: ReasoningRunInput): Promise<FieldSolution>
```

Gate: deterministic fixtures pass and traces validate.  
Benchmark: 100% hard-constraint compliance; top-three candidate recall ≥ 85% on labeled fixtures.  
QA: unit, property, contract, and adversarial tests.  
Life condition: no public API without typed errors, stop states, and provenance output.

## Phase 3 — First vertical slice

Use one Seed-Loom visual-language case:

```txt
known intent + evidence + constraints
→ solve missing motion/material/token field
→ generate alternatives
→ challenge inference
→ preserve or resolve tension
→ compile CSS/JSON output
→ validate
→ write evidence event
```

Gate: an independent reviewer reconstructs the path from output to evidence.  
Benchmark: ≥ 90% reconstruction agreement; 100% approved-field trace coverage.  
QA: visual regression, schema validation, decision review, accessibility and performance checks.  
Life condition: the slice stays experimental until it succeeds on three materially different fixtures.

## Phase 4 — Cross-domain portability

Run the same engine on:

1. visual-language or component design;
2. product-strategy decision;
3. technical architecture selection.

Gate: no domain-specific fork of the universal reasoning schemas.  
Benchmark: shared schema duplication below 20%; reviewer usefulness ≥ 4/5 in every domain.  
QA: adapter contract tests, vocabulary collision tests, domain-expert review.  
Life condition: adapters remain experimental if they overclaim authority or cannot define domain-specific evidence standards.

## Phase 5 — Workflow automation

Add GitHub Actions:

```txt
reasoning-schema-validation.yml
reasoning-trace-coverage.yml
reasoning-regression.yml
ontology-integrity.yml
unresolved-tension-audit.yml
```

Gate: pull requests fail on invalid schemas, orphan traces, hidden blockers, or changed accepted outcomes without decision records.  
Benchmark: CI completes within five minutes for the standard fixture suite.  
QA: intentional-failure tests and branch-protection rehearsal.  
Life condition: workflow thresholds are revised when false positives exceed 5% or material defects escape twice in one release cycle.

## Phase 6 — Human interface

Add a trace explorer that shows:

- known, inferred, assumed, unresolved, and rejected values;
- question queue;
- candidate comparisons;
- paradoxes and resolution strategies;
- provenance path;
- quality gates and failures;
- next reversible action.

Gate: users can understand a decision without reading raw JSON.  
Benchmark: median rationale lookup under two minutes; explanation clarity ≥ 0.80.  
QA: usability testing, keyboard navigation, screen-reader review, reduced-motion testing.  
Life condition: UI may not hide caveats or collapse alternatives by default.

## Phase 7 — Learning loop

Connect outcomes to pattern updates through candidate-only learning. The engine may propose updated weights, questions, or patterns but cannot alter accepted governance or production rules without review.

Gate: every learned change cites outcome evidence and passes regression tests.  
Benchmark: measurable improvement over baseline on at least one target without regression above 0.05 elsewhere.  
QA: holdout evaluation, drift detection, rollback test, human approval.  
Life condition: learning pauses automatically when calibration degrades, provenance is incomplete, or unexplained drift appears.

## Release gates

A v0.1 release requires:

- normative documents accepted;
- schema family implemented;
- one working `solveField()` path;
- three-domain fixtures;
- append-only provenance;
- automated quality gates;
- human-readable trace report;
- documented limitations and high-stakes exclusions.

A v1.0 release additionally requires outcome-backed benchmarks, stable APIs, migration policy, security review, privacy policy, and evidence that the engine improves traceability and decision quality over a simpler baseline.

## Definition of done

The implementation is done only when it can produce a useful answer or an honest stop state, explain exactly how it arrived there, identify what could change it, preserve unresolved tension when appropriate, and survive independent verification from source evidence through deployed artifact.