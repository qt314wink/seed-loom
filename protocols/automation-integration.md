# Daily automation integration

The retained daily intelligence automation is the intake edge of this system. It does not own the graph and must not write accepted knowledge.

Each run should inspect the previous forty-eight hours, deduplicate against recent observations, identify materially new evidence, classify actor behavior, and emit both a readable briefing and a machine-readable `ResearchRun` object. The readable briefing may explain strategic implications, but all claims must remain linked to observation and source identifiers.

The automation should treat provider, supplier, builder, buyer, participant, media, funder, analyst, regulator, and researcher behavior as separate lenses. A behavior claim requires an inspectable action. Commentary about intent is inference and must be labeled as such.

Pattern candidates may be created only when at least two observations share a mechanism. Opportunity candidates may be created only when at least two actor classes show movement and counterevidence is recorded. Repository-genesis language is watch-only in daily runs. Formal genesis evaluation occurs in the weekly review under the full gate protocol.

Any proposed repository action must name the repository, branch, allowed paths, forbidden paths, validation steps, rollback path, and approval gate. Collection failure is a first-class output. When no material change is found, the automation should emit a no-change receipt instead of manufacturing novelty.
