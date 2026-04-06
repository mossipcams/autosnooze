"""Contract tests for npm audit-sensitive lockfile versions."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_LOCK_PATH = PROJECT_ROOT / "package-lock.json"


def _version_tuple(version: str) -> tuple[int, int, int]:
    major, minor, patch = version.split(".")
    return int(major), int(minor), int(patch)


def test_lockfile_uses_patched_versions_for_current_npm_audit_findings() -> None:
    """The lockfile should not retain versions blocked by the current audit gate."""
    assert PACKAGE_LOCK_PATH.exists(), "package-lock.json is missing"

    package_lock = json.loads(PACKAGE_LOCK_PATH.read_text())
    packages = package_lock["packages"]

    assert _version_tuple(packages["node_modules/brace-expansion"]["version"]) >= (5, 0, 5)
    assert _version_tuple(packages["node_modules/serialize-javascript"]["version"]) >= (7, 0, 5)
    assert _version_tuple(packages["node_modules/vite"]["version"]) >= (8, 0, 5)
