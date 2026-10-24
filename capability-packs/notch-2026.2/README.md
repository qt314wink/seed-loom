# Notch 2026.2 Capability Pack

This is a governed store of **portable creative mechanisms**, not a copy of the
Notch manual and not a binary-asset library. It turns the supplied Notch 2026.2
reference set into source-backed capability families, scene recipes, and target
adapter contracts.

## Start here

```sh
npm run capability:notch:verify
npm run capability:notch:test
npm run capability:notch:query -- --scene scene:radial-field-bloom --adapter adapter:shader-gallery
npm run capability:notch:handoff
```

The verifier emits a deterministic receipt to stdout. Its digest identifies the
exact semantic pack and source manifest a target implementation used.

The query command resolves a scene, its portable families, its permitted
adapter contracts, and the authoritative source records into a machine-readable
pull response. The handoff command resolves the vetted Shader Gallery request
into an executable JSON work order without writing to another repository.

## What can be pulled from the store

| Object | Pull when you need | Returns |
|---|---|---|
| Capability family | a mechanism, not an aesthetic label | inputs, outputs, constraints, source references, QA rules |
| Scene recipe | a composeable starting point | build order, parameter surface, target adapters, fallback requirements |
| Adapter contract | a target-specific translation | invariants, non-promises, implementation boundary, verification plan |

The five starter recipes are `radial-field-bloom`, `cellular-reconstruction`,
`signal-garden`, `optical-surface-ritual`, and `inference-matte-loop`.

## Canonical boundary

`notch-capability-pack.json` is the shared semantic source. A consumer must
record this pack ID and the verifier digest in its local manifest or receipt,
then implement and test in its own repository. A Notch block, `.fx` shader,
GLSL/WGSL shader, SVG filter, video project, mesh, texture, model, prompt, or
render is a **target-local derivative**.

That distinction is deliberate: Notch custom shaders are HLSL/D3DX `.fx`
resources, while WebGL and WebGPU have different languages, APIs, precision,
features, and performance ceilings. The reusable truth is the mechanism’s
contract—never a false claim that syntax or pixels will transfer untouched.

## Intake and rights

`source-manifest.json` retains official manual URLs and concise original
capability facts. It intentionally does not copy manual prose, screenshots,
example code, model weights, or proprietary block binaries. Add a leaf-page
fact only after reading that page; mark locator-only sources as such until then.

`user-supplied-locator-ledger.json` preserves all 128 unique official Manual
URLs from the supplied node-link set (129 supplied occurrences, including the
repeated 3D category link). URLs are stored as a pinned base plus canonical
relative path so they remain lossless, inspectable, and executable as links
without mirroring the Manual. The supplied Google video-search URL is retained
only as excluded discovery provenance, never as an authority.

## Pull contracts

- `capability-request.schema.json` is the portable, typed request contract.
- `capability-handoff.schema.json` is the deterministic resolved work-order
  contract.
- `handoffs/shader-gallery-radial-field-bloom.request.json` is the first
  concrete request, bound to `MelodicBloom/shader-gallery` `main` at
  `93a0bd01aaefbed7094f803cfdf1134087302196` as observed on 2026-10-23.

The request intentionally chooses a stateless GLSL approximation for its first
Shader Gallery proof. It preserves fixed-seed and reduced-motion behavior while
declaring that persistent field feedback would require a separately reviewed
multi-pass runtime change. The clever part is modest: it treats a missing
runtime feature as evidence to name, rather than a feature to smuggle in.

## Promotion

The pack is a candidate. To move one family or adapter to `reviewed`, attach a
target-local implementation receipt with the pack digest, commands and exit
codes, target runtime/version, result artifacts, observed limitations, and a
human review decision. Approval is separate; a prettier preview is not a
promotion ceremony.
