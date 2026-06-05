"""Contracts for backend and frontend complexity/file-size budgets."""

from __future__ import annotations

import json
from pathlib import Path
import tomllib


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
PYPROJECT_PATH = PROJECT_ROOT / "pyproject.toml"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"
ESLINT_CONFIG_PATH = PROJECT_ROOT / "eslint.config.mjs"


def test_ci_enforces_backend_complexity_budget() -> None:
    """CI should run selected Ruff complexity rules against production backend code."""
    pyproject = tomllib.loads(PYPROJECT_PATH.read_text(encoding="utf-8"))
    workflow = BUILD_WORKFLOW_PATH.read_text(encoding="utf-8")

    lint = pyproject["tool"]["ruff"]["lint"]
    assert "C901" in lint["select"]
    assert lint["mccabe"]["max-complexity"] <= 50
    assert "ruff check custom_components/autosnooze" in workflow


def test_ci_enforces_frontend_complexity_and_file_size_budgets() -> None:
    """CI should run frontend lint and dependency checks that guard complexity regressions."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text(encoding="utf-8"))
    scripts = package_data.get("scripts", {})
    workflow = BUILD_WORKFLOW_PATH.read_text(encoding="utf-8")
    eslint_config = ESLINT_CONFIG_PATH.read_text(encoding="utf-8")

    assert "lint" in scripts, "package.json must define npm run lint"
    assert "complexity" in eslint_config, "production ESLint config must enforce a complexity budget"
    assert "max-lines" in eslint_config, "production ESLint config must enforce a file-size budget"
    assert "npm run lint" in workflow, "build workflow must run frontend lint"
