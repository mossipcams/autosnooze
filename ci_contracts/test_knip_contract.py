"""Contract tests for strict knip enforcement."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"


def test_package_json_exposes_blocking_knip_script() -> None:
    """The repo must expose a dedicated knip validation script."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text())

    scripts = package_data.get("scripts", {})
    assert "lint:unused" in scripts, "package.json must define a lint:unused script"
    assert "knip" in scripts["lint:unused"], "lint:unused must run knip"
    assert "lint:unused:prod" in scripts, "package.json must define a lint:unused:prod script"
    assert "knip" in scripts["lint:unused:prod"], "lint:unused:prod must run knip"
    assert "--production" in scripts["lint:unused:prod"], "lint:unused:prod must run knip in production mode"


def test_build_workflow_runs_knip() -> None:
    """The main build workflow must fail when knip detects unused code or dependencies."""
    workflow = BUILD_WORKFLOW_PATH.read_text()

    assert "Run knip" in workflow, "build workflow must name the knip step"
    assert "npm run lint:unused" in workflow, "build workflow must execute lint:unused"
    assert "Run knip (production)" in workflow, "build workflow must name the production knip step"
    assert "npm run lint:unused:prod" in workflow, "build workflow must execute lint:unused:prod"
