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
    from custom_components.autosnooze.runtime.state import AutomationPauseData
    from custom_components.autosnooze.models import PausedAutomation

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


def test_schedule_resume_requires_and_invokes_explicit_callback() -> None:
    """Runtime resume timers invoke exactly the explicitly supplied workflow callback."""
    from custom_components.autosnooze.runtime.state import AutomationPauseData
    from custom_components.autosnooze.runtime import timers

    hass = MagicMock()
    data = AutomationPauseData()
    resume_at = datetime.now(UTC)
    scheduled_callbacks: list[object] = []
    timer_unsubscribe = MagicMock()
    created_tasks: list[object] = []

    def create_task(coro: object) -> None:
        created_tasks.append(coro)
        coro.close()

    def track_time(_hass: object, callback: object, _when: datetime) -> MagicMock:
        scheduled_callbacks.append(callback)
        return timer_unsubscribe

    async def resume_workflow(*_args: object, **_kwargs: object) -> None:
        return None

    resume_callback = MagicMock(side_effect=resume_workflow)
    hass.async_create_task = MagicMock(side_effect=create_task)
    with pytest.raises(TypeError):
        timers.schedule_resume(hass, data, "automation.missing", resume_at)

    timers.schedule_resume(
        hass,
        data,
        "automation.test",
        resume_at,
        resume_callback=resume_callback,
        track_point_in_time=track_time,
    )
    scheduled_callbacks[0](datetime.now(UTC))

    assert data.timers == {"automation.test": timer_unsubscribe}
    assert len(created_tasks) == 1
    hass.async_create_task.assert_called_once()
    resume_callback.assert_called_once_with(hass, data, "automation.test", reason="expired")
    assert not hasattr(timers, "async_resume")


def test_runtime_resume_timer_runs_callback_unless_unloaded() -> None:
    """Runtime resume timer fires the injected callback, and noops once unloaded."""
    from custom_components.autosnooze.runtime.state import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_resume

    hass = MagicMock()
    hass.async_create_task = MagicMock()
    data = AutomationPauseData()
    scheduled_callbacks: list[object] = []

    async def resume_workflow(*_args: object, **_kwargs: object) -> None:
        return None

    resume_callback = MagicMock(side_effect=resume_workflow)

    def track_time(_hass: object, callback: object, _when: datetime) -> MagicMock:
        scheduled_callbacks.append(callback)
        return MagicMock()

    schedule_resume(
        hass,
        data,
        "automation.test",
        datetime.now(UTC),
        resume_callback=resume_callback,
        track_point_in_time=track_time,
    )
    scheduled_callbacks[0](datetime.now(UTC))
    assert hass.async_create_task.call_count == 1
    resume_callback.assert_called_once_with(hass, data, "automation.test", reason="expired")

    data.unloaded = True
    scheduled_callbacks[0](datetime.now(UTC))

    # Still only one task: the unloaded firing is a noop.
    assert hass.async_create_task.call_count == 1
    resume_callback.assert_called_once()
    # Close the un-awaited coroutine created on the first firing.
    hass.async_create_task.call_args_list[0].args[0].close()


def test_runtime_disable_timer_runs_callback_unless_unloaded() -> None:
    """Runtime disable timer fires the injected callback, and noops once unloaded."""
    from custom_components.autosnooze.runtime.state import AutomationPauseData
    from custom_components.autosnooze.models import ScheduledSnooze
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

    async def disable_callback(_hass: object, _data: object, _entity_id: str, _resume_at: datetime) -> None:
        return None

    def track_time(_hass: object, callback: object, _when: datetime) -> MagicMock:
        scheduled_callbacks.append(callback)
        return MagicMock()

    schedule_disable(
        hass,
        data,
        "automation.test",
        scheduled,
        disable_callback=disable_callback,
        track_point_in_time=track_time,
    )
    scheduled_callbacks[0](now)
    assert hass.async_create_task.call_count == 1

    data.unloaded = True
    scheduled_callbacks[0](now)

    # Still only one task: the unloaded firing is a noop.
    assert hass.async_create_task.call_count == 1
    # Close the un-awaited coroutine created on the first firing.
    hass.async_create_task.call_args_list[0].args[0].close()


def test_schedule_disable_requires_explicit_callback() -> None:
    """Disable timers reject missing callbacks at the scheduling boundary."""
    from custom_components.autosnooze.models import ScheduledSnooze
    from custom_components.autosnooze.runtime.state import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_disable

    now = datetime.now(UTC)
    with pytest.raises(TypeError):
        schedule_disable(
            MagicMock(),
            AutomationPauseData(),
            "automation.test",
            ScheduledSnooze("automation.test", "Test", now, now + timedelta(hours=1)),
        )


def test_schedule_pre_resume_notification_creates_timer_for_about_to_end_trigger() -> None:
    """Runtime timer should schedule a callback before resume for valid about_to_end snoozes."""
    from custom_components.autosnooze.models import PausedAutomation
    from custom_components.autosnooze.runtime.state import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_pre_resume_notification

    hass = MagicMock()
    hass.async_create_task = MagicMock()
    data = AutomationPauseData()
    now = datetime.now(UTC)
    paused = PausedAutomation(
        entity_id="automation.test",
        friendly_name="Test",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        notification_trigger="about_to_end",
        notification_lead_minutes=30,
    )
    scheduled_callbacks: list[object] = []

    def track_time(_hass: object, callback: object, _when: datetime) -> MagicMock:
        scheduled_callbacks.append(callback)
        return MagicMock()

    schedule_pre_resume_notification(
        hass,
        data,
        paused,
        notification_callback=AsyncMock(),
        track_point_in_time=track_time,
    )

    assert "automation.test" in data.notification_timers
    assert len(scheduled_callbacks) == 1


def test_schedule_pre_resume_notification_ignores_non_pre_end_or_invalid_config() -> None:
    """Runtime timer helper should skip non about_to_end triggers or missing lead times."""
    from custom_components.autosnooze.models import PausedAutomation
    from custom_components.autosnooze.runtime.state import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_pre_resume_notification

    hass = MagicMock()
    data = AutomationPauseData()
    now = datetime.now(UTC)
    invalid = PausedAutomation(
        entity_id="automation.invalid",
        friendly_name="Invalid",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        notification_trigger="end",
    )
    missing_lead = PausedAutomation(
        entity_id="automation.missing",
        friendly_name="Missing",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        notification_trigger="about_to_end",
        notification_lead_minutes=30,
    )
    missing_lead.notification_lead_minutes = None
    scheduled_callbacks: list[object] = []

    def track_time(_hass: object, callback: object, _when: datetime) -> MagicMock:
        scheduled_callbacks.append(callback)
        return MagicMock()

    notification_callback = AsyncMock()
    schedule_pre_resume_notification(
        hass, data, invalid, notification_callback=notification_callback, track_point_in_time=track_time
    )
    schedule_pre_resume_notification(
        hass, data, missing_lead, notification_callback=notification_callback, track_point_in_time=track_time
    )

    assert data.notification_timers == {}
    assert scheduled_callbacks == []


def test_runtime_pre_resume_timer_uses_injected_callback() -> None:
    """Runtime pre-resume timer schedules the injected workflow callback."""
    from custom_components.autosnooze.models import PausedAutomation
    from custom_components.autosnooze.runtime.state import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_pre_resume_notification

    hass = MagicMock()
    data = AutomationPauseData()
    created_tasks: list[object] = []
    scheduled_callbacks: list[object] = []
    now = datetime.now(UTC)
    paused = PausedAutomation(
        entity_id="automation.test",
        friendly_name="Test",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        notification_trigger="about_to_end",
        notification_lead_minutes=30,
    )

    def create_task(coro: object) -> None:
        created_tasks.append(coro)
        coro.close()

    def track_time(_hass: object, callback: object, _when: datetime) -> MagicMock:
        scheduled_callbacks.append(callback)
        return MagicMock()

    async def notify_callback(*_args: object) -> None:
        return None

    hass.async_create_task = MagicMock(side_effect=create_task)
    schedule_pre_resume_notification(
        hass,
        data,
        paused,
        notification_callback=notify_callback,
        track_point_in_time=track_time,
    )

    scheduled_callbacks[0](datetime.now(UTC))

    assert len(created_tasks) == 1
    hass.async_create_task.assert_called_once()


def test_schedule_pre_resume_notification_requires_explicit_callback() -> None:
    """Pre-resume timers reject missing callbacks at the scheduling boundary."""
    from custom_components.autosnooze.models import PausedAutomation
    from custom_components.autosnooze.runtime.state import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_pre_resume_notification

    now = datetime.now(UTC)
    paused = PausedAutomation(
        entity_id="automation.test",
        friendly_name="Test",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        notification_trigger="about_to_end",
        notification_lead_minutes=30,
    )
    with pytest.raises(TypeError):
        schedule_pre_resume_notification(MagicMock(), AutomationPauseData(), paused)


@pytest.mark.asyncio
async def test_runtime_port_returns_false_when_state_change_service_fails() -> None:
    """Runtime port converts Home Assistant service errors into False."""
    from custom_components.autosnooze.runtime.ports import async_set_automation_state

    hass = MagicMock()
    hass.states.get.return_value = MagicMock()
    hass.services.async_call = AsyncMock(side_effect=RuntimeError("boom"))

    result = await async_set_automation_state(hass, "automation.test", enabled=True)

    assert result is False
