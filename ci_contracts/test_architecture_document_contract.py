"""Contract tests for the architecture source-of-truth document."""

from __future__ import annotations

from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
ARCHITECTURE_PATH = PROJECT_ROOT / "architecture.md"


def test_architecture_document_exists_and_defines_layer_direction() -> None:
    """AGENTS.md points at architecture.md, so the file must exist and be specific."""
    assert ARCHITECTURE_PATH.exists(), "architecture.md must exist as the module-boundary source of truth"

    source = ARCHITECTURE_PATH.read_text(encoding="utf-8")

    assert "modular monolith" in source
    assert "Frontend layer direction" in source
    assert "components -> features -> services/state -> utils/constants/types" in source
    assert "Backend layer direction" in source
    assert "services -> application -> runtime/infrastructure/domain/models" in source
    assert "No upward imports" in source
    assert "`__init__.py` is the lifecycle composition root" in source
    assert "mutable callback registries" in source
    assert "one application module" in source
    assert "Focused UI components own UI-specific lifecycle behavior" in source
    assert "one public name per use case" in source
