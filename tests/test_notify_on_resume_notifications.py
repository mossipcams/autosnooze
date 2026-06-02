"""Notification behavior tests for natural snooze expiry."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.exceptions import ServiceValidationError

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


def test_build_resume_batch_notification_lists_names_and_count() -> None:
    """Batch notification copy should include the count and every friendly name."""
    from custom_components.autosnooze.coordinator import _build_resume_batch_notification

    now = datetime.now(UTC)
    items = [
        PausedAutomation(
            entity_id="automation.kitchen",
            friendly_name="Kitchen",
            paused_at=now,
            resume_at=now + timedelta(hours=1),
            notify_on_resume=True,
        ),
        PausedAutomation(
            entity_id="automation.hallway",
            friendly_name="Hallway",
            paused_at=now,
            resume_at=now + timedelta(hours=1),
            notify_on_resume=True,
        ),
    ]

    title, message = _build_resume_batch_notification(items)

    assert title == "AutoSnooze finished"
    assert message == "2 automations resumed automatically after their snooze ended: Kitchen, Hallway."


@pytest.mark.asyncio
async def test_send_resume_notification_logs_warning_when_service_fails(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Notification failures should log a warning without aborting resume."""
    from custom_components.autosnooze.coordinator import _send_resume_notification

    hass = MagicMock()
    hass.services.async_call = AsyncMock(side_effect=RuntimeError("notification service down"))

    with caplog.at_level(logging.WARNING, logger="custom_components.autosnooze.coordinator"):
        await _send_resume_notification(hass, "AutoSnooze finished", "Kitchen resumed.")

    assert any(
        record.levelname == "WARNING"
        and record.getMessage() == "Failed to send resume notification: notification service down"
        for record in caplog.records
    )
    hass.services.async_call.assert_awaited_once_with(
        "persistent_notification",
        "create",
        {"title": "AutoSnooze finished", "message": "Kitchen resumed."},
        blocking=True,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("reason", "save_succeeded", "notify_on_resume", "expect_notification"),
    [
        ("expired", True, True, True),
        ("manual", True, True, False),
        ("expired", False, True, False),
        ("expired", True, False, False),
    ],
)
async def test_notify_resumed_automations_gate_conditions(
    reason: str,
    save_succeeded: bool,
    notify_on_resume: bool,
    expect_notification: bool,
) -> None:
    """Notifications require natural expiry, a successful save, and an opt-in flag."""
    from custom_components.autosnooze.coordinator import _notify_resumed_automations

    hass = MagicMock()
    hass.services.async_call = AsyncMock()
    now = datetime.now(UTC)
    paused = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notify_on_resume=notify_on_resume,
    )

    await _notify_resumed_automations(
        hass,
        [paused],
        reason=reason,  # type: ignore[arg-type]
        save_succeeded=save_succeeded,
    )

    if expect_notification:
        hass.services.async_call.assert_awaited_once_with(
            "persistent_notification",
            "create",
            {
                "title": "AutoSnooze finished",
                "message": "Kitchen resumed automatically after its snooze ended.",
            },
            blocking=True,
        )
    else:
        hass.services.async_call.assert_not_awaited()


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
async def test_async_resume_skips_notification_when_notify_on_resume_false() -> None:
    """Natural expiry should stay silent when the automation did not opt in."""
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
        notify_on_resume=False,
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
    ):
        await async_resume(hass, data, "automation.kitchen", reason="expired")

    hass.services.async_call.assert_not_awaited()


@pytest.mark.asyncio
async def test_async_resume_skips_notification_when_save_fails_after_successful_wake() -> None:
    """A successful wake should not notify if persistence failed."""
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
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=False)),
    ):
        await async_resume(hass, data, "automation.kitchen", reason="expired")

    hass.services.async_call.assert_not_awaited()
    assert "automation.kitchen" not in data.paused


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


@pytest.mark.asyncio
async def test_async_resume_batch_only_notifies_eligible_automations() -> None:
    """Batch expiry should notify only automations that opted in."""
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
        notify_on_resume=False,
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
            "message": "Kitchen resumed automatically after its snooze ended.",
        },
        blocking=True,
    )


@pytest.mark.asyncio
async def test_async_resume_batch_raises_and_skips_notification_when_save_fails() -> None:
    """Batch expiry should not notify when persistence fails."""
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

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=False)),
        patch("custom_components.autosnooze.coordinator.cancel_timer"),
        pytest.raises(ServiceValidationError, match="Failed to persist autosnooze state"),
    ):
        await async_resume_batch(hass, data, ["automation.kitchen"], reason="expired")

    hass.services.async_call.assert_not_awaited()
