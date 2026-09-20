#!/usr/bin/env bash
set -euo pipefail

ROOT="${SEED_LOOM_PATH:-$(pwd)}"
SECONDARY_REPO="${SECONDARY_REPO:-qt314wink/nextjs-boilerplate}"
SECONDARY_PATH="${SECONDARY_REPO_PATH:-$ROOT/.worktrees/nextjs-boilerplate}"

cd "$ROOT"

command -v node >/dev/null || { echo "node is required"; exit 2; }
command -v npm >/dev/null || { echo "npm is required"; exit 2; }
command -v git >/dev/null || { echo "git is required"; exit 2; }

echo "Node: $(node --version)"
echo "npm:  $(npm --version)"
echo "git:  $(git --version)"

node -e '
const [major,minor]=process.versions.node.split(".").map(Number);
if (!((major===20 && minor>=19) || major>=22)) {
  console.error("Node must satisfy ^20.19.0 || >=22.12.0");
  process.exit(2);
}
'

echo "Installing Seed-Loom dependencies..."
npm ci

echo "Installing Playwright Chromium..."
npx playwright install chromium

mkdir -p "$(dirname "$SECONDARY_PATH")"

if [ ! -d "$SECONDARY_PATH/.git" ]; then
  echo "Cloning $SECONDARY_REPO into $SECONDARY_PATH"
  git clone "https://github.com/$SECONDARY_REPO.git" "$SECONDARY_PATH" || {
    echo "HTTPS clone failed. If this is a private repo, authenticate GitHub in the Codex environment and retry."
    exit 3
  }
else
  echo "Secondary repo already present; refreshing main without modifying local work."
  git -C "$SECONDARY_PATH" fetch origin main
fi

if [ -f "$SECONDARY_PATH/package-lock.json" ]; then
  echo "Installing secondary dependencies with npm ci..."
  (cd "$SECONDARY_PATH" && npm ci)
elif [ -f "$SECONDARY_PATH/pnpm-lock.yaml" ]; then
  command -v pnpm >/dev/null || corepack enable
  (cd "$SECONDARY_PATH" && pnpm install --frozen-lockfile)
elif [ -f "$SECONDARY_PATH/yarn.lock" ]; then
  command -v yarn >/dev/null || corepack enable
  (cd "$SECONDARY_PATH" && yarn install --immutable)
else
  echo "No recognized secondary lockfile. Do not install nondeterministically; inspect package manager first."
fi

echo
echo "Bootstrap complete."
echo "Seed-Loom:      $ROOT"
echo "Secondary repo: $SECONDARY_PATH"
echo "Next: read agent/CODEX_CALLABLE_EVIDENCE_TWO_BUILD_HANDOFF.md"
