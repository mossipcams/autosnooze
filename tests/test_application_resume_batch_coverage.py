"""Coverage for the live batch-resume application workflow."""

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.exceptions import ServiceValidationError

from custom_components.autosnooze.application.resume import (
    async_clear_notification_config_batch,
    async_resume,
    async_resume_batch,
)
from custom_components.autosnooze.domain.notifications import NOTIFICATION_TRIGGER_NONE
from custom_components.autosnooze.models import PausedAutomation
from custom_components.autosnooze.runtime.state import AutomationPauseData

UTC = timezone.utc


def _paused(entity_id: str, *, retries: int = 0, trigger: str | None = None) -> PausedAutomation:
    now = datetime.now(UTC)
    return PausedAutomation(
        entity_id=entity_id,
        friendly_name=entity_id,
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        resume_retries=retries,
        notification_trigger=trigger if trigger is not None else NOTIFICATION_TRIGGER_NONE,
    )


@pytest.mark.asyncio
async def test_batch_resume_skips_unloaded_and_empty_requests() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.unloaded = True

    await async_resume_batch(hass, data, ["automation.test"])
    hass.services.async_call.assert_not_called()

    data.unloaded = False
    with patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock()) as save:
        await async_resume_batch(hass, data, [])
    save.assert_not_awaited()


@pytest.mark.asyncio
async def test_batch_resume_wakes_entities_and_persists_once() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.one"] = _paused("automation.one")
    data.paused["automation.two"] = _paused("automation.two")
    listener = MagicMock()
    data.add_listener(listener)

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)) as save,
        patch("custom_components.autosnooze.application.resume.cancel_timer") as cancel_timer,
    ):
        await async_resume_batch(hass, data, ["automation.one", "automation.two"])

    assert data.paused == {}
    assert save.await_count == 1
    assert cancel_timer.call_count == 2
    listener.assert_called_once()


@pytest.mark.asyncio
async def test_batch_resume_releases_lock_before_waiting_on_async_save() -> None:
    """Batch resume should not hold data.lock while awaiting persistence."""
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.one"] = _paused("automation.one")

    save_started = asyncio.Event()
    allow_save_finish = asyncio.Event()

    async def slow_save(_data: AutomationPauseData) -> bool:
        save_started.set()
        await allow_save_finish.wait()
        return True

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.async_save", side_effect=slow_save),
    ):
        resume_task = asyncio.create_task(async_resume_batch(hass, data, ["automation.one"]))

        await asyncio.wait_for(save_started.wait(), timeout=1)

        acquired_while_save_in_flight = False
        try:
            await asyncio.wait_for(data.lock.acquire(), timeout=0.05)
            acquired_while_save_in_flight = True
        finally:
            if acquired_while_save_in_flight:
                data.lock.release()

        allow_save_finish.set()
        await resume_task

    assert acquired_while_save_in_flight is True


@pytest.mark.asyncio
async def test_batch_resume_retries_failures_and_retains_exhausted_entities() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.retry"] = _paused("automation.retry")
    data.paused["automation.exhausted"] = _paused("automation.exhausted", retries=5)

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", AsyncMock(return_value=False)),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume") as schedule_resume,
    ):
        await async_resume_batch(hass, data, ["automation.retry", "automation.exhausted"], reason="expired")

    assert "automation.retry" in data.paused
    assert "automation.exhausted" in data.paused
    schedule_resume.assert_called_once()


@pytest.mark.asyncio
async def test_batch_resume_raises_when_all_turn_on_fail_for_manual_reason() -> None:
    """When every automation.turn_on fails on user-initiated cancel, persist retries then raise."""
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.a"] = _paused("automation.a")
    data.paused["automation.b"] = _paused("automation.b")
    set_state = AsyncMock(return_value=False)
    save = AsyncMock(return_value=True)
    listener = MagicMock()
    data.add_listener(listener)

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", set_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", save),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume") as schedule_resume,
        patch("custom_components.autosnooze.application.resume.notify_resumed", AsyncMock()) as notify_resumed,
        patch("custom_components.autosnooze.application.resume.track_if_enabled") as track_if_enabled,
        pytest.raises(ServiceValidationError) as exc_info,
    ):
        await async_resume_batch(hass, data, ["automation.a", "automation.b"], reason="manual")

    assert exc_info.value.translation_domain == "autosnooze"
    assert exc_info.value.translation_key == "wake_failed"
    assert set(data.paused) == {"automation.a", "automation.b"}
    assert data.paused["automation.a"].resume_retries == 1
    assert data.paused["automation.b"].resume_retries == 1
    assert set_state.await_count == 2
    save.assert_awaited_once()
    listener.assert_called_once()
    assert schedule_resume.call_count == 2
    notify_resumed.assert_not_awaited()
    track_if_enabled.assert_not_called()


@pytest.mark.asyncio
async def test_batch_resume_raises_when_partial_turn_on_fail_for_manual_reason() -> None:
    """Partial wake on user-initiated cancel must persist successes then raise wake_failed."""
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.a"] = _paused("automation.a")
    data.paused["automation.b"] = _paused("automation.b")
    listener = MagicMock()
    data.add_listener(listener)

    async def set_state(_hass: object, entity_id: str, *, enabled: bool) -> bool:
        return entity_id == "automation.a" and enabled

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=set_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)) as save,
        patch("custom_components.autosnooze.runtime.ports.schedule_resume") as schedule_resume,
        patch("custom_components.autosnooze.application.resume.notify_resumed", AsyncMock()) as notify_resumed,
        patch("custom_components.autosnooze.application.resume.track_if_enabled") as track_if_enabled,
        pytest.raises(ServiceValidationError) as exc_info,
    ):
        await async_resume_batch(hass, data, ["automation.a", "automation.b"], reason="manual")

    assert exc_info.value.translation_domain == "autosnooze"
    assert exc_info.value.translation_key == "wake_failed"
    assert set(data.paused) == {"automation.b"}
    assert data.paused["automation.b"].resume_retries == 1
    save.assert_awaited_once()
    listener.assert_called_once()
    schedule_resume.assert_called_once_with(
        hass,
        data,
        "automation.b",
        data.paused["automation.b"].resume_at,
        resume_callback=async_resume,
    )
    notify_resumed.assert_awaited_once()
    resumed_entities = [paused.entity_id for paused in notify_resumed.await_args.args[1]]
    assert resumed_entities == ["automation.a"]
    track_if_enabled.assert_called_once_with(
        data,
        "snooze_ended",
        {"reason": "manual"},
        source="service",
    )


@pytest.mark.asyncio
async def test_batch_resume_raises_when_persistence_fails() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.test"] = _paused("automation.test")

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=False)),
        pytest.raises(ServiceValidationError, match="Failed to persist autosnooze state"),
    ):
        await async_resume_batch(hass, data, ["automation.test"])


@pytest.mark.asyncio
async def test_batch_resume_redisables_entity_when_a_newer_pause_wins() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    original = _paused("automation.test")
    newer = _paused("automation.test")
    data.paused["automation.test"] = original

    async def replace_pause(*_args, enabled: bool) -> bool:
        if enabled:
            data.paused["automation.test"] = newer
        return enabled

    with (
        patch(
            "custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=replace_pause
        ) as set_state,
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
    ):
        await async_resume_batch(hass, data, ["automation.test"])

    assert data.paused["automation.test"] is newer
    assert [call.kwargs["enabled"] for call in set_state.await_args_list] == [True, False]


@pytest.mark.asyncio
async def test_batch_resume_cancellation_restores_entities_woken_before_commit() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.one"] = _paused("automation.one")
    data.paused["automation.two"] = _paused("automation.two")
    second_started = asyncio.Event()
    allow_second_finish = asyncio.Event()

    async def set_state(_hass: object, entity_id: str, *, enabled: bool) -> bool:
        if entity_id == "automation.two" and enabled:
            second_started.set()
            await allow_second_finish.wait()
        return True

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=set_state) as state,
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)) as save,
    ):
        task = asyncio.create_task(async_resume_batch(hass, data, ["automation.one", "automation.two"]))
        await asyncio.wait_for(second_started.wait(), timeout=1)
        task.cancel()
        allow_second_finish.set()

        with pytest.raises(asyncio.CancelledError):
            await task

    assert list(data.paused) == ["automation.one", "automation.two"]
    assert [(call.args[1], call.kwargs["enabled"]) for call in state.await_args_list] == [
        ("automation.one", True),
        ("automation.two", True),
        ("automation.one", False),
        ("automation.two", False),
    ]
    save.assert_not_awaited()


@pytest.mark.asyncio
async def test_single_resume_retries_then_retains_an_exhausted_entity() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.test"] = _paused("automation.test")

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", AsyncMock(return_value=False)),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume") as schedule_resume,
    ):
        await async_resume(hass, data, "automation.test")

    assert data.paused["automation.test"].resume_retries == 1
    schedule_resume.assert_called_once()

    data.paused["automation.test"].resume_retries = 5
    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", AsyncMock(return_value=False)),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
    ):
        await async_resume(hass, data, "automation.test")

    assert "automation.test" in data.paused


@pytest.mark.asyncio
async def test_clear_notification_config_batch_updates_only_requested_entities() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.changed"] = _paused("automation.changed", trigger="end")
    data.paused["automation.unchanged"] = _paused("automation.unchanged")
    data.paused["automation.changed"].notification_lead_minutes = 5

    with (
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)) as save,
        patch("custom_components.autosnooze.application.resume.cancel_notification_timer") as cancel_timer,
    ):
        await async_clear_notification_config_batch(
            hass,
            data,
            ["automation.changed", "automation.unchanged", "automation.missing"],
        )

    assert data.paused["automation.changed"].notification_trigger == "none"
    assert data.paused["automation.changed"].notification_lead_minutes is None
    assert save.await_count == 1
    assert cancel_timer.call_count == 2


@pytest.mark.asyncio
async def test_clear_notification_config_batch_skips_empty_unloaded_and_unchanged_requests() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())

    with patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock()) as save:
        await async_clear_notification_config_batch(hass, data, [])
        data.unloaded = True
        await async_clear_notification_config_batch(hass, data, ["automation.test"])

    save.assert_not_awaited()


@pytest.mark.asyncio
async def test_clear_notification_config_batch_raises_when_persistence_fails() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.test"] = _paused("automation.test", trigger="end")

    with (
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=False)),
        pytest.raises(ServiceValidationError, match="Failed to persist autosnooze state"),
    ):
        await async_clear_notification_config_batch(hass, data, ["automation.test"])
