# Strategy and Repository Genesis Operations v0

## Weekly run contract

The weekly run consumes seven days of new external evidence, repository activity, previous graph state, prior strategy decisions, and experiment results. It compares the current window with the previous four-week baseline and emits both a human review and machine-readable records.

The run identifier is deterministic for the review window. Inputs are content-hashed. Collection failures are recorded independently so that partial evidence cannot be mistaken for complete coverage.

## Input classes

External inputs include primary research, official policy and standards material, public funding and procurement records, product releases, pricing changes, company and institutional announcements, technical repositories, benchmark reports, buyer or participant behavior, and reputable analysis.

Internal inputs include commits, pull requests, issues, workflow outcomes, benchmark histories, design-system changes, dependency changes, experiment outcomes, previous opportunity records, rejected theses, and explicit human decisions.

## Canonical output

Each weekly run emits a run record, source receipts, normalized observations, actor-behavior events, candidate patterns, pattern deltas, contradictions, strategic implications, experiment proposals, repository-fit decisions, and optionally one repository thesis dossier.

Every strategic implication must include verified facts, inference, benefit, cost of delay, cost of action, opportunity type, affected repositories, confidence, evidence maturity, assumptions, counterevidence, and expiration condition.

Every repository-fit decision must select exactly one disposition: absorb into an existing repository, create a package or plugin, run a temporary experiment, create a cross-repository initiative, create a service or research offer, defer, reject, or advance to repository genesis review.

## Scoring protocol

Each opportunity dimension is scored from zero to four with a rationale and evidence references. Fatal-gate dimensions are problem reality, evidence integrity, legal or policy viability when relevant, and ecosystem fit. Any fatal dimension below two blocks genesis review.

Genesis review requires at least six dimensions scored three or above, no fatal-gate failure, confidence of at least 0.82, at least two actor classes demonstrating behavior, and a bounded experiment capable of testing the most dangerous assumption.

An experiment-only recommendation may proceed at confidence 0.68 when expected cost and harm are low, reversal is easy, and the experiment has a named stop condition.

## Weekly subprocesses

Collection retrieves and timestamps evidence. Normalization resolves entities, dates, claims, and source types. Deduplication clusters repeated reports around the same underlying event. Verification identifies primary sources and contradictions. Change detection compares the current evidence graph against prior state. Actor mapping assigns each event to provider, supplier, builder, buyer, participant, media, funder, analyst, regulator, or researcher behavior. Pattern synthesis identifies repeated mechanisms without erasing domain differences. Strategic interpretation evaluates leverage, timing, benefit, and opportunity cost. Comparable analysis decomposes direct, adjacent, and failed analogues. Socratic descent exposes assumptions and falsifiers. Ecosystem-fit analysis determines whether an existing repository can contain the work. Adversarial review tries to defeat the recommendation. Experiment design targets the highest-risk assumption. Governance emits the final disposition and requests human approval when required.

## Human review shape

The review opens with the most consequential change in the landscape, then explains the actor behavior that makes it significant. It distinguishes what changed in the world from what changed in the system's confidence. It then describes strengthened patterns, weakened patterns, contradictions, and repository implications.

The review closes with no more than three strategic recommendations, no more than two experiments, no more than one genesis candidate, one attractive signal to ignore, one unresolved tension, one missing evidence class, and one question whose answer would materially alter the strategy.

## Machine validation

Validation fails when a claim lacks provenance, an inference is presented as fact, a relationship target is missing, a confidence score lacks rationale, a recommendation lacks counterevidence, a genesis candidate lacks comparable analysis, or a transition lacks the required human gate.

No-change runs remain valid and produce a compact receipt. Partial runs remain valid only when collection failures and unobserved domains are explicit.

## Review and calibration

Every quarter, accepted, rejected, and deferred recommendations are compared with later evidence. The system records false positives, false negatives, overconfidence, underconfidence, missed actor classes, and failed assumptions. Thresholds may be adjusted only through a reviewed change with preserved historical scoring.

The engine is judged not by the number of ideas produced but by traceability, calibration, restraint, experiment quality, portfolio coherence, and the durable value of approved actions.