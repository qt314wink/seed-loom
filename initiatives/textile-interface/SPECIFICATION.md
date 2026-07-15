# Textile Interface Language Specification v0.1

## 1. Purpose

Textile Interface Language (TIL) defines a portable grammar for translating textile qualities into coherent digital interface behavior. It is intended for humans, design tools, code generators, and autonomous agents.

A conforming implementation must preserve agreement between:

1. intent;
2. specification;
3. implementation;
4. observable behavior;
5. measurable evidence.

## 2. Governing laws

1. **Every movement implies a force.** Motion without a physical or semantic cause is non-conforming.
2. **Nothing merely appears.** Content unfolds, gathers, stitches, drapes, or emerges from an identified prior state.
3. **Nothing merely disappears.** Content folds, unthreads, recedes, frays, or transfers elsewhere.
4. **Decoration must perform semantic work.** Thread, texture, fold, and weave may not be added solely as ornament in core flows.
5. **Material determines behavior.** A declared material profile must affect at least two of motion, surface, sound, depth, or latency.
6. **Transitions preserve state memory.** The user should be able to infer where an element came from and where it went.
7. **Accessibility overrides metaphor.** Semantics, keyboard flow, contrast, readability, and reduced motion take precedence.
8. **Performance degradation preserves meaning.** Fallbacks may reduce fidelity but not interaction clarity.
9. **Every rule is traceable.** Components must identify the material, operation, force profile, and state transition they use.
10. **No hidden completion.** A component is not complete without observable evidence and pass/fail criteria.

## 3. Primitive classes

### 3.1 Materials

A material profile defines surface and response characteristics.

Required properties:

- `roughness`: 0–1
- `sheen`: 0–1
- `mass`: 0–1
- `stiffness`: 0–1
- `damping`: 0–1
- `memory`: 0–1
- `porosity`: 0–1
- `textureScale`: positive number
- `interactionLatencyMs`: 0–240

Reference profiles:

| Material | Roughness | Mass | Stiffness | Damping | Memory | Intended use |
|---|---:|---:|---:|---:|---:|---|
| Linen | .68 | .38 | .44 | .62 | .56 | Default surfaces, editorial content |
| Canvas | .82 | .72 | .76 | .78 | .82 | Structural panels, navigation, tools |
| Silk | .16 | .22 | .18 | .30 | .24 | Highlights, transitions, premium reveal |
| Felt | .90 | .54 | .48 | .88 | .66 | Quiet states, containment, accessibility-safe depth |
| Mesh | .42 | .18 | .26 | .34 | .18 | Networks, filtering, relationships |

### 3.2 Construction operations

Each operation changes geometry, state, or relationship.

- `weave`: interlace parallel information streams;
- `stitch`: commit or bind a state;
- `pleat`: compress information while retaining retrievability;
- `gather`: converge related items toward a shared focus;
- `fold`: hide or compact while preserving spatial origin;
- `drape`: allow content to span or overlap boundaries;
- `knot`: create a persistent relationship or constraint;
- `fray`: signal uncertainty, incompleteness, or edge degradation;
- `mend`: repair a broken state while retaining evidence of the repair;
- `unravel`: progressively reverse a constructed state.

Every operation must declare:

- trigger;
- source state;
- destination state;
- geometry rule;
- motion profile;
- semantic meaning;
- interruption behavior;
- reduced-motion equivalent;
- success evidence;
- failure evidence.

### 3.3 Forces

Forces are normalized from 0–1 unless otherwise stated.

- `tension`
- `compression`
- `slack`
- `gravity`
- `friction`
- `elasticity`
- `drag`
- `recovery`

A force profile must map to implementation values such as spring stiffness, damping, mass, duration, path curvature, displacement, or shader amplitude.

### 3.4 Topology

Thread topology expresses relationships:

- path = navigation or sequence;
- crossing = relationship or comparison;
- knot = commitment or persistent dependency;
- loose end = unresolved work;
- splice = merged source or repaired continuity;
- selvage = system boundary;
- warp = stable structure;
- weft = variable content.

Thread graphics must have a textual or structural equivalent for nonvisual use.

## 4. Token namespaces

Required namespaces:

- `material.*`
- `thread.*`
- `weave.*`
- `stitch.*`
- `fold.*`
- `drape.*`
- `tension.*`
- `compression.*`
- `motion.*`
- `texture.*`
- `topology.*`
- `a11y.*`
- `performance.*`
- `evidence.*`

Tokens should express semantics before implementation. Prefer `motion.recovery.medium` over `duration.320` at the component contract layer.

## 5. Reference interaction mapping

| User event | Textile operation | Force | Meaning |
|---|---|---|---|
| Hover/focus | tension | light | readiness, relationship |
| Press | stitch + compression | medium | commitment |
| Expand | unfold | recovery | reveal retained content |
| Collapse | pleat/fold | compression | compact without loss |
| Drag | drape/pull | drag | direct manipulation |
| Save | stitch/knot | tension then settle | persistent state |
| Undo | unpick/unravel | reverse tension | reversible commitment |
| Error | fray | irregular tension | broken edge or incomplete structure |
| Repair | mend/splice | controlled recovery | restored continuity with history |
| Loading | weave | periodic tension | construction in progress |

## 6. Component contract

Every component must declare:

```yaml
component: SwatchCard
material: linen
operation: pleat
forces:
  tension: 0.24
  compression: 0.18
  recovery: 0.58
states: [default, hover, focus, active, selected, disabled, loading, error]
a11y:
  semanticRole: article
  reducedMotion: opacity-and-shadow-only
performance:
  tier: core
  maxMainThreadMs: 8
evidence:
  visualRegression: required
  keyboardTest: required
  reducedMotionTest: required
```

## 7. Fidelity tiers

- **Core:** CSS/SVG only; no essential canvas dependency.
- **Enhanced:** Motion library and limited particles or filters.
- **Immersive:** WebGL/WebGPU, cloth simulation, or shader surfaces.

Core must remain fully usable. Enhanced and Immersive layers are progressive enhancement.

## 8. Conformance gates

A component passes when:

- declared tokens resolve;
- all states are implemented;
- keyboard and focus behavior are complete;
- reduced-motion mode preserves state meaning;
- contrast meets the product’s required standard;
- animation remains interruptible;
- no critical action depends on texture, motion, or color alone;
- mobile fallback meets the same semantic contract;
- implementation evidence links back to the declared operation and force profile.

It fails when any visible textile effect has no defined semantic role, when the metaphor reduces usability, or when an agent cannot reconstruct the intended behavior from the specification.
