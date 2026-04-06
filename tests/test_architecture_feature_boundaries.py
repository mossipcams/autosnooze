"""Contract tests for frontend feature-boundary architecture rules."""

from __future__ import annotations

from pathlib import Path


def _dependency_cruiser_source() -> str:
    return (Path(__file__).parent.parent / ".dependency-cruiser.cjs").read_text(encoding="utf-8")


def test_dependency_cruiser_enforces_feature_isolation() -> None:
    source = _dependency_cruiser_source()
    assert "no-cross-feature-imports" in source
    assert "^src/features/" in source


def test_dependency_cruiser_allows_components_to_depend_on_features() -> None:
    source = _dependency_cruiser_source()
    assert "components-no-direct-services-or-state" in source
    assert "^src/(services|state)/" in source
