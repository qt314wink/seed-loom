# Document 5 — Pattern Governance Manual

Status: v0.1 draft  
Purpose: define how patterns are created, combined, mutated, scored, approved, rejected, and evolved without becoming random.

## 1. Core pattern definition

A pattern is a reusable construction recipe, not merely an image or swatch.

A pattern contains:

- name
- purpose
- ingredients
- geometry
- material rules
- surface rules
- depth rules
- motion rules
- compatible contexts
- forbidden contexts
- complexity budget
- novelty budget
- mutation rules
- QA checks
- prompt output
- code output
- lifecycle state

Chosen decision: store patterns as recipes.

Reason: recipes can be compiled, mutated, validated, and translated across prompt, token, SVG, CSS, WebGL, and UI systems.

Alternative one: store patterns as image references. Useful for visual fidelity but weak for generation.

Alternative two: store patterns as names only. Searchable but not operational.

Earmark: keep image references as evidence and examples, not as the sole pattern definition.

## 2. Pattern lifecycle states

- draft: incomplete or newly proposed
- tested: run through QA at least once
- approved: allowed for controlled use
- production: allowed for public or product export
- experimental: interesting but risky
- dormant: not active, but retained for possible later use
- rejected: failed current governance
- deprecated: replaced by a stronger pattern
- archived: retained for history only

Rule: rejected patterns are not deleted. They are retained as system memory.

## 3. Compatibility scoring

Pattern combinations use 0.0 to 1.0 scores.

Recommended pass targets:

- identity_fit: 0.80+
- material_compatibility: 0.70+
- depth_plausibility: 0.85+
- craft_plausibility: 0.75+
- prompt_clarity: 0.78+
- code_feasibility: 0.75+

Complexity target for normal use: 0.45 to 0.72.

Production novelty target: 0.15 to 0.35.

Exploration novelty target: 0.35 to 0.60.

Danger zone: novelty above 0.75 unless wild-lab mode is explicitly active.

## 4. Governance gates

Identity Gate: Does the pattern still belong to the intended visual language?

Material Gate: Are material pairings plausible and coherent?

Depth Gate: Do raised, inset, carved, floating, and through-cut elements obey the depth field?

Surface Gate: Do roughness, reflectance, displacement, noise, and finish match the material?

Craft Gate: Does the manufacturing or construction sequence make sense?

Cultural Gate: Are cultural references specific, supported, and ethically handled?

Complexity Gate: Is the result rich without becoming noisy?

Compiler Gate: Can the pattern become prompt and code without contradiction?

Performance Gate: Can the visual be implemented with reasonable frontend cost?

## 5. Mutation types

Allowed v0.1 mutation types:

- material_swap
- finish_swap
- depth_adjustment
- arrangement_change
- noise_scale_adjustment
- ornament_density_change
- color_temperature_shift
- craft_process_substitution
- prompt_variation
- code_rendering_variation

Mutation rule: every mutation must record what changed, why, what constraints applied, and whether the output was accepted, rejected, dormant, or experimental.

## 6. Ambient generation protocol

The ambient engine may generate plausible combinations in the background, but it may not overwrite approved patterns.

Ambient candidates go to review states:

- accepted_candidate
- rejected_candidate
- dormant_candidate
- experimental_candidate
- needs_human_review

Safe ambient generation budget:

- 70 percent proven pattern DNA
- 20 percent compatible neighboring cluster material
- 8 percent low-confidence but plausible mutation
- 2 percent true exploration

Chosen decision: constrained mutation instead of random remixing.

Reason: this preserves identity while allowing emergence.

Alternative one: fully locked presets. Stable but sterile.

Alternative two: fully random generation. Energetic but incoherent.

Earmark: wild-lab mode can explore high-risk variants outside production.

## 7. Pattern recipe template

Minimum pattern record:

- id
- name
- pattern_family
- purpose
- ingredients
- geometry
- material_rules
- surface_rules
- depth_rules
- compatible_with
- conflicts_with
- preserve_constraints
- avoid_constraints
- allowed_mutations
- forbidden_mutations
- complexity_range
- novelty_range
- prompt_template
- code_mapping
- qa_thresholds
- lifecycle_state
- decision_log

## 8. Example pattern

Name: Flush Pearl Inlay on Satin Walnut

Purpose: refined tactile ornament that combines warm wood, carved depth, and subtle optical shimmer.

Ingredients:

- satin rift-sawn walnut base
- carved channels
- mother-of-pearl fragments
- clear resin fill
- optional brushed brass pin accents

Depth:

- walnut base: 0
- carved channel: -4
- pearl fragments: -3 to -0.2
- resin fill: flush to 0
- clearcoat: +0.1

Allowed mutations:

- pearl to opalescent resin
- brass to oxidized brass
- radial arrangement to asymmetrical marquetry
- gloss reduced from high to satin

Forbidden mutations:

- floating inlay without attachment logic
- random glitter density above approved threshold
- neon acrylic base in production mode
- inconsistent grain direction unless burl variant is specified

QA targets:

- material_compatibility: 0.80+
- depth_plausibility: 0.90+
- complexity: 0.50 to 0.70
- novelty: 0.15 to 0.35 for production

## 9. Alternative pathway log

Every rejected or unchosen pattern should log:

- rejected_path
- reason_rejected
- score_failure
- future_revisit_condition
- possible_use_mode

Example:

Rejected path: neon acrylic base with pearl inlay.

Reason: breaks current material identity and introduces plastic gloss conflict.

Possible future use: wild-lab mode, cyber-kitsch cluster, or acrylic-specific product pack.

Do not delete this record.
