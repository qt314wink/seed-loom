# Epistemic Design Engine — Charter

Status: proposed v0.1  
Parent system: Seed-Loom / Visual Ontology Compiler  
Authority: normative for all reasoning-engine artifacts under `docs/epistemic-engine`, `schemas/reasoning`, and `packages/reasoning-engine`.

## Purpose

The Epistemic Design Engine (EDE) is a domain-independent reasoning layer that turns incomplete intent, evidence, constraints, contradictions, and desired outcomes into traceable provisional solutions. It may begin from any field rather than requiring a complete brief. It must expose how a value was obtained, what assumptions support it, what evidence limits it, what alternatives remain viable, and what would cause revision.

The engine is successful when it improves the quality of questions and the explainability of decisions, not merely the quantity of outputs.

## Governing loop

```txt
observe → frame → inquire → infer → challenge → resolve-or-preserve → decide → compile → verify → learn
```

Every pass must be reversible enough to reconstruct the path from output to evidence and forward enough to produce an actionable next step.

## Non-negotiable principles

1. Evidence and interpretation remain distinguishable.
2. Unknowns, assumptions, hypotheses, contradictions, and decisions are typed separately.
3. No inferred value may masquerade as an observed fact.
4. Premature resolution is a failure mode.
5. Productive paradox may be preserved intentionally.
6. Every major decision retains alternatives and revisit conditions.
7. Rejected pathways remain queryable knowledge.
8. Human override is explicit, attributable, and reversible through supersession rather than silent mutation.
9. Scores communicate comparison and confidence; they do not manufacture certainty.
10. Every output must be usable, testable, or clearly blocked.

## Scope

Included: creative direction, visual-language design, product strategy, research synthesis, technical architecture, component selection, prompt construction, material translation, and other domains representable as entities, fields, evidence, constraints, relationships, and transformations.

Excluded from v0.1: autonomous high-stakes medical, legal, financial, or safety-critical decisions; claims of universal truth; opaque model-only judgments; unattended production changes; self-modifying governance rules.

Deferred: probabilistic graph learning, multi-agent debate, organization-wide permissions, commercial licensing, and domain-certified policy packs.

## Constraints

- Every reasoning run must declare a target, scope, mode, and stop condition.
- Every proposed field value must include derivation type, confidence, provenance, assumptions, and revision triggers.
- A run may not move to `approved` while blocking unknowns remain undisclosed.
- Automated resolution must never overwrite a preserved paradox or explicit human decision.
- Domain adapters may specialize vocabulary but may not weaken the universal evidence and decision requirements.

## Lifecycle conditions

This charter may live as `proposed` while the schemas and runtime are incomplete. It advances to `accepted` only when:

- all eight normative documents exist and cross-reference one another;
- core reasoning schemas validate representative examples;
- one executable vertical slice solves a missing field and emits a trace;
- at least three domains complete the same workflow without schema forks;
- QA demonstrates that observed, inferred, assumed, and unresolved values remain distinguishable.

It must be revised when a production incident reveals hidden inference, untraceable mutation, misleading confidence, or an inability to preserve a legitimate unresolved tension. It must be deprecated if the system cannot outperform a documented human-only baseline on traceability and decision recovery.

## Gates

G0 — Charter completeness: purpose, scope, exclusions, authority, and lifecycle rules are explicit.  
G1 — Schema alignment: all required objects have machine-readable schemas.  
G2 — Traceability: every output field can be traced to evidence or an explicit decision.  
G3 — Challengeability: every non-trivial solution records at least one counterargument or disconfirmation test.  
G4 — Resolution integrity: conflicts use an explicit strategy—override, partition, layer, interpolate, defer, or preserve.  
G5 — Execution: at least one output is compiled into a usable artifact.  
G6 — Verification: automated and human QA both run.  
G7 — Learning: validation results generate a recorded next question or stable conclusion.

## Benchmarks

- Trace coverage: 100% of approved output fields.
- Hidden-assumption rate: 0 known hidden assumptions in approved runs.
- Decision recovery: an independent reviewer reconstructs the chosen path with at least 90% agreement.
- Blocking-question efficiency: no more than five unanswered blocking questions before a run is paused or narrowed.
- Alternative preservation: at least two alternatives for major decisions when plausible.
- Unsupported-inference rate: below 2% in test corpora and 0% for production approval.
- Cross-domain portability: one schema family supports at least three distinct domains.

## QA

Required QA includes schema validation, provenance completeness, confidence calibration, contradiction detection, alternative coverage, resolution-strategy validity, accessibility of explanations, human review, and regression tests against prior accepted runs.

## Definition of done

The charter is done when it governs a working, inspectable reasoning path from incomplete input to a provisional or approved solution, including uncertainty, alternatives, provenance, QA, and explicit conditions under which the answer must change.