#!/usr/bin/env python3
"""Validate Seed Loom scaffold, asset cards, and evidence events."""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "README.md",
    "docs/SIGNAL_TO_SYSTEM_PIPELINE.md",
    "agent/AGENT_MODE_HANDOFF.md",
    "schemas/project-intake.schema.json",
    "schemas/asset.schema.json",
    "schemas/evidence-event.schema.json",
    "templates/ENGINE_RUN_CARD.md",
    "figma/FIGMA_BOARD_SPEC.md",
]

SCHEMA_MAP = {
    "portfolio/assets": "schemas/asset.schema.json",
    "portfolio/evidence": "schemas/evidence-event.schema.json",
}


def load_json(path: Path) -> tuple[dict | None, str | None]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except json.JSONDecodeError as exc:
        return None, f"Invalid JSON in {path.relative_to(ROOT)}: {exc}"


def validate_against_schema(data: dict, schema: dict, path: Path) -> list[str]:
    if not HAS_JSONSCHEMA:
        return []
    validator = jsonschema.Draft202012Validator(schema)
    return [
        f"{path.relative_to(ROOT)}: {err.message}"
        for err in validator.iter_errors(data)
    ]


def main() -> int:
    errors: list[str] = []

    # 1. Required files
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).exists():
            errors.append(f"Missing required file: {rel}")

    # 2. All JSON files in schemas/ must be valid JSON
    for schema_file in (ROOT / "schemas").glob("*.json"):
        data, err = load_json(schema_file)
        if err:
            errors.append(err)

    if not HAS_JSONSCHEMA:
        print("jsonschema not installed — skipping deep validation. Run: pip install jsonschema")
    else:
        # 3. Validate asset cards and evidence events against their schemas
        for folder_rel, schema_rel in SCHEMA_MAP.items():
            folder = ROOT / folder_rel
            schema_path = ROOT / schema_rel
            if not schema_path.exists():
                continue
            schema_data, schema_err = load_json(schema_path)
            if schema_err:
                errors.append(schema_err)
                continue
            for json_file in folder.rglob("*.json"):
                data, err = load_json(json_file)
                if err:
                    errors.append(err)
                    continue
                errors.extend(validate_against_schema(data, schema_data, json_file))

    if errors:
        print(f"Validation failed with {len(errors)} error(s):")
        for e in errors:
            print(f"  - {e}")
        return 1

    asset_count = len(list((ROOT / "portfolio" / "assets").rglob("*.json"))) \
        if (ROOT / "portfolio" / "assets").exists() else 0
    event_count = len(list((ROOT / "portfolio" / "evidence").rglob("*.json"))) \
        if (ROOT / "portfolio" / "evidence").exists() else 0

    print("Seed Loom scaffold validation passed.")
    print(f"  Assets:  {asset_count}")
    print(f"  Events:  {event_count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
