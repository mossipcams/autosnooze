"""Tests for extracted runtime and infrastructure modules."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
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


def test_runtime_resume_timer_uses_injected_callback() -> None:
    """Runtime resume timer schedules the injected workflow callback."""
    from custom_components.autosnooze.models import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_resume

    hass = MagicMock()
    data = AutomationPauseData()
    created_tasks: list[object] = []
    scheduled_callbacks: list[object] = []

    def create_task(coro: object) -> None:
        created_tasks.append(coro)
        coro.close()

    def track_time(_hass: object, callback: object, _when: datetime) -> MagicMock:
        scheduled_callbacks.append(callback)
        return MagicMock()

    async def resume_callback(*_args: object) -> None:
        return None

    hass.async_create_task = MagicMock(side_effect=create_task)
    schedule_resume(
        hass,
        data,
        "automation.test",
        datetime.now(UTC),
        resume_callback=resume_callback,
        track_point_in_time=track_time,
    )

    scheduled_callbacks[0](datetime.now(UTC))

    assert len(created_tasks) == 1
    hass.async_create_task.assert_called_once()


def test_runtime_resume_timer_skips_when_unloaded_or_missing_callback() -> None:
    """Runtime resume timer safely noops without an active injected callback."""
    from custom_components.autosnooze.models import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_resume

    hass = MagicMock()
    hass.async_create_task = MagicMock()
    data = AutomationPauseData()
    scheduled_callbacks: list[object] = []

    def track_time(_hass: object, callback: object, _when: datetime) -> MagicMock:
        scheduled_callbacks.append(callback)
        return MagicMock()

    schedule_resume(
        hass,
        data,
        "automation.test",
        datetime.now(UTC),
        track_point_in_time=track_time,
    )
    scheduled_callbacks[0](datetime.now(UTC))

    data.unloaded = True
    scheduled_callbacks[0](datetime.now(UTC))

    hass.async_create_task.assert_not_called()


def test_runtime_disable_timer_skips_when_unloaded_or_missing_callback() -> None:
    """Runtime disable timer safely noops without an active injected callback."""
    from custom_components.autosnooze.models import AutomationPauseData, ScheduledSnooze
    from custom_components.autosnooze.runtime.timers import schedule_disable

    hass = MagicMock()
    hass.async_create_task = MagicMock()
    data = AutomationPauseData()
    now = datetime.now(UTC)
    scheduled = ScheduledSnooze(
        entity_id="automation.test",
        friendly_name="Test",
        disable_at=now,
        resume_at=now + timedelta(hours=1),
    )
    scheduled_callbacks: list[object] = []

    def track_time(_hass: object, callback: object, _when: datetime) -> MagicMock:
        scheduled_callbacks.append(callback)
        return MagicMock()

    schedule_disable(
        hass,
        data,
        "automation.test",
        scheduled,
        track_point_in_time=track_time,
    )
    scheduled_callbacks[0](now)

    data.unloaded = True
    scheduled_callbacks[0](now)

    hass.async_create_task.assert_not_called()


@pytest.mark.asyncio
async def test_runtime_port_returns_false_when_state_change_service_fails() -> None:
    """Runtime port converts Home Assistant service errors into False."""
    from custom_components.autosnooze.runtime.ports import async_set_automation_state

    hass = MagicMock()
    hass.states.get.return_value = MagicMock()
    hass.services.async_call = AsyncMock(side_effect=RuntimeError("boom"))

    result = await async_set_automation_state(hass, "automation.test", enabled=True)

    assert result is False
