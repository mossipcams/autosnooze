"""Contracts preventing non-integration files from confusing Hassfest."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_manifest_json_is_reserved_for_home_assistant_integrations() -> None:
    """Only integration directories may contain files named manifest.json."""
    manifests = {
        path
        for path in PROJECT_ROOT.glob("**/manifest.json")
        if "node_modules" not in path.parts
    }
    expected = {PROJECT_ROOT / "custom_components" / "autosnooze" / "manifest.json"}

    assert manifests == expected
