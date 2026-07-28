# Functional Analyzer Intake — Contract Diff Against Current `main`

Status: review gate
Branch: `fix/rebase-functional-intake-current-main`
Source branch replayed: `feature/functional-analyzer-intake`
Current base: `main` at `9c81244569a65e671ea923f4cabd092f779f4009`

## Rebase result

The five functional-intake files were replayed onto current `main` without modifying Analyzer Core, the SVG Filter Atlas, the floral-material system, Epistemic Design Engine documents, evidence records, deployment configuration, or unrelated UI.

Replayed files:

- `index.html`
- `src/intake-entry.ts`
- `src/intake-trigger.ts`
- `src/intake.css`
- `tests/intake.spec.ts`

This document is the only additional file.

## Canonical contracts inspected

- `packages/analyzer-core/src/contracts.ts`
- `packages/schemas/analyzer-result.schema.json`
- Analyzer Core deterministic result and execution-receipt fixtures

## Compatibility summary

| Area | Browser intake | Current Analyzer Core | Status |
|---|---|---|---|
| Source kind | `image` | `image` is canonical | compatible |
| Source identity | SHA-256 | SHA-256 | compatible |
| Evidence / interpretation split | explicit | explicit | compatible |
| Token traceability | evidence IDs | evidence and interpretation IDs | compatible subset |
| Verification | coverage + unsupported claims + checks | same top-level concepts | compatible subset |
| Execution mode | `browser-local` | provider execution config | adapter needed |
| Engine | `human-observation` | `fixture`, `ollama`, `openai` provider types | intentional extension; not a provider |
| Result version | `seed-loom.browser-intake.v0.2` | analyzer result version is open string | compatible but not normalized |
| Receipt | browser provenance receipt v0.2 | Analyzer Core deterministic execution receipt | separate receipt family |
| Interpretation shape | predicate, claim, qualification, method | claim, evidence IDs, alternatives, optional question | mismatch |
| Token class | primitive or semantic | broader canonical enum | compatible subset |
| Runtime types | locally declared in `intake-entry.ts` | canonical schema in `packages/schemas` | duplication risk |

## Material differences

### 1. `human-observation` is not a vision provider

The browser intake uses `run.engine = "human-observation"`. Analyzer Core provider types are currently `fixture`, `ollama`, and `openai`.

Decision:

- keep `human-observation` as an intake/derivation mode;
- do not add it to `ENGINE_TYPES`, because it does not implement `VisionEngine`;
- future canonical contracts should separate `execution.mode`, `derivation.actor`, and `provider.type`.

### 2. Interpretation records do not yet validate to one canonical shape

The browser intake emits:

- `predicate`;
- `claim`;
- `qualification`;
- `evidenceIds`;
- `confidence`;
- `method = human-inference`.

The analyzer-result schema requires `alternatives` and allows an optional `disambiguationQuestion`.

Blocking harmonization before merge:

- add an `alternatives` array, even when empty;
- preserve `qualification` as an extension or map it to a structured condition field in a later schema revision;
- validate exported browser runs against `analyzer-result.schema.json`.

### 3. Receipt families are distinct

The browser receipt proves local intake and export. Analyzer Core's execution receipt proves deterministic provider execution and append-only event relationships.

Decision:

- do not merge the two receipts implicitly;
- define a shared receipt envelope in a later bounded PR;
- preserve type-specific payloads under `receipt.kind`;
- never discard either source identity or execution-chain evidence.

### 4. Local TypeScript definitions duplicate schema concepts

`src/intake-entry.ts` currently declares source, evidence, interpretation, token, translation, verification, run, and receipt types locally.

Risk:

- schema changes can leave browser exports structurally stale while TypeScript still compiles.

Required follow-up before promotion from draft:

- add a browser-safe generated type or adapter from the canonical schema;
- add an export-validation test using the canonical JSON Schema;
- avoid importing provider-only Node code into the browser bundle.

### 5. Privacy contract requires explicit testing

The intake claims local-only operation and sets `source.uri = null`. It still includes the original filename in source and receipt records.

Review decision required:

- determine whether filename is allowed in exported evidence;
- verify EXIF is neither parsed nor exported;
- verify object URLs are revoked;
- verify no `fetch`, beacon, analytics, upload, or remote image request is introduced by the intake path.

## Required QA before merge

1. Current `main` build and existing tests remain green.
2. Playwright intake tests pass on the rebased branch.
3. A browser-export fixture validates against the canonical analyzer-result schema after interpretation harmonization.
4. Oversized, malformed, unsupported, canceled, duplicate, and repeated selections are covered.
5. Source SHA-256 is stable for identical bytes.
6. Human observations are never labeled as automated evidence.
7. Traceability coverage and unsupported-claim counts are calculated locally.
8. Exported records contain no object URL, local path, image bytes, or EXIF payload.
9. The intake introduces no network call.
10. Exact changed-file inventory is retained.

## Merge gate

Keep the replacement PR in draft until:

- the interpretation mismatch is resolved;
- canonical schema validation is demonstrated;
- privacy tests pass;
- CI is green on the current base;
- Jennipher approves the final six-file inventory.

No model provider, database persistence, deployment change, unrelated redesign, Filter Atlas modification, or Epistemic Engine implementation is authorized in this branch.
