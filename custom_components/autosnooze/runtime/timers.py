"""Timer helpers for AutoSnooze runtime behavior."""

from __future__ import annotations

from collections.abc import Callable, Coroutine
from datetime import datetime
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_point_in_time as ha_async_track_point_in_time

from ..models import ScheduledSnooze
from .state import AutomationPauseData

async_track_point_in_time = ha_async_track_point_in_time
ResumeCallback = Callable[[HomeAssistant, AutomationPauseData, str], Coroutine[Any, Any, None]]
ScheduledDisableCallback = Callable[[HomeAssistant, AutomationPauseData, str, datetime], Coroutine[Any, Any, None]]


def _cancel_timer_from_dict(timers: dict[str, Callable[[], None]], entity_id: str) -> None:
    if unsub := timers.pop(entity_id, None):
        unsub()


def cancel_timer(data: AutomationPauseData, entity_id: str) -> None:
    _cancel_timer_from_dict(data.timers, entity_id)


def cancel_scheduled_timer(data: AutomationPauseData, entity_id: str) -> None:
    _cancel_timer_from_dict(data.scheduled_timers, entity_id)


def schedule_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
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
        if resume_callback is None:
            return

        hass.async_create_task(resume_callback(hass, data, entity_id))

    data.timers[entity_id] = schedule_at(hass, on_timer, resume_at)


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
        if disable_callback is None:
            return

        hass.async_create_task(disable_callback(hass, data, entity_id, resume_at))

    data.scheduled_timers[entity_id] = schedule_at(hass, on_disable_timer, scheduled.disable_at)
