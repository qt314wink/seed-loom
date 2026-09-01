# Shader Grammar

Shader Grammar is a **sibling ontology**, not a Seed Loom engine.

Seed Loom turns signals into systems. Its Visual Grammar Engine extracts
motifs, palettes, and prompt grammar. It does not describe optical path,
IOR stacks, or phase functions.

Optical materials live in a dedicated repository so they cannot be buried
inside this pipeline:

**[qt314wink/shader-grammar](https://github.com/qt314wink/shader-grammar)** — v0.1

- Four schemas: parameter, field, operator, recipe
- `material-taxonomy.yaml` classifies by mechanism, not trade name
- Twelve specimen recipes composed from thirteen reusable operators
- Validator rejects named-effect flags (`oilSlick: true`) and requires every operator to be reused by at least two specimens

Do not add `oilSlick`-style fields to Seed Loom schemas. Compose a Shader
Grammar recipe instead.
