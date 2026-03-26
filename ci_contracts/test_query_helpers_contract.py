"""Contract tests for shared test helper exports."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
QUERY_HELPERS_PATH = PROJECT_ROOT / "tests" / "helpers" / "query-helpers.ts"


def test_query_helpers_do_not_export_dead_helpers() -> None:
    """Shared test helpers should not export unused functions."""
    content = QUERY_HELPERS_PATH.read_text()

    assert "export function computeAutomations" not in content, (
        "tests/helpers/query-helpers.ts should keep computeAutomations private"
    )
    assert "export function queryAllInDurationSelector" not in content, (
        "tests/helpers/query-helpers.ts should not export unused duration selector helpers"
    )
