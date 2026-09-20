# Codex Handoff — Callable Evidence Attachment Two-Build Proof

Issue: #63  
Parent architecture: #8  
Branch: `feat/callable-evidence-two-build-proof`

## Mission

Prove one canonical **Evidence Attachment** design object can be interrogated, retrieved, adapted, emitted, and verified in two real builds without expanding into a general platform.

Targets:

1. `qt314wink/seed-loom` — canonical host + first adapter
2. `qt314wink/nextjs-boilerplate` — independent second adapter/specimen

The object must preserve: evidence linkage, provenance visibility, attachment state, confidence/verification state, inspectable source lineage, accessibility semantics, and recognizable material ancestry.

## Non-goals / hard boundary

Do **not** build a general registry, marketplace, vector database, ontology service, telemetry system, generalized compatibility engine, or multi-repo deployment service.

Do not rewrite the established Seed-Loom visual system. This slice proves portability and traceability.

## Environment

Required:
- Node compatible with repo engines: `^20.19.0 || >=22.12.0`
- npm 10.x preferred
- git
- Python 3 only if existing repo validation calls it
- Chromium installed through Playwright
- authenticated GitHub access for the private second target

No production API key is required for this slice.

Optional environment variables:

```bash
export SEED_LOOM_PATH="${SEED_LOOM_PATH:-$PWD}"
export SECONDARY_REPO="qt314wink/nextjs-boilerplate"
export SECONDARY_REPO_PATH="${SECONDARY_REPO_PATH:-$PWD/.worktrees/nextjs-boilerplate}"
export EVIDENCE_OBJECT_ID="seed-loom.evidence-attachment.v1"
```

Never commit credentials.

## Bootstrap

Run:

```bash
bash scripts/setup-callable-object-proof.sh
```

Then validate baseline before editing:

```bash
npm run contract:check
npm run typecheck
npm run schemas:check
npm run artifact:check
```

If baseline validation fails on untouched main-derived code, record the failure as pre-existing and do not silently absorb it into this slice.

## Source references — inspect before implementing

Seed-Loom:
- `docs/RFC_RECURSIVE_SOCRATIC_COMPONENT_SYSTEM.md`
- `docs/RFC_MATERIAL_TRUTH_LAYER.md`
- `docs/FLORAL_CACTUS_MATERIAL_SYSTEM.md`
- `schemas/callable-design-object.schema.json`
- `tokens/floral-cactus.material.tokens.json`
- `src/main.ts`
- `src/materials.css`
- `README.md`
- Issue #8 freeze/resume contract
- Issue #63 execution contract

Second target:
- read its `package.json`, app/router structure, design/token files, test config, and contribution/agent instructions before choosing an insertion point.
- do not assume Next.js version or app/pages router; discover first.

## Canonical object contract

Create the smallest object definition that satisfies the existing callable-object schema.

Recommended canonical path:

`objects/evidence-attachment/evidence-attachment.object.json`

Required semantics:
- stable `object_id`
- version
- source lineage
- observations separated from interpretations
- invariants
- allowed adaptations
- material tokens
- semantic tokens
- interaction states
- accessibility contract
- performance budget
- supported targets
- verification contract
- licensing/ownership declaration
- evidence references

## Recursive Socratic descent

Create:

`objects/evidence-attachment/inquiry.json`

The inquiry must cover at least these planes:
- component/function
- rendering/material
- texture/depth
- color
- motion/interaction
- narrative/communication
- categorization/retrieval
- accessibility
- performance
- commercialization/licensing
- cross-build compatibility

For each plane, include:
- question
- answer
- evidence or decision basis
- confidence
- unresolved ambiguity
- deeper follow-up question when answer remains interpretive

### Stop rule

Descent terminates only at:
1. observable fact,
2. explicit human decision,
3. measurable parameter,
4. executable implementation,
5. testable condition, or
6. explicitly recorded unresolved ambiguity.

Never convert adjectives like "premium", "tactile", or "protective" directly into code values without a recorded descent.

## Anti-questions

Add at least 8 deliberately indirect probes, for example:
- What disappears if this object is removed?
- What misuse would make it misleading?
- What does support staff need to explain repeatedly?
- What breaks when color is unavailable?
- Which part is expensive to imitate but cheap to understand?
- What survives a monochrome printout?
- What happens when provenance is contested?
- What would make a buyer reject it despite liking the appearance?
- What changes when the target app has no botanical visual language?
- What should remain invariant if the material styling is stripped entirely?

Record the edges surfaced by each anti-question.

## Retrieval proof

Create deterministic retrieval fixture:

`fixtures/callable-objects/evidence-attachment.request.json`

Example intent:

> Call in a provenance/evidence attachment component that feels protective, exposes source lineage on demand, works in a dense technical UI, preserves Omni-Loom ancestry, and stays within the target performance budget.

Return a machine-readable decision receipt:

`artifacts/callable-objects/evidence-attachment.retrieval.json`

It must include:
- selected object ID/version
- matched constraints
- confidence
- evidence used
- at least one rejected alternative or "no alternative exists" with explanation
- preserved invariants
- adaptation plan
- unresolved risks
- deterministic hash/input fingerprint

## Adapter A — Seed-Loom

Implement a thin adapter that consumes the canonical object rather than duplicating semantic constants.

Target shape:
- component/specimen renders the evidence attachment
- click/keyboard reveals provenance
- verification state is not color-only
- material layer may use brass/copper/thread/botanical cues
- canonical semantics remain inspectable

Prefer the existing app architecture; do not introduce React only for this slice.

## Adapter B — Next.js Boilerplate

First inspect the target. Then implement a local adapter/specimen using its native framework and conventions.

Rules:
- do not copy Seed-Loom CSS wholesale
- preserve semantic invariants while allowing target-native presentation
- record every adaptation against `allowed_adaptations`
- if the target cannot consume the object directly without a packaging layer, emit the smallest deterministic package under `dist/callable-objects/evidence-attachment/`

Do not commit to the second repository unless the execution environment has explicit write authorization. A patch/package plus verification receipt is acceptable for the first proof.

## Cross-build comparison

Create:

`artifacts/callable-objects/evidence-attachment.cross-build.json`

Compare:
- object identity
- invariant preservation
- target-specific adaptations
- token mappings
- accessibility
- interaction equivalence
- render/performance budget
- evidence links
- deviations
- failures
- deterministic outputs

A visual difference is allowed. Semantic drift is not.

## Tests

Add the smallest deterministic tests necessary.

Minimum:
- schema validation of canonical object
- retrieval fixture deterministic across two clean runs
- same object ID/version emitted to both adapters
- invariants present in both receipts
- forbidden adaptation fails
- provenance is keyboard accessible
- reduced-motion-safe state
- visual/specimen test where existing harness supports it
- cross-build receipt stable after key-sorted serialization

Use existing Playwright and schema tooling before adding new libraries.

## Performance budget

Default for the callable object's emitted object-specific CSS/JS/data:
- target additive transfer: <= 10 KB minified before compression when reasonably measurable
- no new runtime dependency solely for this object
- no blocking network request required to render base state

If the target architecture makes the 10 KB measurement ambiguous, report exact measurable units rather than inventing a number.

## Subagent operating model

Use parallel subagents only on disjoint read/research or file scopes.

Recommended lanes:

**A — Source/lineage auditor**
- inspect RFCs, schema, tokens, prior material system
- return invariant candidate table + evidence paths
- no writes

**B — Seed-Loom adapter implementer**
- own canonical object integration and Seed-Loom specimen
- may write only Seed-Loom adapter/object files

**C — Second-target scout**
- inspect `nextjs-boilerplate`
- identify framework, insertion point, tests, constraints
- no writes until findings are reconciled

**D — Verification adversary**
- try to break invariants, deterministic retrieval, accessibility, and budgets
- no production writes; test/fixture changes only after coordinator approval

Coordinator owns schema, receipts, cross-build comparison, conflict resolution, and final commits.

### Explicit if/then rules

- IF two subagents propose different invariants, THEN do not average them; trace each to source evidence and record the unresolved contradiction.
- IF a requested styling change violates a semantic invariant, THEN refuse that adaptation and emit a compatibility failure.
- IF the second target uses a different framework, THEN create a target adapter; do not mutate the canonical object to match the framework.
- IF deterministic runs differ, THEN stop feature work and isolate ordering, timestamps, random IDs, file traversal, or environment-dependent values.
- IF a new dependency is proposed, THEN require written justification showing existing repo tooling cannot perform the task.
- IF source lineage cannot be proven, THEN mark the object provisional and stop commercial/licensing claims.
- IF visual regression conflicts with accessibility, THEN accessibility wins and the visual baseline must be deliberately updated with a receipt.
- IF baseline CI is already red before changes, THEN document the pre-existing failure and isolate this slice's checks.
- IF implementation expands beyond one object/two builds, THEN stop and open a separate proposal instead of broadening #63.
- IF the two-build proof passes, THEN prepare a small PR and recommend whether #8 should remain frozen or authorize exactly one next object.

## Commit plan

Prefer 4–6 reviewable commits:
1. canonical object + inquiry + fixtures
2. retrieval/translation receipt generator
3. Seed-Loom adapter + tests
4. second-target adapter/package + tests
5. cross-build comparison + deterministic proof
6. docs/receipts/CI wiring if needed

## Definition of done

Do not claim completion until:
- one canonical object is the source for both targets
- two clean retrieval runs are byte-stable after defined normalization
- both adaptations preserve declared invariants
- accessibility and performance contracts are checked
- rejected alternative reasoning exists
- source lineage is reconstructable
- tests are green or pre-existing failures are explicitly isolated
- a human can inspect the receipts without reverse-engineering the agent's reasoning

## Final report format

Return:
- outcome: PASS / PARTIAL / STOP
- branch + head SHA
- files changed
- commands run and results
- invariant preservation summary
- deterministic proof hashes
- second-target status
- pre-existing failures
- unresolved decisions
- recommendation for parent Issue #8
