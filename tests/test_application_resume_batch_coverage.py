"""Coverage for the live batch-resume application workflow."""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.exceptions import ServiceValidationError

from custom_components.autosnooze.application.resume import (
    async_clear_notification_config_batch,
    async_resume,
    async_resume_batch,
)
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
        notification_trigger=trigger,
    )


@pytest.mark.asyncio
async def test_batch_resume_skips_unloaded_and_empty_requests() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.unloaded = True

    await async_resume_batch(hass, data, ["automation.test"])
    hass.services.async_call.assert_not_called()

    data.unloaded = False
    with patch("custom_components.autosnooze.application.resume.async_save", AsyncMock()) as save:
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
        patch(
            "custom_components.autosnooze.application.resume.async_set_automation_state", AsyncMock(return_value=True)
        ),
        patch("custom_components.autosnooze.application.resume.async_save", AsyncMock(return_value=True)) as save,
        patch("custom_components.autosnooze.application.resume.cancel_timer") as cancel_timer,
    ):
        await async_resume_batch(hass, data, ["automation.one", "automation.two"])

    assert data.paused == {}
    assert save.await_count == 1
    assert cancel_timer.call_count == 2
    listener.assert_called_once()


@pytest.mark.asyncio
async def test_batch_resume_retries_failures_and_drops_exhausted_entities() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.retry"] = _paused("automation.retry")
    data.paused["automation.exhausted"] = _paused("automation.exhausted", retries=5)

    with (
        patch(
            "custom_components.autosnooze.application.resume.async_set_automation_state", AsyncMock(return_value=False)
        ),
        patch("custom_components.autosnooze.application.resume.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.application.resume.schedule_resume") as schedule_resume,
    ):
        await async_resume_batch(hass, data, ["automation.retry", "automation.exhausted"])

    assert "automation.retry" in data.paused
    assert "automation.exhausted" not in data.paused
    schedule_resume.assert_called_once()


@pytest.mark.asyncio
async def test_batch_resume_raises_when_persistence_fails() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.test"] = _paused("automation.test")

    with (
        patch(
            "custom_components.autosnooze.application.resume.async_set_automation_state", AsyncMock(return_value=True)
        ),
        patch("custom_components.autosnooze.application.resume.async_save", AsyncMock(return_value=False)),
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
            "custom_components.autosnooze.application.resume.async_set_automation_state", side_effect=replace_pause
        ) as set_state,
        patch("custom_components.autosnooze.application.resume.async_save", AsyncMock(return_value=True)),
    ):
        await async_resume_batch(hass, data, ["automation.test"])

    assert data.paused["automation.test"] is newer
    assert [call.kwargs["enabled"] for call in set_state.await_args_list] == [True, False]


@pytest.mark.asyncio
async def test_single_resume_retries_then_drops_an_exhausted_entity() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.test"] = _paused("automation.test")

    with (
        patch(
            "custom_components.autosnooze.application.resume.async_set_automation_state", AsyncMock(return_value=False)
        ),
        patch("custom_components.autosnooze.application.resume.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.application.resume.schedule_resume") as schedule_resume,
    ):
        await async_resume(hass, data, "automation.test")

    assert data.paused["automation.test"].resume_retries == 1
    schedule_resume.assert_called_once()

    data.paused["automation.test"].resume_retries = 5
    with (
        patch(
            "custom_components.autosnooze.application.resume.async_set_automation_state", AsyncMock(return_value=False)
        ),
        patch("custom_components.autosnooze.application.resume.async_save", AsyncMock(return_value=True)),
    ):
        await async_resume(hass, data, "automation.test")

    assert "automation.test" not in data.paused


@pytest.mark.asyncio
async def test_clear_notification_config_batch_updates_only_requested_entities() -> None:
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.changed"] = _paused("automation.changed", trigger="end")
    data.paused["automation.unchanged"] = _paused("automation.unchanged")
    data.paused["automation.changed"].notification_lead_minutes = 5

    with (
        patch("custom_components.autosnooze.application.resume.async_save", AsyncMock(return_value=True)) as save,
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

    with patch("custom_components.autosnooze.application.resume.async_save", AsyncMock()) as save:
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
        patch("custom_components.autosnooze.application.resume.async_save", AsyncMock(return_value=False)),
        pytest.raises(ServiceValidationError, match="Failed to persist autosnooze state"),
    ):
        await async_clear_notification_config_batch(hass, data, ["automation.test"])
