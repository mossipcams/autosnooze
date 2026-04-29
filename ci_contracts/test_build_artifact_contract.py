"""Contracts for generated frontend build artifacts."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = PROJECT_ROOT / "custom_components" / "autosnooze" / "www" / "autosnooze-card.js.map"


def test_card_sourcemap_sources_resolve_inside_repo() -> None:
    """Local source entries should resolve to files inside this checkout."""
    source_map = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    broken_sources: list[str] = []

    for source in source_map["sources"]:
        if "/src/" not in source and not source.startswith("src/"):
            continue

        resolved = (MAP_PATH.parent / source).resolve()
        if not resolved.is_relative_to(PROJECT_ROOT) or not resolved.exists():
            broken_sources.append(source)

    assert broken_sources == [], (
        f"Card sourcemap entries for local source files must point inside the repo. Broken sources: {broken_sources}"
    )
