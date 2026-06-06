"""Release Please configuration contracts."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / ".github" / "release-please-config.json"


def test_refactor_commits_are_included_in_release_notes() -> None:
    """Ensure refactor-only cleanup PRs remain visible in release notes."""
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    sections = config["changelog-sections"]

    assert {"type": "refactor", "section": "Refactoring"} in sections
