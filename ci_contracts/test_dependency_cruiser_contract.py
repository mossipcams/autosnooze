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


def _dependency_cruiser_forbidden_rules() -> dict[str, dict[str, object]]:
    node_script = """
    const config = require('./.dependency-cruiser.cjs');
    console.log(JSON.stringify(config.forbidden));
    """
    result = subprocess.run(
        ["node", "-e", node_script],
        check=True,
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
    )
    return {rule["name"]: rule for rule in json.loads(result.stdout)}


def _rule_matches_to_path(rule: dict[str, object], path: str) -> bool:
    to_rule = rule.get("to", {})
    assert isinstance(to_rule, dict)
    pattern = to_rule.get("path")
    assert isinstance(pattern, str), f"{rule['name']} must define a concrete to.path"
    return re.search(pattern, path) is not None


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
    assert "npm run lint:unused:prod" in workflow, (
        "build workflow should pair dependency rules with production unused-code checks"
    )


def test_build_workflow_runs_ci_contracts() -> None:
    """The main build workflow must execute repository quality contracts."""
    workflow = BUILD_WORKFLOW_PATH.read_text()

    assert "pytest ci_contracts -q" in workflow, "build workflow must run ci_contracts"


def test_dependency_cruiser_forbids_component_runtime_shortcuts() -> None:
    """Component-to-service/state imports should be a hard failure, not advisory debt."""
    config = DEPENDENCY_CRUISER_PATH.read_text()
    rule_start = config.index("name: 'components-no-direct-services-or-state'")
    next_rule_start = config.index("name: 'state-no-ui-or-service-dependencies'", rule_start)
    rule_block = config[rule_start:next_rule_start]

    assert "severity: 'error'" in rule_block, (
        "components-no-direct-services-or-state must stay at error severity so dep-cruiser blocks violations"
    )


def test_component_runtime_shortcut_rule_has_no_broad_component_exceptions() -> None:
    """Component runtime boundaries should apply to every UI component."""
    config = DEPENDENCY_CRUISER_PATH.read_text()
    rule_start = config.index("name: 'components-no-direct-services-or-state'")
    next_rule_start = config.index("name: 'state-no-ui-or-service-dependencies'", rule_start)
    rule_block = config[rule_start:next_rule_start]

    assert "pathNot:" not in rule_block, (
        "components-no-direct-services-or-state should not exempt main UI components; "
        "runtime service/state access belongs behind feature slice modules"
    )


def test_lower_layer_dependency_rules_match_real_frontend_module_paths() -> None:
    """Lower-layer boundary rules should match actual files, not only dotted pseudo-paths."""
    rules = _dependency_cruiser_forbidden_rules()

    assert _rule_matches_to_path(rules["state-no-ui-or-service-dependencies"], "src/services/storage.ts")
    assert _rule_matches_to_path(rules["services-no-ui-or-state-dependencies"], "src/state/card-store.ts")
    assert _rule_matches_to_path(rules["utils-no-runtime-dependencies"], "src/services/snooze.ts")
    assert _rule_matches_to_path(rules["types-no-runtime-dependencies"], "src/utils/time-formatting.ts")


def test_state_layer_is_forbidden_from_importing_feature_slices() -> None:
    """State helpers are below features and must not depend upward on feature facades."""
    rules = _dependency_cruiser_forbidden_rules()
    rule = rules.get("state-no-feature-dependencies")

    assert rule is not None, "dependency-cruiser must forbid src/state imports from src/features"
    assert rule["severity"] == "error"
    assert rule["from"] == {"path": "^src/state/"}
    assert rule["to"] == {"path": "^src/features/"}
