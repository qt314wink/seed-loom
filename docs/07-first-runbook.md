# Document 7 — First Runbook

Status: v0.1 draft  
Purpose: define the first repeatable operating procedure for running VOC on a small test set.

## 1. First-run goal

The first run should prove the full VOC loop without drowning in taxonomy.

Test the loop:

Intake. Observe. Define. Constrain. Compile. Validate. Store. Mutate. Review.

## 2. Test set

Use a deliberately small set:

- five images
- three materials
- three patterns
- one UI component
- one generated variation
- one rejected or earmarked variation

Chosen decision: small test set first.

Reason: the goal is to test the operating system, not maximize coverage.

Alternative one: build a huge material encyclopedia first. Not chosen because the schema needs stress testing.

Alternative two: build the frontend app first. Not chosen because the data model and QA need to stabilize.

## 3. Intake procedure

For each item:

1. Create a stable Visual Construct ID.
2. Record source type.
3. Record source location or description.
4. Assign initial lifecycle state: draft or observed.
5. Identify whether the item is visual, textual, material, procedural, cultural, code-related, or mixed.
6. Flag whether human review is required.

## 4. Observation procedure

Capture evidence before interpretation.

Record:

- subject
- composition
- color
- light
- material clues
- surface clues
- texture clues
- depth clues
- pattern clues
- craft clues
- mood clues
- uncertainty

Rule: no poetic interpretation before evidence capture.

## 5. Canonical definition procedure

Translate evidence into ontology values.

Minimum fields:

- construct_type
- material_family if applicable
- surface profile if applicable
- depth profile if applicable
- pattern family if applicable
- craft process if supported
- constraints
- confidence

If uncertain, label as inference with confidence below 0.80 rather than fact.

## 6. Constraint procedure

Every construct needs:

- preserve list
- avoid list
- hard constraints
- soft constraints
- exception rules

Example:

Preserve: directional walnut grain, satin finish, carved channel logic.

Avoid: floating inlay, random glitter, inconsistent grain, plastic varnish.

## 7. Prompt compilation procedure

Compile prompts in this order:

1. subject or object
2. composition
3. material base
4. surface physics
5. depth relationship
6. pattern arrangement
7. craft process
8. lighting
9. mood
10. positive constraints
11. negative constraints

Required outputs:

- natural language prompt
- structured prompt notes
- negative prompt

Optional outputs:

- JSON prompt
- Midjourney variant
- Flux or SDXL variant
- GPT image variant
- video prompt variant

## 8. Code compilation procedure

Compile code direction in construction order:

1. base plane
2. material texture
3. surface noise
4. depth shadow
5. pattern mask
6. inlay or ornament
7. lighting/highlight
8. interaction state
9. motion state
10. fallback

Required outputs:

- token direction
- CSS/SVG strategy or WebGL strategy
- performance fallback
- accessibility note if motion or contrast is involved

## 9. QA procedure

Score every construct using:

- identity_fit
- material_plausibility
- depth_plausibility
- surface_coherence
- craft_plausibility
- cultural_confidence when relevant
- prompt_clarity
- code_feasibility
- complexity
- novelty

Minimum approval thresholds:

- identity_fit: 0.80+
- material_plausibility: 0.70+
- depth_plausibility: 0.85+
- prompt_clarity: 0.78+
- code_feasibility: 0.75+

## 10. Mutation procedure

Select one approved or tested construct.

Choose one mutation type:

- material_swap
- finish_swap
- depth_adjustment
- arrangement_change
- noise_scale_adjustment
- ornament_density_change
- craft_process_substitution

Generate one candidate.

Score before and after.

Then classify the candidate as:

- accepted
- rejected
- dormant
- experimental
- needs_human_review

## 11. Rejected variation procedure

Do not delete rejected variations.

Record:

- rejected path
- reason rejected
- failed QA category
- future revisit condition
- possible use mode

Example:

Rejected path: neon acrylic base with pearl inlay.

Reason: breaks current material identity and creates optical conflict.

Future use: wild-lab mode or cyber-kitsch cluster.

## 12. First-run success criteria

The first run succeeds if:

- every item receives a stable entity ID
- every item gets at least five parameters
- every item gets at least three relationships
- every item gets positive and negative constraints
- every item compiles into at least one prompt
- every item compiles into at least one code or token direction
- every item receives QA scores
- one mutation is created
- one mutation is accepted or earmarked
- one rejected pathway is logged

## 13. Output package

The first run should export:

- analyzed visual construct records
- prompt outputs
- negative prompts
- material profiles
- pattern recipes
- QA records
- decision logs
- mutation records
- next revision notes

## 14. After-action review

After the first run, answer:

1. Which schema fields were missing?
2. Which values were unclear?
3. Which QA threshold was too strict or too loose?
4. Which prompt outputs were strongest?
5. Which code mappings were feasible?
6. Which rejected variant should remain dormant for future comparison?
7. What should v0.2 add?

The next version should revise the schema only after this review.
