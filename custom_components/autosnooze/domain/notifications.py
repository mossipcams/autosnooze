"""Notification trigger domain helpers."""

from __future__ import annotations

from datetime import timedelta
from typing import Literal

NotificationTrigger = Literal["none", "start", "about_to_end", "end"]

NOTIFICATION_TRIGGER_NONE: NotificationTrigger = "none"
NOTIFICATION_TRIGGER_START: NotificationTrigger = "start"
NOTIFICATION_TRIGGER_ABOUT_TO_END: NotificationTrigger = "about_to_end"
NOTIFICATION_TRIGGER_END: NotificationTrigger = "end"

NOTIFICATION_TRIGGER_VALUES: tuple[NotificationTrigger, ...] = (
    NOTIFICATION_TRIGGER_NONE,
    NOTIFICATION_TRIGGER_START,
    NOTIFICATION_TRIGGER_ABOUT_TO_END,
    NOTIFICATION_TRIGGER_END,
)
NOTIFICATION_LEAD_MINUTES_VALUES: tuple[int, ...] = (30, 60, 120, 240)


def validate_notification_config(
    trigger: str,
    lead_minutes: int | None,
) -> None:
    """Validate notification trigger and lead-time combinations."""
    if trigger not in NOTIFICATION_TRIGGER_VALUES:
        raise ValueError(f"Invalid notification_trigger: {trigger}")

    if trigger == NOTIFICATION_TRIGGER_ABOUT_TO_END:
        if lead_minutes not in NOTIFICATION_LEAD_MINUTES_VALUES:
            raise ValueError(
                f"notification_lead_minutes must be one of {NOTIFICATION_LEAD_MINUTES_VALUES} for about_to_end",
            )
        return

    if lead_minutes is not None:
        raise ValueError("notification_lead_minutes is only allowed for about_to_end")


def notification_window_supports_lead(
    trigger: str,
    lead_minutes: int | None,
    *,
    window: timedelta,
) -> bool:
    """Return whether an about-to-end lead can occur before the snooze ends."""
    if trigger != NOTIFICATION_TRIGGER_ABOUT_TO_END:
        return True
    if lead_minutes is None:
        return False
    return window >= timedelta(minutes=lead_minutes)
