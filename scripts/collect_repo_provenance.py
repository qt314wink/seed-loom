#!/usr/bin/env python3
"""
Collect git-based asset provenance from GitHub API.
Writes asset.discovered evidence events to portfolio/evidence/.
Requires: GITHUB_TOKEN env var for private repos and higher rate limits.
"""

from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib import request, error as url_error

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_DIR = ROOT / "portfolio" / "evidence"
ASSETS_DIR = ROOT / "portfolio" / "assets"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
OWNERS = ["qt314wink", "MelodicBloom"]

HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"


def gh_get(url: str) -> dict | list:
    req = request.Request(url, headers=HEADERS)
    with request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def get_repos(owner: str) -> list[dict]:
    url = f"https://api.github.com/users/{owner}/repos?per_page=100&type=all"
    try:
        return gh_get(url)
    except url_error.URLError as exc:
        print(f"  Warning: could not reach GitHub API for {owner}: {exc}")
        return []


def load_known_assets() -> dict[str, dict]:
    """Load existing asset cards keyed by github repository_id."""
    known: dict[str, dict] = {}
    if not ASSETS_DIR.exists():
        return known
    for f in ASSETS_DIR.glob("*.json"):
        try:
            data = json.loads(f.read_text())
            repo_id = data.get("github", {}).get("repository_id")
            if repo_id:
                known[str(repo_id)] = data
        except (json.JSONDecodeError, KeyError):
            pass
    return known


def make_event(event_type: str, repo: dict, owner: str) -> dict:
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    sha_src = f"{repo['id']}:{repo.get('pushed_at', now)}"
    event_id = f"evt_{hashlib.sha256(sha_src.encode()).hexdigest()[:16]}"
    return {
        "event_id": event_id,
        "schema_version": "v1",
        "event_type": event_type,
        "occurred_at": now,
        "asset": {
            "provider": "github",
            "owner": owner,
            "repo": repo["name"],
            "commit_sha": repo.get("pushed_at", "unknown"),
            "ref": repo.get("default_branch", "main"),
        },
        "actor": {
            "type": "workflow",
            "id": "collect_repo_provenance",
        },
        "confidence": "supported",
        "claims": {
            "github_repo_id": repo["id"],
            "github_node_id": repo.get("node_id"),
            "language": repo.get("language"),
            "archived": repo.get("archived", False),
            "private": repo.get("private", False),
            "fork": repo.get("fork", False),
            "description": repo.get("description"),
            "pushed_at": repo.get("pushed_at"),
            "created_at": repo.get("created_at"),
            "open_issues_count": repo.get("open_issues_count"),
        },
    }


def write_event(event: dict, date_path: str) -> Path:
    out_dir = EVIDENCE_DIR / date_path
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{event['event_id']}.json"
    if not out_path.exists():
        out_path.write_text(json.dumps(event, indent=2))
    return out_path


def main() -> int:
    today = datetime.now(timezone.utc).strftime("%Y-%m")
    known = load_known_assets()
    new_events: list[Path] = []

    for owner in OWNERS:
        print(f"Scanning {owner}...")
        repos = get_repos(owner)
        for repo in repos:
            repo_id = str(repo["id"])
            if repo_id in known:
                existing_push = known[repo_id].get("claims", {}).get("pushed_at")
                if existing_push != repo.get("pushed_at"):
                    event = make_event("asset.discovered", repo, owner)
                    event["claims"]["drift_detected"] = True
                    path = write_event(event, today)
                    new_events.append(path)
                    print(f"  Updated: {owner}/{repo['name']}")
            else:
                event = make_event("asset.discovered", repo, owner)
                path = write_event(event, today)
                new_events.append(path)
                print(f"  New:     {owner}/{repo['name']}")

    print(f"\nWrote {len(new_events)} new evidence events.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
