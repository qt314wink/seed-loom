# Epistemic Design Engine — Repository Boundary Addendum

Status: normative addendum
Version: 0.1.0
Applies to: `docs/epistemic-engine/**`

## Purpose

This addendum prevents the Epistemic Design Engine from becoming a second orchestration runtime, persistence layer, product UI framework, or cross-repository control plane. It assigns one canonical owner to each responsibility and defines the interfaces between them.

## Canonical ownership

### Seed Loom owns

- reasoning contracts and semantic resolution rules;
- candidate, assumption, alternative, paradox, resolution, and quality-result schemas;
- deterministic `solveField()` behavior;
- visual-language semantics, governed recipes, and local provenance structures;
- provider-neutral interfaces for evidence interpretation;
- fixtures and tests proving deterministic reasoning behavior.

Seed Loom does not own durable scheduling, credentials, repository mutation, deployment, or organization-wide task execution.

### MelodicBloom Agent Runtime Control Center owns

- task scheduling, retries, locks, timeouts, and cancellation;
- approval gates and default-deny authorization;
- GitHub App authentication and short-lived installation tokens;
- tool execution, repository allowlists, and mutation policy;
- operational traces, budgets, and circuit breakers;
- read-only audit execution and later mutation promotion.

The runtime may call Seed Loom contracts. It must not redefine them.

### MelodicBloom data platform owns

- durable decisions, evidence receipts, relationships, versions, and historical reconstruction;
- append-only event persistence;
- embeddings and retrieval indexes;
- workspace membership and publication state;
- long-lived provenance links across repositories.

Seed Loom may emit persistence-ready records but must not become the canonical database.

### Product repositories own

- bounded consumption of canonical contracts;
- local adapters, components, stories, and tests;
- declared overrides and compatibility reports;
- product-specific user flows and presentation.

Product repositories may not silently fork canonical semantics. Any fork must carry an origin, version, reason, and compatibility status.

## Prohibited responsibility drift

The Epistemic Design Engine must not add the following without a separate architecture decision:

- autonomous recursive agents;
- repository write tools;
- deployment clients;
- production secrets;
- organization-wide queues;
- long-lived workflow state;
- user authentication;
- a second evidence database;
- UI redesign unrelated to reasoning inspection;
- provider-specific behavior embedded in canonical schemas.

## Interface contracts

### Seed Loom → Agent Runtime

Input: a versioned reasoning request.

Output: a deterministic resolution object and execution receipt containing:

- contract version;
- input hash;
- candidates;
- assumptions;
- alternatives;
- unresolved tensions;
- selected resolution;
- quality results;
- provenance links;
- failure or incompleteness status.

### Agent Runtime → Seed Loom

The runtime supplies:

- task identity;
- approved scope;
- caller identity;
- allowed providers;
- execution deadline;
- evidence references;
- requested output contract version.

The runtime does not alter reasoning records after generation. Corrections are appended as superseding records.

### Seed Loom → MelodicBloom data platform

Records are persistence-ready but storage-neutral. Every record must include:

- stable ID;
- schema version;
- created timestamp or deterministic fixture timestamp;
- actor or engine identity;
- source evidence IDs;
- parent decision ID when applicable;
- supersedes or invalidates relationship when correcting prior state.

## Dependency direction

Allowed:

```text
product repository
  → Seed Loom contracts
  → Agent Runtime execution envelope
  → MelodicBloom persistence
```

Also allowed:

```text
Agent Runtime
  → Seed Loom package/API
  → persistence adapter
```

Forbidden:

```text
Seed Loom
  → product-specific UI internals
Seed Loom
  → GitHub mutation tools
Seed Loom
  → production deployment credentials
product repository
  → private Agent Runtime database tables
```

## Approval gate

A future Epistemic Design Engine PR may merge only when it states:

1. canonical owner for every new responsibility;
2. exact allowed paths;
3. dependencies introduced or consumed;
4. persistence behavior;
5. mutation capability, which must default to none;
6. deterministic fixtures;
7. rollback path;
8. cross-repository compatibility impact.

## Definition of done

This boundary is effective when:

- the implementation sequence references it;
- `solveField()` is shipped as a bounded, storage-neutral slice;
- Agent Runtime remains the sole owner of execution authority;
- durable evidence is stored outside Seed Loom through an adapter;
- product repositories consume contracts without redefining them.
