# Textile Interface Language Roadmap

## Strategic pathway in

The entry point is not a universal design framework. It is a narrowly useful standard that helps AI-assisted teams generate distinctive interfaces without losing consistency, accessibility, or performance.

### Wedge

Ship one small, credible system that can be understood by a designer, implemented by an engineer, and consumed by an AI agent.

**Starter Standard contents**

1. v0.1 language specification;
2. JSON schema and example manifests;
3. six reference components;
4. Figma variable and component-property map;
5. React + Motion reference package;
6. CSS/SVG core fallback;
7. prompt adapters for major AI builders;
8. conformance test suite;
9. one complete reference experience;
10. case study documenting translation from source imagery to system.

## Phase 0 — Foundation

**Goal:** prove that the language is explicit enough to implement independently.

Deliverables:

- governing laws;
- material, operation, force, and topology primitives;
- schema v0.1;
- token naming convention;
- component contract template;
- definition of done;
- non-goals and failure modes.

Pass criteria:

- schema validates at least three distinct component manifests;
- two implementers can interpret the same manifest with materially consistent behavior;
- reduced-motion behavior is specified rather than improvised;
- every decorative effect has a documented semantic role.

## Phase 1 — Reference components

**Goal:** demonstrate the language across ordinary product UI, not only spectacle.

Components:

1. SwatchCard;
2. ThreadButton;
3. NavThreadLink;
4. QuiltPanel;
5. YarnLoader;
6. SectionHeader.

Each component requires:

- default, hover, focus, active, selected, disabled, loading, and error states where applicable;
- semantic HTML contract;
- keyboard behavior;
- reduced-motion variant;
- core, enhanced, and immersive fidelity definitions;
- Storybook examples;
- visual regression tests;
- performance evidence.

## Phase 2 — Translation adapters

**Goal:** make one source of truth usable across tools.

Outputs:

- Figma Variables JSON;
- Tokens Studio export;
- Tailwind theme mapping;
- CSS custom properties;
- TypeScript types;
- Framer Motion presets;
- AI-builder system prompt;
- agent handoff instructions.

Pass criteria:

- generated outputs retain semantic names;
- no adapter becomes the canonical source;
- round-trip changes are detectable;
- invalid or unsupported values fail loudly.

## Phase 3 — Reference experience

**Goal:** prove the language can organize an entire product surface.

Build a small public site containing:

- manifesto;
- interactive material explorer;
- component laboratory;
- token and grammar viewer;
- accessibility controls;
- performance tier toggle;
- downloadable machine-readable manifests.

The reference experience must remain useful with JavaScript motion disabled and without WebGL.

## Phase 4 — Field validation

**Goal:** determine whether the language produces measurable operational value.

Pilot with 3–5 teams in experience-led sectors. Measure:

- time from brief to first coherent prototype;
- number of manual design corrections;
- cross-screen consistency;
- accessibility defects discovered before release;
- prompt iteration count;
- implementation divergence from source intent;
- perceived distinctiveness and usability.

A pilot succeeds when teams can reuse the language on a second feature without direct author intervention.

## Phase 5 — Productization

Possible product layers:

- open core specification and schema;
- paid Figma and code libraries;
- premium material dialect packs;
- team governance and conformance tooling;
- compiler/API for generating adapters;
- workshops and implementation services;
- certification for conforming products or agencies.

## Near-term positioning

Use the phrase:

> A material-aware interface language for humans and AI agents.

Avoid prematurely positioning it as an operating system, universal compiler, or replacement for established design systems. Earn that scope through adoption and evidence.

## Non-negotiables

- semantic coherence over visual novelty;
- progressive enhancement over mandatory spectacle;
- accessibility before metaphor;
- machine readability from the beginning;
- traceable decisions and evidence;
- no dependency on a single framework, model, or vendor;
- reference implementations that are genuinely buildable.

## Immediate next issue sequence

1. Approve primitive vocabulary and non-goals.
2. Finalize schema v0.1 and three manifests.
3. Define token package structure.
4. Implement SwatchCard at Core fidelity.
5. Add conformance checks and CI.
6. Create Figma variable mapping.
7. Build the public specification page.
