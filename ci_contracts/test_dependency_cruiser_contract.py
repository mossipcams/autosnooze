"""Contract tests for strict dependency-cruiser enforcement."""

from __future__ import annotations

import json
from pathlib import Path
import re


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"
DEPENDENCY_CRUISER_PATH = PROJECT_ROOT / ".dependency-cruiser.cjs"


def test_package_json_exposes_blocking_dependency_cruiser_script() -> None:
    """The repo must expose a dedicated dependency-cruiser validation script."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text())

    scripts = package_data.get("scripts", {})
    assert "lint:deps" in scripts, "package.json must define a lint:deps script"
    assert "depcruise" in scripts["lint:deps"], "lint:deps must run dependency-cruiser"
    assert "--config .dependency-cruiser.cjs src" in scripts["lint:deps"], (
        "lint:deps must run dependency-cruiser against the tracked frontend source with the repo config"
    )


def test_build_workflow_runs_dependency_cruiser() -> None:
    """The main build workflow must fail when dependency rules are violated."""
    workflow = BUILD_WORKFLOW_PATH.read_text()

    assert "Run dependency-cruiser" in workflow, "build workflow must name the dependency-cruiser step"
    assert "npm run lint:deps" in workflow, "build workflow must execute lint:deps"
    assert "npm run lint:unused:prod" in workflow, "build workflow should pair dependency rules with production unused-code checks"


def test_dependency_cruiser_forbids_component_runtime_shortcuts() -> None:
    """Component-to-service/state imports should be a hard failure, not advisory debt."""
    config = DEPENDENCY_CRUISER_PATH.read_text()
    rule_start = config.index("name: 'components-no-direct-services-or-state'")
    next_rule_start = config.index("name: 'state-no-ui-or-service-dependencies'", rule_start)
    rule_block = config[rule_start:next_rule_start]

    assert "severity: 'error'" in rule_block, (
        "components-no-direct-services-or-state must stay at error severity so dep-cruiser blocks violations"
    )
