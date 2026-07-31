# Strategy Genesis Control Operator Workflow

## Boundaries

Git-versioned JSON under `knowledge/sources`, `entities`, `observations`, `relationships`, `patterns`, `opportunities`, `strategies`, `experiments`, and `runs` remains canonical. Control scripts write only receipts, candidates, quarantine records, and disposable projections. They do not accept knowledge, merge semantic candidates, mutate base confidence, delete historical evidence, spend funds, call external models, or write notebook output into canonical directories.

## Required execution

```bash
npm run knowledge:setup
npm run knowledge:controls
npm run knowledge:verify
npm run knowledge:verify
npm run knowledge:graph:build
```

`knowledge:controls` runs each workstream verifier twice in a fresh Node process and compares the machine-readable digest. It emits one verifier approval per WS1–WS8 and a machine-readable WS1–WS10 completion report. `knowledge:verify` also runs the ordinary pipeline gates. The Graph Workbench is rebuilt last from canonical records and generated control artifacts.

## Review queues

1. Review source-independence clusters before using corroboration counts. Syndicated or common-upstream sources count as one originating stream.
2. Review temporal projections; use `effectiveConfidence` for current decisions while preserving `baseConfidence` unchanged.
3. Review duplicate candidates and negation contrasts. No candidate is an automatic merge.
4. Review correction and invalidation chains. Original records remain addressable; dependent reasoning is marked review-required.
5. Reject secrets and prohibited material. Minimize copyrighted excerpts. Unknown sensitive personal data remains quarantined.
6. Treat calibration threshold recommendations as candidates. Small or unresolved samples cannot amend governance.
7. Inspect budget receipts. Unknown spend fails closed and exhaustion is explicit.
8. Notebook exports remain under `knowledge/quarantine/notebook-exports/<exportId>/` until ordinary validation, source vetting, duplicate analysis, sensitive-data scanning, and human approval finish.

## Failure handling

A non-zero control exit names the rule and record. Do not edit generated receipts to make a gate pass. Correct the fixture, script, schema, or canonical source record through a reviewed change. Historical records are not overwritten to erase a prior state. Compatibility normalization in `validate.mjs` is in-memory only and emits `knowledge/receipts/migrations/legacy-compatibility-receipt.json`.

## Graph Workbench

Run `npm run knowledge:graph` after `knowledge:graph:build`. The workbench displays canonical nodes alongside disposable control outputs, including independence clusters, temporal confidence, duplicate candidates, invalidation chains, sensitivity state, calibration, budget use, notebook origin, and unresolved review queues. The view and its `data.json` are projections, never the source of truth.
