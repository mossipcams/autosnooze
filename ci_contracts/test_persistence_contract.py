"""Contracts for persistence failure handling."""

from __future__ import annotations

import ast
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
AUTOSNOOZE_ROOT = PROJECT_ROOT / "custom_components" / "autosnooze"


def _is_async_save_call(node: ast.AST) -> bool:
    return (
        isinstance(node, ast.Await)
        and isinstance(node.value, ast.Call)
        and isinstance(node.value.func, ast.Name)
        and node.value.func.id == "async_save"
    )


def test_runtime_state_saves_do_not_ignore_failures() -> None:
    """Runtime persistence writes should branch on async_save's boolean result."""
    unchecked: list[str] = []
    for path in [
        AUTOSNOOZE_ROOT / "coordinator.py",
        AUTOSNOOZE_ROOT / "runtime" / "restore.py",
    ]:
        tree = ast.parse(path.read_text(encoding="utf-8"))
        for node in ast.walk(tree):
            if isinstance(node, ast.Expr) and _is_async_save_call(node.value):
                unchecked.append(f"{path.relative_to(PROJECT_ROOT)}:{node.lineno}")

    assert unchecked == [], (
        "async_save returns False on persistence failures; callers must handle that result. "
        f"Unchecked calls: {unchecked}"
    )
