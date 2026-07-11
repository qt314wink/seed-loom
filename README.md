# Seed Loom

**Seed Loom** is a lightweight repository for turning creative signals into structured systems: briefs, design-language extractions, essay engines, art-product pipelines, implementation specs, validation gates, and agent handoff instructions.

This repo currently hosts the **Signal-to-System Pipeline** as an executable workflow scaffold.

## Core idea

Most AI-assisted creative work fails because it stops at output. Seed Loom treats every input as a seed that should become a traceable system:

```txt
signal -> interpretation -> system -> artifact -> product -> ecosystem
```

## What is included

- `docs/SIGNAL_TO_SYSTEM_PIPELINE.md` — the operating manual
- `agent/AGENT_MODE_HANDOFF.md` — compact instructions for ChatGPT, Agent Mode, Cursor, Copilot, Replit, Kimi, or Perplexity
- `schemas/project-intake.schema.json` — structured project intake schema
- `templates/ENGINE_RUN_CARD.md` — one-page execution card for any project
- `figma/FIGMA_BOARD_SPEC.md` — Figma/FigJam mapping plan
- `.github/workflows/signal-validation.yml` — basic repository validation workflow
- `scripts/check_pipeline.py` — validates required files and JSON schema syntax

## The four engines

1. **Visual Grammar Engine** — extracts motifs, materials, palette, symbolic language, composition logic, prompt grammar, and negative constraints.
2. **Mythic Essay Engine** — turns notes and research into publishable longform essays with voice rules, section architecture, cover prompts, tags, and social excerpts.
3. **Art-to-Product Engine** — turns generative art collections into metadata, captions, alt text, SKU logic, Gumroad copy, print/PDF layout, and launch assets.
4. **Spec-to-Build Engine** — translates aesthetic intent into buildable implementation specs for React, Astro, WebGL, GLSL, R3F, Framer, and interactive prototypes.

## Out-of-the-box implementation idea

This repo is designed to become a **living evidence ledger**, not a static doc dump. Every project can get a run card with:

- source signal
- selected engine chain
- generated artifacts
- validation evidence
- failure modes
- handoff target
- product/publishing state

That means the work becomes cumulative. Each artifact becomes searchable, reusable, testable, and shippable.

## Recommended workflow

1. Open a new issue using the project intake format.
2. Choose the engine chain.
3. Generate a run card.
4. Produce outputs into `/docs`, `/templates`, `/products`, or `/case-studies`.
5. Validate using GitHub Actions.
6. Mirror the visual map in Figma/FigJam.

## Status

v0.1 scaffold — ready for expansion into docs, product pack, Figma map, and working agent templates.
