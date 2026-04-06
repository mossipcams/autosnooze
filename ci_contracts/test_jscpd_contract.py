"""Contract tests for blocking JS/TS duplication enforcement."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"
JSCPD_CONFIG_PATH = PROJECT_ROOT / ".jscpd.json"


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


def test_jscpd_config_targets_runtime_duplication_with_stricter_signal() -> None:
    """The repo should enforce a higher-signal duplication policy for runtime TS code."""
    assert JSCPD_CONFIG_PATH.exists(), ".jscpd.json must exist for duplication enforcement"

    config = json.loads(JSCPD_CONFIG_PATH.read_text())
    ignored = config.get("ignore", [])

    assert config.get("threshold") == 0, "jscpd must remain a blocking gate"
    assert config.get("mode") == "strict", "jscpd must use strict matching"
    assert config.get("minLines") == 10, "jscpd should skip tiny local repeats while still catching meaningful copy/paste blocks"
    assert config.get("minTokens") == 60, "jscpd should catch smaller runtime copy/paste blocks"
    assert config.get("pattern") == "**/*.ts", "jscpd should continue scanning runtime TypeScript sources"
    assert "src/index.ts" in ignored, "The top-level entrypoint may stay excluded as intentional wiring"
    assert "**/index.ts" not in ignored, "Feature and component barrels should not be globally exempt from duplication checks"
    assert "src/styles/**" in ignored, "Style modules should stay excluded to avoid CSS-template noise"
    assert "src/localization/translations/**" in ignored, "Translation files should stay excluded"


def test_build_workflow_runs_jscpd() -> None:
    """The main build workflow must fail when duplication crosses the configured threshold."""
    workflow = BUILD_WORKFLOW_PATH.read_text()

    assert "Run jscpd" in workflow, "build workflow must name the duplication-check step"
    assert "npm run lint:duplicates" in workflow, "build workflow must execute lint:duplicates"
