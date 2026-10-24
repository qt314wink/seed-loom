# Mechanism Isolation Protocol — Visual Mechanism Compiler v0

Status: **candidate contract for implementation on draft PR #64**

This protocol tightens the Visual Mechanism Compiler so that interpretation cannot silently substitute for observation. It defines the smallest admissible evidence unit, the distinction between phenomenon/pattern/mechanism/operation/process/quality/weight/effect/function/capability, and the gates required before a mechanism claim can be promoted.

## Non-negotiable rule

Every abstract claim MUST reduce to one or more observable state changes.

Every mechanism claim MUST state:

1. what entity/property changed;
2. initial, transition, and final state;
3. the bounded operation applied;
4. temporal/spatial relation;
5. candidate causal structure;
6. competing mechanism(s);
7. confounders;
8. qualities and typed weights;
9. the observed consequence;
10. evidence/interpretation references;
11. confidence and evidence status.

Unknown values MUST remain `unknown`, `estimated`, `ordinal`, `not-applicable`, or `not-observable-from-source`. Do not invent precision.

## Object classes

- **Phenomenon** — one observable occurrence or state transition. Answers: *what happened?*
- **Pattern** — recurring structure across phenomena. Answers: *what repeatedly happens?*
- **Quality** — measurable or perceptually coded characteristic of a state. Answers: *what is it like, along which dimension?*
- **Mechanism** — candidate causal/generative structure that could produce a phenomenon. Answers: *how could this happen?*
- **Operation** — one bounded transformation applied to an input. Answers: *what transformation occurred?*
- **Process** — ordered or iterative sequence of operations. Answers: *how does transformation unfold?*
- **Parameter** — controllable variable affecting behavior.
- **Weight** — typed magnitude of contribution, salience, evidence, confidence, recurrence, dependency, affect, or novelty.
- **Constraint** — boundary restricting allowable behavior.
- **Condition** — state required for activation.
- **Effect** — detectable consequence following an operation.
- **Function** — role the behavior performs within the whole.
- **Capability** — generalized behavior that can later be reproduced intentionally.

These classes MUST NOT be merged into one free-text description field.

## Mechanism Observation Unit (MOU)

The MOU is the smallest valid analysis unit. No Pattern, Mechanism, Process, Function, Principle, or Capability may be promoted without at least one supporting MOU.

Required conceptual fields:

```text
source / locator
entity
property
initial state
transition
final state
temporal relation
trigger / condition
operation
observed effect
pattern membership
candidate mechanism(s)
alternative mechanism(s)
confounders
quality vector
typed weights
evidence refs
interpretation refs
confidence
epistemic status
```

Canonical hierarchy:

```text
FRAME / INTERVAL
  -> MOU
  -> PHENOMENON
  -> PATTERN
  -> MECHANISM
  -> PROCESS
  -> FUNCTION
  -> PRINCIPLE
  -> CAPABILITY
  -> SYSTEM
```

Every upward node MUST retain backlinks to its supporting lower-order records.

## Observation decomposition

Bad:

> The garment becomes expressive.

Admissible:

```text
entity: garment hem
property: lateral displacement
initial: within body silhouette
transition: expands during rotational gesture
final: extends beyond anatomical silhouette
temporal relation: body rotation begins before distal fabric displacement
observed consequence: silhouette radius increases
confidence: bounded by source visibility
```

The statement *fashion expands identity* is therefore interpretation, not observation.

## Mechanism isolation

A mechanism candidate is not accepted because it sounds plausible.

For each target effect, generate competing candidates where reasonable.

Example:

```text
target effect: expanded apparent bodily presence

H1 temporal lag
H2 spatial extension
H3 camera divergence
H4 musical accent
H5 interaction of H1 + H2 + H3
```

Isolation questions should test whether the effect remains when a candidate contributor is absent, constant, weak, or contradicted.

A mechanism record MUST declare:

- supporting evidence;
- contradictory evidence, if any;
- missing discriminator(s);
- confounders;
- activation conditions;
- suppressing conditions;
- whether evidence is observational, derived, synthetic-fixture, or experimentally isolated.

Do not use `verified` to mean “plausible.” Reserve verification for a stated test.

## Operation vocabulary

Prefer stable operation verbs over aesthetic prose.

### Spatial
`expand`, `contract`, `translate`, `rotate`, `fold`, `unfold`, `wrap`, `occlude`, `reveal`, `penetrate`, `separate`, `merge`, `orbit`, `disperse`, `concentrate`

### Temporal
`delay`, `anticipate`, `repeat`, `accelerate`, `decelerate`, `freeze`, `persist`, `decay`, `reverse`, `loop`, `interrupt`, `phase_shift`

### Relational
`attract`, `repel`, `follow`, `lead`, `mirror`, `oppose`, `synchronize`, `desynchronize`, `inherit`, `transfer`, `propagate`, `amplify`, `attenuate`

### Semantic
`associate`, `substitute`, `invert`, `translate`, `metabolize`, `preserve`, `erase`, `recontextualize`

### Ontological
`anthropomorphize`, `disembody`, `materialize`, `dematerialize`, `distribute_agency`, `centralize_agency`, `transfer_agency`

An implementation may extend the catalog only through an explicit contract change and fixture.

## Process semantics

A Process is an ordered collection of operations, not another name for a mechanism.

Example:

```text
1 body.rotate
2 garment.delay
3 garment.expand
4 camera.hold_center
5 garment.persist_after_body_deceleration
6 viewer perceives residual motion
```

This allows individual steps to be varied and compared rather than hiding the sequence inside prose.

## Quality vectors

Aesthetic adjectives MUST be decomposable into dimensions whenever possible.

Example `fluidity` candidate dimensions:

- trajectory curvature;
- velocity continuity;
- acceleration smoothness;
- shape continuity;
- temporal overlap;
- direction-change frequency;
- interruption rate.

A quality vector MUST identify:

- dimension;
- value or ordinal class;
- scale;
- method;
- applicability;
- confidence.

A quality label alone is not sufficient evidence.

## Typed weights

Do not create one generic `weight`.

Use distinct fields:

- `contribution` — estimated contribution to the target effect;
- `salience` — perceptual dominance;
- `evidence` — strength of supporting evidence;
- `confidence` — confidence in the assignment;
- `recurrence` — frequency/opportunity ratio or bounded estimate;
- `dependency` — downstream dependence on this component;
- `affective` — modeled affective contribution;
- `novelty` — uncommonness relative to the current corpus.

These values are not interchangeable.

## Mechanism interactions

Mechanisms may interact. Supported interaction classes:

`additive`
`multiplicative`
`gated`
`competitive`
`inhibitory`
`thresholded`
`saturating`
`recursive`
`cascading`

Do not assume linear addition.

## Graph layers

Keep these as separate linked layers:

1. **Causal/formal graph** — entity/property transformations and operation dependencies.
2. **Perceptual graph** — observed formal change -> perceptual consequence.
3. **Affective graph** — perceptual consequence -> modeled feeling candidates.
4. **Semantic graph** — feeling/perception -> interpretation or conceptual reading.
5. **Capability graph** — supported principle -> executable/generative behavior.

Edges MUST declare layer, relation type, source refs, confidence, and status.

Never encode a semantic interpretation as a causal edge without evidence for that causal relationship.

## Feeling nodes

Feeling is a first-class modeled response, not an objective property.

A feeling candidate SHOULD record:

- label;
- valence/arousal if relevant;
- formal contributors;
- contributor weights;
- alternative feelings;
- interpretation confidence;
- population/context limitation when known.

Example: `unease` may be supported by prediction violation + form instability + temporal lag; it must not be stored as a directly observed property of the artifact.

## Unity operator

“Unity” MUST return a generative model, not a philosophical slogan.

Bad:

> body and garment are one.

Admissible:

> body and garment are coupled outputs of a shared momentum-transfer process with different response lag and constraints.

Unity results must name the shared variable/process and show how each apparent pole is generated from it.

## Pattern admission

A Pattern record MUST specify, when applicable:

- occurrence count;
- opportunity count;
- frequency;
- interval;
- trigger;
- variance;
- persistence;
- scope;
- scale;
- exceptions.

Do not promote “repeated” without a recurrence structure.

## Promotion gates

### MOU -> Phenomenon
PASS when state change and locator are explicit.

### Phenomenon -> Pattern
PASS when recurrence criteria and exceptions are recorded.

### Pattern -> Mechanism Candidate
PASS when at least one plausible generative explanation is linked and alternatives/confounders are represented.

### Mechanism Candidate -> Supported Mechanism
PASS only after the declared discriminator/test succeeds. “Supported” is still not “canonical.”

### Mechanism -> Function
PASS when the downstream perceptual/system effect is evidenced.

### Function -> Capability
PASS when the function can be restated as a medium-independent operation/process with constraints.

### Capability -> downstream Shader Grammar / motion / interface integration
DEFER in PR #64. Emit an adapter requirement only.

## Required failure tests

The implementation slice MUST reject or fail closed on at least:

1. mechanism with no supporting evidence refs;
2. semantic claim inserted as an observation;
3. unresolved evidence or interpretation ref;
4. generic untyped `weight` field;
5. pattern with no recurrence evidence;
6. `supported` mechanism with no discriminator/test receipt;
7. quality label with no dimension/value representation when a dimensioned form is required by the fixture;
8. process whose operations are unordered;
9. capability with no path back to a mechanism;
10. graph edge crossing causal -> semantic layers without an explicit translation relation.

## Determinism

The same normalized fixture, ontology version, and mapping rules MUST emit byte-equivalent normalized MOU/mechanism output across two clean runs.

Volatile fields must be explicitly excluded from the normalized digest.

If semantic outputs differ, treat it as a determinism failure.

## PR #64 implementation boundary

This protocol extends the current Visual Mechanism Compiler scaffold only.

IN SCOPE:
- candidate MOU contract;
- operation/process vocabulary;
- typed weights;
- quality vector;
- confounder/alternative representation;
- mechanism isolation tests;
- layered graph representation in data;
- deterministic fixture + receipt;
- case-study evidence update.

OUT OF SCOPE:
- renderer;
- GLSL/WGSL generation;
- Shader Grammar mutation;
- WebGL/R3F UI;
- Unity engine work;
- Vercel deployment;
- external-model inference for the gold fixture;
- database/vector search;
- broad analyzer-core refactor.

## Final acceptance principle

**No concept without a mechanism path. No mechanism without observable support. No feeling without proposed formal contributors. No capability without an explicit operation/process. No dissertation or case-study upgrade without a traceable evidence chain.**
