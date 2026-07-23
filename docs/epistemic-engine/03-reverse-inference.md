# Epistemic Design Engine — Reverse Inference

Status: proposed v0.1

## Purpose

Reverse inference solves a missing field from any available result, symptom, artifact, constraint, relationship, or desired outcome. It reconstructs candidate causes and required conditions without pretending that backward reasoning proves a single origin.

## Operating contract

Input:

- target entity and target field;
- known values and evidence;
- applicable constraints;
- domain vocabulary;
- acceptable uncertainty;
- stop condition.

Output:

- ranked candidate values;
- derivation path for each candidate;
- assumptions and dependencies;
- contradictions and counterexamples;
- confidence and evidence strength;
- blocking questions;
- recommended action: accept provisionally, test, ask, preserve alternatives, or reject.

## Inference modes

- **Deductive**: the value follows from explicit rules and valid premises.
- **Abductive**: the value is the strongest current explanation of observations.
- **Analogical**: the value is transferred from a sufficiently similar case with declared limits.
- **Constraint-satisfaction**: the value is selected because it best satisfies required and forbidden conditions.
- **Pattern-based**: the value is proposed from recurring relationships in accepted examples.
- **Human-declared**: the value is chosen explicitly rather than inferred.

These modes may combine, but each contribution must be visible.

## Algorithm

```txt
1. Normalize target field and unit.
2. Gather direct evidence and explicit constraints.
3. Traverse incoming and outgoing typed relationships.
4. Generate candidate values from rules, patterns, analogies, and human defaults.
5. Remove candidates violating hard constraints.
6. Score remaining candidates for fit, evidence, coherence, cost, reversibility, and risk.
7. Search for counterexamples and alternative causal paths.
8. Identify questions or tests that best discriminate candidates.
9. Select a provisional value, preserve a candidate set, or declare blocked.
10. Emit a field-solution record and append provenance.
```

Suggested comparative score:

```txt
candidate_score = evidence_strength × constraint_fit × contextual_fit
                  × explanatory_power × reversibility
                  − contradiction_cost − unsupported_assumption_cost − risk
```

Scores rank candidates; they do not establish truth.

## Required field-solution contents

- target field and proposed value;
- value status: observed, inferred, assumed, decided, unresolved, or rejected;
- derivation mode;
- source entity IDs and evidence IDs;
- rules and relationships traversed;
- assumptions;
- alternatives;
- contradiction set;
- confidence;
- what would falsify or revise the value;
- expiration or review date where relevant;
- responsible actor or process.

## Constraints

- No inference may overwrite an observed value.
- A value requiring a missing hard premise must remain `blocked` or `assumed`.
- Causal language requires stronger support than compatibility language.
- Analogy must include both shared and non-shared properties.
- A confidence score above 0.90 requires either deterministic derivation or repeated external validation.
- Default values must be labeled as defaults, not discoveries.
- High-stakes domains require an approved policy adapter and human authority.

## Gates

G0 target validity: field exists, has definition, unit, and allowed value form.  
G1 evidence sufficiency: at least one support path or explicit human decision.  
G2 candidate diversity: multiple plausible candidates are generated when the problem is underdetermined.  
G3 counterfactual test: every chosen candidate records what would make it wrong.  
G4 constraint compliance: zero hard-constraint violations.  
G5 provenance completeness: every dependency is addressable.  
G6 actionability: output identifies a next action or valid stopping state.

## Benchmarks

- Deterministic-field accuracy: 100% on rule-derived fixtures.
- Candidate recall: accepted human answer appears in the top three candidates at least 85% of the time on benchmark cases.
- Calibration: candidates scored near 0.70 should be accepted approximately 70% of the time across a sufficiently large labeled set.
- Hard-constraint violation rate: 0.
- Provenance completeness: 100% for approved solutions.
- Independent trace reproduction: at least 90% agreement.
- Abstention quality: on intentionally underdetermined cases, the engine preserves alternatives or blocks rather than inventing certainty in at least 95% of tests.

## QA

Use golden fixtures, adversarial missing-premise cases, contradictory evidence tests, unit mismatch tests, analogy-boundary tests, confidence calibration, and human review. Regression tests must verify that new patterns do not silently change accepted solutions without a superseding decision record.

## Conditions for continued life

Reverse inference may live in production only after it demonstrates both solution quality and honest abstention. A domain adapter is suspended if it repeatedly overstates causality, hides assumptions, or produces confident answers from sparse evidence. Patterns expire or are demoted when real-world outcomes no longer support them.