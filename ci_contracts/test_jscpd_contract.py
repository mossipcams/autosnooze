"""Contract tests for blocking JS/TS duplication enforcement."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
PACKAGE_LOCK_PATH = PROJECT_ROOT / "package-lock.json"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"
JSCPD_CONFIG_PATH = PROJECT_ROOT / ".jscpd.json"
EXPECTED_JSCPD_VERSION = "4.2.4"


def test_package_json_exposes_blocking_jscpd_script() -> None:
    """The repo must expose a dedicated duplication validation script."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text())

    scripts = package_data.get("scripts", {})
    dev_dependencies = package_data.get("devDependencies", {})

    assert JSCPD_CONFIG_PATH.exists(), ".jscpd.json must exist for duplication enforcement"
    assert "lint:duplicates" in scripts, "package.json must define a lint:duplicates script"
    assert "jscpd" in scripts["lint:duplicates"], "lint:duplicates must run jscpd"
    assert ".jscpd.json" in scripts["lint:duplicates"], "lint:duplicates must use the repo jscpd config"
    assert "jscpd" in dev_dependencies, "package.json must declare jscpd as a dev dependency"


def test_jscpd_dependency_is_pinned_to_latest_supported_major() -> None:
    """The duplication checker should stay on the vetted latest release."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text())
    lock_data = json.loads(PACKAGE_LOCK_PATH.read_text())

    assert package_data["devDependencies"]["jscpd"] == f"^{EXPECTED_JSCPD_VERSION}"
    assert lock_data["packages"][""]["devDependencies"]["jscpd"] == f"^{EXPECTED_JSCPD_VERSION}"
    assert lock_data["packages"]["node_modules/jscpd"]["version"] == EXPECTED_JSCPD_VERSION


def test_jscpd_scans_backend_production_python() -> None:
    """Duplication enforcement should include production TypeScript and backend Python."""
    assert JSCPD_CONFIG_PATH.exists(), ".jscpd.json must exist for duplication enforcement"

    config = json.loads(JSCPD_CONFIG_PATH.read_text())
    ignored = config.get("ignore", [])

    assert config.get("threshold") == 0, "jscpd must remain a blocking gate"
    assert config.get("mode") == "strict", "jscpd must use strict matching"
    assert config.get("minLines") == 18, (
        "jscpd should skip adapter boilerplate while catching meaningful copy/paste blocks"
    )
    assert config.get("minTokens") == 60, "jscpd should catch smaller runtime copy/paste blocks"
    assert config.get("pattern") == "**/*.{ts,py}", "jscpd should scan production TypeScript and Python"
    assert "custom_components/autosnooze/**/*.py" not in ignored
    assert "src/index.ts" in ignored, "The top-level entrypoint may stay excluded as intentional wiring"
    assert "**/index.ts" not in ignored, (
        "Feature and component barrels should not be globally exempt from duplication checks"
    )
    assert "src/styles/**" in ignored, "Style modules should stay excluded to avoid CSS-template noise"
    assert "src/localization/translations/**" in ignored, "Translation files should stay excluded"


def test_build_workflow_runs_jscpd() -> None:
    """The main build workflow must fail when duplication crosses the configured threshold."""
    workflow = BUILD_WORKFLOW_PATH.read_text()

    assert "Run jscpd" in workflow, "build workflow must name the duplication-check step"
    assert "npm run lint:duplicates" in workflow, "build workflow must execute lint:duplicates"
