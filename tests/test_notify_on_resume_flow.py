"""Flow tests for notify_on_resume propagation."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID

from custom_components.autosnooze.models import AutomationPauseData, ScheduledSnooze

UTC = timezone.utc


@pytest.mark.asyncio
async def test_handle_pause_service_forwards_notify_on_resume() -> None:
    """Pause application should forward notify_on_resume to pause orchestration."""
    from custom_components.autosnooze.application.pause import async_handle_pause_service

    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    call = MagicMock()
    call.data = {
        ATTR_ENTITY_ID: ["automation.a"],
        "hours": 1,
        "notify_on_resume": True,
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
        True,
    )


@pytest.mark.asyncio
async def test_async_pause_automations_sets_notify_on_resume_for_immediate_pause() -> None:
    """Immediate pauses should persist notify_on_resume on paused entries."""
    from custom_components.autosnooze.services import async_pause_automations

    mock_hass = MagicMock()
    mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Kitchen"})
    mock_hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock(async_save=AsyncMock()))

    with patch("custom_components.autosnooze.application.pause.schedule_resume"):
        await async_pause_automations(
            mock_hass,
            data,
            ["automation.kitchen"],
            hours=1,
            notify_on_resume=True,
        )

    assert data.paused["automation.kitchen"].notify_on_resume is True


@pytest.mark.asyncio
async def test_async_pause_automations_sets_notify_on_resume_for_scheduled_pause() -> None:
    """Future scheduled pauses should persist notify_on_resume on scheduled entries."""
    from custom_components.autosnooze.services import async_pause_automations

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
            notify_on_resume=True,
        )

    assert data.scheduled["automation.kitchen"].notify_on_resume is True


@pytest.mark.asyncio
async def test_async_execute_scheduled_disable_copies_notify_on_resume() -> None:
    """Scheduled activation should copy notify_on_resume into the paused entry."""
    from custom_components.autosnooze.coordinator import async_execute_scheduled_disable

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
        notify_on_resume=True,
    )

    with patch("custom_components.autosnooze.coordinator.schedule_resume"):
        await async_execute_scheduled_disable(mock_hass, data, "automation.kitchen", now + timedelta(hours=1))

    assert data.paused["automation.kitchen"].notify_on_resume is True
