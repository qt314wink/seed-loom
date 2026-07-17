# RFC: Material Truth Layer

## Thesis

Seed-Loom should not merely render a tactile interface. It should use material behavior as an inspectable diagnostic language.

The interface becomes a living debugger:

- a broken provenance link appears as a snapped or unthreaded stitch
- unsupported inference produces a clipped, translucent, or incomplete petal
- token collision creates crossed threads or a visible knot
- schema drift twists a cactus rib out of alignment
- inaccessible contrast dulls the affected pigment and reveals a warning spine
- missing reduced-motion behavior causes the motion filament to remain visibly unbound
- a passing verification gate blooms, closes the seam, and adds a brass eyelet as a durable receipt

This is not decoration. Every visual mutation is generated from a machine-readable diagnostic state and links back to its evidence record.

## Why this is strategically useful

1. **The product demonstrates its own thesis.** Seed-Loom translates abstract system status into coherent visual language in real time.
2. **Failures become legible before reading logs.** A user can see where the system broke, then inspect the exact trace.
3. **The visual identity becomes defensible.** Floral, cactus, textile, ceramic, and metallic forms are attached to contracts rather than stylistic preference.
4. **Screenshots become evidence.** Visual regression artifacts double as state receipts for the evidence ledger.
5. **Commercial differentiation improves.** Competing analyzers return labels and palettes; Seed-Loom returns a self-explaining material system with visible integrity.

## Core diagnostic contract

```ts
type MaterialDiagnostic = {
  id: string;
  severity: 'info' | 'candidate' | 'warning' | 'error' | 'verified';
  domain: 'evidence' | 'interpretation' | 'token' | 'translation' | 'verification';
  materialResponse:
    | 'thread-reveal'
    | 'stitch-break'
    | 'petal-clip'
    | 'bud-hold'
    | 'rib-twist'
    | 'spine-alert'
    | 'pigment-dull'
    | 'seam-fray'
    | 'bloom-seal'
    | 'eyelet-stamp';
  sourceIds: string[];
  affectedTokenPaths: string[];
  message: string;
  remediation?: string;
  reversible: boolean;
};
```

## Five-rib behavior

### Evidence rib — Root integrity

Shows whether observations are directly supported by source regions.

- complete roots: evidence coverage is strong
- floating roots: source region missing
- split roots: contradictory observations
- copper root node: human-confirmed evidence

### Interpretation rib — Branch coherence

Shows whether the system preserves alternatives and uncertainty.

- open branch: alternatives remain live
- closed bud: candidate interpretation awaiting review
- clipped petal: unsupported interpretive leap
- asymmetric bloom: evidence distribution is uneven

### Token rib — Weave consistency

Shows whether canonical values are traceable and collision-free.

- regular weave: stable token family
- knot: naming or semantic collision
- loose thread: orphan token
- changed thread color: inheritance override

### Code rib — Translation fidelity

Shows whether exported targets preserve the canonical contract.

- aligned ribs: target parity
- twisted rib: target-specific drift
- missing stitch: unsupported translation target
- glass overlay: generated preview

### Verification rib — Durable receipt

Shows the aggregate release state.

- unopened flower: checks pending
- partial bloom: some gates passing
- complete bloom: all required gates passing
- brass eyelet: immutable evidence receipt written
- frayed selvedge: release blocked

## Visual regression as provenance

Each approved screenshot should be registered as an evidence artifact with:

- commit SHA
- viewport and browser
- active analyzer stage
- token bundle hash
- source reference version
- reduced-motion setting
- screenshot hash
- approval actor
- superseded baseline ID, when applicable

A screenshot change is therefore not merely accepted or rejected. It is explained, versioned, and connected to the exact material and token changes that produced it.

## Proposed interface feature: Pull the Thread

Every component receives a small thread endpoint on focus or hover. Activating it opens a trace drawer:

`visible surface → component state → semantic token → interpretation → evidence region → source artifact`

The same drawer can reverse direction:

`source evidence → all derived tokens → components → exports → products`

This becomes the central interaction signature of Seed-Loom.

## Proposed feature: Disambiguation Garden

Alternative interpretations are arranged as buds on branches. Users may:

- keep multiple buds alive
- prune an interpretation without deleting its history
- graft a useful branch into another system
- mark a bloom as validated
- reopen a bloom when new evidence appears

The metaphor maps directly onto append-only evidence and reversible decisions.

## Proposed feature: Material Stress Test

A control temporarily exaggerates system conditions:

- low contrast
- reduced motion
- narrow viewport
- missing evidence
- conflicting tokens
- translation target failure
- high information density

The interface visibly stresses: seams tighten, layers compress, spines surface, and unsupported parts fray. This provides a memorable QA mode while remaining tied to real checks.

## Implementation order

1. Add `MaterialDiagnostic` fixture data for the five current stages.
2. Add a diagnostic renderer that maps states to CSS data attributes.
3. Add the Pull the Thread trace drawer.
4. Register Playwright screenshots as evidence artifacts.
5. Add Material Stress Test controls.
6. Connect diagnostics to the eventual analyzer and evidence ledger APIs.

## Definition of done

The Material Truth Layer is valid when:

- every material mutation maps to a diagnostic record
- every diagnostic record links to evidence or a test result
- no failure is represented only by color or animation
- reduced-motion mode preserves the diagnostic meaning
- screenshots can be traced to commit, tokens, viewport, and source version
- a reviewer can identify the failing system layer visually and then inspect its exact technical cause
