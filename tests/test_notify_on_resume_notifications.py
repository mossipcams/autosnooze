"""Notification behavior tests for natural snooze expiry."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, call, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.exceptions import ServiceValidationError

from custom_components.autosnooze.runtime.state import AutomationPauseData
from custom_components.autosnooze.models import PausedAutomation

UTC = timezone.utc
RESUME_NOTIFICATION_ID = "autosnooze_resume_finished"


def _assert_resume_notification_calls(hass: MagicMock, *, title: str, message: str) -> None:
    assert hass.services.async_call.await_args_list == [
        call(
            "persistent_notification",
            "dismiss",
            {"notification_id": RESUME_NOTIFICATION_ID},
            blocking=True,
        ),
        call(
            "persistent_notification",
            "create",
            {
                "title": title,
                "message": message,
                "notification_id": RESUME_NOTIFICATION_ID,
            },
            blocking=True,
        ),
    ]


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
    """End notification copy should be stable and human-readable."""
    from custom_components.autosnooze.coordinator import _build_resume_notification

    now = datetime.now(UTC)
    paused = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen Lights",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notification_trigger="end",
    )

    title, message = _build_resume_notification(paused)

    assert title == "AutoSnooze finished"
    assert message == "Kitchen Lights resumed automatically after its snooze ended."


def test_build_resume_batch_notification_lists_names_and_count() -> None:
    """End batch notification copy should include the count and every friendly name."""
    from custom_components.autosnooze.coordinator import _build_resume_batch_notification

    now = datetime.now(UTC)
    items = [
        PausedAutomation(
            entity_id="automation.kitchen",
            friendly_name="Kitchen",
            paused_at=now,
            resume_at=now + timedelta(hours=1),
            notification_trigger="end",
        ),
        PausedAutomation(
            entity_id="automation.hallway",
            friendly_name="Hallway",
            paused_at=now,
            resume_at=now + timedelta(hours=1),
            notification_trigger="end",
        ),
    ]

    title, message = _build_resume_batch_notification(items)

    assert title == "AutoSnooze finished"
    assert message == "2 automations resumed automatically after their snooze ended: Kitchen, Hallway."


def test_build_started_notification_uses_friendly_name() -> None:
    """Start notification copy should be stable and human-readable."""
    from custom_components.autosnooze.coordinator import _build_started_notification

    now = datetime.now(UTC)
    paused = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen Lights",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notification_trigger="start",
    )

    title, message = _build_started_notification(paused)

    assert title == "AutoSnooze started"
    assert message == "Kitchen Lights snooze started."


def test_build_pre_resume_notification_uses_lead_minutes() -> None:
    """Pre-resume notification copy should mention the configured lead time."""
    from custom_components.autosnooze.coordinator import _build_pre_resume_notification

    now = datetime.now(UTC)
    paused = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen Lights",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notification_trigger="about_to_end",
        notification_lead_minutes=60,
    )

    title, message = _build_pre_resume_notification(paused)

    assert title == "AutoSnooze ending soon"
    assert message == "Kitchen Lights will resume in 60 minutes."


@pytest.mark.asyncio
async def test_send_resume_notification_logs_warning_when_service_fails(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Notification failures should log a warning without aborting resume."""
    from custom_components.autosnooze.coordinator import _send_resume_notification

    hass = MagicMock()
    hass.services.async_call = AsyncMock(side_effect=[None, RuntimeError("notification service down")])

    with caplog.at_level(logging.WARNING, logger="custom_components.autosnooze.coordinator"):
        await _send_resume_notification(hass, "AutoSnooze finished", "Kitchen resumed.")

    assert any(
        record.levelname == "WARNING"
        and record.getMessage() == "Failed to send resume notification: notification service down"
        for record in caplog.records
    )
    _assert_resume_notification_calls(
        hass,
        title="AutoSnooze finished",
        message="Kitchen resumed.",
    )


@pytest.mark.asyncio
async def test_send_resume_notification_logs_warning_when_dismiss_fails_but_still_creates(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Dismiss failures should not block replacing the active notification."""
    from custom_components.autosnooze.coordinator import _send_resume_notification

    hass = MagicMock()
    hass.services.async_call = AsyncMock(side_effect=[RuntimeError("dismiss service down"), None])

    with caplog.at_level(logging.WARNING, logger="custom_components.autosnooze.coordinator"):
        await _send_resume_notification(hass, "AutoSnooze finished", "Kitchen resumed.")

    assert any(
        record.levelname == "WARNING"
        and record.getMessage() == "Failed to dismiss resume notification: dismiss service down"
        for record in caplog.records
    )
    _assert_resume_notification_calls(
        hass,
        title="AutoSnooze finished",
        message="Kitchen resumed.",
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("reason", "save_succeeded", "notification_trigger", "expect_notification"),
    [
        ("expired", True, "end", True),
        ("manual", True, "end", False),
        ("expired", False, "end", False),
        ("expired", True, "none", False),
        ("expired", True, "start", False),
    ],
)
async def test_notify_resumed_automations_gate_conditions(
    reason: str,
    save_succeeded: bool,
    notification_trigger: str,
    expect_notification: bool,
) -> None:
    """End notifications require natural expiry, a successful save, and the end trigger."""
    from custom_components.autosnooze.coordinator import _notify_resumed_automations

    hass = MagicMock()
    hass.services.async_call = AsyncMock()
    now = datetime.now(UTC)
    paused = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notification_trigger=notification_trigger,
    )

    await _notify_resumed_automations(
        hass,
        [paused],
        reason=reason,  # type: ignore[arg-type]
        save_succeeded=save_succeeded,
    )

    if expect_notification:
        _assert_resume_notification_calls(
            hass,
            title="AutoSnooze finished",
            message="Kitchen resumed automatically after its snooze ended.",
        )
    else:
        hass.services.async_call.assert_not_awaited()


@pytest.mark.asyncio
async def test_async_resume_sends_notification_for_expired_end_trigger() -> None:
    """Natural expiry should notify after a successful wake and save for end-trigger snoozes."""
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
        notification_trigger="end",
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
    ):
        await async_resume(hass, data, "automation.kitchen", reason="expired")

    _assert_resume_notification_calls(
        hass,
        title="AutoSnooze finished",
        message="Kitchen Lights resumed automatically after its snooze ended.",
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
        notification_trigger="end",
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
        notification_trigger="end",
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=False)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.schedule_resume"),
    ):
        await async_resume(failed_hass, failed_data, "automation.kitchen", reason="expired")

    failed_hass.services.async_call.assert_not_awaited()


@pytest.mark.asyncio
async def test_async_resume_skips_notification_when_trigger_is_not_end() -> None:
    """Natural expiry should stay silent when the automation is not configured for end notifications."""
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
        notification_trigger="start",
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
    ):
        await async_resume(hass, data, "automation.kitchen", reason="expired")

    hass.services.async_call.assert_not_awaited()


@pytest.mark.asyncio
async def test_async_resume_raises_and_skips_notification_when_save_fails_after_successful_wake() -> None:
    """A successful wake should raise and not notify if persistence failed."""
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
        notification_trigger="end",
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=False)),
        pytest.raises(ServiceValidationError, match="Failed to persist autosnooze state"),
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
        notification_trigger="end",
    )
    data.paused["automation.hallway"] = PausedAutomation(
        entity_id="automation.hallway",
        friendly_name="Hallway",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notification_trigger="end",
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.cancel_timer"),
    ):
        await async_resume_batch(hass, data, ["automation.kitchen", "automation.hallway"], reason="expired")

    _assert_resume_notification_calls(
        hass,
        title="AutoSnooze finished",
        message="2 automations resumed automatically after their snooze ended: Kitchen, Hallway.",
    )


@pytest.mark.asyncio
async def test_async_resume_batch_only_notifies_eligible_automations() -> None:
    """Batch expiry should notify only automations configured for end notifications."""
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
        notification_trigger="end",
    )
    data.paused["automation.hallway"] = PausedAutomation(
        entity_id="automation.hallway",
        friendly_name="Hallway",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
        notification_trigger="start",
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.cancel_timer"),
    ):
        await async_resume_batch(hass, data, ["automation.kitchen", "automation.hallway"], reason="expired")

    _assert_resume_notification_calls(
        hass,
        title="AutoSnooze finished",
        message="Kitchen resumed automatically after its snooze ended.",
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
        notification_trigger="end",
    )


@pytest.mark.asyncio
async def test_async_pause_automations_sends_start_notification_for_immediate_start_trigger() -> None:
    """Immediate snoozes should notify when they actually start for start-trigger entries."""
    from custom_components.autosnooze.services import async_pause_automations

    hass = MagicMock()
    hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Kitchen Lights"})
    hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock())

    with (
        patch("custom_components.autosnooze.services.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.services.schedule_resume"),
        patch("custom_components.autosnooze.services.schedule_pre_resume_notification"),
        patch("custom_components.autosnooze.services.async_save", AsyncMock(return_value=True)),
    ):
        await async_pause_automations(
            hass,
            data,
            ["automation.kitchen"],
            hours=1,
            notification_trigger="start",
        )

    _assert_resume_notification_calls(
        hass,
        title="AutoSnooze started",
        message="Kitchen Lights snooze started.",
    )


@pytest.mark.asyncio
async def test_async_pause_automations_does_not_notify_when_future_start_is_only_scheduled() -> None:
    """Creating a future scheduled snooze should not send a start notification yet."""
    from custom_components.autosnooze.services import async_pause_automations

    hass = MagicMock()
    hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Kitchen Lights"})
    hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)

    with (
        patch("custom_components.autosnooze.services.schedule_disable"),
        patch("custom_components.autosnooze.services.async_save", AsyncMock(return_value=True)),
    ):
        await async_pause_automations(
            hass,
            data,
            ["automation.kitchen"],
            disable_at=now + timedelta(minutes=15),
            resume_at_dt=now + timedelta(hours=1),
            notification_trigger="start",
        )

    hass.services.async_call.assert_not_awaited()


@pytest.mark.asyncio
async def test_async_execute_scheduled_disable_sends_start_notification_for_start_trigger() -> None:
    """Scheduled activation should notify when the snooze actually starts."""
    from custom_components.autosnooze.coordinator import async_execute_scheduled_disable
    from custom_components.autosnooze.models import ScheduledSnooze

    hass = MagicMock()
    hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Kitchen Lights"})
    hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    data.scheduled["automation.kitchen"] = ScheduledSnooze(
        entity_id="automation.kitchen",
        friendly_name="Kitchen Lights",
        disable_at=now,
        resume_at=now + timedelta(hours=1),
        notification_trigger="start",
    )

    with (
        patch("custom_components.autosnooze.coordinator.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.coordinator.schedule_resume"),
        patch("custom_components.autosnooze.coordinator.schedule_pre_resume_notification"),
        patch("custom_components.autosnooze.coordinator.async_save", AsyncMock(return_value=True)),
    ):
        await async_execute_scheduled_disable(hass, data, "automation.kitchen", now + timedelta(hours=1))

    _assert_resume_notification_calls(
        hass,
        title="AutoSnooze started",
        message="Kitchen Lights snooze started.",
    )


@pytest.mark.asyncio
async def test_async_send_pre_resume_notification_sends_about_to_end_notification() -> None:
    """Pre-resume callback should notify eligible active snoozes shortly before resume."""
    from custom_components.autosnooze.coordinator import async_send_pre_resume_notification

    hass = MagicMock()
    hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    data.paused["automation.kitchen"] = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen Lights",
        paused_at=now,
        resume_at=now + timedelta(minutes=15),
        notification_trigger="about_to_end",
        notification_lead_minutes=60,
    )

    await async_send_pre_resume_notification(hass, data, "automation.kitchen")

    _assert_resume_notification_calls(
        hass,
        title="AutoSnooze ending soon",
        message="Kitchen Lights will resume in 60 minutes.",
    )


@pytest.mark.asyncio
async def test_async_send_pre_resume_notification_skips_non_matching_or_missing_pauses() -> None:
    """Pre-resume callback should stay silent for missing or non pre-end snoozes."""
    from custom_components.autosnooze.coordinator import async_send_pre_resume_notification

    hass = MagicMock()
    hass.services.async_call = AsyncMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    data.paused["automation.kitchen"] = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen Lights",
        paused_at=now,
        resume_at=now + timedelta(minutes=15),
        notification_trigger="end",
    )

    await async_send_pre_resume_notification(hass, data, "automation.kitchen")
    await async_send_pre_resume_notification(hass, data, "automation.missing")

    hass.services.async_call.assert_not_awaited()
