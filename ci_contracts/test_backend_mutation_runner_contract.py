"""Contracts for the backend mutation runner."""

from __future__ import annotations

import ast
import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RUNNER_PATH = PROJECT_ROOT / "scripts" / "run_backend_mutation.py"
PACKAGE_JSON_PATH = PROJECT_ROOT / "package.json"


def _runner_source() -> str:
    assert RUNNER_PATH.exists(), "backend mutation runner script is missing"
    return RUNNER_PATH.read_text(encoding="utf-8")


def test_backend_mutation_runner_exists_and_avoids_forked_pytest_children() -> None:
    source = _runner_source()
    tree = ast.parse(source)

    assert "os.fork" not in source
    assert "MUTANT_UNDER_TEST" in source
    assert any(
        isinstance(node, ast.ImportFrom)
        and node.module == "subprocess"
        and any(alias.name == "run" for alias in node.names)
        for node in ast.walk(tree)
    ), "runner should execute mutant pytest runs in normal subprocesses"


def test_backend_mutation_runner_exposes_expected_statuses() -> None:
    source = _runner_source()

    for status in ("killed", "survived", "no tests", "timeout", "crashed"):
        assert status in source


def test_backend_mutation_runner_knows_home_assistant_pytest_and_source_test_exclusion() -> None:
    source = _runner_source()

    assert "venv_test" in source
    assert "TestLovelaceResourceSafety" in source
    assert "PYTHONPATH" in source


def test_package_json_exposes_backend_mutation_script() -> None:
    package_json = json.loads(PACKAGE_JSON_PATH.read_text(encoding="utf-8"))

    assert (
        package_json["scripts"].get("mutation:backend")
        == "python3 scripts/run_backend_mutation.py"
    )
