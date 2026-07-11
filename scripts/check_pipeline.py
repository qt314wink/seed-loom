#!/usr/bin/env python3
"""Validate Seed Loom workflow scaffold."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "README.md",
    "docs/SIGNAL_TO_SYSTEM_PIPELINE.md",
    "agent/AGENT_MODE_HANDOFF.md",
    "schemas/project-intake.schema.json",
    "templates/ENGINE_RUN_CARD.md",
    "figma/FIGMA_BOARD_SPEC.md",
]


def main() -> int:
    missing = [path for path in REQUIRED_FILES if not (ROOT / path).exists()]
    if missing:
        print("Missing required files:")
        for path in missing:
            print(f"- {path}")
        return 1

    schema_path = ROOT / "schemas/project-intake.schema.json"
    try:
        json.loads(schema_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON schema: {exc}")
        return 1

    print("Seed Loom scaffold validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
