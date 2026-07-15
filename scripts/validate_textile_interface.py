#!/usr/bin/env python3
"""Validate Textile Interface Language schemas, manifests, and Core references."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
INITIATIVE = ROOT / "initiatives" / "textile-interface"
SCHEMA_PATH = INITIATIVE / "schemas" / "textile-language.schema.json"
MANIFEST_DIR = INITIATIVE / "manifests"
SWATCH_REFERENCE = INITIATIVE / "reference" / "swatch-card" / "index.html"
EXPECTED_MANIFESTS = {
    "swatch-card.json",
    "thread-button.json",
    "quilt-panel.json",
}
REQUIRED_SWATCH_MARKERS = {
    "TIL-COMP-SWATCH-001",
    "prefers-reduced-motion",
    "forced-colors",
    "aria-live",
    "aria-expanded",
    "aria-controls",
    "focus-visible",
    "data-state",
}


def fail(message: str) -> int:
    print(f"FAIL: {message}", file=sys.stderr)
    return 1


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    if not SCHEMA_PATH.exists():
        return fail(f"Missing schema: {SCHEMA_PATH.relative_to(ROOT)}")

    schema = load_json(SCHEMA_PATH)
    validator = Draft202012Validator(schema)

    actual_manifests = {path.name for path in MANIFEST_DIR.glob("*.json")}
    missing = EXPECTED_MANIFESTS - actual_manifests
    unexpected = actual_manifests - EXPECTED_MANIFESTS
    if missing:
        return fail(f"Missing manifests: {', '.join(sorted(missing))}")
    if unexpected:
        return fail(f"Unexpected manifests create an ambiguous canonical set: {', '.join(sorted(unexpected))}")

    traceability_ids: set[str] = set()
    components: set[str] = set()

    for manifest_path in sorted(MANIFEST_DIR.glob("*.json")):
        manifest = load_json(manifest_path)
        errors = sorted(validator.iter_errors(manifest), key=lambda error: list(error.path))
        if errors:
            print(f"FAIL: {manifest_path.relative_to(ROOT)}", file=sys.stderr)
            for error in errors:
                location = ".".join(str(part) for part in error.path) or "<root>"
                print(f"  - {location}: {error.message}", file=sys.stderr)
            return 1

        component = manifest["component"]
        traceability_id = manifest["evidence"]["traceabilityId"]
        if component in components:
            return fail(f"Duplicate component name: {component}")
        if traceability_id in traceability_ids:
            return fail(f"Duplicate traceability ID: {traceability_id}")

        components.add(component)
        traceability_ids.add(traceability_id)
        print(f"PASS: {manifest_path.name} ({component}, {traceability_id})")

    if not SWATCH_REFERENCE.exists():
        return fail(f"Missing Core SwatchCard reference: {SWATCH_REFERENCE.relative_to(ROOT)}")

    reference = SWATCH_REFERENCE.read_text(encoding="utf-8")
    missing_markers = sorted(marker for marker in REQUIRED_SWATCH_MARKERS if marker not in reference)
    if missing_markers:
        return fail(f"SwatchCard reference is missing required markers: {', '.join(missing_markers)}")

    swatch_manifest = load_json(MANIFEST_DIR / "swatch-card.json")
    if swatch_manifest["performance"]["tier"] != "core":
        return fail("SwatchCard manifest must declare Core fidelity")
    if swatch_manifest["operation"] != "pleat":
        return fail("SwatchCard must retain the approved pleat operation")
    if swatch_manifest["evidence"]["traceabilityId"] not in reference:
        return fail("SwatchCard reference does not expose its manifest traceability ID")

    print("PASS: Core SwatchCard contains required semantics, fallbacks, and traceability markers")
    print(f"Textile Interface validation passed: {len(components)} manifests, 1 executable Core reference.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
