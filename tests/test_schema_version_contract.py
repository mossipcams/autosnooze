"""Cross-boundary schema version contract tests."""

from __future__ import annotations

from pathlib import Path
import re

from custom_components.autosnooze.const import SENSOR_SCHEMA_VERSION


def test_frontend_schema_version_matches_backend_constant() -> None:
    frontend_types = Path(__file__).parent.parent / "src" / "types" / "automation.ts"
    source = frontend_types.read_text(encoding="utf-8")
    match = re.search(r"export const SENSOR_SCHEMA_VERSION = (\d+);", source)

    assert match is not None, "SENSOR_SCHEMA_VERSION must be exported by src/types/automation.ts"
    assert int(match.group(1)) == SENSOR_SCHEMA_VERSION
