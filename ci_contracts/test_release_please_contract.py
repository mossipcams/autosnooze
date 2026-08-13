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


def test_pre_1_0_feat_bumps_minor_not_patch() -> None:
    """feat is minor while <1.0; feat! stays a breaking minor, not a major."""
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    pkg = config["packages"]["."]

    assert pkg["bump-minor-pre-major"] is True
    assert pkg.get("bump-patch-for-minor-pre-major") is not True


def test_non_release_commit_types_are_not_changelog_bump_types() -> None:
    """chore/docs/test do not get their own release; node release-type keeps docs non-releasable."""
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    section_types = {section["type"] for section in config["changelog-sections"]}

    assert config["release-type"] == "node"
    assert config["packages"]["."]["release-type"] == "node"
    assert "chore" not in section_types
    assert "docs" not in section_types
    assert "test" not in section_types
