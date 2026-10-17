# Visual Mechanism Compiler — Case Study v0

Status: **scaffold / evidence-backed build candidate**

Canonical home for this case study: `qt314wink/seed-loom/case-studies/visual-mechanism-compiler/`

Pinned source revision for this scaffold: `5f329ea08174e8c397d0627261661d3637b954b9`

## Thesis

The Visual Mechanism Compiler asks a bounded question:

> Can an evidence-first visual analyzer turn a source image into a deterministic, traceable mechanism profile that is useful downstream without collapsing observation, interpretation, tokenization, and implementation into one opaque step?

This is a case study of the translation layer, not a claim that a complete image-to-shader compiler already exists.

## Existing evidence

Seed Loom already contains implemented analyzer infrastructure:

- `packages/analyzer-core/` — analyzer service, validation, traceability verification, execution receipts, fixtures and tests.
- `packages/schemas/analyzer-result.schema.json` — result contract for source, evidence, interpretations, tokens, translations and verification.
- `packages/analyzer-core/test/fixtures/expected-analyzer-result.json` — deterministic fixture showing evidence → interpretation → token → translation.
- `packages/analyzer-core/test/fixtures/expected-execution-receipt.json` — verified execution receipt with counts, traceability and append-only ledger state.
- `docs/SIGNAL_TO_SYSTEM_PIPELINE.md` — broader signal → interpretation → system → artifact → product → ecosystem method.

## Case-study gap

The current analyzer contract stops before a dedicated visual-mechanism layer.

The next proof should add one bounded layer that can represent:

- normalized visual observations;
- derived parameters;
- mechanism hypotheses;
- confidence and alternatives;
- evidence linkage;
- deterministic comparison/replay;
- an execution receipt.

The first fixture is provisionally named `mirrored_liquid`.

## First proof

Input:

`mirrored_liquid` fixture + analyzer result

Output:

```text
source
  → evidence
  → interpretations
  → tokens
  → normalized visual parameters
  → mechanism candidates
  → selected/rejected mechanism explanations
  → deterministic receipt
```

No renderer, shader generation, UI redesign, deployment, or Shader Grammar integration belongs in this first proof.

## Case-study narrative

1. **Problem** — image-analysis systems often produce attractive descriptions but weak operational traceability.
2. **Constraint** — observed facts, interpretations and implementation hypotheses must remain distinct.
3. **Existing substrate** — Seed Loom already enforces evidence linkage, traceability and execution receipts.
4. **Experiment** — extend that substrate with a small mechanism representation and one gold-standard fixture.
5. **Verification** — identical normalized inputs must produce identical normalized outputs and receipts aside from explicitly volatile fields.
6. **Value** — the result becomes a reusable bridge from visual evidence toward shaders, motion systems, fabrication rules, design tokens or other downstream renderers.
7. **Limit** — successful translation does not prove perceptual truth or renderer fidelity; those remain separate tests.

## Success criteria

The case study is worthy of publication when:

- the `mirrored_liquid` fixture is source-backed and reviewable;
- every derived parameter or mechanism cites evidence and/or interpretation IDs;
- alternatives and uncertainty remain visible;
- two isolated runs produce byte-equivalent normalized outputs;
- malformed/unsupported input fails closed;
- an execution receipt records source digest, version, counts and verification;
- the narrative clearly distinguishes **observed**, **interpreted**, **derived**, and **proposed** claims.

See `CODEX_HANDOFF.md` for the bounded implementation order.
