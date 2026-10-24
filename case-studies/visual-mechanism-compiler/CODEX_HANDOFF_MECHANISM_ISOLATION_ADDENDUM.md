# Codex Handoff Addendum — Mechanism Isolation Slice

Status: **bounded implementation order for draft PR #64**

Repository: `qt314wink/seed-loom`  
Branch: `agent/visual-mechanism-compiler-case-study-v0`  
Current reviewed head: `5462a5166e6328c1ad50c16451742f5c61085d48`  
Base: `5f329ea08174e8c397d0627261661d3637b954b9`

## Goal

Implement the smallest defensible mechanism-isolation layer that converts analyzer-linked observations into explicit Mechanism Observation Units (MOUs), bounded mechanism candidates, typed qualities/weights, deterministic graph links, and an auditable receipt.

This slice MUST preserve the separation:

```text
observation != interpretation != mechanism != feeling != capability
```

Do not build a renderer, shader generator, UI, deployment, or universal ontology.

## Read first

1. `case-studies/visual-mechanism-compiler/MECHANISM_ISOLATION_PROTOCOL.md`
2. `case-studies/visual-mechanism-compiler/spec/mechanism-observation-unit.v0-candidate.schema.json`
3. `case-studies/visual-mechanism-compiler/CODEX_HANDOFF.md`
4. `packages/schemas/analyzer-result.schema.json`
5. `packages/analyzer-core/src/AnalyzerValidator.ts`
6. `packages/analyzer-core/src/verification/verifyTraceability.ts`
7. `packages/analyzer-core/src/execution/createExecutionReceipt.ts`
8. `packages/analyzer-core/test/fixtures/expected-analyzer-result.json`
9. `packages/analyzer-core/test/fixtures/expected-execution-receipt.json`
10. Shader Grammar downstream precedent: `qt314wink/shader-grammar/schemas/experiment-receipt.schema.json` — reference only; do not mutate that repo.

## Environment

Preferred:

- Linux or WSL/Ubuntu
- Node >=22
- npm compatible with root contract
- Git
- no secrets required
- no external model required for the deterministic fixture

Run first:

```bash
git switch agent/visual-mechanism-compiler-case-study-v0
git status --short
bash case-studies/visual-mechanism-compiler/scripts/bootstrap.sh
```

### Dependency policy

For this slice, **add zero new third-party dependencies unless an existing contract makes the task impossible**.

Reuse:

- root Ajv / ajv-formats for JSON Schema validation;
- root TypeScript where practical;
- Node built-ins for hashing, normalization, and lightweight tests;
- existing analyzer-core Zod/Vitest only when working inside analyzer-core tests.

IF a new dependency is truly required:
1. STOP implementation;
2. state the exact missing capability;
3. identify the smallest candidate dependency;
4. state its license, version, lockfile impact, and alternative;
5. wait for parent decision.

Do not silently create a new package lock for `packages/analyzer-core`.

## Architecture decision

Keep analyzer-core unchanged unless a failing integration test proves a minimal compatibility patch is required.

Prefer a sibling package:

```text
packages/visual-mechanism-core/
```

The package consumes analyzer-compatible data and emits mechanism-layer data. It must not absorb provider calls.

Suggested file surface:

```text
packages/visual-mechanism-core/
  package.json
  tsconfig.json
  src/
    types.ts
    validate.ts
    normalize.ts
    resolveReferences.ts
    classifyObservation.ts
    deriveQualities.ts
    buildMou.ts
    inferMechanismCandidates.ts
    buildProcess.ts
    buildGraphLinks.ts
    createReceipt.ts
    index.ts
  test/
    contract.test.ts
    determinism.test.ts
    isolation.test.ts
    fixtures/
      mirrored_liquid.input.json
      mirrored_liquid.expected.json
      kinetic_lag.synthetic.json
      invalid-semantic-as-observation.json
      invalid-generic-weight.json
      invalid-supported-without-receipt.json
      invalid-unresolved-ref.json
      invalid-cross-layer-edge.json
```

The `kinetic_lag.synthetic.json` fixture exists only to exercise temporal/process semantics that a static image fixture cannot prove. It MUST be labeled synthetic and MUST NOT be described as an observed property of the Boesch video or any real source.

## Work order

### W0 — Reconfirm baseline

Run the existing bootstrap. Record:
- Node/npm versions;
- analyzer-core typecheck result;
- analyzer-core test result;
- current branch/head.

IF baseline fails:
- preserve exact output;
- decide whether failure blocks this slice;
- do not repair unrelated debt.

### W1 — Freeze semantic classes

Translate the protocol object classes into types/enums.

Required distinct classes:
- Phenomenon
- Pattern
- QualityDimension / QualityVector
- Operation
- Process
- MechanismCandidate
- TypedWeights
- Effect
- Function
- Capability
- GraphLink
- MechanismObservationUnit

IF two classes collapse to the same untyped object:
- stop and split them.

### W2 — Contract compile

Use the candidate MOU schema as input, not unquestioned authority.

Create the implementation contract and test that:
- valid MOU passes;
- unknown/estimated/not-applicable states can be represented;
- generic `weight` is rejected;
- `supported` mechanism without a test receipt is rejected;
- unresolved source references fail closed.

IF the candidate schema conflicts with current analyzer identifiers:
- update the candidate schema in the case-study path first;
- document why;
- do not silently widen analyzer-core.

### W3 — Reference resolver

Implement deterministic resolution for:
- evidence IDs;
- interpretation IDs;
- region IDs when present;
- process refs;
- graph targets.

Every promoted object must retain backlinks.

IF a reference cannot resolve:
- emit a typed failure;
- do not downgrade it to a warning for the gold fixture.

### W4 — Observation classifier

Implement an explicit guard preventing semantic/affective claims from occupying the observation slot.

Minimum rule set:
- observation must identify entity + property + state change;
- interpretation vocabulary alone cannot satisfy state change;
- feeling labels cannot be accepted as observed physical properties.

Use reason codes rather than opaque booleans.

IF classification is ambiguous:
- return `candidate` or `requires-review`;
- never auto-promote to observed.

### W5 — Quality and weight derivation

Implement typed quality dimensions and separate weights:
- contribution
- salience
- evidence
- confidence
- recurrence
- dependency
- affective
- novelty

Do not compute fake numeric precision.

IF the source only supports ordinal judgment:
- encode ordinal applicability;
- do not convert to an arbitrary decimal merely to satisfy the schema.

### W6 — Mechanism candidates and isolation

For each target effect:
- retain >=1 candidate;
- retain alternatives where plausible;
- list confounders;
- list missing discriminators;
- list activation/suppressing conditions when supported.

A candidate may become `supported` only when a named test/fixture receipt exists.

IF multiple mechanisms remain compatible:
- return all compatible candidates;
- state the discriminator required;
- do not select a winner.

### W7 — Process + graph layers

Represent ordered operations separately from mechanism explanations.

Graph layers:
- causal-formal
- perceptual
- affective
- semantic
- capability

IF an edge crosses causal/formal directly into semantic meaning:
- require an explicit translation relation and evidence path;
- otherwise reject it.

Feeling nodes are modeled responses only. They must store contributors/alternatives/confidence, never masquerade as observed facts.

### W8 — Determinism

Normalize:
- object key order;
- array order where semantics permit;
- float precision by explicit rule;
- volatile timestamps/IDs by explicit exclusion or deterministic injection.

Run two clean passes.

PASS only if normalized outputs and digest are byte-equivalent.

IF semantic output differs:
- fail the gate; do not normalize away semantic differences.

### W9 — Receipt

Create a mechanism-layer receipt with:
- contract version;
- analyzer input digest;
- mechanism compiler version;
- MOU count;
- candidate/supported/rejected mechanism counts;
- unresolved-ref count;
- traceability coverage;
- unsupported-claim count;
- normalized digest;
- tests executed;
- determinism result;
- limitations;
- prohibited inferences.

Borrow the governance distinction from Shader Grammar:
`supported != canonical`.

This slice MUST NOT claim canonical mechanism truth.

### W10 — Case-study evidence

Update `CASE_STUDY_EVIDENCE.md` with:
- exact head SHA;
- baseline;
- contract decisions;
- fixture provenance;
- failure fixtures;
- mechanism isolation result;
- determinism receipt;
- known limits;
- downstream adapter notes.

Do not claim the Kelly Boesch reference was frame-analyzed unless actual source frames with provenance have been ingested and cited.

## Minimum tests

PASS requires all of the following:

1. valid MOU contract;
2. unresolved evidence ref fails;
3. semantic-as-observation fails;
4. generic untyped weight fails;
5. supported mechanism without test receipt fails;
6. pattern promotion without recurrence evidence fails;
7. unordered process fails;
8. capability without mechanism path fails;
9. cross-layer causal->semantic edge without explicit translation fails;
10. multiple compatible mechanism candidates remain uncollapsed;
11. two normalized clean runs are byte-equivalent;
12. analyzer-core baseline remains unchanged/passing.

## Subagents

Parent agent owns integration, scope, commit history, and final receipt.

### A — Contract / Epistemics
Read protocol + schemas + analyzer contracts.
Deliver:
- type map;
- schema deltas;
- promotion state machine;
- epistemic separation test cases.

IF an existing analyzer field already provides the meaning:
- reference it, do not duplicate it.

### B — Fixtures / Determinism
Deliver:
- gold static fixture;
- tiny synthetic temporal fixture if needed;
- negative fixtures;
- normalization rules;
- two-run proof.

IF real-source temporal evidence is unavailable:
- keep temporal fixture synthetic.

### C — Mechanism Isolation
Deliver:
- candidate mechanism representation;
- confounder/discriminator logic;
- reason codes;
- operation/process vocabulary implementation.

IF evidence cannot discriminate:
- preserve alternatives.

### D — Graph / Affect / Capability
Deliver:
- typed graph links;
- feeling-node representation;
- capability backlink verification.

IF feeling is treated as a source fact:
- fail review.

### E — QA / Case Study
Deliver:
- claim/evidence matrix;
- tests-to-claims mapping;
- limits/prohibited inferences;
- readiness disposition.

IF a public claim lacks reproducible evidence:
- downgrade or remove it.

## Parallelism

After W0:
- A and B may run in parallel.
- C waits for A's stable contract.
- D may prototype types after A freezes graph-layer names.
- E may audit continuously but finalizes only after W8/W9.

Do not let subagents modify the same file concurrently.

## Stop conditions

STOP before:
- Shader Grammar mutation;
- GLSL/WGSL implementation;
- renderer/WebGL/R3F work;
- Unity engine integration;
- Vercel deployment;
- external model calls;
- YouTube scraping/downloading;
- database/vector infrastructure;
- broad analyzer refactor;
- new third-party dependency without parent decision.

## Definition of done

Return:

```text
MECHANISM ISOLATION RECEIPT

Base SHA:
Starting head:
Final head:

Baseline analyzer typecheck:
Baseline analyzer tests:

MOU schema:
Contract tests:
Isolation tests:
Negative fixtures:
Determinism:
Normalized digest:

MOUs:
Mechanism candidates:
Supported mechanisms:
Rejected mechanisms:
Unresolved refs:
Unsupported claims:
Traceability coverage:

Synthetic fixtures:
Observed-source fixtures:

Implemented:
Deferred:
Prohibited inferences:
Blockers:

Disposition:
NOT_READY / CONTRACT_READY / EVIDENCE_READY
```

Do not mark `EVIDENCE_READY` unless determinism and all mandatory negative gates pass.
