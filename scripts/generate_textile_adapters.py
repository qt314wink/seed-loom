#!/usr/bin/env python3
"""Generate deterministic Textile Interface adapters from the canonical token source."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "initiatives" / "textile-interface"
SOURCE = BASE / "tokens" / "textile.tokens.json"
GENERATED = BASE / "generated"


def value(tokens: dict, *path: str):
    node = tokens
    for part in path:
        node = node[part]
    return node["$value"]


def outputs(tokens: dict) -> dict[Path, str]:
    easing = value(tokens, "motion", "threadButton", "easing")
    duration = value(tokens, "motion", "threadButton", "durationMs")
    radius = value(tokens, "shape", "threadButton", "radiusPx")
    border = value(tokens, "shape", "threadButton", "borderPx")
    press_scale = value(tokens, "motion", "threadButton", "pressScale")
    tension = value(tokens, "force", "threadButton", "tension")
    compression = value(tokens, "force", "threadButton", "compression")
    elasticity = value(tokens, "force", "threadButton", "elasticity")
    recovery = value(tokens, "force", "threadButton", "recovery")

    css = f"""/* GENERATED. DO NOT EDIT. */
:root {{
  --til-color-linen: {value(tokens, 'color', 'linen')};
  --til-color-surface: {value(tokens, 'color', 'surface')};
  --til-color-ink: {value(tokens, 'color', 'ink')};
  --til-color-indigo: {value(tokens, 'color', 'indigo')};
  --til-color-focus: {value(tokens, 'color', 'focus')};
  --til-thread-button-tension: {tension};
  --til-thread-button-compression: {compression};
  --til-thread-button-elasticity: {elasticity};
  --til-thread-button-recovery: {recovery};
  --til-thread-button-duration: {duration}ms;
  --til-thread-button-easing: cubic-bezier({', '.join(map(str, easing))});
  --til-thread-button-press-scale: {press_scale};
  --til-thread-button-radius: {radius}px;
  --til-thread-button-border: {border}px;
}}
"""

    ts = f"""// GENERATED. DO NOT EDIT.
export const textileTokens = {{
  color: {{ linen: '{value(tokens, 'color', 'linen')}', surface: '{value(tokens, 'color', 'surface')}', ink: '{value(tokens, 'color', 'ink')}', indigo: '{value(tokens, 'color', 'indigo')}', focus: '{value(tokens, 'color', 'focus')}' }},
  threadButton: {{ tension: {tension}, compression: {compression}, elasticity: {elasticity}, recovery: {recovery}, durationMs: {duration}, easing: [{', '.join(map(str, easing))}] as const, pressScale: {press_scale}, radiusPx: {radius}, borderPx: {border} }}
}} as const;
export type TextileTokens = typeof textileTokens;
"""

    motion = json.dumps({
        "threadButton": {
            "initial": {"scale": 1},
            "tap": {"scale": press_scale},
            "transition": {"duration": duration / 1000, "ease": easing},
            "forces": {"tension": tension, "compression": compression, "elasticity": elasticity, "recovery": recovery},
        }
    }, indent=2) + "\n"

    figma = json.dumps({
        "version": tokens["version"],
        "collections": {
            "Textile Interface": {
                "modes": ["Core"],
                "variables": {
                    "color/linen": value(tokens, "color", "linen"),
                    "color/surface": value(tokens, "color", "surface"),
                    "color/ink": value(tokens, "color", "ink"),
                    "color/indigo": value(tokens, "color", "indigo"),
                    "force/threadButton/tension": tension,
                    "force/threadButton/compression": compression,
                    "force/threadButton/recovery": recovery,
                    "motion/threadButton/durationMs": duration,
                    "shape/threadButton/radiusPx": radius,
                }
            }
        }
    }, indent=2) + "\n"

    return {
        GENERATED / "textile.css": css,
        GENERATED / "textile.tokens.ts": ts,
        GENERATED / "motion.presets.json": motion,
        GENERATED / "figma.variables.json": figma,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    tokens = json.loads(SOURCE.read_text(encoding="utf-8"))
    expected = outputs(tokens)
    stale = []
    for path, content in expected.items():
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                stale.append(path.relative_to(ROOT))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
            print(f"wrote {path.relative_to(ROOT)}")
    if stale:
        print("Generated adapters are stale:")
        for path in stale:
            print(f"- {path}")
        return 1
    if args.check:
        print("Generated Textile adapters are synchronized.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
