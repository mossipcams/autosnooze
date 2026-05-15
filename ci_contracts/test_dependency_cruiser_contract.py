"""Contract tests for strict dependency-cruiser enforcement."""

from __future__ import annotations

import json
from pathlib import Path
import re
import subprocess


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"
DEPENDENCY_CRUISER_PATH = PROJECT_ROOT / ".dependency-cruiser.cjs"
MAIN_CARD_PATH = PROJECT_ROOT / "src" / "components" / "autosnooze-card.ts"


def test_package_json_exposes_blocking_dependency_cruiser_script() -> None:
    """The repo must expose a dedicated dependency-cruiser validation script."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text())

    scripts = package_data.get("scripts", {})
    assert "lint:deps" in scripts, "package.json must define a lint:deps script"
    assert "depcruise" in scripts["lint:deps"], "lint:deps must run dependency-cruiser"
    assert "--config .dependency-cruiser.cjs src" in scripts["lint:deps"], (
        "lint:deps must run dependency-cruiser against the tracked frontend source with the repo config"
    )
    assert "lint:deps:json" in scripts, "package.json must expose machine-readable dependency-cruiser output"
    assert "--output-type json" in scripts["lint:deps:json"], "lint:deps:json must emit parseable dependency-cruiser JSON"


def test_dependency_cruiser_json_script_analyzes_frontend_modules() -> None:
    """The dependency graph gate must not silently cruise zero modules."""
    result = subprocess.run(
        ["npm", "run", "lint:deps:json", "--silent"],
        cwd=PROJECT_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    payload = json.loads(result.stdout)

    assert payload["summary"]["totalCruised"] > 0
    assert any(module["source"] == "src/components/autosnooze-card.ts" for module in payload["modules"])


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
    assert "autosnooze-(card|" not in rule_block
    assert "autosnooze-card" not in rule_block


def test_main_card_routes_actions_through_controller() -> None:
    """The main card should not import each action feature directly."""
    source = MAIN_CARD_PATH.read_text(encoding="utf-8")

    assert "../features/pause/index.js" not in source
    assert "../features/resume/index.js" not in source
    assert "../features/scheduled-snooze/index.js" not in source
    assert "./autosnooze-actions-controller.js" in source
