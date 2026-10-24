# Capability-Pack Pull Request Template

Use this request when an agent, a human collaborator, or another system needs a
reusable mechanism. It is deliberately compact enough to pass through chat,
issues, APIs, or a repository work order.

For a validated machine-readable request, use
`capability-request.schema.json`, then emit a resolved work order with:

```sh
npm run capability:notch:handoff -- --request capability-packs/notch-2026.2/handoffs/shader-gallery-radial-field-bloom.request.json
```

The emitter verifies that the request's pack digest is current, that the scene
and adapter exist, and that the adapter names the target repository before it
prints any work order.

```yaml
capabilityPack:
  id: capability-pack:notch:2026.2:creative-systems
  digest: REQUIRED_FROM_capability:notch:verify
request:
  mechanism: family:procedural-field # or a scene:* identifier
  targetAdapter: adapter:shader-gallery
  targetRepository: MelodicBloom/shader-gallery
  targetRef: REQUIRED_FULL_SHA
  outcome: "One sentence describing the observable result."
  allowedVariation:
    - "Target implementation details only."
  preserve:
    - "Seed/time semantics"
    - "Named parameter ranges"
    - "Pause or reduced-motion route"
  constraints:
    performanceBudget: TO_MEASURE
    accessibility: "Keyboard access and reduced-motion behavior."
    assetRights: "Source and output use confirmed before ingestion."
  nonGoals:
    - "No automatic deployment or publication."
    - "No claim of Notch pixel parity."
  requiredReceipt:
    - "pack ID and digest"
    - "target repository, branch, base and final full SHAs"
    - "changed files by purpose"
    - "commands, exit codes, runtime/browser/GPU environment"
    - "visual/performance evidence and fallback result"
    - "known deviations, residual risks, and explicit non-actions"
```

Stop if the requested target does not have a verifiable base, the adapter
contract does not name the target class, an asset’s rights are unclear, or the
request needs a mechanical cross-language conversion rather than an authored,
tested adaptation.
