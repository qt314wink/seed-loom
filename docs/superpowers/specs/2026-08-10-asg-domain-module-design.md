# Atmospheric Systems Grammar (ASG) Domain Module + Compiler — Design

Date: 2026-08-10
Status: design approved; written-spec review required before implementation
Repository: `qt314wink/seed-loom`
Branch: `feat/asg-domain-module`

## 1. Product shape

ASG is a **Seed Loom domain module + compiler**, not a second orchestration engine.

It adds a bounded atmospheric-design knowledge model that can ingest source-grounded claims, propagate concepts across a corpus, compile a current grammar, and later support analysis, specification, comparison, prediction, and explanation.

Seed Loom remains responsible for the larger evidence/governance substrate: source registration, observation provenance, approval boundaries, canonical Git history, deterministic controls, and receipts. ASG owns only atmospheric-domain semantics and derived projections.

### Intended product capabilities

1. **Analyze an existing experience** into a structured atmospheric profile.
2. **Generate a bounded atmosphere specification** with explicit target state, attention contract, temporal model, figure/field behavior, horizon behavior, agency rules, and governance constraints.
3. **Compare two implementations** by shared variables and explain material deltas.
4. **Predict likely effects and failure modes** with confidence and evidence-role labels.
5. **Explain why a design decision belongs** by reconstructing its source lineage, derivation, propagation history, operator, and constraints.

The first implementation slice is narrower: **Parts I–II source ingestion, canonical identity, propagation, compiler output, documentation, and verification**.

## 2. Why this shape

### Recommended: Seed Loom ASG Domain Module + Compiler

Chosen because the repository already has a knowledge pipeline, JSON Schema validation, deterministic controls, source/observation/relationship records, and a living-evidence-ledger purpose. ASG therefore extends domain semantics instead of duplicating infrastructure.

### Rejected alternative A: standalone Atmospheric Systems Observatory

Useful for rapid visualization and interactive exploration, but it would duplicate source truth, governance, and persistence too early. It can be built later as a disposable projection over compiled ASG data.

### Rejected alternative B: graph-first knowledge service

Strong for intersections and path queries, but premature as the canonical layer. Graph databases should be projections because graph edge shape will evolve as the grammar matures. Git-versioned records remain the authoritative reconstruction surface.

## 3. Architectural boundary

```text
Roquet / other sources
        |
        v
Seed Loom Source + Observation records
        |
        v
ASG ingest adapter
  - validates domain bundle
  - resolves canonical node identity
  - classifies epistemic status
  - classifies propagation operation
        |
        v
ASG append-only domain records
  - node identities
  - propagation events
  - domain evidence links
        |
        v
ASG compiler
  - rebuilds current grammar state
  - detects invalid propagation
  - emits deterministic projections
        |
        +-------------------+
        |                   |
        v                   v
machine projections     human projections
registry.json           part reports
comparison.json         lineage reports
CSV/spreadsheet export  decision explanations
```

### ASG owns

- atmospheric node taxonomy
- canonical ASG identifiers
- propagation semantics
- domain-specific evidence roles
- current-state grammar compilation
- atmosphere specification contract
- comparison/evaluation contract
- machine and human projections

### ASG does not own

- source independence rules
- repository-wide approval policy
- generic ResearchRun orchestration
- global source truth
- full-text archival of copyrighted source material
- a graph database
- a spreadsheet as canonical state
- automatic empirical validation

## 4. Data residency

### Canonical / authoritative

Git-versioned JSON under `knowledge/**`.

Seed Loom canonical records stay in their existing locations:

```text
knowledge/sources/
knowledge/observations/
knowledge/relationships/
knowledge/runs/
knowledge/receipts/
```

ASG-specific authoritative records live under:

```text
knowledge/asg/nodes/
knowledge/asg/propagations/
knowledge/asg/evidence-links/
knowledge/asg/runs/
```

### Generated / disposable

```text
knowledge/asg/projections/current-registry.json
knowledge/asg/projections/lineage.json
knowledge/asg/projections/part-matrix.json
knowledge/asg/projections/part-matrix.csv
knowledge/asg/projections/human/*.md
```

These can always be rebuilt from canonical records and are never manually edited.

### Future optional projections

- graph database / graph JSON
- DuckDB / Parquet
- spreadsheet review matrices
- dashboards
- interactive knowledge explorer

The rule is: **projection may be deleted without loss of knowledge**.

## 5. Domain record model

ASG uses two primary domain record classes instead of proliferating a schema per concept type.

### 5.1 `ASGNode`

An immutable identity record for a grammar entity.

Kinds:

```text
concept
mechanism
variable
operator
effect
failure_mode
specification_pattern
```

Identity fields do not carry an evolving definition. Definitions are compiled from propagation history so the canonical identity record can remain immutable.

Minimum shape:

```yaml
schemaVersion: 0.1.0
id: asg:node:horizon
type: ASGNode
kind: concept
label: Horizon
aliases: [acoustic horizon, perceptual horizon]
createdByRun: asg:run:roquet:p1-bootstrap
```

### 5.2 `ASGPropagation`

An immutable event describing how source-grounded evidence changes the current state of one ASG node.

Operations:

```text
GENESIS
EXTEND
REFINE
CONSTRAIN
COUNTER
```

Semantics:

- `GENESIS` — creates a new canonical node identity because existing nodes cannot represent the phenomenon without distortion.
- `EXTEND` — adds evidence, modality, context, or applicability without changing the core definition.
- `REFINE` — changes internal dimensions or sharpens the definition.
- `CONSTRAIN` — narrows validity, adds conditions, limits, boundary cases, or failure conditions.
- `COUNTER` — records source-backed opposition, reversal, or an incompatible mechanism that must remain visible.

A propagation event contains the delta. The compiler applies ordered events to produce current state.

Minimum shape:

```yaml
schemaVersion: 0.1.0
id: asg:prop:roquet:p2:c4:horizon:refine:001
type: ASGPropagation
nodeRef: asg:node:horizon
operation: REFINE
sourceObservationRefs:
  - obs:asg:roquet:p2:c4:horizon-001
epistemicStatus: close_paraphrase
evidenceRole: source_basis
confidence: 0.91
delta:
  dimensionsAdded:
    - visual_extent
    - mobile_viewpoint
  definitionAppend: >-
    Horizon includes the sensed limit of a field whose continuity is implied beyond what is fully resolved.
rationale: >-
  Part II transports the Part I acoustic-horizon logic into panoramic visual and spatial organization.
```

## 6. Epistemic separation

Every ASG propagation must explicitly classify the relationship between source and derived grammar.

```text
explicit_source
close_paraphrase
derived_inference
speculative_transfer
```

No downstream compiler operation may silently upgrade one class into another.

External literature has a separate role field:

```text
source_basis
corroboration
complication
contradiction
measurement_reference
transfer_support
```

This prevents a Scite/Consensus paper from retroactively becoming evidence that Roquet made a claim he did not make.

## 7. Copyright-safe source coordinates

ASG does not ingest or persist the full dissertation text.

Each source-backed observation should preserve:

```text
sourceRef
part
chapterNumber
chapterTitle
printedPageStart / printedPageEnd when available
pdfPageIndexStart / pdfPageIndexEnd when available
locatorNote
sourceClaim (paraphrase)
optionalQuote (short; <= 25 words)
excerptHash when an extraction is available during ingestion
```

This is enough to reconstruct and verify provenance without creating a shadow copy of the source.

## 8. Part I bootstrap behavior

Part I, **Mood Musics**, is the bootstrap grammar run.

It is allowed to propose `GENESIS` because there is no ASG registry yet, but Genesis remains governed: the ingest stage creates candidate propagation records and the compiler must not present unapproved Genesis as accepted grammar.

Initial Part I node candidates include the already identified concepts and operators, including:

```text
background
foreground
attention
attention_elasticity
furnishing
environmentalization
horizon
ignorable
interesting
figure_field
bounded_uncertainty
temporal_deteleologization
horizon_extension
figure_dissolution
affective_bounding
perceptual_rebasing
environmental_coupling
```

Part I is not encoded as a chapter summary. Each observation is attached to one or more node deltas.

## 9. Part II propagation behavior

Part II, **Panoramic Interiors**, MUST load the compiled Part I candidate/current registry before classification.

For every source observation, classification asks in order:

```text
1. Does an existing ASG node already represent this phenomenon?
   yes -> EXTEND / REFINE / CONSTRAIN / COUNTER
   no  -> continue

2. Would representing it with an existing node materially distort the source claim?
   no  -> attach to the best existing node
   yes -> GENESIS candidate
```

Genesis is the expensive operation.

Primary Part II pressure-test targets:

```text
horizon
figure_field
depth
landscape
subject_dispersion
panoramic_perception
interior_exterior_boundary
environmentalization
orientation
mobility
```

Likely new nodes such as `subject_dispersion`, `panoramic_perception`, or `interior_exterior_boundary` are not admitted by name alone. They must pass the irreducibility test above.

## 10. Part I -> Part II lineage behavior

Example target lineage:

```text
asg:node:horizon
  P1 C3  GENESIS  acoustic horizon
  P2 C4  REFINE   visual/spatial extent
  P2 C4  EXTEND   mobile panoramic viewpoint
  P2 C5  EXTEND   cosmic/galactic scale
  later  CONSTRAIN / COUNTER as evidence requires
```

The compiler outputs the lineage. It never overwrites prior states.

## 11. Ingestion bundle contract

The ASG ingest command will accept a bounded bundle rather than raw PDF text:

```text
source
run
observations[]
nodeCandidates[]
propagationCandidates[]
externalEvidence[]
```

The raw extraction/research step is upstream. This intentionally separates interpretive extraction from canonical ingestion.

The bundle must identify the corpus scope (`part`, chapters, source digest/identity) and its upstream method.

## 12. Compiler invariants

The compiler must fail when any of the following is true:

1. a propagation references a missing node
2. a non-GENESIS propagation references a node that did not exist at that point in lineage
3. a GENESIS event attempts to create an existing canonical ID
4. the same source observation is applied twice to the same node with equivalent operation + delta
5. confidence falls outside `[0,1]`
6. epistemic status is missing
7. evidence role is missing
8. a Part II propagation run is executed without a resolvable prior Part I registry or explicit bootstrap override
9. generated projections differ across identical clean reruns
10. generated files are treated as authoritative input

## 13. Determinism

Canonical output ordering is lexical by canonical ID.

Before hashing:

- object keys are canonicalized
- arrays that are semantically sets are sorted
- volatile timestamps are excluded from semantic digests
- receipts may contain wall-clock creation time but deterministic content digests cannot

Two identical clean runs must emit the same semantic digest and same canonical record set.

## 14. Human-readable outputs

Each part compile emits a generated Markdown report containing:

1. source scope
2. nodes touched
3. propagation operations
4. new Genesis candidates
5. definition changes
6. new dimensions/constraints
7. contradictions/counters
8. failure modes
9. external literature bridges
10. unresolved questions
11. provenance table

Part II additionally emits a **propagation matrix** comparing pre-Part-II state with post-Part-II state.

## 15. Machine-readable outputs

First implementation targets:

```text
current-registry.json
lineage.json
part-matrix.json
part-matrix.csv
```

`part-matrix.csv` is a generated analytical projection intended for spreadsheet review. A spreadsheet is never the write path back into canonical knowledge unless a future governed import adapter is explicitly designed.

## 16. Measurement boundary

ASG variables are analytical constructs, not validated scientific metrics by default.

Each measure candidate carries a maturity value:

```text
conceptual
literature_backed
instrumented
calibrated
validated_for_scope
```

Examples such as `attention_elasticity`, `missed_state_penalty`, or `horizon_porosity` begin as `conceptual` even when adjacent peer-reviewed literature provides useful operational analogues.

No numeric score may be presented as empirically predictive until a measurement protocol and target context have been calibrated.

## 17. External-evidence sidecar

Scite and Consensus are research sidecars, not canonical truth stores.

For each ASG node, external research can provide:

```text
corroborates[]
complicates[]
contradicts[]
operationalizes[]
measurementCandidates[]
limitations[]
```

DOI is the preferred external identifier.

The first evidence bridge is intentionally narrow: attention and restorative soundscape research is used only to demonstrate that ASG concepts can later connect to empirical operationalization, not to validate the whole grammar.

## 18. First implementation slice after written-spec approval

The first code slice will add only:

```text
knowledge/asg/schema/asg-node.schema.json
knowledge/asg/schema/asg-propagation.schema.json
knowledge/asg/schema/asg-bundle.schema.json
scripts/knowledge/asg/normalize-asg-bundle.mjs
scripts/knowledge/asg/ingest-asg-run.mjs
scripts/knowledge/asg/compile-asg.mjs
scripts/knowledge/asg/render-asg-report.mjs
scripts/knowledge/asg/test-asg-contract.mjs
scripts/knowledge/asg/test-asg-determinism.mjs
examples/asg/roquet-part-1.bundle.json
examples/asg/roquet-part-2.bundle.json
```

`package.json` receives a small `knowledge:asg:*` command family. No UI, database, graph service, or spreadsheet integration enters this slice.

## 19. Test strategy

TDD order for the implementation slice:

1. reject malformed node
2. reject malformed propagation
3. reject Part II without prior lineage
4. reject duplicate Genesis ID
5. reject propagation against nonexistent node
6. ingest Part I fixture in dry-run mode
7. compile Part I registry
8. ingest Part II fixture against Part I registry
9. verify Part II classifies changes as propagation instead of duplicate ontology
10. rerun twice from clean generated state and compare semantic digests
11. render deterministic human report and CSV projection
12. run existing `knowledge:verify` to confirm no regression

## 20. Error handling

- canonical writes are immutable within an ingestion run
- partial writes roll back
- generated projections are written to a temporary location then atomically replaced
- validation errors identify record ID + field path
- classification ambiguity is not guessed; it becomes an explicit unresolved candidate in the input bundle before canonical ingestion
- Genesis approval remains human-governed

## 21. Definition of done for the first implementation slice

The slice is done when:

- Part I and Part II fixtures validate
- Part I bootstraps a candidate grammar
- Part II modifies that grammar only through explicit propagation operations or governed Genesis candidates
- current registry + lineage + part matrix rebuild deterministically
- human report and machine projections agree on node/event counts
- no generated artifact is required to reconstruct canonical history
- existing Seed Loom knowledge verification still passes
- documentation explains residency, operation semantics, execution commands, and failure recovery

## 22. Explicit non-goals

Not in this slice:

- full dissertation extraction automation
- LLM auto-classification into canonical records without review
- Parts III–IV ingestion
- UI/dashboard
- graph database
- spreadsheet bidirectional sync
- production predictions about user affect
- universal numeric atmosphere scoring

Those become later bounded slices only after Parts I–II prove that the propagation model is coherent and reproducible.
