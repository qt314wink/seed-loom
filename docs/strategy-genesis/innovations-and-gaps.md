# Innovations, Gaps, and Tailored Architecture

## Design premise

Seed Loom should borrow mechanisms from mature lineage, provenance, observability, validation, and decision-governance systems without importing their infrastructure cost or accidental complexity.

## Adopted mechanisms

### Run lifecycle events

Each research cycle and each internal stage behaves like a small lineage event stream:

- START acknowledges intent and inputs.
- RUNNING is optional and records material intermediate facts.
- COMPLETE, FAIL, or ABORT closes the stage.
- Inputs and outputs are additive; prior facts are not silently rewritten.

This gives the system reconstructable execution history without requiring an external lineage server.

### Minimal provenance vocabulary

Every durable artifact records:

- entity or artifact identifier
- generating activity or run
- responsible agent, automation, or reviewer
- source identifiers
- derivation or supersession relationships
- generation and invalidation timestamps

The JSON graph remains canonical. RDF or PROV-O export is an adapter, not a v0 dependency.

### Reusable checkpoints

Validation is organized as named checkpoints rather than scattered assertions:

- source checkpoint
- epistemic checkpoint
- relationship checkpoint
- inquiry checkpoint
- governance checkpoint
- publication checkpoint

Each checkpoint produces a machine-readable result and permits or blocks transition.

### Semantic event naming

Stage events use stable names and common fields so logs, receipts, and future telemetry can be correlated. Do not add a hosted observability stack in v0; emit newline-delimited JSON locally and retain only bounded receipts.

## Innovations tailored to Seed Loom

### Evidence escrow

Claims that are promising but inadequately supported enter escrow rather than disappearing or advancing. Escrow records include the missing evidence class, expiry date, responsible next inquiry, and promotion conditions.

### Confidence budget

Confidence cannot be raised merely by repetition. Each source contributes only within its independence class. Five articles repeating one press release count as one originating evidence stream plus distribution behavior, not five confirmations.

### Actor-behavior matrix

The graph separates what actors say from what they do. A release, payment, procurement, hiring event, policy action, implementation, adoption, withdrawal, or measured use has greater behavioral weight than commentary or media repetition.

### Counterfactual register

Each serious interpretation records at least one plausible alternative explanation and what future observation would distinguish between them.

### Decision half-life

Recommendations receive a review-by date based on volatility. Policy, funding, pricing, model capability, and supplier availability should expire faster than stable scientific or historical evidence.

### Negative-space receipt

A no-change receipt records what was checked, what did not change, collection gaps, and why no promotion occurred. This makes silence inspectable and prevents novelty pressure.

### Promotion debt

Any manual override or incomplete transition creates promotion debt. Debt must name the waived gate, approver, reason, risk, expiry, and remediation. Unresolved debt blocks genesis.

### Reversible strategy packets

Strategy outputs include trigger, expected effect, leading indicator, stop condition, rollback, cost ceiling, and maximum review period. This turns advice into bounded experiments instead of open-ended commitments.

## Missing or underdeveloped areas

1. Negative fixtures are not yet comprehensive.
2. Source independence and circular citation detection need explicit scripts.
3. Retraction, correction, and supersession handling needs tests.
4. Personally identifiable, licensed, confidential, or sensitive data classifications need a data-handling policy and field-level redaction rules.
5. The system needs time-aware expiry and stale-confidence reduction.
6. Duplicate semantic claims require canonicalization beyond exact ID checks.
7. Weekly baseline calculations need minimum sample-size rules.
8. There is no formal calibration set comparing confidence predictions with later outcomes.
9. Cost and runtime budgets need machine-enforced ceilings.
10. Notebook outputs need an explicit export-and-review boundary.

## Budget-sensitive sequence

### Now

Use JSON, JSON Schema, Node scripts, Git, GitHub Actions, SHA-256 receipts, Markdown notebooks, and generated JSONL. Keep the daily automation as the sole scheduled intake.

### Next

Add source-independence analysis, expiry, counterfactual checks, confidence calibration, negative fixtures, and a small static graph explorer.

### Later, only when justified

Add SQLite or DuckDB for faster local analytics. Add RDF export for interoperability. Add a graph database, vector search, hosted observability, or workflow orchestration only after file-based operation becomes a measured bottleneck.

## Non-goals

- autonomous repository creation
- autonomous accepted-knowledge promotion
- hidden confidence calculation
- paid infrastructure before demonstrated need
- scraping that violates terms or bypasses access controls
- treating media volume as independent evidence
- replacing human judgement with an aggregate score
