# Epistemic Design Engine — Decision Provenance

Status: proposed v0.1

## Purpose

Decision provenance preserves the full ancestry of a consequential choice: what was known, what was inferred, which alternatives existed, who or what acted, why the path was chosen, how it was implemented, what happened afterward, and what later record corrected or superseded it.

The ledger is append-only. History is never repaired by editing the past. Corrections are new events linked through `supersedes`, `reverses`, `narrows`, or `reinterprets` relationships.

## Provenance chain

```txt
source → evidence claim → interpretation → inference → assumption
→ contradiction → resolution → decision → implementation
→ validation → outcome → learning event
```

A complete trace may skip a stage only by recording `not_applicable` and why.

## Required records

### Evidence event

- stable event ID and timestamp;
- actor or process;
- source and source version;
- directly observed content;
- extraction or observation method;
- confidence and limitations;
- integrity hash where available.

### Inference event

- target claim or field;
- derivation mode;
- premises and evidence IDs;
- rules or patterns applied;
- assumptions;
- alternatives;
- confidence;
- falsification or revision triggers.

### Decision event

- context and scope;
- authority and decision owner;
- candidate paths;
- selected resolution strategy;
- chosen path and rationale;
- risks and unresolved residue;
- implementation contract;
- revisit condition.

### Validation and outcome event

- intended behavior;
- test method and environment;
- measured result;
- deviations;
- reviewer;
- effect on confidence, patterns, and lifecycle state.

## Provenance classes

- **Historical** — archives, prior projects, documented movements, or precedents.
- **Empirical** — direct observation, measurements, tests, or user outcomes.
- **Technical** — source code, specifications, runtime behavior, performance, or constraints.
- **Perceptual** — accessibility, readability, cognition, or structured human judgment.
- **Declared** — explicit stakeholder intent, preference, consent, or authority.
- **Experimental** — framework hypotheses or unvalidated patterns.

Classes may coexist. They may not be collapsed into one generic “source” field.

## Constraints

- Approved decisions require stable IDs for every consequential dependency.
- Human and automated actors must be distinguishable.
- A citation to a mutable source records the accessed version or timestamp.
- Summaries may not replace the underlying event chain.
- Private or sensitive evidence may be access-controlled, but its existence, authority, and redaction state remain represented.
- Derived records must never claim stronger authority than their sources.
- Deletion is reserved for legally required or security-critical removal and must leave a tombstone where permissible.

## Gates

G0 identity: every event has unique ID, timestamp, actor, and type.  
G1 source integrity: source location and version are recoverable.  
G2 chain completeness: decision dependencies resolve without orphan links.  
G3 epistemic honesty: observed, inferred, assumed, and declared records remain distinct.  
G4 correction integrity: supersession never destroys the prior record.  
G5 outcome closure: production decisions receive a validation or explicit “not yet observed” record.  
G6 retrieval: common trace queries complete within the operational budget.

## Benchmarks

- Provenance completeness: 100% for approved consequential fields.
- Orphan dependency rate: 0.
- Duplicate event ID rate: 0.
- Decision reconstruction agreement: at least 90% across independent reviewers.
- Source-version recovery: 100% where the source system supports versioning.
- Median artifact-to-evidence trace retrieval: under two seconds in automated systems and under two minutes for human navigation.
- Supersession correctness: 100% of corrected records retain accessible prior states.

## QA

Run schema validation, referential-integrity checks, hash verification where supported, orphan detection, duplicate detection, temporal-order checks, actor attribution checks, source freshness review, redaction-policy checks, and periodic reconstruction drills. CI must reject an approved artifact whose trace contains unresolved identifiers.

## Conditions for continued life

A provenance record lives for at least as long as any artifact, decision, claim, product, or pattern that depends on it. It may transition to archived storage but not become unreachable. A pattern may remain approved only while its supporting evidence is live, applicable, and not superseded by contradictory outcomes. Retention, privacy, and access policies must be explicit for every workspace.