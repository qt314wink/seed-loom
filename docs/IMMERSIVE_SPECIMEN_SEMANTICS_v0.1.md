# Immersive specimen semantic contract — cross-domain seed v0.1

**Status:** proposed companion specification; retains `docs/03-ontology-registry.md`, `docs/04-material-genome-and-surface-physics-spec.md`, and the Epistemic Engine repository boundary. Does **not** rewrite canonical vocabularies or grant mutation authority.

## Scope and primary use cases
This contract describes **what a scene entity means**, not how a particular renderer simulates it. A specimen may be inspected in shader lookdev, a dual-mode portfolio, a garment/fabric viewer, an architectural experience, or an event-driven narrative. One stable entity ID connects multiple domain-specific projections.

## Semantic record
Required proposal-level domains: identity and use case; material family / physical assembly; surface morphology / finish; optical mechanism references; sound-domain unknowns or independently measured acoustic coefficients; scene entities and spatial annotations; events and state invariants; motion authority reference; candidate performance budget reference; provenance, uncertainty, alternatives, temporal validity and decision gates.

Proposed example `examples/immersive-specimen.seed.json` uses an **illustrative coated-metal panel**. Its numerical display values are artistic seeds, **not measured physics**.

### Ownership and dependency map
- Seed Loom: semantic identity, material genome, hypotheses, alternatives, contradiction preservation, freshness, quality and provenance.
- Shader Grammar: spectral optical operators, typed physics parameters, approved recipe semantics and shader receipts. Consume `catalog/operators.json`; do not fork.
- Design Standards 2026–2027: semantic UI motion, visual presentation, scene interaction and performance targets.
- MelodicBloom/.github: cross-repository policy, review/evidence handling, permissions and adoption. No automatic replication.
- Product renderer / spatial acoustic tool: executable projection and domain-specific measurement, **not** authority over the semantic record.
- Runtime control center: bounded execution, queues and permission enforcement. Seed Loom contains no scheduler or GitHub write tool.

### Optical versus acoustic safety
Color, roughness and gloss values do not determine sound absorption or transmission. A reflective coated panel can be a visual test even when its absorption bands are unknown. Preserve frequency-band coefficients and measurement methods as independent records; mark `unknown` if missing. An immersive audio demonstration is not an acoustic certification.

### Scene and temporal semantics
Stable scene object and named camera/light IDs make state portable between 2D and 3D. Distinguish `physical_state` (geometry/material), `presentation_state` (camera, selection, caption), `timeline_state` (cues and playhead), and `measurement_state` (evidence). Event transitions must not silently rewrite material identity. Pausing ambient motion must not remove information or controls.

### Epistemic and temporal lifecycle
Attach input/source identity, observed time, confidence interpretation, alternatives and counterevidence. New evidence may confirm, contradict, supersede or invalidate a hypothesis. If past its review horizon, degrade **decision authority**, not source availability: retain provenance, surface uncertainty, and allow old hypotheses only as clearly labeled ideation compost. No silent revalidation or auto-promotion.

### Testable invariants
1. One semantic ID remains stable across view modes, renderer implementations, snapshots and export.
2. Distinct optical/acoustic/visual/motion budgets cannot be conflated.
3. Each non-obvious numeric value declares illustrative, inferred or measured status and units.
4. Historical sources are not presented as 2026 implementation measurements.
5. Accessibility mode offers the same source, parameter and explanation access without 3D navigation.
6. Every decision has alternatives, evidence, possible failure, proposed owner and a review boundary.
7. Records remain additive until a separately approved schema/version migration.

## Source and decision log
- Karis 2013: GGX/material layering; optical historical evidence, not acoustic facts.
- Stanton et al. 2017: promising dual-mode information navigation pilot (n=11), not a universal UX guarantee.
- Yeow et al. 2020: UE/Steam Audio architectural qualitative walkthrough and acknowledged physical-accuracy gaps.
- Winchester et al. 2025: timed virtual production scenes and real-world camera/optimization limitations.
- This document: **proposed integration contract**, to be independently validated against existing Seed Loom schemas before adoption.

## Acceptance and stop rules
This PR seeds a proposal; it does **not** add database migrations, new agents, automation schedules, external pipelines or approved terminology. Review for collisions with material-genome fields and `docs/epistemic-engine/09-repository-boundary.md`. If collision exists, pause and record alternatives rather than changing old records in-place.
