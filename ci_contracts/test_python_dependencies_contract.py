"""Contract tests for Python dependency pins."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
REQUIREMENTS_TEST_PATH = PROJECT_ROOT / "requirements_test.txt"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"


def test_pytest_homeassistant_custom_component_tracks_homeassistant_2026_5_beta() -> None:
    """Keep HA test fixtures aligned with the Dependabot PR #370 update."""
    requirements = REQUIREMENTS_TEST_PATH.read_text(encoding="utf-8")

    assert "pytest-homeassistant-custom-component>=0.13.326,<0.13.327" in requirements


def test_pytest_matches_homeassistant_2026_5_fixture_dependency() -> None:
    """Avoid pip resolver conflicts with the HA 2026.5 test fixture package."""
    requirements = REQUIREMENTS_TEST_PATH.read_text(encoding="utf-8")

    assert "pytest==9.0.3" in requirements


def test_pytest_asyncio_matches_homeassistant_2026_5_fixture_dependency() -> None:
    """Avoid pip resolver conflicts with the HA 2026.5 test fixture package."""
    requirements = REQUIREMENTS_TEST_PATH.read_text(encoding="utf-8")

    assert "pytest-asyncio==1.3.0" in requirements


def test_pytest_cov_matches_homeassistant_2026_5_fixture_dependency() -> None:
    """Keep coverage tooling aligned with the HA 2026.5 test fixture package."""
    requirements = REQUIREMENTS_TEST_PATH.read_text(encoding="utf-8")

    assert "pytest-cov==7.1.0" in requirements


def test_build_workflow_uses_python_3_14_for_homeassistant_2026_5_fixture() -> None:
    """The HA 2026.5 test fixture requires Python 3.14 or newer."""
    workflow = BUILD_WORKFLOW_PATH.read_text(encoding="utf-8")

    assert "python-version: '3.14" in workflow
