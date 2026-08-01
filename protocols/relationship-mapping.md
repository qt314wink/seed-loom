# Relationship mapping protocol

Relationship records express claims about how nodes connect. They do not replace the source evidence that supports those claims.

Each edge must identify a resolvable source node and target node, a controlled predicate, confidence, and one or more evidence references. Direction matters. `FUNDS`, for example, runs from a funder to an initiative; `SUPPORTED_BY` runs from a claim or pattern to its evidence.

Actor-specific predicates map operational behavior: providers provide, suppliers supply, builders build, buyers buy, participants participate, media cover, funders fund, analysts analyze, regulators regulate, and researchers research. Interpretive predicates map knowledge movement: supported by, derived from, contradicts, refines, supersedes, may enable, may threaten, tested by, implemented in, owned by, and requires approval.

Relationships are append-only. When an edge is no longer current, set its validity end or add a superseding or contradictory edge. Never silently rewrite the graph to erase disagreement. Confidence belongs to the relationship claim, not to either endpoint.

A weekly review should inspect both node changes and edge changes. New edges can be more important than new nodes because category formation often appears first as previously separate actors beginning to interact.
