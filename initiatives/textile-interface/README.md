# Textile Interface Language

**Status:** incubation / v0.1 foundation  
**Repository:** Seed Loom  
**Working proposition:** a computational design language for tactile, material-aware interfaces.

## The opportunity

AI can generate attractive screens quickly, but it still struggles to preserve aesthetic intent across prompts, components, platforms, teams, and time. Textile Interface Language addresses that translation gap by encoding material character as explicit rules, tokens, forces, operations, and verification criteria.

This is not a textile-themed UI kit. It is a language for describing how an interface should look, behave, transition, degrade, and remain coherent.

## Core thesis

Textiles offer an unusually useful model for digital interaction because they combine:

- visible construction;
- material memory;
- tension, compression, slack, and recovery;
- layering and topology;
- repair, reuse, and traceability;
- cultural and emotional meaning.

These concepts can become executable interface primitives rather than decorative metaphors.

## System layers

1. **Material model** — linen, canvas, silk, felt, mesh, yarn, and derived physical properties.
2. **Construction grammar** — weave, stitch, pleat, gather, fold, drape, knot, fray, mend, and unravel.
3. **Force model** — tension, compression, friction, gravity, elasticity, weight, and recovery.
4. **Topology model** — relationships, navigation, history, progress, and state expressed as thread structures.
5. **Narrative grammar** — interface flow derived from making, joining, repairing, revealing, and archiving.
6. **Translation layer** — design tokens, Figma variables, React components, motion presets, shaders, accessibility mappings, and AI-builder prompts.
7. **Evidence layer** — every rule must be explicit, testable, reproducible, explainable, traceable, and versioned.

## What it is not

- not a collection of fabric textures;
- not a novelty cursor and particle system;
- not a single website theme;
- not motion without semantic cause;
- not a physics demo that sacrifices usability;
- not an aesthetic prompt pack with no implementation contract;
- not a replacement for accessibility, performance, or product logic.

## Initial product wedge

The first shippable artifact is a **Textile Interface Starter Standard** for AI-assisted product teams:

- language specification;
- token schema;
- 6 reference components;
- Figma variable map;
- React + Motion implementation contract;
- reduced-motion and low-power fallbacks;
- prompt adapters for AI builders;
- QA and conformance rubric;
- one reference experience demonstrating the system end to end.

## First users

The strongest initial audience is not every software team. It is teams where experience is part of the product value:

- cultural institutions and archives;
- premium retail and hospitality;
- design studios and creative technologists;
- fashion, textile, interiors, and material brands;
- AI-native product teams seeking a recognizable interface language;
- education and research groups exploring embodied interaction.

## Definition of v0.1 done

v0.1 is complete when a qualified designer or engineer can take the specification and independently produce a small interface whose materials, motion, semantics, accessibility behavior, and performance fallbacks can be verified against the same source of truth.

See:

- `SPECIFICATION.md`
- `ROADMAP.md`
- `schemas/textile-language.schema.json`
