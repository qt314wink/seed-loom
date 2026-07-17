# RFC: Recursive Socratic Component System

## Status

Proposed foundational architecture for Seed-Loom.

## Thesis

Seed-Loom should not merely store reusable components. It should be able to **interrogate, define, disambiguate, invoke, adapt, verify, and explain** them across any build or site.

The governing loop is:

```txt
observe → question → disambiguate → define → compile → invoke → observe use → compare → revise
```

The key distinction is that a reusable object is not only code. It is a traceable bundle of:

- observed evidence
- interpretation
- alternatives
- constraints
- semantic role
- visual behavior
- commercial role
- implementation contract
- invocation contract
- verification evidence
- version history
- feedback from use

A component may be called into any project only when the system can explain:

1. why it fits,
2. what evidence supports the fit,
3. what changed during adaptation,
4. what invariants were preserved,
5. what risks remain,
6. how the result should be tested.

---

# I. Foundational inquiry planes

Each candidate component, system, style, pattern, or design object is interrogated through multiple independent planes. No single plane is allowed to determine the final classification.

## 1. Component foundation

### Structural questions

- What is the smallest complete unit here?
- Which parts are essential, and which are replaceable?
- What breaks if one layer is removed?
- Which elements carry meaning versus decoration?
- Where are the true boundaries of the component?
- Is this one component, a family, or a temporary composition?
- Which behaviors belong to the component and which belong to its environment?
- Does the component remain itself when content, scale, or context changes?

### Behavioral questions

- What can the component do?
- What can act upon it?
- Which states are visible, latent, transitional, or irreversible?
- What should happen when the component is uncertain, incomplete, overloaded, or contradicted?
- What does failure look like materially and semantically?
- Which behaviors must remain deterministic?
- Which behaviors may vary generatively?

### Invocation questions

- What is the minimum information required to call this component into a new build?
- Which parameters are mandatory, inferred, defaulted, or forbidden?
- Can it be invoked by semantic role rather than by exact name?
- Can the system find this component by function, feeling, material, commercial goal, interaction goal, or narrative role?
- What evidence must accompany automatic invocation?
- What must trigger human review?

---

## 2. Commercialization foundation

- What value does this object create independently?
- What value appears only when it joins another system?
- Is it a product, feature, proof, lead magnet, premium differentiator, or infrastructure?
- Who can buy it, license it, embed it, extend it, or resell it?
- What is the smallest sellable unit?
- What is the largest defensible package?
- Which outcomes can be measured before and after adoption?
- What commercial promises are provable?
- What claims are attractive but not yet defensible?
- Does reuse increase margin, reduce delivery time, improve quality, or create lock-in?
- Which parts should remain open, paid, private, certified, or enterprise-only?
- What recurring revenue loop can emerge from usage data, updates, verification, or adaptation?
- Does the component become more valuable as more projects use it?
- What licensing boundary preserves platform gain without preventing adoption?

---

## 3. Visual rendering foundation

- What visual qualities are structural rather than cosmetic?
- Which effects survive without images, WebGL, or external assets?
- Which effects require shader, canvas, SVG, DOM, video, or 3D geometry?
- What is the cheapest faithful rendering path?
- What is the highest-fidelity rendering path?
- What degrades first under performance pressure?
- Which depth cues communicate hierarchy, confidence, or state?
- Where should the rendering remain flat for readability?
- Which visual changes indicate semantic changes?
- How does the object respond to light, scale, motion, and neighboring surfaces?
- Can visual fidelity be scored against the source interpretation?
- What rendering substitutions are acceptable?

---

## 4. Texture and material foundation

- What material is being represented?
- Is the material literal, metaphorical, procedural, or symbolic?
- Which physical properties generate the visual rules?
- What are the material's roughness, reflectivity, compression, elasticity, grain, porosity, thickness, edge behavior, and aging behavior?
- Which interaction states should alter those properties?
- What does wear communicate?
- What does polish communicate?
- Which materials may coexist without losing coherence?
- Which material pairings create productive tension?
- What texture density remains legible at each scale?
- Which textures belong in surfaces, borders, controls, illustrations, transitions, or status indicators?
- How should reduced-motion and low-power modes preserve material meaning?

---

## 5. Color foundation

- Which colors are observed and which are inferred?
- Which colors are primitives, semantic roles, states, accents, warnings, or atmospheric fields?
- What does each hue do, not merely resemble?
- Which colors indicate certainty, danger, lineage, validation, sale, scarcity, or attention?
- How does color behave under different materials?
- Which relationships matter more than exact hex values?
- What is the acceptable variance range?
- What colors must never be adjacent?
- How does the palette degrade for accessibility, print, low-light, or monochrome use?
- Can a palette be invoked by emotional or functional goal while preserving lineage?

---

## 6. Narrative foundation

- What story does this component imply before any copy appears?
- What role does it play: threshold, guide, witness, archive, proof, invitation, warning, reward, or transformation?
- What must remain unresolved?
- What should the component reveal immediately?
- What should it withhold until interaction?
- Does it orient, instruct, seduce, reassure, challenge, or certify?
- What narrative change occurs between states?
- Does the component preserve tension or prematurely resolve it?
- What metaphor is doing real explanatory work?
- What metaphor is merely decorative?
- What story does the failure state tell?

---

## 7. Communication foundation

- What must a user understand in three seconds?
- What can wait thirty seconds?
- What requires explicit explanation?
- What can be learned through interaction?
- What should the interface demonstrate instead of describe?
- Which terms require canonical definitions?
- Where is ambiguity useful?
- Where is ambiguity dangerous?
- What evidence should be visible by default?
- How should uncertainty be communicated without destroying trust?
- What should be machine-readable, human-readable, or both?
- Which explanations belong inline, in a drawer, in documentation, or in the ledger?

---

## 8. Categorization foundation

- What category does the object claim?
- What category does its behavior imply?
- What category would a buyer use?
- What category would a developer use?
- What category would a designer use?
- What category would an analyzer infer?
- Which categories are mutually exclusive?
- Which categories are orthogonal planes?
- What evidence supports each category?
- What category changes over time or context?
- Which labels should remain provisional?
- What should happen when classification confidence is low?

---

# II. Recursive Socratic descent

The inquiry process descends until it reaches measurable or implementable terms.

## Level 0: Stated intent

> “Make this feel tactile and premium.”

## Level 1: Meaning

- What does tactile mean here?
- What does premium mean here?
- What would disprove either interpretation?

## Level 2: Observable evidence

- Which visual cues indicate tactility?
- Which layout or interaction cues indicate premium positioning?
- What evidence exists in the source material?

## Level 3: Parameters

- shadow depth
- edge softness
- material roughness
- interaction compression
- typography scale
- spacing density
- motion duration
- contrast range

## Level 4: Implementation

- CSS variables
- SVG filter
- shader uniforms
- React props
- motion variants
- asset references

## Level 5: Verification

- visual regression
- interaction test
- performance budget
- accessibility check
- source-fidelity score
- human review

## Recursion rule

Every answer may produce another question until one of these terminals is reached:

- directly observable fact
- explicit human decision
- measurable parameter
- executable implementation
- testable condition
- unresolved ambiguity recorded for review

No answer may silently become a token without traversing this chain.

---

# III. Anti-questions and edge discovery

Anti-questions are intentionally indirect. They search for missing boundaries, hidden incentives, social meaning, failure conditions, and non-obvious dependencies.

## Temporal anti-questions

- What remains after this component is removed?
- What becomes embarrassing in five years?
- What becomes more valuable through wear?
- What should never age visually?
- What evidence would future maintainers wish had been preserved?

## Social anti-questions

- Who gains status when this component appears?
- Who feels excluded by its visual language?
- What behavior does it reward without saying so?
- What kind of user does it assume?
- What power relationship is hidden inside the interaction?

## Ecological anti-questions

- What does this object consume: attention, compute, data, labor, trust, or physical resources?
- What waste does it produce?
- What can be composted, reused, or inherited?
- What dependency becomes fragile at scale?

## Somatic anti-questions

- Where does the eye hesitate?
- Where does the hand expect resistance?
- What creates tension in the body?
- What makes the interface feel safe enough to explore?
- What feels sharp even when nothing is visually sharp?

## Cultural anti-questions

- Which references are being borrowed?
- What meanings change across cultures?
- What becomes cliché outside its original context?
- What is being aestheticized without understanding?
- Which symbols require provenance or caution?

## Operational anti-questions

- What will support staff be asked repeatedly?
- What will break during migration?
- What will be impossible to debug from logs alone?
- What hidden manual step is being disguised as automation?
- What should the system refuse to infer?

## Commercial anti-questions

- What would make this easy to copy but hard to trust?
- What part creates switching cost ethically?
- What part should competitors be allowed to imitate?
- What evidence would justify a premium price?
- What customer behavior would make the business model worse?

## Narrative anti-questions

- What is the component trying not to say?
- What answer arrives too early?
- What tension should be protected?
- What would happen if the component never resolved?
- What story appears when the user refuses the intended path?

---

# IV. Cross-comparison engine

The system compares answers across inquiry planes to find reinforcement, contradiction, and leverage.

## Comparison types

### Reinforcement

Two planes independently support the same decision.

Example:

- Material inquiry: velvet absorbs light and creates protected emphasis.
- Commercial inquiry: premium plans require clear differentiation.

Result:

- Velvet becomes a premium-tier semantic material, not a general background.

### Contradiction

Two planes produce incompatible requirements.

Example:

- Rendering inquiry: dense texture creates fidelity.
- Communication inquiry: dense texture harms code readability.

Result:

- Texture moves to the frame and state indicators; code remains flat.

### Hidden dependency

One plane exposes a requirement another plane assumed away.

Example:

- Invocation inquiry: component can be called by semantic role.
- Categorization inquiry: semantic roles are not canonicalized.

Result:

- Invocation is blocked until role vocabulary is versioned.

### Leverage point

One decision improves multiple planes.

Example:

- Provenance trace improves trust, debugging, commercial defensibility, documentation, and model training.

Result:

- Provenance becomes mandatory infrastructure.

## Comparison matrix fields

Each decision record should include:

- question IDs
- answer summaries
- agreement score
- contradiction score
- evidence strength
- commercial impact
- user impact
- implementation cost
- reversibility
- confidence
- chosen resolution
- rejected alternatives
- required tests

---

# V. Reusable object architecture

## The Callable Design Object

Every reusable object is packaged as a `CallableDesignObject`.

```ts
interface CallableDesignObject {
  id: string;
  version: string;
  names: string[];
  roles: string[];
  capabilities: string[];
  sourceEvidence: EvidenceRef[];
  interpretations: InterpretationRef[];
  invariants: Invariant[];
  parameters: ParameterDefinition[];
  variants: VariantDefinition[];
  materials: MaterialDefinition[];
  motion: MotionDefinition[];
  narrativeRoles: string[];
  commercialRoles: string[];
  invocationRules: InvocationRule[];
  adaptationRules: AdaptationRule[];
  compatibility: CompatibilityProfile;
  verification: VerificationContract;
  provenance: ProvenanceRecord;
}
```

## Invocation pathways

A component may be called by:

- exact ID
- component family
- functional role
- interaction goal
- commercial goal
- emotional register
- material family
- narrative role
- accessibility need
- performance budget
- visual similarity
- source lineage

Example:

```txt
invoke component where:
role = "evidence attachment"
material = "copper"
interaction = "expand provenance"
commercial_context = "enterprise"
performance_budget <= 8kb
```

## Explainable retrieval

Every retrieval returns:

- selected object
- confidence
- matching evidence
- rejected candidates
- adaptation plan
- invariant preservation report
- risk report
- expected verification checks

## Adaptation contract

Adaptation may change:

- scale
- content
- density
- palette within allowed ranges
- interaction timing
- layout orientation
- rendering implementation

Adaptation may not silently change:

- semantic role
- protected symbol meaning
- accessibility contract
- provenance requirements
- commercial license boundary
- critical material behavior

---

# VI. Interlocking system architectures

## Architecture A: Inquiry Graph

Stores questions, answers, follow-up questions, anti-questions, evidence, contradictions, and decisions.

```txt
Question
  → Answer
  → Evidence
  → Follow-up Question
  → Alternative Answer
  → Contradiction
  → Decision
```

Gain:

- reusable reasoning
- visible uncertainty
- fewer repeated discovery cycles
- auditable interpretation

## Architecture B: Design Object Registry

Stores callable components, symbols, materials, patterns, motions, narrative structures, and commercial packages.

Gain:

- cross-project reuse
- faster build assembly
- versioned design intelligence
- marketplace inventory

## Architecture C: Translation Compiler

Compiles one canonical design object into:

- CSS
- Tailwind
- React
- Web Components
- Figma tokens
- SVG
- GLSL
- motion definitions
- prompts
- JSON

Gain:

- portability
- reduced handoff loss
- lower implementation cost
- measurable fidelity

## Architecture D: Compatibility and Composition Engine

Scores whether objects can coexist.

Checks:

- visual coherence
- semantic conflict
- token collision
- motion conflict
- performance cost
- accessibility interaction
- commercial license compatibility
- narrative redundancy

Gain:

- prevents Frankenstein systems
- supports dynamic assembly
- makes composition explainable

## Architecture E: Evidence Ledger

Records every invocation, adaptation, decision, reversal, test, and outcome.

Gain:

- trust
- compliance
- debugging
- defensible authorship
- enterprise readiness

## Architecture F: Outcome Feedback Engine

Observes what happens after deployment.

Signals:

- conversion
- engagement
- abandonment
- task completion
- accessibility failures
- performance
- reuse frequency
- human overrides
- support questions
- commercial value

Gain:

- components improve from use
- recommendations become evidence-based
- pricing becomes defensible
- weak patterns can be retired

## Architecture G: Marketplace and Licensing Layer

Packages design objects as products with explicit scope, evidence, compatibility, and verification.

Gain:

- recurring revenue
- certified implementation tiers
- enterprise governance
- creator attribution
- network effects

---

# VII. Feedback loops

## Loop 1: Use improves retrieval

```txt
invocation → use outcome → evidence → ranking update → better invocation
```

## Loop 2: Questions improve schemas

```txt
unanswered question → recurring ambiguity → schema extension → clearer future analysis
```

## Loop 3: Failures improve constraints

```txt
failure → ledger event → anti-pattern → validation rule → fewer repeated failures
```

## Loop 4: Commercial outcomes improve packaging

```txt
purchase/use data → value evidence → package refinement → stronger pricing and positioning
```

## Loop 5: Cross-project reuse improves defensibility

```txt
more implementations → more verified evidence → stronger object confidence → higher trust and licensing value
```

## Loop 6: Human corrections improve interpretation

```txt
human override → contradiction record → model/rule update → more accurate future analysis
```

---

# VIII. Defensible platform gain

The platform advantage is not the visual style alone. It is the accumulated, queryable relationship between:

- source evidence
- interpretation
- decision
- reusable object
- implementation
- outcome
- correction

Competitors may copy a component's appearance. They cannot easily copy the accumulated evidence of:

- why it exists
- where it works
- how it adapts
- what it conflicts with
- how it performs commercially
- which failures shaped its constraints
- how reliably it translates across environments

This creates five defensible assets:

1. **Interpretation graph** — structured evidence and meaning.
2. **Callable object registry** — reusable cross-platform design intelligence.
3. **Compatibility graph** — proven composition relationships.
4. **Outcome graph** — performance and commercial evidence.
5. **Verification history** — trust, provenance, and reproducibility.

---

# IX. Recommended implementation order

## Phase 1: Canonical inquiry schema

Create schemas for:

- Question
- Answer
- AntiQuestion
- Evidence
- Contradiction
- Decision
- InquiryRun

## Phase 2: Callable Design Object schema

Create the versioned invocation and adaptation contract.

## Phase 3: Registry and semantic retrieval

Support exact, role-based, material-based, narrative, commercial, and similarity retrieval.

## Phase 4: Compatibility engine

Score component combinations and explain conflicts.

## Phase 5: Compiler adapters

Compile canonical objects into supported build targets.

## Phase 6: Outcome telemetry

Collect privacy-safe operational, commercial, accessibility, and reuse evidence.

## Phase 7: Marketplace and certification

Sell verified, portable, explainable design objects and system packs.

---

# X. Definition of done

The system is not complete when it can display a component library.

It is complete when a user can ask:

> “Call in a tactile evidence component that feels protective, works in a dark enterprise dashboard, stays under 10 KB, and preserves Omni-Loom lineage.”

And Seed-Loom can return:

- the selected object,
- why it was selected,
- what alternatives were rejected,
- how it must adapt,
- what cannot change,
- what it costs to render,
- how it should be verified,
- and a traceable implementation package for the target build.
