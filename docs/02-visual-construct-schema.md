# Document 2 — Visual Construct Schema

Status: v0.1 draft  
Depends on: Document 0 and Document 1

## 1. Purpose

The Visual Construct Schema specializes the universal entity model for anything the Visual Ontology Compiler can analyze, generate, render, compare, mutate, or publish.

A Visual Construct can be an image, material, texture, pattern, UI component, prompt, code recipe, craft process, generated variation, rejected pathway, or product export.

Chosen decision: use Visual Construct as the common operating unit.

Reason: it lets the same system handle photography, material grammar, pattern libraries, frontend design, prompts, and code without separate incompatible records.

Alternative one: Image Record as the core object. Not chosen because materials, prompts, and UI components are not always images.

Alternative two: Pattern Record as the core object. Not chosen because the system must support single materials, artifacts, and prompts as well as patterns.

## 2. Required sections

Each Visual Construct record contains:

1. Identity
2. Source
3. Evidence
4. Material
5. Surface Physics
6. Depth and Layering
7. Pattern
8. Craft and Process
9. Cultural Context
10. Constraints
11. Prompt Outputs
12. Code Outputs
13. QA Scores
14. Decision Log
15. Knowledge Graph Links
16. Transformations

## 3. Identity

Required fields:

- id
- name
- construct_type
- version
- lifecycle_state
- created_at
- updated_at
- confidence

Naming rule: names should describe construction, not only mood.

Weak name: Fancy Gold Texture.

Strong name: Flush Gold Resin Inlay on Satin Walnut.

## 4. Evidence

Evidence records what is visible, supplied, inferred, or uncertain.

Fields:

- observed_subjects
- composition_clues
- color_clues
- lighting_clues
- material_clues
- surface_clues
- texture_clues
- depth_clues
- pattern_clues
- craft_clues
- uncertainty_notes

Rule: no poetic interpretation before evidence capture.

## 5. Material

Material fields:

- material_family
- material_subtype
- variant
- hardness
- flexibility
- density
- porosity
- transparency
- reflectance
- roughness
- gloss
- aging_state
- compatible_materials
- forbidden_materials

Values use 0.0 to 1.0 where possible.

## 6. Surface physics

Surface fields:

- feature_scale
- feature_density
- amplitude
- directionality
- regularity
- scatter
- warp
- displacement_strength
- normal_strength
- roughness
- reflectance
- specular_variation
- canonical_noise_profile

Renderer-specific values are not the source of truth. The canonical surface profile is the source of truth.

## 7. Depth and layering

Depth scale:

- +6 floating
- +5 suspended
- +4 applied ornament
- +3 raised relief
- +2 embossed
- +1 surface texture
- 0 base plane
- -1 engraved
- -2 debossed
- -3 inset
- -4 carved channel
- -5 deep relief
- -6 through-cut

Depth fields:

- depth_level
- depth_confidence
- edge_profile
- shadow_type
- contact_logic
- attachment_logic
- occlusion_logic

## 8. Pattern

Pattern fields:

- pattern_family
- arrangement
- repeat_type
- symmetry
- density
- regularity
- complexity
- mutation_allowance
- compatible_patterns
- forbidden_patterns

## 9. Craft and process

Craft fields:

- process_family
- tools
- sequence
- mark_making_logic
- manufacturing_method
- evidence_confidence
- modern_translation

Process families include additive, subtractive, transformative, assemblage, print-based, textile-based, ceramic-based, metal-based, stone-based, and algorithmic.

## 10. Cultural context

Cultural context fields are optional unless a claim is made.

Fields:

- documented_context
- region_or_tradition
- historical_period
- symbolic_restrictions
- ethical_notes
- confidence

Rule: if cultural confidence is low, use process language instead of cultural attribution.

## 11. Constraints

Each construct needs:

- preserve
- avoid
- hard_constraints
- soft_constraints
- exception_rules

Hard constraints cannot be violated unless experimental mode is explicitly active.

## 12. Outputs

Prompt outputs:

- natural_language_prompt
- structured_prompt
- json_prompt
- negative_prompt
- model_notes

Code outputs:

- css_tokens
- svg_filter_strategy
- webgl_material_notes
- figma_variable_notes
- framer_motion_notes
- performance_fallbacks

## 13. QA

Minimum v0.1 QA scores:

- identity_fit: pass at 0.80+
- material_plausibility: pass at 0.70+
- depth_plausibility: pass at 0.85+
- prompt_clarity: pass at 0.78+
- code_feasibility: pass at 0.75+
- complexity: target 0.45 to 0.72
- novelty: production target 0.15 to 0.35

## 14. Decision log

Every major construct records:

- chosen_path
- why_chosen
- alternative_1
- alternative_2
- why_not_chosen_now
- revisit_condition
- risk
- future_use

## 15. Minimum viable record

A Visual Construct is not valid for approval until it has:

- stable ID
- type
- source
- at least five parameters
- at least three relationships
- positive constraints
- negative constraints
- one prompt output
- one code or token direction
- QA scores
- decision log entry
