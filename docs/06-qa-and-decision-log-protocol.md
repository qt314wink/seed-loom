# Document 6 — QA and Decision Log Protocol

Status: v0.1 draft  
Purpose: define how VOC validates outputs, explains confidence, preserves alternatives, and prevents uncontrolled drift.

## 1. Core QA principle

QA is not a final checklist. QA runs at every phase: observation, classification, parameterization, constraint assignment, prompt compilation, code compilation, mutation, review, and publication.

The QA function does not only pass or fail. It scores, explains, and recommends.

Chosen decision: numeric score plus written rationale.

Reason: pass/fail is too blunt for generative systems. Scores allow comparison, thresholds, review queues, and gradual improvement.

Alternative one: pass/fail only. Earmark for automated CI checks.
Alternative two: prose review only. Earmark for human creative review.

## 2. Score scale

All QA scores use 0.0 to 1.0 internally.

- 0.90 to 1.00: excellent
- 0.80 to 0.89: strong
- 0.70 to 0.79: acceptable with notes
- 0.50 to 0.69: weak or needs review
- below 0.50: fail or experimental only

## 3. Required QA categories

Identity fit: does this belong to the intended visual language? Pass target: 0.80+.

Material plausibility: are material pairings coherent? Pass target: 0.70+.

Depth plausibility: do inset, raised, carved, floating, and through-cut relationships make sense? Pass target: 0.85+.

Surface coherence: do roughness, reflectance, displacement, and noise align with the material? Pass target: 0.75+.

Craft plausibility: does the process sequence make sense? Pass target: 0.75+.

Cultural confidence: are cultural claims specific, supported, and respectful? Pass target: 0.80 when cultural claims are present.

Prompt clarity: is the prompt clear, non-contradictory, and not overloaded? Pass target: 0.78+.

Code feasibility: can this be implemented with reasonable performance and fallbacks? Pass target: 0.75+.

Complexity control: normal target range is 0.45 to 0.72.

Novelty control: production target range is 0.15 to 0.35. Exploration target range is 0.35 to 0.60.

Performance: frontend effects should have fallback strategies.

Accessibility: motion and contrast must have accessible alternatives when applicable.

## 4. QA record format

Each QA record contains:

- qa_id
- entity_id
- version
- reviewer
- date
- category_scores
- pass_fail_status
- strongest_evidence
- weakest_evidence
- contradictions
- required_fixes
- optional_improvements
- approval_status

Approval statuses:

- approved
- approved_with_notes
- needs_revision
- experimental_only
- rejected
- dormant

## 5. Failure categories

- identity_drift
- material_conflict
- depth_conflict
- surface_conflict
- impossible_shadow
- prompt_overload
- code_infeasible
- cultural_overclaim
- unsupported_inference
- complexity_excess
- novelty_excess
- accessibility_risk
- performance_risk

## 6. Decision log protocol

Every major decision records:

- decision_id
- context
- chosen_path
- why_chosen
- alternative_1
- why_not_alternative_1_now
- alternative_2
- why_not_alternative_2_now
- risk
- revisit_condition
- future_use
- related_entities
- date

Rule: every major decision should preserve at least two alternatives when possible.

Reason: this lets the system compare future pathways instead of forgetting unchosen logic.

## 7. Example decision record

Context: choosing source of truth for material rendering values.

Chosen path: canonical surface profile first, renderer-specific mappings second.

Why chosen: keeps the ontology interoperable across SVG, CSS, WebGL, Figma, prompts, and future renderers.

Alternative one: SVG-first values.

Why not now: limits portability and turns feTurbulence into the source of truth.

Future use: lightweight web asset pack.

Alternative two: AI-prompt-first descriptors.

Why not now: useful for creators but too imprecise for code and QA.

Future use: prompt-only product export.

Risk: canonical profiles require compiler mappings.

Revisit condition: if the system becomes primarily SVG-export focused.

## 8. Review protocol

Review moves entities between lifecycle states.

A construct can move from draft to approved only if it has:

- stable ID
- minimum parameters
- minimum relationships
- preserve and avoid constraints
- prompt output
- code or token output
- QA record
- decision log

A construct can move to production only if:

- identity fit is 0.80+
- depth plausibility is 0.85+
- prompt clarity is 0.78+
- code feasibility is 0.75+
- no hard cultural or accessibility flags remain unresolved

## 9. Mutation QA

Every mutation compares before and after:

- identity fit
- material compatibility
- depth plausibility
- complexity
- novelty
- prompt clarity
- code feasibility

Mutation outcomes:

- accept
- reject
- earmark as dormant
- earmark as experimental
- requires human review

Rule: ambient mutation cannot overwrite approved patterns. It produces candidates only.

## 10. Publication QA

Before product export, run:

- schema completeness check
- naming consistency check
- prompt clarity check
- negative prompt check
- code feasibility check
- accessibility fallback check
- performance fallback check
- decision log completeness check
- rejected alternative archive check

Definition of done: the final artifact should be explainable from evidence, values, constraints, compiler output, QA score, and decision history.
