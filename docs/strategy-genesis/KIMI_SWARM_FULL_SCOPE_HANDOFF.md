# Kimi Agent Swarm — Full-Scope Control-Layer Handoff

## Mission

Complete and prove the missing control layers around Seed Loom's repository-native knowledge graph without replacing Git-versioned JSON as the source of truth. Deliver deterministic, local-first, low-cost controls with explicit receipts, negative fixtures, CI gates, and human approval boundaries.

## Non-negotiable architecture

Canonical records remain under `knowledge/**`. Generated indexes, DuckDB files, graph projections, telemetry, and dashboards are disposable. No hosted graph database, paid observability service, embedding API, or autonomous promotion is required. No agent may mark knowledge accepted, create a production repository, spend funds, contact external parties, or erase prior evidence.

## Swarm topology

Assign one lead per workstream and one independent verifier who did not author that workstream.

1. **Source Lineage Lead** — source independence, syndication, citation ancestry, common upstream evidence.
2. **Temporal Lead** — expiry, decision half-life, validity windows, stale-confidence projection.
3. **Claim Identity Lead** — canonical claim normalization and semantic duplicate candidates.
4. **Correction Lead** — retraction, correction, deletion, supersession, invalidation, recovery.
5. **Data Steward** — sensitivity classification, redaction, copyright/excerpt limits, private-data boundaries.
6. **Calibration Lead** — prediction/outcome ledger, Brier score, reliability bands, threshold review.
7. **Budget Governor** — machine-enforced runtime, source, network, storage, experiment, and spend ceilings.
8. **Notebook Boundary Lead** — controlled export from exploratory notebooks into quarantine-only candidate bundles.
9. **Integration Lead** — scripts, schemas, tests, CI, workbench projections, docs, rollback.
10. **Adversarial Verifier** — negative fixtures, bypass attempts, deterministic reruns, source-of-truth audit.

## Required deliverables

### A. Source independence analysis

Implement `scripts/knowledge/analyze-source-independence.mjs` and a report schema. Detect exact URL duplication, canonical URL duplication, shared `independenceKey`, publisher syndication, copied title/lead similarity, common upstream document or study, citation cycles, and repeated analyst language. Output clusters with `clusterId`, `originCandidates`, `members`, `relationship`, `confidence`, `evidence`, and `manualReviewRequired`.

Confidence aggregation must count independent evidence streams, not article count. A cluster cannot raise confidence as if each member were independent.

Acceptance tests:
- five reposts of one press release count as one originating stream;
- a primary report plus two independently researched analyses count as more than one stream;
- A cites B and B cites A creates a cycle warning;
- shared upstream DOI or policy document forms one lineage family;
- ambiguous similarity is review-only, never auto-merged.

### B. Temporal decay and validity

Implement `scripts/knowledge/apply-temporal-decay.mjs`. Never overwrite original confidence. Produce a time-indexed projection with `baseConfidence`, `effectiveConfidence`, `evaluatedAt`, `validFrom`, `validUntil`, `reviewBy`, `decayPolicy`, `decayReason`, and `expired`.

Policies must be configurable by evidence class and domain. Legal, pricing, funding, provider terms, model capability, procurement, and opportunities decay faster than stable historical or peer-reviewed evidence. Explicit supersession or closure overrides mathematical decay.

Acceptance tests:
- future-dated records fail;
- expired grants and closed application windows are visibly expired;
- changed provider terms trigger review even before ordinary half-life;
- original confidence remains unchanged;
- repeated evaluation at the same instant is deterministic.

### C. Semantic duplicate detection

Implement `scripts/knowledge/detect-semantic-duplicates.mjs` without requiring embeddings. Normalize case, punctuation, dates, organization aliases, boilerplate, and stop terms; extract claim subject, action, object, time, and jurisdiction where possible; generate a SHA-256 `claimFingerprint`; calculate token and n-gram similarity; emit duplicate candidates, not automatic merges.

Acceptance tests:
- paraphrases of the same event cluster;
- related but materially different claims remain separate;
- negated claims never merge with affirmative claims;
- changed quantities, dates, jurisdictions, or policy status lower similarity;
- human-approved aliases are versioned.

### D. Retraction, correction, and supersession

Add schemas and tests for immutable correction events. Required event types: `CORRECTS`, `RETRACTS`, `INVALIDATES`, `SUPERSEDES`, `RESTORES`, `DELETES_AT_SOURCE`, and `REVISES_SCOPE`.

A correction event records target, issuer, reason, source references, discovered time, effective time, affected claims, severity, replacement references, and governance state. Original records remain addressable. Derived patterns, strategies, and decisions receive impact assessments and cannot remain silently current.

Acceptance tests:
- retracted source remains present but invalid;
- dependent observations become review-required;
- corrected numbers preserve old and new values;
- deleted pages use captured hashes or an explicit unavailable-source receipt;
- superseded policies preserve temporal validity.

### E. Sensitive-data and copyright policy

Implement `protocols/sensitive-data-and-rights.md`, a classification schema, and `scripts/knowledge/scan-sensitive-data.mjs`.

Classes: public, internal, confidential, restricted, personal, sensitive-personal, health, financial, application, licensed, copyrighted-excerpt, private-repository, secret, and prohibited. Default unknown personal data to quarantine. Secrets and authentication material must fail ingestion. Health, financial, application, or private-repository information requires explicit purpose, minimization, access boundary, retention, and approval metadata.

Store source facts and short necessary excerpts only. Prefer summaries and hashes. Never ingest full copyrighted articles merely for convenience. Record license, permitted use, excerpt length, and deletion requirement.

### F. Confidence calibration

Add a calibration-event schema and `scripts/knowledge/calibrate-confidence.mjs`. Record prediction ID, original confidence, predicted outcome, evaluation date, observed outcome, outcome evidence, resolution quality, domain, and notes.

Produce Brier score, calibration bands, sample size, unresolved count, overconfidence, underconfidence, and warnings when sample sizes are inadequate. Threshold changes require a reviewed governance amendment; historical values are never rewritten.

Acceptance tests:
- unresolved predictions are excluded from scoring but reported;
- binary outcomes calculate correctly;
- small samples do not justify threshold changes;
- domain-specific calibration remains separate;
- retroactive outcome leakage is rejected.

### G. Machine-enforced budgets

Use `knowledge/config/governance.json` as the authoritative default budget file. Implement `scripts/knowledge/enforce-budgets.mjs` with hard and soft limits for maximum sources per cycle, network calls, runtime, retained artifact bytes, telemetry bytes, graph nodes per ingestion, weekly experiment cost, monthly external service spend, and concurrent experiments.

Every run records consumed budget and remaining budget. Unknown spend fails closed for spend-authorizing transitions. Research collection may complete partially and emit a budget-exhaustion receipt; it may not silently exceed a ceiling.

### H. Notebook export boundary

Implement `scripts/knowledge/export-notebook-candidates.mjs`. Input must be an explicit JSON export manifest produced by a notebook, never arbitrary notebook cell scraping. Exported records go only to `knowledge/quarantine/notebook-exports/<exportId>/`.

Each export requires notebook path, notebook hash, environment, author/agent, generated time, source references, candidate records, transformations, assumptions, and known limitations. Promotion requires ordinary schema validation, source vetting, duplicate analysis, sensitive-data scan, and human approval.

### I. Integration and observability

Extend `knowledge:verify` or add `knowledge:controls` so all controls produce stage receipts. Update the Graph Workbench to display independence clusters, effective confidence, duplicate candidates, invalidation chains, sensitivity labels, calibration state, budget use, notebook origin, and unresolved review queues.

Observability remains JSONL-first. Optional OTLP/Jaeger integration may visualize execution but must never store canonical evidence.

## Required fixtures

Create positive and negative fixtures for every control. At minimum include syndicated copies, circular citations, shared upstream study, expired grant, changed terms, paraphrased duplicate, negated near-duplicate, corrected article, retracted paper, deleted source, secret token, health record, copyrighted long excerpt, over-budget run, unknown spend, notebook bypass, and calibration leakage.

## Merge gates

All scripts must be deterministic, offline-capable for fixture tests, and idempotent. A clean install must pass twice with identical generated digests. Every failure must name the violated rule and affected record. No heuristic may silently mutate canonical files. Auto-fixes write patches or quarantine candidates only. CI must exercise positive and negative fixtures. Graph projections must rebuild from canonical records. A reviewer must reconstruct each decision from sources to observations to relationships to receipts.

## Definition of done

Done means all eight controls are implemented, schema-validated, documented, visible in the workbench, represented in receipts, covered by positive and adversarial fixtures, enforced in CI, and proven on one real nightly cycle plus synthetic edge cases. The system must demonstrate safe refusal, explicit uncertainty, correction propagation, budget exhaustion, privacy quarantine, and duplicate ambiguity without data loss or unauthorized promotion.
