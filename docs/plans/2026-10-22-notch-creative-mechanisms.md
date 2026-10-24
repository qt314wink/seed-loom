# Notch 2026.2 Creative Mechanisms Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox syntax for tracking.

**Goal:** Make external procedural techniques retrievable, explainable, testable, translatable and selectively executable by Seed Loom-controlled agents without forking canonical owners.

**Architecture:** An official link catalog feeds provenance-backed candidate mechanism contracts. A validated, storage-neutral registry exposes discovery and translation status. Native execution and cross-repository mutations remain with Agent Runtime; consumer adapters own rendering. Initial compiler is an original, bounded Truchet SVG implementation.

**Tech Stack:** Node 22 ESM, JSON Schema 2020-12, Ajv, node:test, SVG, GitHub Actions; planned WebGL2/GLSL, WebGPU/WGSL, Canvas2D and Notch HLSL/JavaScript as separately verified backends.

## Global Constraints

- Preserve existing Seed Loom 1.1.0 source IDs, provenance and approval semantics.
- Preserve docs/epistemic-engine/09-repository-boundary.md and docs/SHADER_GRAMMAR.md.
- No copied Notch documentation content, native node source, proprietary example media, or implied Notch execution.
- No auto-promotion: linked-only → reviewed → mapped → implemented → measured → approved requires separate evidence and human authority.
- Unknown source freshness, default values, shader parity, licensing and target support must remain explicit.
- Every compiler must be deterministic where a seed and fixed time allow it; otherwise declare nondeterminism and capture reset/step evidence.
- No writes to other repositories, deployment or unapproved connectors in this slice.

---

### Task 1 — Link and claim provenance (implemented on feature branch; verification pending)

**Files:** knowledge/sources/source-notch-manual-2026-2.json; packages/creative-mechanisms/catalog/notch-2026.2.json; packages/creative-mechanisms/catalog/mechanisms.json; packages/creative-mechanisms/schema/creative-mechanisms.schema.json

**Interfaces:** JSON catalog of 128 URL records → six version-pinned semantic candidates. Source record must satisfy knowledge/schema/source.schema.json.

- [x] Add exact node links as supplied, deduplicate and tag selectively-reviewed versus linked-only.
- [x] Add six original mechanism summaries, Notch source parameter labels and translation risks.
- [x] Maintain no defaults or inferred native node equivalence.
- [ ] Gate: run node packages/creative-mechanisms/scripts/registry.mjs validate and npm run knowledge:validate; both must exit zero before promotion.
- [ ] Commit verification receipt from CI and confirm source IDs resolve in the knowledge index without altering previous IDs.

### Task 2 — Controlled semantic lookup and original SVG specimen (implemented on feature branch; verification pending)

**Files:** packages/creative-mechanisms/scripts/registry.mjs; packages/creative-mechanisms/test/registry.test.mjs; .github/workflows/creative-mechanisms.yml

**Interfaces:** validate/list/inspect/resolve/compile CLI. Compile accepts only pattern.truchet to web-svg; produces complete SVG on stdout and receipt on stderr.

- [x] Add schema and referential checks, fail-closed unsupported-target resolution.
- [x] Add finite bounded seed, grid, tile, stroke and hex colors.
- [x] Add seeded quarter-arc tiles and output SHA-256 receipt.
- [x] Add focused tests for count, uniqueness, source status, URL allowlist, determinism, bounds and unsupported targets.
- [ ] Gate: npm ci; node --test packages/creative-mechanisms/test/registry.test.mjs; compile and compare exact output digest twice.
- [ ] Cross-browser visual check in Chromium at phone and desktop sizes; record screenshots and orientation/contrast QA.

### Task 3 — Portable intermediate representation and multi-engine adapters (proposed)

**Proposed files:** packages/creative-mechanisms/schema/operation-ir.schema.json; packages/creative-mechanisms/adapters/canvas2d.mjs; packages/creative-mechanisms/adapters/webgl2.mjs; packages/creative-mechanisms/test/operation-ir.test.mjs

**Interfaces:** candidate contracts → typed OperationIR containing operation, inputs, fields, state, time, seed, coordinate system, color space, units, required features, provenance, fidelity and unsupported features. Output typed translation receipt per engine.

- [ ] Add a fixture rejecting missing time-step on a stateful operation and a fixture rejecting untyped normalized parameter ranges.
- [ ] Implement a pure, schema-validated OperationIR compiler that cannot invoke a backend itself.
- [ ] Create read-only web adapters only for explicit supported operations; unsupported operations return blocked diagnostics.
- [ ] Run focused adapter tests; verify expected failure for unsupported HLSL vertex deformation, and repeat fixed-time-step simulation outputs.
- [ ] Record visual parity **differences** between engines; never assert pixel identity without a measured tolerance and approved fixture.

### Task 4 — Consumer reuse and reverse-prompt tests (proposed)

**Proposed files:** packages/creative-mechanisms/fixtures/truchet.svg; docs/creative-mechanisms/CONSUMER_COMPATIBILITY.md; consumer repos own import/render tests.

**Interfaces:** pinned registry SHA + compiled asset + receipt → shader-gallery, SVG Filter Lab, palette/motion lab and reverse prompt analyzer; reverse path: image feature hypotheses → candidate mechanism IDs → bounded patches → render → discrepancy report.

- [ ] In SVG Filter Lab compare original SVG tile specimen with a known static reference at 375px and 1440px.
- [ ] In Shader Gallery add a manifest-linked candidate card, not a shipped material claim.
- [ ] In reverse prompt analyzer test retrieval precision on three synthetic patterns and require uncertainty on unfamiliar images.
- [ ] Benchmark animation separately: frame times, GPU memory, device pixel ratio and reduced-motion fallback. A 60fps claim requires measured frame times on target device.
- [ ] Record source registry commit, consumer commit, render SHA, device, browser, test result and reviewer disposition.

### Task 5 — Live reference intake and controlled Notch native validation (proposed)

**Proposed files:** packages/creative-mechanisms/adapters/notch-mcp-readonly.mjs; docs/creative-mechanisms/NOTCH_VALIDATION_PROTOCOL.md (paths not yet created).

**Interfaces:** Notch official Manual MCP read-only response → quoted short evidence and official URL → candidate change proposal. Runtime, not Seed Loom, handles credentials and native execution authorization.

- [ ] Configure and authorize official https://mcp-manual.notch.one/ connector in a supported client; verify exact returned tools and revision.
- [ ] Implement quota-bounded search with output schema checks, source timestamp and method. Persist no bulk manual dumps; hash only locally generated summaries and citations.
- [ ] Require manual confirmation before creating Notch projects, script execution, native exports or downloading .dfx/.fx files.
- [ ] Test direct HLSL-to-GLSL/WGSL translations separately against known mesh, normals, topology and motion vectors; native Notch build must be tested on a licensed compatible Windows GPU machine.
- [ ] Defer remote execution if Notch licensing, capabilities, hardware or export permission are not verified.

## Reuse and extension ownership

- Seed Loom: canonical concepts, source links, candidate status, normative translation contract, bounded recipes.
- Shader Grammar: material optics and operator equations; consume it by version, do not duplicate.
- Agent Runtime: scheduling, GitHub mutation, Notch execution, budgets, approvals and retries.
- Data platform: durable asset storage, immutable evidence, graph indexes and search embeddings.
- Product repos: local scene and UI assets, adapters, performance profiles, preview/gallery presentation.

## Unresolved product decisions

- Whether Notch-specific controls should be modeled only as native label metadata or versioned adapter parameter maps after live validation.
- Whether cross-org consumer imports should use pinned npm package releases, Git submodule/commit links, or an API-backed artifact registry.
- Which Windows machine and Notch license tier may legally and practically run native parity tests.
- Which data platform is the approved durable owner for derived assets and binary clips.
- Which visual equivalence tolerance and mobile performance budget are acceptable per output class.

No application, native shader or external project is considered ported merely because its catalog entry exists.