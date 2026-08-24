"""Fail-closed persistence: save_failed rolls back HA state and runtime memory."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import STATE_ON
from homeassistant.exceptions import ServiceValidationError

from custom_components.autosnooze.application.adjust import async_adjust_snooze_batch
from custom_components.autosnooze.application.pause import async_pause_automations
from custom_components.autosnooze.application.resume import async_resume_batch
from custom_components.autosnooze.application.scheduled import async_execute_scheduled_disable
from custom_components.autosnooze.domain.notifications import NOTIFICATION_TRIGGER_START
from custom_components.autosnooze.models import PausedAutomation, ScheduledSnooze
from custom_components.autosnooze.runtime.state import AutomationPauseData

UTC = timezone.utc


def _state(entity_id: str, state: str = STATE_ON) -> MagicMock:
    return MagicMock(state=state, attributes={"friendly_name": entity_id})


def _paused(entity_id: str, *, resume_in: timedelta | None = None) -> PausedAutomation:
    now = datetime.now(UTC)
    return PausedAutomation(
        entity_id=entity_id,
        friendly_name=entity_id,
        resume_at=now + (resume_in or timedelta(hours=1)),
        paused_at=now,
        resume_state="on",
    )


@pytest.mark.asyncio
async def test_pause_save_failed_restores_ha_and_memory() -> None:
    """save_failed after turn_off rolls back runtime state and restores HA entity."""
    entity_id = "input_boolean.away_mode"
    hass = MagicMock()
    hass.states.get.return_value = _state(entity_id, "on")
    data = AutomationPauseData(store=MagicMock())
    set_state = AsyncMock(return_value=True)
    save = AsyncMock(return_value=False)

    with pytest.raises(ServiceValidationError) as exc_info:
        await async_pause_automations(
            hass,
            data,
            [entity_id],
            minutes=10,
            resume_state="off",
            set_automation_state=set_state,
            save_data=save,
            notify_started_automations=AsyncMock(),
            schedule_resume_callback=MagicMock(),
            schedule_disable_callback=MagicMock(),
            schedule_pre_resume_notification_callback=MagicMock(),
        )

    assert exc_info.value.translation_key == "save_failed"
    assert entity_id not in data.paused
    assert set_state.await_args_list[0].args == (hass, entity_id, False)
    assert set_state.await_args_list[-1].args == (hass, entity_id, True)
    save.assert_awaited_once()


@pytest.mark.asyncio
async def test_partial_pause_notifies_successes_before_pause_failed() -> None:
    """Partial pause emits start notification for persisted successes, then raises pause_failed."""
    existing_ok = "automation.ok"
    existing_fail = "automation.fail"
    hass = MagicMock()
    hass.states.get.return_value = _state("x", "on")

    def get_state(entity_id: str) -> MagicMock | None:
        if entity_id == existing_ok:
            return _state(existing_ok)
        if entity_id == existing_fail:
            return _state(existing_fail)
        return None

    hass.states.get.side_effect = get_state
    data = AutomationPauseData(store=MagicMock())

    async def set_state(_hass: object, entity_id: str, enabled: bool) -> bool:
        return entity_id == existing_ok and not enabled

    notify_started = AsyncMock()
    save = AsyncMock(return_value=True)

    with pytest.raises(ServiceValidationError) as exc_info:
        await async_pause_automations(
            hass,
            data,
            [existing_ok, existing_fail],
            minutes=10,
            notification_trigger=NOTIFICATION_TRIGGER_START,
            set_automation_state=set_state,
            save_data=save,
            notify_started_automations=notify_started,
            schedule_resume_callback=MagicMock(),
            schedule_disable_callback=MagicMock(),
            schedule_pre_resume_notification_callback=MagicMock(),
        )

    assert exc_info.value.translation_key == "pause_failed"
    assert set(data.paused) == {existing_ok}
    notify_started.assert_awaited_once()
    assert [p.entity_id for p in notify_started.await_args.args[1]] == [existing_ok]


@pytest.mark.asyncio
async def test_wake_save_failed_restores_ha_and_memory() -> None:
    """save_failed after wake rolls back runtime state and re-disables the entity."""
    entity_id = "input_boolean.mode"
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused[entity_id] = _paused(entity_id)
    set_state = AsyncMock(return_value=True)

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", set_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=False)),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
        patch("custom_components.autosnooze.application.resume.notify_resumed", AsyncMock()),
        patch("custom_components.autosnooze.application.resume.track_if_enabled"),
        pytest.raises(ServiceValidationError) as exc_info,
    ):
        await async_resume_batch(hass, data, [entity_id], reason="manual")

    assert exc_info.value.translation_key == "save_failed"
    assert entity_id in data.paused
    assert set_state.await_args_list[0].kwargs == {"enabled": True}
    assert set_state.await_args_list[-1].kwargs == {"enabled": False}


@pytest.mark.asyncio
async def test_partial_wake_emits_telemetry_for_successes_before_wake_failed() -> None:
    """Partial manual wake records snooze_ended for successes before raising wake_failed."""
    now = datetime.now(UTC)
    automation_id = "automation.kitchen"
    boolean_id = "input_boolean.guests"
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused = {
        automation_id: PausedAutomation(
            entity_id=automation_id,
            friendly_name=automation_id,
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            resume_state="on",
        ),
        boolean_id: PausedAutomation(
            entity_id=boolean_id,
            friendly_name=boolean_id,
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            resume_state="off",
        ),
    }

    async def set_state(_hass: object, entity_id: str, *, enabled: bool) -> bool:
        return entity_id == automation_id and enabled

    track = MagicMock()
    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=set_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
        patch("custom_components.autosnooze.application.resume.notify_resumed", AsyncMock()),
        patch("custom_components.autosnooze.application.resume.track_if_enabled", track),
        pytest.raises(ServiceValidationError) as exc_info,
    ):
        await async_resume_batch(hass, data, [automation_id, boolean_id], reason="manual")

    assert exc_info.value.translation_key == "wake_failed"
    assert automation_id not in data.paused
    assert boolean_id in data.paused
    track.assert_called_once()
    assert track.call_args.args[1] == "snooze_ended"


@pytest.mark.asyncio
async def test_adjust_save_failed_restores_resume_at() -> None:
    """save_failed after adjust rolls back in-memory resume_at and timer scheduling."""
    entity_id = "input_boolean.away_mode"
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    paused = _paused(entity_id, resume_in=timedelta(hours=2))
    original_resume_at = paused.resume_at
    data.paused[entity_id] = paused
    save = AsyncMock(return_value=False)
    schedule_resume = MagicMock()

    with (
        patch("custom_components.autosnooze.application.adjust.schedule_resume", schedule_resume),
        patch("custom_components.autosnooze.application.adjust.schedule_pre_resume_notification"),
        patch("custom_components.autosnooze.application.adjust.async_save", save),
        pytest.raises(ServiceValidationError) as exc_info,
    ):
        await async_adjust_snooze_batch(hass, data, [entity_id], timedelta(minutes=30))

    assert exc_info.value.translation_key == "save_failed"
    assert data.paused[entity_id].resume_at == original_resume_at
    assert schedule_resume.call_count == 2
    save.assert_awaited_once()


@pytest.mark.asyncio
async def test_scheduled_disable_save_failed_restores_ha_and_memory() -> None:
    """save_failed after scheduled disable rolls back HA and scheduled/paused state."""
    entity_id = "input_boolean.away_mode"
    now = datetime.now(UTC)
    resume_at = now + timedelta(minutes=20)
    data = AutomationPauseData(store=MagicMock())
    data.scheduled[entity_id] = ScheduledSnooze(
        entity_id=entity_id,
        friendly_name="Away",
        disable_at=now,
        resume_at=resume_at,
        resume_state="on",
    )
    hass = MagicMock()
    hass.states.get.return_value = _state(entity_id, "on")
    set_state = AsyncMock(return_value=True)

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", set_state),
        patch("custom_components.autosnooze.runtime.ports.schedule_disable"),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=False)),
        pytest.raises(ServiceValidationError) as exc_info,
    ):
        await async_execute_scheduled_disable(hass, data, entity_id, resume_at)

    assert exc_info.value.translation_key == "save_failed"
    assert entity_id in data.scheduled
    assert entity_id not in data.paused
    assert set_state.await_args_list[0].kwargs == {"enabled": False}
    assert set_state.await_args_list[-1].kwargs == {"enabled": True}
