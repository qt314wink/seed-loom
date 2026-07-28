# Epistemic Design Engine — System Map

Status: proposed v0.1  
Depends on: `00-charter.md`, Universal Entity Model, Visual Ontology Compiler, Recursive Socratic Component System, QA and Decision Log Protocol.

## Position in Seed-Loom

The Epistemic Design Engine is the orchestration layer above Seed-Loom's shared ontology and below its domain applications.

```txt
Universal Entity / Parameter / Relationship / Transformation Model
                         │
        ┌────────────────┼────────────────┐
        │                │                │
Evidence Ledger   QA + Decision      Domain Ontologies
        │          Governance              │
        └────────────────┼────────────────┘
                         ▼
              Epistemic Design Engine
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
Visual Language   Product/Research   Technical/Workflow
Compiler          Reasoners          Reasoners
```

The engine does not replace the Visual Ontology Compiler. It generalizes the reasoning protocol that the VOC uses and makes that protocol callable across domains.

## Parent relationships

- `uses` Universal Entity Model for identity, parameters, relationships, transformations, QA, and decision memory.
- `extends` Visual Ontology Compiler from visual compilation into general field solving.
- `implements` Recursive Socratic Inquiry for descent from ambiguous language to measurable or testable terms.
- `writes_to` the append-only Evidence Ledger.
- `validated_by` QA and Decision Log Protocol.
- `constrained_by` the Charter and domain policy packs.

## Child relationships

Initial children are:

- Visual Language Compiler
- Reverse Image Analyzer
- Creative Brief Investigator
- Component Selection Engine
- Material and Shader Recommender
- Prompt Compiler
- Product Strategy Reasoner
- Research Synthesis Engine
- Decision Review Assistant
- Portfolio Provenance Generator

Children may add domain vocabularies and specialized tests. They may not remove provenance, uncertainty typing, alternative preservation, or human-review gates.

## Runtime modules

1. **Frame** — converts an incoming request into target, scope, mode, constraints, and stop conditions.
2. **Observe** — records direct evidence without interpretation.
3. **Classify** — identifies problem pattern, domain, entity types, and candidate relationships.
4. **Inquire** — generates and prioritizes questions.
5. **Infer** — proposes missing values and causal or structural relationships.
6. **Challenge** — searches for contradictions, alternatives, counterexamples, and hidden assumptions.
7. **Resolve** — selects an explicit conflict strategy or preserves tension.
8. **Decide** — records the provisional or approved choice and why.
9. **Compile** — translates the decision into a domain artifact.
10. **Verify** — runs schema, logic, performance, accessibility, fidelity, and human checks.
11. **Learn** — emits superseding records, revised patterns, or new questions from outcomes.

## Canonical data flow

```txt
input
→ reasoning_run
→ evidence_claims
→ inquiry_queue
→ inference_candidates
→ contradiction_set
→ resolution_record
→ decision_record
→ compiled_artifact
→ validation_record
→ evidence_event / next_question
```

No stage may silently skip its predecessor. A stage may declare `not_applicable`, but the reason must be recorded.

## State model

```txt
draft → framed → investigating → candidate_ready → challenged
→ resolved | preserved | blocked
→ compiled → verified → approved | rejected | experimental
→ superseded | archived
```

`Preserved` is a valid state for a contradiction whose resolution would destroy useful identity or require absent evidence. `Blocked` is valid when a missing fact is material to the decision. Neither is treated as failure.

## Constraints

- One authoritative entity ID per object across all modules.
- Append-only reasoning events; corrections supersede rather than edit history.
- A domain child cannot redefine universal epistemic states.
- Every automated transition has a machine-readable reason.
- No direct transition from `draft` to `approved`.
- Compilation cannot precede a target definition and at least one validated support path.

## Gates

G0 topology: every module has named inputs, outputs, and owner.  
G1 interoperability: shared IDs survive across evidence, inference, decision, and artifact records.  
G2 state integrity: invalid state transitions are rejected.  
G3 child compliance: each child declares inherited and specialized rules.  
G4 round-trip trace: artifact → decision → inference → evidence is reconstructable.  
G5 failure containment: one module failure cannot corrupt accepted history.

## Benchmarks

- Round-trip trace success: 100% for approved runs.
- Orphan entity rate: 0 for approved artifacts.
- Invalid transition rate: 0 in CI.
- Cross-module ID mismatch: 0.
- Domain adapter duplication: under 20% of schema fields; higher duplication triggers abstraction review.
- Time to locate the source of a decision: under 60 seconds for a reviewer using generated reports.

## QA

QA must include graph-integrity tests, cycle detection for forbidden dependency loops, orphan detection, state-transition tests, schema compatibility tests, and a human architecture review. A dependency cycle is allowed only when explicitly modeled as a learning loop and prohibited from rewriting immutable history.

## Conditions for continued life

This map remains normative only while actual package boundaries and data flow match it. Any implementation divergence lasting more than one release requires either code correction or a documented RFC update. A child application that repeatedly bypasses the map must be isolated as experimental until compliant.