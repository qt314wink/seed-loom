# Controls Layer Implementation SPEC (WS1–WS10)

Single source of truth for all control-layer implementation agents on
`feat/strategy-genesis-engine-v0`. Read together with
`docs/strategy-genesis/KIMI_SWARM_FULL_SCOPE_HANDOFF.md`,
`knowledge/config/governance.json`, and `protocols/implementation-boundaries.md`.

## 1. Hard architecture rules

1. Canonical knowledge = Git-versioned JSON under `knowledge/**` (sources, entities,
   observations, relationships, patterns, opportunities, strategies, experiments,
   runs, receipts, config, schema). Control scripts NEVER write to canonical record
   directories. Heuristic output goes ONLY to:
   - `knowledge/receipts/<control>/` — deterministic machine-readable receipts
   - `knowledge/quarantine/<control>/` — quarantined candidates/records
   - `knowledge/projections/<control>/` — disposable projections (temporal, graph)
   - `knowledge/candidates/<control>/` — non-canonical candidates (e.g. duplicates)
2. All generated artifacts are disposable and reproducible from canonical inputs.
3. No new runtime dependencies. Only Node 20 stdlib + existing devDeps (ajv, ajv-formats)
   may be used. No embeddings, no external AI, no network calls in control scripts.
4. Scripts are offline-capable and idempotent. Same inputs → byte-identical outputs.
5. No heuristic marks knowledge accepted, merges duplicates, mutates base confidence,
   or deletes/overwrites historical evidence.

## 2. Script conventions

- ESM `.mjs`, Node >= 20.
- CLI: `node scripts/knowledge/<name>.mjs [--input <path|dir>] [--out <dir>] [--now <ISO8601>] [--config knowledge/config/governance.json] [--fixtures]`
- `--now` injects the evaluation instant. In test/fixture mode it is MANDATORY and
  fixed. Wall-clock `new Date()` is forbidden in deterministic paths; when `--now`
  is absent in production mode, emit the run timestamp into the receipt's
  `generatedAt` but exclude `generatedAt` from all digest computations.
- Exit codes: `0` = all checks pass; `1` = one or more checks failed / policy
  violation detected and reported; `2` = usage/IO error. Negative-fixture test
  harnesses EXPECT exit 1 for the intended reason and treat exit 0 as a test failure.
- Stdout: human summary lines prefixed `PASS ` / `FAIL ` / `WARN ` / `INFO `.
- Receipt: JSON file written to `--out` (default `knowledge/receipts/<control>/`)
  named `<control>-receipt-<yyyymmddThhmmssZ or fixture-label>.json`, containing at
  minimum: `receiptId`, `control` (workstream id), `generatedAt`, `inputs` (array of
  {path, sha256}), `results` (control-specific), `violations` (array of
  {rule, record, detail}), `digest` (SHA-256 of canonical `results`+`violations`,
  excluding `generatedAt`).

## 3. Determinism / digest

- Canonical JSON stringify for digests: recursively sorted object keys, 2-space indent,
  UTF-8, no trailing newline in hashed payload. Shared helper:
  `scripts/knowledge/lib/canonical-json.mjs` — IMPORT it, never re-implement.
- Digest = `sha256(hex)` of canonical JSON of the result payload minus volatile fields
  (`generatedAt`, absolute paths — use repo-relative paths only).
- Self-test scripts (`scripts/knowledge/test-<control>.mjs`) must run the control
  TWICE against fixtures with fixed `--now` and assert identical digests, printing
  `DIGEST <control> <hex>` and exiting non-zero on mismatch.

## 4. Fixture conventions

- Location: `knowledge/fixtures/<area>/positive/**` and `knowledge/fixtures/<area>/negative/**`.
- Every fixture file is self-describing JSON with `fixtureId`, `description`,
  `expectation` (`pass` | `fail` | `review` | `quarantine` | `reject`),
  and `expectedRule` (the rule identifier that must fire for negatives).
- Test harness iterates ALL fixtures in the area; a negative fixture that passes
  the control silently = test failure.

## 5. Schema conventions

- JSON Schema draft 2020-12, validated with ajv (use `ajv/dist/2020.js`) + ajv-formats
  (existing devDeps). `$id`: `https://seed-loom/schemas/<name>.schema.json`.
  `additionalProperties: false` unless the record is explicitly extensible.
  All schemas live in `knowledge/schema/`.
- New record types are registered in `scripts/knowledge/validate.mjs`'s type map
  ONLY by WS9 (leads: leave validate.mjs alone; WS9 wires registrations).

## 6. Config

- `knowledge/config/governance.json` is the authoritative budget/decay/sensitivity
  default file. Control scripts read it via `--config` (default path above) and must
  fail closed (exit 1 with named rule) if required config keys are missing.

## 7. File ownership (do not touch files outside your scope)

| WS | Owns |
|----|------|
| WS1 | `scripts/knowledge/analyze-source-independence.mjs`, `scripts/knowledge/test-source-independence.mjs`, `knowledge/schema/independence-report.schema.json`, `knowledge/fixtures/source-independence/**`, receipts/candidates dirs for WS1 |
| WS2 | `scripts/knowledge/apply-temporal-decay.mjs`, `scripts/knowledge/test-temporal-decay.mjs`, `knowledge/schema/temporal-projection.schema.json`, `knowledge/fixtures/temporal/**`, WS2 dirs |
| WS3 | `scripts/knowledge/detect-semantic-duplicates.mjs`, `scripts/knowledge/test-semantic-duplicates.mjs`, `knowledge/schema/duplicate-candidate.schema.json`, `knowledge/fixtures/duplicates/**`, `knowledge/config/claim-aliases.json`, WS3 dirs |
| WS4 | `scripts/knowledge/validate-corrections.mjs`, `scripts/knowledge/propagate-invalidation.mjs`, `scripts/knowledge/test-corrections.mjs`, `knowledge/schema/correction-event.schema.json`, `knowledge/fixtures/corrections/**`, WS4 dirs |
| WS5 | `protocols/sensitive-data-and-rights.md`, `scripts/knowledge/scan-sensitive-data.mjs`, `scripts/knowledge/test-sensitive-data.mjs`, `knowledge/schema/data-classification.schema.json`, `knowledge/fixtures/sensitive-data/**`, WS5 dirs |
| WS6 | `scripts/knowledge/calibrate-confidence.mjs`, `scripts/knowledge/test-calibration.mjs`, `knowledge/schema/calibration-event.schema.json`, `knowledge/fixtures/calibration/**`, WS6 dirs |
| WS7 | `scripts/knowledge/enforce-budgets.mjs`, `scripts/knowledge/test-budgets.mjs`, `knowledge/schema/budget-receipt.schema.json`, `knowledge/fixtures/budgets/**`, WS7 dirs |
| WS8 | `scripts/knowledge/export-notebook-candidates.mjs`, `scripts/knowledge/test-notebook-export.mjs`, `knowledge/schema/notebook-export.schema.json`, `knowledge/fixtures/notebooks/**`, WS8 dirs |
| WS9 | `package.json`, `package-lock.json`, `scripts/knowledge/run-controls.mjs`, `scripts/knowledge/lib/**`, `scripts/knowledge/validate.mjs` (type registrations only), `scripts/knowledge/build-workbench.mjs`, `tools/graph-workbench/**`, `.github/workflows/knowledge-controls.yml`, `docs/strategy-genesis/OPERATOR_CONTROLS.md`, legacy-record normalization under `knowledge/observations|runs|sources` (with migration receipt) |
| WS10 | `docs/strategy-genesis/ADVERSARIAL_REPORT.md`, `knowledge/receipts/adversarial/**`, read-only everywhere else |

Cross-workstream consumption (e.g. WS4 reading WS1 clusters, WS6 reading WS2
projections, WS8 calling WS3/WS5 logic) happens through the OTHER control's emitted
receipt/projection files or by spawning its script — never by editing its files.

## 8. Receipts and test evidence each lead must produce

1. Control script + schema + positive fixtures + adversarial negative fixtures.
2. `test-<control>.mjs` harness: validates schemas, runs positive fixtures (expect
   pass), runs negative fixtures (expect the named failure), runs twice and compares
   digests. Exit 0 only if everything holds.
3. Run `node scripts/knowledge/test-<control>.mjs` TWICE; capture both outputs;
   confirm identical `DIGEST` lines; report both digests.
4. A receipt file under `knowledge/receipts/<control>/` from the fixture run.
5. Final report: files created, tests run (2x), digests, known limitations, and any
   cross-workstream contract assumptions.

## 9. Sandbox delivery protocol (subagent sandboxes are isolated)

- Each agent works in its own sandbox. Clone:
  `git clone --depth 50 --branch feat/strategy-genesis-engine-v0 https://github.com/qt314wink/seed-loom.git` into `$HOME` (NOT /mnt — symlink-unsupported filesystems break `npm install`).
- Knowledge scripts need only ajv + ajv-formats. If full `npm install` fails in your
  sandbox, run `npm install --ignore-scripts --no-audit --no-fund` in the clone; if the
  `file:packages/svg-filter-atlas` dep still breaks, create a scratch dir with
  `npm i ajv@8 ajv-formats@3` and run node with `NODE_PATH=<scratch>/node_modules`.
- NEVER git commit/push via git CLI. Deliver files to the branch with the GitHub MCP
  tool `push_files` (one commit per workstream, message prefix `feat(WSx):`). If MCP
  tools are not loaded in your toolset, call `select_tools` with names
  `mcp__plugin-github_github__push_files` and `mcp__plugin-github_github__get_file_contents`.
- Push ONLY files inside your ownership scope. After pushing, verify with
  `get_file_contents` on one of your files.
