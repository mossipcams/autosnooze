"""Cross-boundary schema version contract tests."""

from __future__ import annotations

from pathlib import Path
import re
from unittest.mock import AsyncMock, MagicMock

import pytest
from homeassistant.exceptions import UnsupportedStorageVersionError

from custom_components.autosnooze.const import SENSOR_SCHEMA_VERSION


def test_frontend_schema_version_matches_backend_constant() -> None:
    frontend_types = Path(__file__).parent.parent / "src" / "types" / "automation.ts"
    source = frontend_types.read_text(encoding="utf-8")
    match = re.search(r"export const SENSOR_SCHEMA_VERSION = (\d+);", source)

    assert match is not None, "SENSOR_SCHEMA_VERSION must be exported by src/types/automation.ts"
    assert int(match.group(1)) == SENSOR_SCHEMA_VERSION


@pytest.mark.asyncio
async def test_storage_version_failure_surfaces_actionable_recovery_result() -> None:
    """Unsupported storage versions must not silently become empty runtime state."""
    from custom_components.autosnooze.application.restore import async_restore_stored as async_load_stored
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    store = MagicMock()
    store.async_load = AsyncMock(
        side_effect=UnsupportedStorageVersionError("autosnooze.storage", 99, 2),
    )
    data = AutomationPauseData(store=store)

    with pytest.raises(RuntimeError, match="Unsupported AutoSnooze storage version"):
        await async_load_stored(MagicMock(), data)

    assert data.paused == {}
    assert data.scheduled == {}
