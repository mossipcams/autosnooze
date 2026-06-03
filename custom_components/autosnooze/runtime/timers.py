"""Timer helpers for AutoSnooze runtime behavior."""

from __future__ import annotations

from collections.abc import Callable, Coroutine
from datetime import datetime, timedelta
from typing import Any, Literal, Protocol

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_point_in_time as ha_async_track_point_in_time
from homeassistant.util import dt as dt_util

from ..domain.notifications import NOTIFICATION_TRIGGER_ABOUT_TO_END
from ..models import PausedAutomation, ScheduledSnooze
from .state import AutomationPauseData

ResumeReason = Literal["manual", "expired"]
ResumeCallback = Callable[[HomeAssistant, AutomationPauseData, str], Coroutine[Any, Any, None]]
ScheduledDisableCallback = Callable[[HomeAssistant, AutomationPauseData, str, datetime], Coroutine[Any, Any, None]]
NotificationCallback = Callable[[HomeAssistant, AutomationPauseData, str], Coroutine[Any, Any, None]]


class DefaultResumeCallback(Protocol):
    """Higher-layer resume workflow invoked by runtime expiry timers."""

    def __call__(
        self,
        hass: HomeAssistant,
        data: AutomationPauseData,
        entity_id: str,
        *,
        reason: ResumeReason = "manual",
    ) -> Coroutine[Any, Any, None]: ...


async_track_point_in_time = ha_async_track_point_in_time
_default_resume_callback: DefaultResumeCallback | None = None
_default_notification_callback: NotificationCallback | None = None
_default_disable_callback: ScheduledDisableCallback | None = None


def configure_default_timer_callbacks(
    *,
    resume_callback: DefaultResumeCallback | None = None,
    notification_callback: NotificationCallback | None = None,
    disable_callback: ScheduledDisableCallback | None = None,
) -> None:
    """Register higher-layer workflow callbacks used by runtime timers."""
    global _default_resume_callback, _default_notification_callback, _default_disable_callback
    _default_resume_callback = resume_callback
    _default_notification_callback = notification_callback
    _default_disable_callback = disable_callback


async def async_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    *,
    reason: ResumeReason = "manual",
) -> None:
    """Delegate to the configured higher-layer resume workflow."""
    if _default_resume_callback is None:
        raise RuntimeError("Default resume callback has not been configured")
    await _default_resume_callback(hass, data, entity_id, reason=reason)


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
    resume_callback: ResumeCallback | None = None,
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
        if resume_callback is not None:
            hass.async_create_task(resume_callback(hass, data, entity_id))
            return
        hass.async_create_task(async_resume(hass, data, entity_id, reason=reason))

    data.timers[entity_id] = schedule_at(hass, on_timer, resume_at)


async def async_send_pre_resume_notification(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
) -> None:
    """Delegate to the configured higher-layer pre-resume notification workflow."""
    if _default_notification_callback is None:
        raise RuntimeError("Default pre-resume notification callback has not been configured")
    await _default_notification_callback(hass, data, entity_id)


async def async_execute_scheduled_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
) -> None:
    """Delegate to the configured higher-layer scheduled-disable workflow."""
    if _default_disable_callback is None:
        raise RuntimeError("Default scheduled disable callback has not been configured")
    await _default_disable_callback(hass, data, entity_id, resume_at)


def schedule_pre_resume_notification(
    hass: HomeAssistant,
    data: AutomationPauseData,
    paused: PausedAutomation,
    *,
    notification_callback: NotificationCallback | None = None,
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
        if notification_callback is not None:
            hass.async_create_task(notification_callback(hass, data, paused.entity_id))
        else:
            hass.async_create_task(async_send_pre_resume_notification(hass, data, paused.entity_id))
        return True

    schedule_at = track_point_in_time or async_track_point_in_time

    @callback
    def on_notification_timer(_now: datetime) -> None:
        if data.unloaded:
            return
        if notification_callback is not None:
            hass.async_create_task(notification_callback(hass, data, paused.entity_id))
            return
        hass.async_create_task(async_send_pre_resume_notification(hass, data, paused.entity_id))

    data.notification_timers[paused.entity_id] = schedule_at(hass, on_notification_timer, notify_at)
    return True


def schedule_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    scheduled: ScheduledSnooze,
    *,
    disable_callback: ScheduledDisableCallback | None = None,
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
        if disable_callback is not None:
            hass.async_create_task(disable_callback(hass, data, entity_id, resume_at))
            return
        hass.async_create_task(async_execute_scheduled_disable(hass, data, entity_id, resume_at))

    data.scheduled_timers[entity_id] = schedule_at(hass, on_disable_timer, scheduled.disable_at)
