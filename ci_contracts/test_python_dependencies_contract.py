"""Contract tests for Python dependency pins."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
REQUIREMENTS_TEST_PATH = PROJECT_ROOT / "requirements_test.txt"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"
HACS_JSON_PATH = PROJECT_ROOT / "hacs.json"


def test_pytest_homeassistant_custom_component_tracks_current_fixture() -> None:
    """Keep the Home Assistant test fixture on the reviewed patch release."""
    requirements = REQUIREMENTS_TEST_PATH.read_text(encoding="utf-8")

    assert "pytest-homeassistant-custom-component>=0.13.355,<0.13.356" in requirements


def test_pytest_matches_homeassistant_2026_5_fixture_dependency() -> None:
    """Avoid pip resolver conflicts with the HA 2026.5 test fixture package."""
    requirements = REQUIREMENTS_TEST_PATH.read_text(encoding="utf-8")

    assert "pytest==9.0.3" in requirements


def test_pytest_asyncio_matches_homeassistant_2026_5_fixture_dependency() -> None:
    """Avoid pip resolver conflicts with the HA 2026.5 test fixture package."""
    requirements = REQUIREMENTS_TEST_PATH.read_text(encoding="utf-8")

    assert "pytest-asyncio==1.4.0" in requirements


def test_pytest_cov_matches_homeassistant_2026_5_fixture_dependency() -> None:
    """Keep coverage tooling aligned with the HA 2026.5 test fixture package."""
    requirements = REQUIREMENTS_TEST_PATH.read_text(encoding="utf-8")

    assert "pytest-cov==7.1.0" in requirements


def test_build_workflow_uses_python_3_14_for_homeassistant_2026_5_fixture() -> None:
    """The HA 2026.5 test fixture requires Python 3.14 or newer."""
    workflow = BUILD_WORKFLOW_PATH.read_text(encoding="utf-8")

    assert "python-version: '3.14" in workflow


def test_hacs_has_no_homeassistant_version_floor() -> None:
    """HACS should not gate installs on a Home Assistant Core minimum (v0.2.29 had no key)."""
    hacs = json.loads(HACS_JSON_PATH.read_text(encoding="utf-8"))

    assert "homeassistant" not in hacs


def test_smoke_backend_tests_ha_floor() -> None:
    """Compatibility CI should cover the supported HA floor patch."""
    workflow = BUILD_WORKFLOW_PATH.read_text(encoding="utf-8")

    assert 'ha: "2026.6.0"' in workflow
    assert "pytest-homeassistant-custom-component==0.13.336" in workflow
    assert "fail-fast: false" in workflow
    assert 'tests: "tests/"' in workflow


def test_smoke_backend_runs_full_suite_on_ha_floor() -> None:
    """The supported HA floor must exercise the full backend test suite."""
    workflow = BUILD_WORKFLOW_PATH.read_text(encoding="utf-8")

    assert '- ha: "2026.8.1"' not in workflow
    assert 'tests: "tests/"' in workflow
    assert 'run: python3 -m pytest -q "${{ matrix.tests }}"' in workflow
