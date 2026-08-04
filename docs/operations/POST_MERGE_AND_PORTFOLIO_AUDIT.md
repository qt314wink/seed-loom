# Post-merge and portfolio audit operation

This branch adds read-only proof tooling. It does not mutate canonical knowledge, accepted state, application UI, or unrelated repositories.

## Seed Loom aggregate proof

Run:

```bash
node scripts/portfolio/verify-post-merge.mjs
```

The command stops at the first failed stage and writes `knowledge/receipts/post-merge/latest.json`. A later successful manual command does not convert a failed aggregate run into a passing run; restart the aggregate proof from the beginning.

## Provider lifecycle and runner audit

From a parent directory containing checked-out repositories:

```bash
node seed-loom/scripts/portfolio/audit-provider-lifecycle.mjs \
  seed-loom omni-loom shader-gallery mochi-ui aether agent-runtime-control-center
```

The audit emits `portfolio-provider-lifecycle-audit.json`. Every result remains `review-required`. The script does not edit matches or infer migration safety.

Exit code `2` means at least one GitHub Models or retired-inference reference was found. Self-hosted runner and unpinned Action findings are review signals and do not prove vulnerability or outage.

## Acceptance gate

A reviewer must confirm:

- `npm ci` succeeds from a clean checkout;
- the aggregate proof completes every stage;
- both knowledge verification runs produce the expected deterministic outputs;
- generated receipts and workbench projections remain reproducible and noncanonical;
- provider-lifecycle findings receive one of: migrate, remove, replace, historical-only, false-positive, or unreachable;
- no source, secret, or production knowledge file was changed by the audit.
