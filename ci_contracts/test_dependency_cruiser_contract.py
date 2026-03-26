"""Contract tests for strict dependency-cruiser enforcement."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"


def test_package_json_exposes_blocking_dependency_cruiser_script() -> None:
    """The repo must expose a dedicated dependency-cruiser validation script."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text())

    scripts = package_data.get("scripts", {})
    assert "lint:deps" in scripts, "package.json must define a lint:deps script"
    assert "depcruise" in scripts["lint:deps"], "lint:deps must run dependency-cruiser"


def test_build_workflow_runs_dependency_cruiser() -> None:
    """The main build workflow must fail when dependency rules are violated."""
    workflow = BUILD_WORKFLOW_PATH.read_text()

    assert "Run dependency-cruiser" in workflow, "build workflow must name the dependency-cruiser step"
    assert "npm run lint:deps" in workflow, "build workflow must execute lint:deps"
    assert "npm run lint:unused:prod" in workflow, "build workflow should pair dependency rules with production unused-code checks"
