"""Tests for extracted runtime and infrastructure modules."""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

UTC = timezone.utc


def test_validate_stored_data_is_available_via_runtime_module() -> None:
    """Restore runtime module exposes validation helpers."""
    from custom_components.autosnooze.runtime.restore import validate_stored_data

    result = validate_stored_data({"paused": {}, "scheduled": {}})
    assert result == {"paused": {}, "scheduled": {}}


@pytest.mark.asyncio
async def test_async_save_is_available_via_infrastructure_module() -> None:
    """Infrastructure storage module persists serialized paused/scheduled data."""
    from custom_components.autosnooze.infrastructure.storage import async_save
    from custom_components.autosnooze.models import AutomationPauseData, PausedAutomation

    now = datetime.now(UTC)
    store = MagicMock()
    store.async_save = AsyncMock(return_value=None)
    data = AutomationPauseData(store=store)
    data.paused["automation.test"] = PausedAutomation(
        entity_id="automation.test",
        friendly_name="Test",
        resume_at=now,
        paused_at=now,
    )

    result = await async_save(data)

    assert result is True
    store.async_save.assert_awaited_once()


def test_schedule_resume_is_available_via_runtime_module() -> None:
    """Runtime timers module exposes the schedule helper."""
    from custom_components.autosnooze.models import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_resume

    hass = MagicMock()
    hass.async_create_task = MagicMock()
    data = AutomationPauseData()

    with patch("custom_components.autosnooze.runtime.timers.async_track_point_in_time", return_value=MagicMock()):
        schedule_resume(hass, data, "automation.test", datetime.now(UTC))

    assert "automation.test" in data.timers
