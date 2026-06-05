"""Timer helpers for AutoSnooze runtime behavior."""

from __future__ import annotations

from collections.abc import Callable, Coroutine
from datetime import datetime, timedelta
from typing import Any, Literal

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_point_in_time as ha_async_track_point_in_time
from homeassistant.util import dt as dt_util

from ..domain.notifications import NOTIFICATION_TRIGGER_ABOUT_TO_END
from ..models import PausedAutomation, ScheduledSnooze, ensure_utc_aware
from .state import AutomationPauseData, ResumeReason

ResumeCallback = Callable[[HomeAssistant, AutomationPauseData, str], Coroutine[Any, Any, None]]
DeadlineResumeCallback = Callable[
    [HomeAssistant, AutomationPauseData, list[str], ResumeReason],
    Coroutine[Any, Any, None],
]
ScheduledDisableCallback = Callable[[HomeAssistant, AutomationPauseData, str, datetime], Coroutine[Any, Any, None]]
NotificationCallback = Callable[[HomeAssistant, AutomationPauseData, str], Coroutine[Any, Any, None]]

async_track_point_in_time = ha_async_track_point_in_time


def _normalize_deadline(when: datetime) -> datetime:
    normalized = ensure_utc_aware(when)
    assert normalized is not None
    return normalized


def _cancel_timer_from_dict(timers: dict[str, Callable[[], None]], entity_id: str) -> None:
    if unsub := timers.pop(entity_id, None):
        unsub()


def _cancel_resume_deadline_timer(data: AutomationPauseData, deadline: datetime) -> None:
    if unsub := data.resume_deadline_timers.pop(deadline, None):
        unsub()
    data.resume_deadline_entities.pop(deadline, None)


def _remove_entity_from_resume_deadline(data: AutomationPauseData, entity_id: str) -> None:
    deadline = data.entity_resume_deadlines.pop(entity_id, None)
    if deadline is None:
        return
    entities = data.resume_deadline_entities.get(deadline)
    if entities is None:
        return
    entities.discard(entity_id)
    if not entities:
        _cancel_resume_deadline_timer(data, deadline)


def cancel_timer(data: AutomationPauseData, entity_id: str) -> None:
    if entity_id in data.entity_resume_deadlines:
        data.timers.pop(entity_id, None)
        _remove_entity_from_resume_deadline(data, entity_id)
        return
    _cancel_timer_from_dict(data.timers, entity_id)


def cancel_scheduled_timer(data: AutomationPauseData, entity_id: str) -> None:
    _cancel_timer_from_dict(data.scheduled_timers, entity_id)


def cancel_notification_timer(data: AutomationPauseData, entity_id: str) -> None:
    _cancel_timer_from_dict(data.notification_timers, entity_id)


def cancel_all_resume_deadline_timers(data: AutomationPauseData) -> None:
    """Cancel every grouped resume deadline timer."""
    for unsub in data.resume_deadline_timers.values():
        unsub()
    for entity_id, unsub in list(data.timers.items()):
        if entity_id not in data.entity_resume_deadlines:
            unsub()
    data.resume_deadline_timers.clear()
    data.resume_deadline_entities.clear()
    data.entity_resume_deadlines.clear()
    data.timers.clear()


async def async_dispatch_resume_timer(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    *,
    reason: ResumeReason = "manual",
) -> None:
    """Delegate to the entry-scoped resume workflow."""
    if data.resume_callback is None:
        raise RuntimeError("Resume callback has not been configured for this config entry")
    await data.resume_callback(hass, data, entity_id, reason=reason)


async def async_dispatch_deadline_resume_timer(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    *,
    reason: ResumeReason = "expired",
) -> None:
    """Delegate to the entry-scoped grouped resume workflow."""
    if data.deadline_resume_callback is None:
        raise RuntimeError("Deadline resume callback has not been configured for this config entry")
    await data.deadline_resume_callback(hass, data, entity_ids, reason=reason)


async def async_dispatch_pre_resume_notification(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
) -> None:
    """Delegate to the entry-scoped pre-resume notification workflow."""
    if data.notification_callback is None:
        raise RuntimeError("Pre-resume notification callback has not been configured for this config entry")
    await data.notification_callback(hass, data, entity_id)


async def async_dispatch_scheduled_disable_timer(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
) -> None:
    """Delegate to the entry-scoped scheduled-disable workflow."""
    if data.scheduled_disable_callback is None:
        raise RuntimeError("Scheduled disable callback has not been configured for this config entry")
    await data.scheduled_disable_callback(hass, data, entity_id, resume_at)


def _ensure_resume_deadline_timer(
    hass: HomeAssistant,
    data: AutomationPauseData,
    deadline: datetime,
    *,
    reason: ResumeReason = "expired",
    deadline_callback: DeadlineResumeCallback | None = None,
    track_point_in_time: Callable[[HomeAssistant, Callable[[datetime], None], datetime], Callable[[], None]] | None = (
        None
    ),
) -> Callable[[], None]:
    if deadline in data.resume_deadline_timers:
        return data.resume_deadline_timers[deadline]

    schedule_at = track_point_in_time or async_track_point_in_time
    callback_target = deadline_callback

    @callback
    def on_deadline(_now: datetime) -> None:
        if data.unloaded:
            return
        entity_ids = list(data.resume_deadline_entities.get(deadline, ()))
        data.resume_deadline_timers.pop(deadline, None)
        data.resume_deadline_entities.pop(deadline, None)
        for entity_id in entity_ids:
            data.entity_resume_deadlines.pop(entity_id, None)
            data.timers.pop(entity_id, None)
        if not entity_ids:
            return
        if callback_target is not None:
            hass.async_create_task(callback_target(hass, data, entity_ids, reason=reason))
            return
        hass.async_create_task(async_dispatch_deadline_resume_timer(hass, data, entity_ids, reason=reason))

    unsub = schedule_at(hass, on_deadline, deadline)
    data.resume_deadline_timers[deadline] = unsub
    return unsub


def schedule_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
    reason: ResumeReason = "expired",
    *,
    resume_callback: ResumeCallback | None = None,
    deadline_callback: DeadlineResumeCallback | None = None,
    track_point_in_time: Callable[[HomeAssistant, Callable[[datetime], None], datetime], Callable[[], None]] | None = (
        None
    ),
) -> bool:
    """Schedule automation to resume at a deadline, sharing one timer per resume_at."""
    del reason
    if resume_callback is not None:
        cancel_timer(data, entity_id)
        schedule_at = track_point_in_time or async_track_point_in_time

        @callback
        def on_timer(_now: datetime) -> None:
            if data.unloaded:
                return
            hass.async_create_task(resume_callback(hass, data, entity_id))

        data.timers[entity_id] = schedule_at(hass, on_timer, resume_at)
        return True

    deadline = _normalize_deadline(resume_at)
    cancel_timer(data, entity_id)
    is_new_deadline = deadline not in data.resume_deadline_timers
    data.resume_deadline_entities.setdefault(deadline, set()).add(entity_id)
    data.entity_resume_deadlines[entity_id] = deadline
    unsub = _ensure_resume_deadline_timer(
        hass,
        data,
        deadline,
        deadline_callback=deadline_callback,
        track_point_in_time=track_point_in_time,
    )
    data.timers[entity_id] = unsub
    return is_new_deadline


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
            hass.async_create_task(async_dispatch_pre_resume_notification(hass, data, paused.entity_id))
        return True

    schedule_at = track_point_in_time or async_track_point_in_time
    callback_target = notification_callback

    @callback
    def on_notification_timer(_now: datetime) -> None:
        if data.unloaded:
            return
        if callback_target is not None:
            hass.async_create_task(callback_target(hass, data, paused.entity_id))
            return
        hass.async_create_task(async_dispatch_pre_resume_notification(hass, data, paused.entity_id))

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
    callback_target = disable_callback

    @callback
    def on_disable_timer(_now: datetime) -> None:
        if data.unloaded:
            return
        current = data.scheduled.get(entity_id)
        resume_at = current.resume_at if current is not None else scheduled.resume_at
        if callback_target is not None:
            hass.async_create_task(callback_target(hass, data, entity_id, resume_at))
            return
        hass.async_create_task(async_dispatch_scheduled_disable_timer(hass, data, entity_id, resume_at))

    data.scheduled_timers[entity_id] = schedule_at(hass, on_disable_timer, scheduled.disable_at)
