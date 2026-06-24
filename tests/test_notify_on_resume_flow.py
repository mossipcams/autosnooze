"""Flow tests for notification trigger propagation."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID

from custom_components.autosnooze.runtime.state import AutomationPauseData
from custom_components.autosnooze.models import PausedAutomation, ScheduledSnooze

UTC = timezone.utc


@pytest.mark.asyncio
async def test_handle_pause_service_forwards_notification_trigger() -> None:
    """Pause application should forward notification trigger config to pause orchestration."""
    from custom_components.autosnooze.application.pause import async_handle_pause_service

    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    call = MagicMock()
    call.data = {
        ATTR_ENTITY_ID: ["automation.a"],
        "hours": 1,
        "notification_trigger": "about_to_end",
        "notification_lead_minutes": 60,
    }

    with (
        patch("custom_components.autosnooze.application.pause._validate_guardrails"),
        patch(
            "custom_components.autosnooze.application.pause.async_pause_automations",
            new_callable=AsyncMock,
        ) as pause_automations,
    ):
        await async_handle_pause_service(mock_hass, data, call)

    pause_automations.assert_called_once_with(
        mock_hass,
        data,
        ["automation.a"],
        0,
        1,
        0,
        None,
        None,
        "about_to_end",
        60,
    )


@pytest.mark.asyncio
async def test_async_pause_automations_sets_notification_trigger_for_immediate_pause() -> None:
    """Immediate pauses should persist notification trigger settings on paused entries."""
    from custom_components.autosnooze.application.pause import async_pause_automations

    mock_hass = MagicMock()
    mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Kitchen"})
    mock_hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock(async_save=AsyncMock()))

    with (
        patch("custom_components.autosnooze.application.pause.schedule_resume"),
        patch(
            "custom_components.autosnooze.application.pause.schedule_pre_resume_notification"
        ) as schedule_notification,
    ):
        await async_pause_automations(
            mock_hass,
            data,
            ["automation.kitchen"],
            hours=1,
            notification_trigger="about_to_end",
            notification_lead_minutes=30,
        )

    assert data.paused["automation.kitchen"].notification_trigger == "about_to_end"
    assert data.paused["automation.kitchen"].notification_lead_minutes == 30
    schedule_notification.assert_called_once()


@pytest.mark.asyncio
async def test_async_pause_automations_sets_notification_trigger_for_scheduled_pause() -> None:
    """Future scheduled pauses should persist notification trigger settings on scheduled entries."""
    from custom_components.autosnooze.application.pause import async_pause_automations

    mock_hass = MagicMock()
    mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Kitchen"})
    mock_hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock(async_save=AsyncMock()))

    now = datetime.now(UTC)
    with patch("custom_components.autosnooze.application.pause.schedule_disable"):
        await async_pause_automations(
            mock_hass,
            data,
            ["automation.kitchen"],
            disable_at=now + timedelta(minutes=15),
            resume_at_dt=now + timedelta(hours=1),
            notification_trigger="end",
        )

    assert data.scheduled["automation.kitchen"].notification_trigger == "end"
    assert data.scheduled["automation.kitchen"].notification_lead_minutes is None


@pytest.mark.asyncio
async def test_async_execute_scheduled_disable_copies_notification_trigger() -> None:
    """Scheduled activation should copy notification trigger settings into the paused entry."""
    from custom_components.autosnooze.application.scheduled import async_execute_scheduled_disable

    mock_hass = MagicMock()
    mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Kitchen"})
    mock_hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock(async_save=AsyncMock()))

    now = datetime.now(UTC)
    data.scheduled["automation.kitchen"] = ScheduledSnooze(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        disable_at=now,
        resume_at=now + timedelta(hours=1),
        notification_trigger="about_to_end",
        notification_lead_minutes=30,
    )

    with (
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
        patch("custom_components.autosnooze.runtime.ports.schedule_pre_resume_notification") as schedule_notification,
    ):
        await async_execute_scheduled_disable(mock_hass, data, "automation.kitchen", now + timedelta(hours=1))

    assert data.paused["automation.kitchen"].notification_trigger == "about_to_end"
    assert data.paused["automation.kitchen"].notification_lead_minutes == 30
    schedule_notification.assert_called_once()


@pytest.mark.asyncio
async def test_async_clear_notification_config_resets_paused_entry_and_cancels_timer() -> None:
    """Clearing a paused automation's notification config should persist and cancel pending pre-resume timers."""
    from custom_components.autosnooze.application.resume import (
        async_clear_notification_config_batch as async_clear_notification_config,
    )

    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock(async_save=AsyncMock()))

    now = datetime.now(UTC)
    data.paused["automation.kitchen"] = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        notification_trigger="about_to_end",
        notification_lead_minutes=30,
    )
    notification_unsub = MagicMock()
    data.notification_timers["automation.kitchen"] = notification_unsub

    await async_clear_notification_config(mock_hass, data, ["automation.kitchen"])

    paused = data.paused["automation.kitchen"]
    assert paused.notification_trigger == "none"
    assert paused.notification_lead_minutes is None
    notification_unsub.assert_called_once_with()
    assert "automation.kitchen" not in data.notification_timers

    stored = data.get_paused_dict()["automation.kitchen"]
    assert stored["notification_trigger"] == "none"
    assert "notification_lead_minutes" not in stored
