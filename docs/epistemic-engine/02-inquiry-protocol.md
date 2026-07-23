# Epistemic Design Engine — Inquiry Protocol

Status: proposed v0.1

## Purpose

The inquiry protocol turns vague language and missing information into the smallest useful set of quality questions. It is not an interview script. It is a self-investigation system that decides what must be asked, what can be inferred, what should remain open, and when further questioning has lower value than testing.

## Question families

1. **Essence** — What is this? What must remain true? What would make it cease to be itself?
2. **Purpose** — For whom, toward what outcome, under what conditions?
3. **Boundary** — What is included, excluded, deferred, forbidden, or unsafe to assume?
4. **Contrast** — What is it not? What is its opposite? What nearby category would misclassify it?
5. **Adjacency** — What resembles it, supports it, precedes it, follows it, or offers a useful analogy?
6. **Causality** — What could produce the observed result? What must be true for the target to occur?
7. **Force** — What supports, constrains, catalyzes, weakens, dominates, or must yield?
8. **Paradox** — Which opposing qualities must coexist? Which contradiction is identity-bearing?
9. **Edge** — Where does it become too much, too little, incoherent, unsafe, or unusable?
10. **Evidence** — What is directly observed? What is reported? What is inferred? What would disprove it?
11. **Action** — What is the next reversible move? What decision is actually required now?
12. **Reflection** — What did the system overlook, assume, flatten, or resolve prematurely?

## Question record

Every generated question must declare:

- `question_id`
- target entity and field
- question family
- reason for asking
- information gain estimate from 0.0 to 1.0
- blocking status
- answerability source: human, document, test, computation, external research, or observation
- risk if unanswered
- expected downstream decisions affected
- expiration or revisit condition

## Selection logic

Questions are ranked by:

```txt
priority = information_gain × decision_impact × uncertainty × answerability
           − cost − delay − redundancy
```

The equation is comparative, not a claim of objective truth. Human review may override ranking, but the override reason must be recorded.

The engine asks a question when at least one condition is true:

- the answer could change the chosen path;
- the unknown blocks safe or valid action;
- the question distinguishes two viable candidates;
- the answer would reveal a hidden constraint or assumption;
- the question is required for provenance, consent, cultural specificity, or accountability.

The engine does not ask when:

- the value is directly observable and already recorded;
- a low-cost reversible test is more informative;
- the answer has no material effect on the current decision;
- the question duplicates another with equal or higher information gain;
- the request exceeds declared scope.

## Recursive descent

Each answer is examined for vagueness. Terms such as “premium,” “innovative,” “natural,” “simple,” or “intuitive” must descend until they reach one or more terminals:

- observable fact;
- explicit human preference or decision;
- measurable parameter;
- executable operation;
- testable condition;
- recorded unresolved ambiguity.

Recursion stops when the next question would not materially improve action, confidence, safety, or explanation.

## Self-investigation cycle

After every candidate solution, the system asks:

- What did I infer that was not stated?
- What evidence is weakest?
- Which alternative did I underrepresent?
- Did I mistake familiarity for fit?
- Did I turn a spectrum into a false binary?
- Did I use a number as false precision?
- Did I resolve a productive contradiction?
- What would a skeptical reviewer attack first?
- What is the smallest test that could change my mind?
- Is the output actionable now, or merely articulate?

## Constraints

- Maximum default blocking queue: five questions.
- Questions must be singular enough to answer without unpacking multiple hidden questions.
- Leading questions must be labeled.
- Questions about identity, culture, consent, or harm cannot be answered solely by stylistic analogy.
- The system may not endlessly recurse to avoid making a reversible decision.
- A human may mark a question `declined`; the engine must then narrow scope or lower confidence rather than fabricate an answer.

## Gates

G0 target linkage: every question points to a field, decision, or uncertainty.  
G1 non-redundancy: semantic duplicate rate below threshold.  
G2 answer utility: blocking questions demonstrably affect a decision branch.  
G3 recursion terminal: every inquiry path ends in a valid terminal.  
G4 self-critique: each major candidate receives the reflection cycle.  
G5 human usability: questions are understandable without ontology knowledge.

## Benchmarks

- At least 80% of blocking questions judged materially relevant by an independent reviewer.
- Less than 10% duplicate or compound questions in the evaluated set.
- Median blocking queue of five or fewer.
- At least one disconfirming question for every major inference.
- At least 90% of accepted questions identify the downstream field or decision they affect.
- Human answer time should remain under three minutes per ordinary question unless explicitly classified as research work.

## QA

Run semantic-duplicate detection, compound-question linting, leading-language detection, question-to-decision trace checks, unanswered-blocker detection, and human review for clarity and emotional burden. Compare generated questions against a baseline checklist and record whether the adaptive protocol found important unknowns the checklist missed.

## Conditions for continued life

The protocol remains active only if it produces better decisions or more honest stopping conditions than a fixed questionnaire. If questioning delays reversible work without increasing decision quality, the ranking logic must be recalibrated. Domain-specific question packs may live only while their questions show measurable information gain and avoid unsupported cultural or professional authority.