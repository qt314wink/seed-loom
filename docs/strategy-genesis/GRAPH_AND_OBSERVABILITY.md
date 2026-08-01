# Knowledge Graph and Observability

## Where the graph lives

The canonical graph lives in Git under `knowledge/`. Nodes are JSON records in typed directories. Explicit edges live in `knowledge/relationships/`. Receipts, runs, acknowledgements, and provenance records are also nodes. Generated indexes, telemetry, summaries, and workbench data are projections and may be rebuilt.

Git provides version history, review, rollback, and content-addressed provenance. No database is authoritative in v0.

## Explore the graph

```bash
npm run knowledge:graph
```

Open `http://127.0.0.1:4177`.

The Graph Workbench rebuilds `tools/graph-workbench/data.json`, then displays explicit relationships plus derived reference edges. Search across complete records, filter by type, select a node, inspect its canonical file, confidence, state, neighbors, provenance fields, and raw record.

The current renderer is intentionally dependency-free and appropriate for a small graph. When node count, layout complexity, or analysis requirements become measurable constraints, replace only the renderer with Cytoscape.js; keep the projection contract and canonical JSON unchanged.

## Local observability without paid services

The default observability backend is `knowledge/telemetry/pipeline-events.jsonl`. Run:

```bash
npm run knowledge:verify:observed
```

This emits one trace identifier and one span-like event per pipeline stage. Each event records stage name, command, timestamps, result, exit code, and branch. The file is local, grep-able, diff-able, and can be included in failure artifacts.

Optional free trace UI:

```bash
npm run observability:up
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318 npm run knowledge:verify:observed
```

Open Jaeger at `http://127.0.0.1:16686` and select `seed-loom-knowledge`.

Stop it with:

```bash
npm run observability:down
```

Jaeger is a view, not a source of truth. The run records, stage acknowledgements, JSONL telemetry, and receipts remain authoritative evidence.

## Signal boundaries

Knowledge observability answers: what claim, source, relationship, confidence, and governance transition exists?

Pipeline observability answers: what stage ran, with what inputs, for how long, and whether it passed?

Product analytics answers: how humans use the Graph Workbench. This is not collected in v0 because it adds privacy and operational cost without current decision value.

## Retention

Keep canonical graph records indefinitely unless governed deletion is required. Keep telemetry JSONL bounded by size or review period. Keep CI failure artifacts for seven days. Never place credentials, full copyrighted documents, confidential material, or unnecessary personal data in telemetry.

## Future adapters

DuckDB may query JSON and JSONL directly when longitudinal analysis becomes inconvenient. RDF/PROV export may support interoperability. Cytoscape.js may replace the simple SVG renderer for compound layouts and graph algorithms. OpenTelemetry Collector or Grafana Alloy may be introduced when multiple processes or machines need routing, redaction, sampling, and backend fan-out. None of these should become canonical storage.
