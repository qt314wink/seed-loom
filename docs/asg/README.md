# Atmospheric Systems Grammar (ASG)

ASG is a Seed Loom domain module for turning source-grounded atmospheric theory into a traceable, compilable grammar for analysis and design.

## Product role

ASG is intended to support five downstream functions:

1. analyze an existing experience
2. generate a bounded atmosphere specification
3. compare two implementations
4. predict likely effects and failure modes with qualified confidence
5. explain why a lighting, motion, sound, spatial, temporal, or interaction decision belongs

It is **not** a separate orchestration engine. Seed Loom remains the source/governance substrate.

## Canonical residency

Authoritative records are Git-versioned JSON.

```text
knowledge/sources/             existing Seed Loom source truth
knowledge/observations/        existing Seed Loom source-backed claims
knowledge/relationships/       existing generic relationships
knowledge/asg/nodes/           ASG grammar identities
knowledge/asg/propagations/    immutable ASG change events
knowledge/asg/evidence-links/  domain evidence-role records
knowledge/asg/runs/            ASG bounded run metadata
```

Generated outputs belong under `knowledge/asg/projections/` and can always be rebuilt.

## Core propagation rule

Do not restart the ontology for each chapter or part.

Every new source-backed finding must be classified against the resident grammar:

```text
EXTEND      adds evidence, context, modality, or applicability
REFINE      sharpens or internally changes a definition
CONSTRAIN   narrows validity or adds a boundary/failure condition
COUNTER     preserves source-backed opposition or reversal
GENESIS     creates a new node only when reuse would distort the phenomenon
```

Genesis is intentionally expensive and human-governed.

## Parts I–II scope

Part I (`Mood Musics`) bootstraps the candidate grammar from background music, Satie/furniture music, ambient music, attention, horizon, environmentalization, figure/field, uncertainty, and related operators.

Part II (`Panoramic Interiors`) does not create a replacement taxonomy. It pressure-tests and propagates the Part I registry, especially:

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

## Epistemic status

Every propagation explicitly records whether it is:

```text
explicit_source
close_paraphrase
derived_inference
speculative_transfer
```

External literature uses a separate evidence role such as `corroboration`, `complication`, `contradiction`, `measurement_reference`, or `transfer_support`.

## Human and machine outputs

Planned machine projections:

```text
current-registry.json
lineage.json
part-matrix.json
part-matrix.csv
```

Planned human projections:

```text
part reports
lineage reports
propagation matrices
decision explanations
```

Spreadsheet output is a generated review lens only. It is not canonical knowledge.

## Measurement rule

ASG variables are analytical constructs by default. A construct such as `attention_elasticity`, `missed_state_penalty`, or `horizon_porosity` cannot be treated as an empirically validated metric merely because adjacent literature exists.

Measurement maturity is explicit:

```text
conceptual
literature_backed
instrumented
calibrated
validated_for_scope
```

## Design spec

See `docs/superpowers/specs/2026-08-10-asg-domain-module-design.md` for the complete approved architecture and first implementation boundary.
