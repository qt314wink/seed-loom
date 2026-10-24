#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "[visual-mechanism] repo: $ROOT"
echo "[visual-mechanism] node: $(node --version)"
echo "[visual-mechanism] npm: $(npm --version)"

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "ERROR: Node 22+ is required for analyzer-core." >&2
  exit 22
fi

echo "[visual-mechanism] installing root dependencies from root lockfile"
npm ci

ANALYZER="packages/analyzer-core"
if [ ! -f "$ANALYZER/package.json" ]; then
  echo "ERROR: $ANALYZER/package.json is missing." >&2
  exit 23
fi

if [ -f "$ANALYZER/package-lock.json" ]; then
  echo "[visual-mechanism] frozen analyzer-core install"
  npm ci --prefix "$ANALYZER"
else
  echo "NOTICE: analyzer-core has no checked-in package-lock.json."
  echo "NOTICE: using a local non-lockfile install with exact direct dependency versions."
  echo "NOTICE: do not commit a generated lockfile from this bootstrap."
  npm install --prefix "$ANALYZER" --package-lock=false --ignore-scripts --no-audit --no-fund
fi

echo "[visual-mechanism] baseline typecheck"
npm --prefix "$ANALYZER" run typecheck

echo "[visual-mechanism] baseline tests"
npm --prefix "$ANALYZER" test

echo "[visual-mechanism] bootstrap complete"
