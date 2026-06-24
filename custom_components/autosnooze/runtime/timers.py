"""Timer helpers for AutoSnooze runtime behavior."""

from __future__ import annotations

from collections.abc import Callable, Coroutine
from datetime import datetime, timedelta
from typing import Any, Literal

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_point_in_time as ha_async_track_point_in_time
from homeassistant.util import dt as dt_util

from ..domain.notifications import NOTIFICATION_TRIGGER_ABOUT_TO_END
from ..models import PausedAutomation, ScheduledSnooze
from .state import AutomationPauseData

ResumeReason = Literal["manual", "expired"]
ResumeCallback = Callable[..., Coroutine[Any, Any, None]]
ScheduledDisableCallback = Callable[[HomeAssistant, AutomationPauseData, str, datetime], Coroutine[Any, Any, None]]
NotificationCallback = Callable[[HomeAssistant, AutomationPauseData, str], Coroutine[Any, Any, None]]


async_track_point_in_time = ha_async_track_point_in_time


def _cancel_timer_from_dict(timers: dict[str, Callable[[], None]], entity_id: str) -> None:
    if unsub := timers.pop(entity_id, None):
        unsub()


def cancel_timer(data: AutomationPauseData, entity_id: str) -> None:
    _cancel_timer_from_dict(data.timers, entity_id)


def cancel_scheduled_timer(data: AutomationPauseData, entity_id: str) -> None:
    _cancel_timer_from_dict(data.scheduled_timers, entity_id)


def cancel_notification_timer(data: AutomationPauseData, entity_id: str) -> None:
    _cancel_timer_from_dict(data.notification_timers, entity_id)


def schedule_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
    reason: ResumeReason = "expired",
    *,
    resume_callback: ResumeCallback,
    track_point_in_time: Callable[[HomeAssistant, Callable[[datetime], None], datetime], Callable[[], None]] | None = (
        None
    ),
) -> None:
    cancel_timer(data, entity_id)
    schedule_at = track_point_in_time or async_track_point_in_time

    @callback
    def on_timer(_now: datetime) -> None:
        if data.unloaded:
            return
        hass.async_create_task(resume_callback(hass, data, entity_id, reason=reason))

    data.timers[entity_id] = schedule_at(hass, on_timer, resume_at)


def schedule_pre_resume_notification(
    hass: HomeAssistant,
    data: AutomationPauseData,
    paused: PausedAutomation,
    *,
    notification_callback: NotificationCallback,
    track_point_in_time: Callable[[HomeAssistant, Callable[[datetime], None], datetime], Callable[[], None]] | None = (
        None
    ),
) -> bool:
    """Schedule a notification callback before an active snooze resumes."""
    cancel_notification_timer(data, paused.entity_id)

    if paused.notification_trigger != NOTIFICATION_TRIGGER_ABOUT_TO_END or paused.notification_lead_minutes is None:
        return False

    notify_at = paused.resume_at - timedelta(minutes=paused.notification_lead_minutes)
    now = dt_util.utcnow()
    if notify_at <= now:
        if paused.resume_at <= now:
            return False
        hass.async_create_task(notification_callback(hass, data, paused.entity_id))
        return True

    schedule_at = track_point_in_time or async_track_point_in_time

    @callback
    def on_notification_timer(_now: datetime) -> None:
        if data.unloaded:
            return
        hass.async_create_task(notification_callback(hass, data, paused.entity_id))

    data.notification_timers[paused.entity_id] = schedule_at(hass, on_notification_timer, notify_at)
    return True


def schedule_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    scheduled: ScheduledSnooze,
    *,
    disable_callback: ScheduledDisableCallback,
    track_point_in_time: Callable[[HomeAssistant, Callable[[datetime], None], datetime], Callable[[], None]] | None = (
        None
    ),
) -> None:
    cancel_scheduled_timer(data, entity_id)
    schedule_at = track_point_in_time or async_track_point_in_time

    @callback
    def on_disable_timer(_now: datetime) -> None:
        if data.unloaded:
            return
        current = data.scheduled.get(entity_id)
        resume_at = current.resume_at if current is not None else scheduled.resume_at
        hass.async_create_task(disable_callback(hass, data, entity_id, resume_at))

    data.scheduled_timers[entity_id] = schedule_at(hass, on_disable_timer, scheduled.disable_at)
