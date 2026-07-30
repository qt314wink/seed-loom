# Pipeline Verification Protocol

Every cycle must acknowledge each stage: collect, vet, normalize, observe, inquire, interpret, relate, pattern, opportunity, strategy, experiment, genesis, publish.

A stage acknowledgement records inputs, outputs, checks, governance boundaries, provenance method, and whether transition is allowed. Silence is failure. Unknown is a valid answer. Unsupported certainty is not.

## Proof order

1. Run `node scripts/knowledge/test-pipeline.mjs` before ingestion.
2. Run schema validation and orphan checks.
3. Ingest a synthetic valid bundle and require success.
4. Ingest invalid-source, conflated-fact/inference, orphan-edge, under-answered-Socratic, and auto-genesis fixtures and require failure.
5. Re-run index, JSONL export, summary, receipt, and deterministic digest tests.
6. Compare generated output twice; hashes must match when inputs are unchanged.
7. Review all stage acknowledgements. Any failed or missing stage blocks publication.

## Layer acceptance

Collection proves retrieval and records failures. Vetting proves source identity, date, source class, directness, and corroboration. Observation preserves fact/inference separation. Inquiry answers the full Socratic set or explicitly records unknown. Interpretation names the reasoning method and alternatives. Relationship mapping rejects missing endpoints and directionless edges. Patterning requires repeated evidence over time or across independent contexts. Opportunity requires actor behavior, beneficiary, mechanism, and economic or institutional pathway. Strategy must state benefit, timing, cost of delay, tradeoffs, and smallest test. Genesis always remains deferred in a daily run.

## Definition of done

All positive and negative tests pass; five observations are written; every source is inspectable; every assertion has provenance; every stage is acknowledged; no fatal gate is bypassed; no accepted knowledge is created; no repo action executes; reruns are idempotent or fail safely; outputs are deterministic; failures are explicit; and a human can reconstruct why every judgment was made.
