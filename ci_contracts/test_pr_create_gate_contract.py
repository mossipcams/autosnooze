"""Contract tests for local PR creation gates."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
PR_CREATE_SCRIPT_PATH = PROJECT_ROOT / "scripts" / "pr-create.mjs"


def test_package_json_exposes_pr_create_wrapper() -> None:
    """PR creation must go through the local guarded wrapper."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text())

    scripts = package_data.get("scripts", {})
    assert scripts.get("pr:create") == "node scripts/pr-create.mjs"


def test_pr_create_wrapper_runs_husky_before_gh_pr_create() -> None:
    """The wrapper must run the Husky pre-commit gate before opening a PR."""
    assert PR_CREATE_SCRIPT_PATH.exists(), "scripts/pr-create.mjs is missing"

    content = PR_CREATE_SCRIPT_PATH.read_text()
    husky_index = content.find(".husky/pre-commit")
    gh_index = content.find("gh pr create")

    assert husky_index != -1, "PR wrapper must run .husky/pre-commit"
    assert gh_index != -1, "PR wrapper must call gh pr create"
    assert husky_index < gh_index, "Husky must run before gh pr create"


def test_pr_create_wrapper_runs_e2e_before_gh_pr_create() -> None:
    """PR creation must run Playwright E2E after checking Home Assistant."""
    assert PR_CREATE_SCRIPT_PATH.exists(), "scripts/pr-create.mjs is missing"

    content = PR_CREATE_SCRIPT_PATH.read_text()
    husky_index = content.find(".husky/pre-commit")
    ha_url_index = content.find("HA_URL")
    default_ha_url_index = content.find("http://localhost:8124")
    e2e_index = content.find("npm run e2e")
    gh_index = content.find("gh pr create")

    assert ha_url_index != -1, "PR wrapper must respect HA_URL"
    assert default_ha_url_index != -1, "PR wrapper must default to local HA devcontainer URL"
    assert e2e_index != -1, "PR wrapper must run npm run e2e"
    assert husky_index < e2e_index < gh_index, "E2E must run after Husky and before gh pr create"


def test_pr_create_wrapper_prompts_before_skipping_e2e_when_ha_is_down() -> None:
    """A down HA devcontainer may be skipped only by explicit interactive approval."""
    assert PR_CREATE_SCRIPT_PATH.exists(), "scripts/pr-create.mjs is missing"

    content = PR_CREATE_SCRIPT_PATH.read_text()

    required_snippets = [
        "Home Assistant appears down",
        "Skip E2E and continue creating PR? [y/N]",
        "process.stdin.isTTY",
        "process.exit(1)",
        "readline/promises",
    ]

    missing = [snippet for snippet in required_snippets if snippet not in content]
    assert not missing, (
        "PR wrapper must ask before skipping E2E when HA is down and fail closed "
        f"without interactive approval. Missing snippets: {missing}"
    )
