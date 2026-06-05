"""Contracts for backend and frontend complexity/file-size budgets."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
PYPROJECT_PATH = PROJECT_ROOT / "pyproject.toml"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"


def test_ci_enforces_backend_complexity_budget() -> None:
    """CI should run selected Ruff complexity rules against production backend code."""
    pyproject = PYPROJECT_PATH.read_text(encoding="utf-8")
    workflow = BUILD_WORKFLOW_PATH.read_text(encoding="utf-8")

    assert "C901" in pyproject or "mccabe" in pyproject, (
        "pyproject.toml should configure Ruff complexity checks for production backend code"
    )
    assert "ruff check" in workflow, "build workflow must run ruff check"


def test_ci_enforces_frontend_complexity_and_file_size_budgets() -> None:
    """CI should run frontend lint and dependency checks that guard complexity regressions."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text(encoding="utf-8"))
    scripts = package_data.get("scripts", {})
    workflow = BUILD_WORKFLOW_PATH.read_text(encoding="utf-8")

    assert "lint" in scripts, "package.json must define npm run lint"
    assert "lint:deps" in scripts, "package.json must define npm run lint:deps"
    assert "npm run lint" in workflow, "build workflow must run frontend lint"
    assert "npm run lint:deps" in workflow, "build workflow must run dependency-cruiser"
