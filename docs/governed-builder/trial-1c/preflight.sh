#!/usr/bin/env bash
set -euo pipefail

cd /home/melodyfire/work/seed-loom-governed-builder-trial

expected_origin='https://github.com/qt314wink/seed-loom.git'
expected_branch='test/governed-builder-determinism-trial'
expected_head='91e1dfa27040ff4fd653300fe42f9b067f44f089'

test "$(git remote get-url origin)" = "$expected_origin"
test "$(git branch --show-current)" = "$expected_branch"
test "$(git rev-parse HEAD)" = "$expected_head"
test -z "$(git status --short)"

if grep -qE '^model[[:space:]]*=' .codex/agents/governed-builder.toml; then
  echo 'FAIL: explicit model pin present' >&2
  exit 1
fi

grep -qE '^model_reasoning_effort[[:space:]]*=[[:space:]]*"high"' .codex/agents/governed-builder.toml

echo 'PREFLIGHT PASS'
echo 'Start a fresh Codex session and paste TRIAL_1C_PROMPT.txt.'
