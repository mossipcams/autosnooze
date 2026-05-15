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


@pytest.mark.asyncio
async def test_async_save_retries_transient_failures_with_expected_logging(caplog) -> None:
    """Storage retries transient save errors, then logs the terminal failure."""
    import logging

    from custom_components.autosnooze.const import MAX_SAVE_RETRIES, SAVE_RETRY_DELAYS
    from custom_components.autosnooze.infrastructure.storage import async_save
    from custom_components.autosnooze.models import AutomationPauseData

    caplog.set_level(logging.WARNING, logger="custom_components.autosnooze.infrastructure.storage")
    store = MagicMock()
    error = OSError("disk full")
    store.async_save = AsyncMock(side_effect=error)
    sleep = AsyncMock()
    data = AutomationPauseData(store=store)

    result = await async_save(data, sleep=sleep)

    assert result is False
    assert store.async_save.await_count == MAX_SAVE_RETRIES + 1
    assert [call.args[0] for call in sleep.await_args_list] == SAVE_RETRY_DELAYS

    warning_messages = [record.getMessage() for record in caplog.records if record.levelno == logging.WARNING]
    assert warning_messages == [
        "Save attempt 1 failed, retrying in 0.1s: disk full",
        "Save attempt 2 failed, retrying in 0.2s: disk full",
        "Save attempt 3 failed, retrying in 0.4s: disk full",
    ]
    error_messages = [record.getMessage() for record in caplog.records if record.levelno == logging.ERROR]
    assert error_messages == ["Failed to save data after 4 attempts: disk full"]


@pytest.mark.asyncio
async def test_async_save_can_succeed_on_final_retry_attempt() -> None:
    """Storage uses the same payload and returns success on the final attempt."""
    from custom_components.autosnooze.const import MAX_SAVE_RETRIES, SAVE_RETRY_DELAYS
    from custom_components.autosnooze.infrastructure.storage import async_save
    from custom_components.autosnooze.models import AutomationPauseData

    store = MagicMock()
    store.async_save = AsyncMock(side_effect=[OSError("try again"), OSError("try again"), OSError("try again"), None])
    sleep = AsyncMock()
    data = AutomationPauseData(store=store)

    result = await async_save(data, sleep=sleep)

    assert result is True
    assert store.async_save.await_count == MAX_SAVE_RETRIES + 1
    assert [call.args[0] for call in sleep.await_args_list] == SAVE_RETRY_DELAYS
    assert all(call.args[0] == {"paused": {}, "scheduled": {}} for call in store.async_save.await_args_list)


@pytest.mark.asyncio
async def test_async_save_non_transient_failure_does_not_retry(caplog) -> None:
    """Storage logs non-transient errors once and does not sleep."""
    import logging

    from custom_components.autosnooze.infrastructure.storage import async_save
    from custom_components.autosnooze.models import AutomationPauseData

    caplog.set_level(logging.ERROR, logger="custom_components.autosnooze.infrastructure.storage")
    store = MagicMock()
    store.async_save = AsyncMock(side_effect=RuntimeError("serializer exploded"))
    sleep = AsyncMock()
    data = AutomationPauseData(store=store)

    result = await async_save(data, sleep=sleep)

    assert result is False
    store.async_save.assert_awaited_once()
    sleep.assert_not_awaited()
    assert [record.getMessage() for record in caplog.records] == [
        "Failed to save data: serializer exploded"
    ]


@pytest.mark.asyncio
async def test_async_save_final_non_transient_failure_after_retries(caplog) -> None:
    """Storage logs a final non-transient error after transient retry attempts."""
    import logging

    from custom_components.autosnooze.const import MAX_SAVE_RETRIES, SAVE_RETRY_DELAYS
    from custom_components.autosnooze.infrastructure.storage import async_save
    from custom_components.autosnooze.models import AutomationPauseData

    caplog.set_level(logging.WARNING, logger="custom_components.autosnooze.infrastructure.storage")
    store = MagicMock()
    store.async_save = AsyncMock(
        side_effect=[
            OSError("try again"),
            OSError("try again"),
            OSError("try again"),
            RuntimeError("serializer exploded"),
        ]
    )
    sleep = AsyncMock()
    data = AutomationPauseData(store=store)

    result = await async_save(data, sleep=sleep)

    assert result is False
    assert store.async_save.await_count == MAX_SAVE_RETRIES + 1
    assert [call.args[0] for call in sleep.await_args_list] == SAVE_RETRY_DELAYS
    assert [record.getMessage() for record in caplog.records if record.levelno == logging.ERROR] == [
        "Failed to save data: serializer exploded"
    ]


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


def test_schedule_resume_passes_callback_and_resume_time_to_scheduler() -> None:
    """Resume scheduler receives the callback and requested fire time."""
    from custom_components.autosnooze.models import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_resume

    hass = MagicMock()
    hass.async_create_task = MagicMock()
    data = AutomationPauseData()
    resume_at = datetime(2024, 6, 15, 12, 0, tzinfo=UTC)
    unsub = MagicMock()
    resume_handler = MagicMock(return_value="resume-coro")

    def track_point_in_time(called_hass, callback, fire_at):
        assert called_hass is hass
        assert callable(callback)
        assert fire_at is resume_at
        callback(resume_at)
        return unsub

    schedule_resume(
        hass,
        data,
        "automation.test",
        resume_at,
        track_point_in_time=track_point_in_time,
        resume_handler=resume_handler,
    )

    assert data.timers["automation.test"] is unsub
    resume_handler.assert_called_once_with(hass, data, "automation.test")
    hass.async_create_task.assert_called_once_with("resume-coro")


def test_schedule_disable_passes_callback_and_disable_time_to_scheduler() -> None:
    """Disable scheduler receives the callback and requested fire time."""
    from custom_components.autosnooze.models import AutomationPauseData, ScheduledSnooze
    from custom_components.autosnooze.runtime.timers import schedule_disable

    hass = MagicMock()
    hass.async_create_task = MagicMock()
    data = AutomationPauseData()
    disable_at = datetime(2024, 6, 15, 12, 0, tzinfo=UTC)
    resume_at = disable_at + timedelta(hours=2)
    scheduled = ScheduledSnooze(
        entity_id="automation.test",
        friendly_name="Test",
        disable_at=disable_at,
        resume_at=resume_at,
    )
    unsub = MagicMock()
    disable_handler = MagicMock(return_value="disable-coro")

    def track_point_in_time(called_hass, callback, fire_at):
        assert called_hass is hass
        assert callable(callback)
        assert fire_at is disable_at
        callback(disable_at)
        return unsub

    schedule_disable(
        hass,
        data,
        "automation.test",
        scheduled,
        track_point_in_time=track_point_in_time,
        disable_handler=disable_handler,
    )

    assert data.scheduled_timers["automation.test"] is unsub
    disable_handler.assert_called_once_with(hass, data, "automation.test", resume_at)
    hass.async_create_task.assert_called_once_with("disable-coro")
