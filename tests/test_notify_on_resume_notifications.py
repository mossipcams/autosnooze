"""Notification behavior tests for natural snooze expiry."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID

from custom_components.autosnooze.models import AutomationPauseData, PausedAutomation

UTC = timezone.utc


def test_schedule_resume_timer_uses_expired_reason() -> None:
    """Auto-resume timers should mark wakeups as natural expiry."""
    from custom_components.autosnooze.runtime.timers import schedule_resume

    hass = MagicMock()
    hass.async_create_task = MagicMock(side_effect=lambda coro: coro.close())
    data = AutomationPauseData()
    resume_at = datetime.now(UTC) + timedelta(hours=1)

    with (
        patch("custom_components.autosnooze.runtime.timers.async_track_point_in_time") as mock_track,
        patch("custom_components.autosnooze.runtime.timers.async_resume", new_callable=AsyncMock) as async_resume,
    ):
        mock_track.return_value = MagicMock()
        schedule_resume(hass, data, "automation.kitchen", resume_at)
        callback = mock_track.call_args.args[1]
        callback(resume_at)

    async_resume.assert_called_once_with(hass, data, "automation.kitchen", reason="expired")


@pytest.mark.asyncio
async def test_cancel_handlers_use_manual_reason() -> None:
    """Manual wake handlers should preserve the manual resume reason."""
    from custom_components.autosnooze.application.resume import (
        async_handle_cancel_all_service,
        async_handle_cancel_service,
    )

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    data.paused["automation.kitchen"] = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
    )
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.kitchen", "automation.unknown"]}

    with patch(
        "custom_components.autosnooze.application.resume.async_resume_batch",
        new_callable=AsyncMock,
    ) as batch_resume:
        await async_handle_cancel_service(hass, data, call)
        await async_handle_cancel_all_service(hass, data)

    assert batch_resume.await_count == 2
    batch_resume.assert_any_await(hass, data, ["automation.kitchen"], reason="manual")
    batch_resume.assert_any_await(hass, data, ["automation.kitchen"], reason="manual")


def test_build_resume_notification_uses_friendly_name() -> None:
    """Single notification copy should be stable and human-readable."""
    from custom_components.autosnooze.coordinator import _build_resume_notification

    now = datetime.now(UTC)
    paused = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen Lights",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notify_on_resume=True,
    )

    title, message = _build_resume_notification(paused)

    assert title == "AutoSnooze finished"
    assert message == "Kitchen Lights resumed automatically after its snooze ended."


@pytest.mark.asyncio
async def test_async_resume_sends_notification_for_expired_notify_on_resume() -> None:
    """Natural expiry should notify after a successful wake and save."""
    from custom_components.autosnooze.coordinator import async_resume

    hass = MagicMock()
    hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    data.paused["automation.kitchen"] = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen Lights",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notify_on_resume=True,
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
    ):
        await async_resume(hass, data, "automation.kitchen", reason="expired")

    hass.services.async_call.assert_awaited_once_with(
        "persistent_notification",
        "create",
        {
            "title": "AutoSnooze finished",
            "message": "Kitchen Lights resumed automatically after its snooze ended.",
        },
        blocking=True,
    )


@pytest.mark.asyncio
async def test_async_resume_suppresses_notification_for_manual_and_failed_wake() -> None:
    """Manual wakeups and failed expiry wake attempts should stay silent."""
    from custom_components.autosnooze.coordinator import async_resume

    now = datetime.now(UTC)

    manual_hass = MagicMock()
    manual_hass.services.async_call = AsyncMock()
    manual_data = AutomationPauseData(store=MagicMock())
    manual_data.paused["automation.kitchen"] = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen Lights",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notify_on_resume=True,
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
    ):
        await async_resume(manual_hass, manual_data, "automation.kitchen", reason="manual")

    manual_hass.services.async_call.assert_not_awaited()

    failed_hass = MagicMock()
    failed_hass.services.async_call = AsyncMock()
    failed_data = AutomationPauseData(store=MagicMock())
    failed_data.paused["automation.kitchen"] = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen Lights",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notify_on_resume=True,
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=False)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.schedule_resume"),
    ):
        await async_resume(failed_hass, failed_data, "automation.kitchen", reason="expired")

    failed_hass.services.async_call.assert_not_awaited()


@pytest.mark.asyncio
async def test_async_resume_batch_sends_one_summary_notification_for_expired_reason() -> None:
    """Expired batch wakes should send one summary notification for eligible automations."""
    from custom_components.autosnooze.coordinator import async_resume_batch

    hass = MagicMock()
    hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    data.paused["automation.kitchen"] = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notify_on_resume=True,
    )
    data.paused["automation.hallway"] = PausedAutomation(
        entity_id="automation.hallway",
        friendly_name="Hallway",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notify_on_resume=True,
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.cancel_timer"),
    ):
        await async_resume_batch(hass, data, ["automation.kitchen", "automation.hallway"], reason="expired")

    hass.services.async_call.assert_awaited_once_with(
        "persistent_notification",
        "create",
        {
            "title": "AutoSnooze finished",
            "message": "2 automations resumed automatically after their snooze ended: Kitchen, Hallway.",
        },
        blocking=True,
    )
