"""Application notification workflows for AutoSnooze."""

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
_STARTED_NOTIFICATION_ID = "autosnooze_started"
_PRE_RESUME_NOTIFICATION_ID = "autosnooze_pre_resume"
_START_NOTIFICATION_TITLE = "AutoSnooze started"
_PRE_RESUME_NOTIFICATION_TITLE = "AutoSnooze ending soon"
_RESUME_NOTIFICATION_TITLE = "AutoSnooze finished"


def _build_resume_notification(paused: PausedAutomation) -> tuple[str, str]:
    return _RESUME_NOTIFICATION_TITLE, f"{paused.friendly_name} resumed automatically after its snooze ended."


def _build_resume_batch_notification(paused_items: list[PausedAutomation]) -> tuple[str, str]:
    names = ", ".join(paused.friendly_name for paused in paused_items)
    return _RESUME_NOTIFICATION_TITLE, (
        f"{len(paused_items)} automations resumed automatically after their snooze ended: {names}."
    )


def _build_started_notification(paused: PausedAutomation) -> tuple[str, str]:
    return _START_NOTIFICATION_TITLE, f"{paused.friendly_name} snooze started."


def _build_started_batch_notification(paused_items: list[PausedAutomation]) -> tuple[str, str]:
    names = ", ".join(paused.friendly_name for paused in paused_items)
    return _START_NOTIFICATION_TITLE, f"{len(paused_items)} automations snooze started: {names}."


def _build_pre_resume_notification(paused: PausedAutomation) -> tuple[str, str]:
    lead_minutes = paused.notification_lead_minutes or 0
    minute_label = "minute" if lead_minutes == 1 else "minutes"
    return _PRE_RESUME_NOTIFICATION_TITLE, f"{paused.friendly_name} will resume in {lead_minutes} {minute_label}."


async def _send_resume_notification(
    hass: HomeAssistant,
    title: str,
    message: str,
    notification_id: str = _RESUME_NOTIFICATION_ID,
) -> None:
    try:
        await hass.services.async_call(
            "persistent_notification",
            "dismiss",
            {"notification_id": notification_id},
            blocking=True,
        )
    except Exception as err:
        _LOGGER.warning("Failed to dismiss resume notification: %s", err)

    try:
        await hass.services.async_call(
            "persistent_notification",
            "create",
            {"title": title, "message": message, "notification_id": notification_id},
            blocking=True,
        )
    except Exception as err:
        _LOGGER.warning("Failed to send resume notification: %s", err)


async def notify_resumed(
    hass: HomeAssistant,
    resumed_items: list[PausedAutomation],
    *,
    reason: ResumeReason,
    save_succeeded: bool,
) -> None:
    if reason != "expired" or not save_succeeded:
        return
    eligible = [paused for paused in resumed_items if paused.notification_trigger == NOTIFICATION_TRIGGER_END]
    if not eligible:
        return
    title, message = (
        _build_resume_notification(eligible[0]) if len(eligible) == 1 else _build_resume_batch_notification(eligible)
    )
    await _send_resume_notification(hass, title, message)


async def notify_started(
    hass: HomeAssistant,
    started_items: list[PausedAutomation],
    *,
    save_succeeded: bool = True,
) -> None:
    if not save_succeeded:
        return
    eligible = [paused for paused in started_items if paused.notification_trigger == NOTIFICATION_TRIGGER_START]
    if not eligible:
        return
    title, message = (
        _build_started_notification(eligible[0]) if len(eligible) == 1 else _build_started_batch_notification(eligible)
    )
    await _send_resume_notification(hass, title, message, _STARTED_NOTIFICATION_ID)


async def send_pre_resume_notification(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
) -> None:
    async with data.lock:
        paused = data.paused.get(entity_id)
        if (
            paused is None
            or paused.notification_trigger != NOTIFICATION_TRIGGER_ABOUT_TO_END
            or paused.notification_lead_minutes is None
        ):
            return
    title, message = _build_pre_resume_notification(paused)
    await _send_resume_notification(hass, title, message, f"{_PRE_RESUME_NOTIFICATION_ID}_{entity_id}")
