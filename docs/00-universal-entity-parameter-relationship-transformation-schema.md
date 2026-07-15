# Document 0 — Universal Entity, Parameter, Relationship, and Transformation Schema

Status: v0.1 draft  
System: Visual Ontology Compiler  
Purpose: define the common substrate used by all VOC documents, schemas, compilers, QA gates, graph records, and generative mutations.

## 1. Operating claim

Everything the system can name, analyze, generate, transform, score, compare, compile, reject, or publish is an entity.

Every entity carries parameters. Parameters carry values. Entities connect through typed relationships. Transformations change entities into new states or outputs. QA carries trust. Decision logs carry memory.

Chosen decision: use one universal entity model across images, materials, prompts, code, patterns, cultural processes, UI components, and rejected variations.

Defensible logic: one interoperable substrate prevents schema fragmentation and allows the same object to move from visual evidence to prompt, token, code, graph node, and product export.

Alternatives considered:

1. Separate schemas by medium. This is easier at first but creates brittle translation boundaries.
2. Tag-only taxonomy. This is searchable but weak for values, transformations, QA, and compiler logic.

Earmark: keep medium-specific extensions later, but only as specializations of this shared model.

## 2. Universal Entity

A Universal Entity is anything the system can name, analyze, generate, transform, score, connect, or store.

Core entity types:

- Visual Construct
- Image
- Material
- Surface Profile
- Pattern
- Texture
- Craft Process
- Cultural Reference
- Prompt
- Negative Prompt
- Design Token
- UI Component
- Shader
- SVG Filter
- CSS Recipe
- Code Module
- QA Rule
- Decision Record
- Mutation Candidate
- Cluster
- Product Export

Required entity fields:

- id: stable machine-readable identifier
- name: human-readable construction-aware name
- type: controlled entity type
- version: semantic or document version
- lifecycle_state: draft, observed, defined, tested, approved, production, experimental, dormant, rejected, deprecated, or archived
- source: origin of the entity
- confidence: 0.0 to 1.0
- evidence: support for the entity or inference
- constraints: positive and negative rules
- relationships: typed graph edges
- transformations: operations applied over time
- qa: validation scores and notes
- decision_log: chosen path, alternatives, risks, revisit conditions

Rule: rejected does not mean deleted. Rejected means retained as knowledge but not valid for current production use.

## 3. Universal Parameter

A Parameter is a measurable or descriptive property attached to an entity.

Required parameter fields:

- name
- definition
- value
- scale_or_unit
- allowed_range
- default_value
- confidence
- evidence
- source
- override_rule
- compiler_mappings
- qa_rule

Internal scoring uses 0.0 to 1.0. Human-facing summaries may convert values into low, medium, high, or 0 to 100.

Chosen decision: use 0.0 to 1.0 internally.

Defensible logic: this is compact, interoperable, and works for confidence, roughness, reflectance, compatibility, novelty, complexity, material plausibility, and identity fit.

Alternatives considered:

1. Low, medium, high. More listenable, but too coarse for automation.
2. 0 to 100 everywhere. Friendly, but less standard for compiler math.

Earmark: reports and dashboards can display both numeric and human-readable values.

## 4. Parameter families

Primary families:

- identity
- material
- surface_physics
- depth
- pattern
- craft_process
- cultural_provenance
- prompt
- code_rendering
- qa
- governance
- evolution

Surface physics parameters include feature_scale, feature_density, amplitude, directionality, regularity, scatter, warp, octaves, displacement_strength, normal_strength, roughness, reflectance, and specular_variation.

Depth parameters include depth_level, inset_amount, relief_height, edge_profile, shadow_type, contact_logic, occlusion_logic, and attachment_logic.

QA parameters include identity_fit, material_plausibility, depth_plausibility, prompt_clarity, code_feasibility, cultural_confidence, complexity_score, and novelty_score.

## 5. Universal Relationship

A Relationship is a typed connection between two entities.

Required relationship fields:

- source_entity_id
- target_entity_id
- relationship_type
- direction
- strength: 0.0 to 1.0
- confidence: 0.0 to 1.0
- evidence
- constraint_effect
- compiler_effect
- qa_effect

Core relationship types:

- is_a
- part_of
- made_of
- uses_material
- has_surface
- has_depth
- arranged_as
- derived_from
- inspired_by
- compiled_to
- compatible_with
- conflicts_with
- avoids
- requires
- overrides
- mutates_from
- alternative_to
- rejected_because
- approved_for
- belongs_to_cluster
- implements
- validated_by

Chosen decision: relationships are typed, scored, and evidenced.

Defensible logic: typed relationships let the graph reason about compatibility, conflict, provenance, and compilation rather than merely storing notes.

Alternative considered: plain-language cross-links. Useful for reading, but weak for automation.

## 6. Universal Transformation

A Transformation is any operation that changes an entity, creates an output, or moves an entity through review.

Transformation types:

- ingest
- normalize
- observe
- classify
- parameterize
- constrain
- compile_prompt
- compile_code
- validate
- mutate
- cluster
- compare
- approve
- reject
- publish

Required transformation fields:

- input_entity_ids
- output_entity_ids
- operation_type
- parameters_changed
- reason
- constraints_applied
- qa_score_before
- qa_score_after
- alternatives_considered
- failure_risks
- reviewer_status
- timestamp

Rule: transformations must preserve reasoning. The system stores the path, not only the result.

## 7. Minimum intelligence standard

Every entity must answer:

1. What is it?
2. What values define it?
3. What is it related to?
4. What can it become?
5. What must it avoid?
6. How do we know?

If any of these are missing, the entity remains draft or observed, not approved.

## 8. Integration role

This document governs all later VOC documents:

- Master System Brief explains the mission.
- Visual Construct Schema specializes this entity model.
- Ontology Registry controls vocabulary.
- Material Genome defines material and surface parameters.
- Pattern Governance defines mutation and compatibility.
- QA Protocol defines validation and trust.
- First Runbook defines repeatable execution.

Guiding phrase: stable ontology, flexible compilers, governed emergence.
