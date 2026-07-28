# Epistemic Design Engine — Quality Questions

Status: proposed v0.1

## Purpose

Quality questions evaluate the reasoning process and its output before approval. They test whether the system solved the right problem, used evidence honestly, preserved material uncertainty, produced an actionable result, and can explain every consequential decision.

Quality is represented across five aligned forms:

```txt
intent → specification → implementation → observable behavior → measurable evidence
```

A solution is incomplete when these forms disagree.

## Required question sets

### Framing quality

- Is the target decision explicit?
- Is the scope narrow enough to act and broad enough to avoid local optimization?
- Are included, excluded, deferred, and forbidden areas declared?
- Would a different framing remove the apparent conflict?

### Evidence quality

- Which claims are directly observed, reported, inferred, assumed, or decided?
- Is the strongest claim supported by the strongest evidence?
- Are provenance and freshness adequate for the decision?
- What evidence would reverse the conclusion?

### Pattern quality

- Is the recognized pattern supported by multiple features rather than one superficial resemblance?
- Are nearby patterns and counterexamples considered?
- Is the pattern portable to this context?
- Did the system mistake frequency for desirability?

### Inference quality

- Are premises complete?
- Are causal claims stronger than the evidence permits?
- Are confidence and uncertainty calibrated?
- Did default values masquerade as discoveries?

### Decision quality

- Are alternatives plausible and fairly represented?
- Is the selected resolution strategy appropriate?
- Are consequences, rollback, and revisit conditions explicit?
- Is the decision reversible at the level implied by confidence?

### Paradox quality

- Is the tension genuine?
- Does preserving it protect identity, adaptability, or stakeholder truth?
- Is it contained enough to permit action?
- Has “paradox” become an excuse for indecision or incoherence?

### Implementation quality

- Does the artifact implement the decision rather than merely resemble the description?
- Are interfaces, parameters, defaults, failures, and fallbacks explicit?
- Can the result be tested automatically and reviewed by a human?
- Does performance or accessibility change the intended meaning?

### Explanation quality

- Can a reviewer travel from output to decision to evidence?
- Can the explanation be understood at executive, practitioner, and machine-readable levels?
- Are caveats visible at the point where they matter?
- Does the explanation reveal uncertainty without becoming unusable?

### Learning quality

- Did validation produce a stable conclusion, a correction, or a better question?
- Are failures retained as useful evidence?
- Did the system update a pattern based on real outcomes rather than preference?
- Can the next run benefit from this one without inheriting its mistakes blindly?

## Quality scorecard

Required dimensions use 0.0–1.0 internally:

- framing fitness
- evidence adequacy
- provenance completeness
- pattern fit
- inference validity
- uncertainty honesty
- alternative coverage
- resolution integrity
- implementation fidelity
- verification strength
- explanation clarity
- actionability
- learning value

No aggregate score may conceal a hard failure. Reports show dimension scores, rationale, strongest evidence, weakest evidence, and required fixes.

## Constraints

- Questions must map to a gate, risk, field, or decision.
- “Looks good” and “feels right” are observations requiring translation, not final QA judgments.
- Automated scores require written explanations.
- Human taste cannot override accessibility, provenance, consent, or hard technical failures without an explicit exception record.
- The same actor may author and review an experimental run, but production approval requires independent review.

## Gates

G0 framing score ≥ 0.80.  
G1 provenance completeness = 1.00 for approved consequential fields.  
G2 inference validity ≥ 0.80 and no unsupported causal claims.  
G3 alternative coverage ≥ 0.75 or documented single-path necessity.  
G4 implementation fidelity ≥ 0.85.  
G5 accessibility and hard constraints: pass.  
G6 explanation clarity ≥ 0.80 in human review.  
G7 actionability ≥ 0.80 or valid `blocked/preserved/deferred` state.  
G8 learning event recorded after real-world validation.

## Benchmarks

- 100% trace coverage for approved consequential fields.
- 0 undisclosed hard failures.
- Independent reviewers locate rationale and caveats in under two minutes.
- At least 85% agreement between stated intent and observed artifact behavior.
- At least one disconfirmation test per major inference.
- At least one real-world outcome measure per production decision.
- Quality regressions above 0.05 on any dimension block release unless explicitly waived.

## QA methods

Use schema validation, static linting, unit tests, contract tests, integration tests, behavioral tests, accessibility checks, performance budgets, visual regression where relevant, provenance audits, adversarial review, human validation, and post-release reality checks.

## Conditions for continued life

A quality question or metric remains in the standard only while it predicts defects, improves decisions, strengthens traceability, or protects a declared value. Metrics that become gameable, redundant, or disconnected from outcomes must be revised or retired through a decision record. Thresholds require recalibration from observed project data rather than permanent intuition.