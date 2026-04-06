"""Temporary PR #329 frontend boundary regression tests."""

from __future__ import annotations

from pathlib import Path
import re


ROOT = Path(__file__).parent.parent


def _read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def _imports_for(path: str) -> list[str]:
    source = _read(path)
    return re.findall(r"""^import\s.+?\sfrom\s+['"](.+?)['"];?\s*$""", source, re.MULTILINE)


def test_dependency_cruiser_forbids_feature_to_component_imports() -> None:
    source = _read(".dependency-cruiser.cjs")
    rule_pattern = re.compile(
        r"""
        name:\s*'features-no-component-dependencies'
        .*?
        severity:\s*'error'
        .*?
        from:\s*\{
        .*?
        path:\s*'\^src/features/'
        .*?
        \}
        .*?
        to:\s*\{
        .*?
        path:\s*'\^src/components/'
        """,
        re.DOTALL | re.VERBOSE,
    )

    assert rule_pattern.search(source) is not None


def test_scheduled_snooze_feature_does_not_import_component_layer() -> None:
    imports = _imports_for("src/features/scheduled-snooze/index.ts")
    assert "../../services/snooze.js" in imports
    assert not any(import_path.startswith("../../components/") for import_path in imports)
