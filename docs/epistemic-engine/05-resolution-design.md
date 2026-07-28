# Epistemic Design Engine — Resolution Design

Status: proposed v0.1

## Purpose

Resolution design selects how competing claims, constraints, candidates, and forces become an actionable decision. The engine does not average conflicts by default. It identifies the conflict type, evaluates consequences, chooses an explicit strategy, and records what remains unresolved.

## Resolution strategies

- **Override** — one requirement wins because it has higher authority, evidence, safety, or strategic priority.
- **Partition** — different contexts, regions, users, or subsystems receive different solutions.
- **Layer** — one candidate governs structure while another governs surface, behavior, narrative, or secondary expression.
- **Interpolate** — compatible scalar values blend within a validated range.
- **Sequence** — alternatives occur in an ordered progression or experiment.
- **Conditional branch** — context or evidence determines which candidate activates.
- **Defer** — resolution waits for a named fact, test, consent, or dependency.
- **Preserve** — the tension remains identity-bearing under the paradox protocol.
- **Reject all** — no candidate satisfies minimum conditions; reframing is required.

## Decision architecture

```txt
conflict identification
→ authority and constraint check
→ evidence comparison
→ reversibility and consequence analysis
→ strategy selection
→ candidate decision
→ counterfactual challenge
→ implementation contract
→ verification
```

A resolution record contains the conflict, candidates, stakeholder or rule authority, selected strategy, chosen path, rejected alternatives, consequence analysis, implementation scope, rollback path, confidence, unresolved residue, and revisit condition.

## Selection rules

1. Hard safety, consent, accessibility, and legal constraints override lower-order preferences.
2. Prefer reversible choices when evidence is weak and learning is inexpensive.
3. Prefer partition or conditional branching when contexts are genuinely different.
4. Use interpolation only for compatible dimensions with meaningful scales.
5. Preserve a paradox only when both sides are supported and containable.
6. Defer only when the missing information could materially change the decision.
7. Reject all when the framing itself creates the conflict.

## Constraints

- Every major resolution must compare at least two plausible paths when available.
- Authority must be explicit; popularity is not authority.
- Numeric scoring cannot silently override a hard rule or human consent.
- A decision without a rollback or revisit condition must justify irreversibility.
- Resolution records are append-only and may be superseded, never silently rewritten.
- The chosen strategy must be implementable in the target domain.

## Gates

G0 conflict definition: competing claims and affected fields are explicit.  
G1 authority order: hard constraints and decision rights are identified.  
G2 alternative quality: alternatives are viable rather than straw men.  
G3 consequence coverage: first-order effects and material second-order risks are recorded.  
G4 strategy validity: the selected strategy matches the conflict type.  
G5 implementation contract: owner, scope, acceptance tests, and rollback are defined.  
G6 challenge: a counterfactual or skeptical review occurs.  
G7 closure: the result is approved, experimental, deferred, preserved, blocked, or rejected.

## Benchmarks

- 100% of approved major decisions contain chosen path, rationale, alternatives, risks, and revisit conditions.
- 0 hard constraints violated.
- At least 90% independent reviewer agreement that the selected strategy is compatible with the conflict type.
- Reversible experiments define success and failure thresholds before execution.
- Decision re-open rate caused by missing documented assumptions stays below 10%.
- Rollback can be executed within the declared recovery budget.

## QA

QA includes authority-order validation, alternative-strength review, consequence omission checks, false-interpolation detection, rollback verification, counterfactual testing, and post-decision outcome review. Compare intended and observed results; deviations must generate a learning event.

## Conditions for continued life

A resolution remains valid only while its evidence, constraints, context, and authority remain materially unchanged. It must be reviewed when a revisit trigger fires, a hard constraint changes, outcome metrics miss thresholds, a preserved risk manifests, or new evidence reverses candidate ranking.