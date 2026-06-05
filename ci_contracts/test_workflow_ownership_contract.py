"""Contract tests for single workflow ownership in backend production code."""

from __future__ import annotations

import ast
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ROOT = PROJECT_ROOT / "custom_components" / "autosnooze"

WORKFLOW_OWNERS = {
    "async_pause_automations": BACKEND_ROOT / "application" / "pause.py",
    "async_resume": BACKEND_ROOT / "application" / "resume.py",
    "async_resume_batch": BACKEND_ROOT / "application" / "resume.py",
    "async_adjust_snooze": BACKEND_ROOT / "application" / "adjust.py",
    "async_adjust_snooze_batch": BACKEND_ROOT / "application" / "adjust.py",
    "async_execute_scheduled_disable": BACKEND_ROOT / "application" / "scheduled.py",
    "async_restore_stored": BACKEND_ROOT / "application" / "restore.py",
    "async_save": BACKEND_ROOT / "infrastructure" / "storage.py",
    "async_set_automation_state": BACKEND_ROOT / "runtime" / "adapters" / "automation_state.py",
}

ALLOWED_WORKFLOW_ALIASES = {
    ("async_pause_automations", BACKEND_ROOT / "services.py"),
    ("async_save", BACKEND_ROOT / "runtime" / "adapters" / "persistence.py"),
    ("async_save", BACKEND_ROOT / "runtime" / "ports.py"),
}


def _function_definitions(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    return {node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef)}


def _production_python_files() -> list[Path]:
    files: list[Path] = []
    for path in BACKEND_ROOT.rglob("*.py"):
        if path.name == "coordinator.py":
            continue
        files.append(path)
    return files


def test_each_backend_workflow_has_one_production_definition() -> None:
    """Each named workflow should have exactly one production owner outside coordinator.py."""
    duplicates: list[str] = []

    for function_name, owner_path in WORKFLOW_OWNERS.items():
        assert owner_path.exists(), f"Missing workflow owner for {function_name}: {owner_path}"
        owner_defs = _function_definitions(owner_path)
        assert function_name in owner_defs, f"{function_name} must be defined in {owner_path}"

        for path in _production_python_files():
            if path == owner_path:
                continue
            if (function_name, path) in ALLOWED_WORKFLOW_ALIASES:
                continue
            if function_name in _function_definitions(path):
                duplicates.append(f"{function_name} also defined in {path.relative_to(PROJECT_ROOT)}")

    assert duplicates == [], "Duplicate workflow owners detected:\n" + "\n".join(duplicates)


def test_ci_runs_workflow_ownership_contract() -> None:
    workflow = (PROJECT_ROOT / ".github" / "workflows" / "build.yml").read_text(encoding="utf-8")
    assert "pytest ci_contracts" in workflow


def test_service_and_package_adapters_do_not_import_coordinator_workflow_internals() -> None:
    offenders: list[str] = []
    for path in (BACKEND_ROOT / "services.py", BACKEND_ROOT / "__init__.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module and "coordinator" in node.module:
                offenders.append(f"{path.name}:{node.lineno}")
            if isinstance(node, ast.Import) and any("coordinator" in alias.name for alias in node.names):
                offenders.append(f"{path.name}:{node.lineno}")
    assert offenders == [], f"Thin adapters must not import coordinator workflow internals: {offenders}"
