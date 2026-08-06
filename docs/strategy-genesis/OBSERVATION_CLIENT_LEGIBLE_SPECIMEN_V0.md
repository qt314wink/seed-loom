# Observation Client-Legible Specimen v0

## Approval decision

Approve a read-only presentation envelope for one canonical `Observation` record.

The specimen is not a second knowledge model. It is a bounded client-facing rendering contract that keeps the canonical record embedded, unchanged, and inspectable.

## Problem

Canonical Observation JSON is optimized for governance and machine validation. A client needs a shorter surface that answers:

- What is verified?
- What is interpretation?
- Why does it matter?
- How confident are we?
- What evidence and limitations apply?
- What decision is requested?

A prose summary without a contract can silently merge facts and inference or hide candidate status. This specimen prevents that collapse.

## Deliverables

- Contract: `knowledge/schema/observation-client-legible-specimen-v0.schema.json`
- Fixture: `knowledge/fixtures/observation/client-legible-specimen-v0.json`
- Canonical dependency: `knowledge/schema/observation.schema.json`

## Invariants

1. `observation` must validate against the canonical Observation schema.
2. `verifiedSummary` derives only from `observation.verifiedFacts`.
3. `interpretationSummary` derives only from `observation.inference`.
4. Confidence, limitations, evidence disclosure, and approval state remain visible.
5. The client envelope cannot mutate or promote the embedded observation.
6. Candidate status must never be rendered as accepted knowledge.
7. Synthetic fixture evidence must be labeled as synthetic.
8. Presentation validity does not prove product usability or external factual truth.

## Client surface

The minimum client-readable surface contains:

- a plain-language title;
- an explicit status label;
- verified-fact bullets;
- separately labeled interpretation bullets;
- why-it-matters copy;
- confidence score, label, and basis;
- evidence disclosure;
- limitations;
- one requested next decision;
- prohibited claims.

## Traceability

The envelope carries fixed JSON Pointer mappings from each client-facing section to the canonical field that authorizes it. Implementations may add visual styling, but they may not change these source boundaries without a contract revision.

## Acceptance tests

- The fixture validates against the v0 contract.
- The embedded observation validates against Observation schema v1.1.0.
- Removing `verifiedFacts`, `sourceRefs`, `approvalState`, or a required client disclosure fails validation.
- Moving an inferred statement into `verifiedSummary` fails semantic review even if structural validation passes.
- A renderer can reproduce the same client view from the same fixture without network access.
- No write path targets canonical observation files.

## Known limits

- This milestone does not implement a UI.
- This milestone does not establish client comprehension through user research.
- JSON Schema proves structure, not truthfulness of paraphrase; semantic trace review remains required.
- The supplied source reference is a fixture and cannot be used as external evidence.

## Recommended disposition

Approve the contract and fixture as a v0 reference specimen. The next authorized milestone should be a read-only renderer plus one semantic trace test that detects facts/inference crossover. Do not add authoring, approval, or canonical mutation controls in that milestone.
