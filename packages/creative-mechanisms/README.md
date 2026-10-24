# Creative Mechanisms Registry — Notch 2026.2 intake v0.1

A deliberately bounded Seed Loom knowledge-and-compilation experiment. This is not a Notch manual mirror, a Notch plugin, a runnable Notch project, or a claim that Notch nodes have been transplanted into WebGL.

## What exists

- The user-supplied 2026.2 documentation URL inventory is in catalog/notch-2026.2.json. All 128 distinct links are retained with status: 6 selectively reviewed and 122 link-only.
- Six mechanism descriptions are candidate contracts in catalog/mechanisms.json, validated by schema/creative-mechanisms.schema.json. The records preserve native parameter **labels**, not invented defaults, units, ranges or mathematical equivalence.
- The only implemented portable runtime target is an **original square Truchet quarter-arc approximation** rendered as standalone SVG. It is not a native Notch shader or a faithful Style B reconstruction.
- A read-only CLI can validate, list, inspect or resolve contracts. Unimplemented targets fail closed and never emit pretend assets.
- Source provenance is registered once in ../../knowledge/sources/source-notch-manual-2026-2.json, using Seed Loom's existing Source schema.

## Commands (run from repository root after npm ci)

    node packages/creative-mechanisms/scripts/registry.mjs validate
    node --test packages/creative-mechanisms/test/registry.test.mjs
    node packages/creative-mechanisms/scripts/registry.mjs list
    node packages/creative-mechanisms/scripts/registry.mjs inspect pattern.truchet
    node packages/creative-mechanisms/scripts/registry.mjs resolve field.reaction-diffusion --target=webgl2
    node packages/creative-mechanisms/scripts/registry.mjs compile pattern.truchet --seed=35 --grid=12 > truchet.svg

Compile writes the SVG to stdout and a SHA-256 execution receipt to stderr. It does not modify files or fetch remote content. Do not redirect stderr into the SVG. The SVG output can be embedded in a gallery, used as a mask or overlaid in SVG Filter Lab.

## Ownership and integration

**Seed Loom:** mechanism meaning, constraints, evidence status, translation requests, candidate ontology and receipt format.
**shader-grammar:** optical operator and material equations; preserve its four-schema authority. Do not redefine it here.
**shader-gallery, svg-filter-lab, kaleidoscopic-motion, texture/video projects:** consumer-specific adapters, demos, animation and performance tests.
**Agent Runtime Control Center:** credentials, scheduled discovery, locks, security, approvals, remote Notch execution and cross-repo writes.
**Data platform:** long-lived storage, artifact blobs, cross-repo index, embeddings, derivation graph and immutable run history.

The official Notch Manual MCP endpoint (https://mcp-manual.notch.one/) should be treated as an optional *read-only discovery source*. It is early-access and its URL may change. A connection is not configured or claimed here.

## Promotion gates

1. Link-only is not reviewed. A linked node is not portable. A candidate is not approved.
2. Promote a translation only with precise port/parameter mapping, input/output units, time and color-space semantics, reproducible fixture, failure tests, measured runtime profile and captured visual comparison.
3. Stateful effects require explicit seeds, initial state, fixed-step strategy, reset behavior, precision, boundary conditions and stability limits. A pretty frame cannot substitute for dynamics parity.
4. Shader transfer must distinguish Notch HLSL (.fx), WebGL GLSL, WebGPU WGSL, JavaScript and SVG filters. Binary native projects and shader code must not be assumed reusable or available.
5. Licenses, redistribution rights, privacy, attribution and source freshness are manual review gates. The package contains only original synthesis and source links, not replicated official manuals, examples or media.
6. Fail closed on unsupported targets, unknown parameter values, non-finite numbers, unknown IDs, and unapproved state changes.

## Initial applications and next slice

- Texture grammar: Voronoi, Truchet, material masks and selective grain recipes.
- Field/simulation grammar: reaction diffusion, curl-noise advection and temporal ink feedback.
- Scene and mesh grammar: HLSL deformer semantics to become backend-neutral mesh operations with verified shader adapters.
- Inference: report candidate mechanisms and uncertainty for reverse image prompting; never imply an input image has been exactly reconstructed.

Next: compare a Truchet SVG fixture under SVG Filter Lab and shader-gallery; then build a typed field/temporal intermediate representation before attempting multi-engine simulation. A consumer PR should pin this registry commit SHA and capture its own reproducible rendered screenshot or video, frame-time statistics and rollback point.

Scope is intentionally smaller than the requested final ecosystem: see docs/plans/2026-10-22-notch-creative-mechanisms.md for sequenced remaining work.