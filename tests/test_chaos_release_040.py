"""Chaos and fault-injection tests for AutoSnooze 0.4.0 release behavior."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import STATE_ON
from homeassistant.exceptions import ServiceValidationError

from custom_components.autosnooze.application.adjust import async_adjust_snooze_batch
from custom_components.autosnooze.application.pause import (
    async_pause_automations,
    get_automations_by_area,
    get_automations_by_label,
    validate_guardrails,
)
from custom_components.autosnooze.application.resume import async_resume_batch
from custom_components.autosnooze.application.scheduled import async_execute_scheduled_disable
from custom_components.autosnooze.models import PausedAutomation, ScheduledSnooze
from custom_components.autosnooze.runtime.state import AutomationPauseData

UTC = timezone.utc


def _state(entity_id: str, state: str = STATE_ON, friendly_name: str | None = None) -> MagicMock:
    attrs = {"friendly_name": friendly_name or entity_id}
    return MagicMock(state=state, attributes=attrs)


def _build_hass(states: dict[str, MagicMock]) -> MagicMock:
    hass = MagicMock()
    hass.states.get.side_effect = states.get
    return hass


def _paused(entity_id: str, *, resume_state: str = "on", resume_in: timedelta | None = None) -> PausedAutomation:
    now = datetime.now(UTC)
    return PausedAutomation(
        entity_id=entity_id,
        friendly_name=entity_id,
        resume_at=now + (resume_in or timedelta(hours=1)),
        paused_at=now,
        resume_state=resume_state,
    )


@pytest.mark.asyncio
async def test_mixed_batch_resume_state_off_keeps_automation_on_only() -> None:
    """Mixed batches force automations to resume on while booleans honor resume_state=off."""
    automation_id = "automation.arrival"
    boolean_id = "input_boolean.away_mode"
    hass = _build_hass(
        {
            automation_id: _state(automation_id),
            boolean_id: _state(boolean_id, "on"),
        }
    )
    data = AutomationPauseData(store=MagicMock())
    set_state = AsyncMock(return_value=True)

    await async_pause_automations(
        hass,
        data,
        [automation_id, boolean_id],
        minutes=15,
        resume_state="off",
        set_automation_state=set_state,
        save_data=AsyncMock(return_value=True),
        notify_started_automations=AsyncMock(),
        schedule_resume_callback=MagicMock(),
        schedule_disable_callback=MagicMock(),
        schedule_pre_resume_notification_callback=MagicMock(),
    )

    assert data.paused[automation_id].resume_state == "on"
    assert data.paused[boolean_id].resume_state == "off"


@pytest.mark.asyncio
async def test_mixed_batch_missing_entity_turn_off_failure_and_success() -> None:
    """Missing entities are skipped, successes persist, then pause_failed is raised."""
    existing_ok = "automation.ok"
    existing_fail = "automation.fail"
    missing = "automation.missing"
    hass = _build_hass(
        {
            existing_ok: _state(existing_ok),
            existing_fail: _state(existing_fail),
        }
    )
    data = AutomationPauseData(store=MagicMock())

    async def set_state(_hass: object, entity_id: str, enabled: bool) -> bool:
        return entity_id == existing_ok and not enabled

    save = AsyncMock(return_value=True)
    with pytest.raises(ServiceValidationError) as exc_info:
        await async_pause_automations(
            hass,
            data,
            [existing_ok, existing_fail, missing],
            minutes=10,
            set_automation_state=set_state,
            save_data=save,
            notify_started_automations=AsyncMock(),
            schedule_resume_callback=MagicMock(),
            schedule_disable_callback=MagicMock(),
            schedule_pre_resume_notification_callback=MagicMock(),
        )

    assert exc_info.value.translation_key == "pause_failed"
    assert set(data.paused) == {existing_ok}
    save.assert_awaited_once()


@pytest.mark.asyncio
async def test_concurrent_pause_and_wake_same_input_boolean() -> None:
    """After pause commits, overlapping wake and re-pause must not leave a disabled orphan."""
    entity_id = "input_boolean.mode"
    hass = _build_hass({entity_id: _state(entity_id, "on")})
    data = AutomationPauseData(store=MagicMock())

    await async_pause_automations(
        hass,
        data,
        [entity_id],
        minutes=5,
        set_automation_state=AsyncMock(return_value=True),
        save_data=AsyncMock(return_value=True),
        notify_started_automations=AsyncMock(),
        schedule_resume_callback=MagicMock(),
        schedule_disable_callback=MagicMock(),
        schedule_pre_resume_notification_callback=MagicMock(),
    )
    assert entity_id in data.paused

    resume_gate = asyncio.Event()
    release_resume = asyncio.Event()
    overlap_started = asyncio.Event()
    release_overlap = asyncio.Event()
    state_calls: list[tuple[str, bool]] = []

    async def set_state(_hass: object, eid: str, enabled: bool) -> bool:
        state_calls.append((eid, enabled))
        if eid != entity_id:
            return True
        if enabled:
            resume_gate.set()
            await release_resume.wait()
        else:
            if resume_gate.is_set():
                overlap_started.set()
            await release_overlap.wait()
        return True

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=set_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
    ):
        wake_task = asyncio.create_task(async_resume_batch(hass, data, [entity_id], reason="manual"))
        await asyncio.wait_for(resume_gate.wait(), timeout=1)

        repause_task = asyncio.create_task(
            async_pause_automations(
                hass,
                data,
                [entity_id],
                minutes=10,
                set_automation_state=set_state,
                save_data=AsyncMock(return_value=True),
                notify_started_automations=AsyncMock(),
                schedule_resume_callback=MagicMock(),
                schedule_disable_callback=MagicMock(),
                schedule_pre_resume_notification_callback=MagicMock(),
            )
        )
        await asyncio.wait_for(overlap_started.wait(), timeout=1)
        release_resume.set()
        release_overlap.set()
        await asyncio.gather(wake_task, repause_task)

    assert (entity_id, True) in state_calls
    assert (entity_id, False) in state_calls
    entity_calls = [enabled for eid, enabled in state_calls if eid == entity_id]
    if entity_id in data.paused:
        assert entity_calls[-1] is False
    else:
        assert entity_calls[-1] is True


@pytest.mark.asyncio
async def test_manual_wake_input_boolean_resume_state_off_calls_disable_not_enable() -> None:
    """Manual wake with resume_state=off must apply enabled=False, never turn the Boolean on."""
    entity_id = "input_boolean.away_mode"
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused[entity_id] = _paused(entity_id, resume_state="off")
    set_state = AsyncMock(return_value=True)

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", set_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
        patch("custom_components.autosnooze.application.resume.notify_resumed", AsyncMock()),
        patch("custom_components.autosnooze.application.resume.track_if_enabled"),
    ):
        await async_resume_batch(hass, data, [entity_id], reason="manual")

    set_state.assert_awaited_once_with(hass, entity_id, enabled=False)
    assert entity_id not in data.paused


@pytest.mark.asyncio
async def test_mixed_batch_resume_state_previous_splits_automation_on_and_boolean_capture() -> None:
    """Mixed previous batches keep automations on-only while booleans capture current on/off."""
    automation_id = "automation.morning"
    boolean_on_id = "input_boolean.quiet_hours"
    boolean_off_id = "input_boolean.guest_mode"
    hass = _build_hass(
        {
            automation_id: _state(automation_id),
            boolean_on_id: _state(boolean_on_id, "on"),
            boolean_off_id: _state(boolean_off_id, "off"),
        }
    )
    data = AutomationPauseData(store=MagicMock())

    await async_pause_automations(
        hass,
        data,
        [automation_id, boolean_on_id, boolean_off_id],
        minutes=15,
        resume_state="previous",
        set_automation_state=AsyncMock(return_value=True),
        save_data=AsyncMock(return_value=True),
        notify_started_automations=AsyncMock(),
        schedule_resume_callback=MagicMock(),
        schedule_disable_callback=MagicMock(),
        schedule_pre_resume_notification_callback=MagicMock(),
    )

    assert data.paused[automation_id].resume_state == "on"
    assert data.paused[boolean_on_id].resume_state == "on"
    assert data.paused[boolean_off_id].resume_state == "off"


@pytest.mark.asyncio
async def test_save_failure_after_boolean_pause_rolls_back_ha_and_memory() -> None:
    """A successful turn_off with failed persistence rolls back HA and runtime state."""
    entity_id = "input_boolean.away_mode"
    hass = _build_hass({entity_id: _state(entity_id, "on")})
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
async def test_partial_manual_wake_mixed_automation_and_boolean() -> None:
    """Partial wake persists automation success, keeps boolean paused, and raises wake_failed."""
    now = datetime.now(UTC)
    automation_id = "automation.kitchen"
    boolean_id = "input_boolean.guests"
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused[automation_id] = PausedAutomation(
        entity_id=automation_id,
        friendly_name=automation_id,
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        resume_state="on",
    )
    data.paused[boolean_id] = PausedAutomation(
        entity_id=boolean_id,
        friendly_name=boolean_id,
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        resume_state="off",
    )

    async def set_state(_hass: object, entity_id: str, *, enabled: bool) -> bool:
        if entity_id == automation_id:
            return enabled
        return False

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=set_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)) as save,
        patch("custom_components.autosnooze.runtime.ports.schedule_resume") as schedule_resume,
        patch("custom_components.autosnooze.application.resume.notify_resumed", AsyncMock()) as notify_resumed,
        patch("custom_components.autosnooze.application.resume.track_if_enabled") as track_if_enabled,
        pytest.raises(ServiceValidationError) as exc_info,
    ):
        await async_resume_batch(hass, data, [automation_id, boolean_id], reason="manual")

    assert exc_info.value.translation_key == "wake_failed"
    assert automation_id not in data.paused
    assert boolean_id in data.paused
    save.assert_awaited_once()
    schedule_resume.assert_called_once()
    track_if_enabled.assert_called_once()
    assert track_if_enabled.call_args.args[1] == "snooze_ended"


@pytest.mark.asyncio
async def test_scheduled_previous_boolean_unavailable_then_captures_on_state() -> None:
    """Deferred scheduled previous snoozes capture stable state once it becomes available."""
    entity_id = "input_boolean.away_mode"
    now = datetime.now(UTC)
    resume_at = now + timedelta(minutes=20)
    data = AutomationPauseData(store=MagicMock())
    data.scheduled[entity_id] = ScheduledSnooze(
        entity_id=entity_id,
        friendly_name="Away",
        disable_at=now,
        resume_at=resume_at,
        resume_state="previous",
    )

    unavailable = _state(entity_id, "unavailable")
    available_on = _state(entity_id, "on")
    hass = MagicMock()
    hass.states.get.side_effect = [unavailable, available_on]
    set_state = AsyncMock(return_value=True)

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", set_state),
        patch("custom_components.autosnooze.runtime.ports.schedule_disable") as schedule_disable,
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
    ):
        await async_execute_scheduled_disable(hass, data, entity_id, resume_at)
        await async_execute_scheduled_disable(hass, data, entity_id, resume_at)

    set_state.assert_awaited_once_with(hass, entity_id, enabled=False)
    assert entity_id in data.paused
    assert data.paused[entity_id].resume_state == "on"
    schedule_disable.assert_called_once()


@pytest.mark.asyncio
async def test_guardrail_confirm_term_matches_input_boolean_friendly_name() -> None:
    """Critical keywords in a Boolean friendly name require explicit confirmation."""
    entity_id = "input_boolean.home_alarm"
    hass = _build_hass({entity_id: _state(entity_id, "on", friendly_name="Home Alarm Toggle")})

    with pytest.raises(ServiceValidationError) as exc_info:
        validate_guardrails(hass, [entity_id], confirm=False)

    assert exc_info.value.translation_key == "confirm_required"


@pytest.mark.asyncio
async def test_area_and_label_discovery_stays_automation_only() -> None:
    """Area/label discovery must never return input_boolean entities."""
    automation = MagicMock(
        domain="automation",
        area_id="kitchen",
        labels={"lights"},
        entity_id="automation.kitchen",
    )
    boolean = MagicMock(
        domain="input_boolean",
        area_id="kitchen",
        labels={"lights"},
        entity_id="input_boolean.guest_mode",
    )
    entity_reg = MagicMock()
    entity_reg.entities = {
        "automation.kitchen": automation,
        "input_boolean.guest_mode": boolean,
    }

    hass = MagicMock()
    with patch("custom_components.autosnooze.application.pause.er.async_get", return_value=entity_reg):
        by_area = get_automations_by_area(hass, ["kitchen"])
        by_label = get_automations_by_label(hass, ["lights"])

    assert by_area == ["automation.kitchen"]
    assert by_label == ["automation.kitchen"]


@pytest.mark.asyncio
async def test_scheduled_mixed_batch_resume_state_off_splits_domains() -> None:
    """Scheduled mixed batches keep automations on-only while booleans keep requested resume_state."""
    automation_id = "automation.morning"
    boolean_id = "input_boolean.quiet_hours"
    now = datetime.now(UTC)
    disable_at = now + timedelta(minutes=5)
    resume_at = now + timedelta(hours=1)
    hass = _build_hass(
        {
            automation_id: _state(automation_id),
            boolean_id: _state(boolean_id, "on"),
        }
    )
    data = AutomationPauseData(store=MagicMock())

    await async_pause_automations(
        hass,
        data,
        [automation_id, boolean_id],
        disable_at=disable_at,
        resume_at_dt=resume_at,
        resume_state="off",
        set_automation_state=AsyncMock(return_value=True),
        save_data=AsyncMock(return_value=True),
        notify_started_automations=AsyncMock(),
        schedule_resume_callback=MagicMock(),
        schedule_disable_callback=MagicMock(),
        schedule_pre_resume_notification_callback=MagicMock(),
    )

    assert data.scheduled[automation_id].resume_state == "on"
    assert data.scheduled[boolean_id].resume_state == "off"
    assert automation_id not in data.paused
    assert boolean_id not in data.paused


@pytest.mark.asyncio
async def test_scheduled_previous_boolean_unavailable_then_captures_off_state() -> None:
    """Deferred scheduled previous snoozes capture off once an unavailable Boolean stabilizes."""
    entity_id = "input_boolean.away_mode"
    now = datetime.now(UTC)
    resume_at = now + timedelta(minutes=20)
    data = AutomationPauseData(store=MagicMock())
    data.scheduled[entity_id] = ScheduledSnooze(
        entity_id=entity_id,
        friendly_name="Away",
        disable_at=now,
        resume_at=resume_at,
        resume_state="previous",
    )

    unavailable = _state(entity_id, "unavailable")
    available_off = _state(entity_id, "off")
    hass = MagicMock()
    hass.states.get.side_effect = [unavailable, available_off]
    set_state = AsyncMock(return_value=True)

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", set_state),
        patch("custom_components.autosnooze.runtime.ports.schedule_disable") as schedule_disable,
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
    ):
        await async_execute_scheduled_disable(hass, data, entity_id, resume_at)
        await async_execute_scheduled_disable(hass, data, entity_id, resume_at)

    set_state.assert_awaited_once_with(hass, entity_id, enabled=False)
    assert entity_id in data.paused
    assert data.paused[entity_id].resume_state == "off"
    schedule_disable.assert_called_once()


@pytest.mark.asyncio
async def test_pause_cancellation_restores_input_boolean_originally_on() -> None:
    """Cancelled pause must restore an input_boolean that was turned off mid-flight."""
    entity_id = "input_boolean.mode"
    hass = _build_hass({entity_id: _state(entity_id, "on")})
    data = AutomationPauseData(store=MagicMock())
    service_started = asyncio.Event()
    allow_service_finish = asyncio.Event()
    state_calls: list[tuple[str, bool]] = []

    async def set_state(_hass: object, eid: str, enabled: bool) -> bool:
        state_calls.append((eid, enabled))
        if eid == entity_id and not enabled:
            service_started.set()
            await allow_service_finish.wait()
        return True

    task = asyncio.create_task(
        async_pause_automations(
            hass,
            data,
            [entity_id],
            minutes=5,
            set_automation_state=set_state,
            save_data=AsyncMock(return_value=True),
            notify_started_automations=AsyncMock(),
            schedule_resume_callback=MagicMock(),
            schedule_disable_callback=MagicMock(),
            schedule_pre_resume_notification_callback=MagicMock(),
        )
    )
    await asyncio.wait_for(service_started.wait(), timeout=1)

    task.cancel()
    allow_service_finish.set()
    with pytest.raises(asyncio.CancelledError):
        await task

    assert state_calls == [(entity_id, False), (entity_id, True)]
    assert data.paused == {}


@pytest.mark.asyncio
async def test_adjust_paused_input_boolean_extends_resume_at() -> None:
    """Adjust must reschedule a paused input_boolean without touching backend on/off state."""
    entity_id = "input_boolean.away_mode"
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    paused = _paused(entity_id, resume_in=timedelta(hours=2))
    original_resume_at = paused.resume_at
    data.paused[entity_id] = paused
    save = AsyncMock(return_value=True)

    with (
        patch("custom_components.autosnooze.application.adjust.schedule_resume") as schedule_resume,
        patch("custom_components.autosnooze.application.adjust.schedule_pre_resume_notification"),
        patch("custom_components.autosnooze.application.adjust.async_save", save),
    ):
        await async_adjust_snooze_batch(hass, data, [entity_id], timedelta(minutes=30))

    assert data.paused[entity_id].resume_at == original_resume_at + timedelta(minutes=30)
    schedule_resume.assert_called_once()
    save.assert_awaited_once()


@pytest.mark.asyncio
async def test_adjust_mixed_automation_and_boolean_batch() -> None:
    """Mixed adjust batches update every paused target in one save."""
    automation_id = "automation.kitchen"
    boolean_id = "input_boolean.guests"
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    automation_paused = _paused(automation_id, resume_in=timedelta(hours=1))
    boolean_paused = _paused(boolean_id, resume_in=timedelta(hours=1))
    original_automation_resume = automation_paused.resume_at
    original_boolean_resume = boolean_paused.resume_at
    data.paused[automation_id] = automation_paused
    data.paused[boolean_id] = boolean_paused
    save = AsyncMock(return_value=True)

    with (
        patch("custom_components.autosnooze.application.adjust.schedule_resume"),
        patch("custom_components.autosnooze.application.adjust.schedule_pre_resume_notification"),
        patch("custom_components.autosnooze.application.adjust.async_save", save),
    ):
        await async_adjust_snooze_batch(
            hass,
            data,
            [automation_id, boolean_id],
            timedelta(minutes=15),
        )

    assert data.paused[automation_id].resume_at == original_automation_resume + timedelta(minutes=15)
    assert data.paused[boolean_id].resume_at == original_boolean_resume + timedelta(minutes=15)
    save.assert_awaited_once()


@pytest.mark.asyncio
async def test_adjust_save_failure_rolls_back_resume_at() -> None:
    """Failed adjust persistence raises save_failed and restores in-memory resume_at."""
    entity_id = "input_boolean.away_mode"
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    paused = _paused(entity_id, resume_in=timedelta(hours=2))
    original_resume_at = paused.resume_at
    data.paused[entity_id] = paused
    save = AsyncMock(return_value=False)

    with (
        patch("custom_components.autosnooze.application.adjust.schedule_resume"),
        patch("custom_components.autosnooze.application.adjust.schedule_pre_resume_notification"),
        patch("custom_components.autosnooze.application.adjust.async_save", save),
        pytest.raises(ServiceValidationError) as exc_info,
    ):
        await async_adjust_snooze_batch(hass, data, [entity_id], timedelta(minutes=30))

    assert exc_info.value.translation_key == "save_failed"
    assert data.paused[entity_id].resume_at == original_resume_at
    save.assert_awaited_once()


@pytest.mark.asyncio
async def test_adjust_time_too_short_rejects_shortening_past_buffer() -> None:
    """Adjust must reject deltas that would end the snooze inside the minimum buffer."""
    entity_id = "input_boolean.away_mode"
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused[entity_id] = _paused(entity_id, resume_in=timedelta(minutes=2))
    save = AsyncMock(return_value=True)

    with (
        patch("custom_components.autosnooze.application.adjust.schedule_resume"),
        patch("custom_components.autosnooze.application.adjust.schedule_pre_resume_notification"),
        patch("custom_components.autosnooze.application.adjust.async_save", save),
        pytest.raises(ServiceValidationError) as exc_info,
    ):
        await async_adjust_snooze_batch(hass, data, [entity_id], timedelta(minutes=-2))

    assert exc_info.value.translation_key == "adjust_time_too_short"
    save.assert_not_awaited()
