"""Contracts for count-based performance regression gates."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"
BUILD_WORKFLOW_PATH = PROJECT_ROOT / ".github" / "workflows" / "build.yml"


def test_ci_runs_performance_count_regressions() -> None:
    """CI should execute backend and frontend count-based performance characterization tests."""
    package_data = json.loads(PACKAGE_JSON_PATH.read_text(encoding="utf-8"))
    scripts = package_data.get("scripts", {})
    workflow = BUILD_WORKFLOW_PATH.read_text(encoding="utf-8")

    assert "test" in scripts, "package.json must define npm run test"
    assert "pytest tests/" in workflow or "pytest tests" in workflow, (
        "build workflow must run backend tests including performance characterization"
    )
    assert "npm run test" in workflow, "build workflow must run frontend tests"

    performance_tests = [
        PROJECT_ROOT / "tests" / "test_transition_performance.py",
        PROJECT_ROOT / "tests" / "test_frontend_performance.spec.ts",
    ]
    missing = [str(path.relative_to(PROJECT_ROOT)) for path in performance_tests if not path.exists()]
    assert missing == [], f"Performance gate tests must exist. Missing: {missing}"
