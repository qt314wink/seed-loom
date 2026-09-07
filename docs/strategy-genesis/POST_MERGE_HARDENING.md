# Post-Merge Hardening — Strategy Genesis v0

Status: repair patch for the four unresolved PR #23 Copilot review findings.
Scope is intentionally narrow; this is not a new swarm run.

## Context

- WS1–WS10 control proof completed on `feat/strategy-genesis-engine-v0`
  (completion ledger on issue #24, final head `6612741`).
- PR #23 was merged by the repository owner on 2026-08-01 after human review.
- Five Copilot review threads were created after the merge. One (Filter Atlas
  CI unlocked install) was corrected on `main`. Four remained open.
- The four defects escaped the green verification surface because
  `knowledge:verify` did not exercise `knowledge:weekly`, `emit-jsonl`, or the
  HTTP server's adversarial path boundary.

## Defects and corrections

| # | File | Defect | Correction |
|---|------|--------|------------|
| 1 | `scripts/knowledge/serve-workbench.mjs` | `file.startsWith(base)` allows prefix-collision escapes; request path not decoded | New `lib/safe-path.mjs::resolveWithin` enforces the boundary with `path.relative`, rejects `..`/absolute escapes, decodes percent-encoding (including `%2e%2e`) before resolution, and fails closed on malformed encodings |
| 2 | `scripts/knowledge/emit-jsonl.mjs` | Assumes scalar records with `id`/`runId`; throws on arrays and other identifier shapes | Array-valued files are flattened; identifiers are derived from a canonical key list (`id`, `runId`, `observationId`, `sourceId`, `ackId`, `bundleId`, `ledgerId`, `receiptId`, …) with a deterministic content-digest fallback (`anon:<sha256>`); non-object entries are skipped with a stderr note |
| 3 | `knowledge/schema/run.schema.json` | `proposedExperiments` documented as required by `protocols/daily-intake-contract.md` but absent from `required` | Added to `required` in documented contract order. Both canonical run records already declare it; `normalize-nightly-bundle.mjs` already fills `??= []`, so ingest is unaffected |
| 4 | `scripts/knowledge/weekly-review.mjs` | Undefined `five` throws when an observation reaches the baseline branch; legacy observations without `capturedAt` become NaN-age and are silently dropped | `BASELINE_WINDOWS = 5` constant (35-day baseline); `capturedAt` derived from dated record ids exactly as `validate.mjs` does; undatable records are reported under `unclassifiedObservations` instead of being dropped |

## Regression coverage

`scripts/knowledge/test-post-merge-hardening.mjs` is wired into
`knowledge:verify` (as `knowledge:test:hardening`) and covers:

- T1.x path boundary: root mapping, nested allow, query strings,
  prefix-collision sibling, plain/encoded/mixed-case traversal, malformed
  percent-encoding, encoded backslash.
- T2.x emit-jsonl: array flattening, legacy identifier shapes, deterministic
  sort order, run-to-run byte-identical output, and a smoke run over the
  canonical knowledge directories.
- T3.x run schema: valid run passes, run missing `proposedExperiments` fails,
  canonical run records declare the field.
- T4.x weekly-review: exit 0 with baseline-aged legacy observations, id-derived
  date classification, explicit unclassified reporting, canonical-repo smoke
  run.

## Remaining limitations

- The hardening tests exercise the HTTP boundary logic at the resolver level,
  not over a live socket.
- `emit-jsonl` skips (with stderr note) non-object entries inside array files
  rather than failing; this preserves pipeline liveness for mixed legacy data.
- The original WS1–WS10 limitations stand: lexical duplicate detection favors
  review queues over recall; the control proof is offline and fixture-backed.
