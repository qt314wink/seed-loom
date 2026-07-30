# Daily intelligence intake contract

The existing daily intelligence automation remains the collection and preliminary synthesis surface. It must not become a second source of truth. Each run should emit a human briefing and a machine-readable record compatible with `knowledge/schema/run.schema.json`.

The automation should capture no more than five materially distinct stories, classify each source and actor behavior, distinguish fact from inference, identify affected repositories, and create only captured, candidate, or source-backed knowledge. It should compare against recent records to avoid duplicate observations and should issue a no-change receipt when no material change exists.

The daily run may propose relationships, pattern candidates, opportunities, experiments, and repository actions. It may not mark a pattern accepted, create a production repository, merge code, spend funds, contact outside parties, or submit applications. A repository-genesis candidate may be mentioned only as an early watch signal unless it satisfies the weekly gates; the weekly protocol remains the formal genesis review surface.

Machine output fields are: runId, retrievalWindow, newObservations, updatedObservations, candidatePatterns, newRelationships, contradictions, opportunities, proposedExperiments, repositoryActions, noChangeReceipts, and collectionFailures. Every observation must preserve verified facts, inference, significance, confidence, evidence maturity, source references, affected repositories, assumptions, limitations, and approval state.
