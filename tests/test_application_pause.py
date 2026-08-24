"""Tests for the extracted pause application flow."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID

UTC = timezone.utc


@pytest.mark.asyncio
async def test_handle_pause_service_forwards_full_contract_fields() -> None:
    """Pause application delegates guardrails and pause execution."""
    from custom_components.autosnooze.application.pause import async_handle_pause_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    disable_at = datetime(2030, 1, 1, 10, 0, tzinfo=UTC)
    resume_at = datetime(2030, 1, 1, 12, 0, tzinfo=UTC)
    call = MagicMock()
    call.data = {
        ATTR_ENTITY_ID: ["automation.a", "automation.b"],
        "days": 1,
        "hours": 2,
        "minutes": 3,
        "disable_at": disable_at,
        "resume_at": resume_at,
        "confirm": True,
    }

    with (
        patch("custom_components.autosnooze.application.pause._validate_guardrails") as validate_guardrails,
        patch(
            "custom_components.autosnooze.application.pause.async_pause_automations",
            new_callable=AsyncMock,
        ) as pause_automations,
    ):
        await async_handle_pause_service(mock_hass, data, call)

    validate_guardrails.assert_called_once_with(mock_hass, ["automation.a", "automation.b"], confirm=True)
    pause_automations.assert_called_once_with(
        mock_hass,
        data,
        ["automation.a", "automation.b"],
        1,
        2,
        3,
        disable_at,
        resume_at,
        "none",
        None,
        service_call=call,
    )


@pytest.mark.asyncio
async def test_handle_pause_service_noops_when_unloaded() -> None:
    """Pause application exits early when integration is unloaded."""
    from custom_components.autosnooze.application.pause import async_handle_pause_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock(), unloaded=True)
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.a"]}

    with (
        patch("custom_components.autosnooze.application.pause._validate_guardrails") as validate_guardrails,
        patch(
            "custom_components.autosnooze.application.pause.async_pause_automations",
            new_callable=AsyncMock,
        ) as pause_automations,
    ):
        await async_handle_pause_service(mock_hass, data, call)

    validate_guardrails.assert_not_called()
    pause_automations.assert_not_called()


@pytest.mark.asyncio
async def test_repause_input_boolean_previous_preserves_original_resume_state() -> None:
    """Re-snoozing must not capture the Boolean's forced-off snooze state."""
    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.models import PausedAutomation
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    now = datetime.now(UTC)
    entity_id = "input_boolean.mode"
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="off", attributes={"friendly_name": "Mode"})
    data = AutomationPauseData(
        paused={
            entity_id: PausedAutomation(
                entity_id=entity_id,
                friendly_name="Mode",
                resume_at=now + timedelta(minutes=5),
                paused_at=now,
                resume_state="on",
            )
        }
    )

    await async_pause_automations(
        hass,
        data,
        [entity_id],
        minutes=10,
        resume_state="previous",
        set_automation_state=AsyncMock(return_value=True),
        save_data=AsyncMock(return_value=True),
        notify_started_automations=AsyncMock(),
        schedule_resume_callback=MagicMock(),
        schedule_disable_callback=MagicMock(),
        schedule_pre_resume_notification_callback=MagicMock(),
    )

    assert data.paused[entity_id].resume_state == "on"


@pytest.mark.parametrize("state", ["unknown", "unavailable"])
@pytest.mark.asyncio
async def test_input_boolean_previous_rejects_unstable_state(state: str) -> None:
    """Previous-state snoozes require a stable Boolean state before mutation."""
    from homeassistant.exceptions import ServiceValidationError

    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    entity_id = "input_boolean.mode"
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state=state, attributes={"friendly_name": "Mode"})
    set_state = AsyncMock(return_value=True)
    data = AutomationPauseData()

    with pytest.raises(ServiceValidationError) as exc_info:
        await async_pause_automations(
            hass,
            data,
            [entity_id],
            minutes=10,
            resume_state="previous",
            set_automation_state=set_state,
            save_data=AsyncMock(return_value=True),
            notify_started_automations=AsyncMock(),
            schedule_resume_callback=MagicMock(),
            schedule_disable_callback=MagicMock(),
            schedule_pre_resume_notification_callback=MagicMock(),
        )

    assert exc_info.value.translation_key == "invalid_previous_state"
    set_state.assert_not_awaited()
    assert data.paused == {}


@pytest.mark.asyncio
async def test_mixed_pause_validates_previous_states_before_mutation() -> None:
    """A later unstable Boolean must not leave earlier targets disabled."""
    from homeassistant.exceptions import ServiceValidationError

    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    states = {
        "automation.first": MagicMock(state="on", attributes={}),
        "input_boolean.unstable": MagicMock(state="unavailable", attributes={}),
    }
    hass.states.get.side_effect = states.get
    set_state = AsyncMock(return_value=True)
    data = AutomationPauseData()

    with pytest.raises(ServiceValidationError) as exc_info:
        await async_pause_automations(
            hass,
            data,
            list(states),
            minutes=10,
            resume_state="previous",
            set_automation_state=set_state,
            save_data=AsyncMock(return_value=True),
            notify_started_automations=AsyncMock(),
            schedule_resume_callback=MagicMock(),
            schedule_disable_callback=MagicMock(),
            schedule_pre_resume_notification_callback=MagicMock(),
        )

    assert exc_info.value.translation_key == "invalid_previous_state"
    set_state.assert_not_awaited()
    assert data.paused == {}


@pytest.mark.asyncio
async def test_pause_tracks_successful_input_boolean_resume_state_usage() -> None:
    """Telemetry counts successful Booleans without identifying their entities."""
    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={"friendly_name": "Test"})
    telemetry = MagicMock()
    data = AutomationPauseData(telemetry=telemetry)
    service_call = MagicMock(
        context=None,
        data={"resume_state": "off"},
    )

    set_state = AsyncMock(return_value=True)

    await async_pause_automations(
        hass,
        data,
        ["automation.one", "input_boolean.success"],
        minutes=10,
        service_call=service_call,
        set_automation_state=set_state,
        save_data=AsyncMock(return_value=True),
        notify_started_automations=AsyncMock(),
        schedule_resume_callback=MagicMock(),
        schedule_disable_callback=MagicMock(),
        schedule_pre_resume_notification_callback=MagicMock(),
    )

    telemetry.track.assert_any_call(
        "input_boolean_snooze_created",
        {"resume_state": "off", "schedule_mode": False, "target_count": 1},
        source="service",
        card_type=None,
        platform=None,
    )


@pytest.mark.asyncio
async def test_failed_scheduled_replacement_emits_no_success_telemetry() -> None:
    """Skipped schedule candidates must not be persisted or reported as created."""
    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.models import PausedAutomation
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    now = datetime.now(UTC)
    entity_id = "input_boolean.mode"
    telemetry = MagicMock()
    active_pause = PausedAutomation(
        entity_id=entity_id,
        friendly_name="Mode",
        resume_at=now + timedelta(minutes=10),
        paused_at=now,
        resume_state="on",
    )
    data = AutomationPauseData(paused={entity_id: active_pause}, telemetry=telemetry)
    save = AsyncMock(return_value=True)
    service_call = MagicMock(context=None, data={"resume_state": "off"})

    await async_pause_automations(
        MagicMock(),
        data,
        [entity_id],
        disable_at=now + timedelta(minutes=20),
        resume_at_dt=now + timedelta(minutes=30),
        service_call=service_call,
        set_automation_state=AsyncMock(return_value=False),
        save_data=save,
        notify_started_automations=AsyncMock(),
        schedule_resume_callback=MagicMock(),
        schedule_disable_callback=MagicMock(),
        schedule_pre_resume_notification_callback=MagicMock(),
    )

    assert data.paused == {entity_id: active_pause}
    assert data.scheduled == {}
    save.assert_not_awaited()
    assert {call.args[0] for call in telemetry.track.call_args_list}.isdisjoint(
        {"scheduled_snooze_created", "input_boolean_snooze_created"}
    )


@pytest.mark.asyncio
async def test_pause_cancellation_restores_entities_disabled_before_commit() -> None:
    """Cancellation must not leave disabled automations outside runtime state."""
    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={"friendly_name": "Test"})
    data = AutomationPauseData(store=MagicMock())
    service_started = asyncio.Event()
    allow_service_finish = asyncio.Event()
    state_calls: list[tuple[str, bool]] = []

    async def set_state(_hass, entity_id: str, enabled: bool) -> bool:
        state_calls.append((entity_id, enabled))
        if entity_id == "automation.second" and not enabled:
            service_started.set()
            await allow_service_finish.wait()
        return True

    save = AsyncMock(return_value=True)
    schedule_resume = MagicMock()
    task = asyncio.create_task(
        async_pause_automations(
            hass,
            data,
            ["automation.first", "automation.second"],
            minutes=5,
            set_automation_state=set_state,
            save_data=save,
            notify_started_automations=AsyncMock(),
            schedule_resume_callback=schedule_resume,
            schedule_disable_callback=MagicMock(),
            schedule_pre_resume_notification_callback=MagicMock(),
        )
    )
    await asyncio.wait_for(service_started.wait(), timeout=1)

    task.cancel()
    allow_service_finish.set()
    with pytest.raises(asyncio.CancelledError):
        await task

    assert state_calls == [
        ("automation.first", False),
        ("automation.second", False),
        ("automation.first", True),
        ("automation.second", True),
    ]
    assert data.paused == {}
    assert data.timers == {}
    schedule_resume.assert_not_called()
    save.assert_not_awaited()


@pytest.mark.asyncio
async def test_scheduled_replacement_cancellation_re_disables_woken_entities() -> None:
    """Cancellation must restore active snoozes woken for replacement."""
    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.models import PausedAutomation
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    now = datetime.now(UTC)
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="off", attributes={"friendly_name": "Test"})
    data = AutomationPauseData(store=MagicMock())
    for entity_id in ("automation.first", "automation.second"):
        data.paused[entity_id] = PausedAutomation(
            entity_id=entity_id,
            friendly_name=entity_id,
            resume_at=now + timedelta(minutes=30),
            paused_at=now,
        )

    service_started = asyncio.Event()
    allow_service_finish = asyncio.Event()
    state_calls: list[tuple[str, bool]] = []

    async def set_state(_hass, entity_id: str, enabled: bool) -> bool:
        state_calls.append((entity_id, enabled))
        if entity_id == "automation.second" and enabled:
            service_started.set()
            await allow_service_finish.wait()
        return True

    save = AsyncMock(return_value=True)
    schedule_disable = MagicMock()
    task = asyncio.create_task(
        async_pause_automations(
            hass,
            data,
            ["automation.first", "automation.second"],
            disable_at=now + timedelta(hours=1),
            resume_at_dt=now + timedelta(hours=2),
            set_automation_state=set_state,
            save_data=save,
            notify_started_automations=AsyncMock(),
            schedule_resume_callback=MagicMock(),
            schedule_disable_callback=schedule_disable,
            schedule_pre_resume_notification_callback=MagicMock(),
        )
    )
    await asyncio.wait_for(service_started.wait(), timeout=1)

    task.cancel()
    allow_service_finish.set()
    with pytest.raises(asyncio.CancelledError):
        await task

    assert state_calls == [
        ("automation.first", True),
        ("automation.second", True),
        ("automation.first", False),
        ("automation.second", False),
    ]
    assert set(data.paused) == {"automation.first", "automation.second"}
    assert data.scheduled == {}
    schedule_disable.assert_not_called()
    save.assert_not_awaited()


@pytest.mark.asyncio
async def test_pause_deduplicates_backend_targets() -> None:
    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={"friendly_name": "Test"})
    data = AutomationPauseData(store=MagicMock())
    set_state = AsyncMock(return_value=True)
    notify_started = AsyncMock()

    await async_pause_automations(
        hass,
        data,
        ["automation.test", "automation.test"],
        minutes=5,
        set_automation_state=set_state,
        save_data=AsyncMock(return_value=True),
        notify_started_automations=notify_started,
        schedule_resume_callback=MagicMock(),
        schedule_disable_callback=MagicMock(),
        schedule_pre_resume_notification_callback=MagicMock(),
    )

    set_state.assert_awaited_once_with(hass, "automation.test", False)
    notify_started.assert_awaited_once()
    assert [paused.entity_id for paused in notify_started.await_args.args[1]] == ["automation.test"]


@pytest.mark.asyncio
async def test_pause_raises_when_all_turn_off_fail() -> None:
    """When every automation.turn_off fails, pause must not return success."""
    from homeassistant.exceptions import ServiceValidationError

    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={"friendly_name": "Test"})
    data = AutomationPauseData(store=MagicMock())
    set_state = AsyncMock(return_value=False)
    save = AsyncMock(return_value=True)
    notify_started = AsyncMock()

    with pytest.raises(ServiceValidationError) as exc_info:
        await async_pause_automations(
            hass,
            data,
            ["automation.a", "automation.b"],
            minutes=5,
            set_automation_state=set_state,
            save_data=save,
            notify_started_automations=notify_started,
            schedule_resume_callback=MagicMock(),
            schedule_disable_callback=MagicMock(),
            schedule_pre_resume_notification_callback=MagicMock(),
        )

    assert exc_info.value.translation_domain == "autosnooze"
    assert exc_info.value.translation_key == "pause_failed"
    assert data.paused == {}
    assert data.scheduled == {}
    assert set_state.await_count == 2
    save.assert_not_awaited()
    notify_started.assert_not_awaited()


@pytest.mark.asyncio
async def test_pause_persists_partial_success_then_raises_pause_failed() -> None:
    """When some turn_off calls fail, persist successes then raise pause_failed."""
    from homeassistant.exceptions import ServiceValidationError

    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={"friendly_name": "Test"})
    data = AutomationPauseData(store=MagicMock())

    async def set_state(_hass, entity_id: str, enabled: bool) -> bool:
        return entity_id == "automation.a" and not enabled

    save = AsyncMock(return_value=True)
    notify_started = AsyncMock()

    with pytest.raises(ServiceValidationError) as exc_info:
        await async_pause_automations(
            hass,
            data,
            ["automation.a", "automation.b"],
            minutes=5,
            set_automation_state=set_state,
            save_data=save,
            notify_started_automations=notify_started,
            schedule_resume_callback=MagicMock(),
            schedule_disable_callback=MagicMock(),
            schedule_pre_resume_notification_callback=MagicMock(),
        )

    assert exc_info.value.translation_domain == "autosnooze"
    assert exc_info.value.translation_key == "pause_failed"
    assert set(data.paused) == {"automation.a"}
    save.assert_awaited_once()
    notify_started.assert_not_awaited()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "entity_ids",
    [
        ["input_boolean.away_mode"],
        ["automation.arrival", "input_boolean.away_mode"],
    ],
)
async def test_pause_accepts_supported_entity_domains(entity_ids: list[str]) -> None:
    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={})
    data = AutomationPauseData(store=MagicMock())
    set_state = AsyncMock(return_value=True)

    await async_pause_automations(
        hass,
        data,
        entity_ids,
        minutes=5,
        set_automation_state=set_state,
        save_data=AsyncMock(return_value=True),
        notify_started_automations=AsyncMock(),
        schedule_resume_callback=MagicMock(),
        schedule_disable_callback=MagicMock(),
        schedule_pre_resume_notification_callback=MagicMock(),
    )

    assert set(data.paused) == set(entity_ids)
    assert [call.args[1] for call in set_state.await_args_list] == entity_ids


@pytest.mark.asyncio
async def test_pause_rejects_unsupported_entity_domain() -> None:
    from homeassistant.exceptions import ServiceValidationError

    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    set_state = AsyncMock(return_value=True)

    with pytest.raises(ServiceValidationError) as exc_info:
        await async_pause_automations(
            MagicMock(),
            AutomationPauseData(store=MagicMock()),
            ["light.living_room"],
            minutes=5,
            set_automation_state=set_state,
        )

    assert exc_info.value.translation_key == "not_automation"
    assert str(exc_info.value) == "light.living_room is not a supported entity"
    set_state.assert_not_awaited()
