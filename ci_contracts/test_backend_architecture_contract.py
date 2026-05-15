"""Contract tests for backend layer dependency direction."""

from __future__ import annotations

from pathlib import Path
import re


PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ROOT = PROJECT_ROOT / "custom_components" / "autosnooze"


def _source_files(*parts: str) -> list[Path]:
    root = BACKEND_ROOT.joinpath(*parts)
    return sorted(root.rglob("*.py"))


def test_application_layer_has_no_upward_imports() -> None:
    """Application use cases must not import service registration or coordinator modules."""
    upward_import = re.compile(r"from\s+\.\.\s+import\s+(?:services|coordinator)|from\s+\.\.(?:services|coordinator)\s+import")

    offenders = [
        str(path.relative_to(PROJECT_ROOT))
        for path in _source_files("application")
        if upward_import.search(path.read_text(encoding="utf-8"))
    ]

    assert offenders == []


def test_runtime_layer_has_no_upward_imports() -> None:
    """Runtime helpers must receive callbacks instead of importing coordinator orchestration."""
    upward_import = re.compile(r"from\s+\.\.coordinator\s+import")

    offenders = [
        str(path.relative_to(PROJECT_ROOT))
        for path in _source_files("runtime")
        if upward_import.search(path.read_text(encoding="utf-8"))
    ]

    assert offenders == []
