"""Persistent notification helpers for application workflows."""

from __future__ import annotations

import logging
from typing import Literal

from homeassistant.core import HomeAssistant

from ..domain.notifications import (
    NOTIFICATION_TRIGGER_ABOUT_TO_END,
    NOTIFICATION_TRIGGER_END,
    NOTIFICATION_TRIGGER_START,
)
from ..models import PausedAutomation
from ..runtime.state import AutomationPauseData

_LOGGER = logging.getLogger(__name__)
ResumeReason = Literal["manual", "expired"]
_RESUME_NOTIFICATION_ID = "autosnooze_resume_finished"
_START_NOTIFICATION_TITLE = "AutoSnooze started"
_PRE_RESUME_NOTIFICATION_TITLE = "AutoSnooze ending soon"
_RESUME_NOTIFICATION_TITLE = "AutoSnooze finished"


def build_resume_notification(paused: PausedAutomation) -> tuple[str, str]:
    """Build copy for a single natural-expiry notification."""
    return (
        _RESUME_NOTIFICATION_TITLE,
        f"{paused.friendly_name} resumed automatically after its snooze ended.",
    )


def build_resume_batch_notification(paused_items: list[PausedAutomation]) -> tuple[str, str]:
    """Build copy for a batch natural-expiry notification."""
    names = ", ".join(paused.friendly_name for paused in paused_items)
    count = len(paused_items)
    return (
        _RESUME_NOTIFICATION_TITLE,
        f"{count} automations resumed automatically after their snooze ended: {names}.",
    )


def build_started_notification(paused: PausedAutomation) -> tuple[str, str]:
    """Build copy for a single snooze-start notification."""
    return (
        _START_NOTIFICATION_TITLE,
        f"{paused.friendly_name} snooze started.",
    )


def build_started_batch_notification(paused_items: list[PausedAutomation]) -> tuple[str, str]:
    """Build copy for a batch snooze-start notification."""
    names = ", ".join(paused.friendly_name for paused in paused_items)
    count = len(paused_items)
    return (
        _START_NOTIFICATION_TITLE,
        f"{count} automations snooze started: {names}.",
    )


def build_pre_resume_notification(paused: PausedAutomation) -> tuple[str, str]:
    """Build copy for a single pre-resume notification."""
    lead_minutes = paused.notification_lead_minutes or 0
    minute_label = "minute" if lead_minutes == 1 else "minutes"
    return (
        _PRE_RESUME_NOTIFICATION_TITLE,
        f"{paused.friendly_name} will resume in {lead_minutes} {minute_label}.",
    )


async def dismiss_resume_notification(hass: HomeAssistant) -> None:
    """Dismiss the active resume notification without breaking resume flow on failure."""
    try:
        await hass.services.async_call(
            "persistent_notification",
            "dismiss",
            {"notification_id": _RESUME_NOTIFICATION_ID},
            blocking=True,
        )
    except Exception as err:
        _LOGGER.warning("Failed to dismiss resume notification: %s", err)


async def send_resume_notification(hass: HomeAssistant, title: str, message: str) -> None:
    """Send a persistent notification without breaking resume flow on failure."""
    await dismiss_resume_notification(hass)

    try:
        await hass.services.async_call(
            "persistent_notification",
            "create",
            {
                "title": title,
                "message": message,
                "notification_id": _RESUME_NOTIFICATION_ID,
            },
            blocking=True,
        )
    except Exception as err:
        _LOGGER.warning("Failed to send resume notification: %s", err)


async def notify_resumed_automations(
    hass: HomeAssistant,
    resumed_items: list[PausedAutomation],
    *,
    reason: ResumeReason,
    save_succeeded: bool,
) -> None:
    """Notify only for successful natural-expiry resumes that requested it."""
    if reason != "expired" or not save_succeeded:
        return

    eligible = [paused for paused in resumed_items if paused.notification_trigger == NOTIFICATION_TRIGGER_END]
    if not eligible:
        return

    if len(eligible) == 1:
        title, message = build_resume_notification(eligible[0])
    else:
        title, message = build_resume_batch_notification(eligible)

    await send_resume_notification(hass, title, message)


async def notify_started_automations(
    hass: HomeAssistant,
    started_items: list[PausedAutomation],
    *,
    save_succeeded: bool,
) -> None:
    """Notify only for successful snooze starts that requested start notifications."""
    if not save_succeeded:
        return

    eligible = [paused for paused in started_items if paused.notification_trigger == NOTIFICATION_TRIGGER_START]
    if not eligible:
        return

    if len(eligible) == 1:
        title, message = build_started_notification(eligible[0])
    else:
        title, message = build_started_batch_notification(eligible)

    await send_resume_notification(hass, title, message)


async def async_send_pre_resume_notification(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
) -> None:
    """Send a notification shortly before a snooze ends when configured."""
    async with data.lock:
        paused = data.paused.get(entity_id)
        if (
            paused is None
            or paused.notification_trigger != NOTIFICATION_TRIGGER_ABOUT_TO_END
            or paused.notification_lead_minutes is None
        ):
            return

    title, message = build_pre_resume_notification(paused)
    await send_resume_notification(hass, title, message)
