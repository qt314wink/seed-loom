# ASG Parts I–II Ingestion Contract

This document defines the first bounded corpus ingestion for Paul Roquet's *Atmosphere as Culture: Ambient Media and Postindustrial Japan*.

The goal is not chapter summarization. The goal is to create provenance-preserving evidence records and propagate one resident Atmospheric Systems Grammar from Part I through Part II.

## Corpus coordinates

Primary source:

- Paul Roquet, *Atmosphere as Culture: Ambient Media and Postindustrial Japan* (UC Berkeley dissertation, 2012)
- Part I: **Mood Musics** — Chapters 1–3
- Part II: **Panoramic Interiors** — Chapters 4–5

The dissertation table of contents places Part I at printed pages 19–54 and Part II beginning at printed page 55. The ingest bundle stores both printed-page labels and PDF-page indices when they can be resolved reliably.

## Upstream extraction responsibility

The ASG ingest command does not read a PDF and invent canonical records.

An upstream research/extraction pass must produce a bounded bundle containing source-backed observations and proposed ASG operations. This separation is deliberate: interpretation is reviewable before persistence.

Upstream may use manual reading, structured extraction, or an LLM-assisted pass, but the bundle must say which method produced each observation.

## Part I objective: bootstrap

Part I establishes candidate canonical identities and first definitions.

### Genealogy to preserve

```text
background music
    -> music as environmental instrument
    -> background as agency problem
    -> avant-garde environmentalization
    -> Satie / furniture music
    -> spatialized, non-teleological time
    -> Eno / ignorable + interesting
    -> portable/private ambient mediation
```

### Primary Part I concepts

```text
background
foreground
attention
furnishing
environmentalization
horizon
ignorable
interesting
figure_field
uncertainty
agency
```

### Primary Part I derived variables/operators

```text
attention_elasticity
attention_capture
attention_exit_cost
attention_reentry_cost
background_persistence
missed_state_penalty
horizon_distance
horizon_clarity
horizon_porosity
horizon_continuity
figure_centrality
temporality_teleology
temporality_sequence_dependency
affect_contract_strength
affect_prescription
agency_modulation

attentional_demand_reduction
latent_depth_retention
figure_dissolution
horizon_extension
temporal_deteleologization
environmental_coupling
affective_bounding
perceptual_rebasing
```

These names are candidates, not automatic accepted ontology. Part I ingestion may propose Genesis records; acceptance remains governed.

## Part II objective: propagate

Part II must begin by compiling the resident Part I state.

The central question for every Part II observation is:

> Does this strengthen, mutate, limit, oppose, or exceed an existing node?

### Required pressure tests

#### Horizon

Questions:

- Does acoustic horizon become panoramic/visual horizon?
- Is `extent` best represented as a new horizon dimension or a separate node?
- Does cosmic scale in Chapter 5 EXTEND horizon or require another construct?

Default bias: reuse `asg:node:horizon` unless evidence shows irreducible difference.

#### Figure / field

Questions:

- Does Part II reinforce figure dissolution?
- Does panoramic organization change what counts as a figure?
- Does the observer become a mobile component of the field?

Likely operations: REFINE and EXTEND.

#### Depth

Part I already implies distributed fields and blurred distal activity. Part II must decide whether visual/spatial depth is:

- a dimension of figure/field
- a dimension of horizon
- or an irreducible node

Genesis is permitted only after this comparison.

#### Landscape

Landscape should not automatically become a new ontology root because Part I already uses Eno's landscape model. Part II should first test whether it:

- EXTENDS environmentalization into visual/spatial media
- REFINES horizon
- REFINES figure/field

#### Subject dispersion

Part II may require an explicit node if the source describes a subject distributed across or constituted through the panoramic environment in ways not representable by attention, figure/field, or environmentalization.

If created, the event must explain exactly why existing constructs are insufficient.

#### Panoramic perception

Treat first as a possible mechanism rather than automatically a concept. Candidate mechanism definition:

> perceptual organization in which the field is apprehended through distributed or mobile orientation rather than a single fixed figural center.

#### Interior / exterior boundary

Test whether this is best represented as:

- horizon porosity
- environmental coupling
- boundary permeability
- or a new canonical variable

Again, Genesis is last resort.

## Source-backed observation shape

Each observation used by ASG should be compatible with the Seed Loom observation model and add ASG-specific location metadata in the input bundle before normalization.

Conceptual input shape:

```yaml
id: obs:asg:roquet:p2:c4:panorama-001
claim: >-
  The chapter treats panoramic space as a reorganization of the relation between observer and environment.
verifiedFacts:
  - The discussion occurs in Part II, Chapter 4.
inference:
  - This may refine the existing figure/field model.
significance: >-
  Tests whether Part I's acoustic field grammar generalizes to visual/spatial organization.
confidence: 0.90
evidenceMaturity: source-backed
approvalState: candidate
sourceRefs:
  - source:roquet:atmosphere-as-culture:2012
asgLocator:
  part: 2
  chapterNumber: 4
  chapterTitle: On the Pliocene Coast
  printedPageStart: 55
  pdfPageIndexStart: 62
  sourceClaimType: close_paraphrase
  extractionMethod: reviewed-reading
```

The exact persistence adapter will map ASG locator data into the domain bundle without changing the repository-wide Observation schema in the first slice.

## Propagation candidate shape

```yaml
id: asg:prop:roquet:p2:c4:horizon:refine:001
nodeRef: asg:node:horizon
operation: REFINE
sourceObservationRefs:
  - obs:asg:roquet:p2:c4:panorama-001
epistemicStatus: derived_inference
evidenceRole: source_basis
confidence: 0.86
delta:
  dimensionsAdded:
    - visual_extent
    - mobile_viewpoint
  relationshipsAdded:
    - figure_field
  constraintsAdded: []
rationale: >-
  Part II does not replace acoustic horizon; it generalizes the field-limit relation across visual and spatial media.
```

## External literature bridge

External studies are stored separately from Roquet source claims.

Initial research suggests a useful bridge around:

- selective and involuntary attention to environmental sound
- foreground/background distinctions in soundscape appraisal
- restorative-environment constructs such as fascination, compatibility, and extent
- audiovisual interaction

These studies are used to propose **measurement candidates**, not to assert that the ASG construct is already validated.

External evidence record role example:

```yaml
nodeRef: asg:node:attention-elasticity
doi: 10.1121/1.4708755
evidenceRole: measurement_reference
supportsClaim: >-
  Attention state materially changes soundscape perception, suggesting an empirical bridge for future attention-state instrumentation.
limits:
  - The paper does not validate the ASG attention-elasticity construct.
  - Soundscape findings do not automatically transfer to interface motion or lighting.
```

## Ingest phases

The implementation will expose explicit phases rather than one opaque command.

```text
1. validate-bundle
2. normalize
3. resolve-identities
4. classify-propagations
5. validate-lineage
6. dry-run
7. persist-canonical-records
8. compile
9. render-projections
10. emit-receipt
```

### Phase 1 — validate bundle

Reject malformed IDs, missing evidence roles, missing epistemic status, invalid confidence, and unresolved source references.

### Phase 2 — normalize

Canonicalize aliases, semantic-set ordering, page coordinates, and ID slugs.

### Phase 3 — resolve identities

Load existing ASG nodes. Resolve aliases to canonical IDs. Never auto-create a node during identity lookup.

### Phase 4 — classify propagations

Validate requested operation against current state. The script validates classification consistency; it does not invent the classification from raw prose in this slice.

### Phase 5 — validate lineage

Ensure a referenced node exists at the correct point in history and Genesis is non-duplicative.

### Phase 6 — dry run

Print semantic digest, planned canonical files, projected node counts, propagation counts, and generated projection paths without writes.

### Phase 7 — persist

Write immutable domain records. Roll back partial writes on error.

### Phase 8 — compile

Rebuild node state from ordered propagation events.

### Phase 9 — render

Generate JSON/CSV/Markdown projections.

### Phase 10 — receipt

Emit written-file hashes plus a semantic digest that excludes volatile receipt time.

## Part I success criteria

A Part I fixture succeeds when:

- it registers or references one Roquet source record
- observations are source-backed and location-addressable
- each proposed node has a Genesis event
- every derived operator is marked `derived_inference` or `speculative_transfer` as appropriate
- no accepted-knowledge transition is implied by ingestion alone
- two clean compiles produce identical semantic digests

## Part II success criteria

A Part II fixture succeeds when:

- Part I registry is loaded first
- most evidence attaches through EXTEND / REFINE / CONSTRAIN / COUNTER rather than duplicate Genesis
- every Genesis candidate contains an irreducibility rationale
- horizon, figure/field, depth, landscape, subject dispersion, panoramic perception, and interior/exterior boundary are explicitly dispositioned
- the generated propagation matrix shows before state, operation, delta, after state, evidence, and confidence
- the human report and machine registry agree on touched-node and propagation counts

## Failure classifications

```text
ASG_SCHEMA_INVALID
ASG_SOURCE_UNRESOLVED
ASG_NODE_UNRESOLVED
ASG_DUPLICATE_GENESIS
ASG_INVALID_PROPAGATION_ORDER
ASG_DUPLICATE_PROPAGATION
ASG_EPISTEMIC_STATUS_MISSING
ASG_EVIDENCE_ROLE_MISSING
ASG_PART_DEPENDENCY_MISSING
ASG_NONDETERMINISTIC_OUTPUT
ASG_PROJECTION_DRIFT
```

Errors should include the failing record ID and actionable location.

## Human review output for Part II

The Part II report must answer, at minimum:

1. Which Part I nodes were reinforced?
2. Which were refined?
3. Which gained new constraints?
4. Which were countered?
5. Which genuinely new nodes are proposed?
6. Why can each Genesis candidate not be represented by an existing node?
7. What design variables become more precise?
8. What new effects/failure modes become visible?
9. Which claims are source-explicit versus derived transfer?
10. Which constructs now have plausible empirical measurement bridges?

That report is the human-legible twin of the machine registry, not a separate interpretation stream.
