"""Backward-compatible re-exports for runtime adapters."""

from __future__ import annotations

from homeassistant.helpers.event import async_track_point_in_time

from .adapters.automation_state import (
    async_set_automation_state,
    get_friendly_name,
    is_automation_enabled,
)
from .adapters.persistence import async_save
from .adapters.timer_scheduling import (
    schedule_disable,
    schedule_pre_resume_notification,
    schedule_resume,
)

__all__ = [
    "async_save",
    "async_set_automation_state",
    "async_track_point_in_time",
    "get_friendly_name",
    "is_automation_enabled",
    "schedule_disable",
    "schedule_pre_resume_notification",
    "schedule_resume",
]
