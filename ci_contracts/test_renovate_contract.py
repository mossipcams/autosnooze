"""Renovate configuration contracts."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RENOVATE_PATH = ROOT / "renovate.json"


def test_renovate_uses_requested_update_policy() -> None:
    config = json.loads(RENOVATE_PATH.read_text(encoding="utf-8"))

    assert config["extends"] == [
        "config:recommended",
        ":dependencyDashboard",
        ":semanticPrefixFixDepsChoreOthers",
    ]
    assert config["timezone"] == "America/Chicago"
    assert config["schedule"] == ["before 6am on Monday"]
    assert config["packageRules"][0] == {
        "matchUpdateTypes": ["patch", "minor"],
        "groupName": "all non-major dependencies",
        "automerge": True,
        "automergeType": "pr",
        "platformAutomerge": True,
    }
    assert config["packageRules"][1] == {
        "matchManagers": ["github-actions"],
        "pinDigests": True,
        "automerge": False,
    }
    assert config["packageRules"][2] == {
        "matchUpdateTypes": ["major"],
        "automerge": False,
    }
