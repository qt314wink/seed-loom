# Phase D — Claim Identity Engine

## Purpose

Phase D distinguishes document identity from claim identity.

Multiple observations may describe one underlying event, while similar wording may describe materially different events. The Claim Identity Engine creates deterministic fingerprints and review candidates so downstream pattern, opportunity, and strategy stages do not treat wording repetition as independent semantic evidence.

## Canonical boundary

Git-versioned observations remain canonical and immutable.

Phase D may write only to:

- `knowledge/candidates/claim-identity/`
- `knowledge/receipts/claim-identity/`
- integrity and workbench projections

It may not:

- merge observations;
- rewrite observation claims;
- alter confidence;
- accept knowledge;
- create canonical claim nodes without explicit approval;
- collapse negated and affirmative claims;
- promote patterns, opportunities, strategies, experiments, or repository genesis.

## Method

The engine normalizes each claim deterministically using:

- Unicode normalization;
- approved boilerplate removal;
- approved alias substitution from `knowledge/config/claim-aliases.json`;
- date normalization;
- deterministic token normalization;
- bounded synonym normalization;
- extraction of subject, action, object, time, jurisdiction, negation, status, and numeric qualifiers.

The canonical fingerprint is a SHA-256 digest of the normalized semantic tuple and normalized claim representation. No embedding service, external model, graph database, or paid API is required.

## Candidate relations

`duplicate-candidate` means lexical and tuple evidence suggests two observations may express one claim. It always requires human review.

`negation-contrast` means two claims have high overlap but opposite affirmation state. They must remain distinct and are surfaced as a potential contradiction.

`distinct` records a near match that remains separate because of time, jurisdiction, numeric, status, action, object, or other material differences.

Phase D does not emit a final `same-claim` relationship automatically.

## Execution

Run the canonical observation analysis:

```bash
npm run knowledge:claim-identity
```

Run the adversarial deterministic proof:

```bash
npm run knowledge:test:claim-identity
```

Run the integrated verification chain:

```bash
npm run knowledge:integrity
npm run knowledge:verify
```

## Required proof cases

The fixture suite must prove that:

- paraphrases can produce a duplicate candidate;
- same actors with different products remain distinct;
- same product with different actions remains distinct;
- different organizations using similar wording remain distinct;
- affirmative and negated claims never share a final identity;
- date, jurisdiction, numeric, and status mismatches reduce similarity;
- only approved aliases are applied;
- repeated runs produce identical fingerprints and receipts;
- source observations and fixtures remain unchanged;
- all heuristic candidates remain proposed and review-only.

## Pipeline position

The logical daily intake sequence is:

`collect → vet → normalize → observe → claim identity → inquire → interpret → relate → pattern → opportunity → strategy → experiment → genesis → publish`

The nightly automation may emit claim-identity candidates, but it may not approve or merge them. Daily repository genesis remains deferred.

## Receipt contract

Every Phase D run records:

- input claim IDs and hashes;
- alias configuration version;
- normalized claim tuples;
- deterministic fingerprints;
- pairwise similarity evidence;
- mismatch penalties;
- candidate relation and rationale;
- review queue;
- canonical-mutation prohibition;
- automatic-merge prohibition;
- deterministic digest.

## Definition of done

Phase D is complete only when:

1. every canonical observation can be deterministically fingerprinted;
2. schema-valid candidate reports and receipts are emitted;
3. negation and hard semantic mismatches remain distinct;
4. no canonical record or base confidence is mutated;
5. the Phase D suite passes twice with identical output digests;
6. the Integrity Engine acknowledges the claim-identity stage;
7. the Graph Workbench exposes claim fingerprints, duplicate candidates, negation contrasts, and pending review queues;
8. an independent verifier confirms the outputs remain review-only;
9. PR #23 remains draft until the full knowledge-control merge gate passes.

## Known limitation

The current implementation uses deterministic lexical and tuple heuristics. It intentionally favors precision and review queues over broad semantic recall. Embeddings may later be added as a disposable advisory projection, but they may not replace deterministic fingerprints or silently merge canonical knowledge.
