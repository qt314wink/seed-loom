# Phase C — Source Independence Engine

Phase C prevents repeated coverage from masquerading as independent corroboration.

## Purpose

The source-independence subsystem asks how many genuinely independent evidence streams support a claim, not how many URLs mention it. It is deterministic, local-first, non-mutating, and review-oriented.

## Canonical boundary

Canonical Source and Observation records remain Git-versioned JSON. The analyzer may emit reports, warnings, clusters, review candidates, and receipts, but it may not merge sources, rewrite observations, change confidence, accept knowledge, or advance repository genesis.

## Inputs

The engine reads canonical source records from `knowledge/sources/**`, observation references from `knowledge/observations/**`, governance thresholds from `knowledge/config/governance.json`, and deterministic positive and adversarial fixtures from `knowledge/fixtures/source-independence/**`.

Source records may now preserve optional lineage fields including title, lead, syndication origin, DOI, upstream report, policy document, citation references, and analyst notes. Missing lineage metadata means unknown independence, not confirmed independence.

## Detection methods

The current implementation uses deterministic evidence in descending strength:

1. identical raw URLs;
2. normalized canonical URLs after tracking-parameter removal;
3. shared declared independence keys;
4. shared wire or syndication origin;
5. shared DOI, report, policy document, announcement, or study;
6. explicit citation relationships and citation cycles;
7. copied-title and copied-lead similarity;
8. repeated distinctive analyst language.

Strong structural evidence may cluster records into one originating stream. Ambiguous lexical similarity, analyst echoes, and circular citation are routed to human review and never silently merged.

## Outputs

The engine writes disposable, reproducible outputs under:

- `knowledge/receipts/source-independence/`
- `knowledge/candidates/source-independence/`

The Knowledge Integrity receipt links to those locations and records whether Phase C passed.

## Commands

Run the canonical graph analysis:

`npm run knowledge:independence`

Run deterministic positive and adversarial tests:

`npm run knowledge:test:independence`

Run the integrated verification chain:

`npm run knowledge:verify`

## Required proof

Phase C is not complete until the tests demonstrate all of the following:

- syndicated copies count as one originating stream;
- tracking-parameter variants do not count as separate sources;
- multiple articles based on one DOI, report, policy document, announcement, or study are grouped appropriately;
- circular citation is detected and sent to review;
- repeated analyst language is surfaced without automatic merging;
- genuinely independent reports remain separate;
- two fixed-time executions produce identical digests;
- canonical knowledge files remain unchanged;
- confidence is not increased merely because coverage volume increased.

## Confidence rule

The independent stream count is an input to later confidence evaluation. Phase C does not mutate stored confidence. A high article count with one upstream origin is recorded as one evidence stream plus a distribution signal.

## Failure behavior

Invalid configuration, invalid fixtures, nondeterministic output, unresolvable lineage, or schema-invalid reports fail closed. Existing canonical evidence remains untouched. Downstream promotion must remain blocked until the failure is resolved or explicitly reviewed.

## Definition of done

Phase C is complete when the analyzer, schemas, fixtures, deterministic tests, Integrity Engine integration, CI execution, receipts, and human-review queue all pass twice with identical digests and no canonical mutation. PR #23 remains draft until the broader strategy-genesis gates also pass.
