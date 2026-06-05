"""Timer scheduling adapter for runtime state."""

from __future__ import annotations

from datetime import datetime
from typing import Callable

from homeassistant.core import HomeAssistant

from ...models import PausedAutomation, ScheduledSnooze
from .. import ports as runtime_ports
from ..state import AutomationPauseData
from ..timers import (
    NotificationCallback,
    ResumeCallback,
    ScheduledDisableCallback,
    schedule_disable as runtime_schedule_disable,
    schedule_pre_resume_notification as runtime_schedule_pre_resume_notification,
    schedule_resume as runtime_schedule_resume,
)


def schedule_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
    *,
    resume_callback: ResumeCallback | None = None,
    reason: str = "expired",
) -> None:
    """Schedule automation to resume at specified time."""
    runtime_schedule_resume(
        hass,
        data,
        entity_id,
        resume_at,
        reason=reason,  # type: ignore[arg-type]
        resume_callback=resume_callback,
        track_point_in_time=runtime_ports.async_track_point_in_time,
    )


def schedule_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    scheduled: ScheduledSnooze,
    *,
    disable_callback: ScheduledDisableCallback | None = None,
) -> None:
    """Schedule automation to be disabled at a future time."""
    runtime_schedule_disable(
        hass,
        data,
        entity_id,
        scheduled,
        disable_callback=disable_callback,
        track_point_in_time=runtime_ports.async_track_point_in_time,
    )


def schedule_pre_resume_notification(
    hass: HomeAssistant,
    data: AutomationPauseData,
    paused: PausedAutomation,
    *,
    notification_callback: NotificationCallback | None = None,
) -> bool:
    """Schedule a notification before an active snooze resumes."""
    return runtime_schedule_pre_resume_notification(
        hass,
        data,
        paused,
        notification_callback=notification_callback,
        track_point_in_time=runtime_ports.async_track_point_in_time,
    )
