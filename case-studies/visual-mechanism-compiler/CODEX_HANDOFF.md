# Codex Handoff — Visual Mechanism Compiler Case Study v0

## Goal

Produce the smallest defensible Visual Mechanism Compiler proof inside Seed Loom and the evidence needed to turn it into a portfolio case study.

Do **not** build a renderer or universal compiler.

## Base

Repository: `qt314wink/seed-loom`

Base SHA: `5f329ea08174e8c397d0627261661d3637b954b9`

Working branch: `agent/visual-mechanism-compiler-case-study-v0`

Node requirement: Node 22+.

Root package manager contract: npm 10.9.2.

## Existing source references

Read these before editing:

1. `packages/analyzer-core/package.json`
2. `packages/analyzer-core/src/AnalyzerService.ts`
3. `packages/analyzer-core/src/AnalyzerValidator.ts`
4. `packages/analyzer-core/src/verification/verifyTraceability.ts`
5. `packages/analyzer-core/src/execution/createExecutionReceipt.ts`
6. `packages/analyzer-core/test/analyzer-core.test.ts`
7. `packages/analyzer-core/test/fixtures/expected-analyzer-result.json`
8. `packages/analyzer-core/test/fixtures/expected-execution-receipt.json`
9. `packages/schemas/analyzer-result.schema.json`
10. `docs/SIGNAL_TO_SYSTEM_PIPELINE.md`
11. `protocols/pipeline-verification.md` if present at the pinned/base revision.

Treat current repository behavior as evidence. Do not rewrite analyzer-core merely to make the case-study narrative cleaner.

## Environment

Preferred:

- Codex Linux environment or WSL/Ubuntu
- Node 22.x
- npm compatible with the repository contract
- Git
- Python only if an existing repository script requires it

No API key is required for the deterministic fixture path.

Do not add image-generation, shader, vector DB, database, browser automation, or external model dependencies in this slice.

## Bootstrap

Run:

```bash
bash case-studies/visual-mechanism-compiler/scripts/bootstrap.sh
```

The nested analyzer package currently has no checked-in package lock. The bootstrap therefore performs a non-lockfile local install only for analyzer-core and prints that limitation.

If the task requires CI-grade frozen installation of analyzer-core, STOP and open a separate dependency-lock decision rather than silently generating and committing a new lockfile.

## Proposed bounded file set

Create or modify only the minimum needed, preferably:

```text
packages/visual-mechanism-core/
  package.json
  tsconfig.json
  src/
    types.ts
    normalize.ts
    deriveParameters.ts
    inferMechanisms.ts
    compare.ts
    createReceipt.ts
    index.ts
  test/
    visual-mechanism-core.test.ts
    fixtures/
      mirrored_liquid.input.json
      mirrored_liquid.expected.json
      mirrored_liquid.receipt.expected.json

packages/schemas/
  visual-mechanism-result.schema.json

case-studies/visual-mechanism-compiler/
  README.md
  CASE_STUDY_EVIDENCE.md
  CODEX_HANDOFF.md
  SUBAGENT_PROTOCOL.md
  scripts/bootstrap.sh
```

If existing architecture suggests a smaller placement, prefer the smaller placement and document why.

## Data model boundary

Reuse analyzer result concepts where possible. Add only fields required to express mechanism-level output.

A mechanism result should be able to encode:

- source/analyzer reference
- evidence refs
- interpretation refs
- normalized parameters
- parameter confidence
- mechanism candidates
- candidate evidence
- rejected alternatives
- selected mechanism(s), if selection is justified
- comparison or compatibility notes
- verification
- receipt metadata

Do not claim a mechanism is objectively true. Use statuses such as:

- `observed`
- `interpreted`
- `derived`
- `candidate`
- `rejected`
- `verified-against-fixture`

## Work order

### W0 — Baseline

Run analyzer-core typecheck/tests before edits.

Record results.

If baseline tests fail for reasons unrelated to this slice:
- preserve the failure evidence;
- determine whether it blocks this package;
- do not repair unrelated debt in this PR.

### W1 — Contract

Define `visual-mechanism-result.schema.json` and TypeScript types.

The schema must preserve links back to analyzer evidence/interpretation/token IDs.

If a proposed field cannot be traced to source evidence, mark it optional/candidate rather than fabricating support.

### W2 — Normalization

Implement deterministic normalization for the first fixture.

Normalize ordering, floating precision and volatile fields before comparison.

No timestamps may affect normalized equality.

### W3 — Gold fixture

Create `mirrored_liquid.input.json`.

It must be assembled from an actual analyzer-compatible result or explicitly labeled synthetic fixture data.

Do not imply that synthetic observations were measured.

### W4 — Parameter derivation

Derive only parameters supported by the fixture.

Examples may include symmetry, reflection strength, flow direction, distortion amplitude, surface smoothness, repetition, spatial frequency or motion tendency **only when supported by fixture evidence**.

Every derived parameter requires:
- evidence or interpretation refs;
- confidence;
- transformation/method identifier.

### W5 — Mechanism candidates

Map derived parameters to bounded candidate mechanisms.

Preserve alternatives.

If evidence is insufficient to select one mechanism:
- return multiple candidates;
- state the missing discriminator;
- do not force a winner.

### W6 — Determinism

Run the same normalized fixture twice in isolated state.

Assert identical normalized outputs.

Add malformed-reference and unsupported-input tests.

### W7 — Receipt

Produce a receipt containing:
- version;
- source digest/reference;
- analyzer version/reference;
- mechanism compiler version;
- counts;
- traceability coverage;
- unsupported claim count;
- normalized output digest;
- verification checks.

### W8 — Case-study evidence

Update `CASE_STUDY_EVIDENCE.md` with:
- baseline;
- hypothesis;
- architecture;
- fixture;
- decisions;
- rejected alternatives;
- test results;
- limitations;
- exact commit SHA;
- screenshots/visual evidence only if they already exist or are produced by the bounded proof.

## Acceptance criteria

PASS only when:

1. baseline analyzer-core state is recorded;
2. schema validates;
3. all evidence/interpretation references resolve;
4. derived values identify their transformations;
5. alternatives are retained;
6. two isolated normalized runs match;
7. malformed refs fail closed;
8. unsupported claims = 0 for the gold fixture;
9. receipt digest is reproducible after volatile-field normalization;
10. upstream analyzer behavior is not weakened;
11. no renderer/UI/deployment work enters the diff.

## Stop conditions

STOP before:

- GLSL generation;
- Shader Grammar integration;
- WebGL/Three.js renderer work;
- case-study website styling;
- Vercel deployment;
- external model calls for the gold fixture;
- database/vector search work;
- broad analyzer refactors;
- unrelated CI cleanup.

## Explicit subagent protocol

The parent agent owns integration and final decisions.

### Subagent A — Contract/Evidence

Task:
- inspect analyzer schema, validator, traceability checks and fixtures;
- propose the smallest compatible mechanism schema.

IF an existing analyzer field already represents the needed concept:
- reuse/reference it.

IF a new field duplicates analyzer semantics:
- reject the duplicate.

IF evidence linkage would be lost:
- stop and report the conflict.

Deliverable:
- schema/type proposal plus evidence map.

### Subagent B — Fixture/Determinism

Task:
- design the `mirrored_liquid` gold fixture and deterministic replay tests.

IF source material is unavailable:
- create a clearly marked synthetic fixture;
- never call it an observed real-world result.

IF two runs differ only in volatile metadata:
- define normalization rules and retest.

IF semantic output differs:
- treat as a determinism failure.

Deliverable:
- fixture, expected output, determinism test plan.

### Subagent C — Mechanism Mapping

Task:
- map supported fixture signals into parameter and mechanism candidates.

IF two mechanisms explain the same evidence:
- preserve both with confidence/requirements for disambiguation.

IF a mechanism requires unsupported visual facts:
- exclude or mark unsupported.

IF the mapping needs Shader Grammar:
- emit an integration note only; do not cross the repository boundary in this slice.

Deliverable:
- mapping table with reason codes and evidence refs.

### Subagent D — Case Study/QA

Task:
- audit whether the implementation evidence supports every public case-study claim.

IF a claim is proposed rather than implemented:
- label it proposed.

IF a metric was not measured:
- do not invent it.

IF a screenshot or artifact cannot be reproduced:
- exclude it from proof claims.

Deliverable:
- claim/evidence matrix and publication-readiness verdict.

## Parallelism rules

Subagents A and B may run in parallel after W0.

Subagent C starts only after A has a stable draft contract.

Subagent D may begin narrative structure early but cannot finalize claims until W6/W7 results exist.

No subagent may:
- modify files outside the bounded paths without parent approval;
- merge;
- deploy;
- alter branch protection;
- create secrets;
- rewrite upstream source history.

## Final receipt

Return:

```text
VISUAL MECHANISM CASE STUDY RECEIPT

Base SHA:
Head SHA:
Files changed:

Baseline analyzer tests:
Mechanism tests:
Schema validation:
Determinism:
Traceability coverage:
Unsupported claims:

Fixture provenance:
Synthetic fields, if any:

Implemented claims:
Proposed claims:
Rejected claims:

Blockers:
Deferred integrations:

Case-study publication status:
NOT_READY / EVIDENCE_READY / PUBLICATION_READY
```
