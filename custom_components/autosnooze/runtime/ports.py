"""Low-level Home Assistant and persistence ports for AutoSnooze."""

from __future__ import annotations

import asyncio
from datetime import datetime
import logging

from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME
from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_track_point_in_time

from ..infrastructure.storage import async_save as infrastructure_async_save
from ..models import AutomationPauseData, ScheduledSnooze
from .timers import (
    ResumeCallback,
    ScheduledDisableCallback,
    cancel_scheduled_timer,
    cancel_timer,
    schedule_disable as runtime_schedule_disable,
    schedule_resume as runtime_schedule_resume,
)

_LOGGER = logging.getLogger(__name__)


async def async_set_automation_state(hass: HomeAssistant, entity_id: str, *, enabled: bool) -> bool:
    """Enable or disable an automation."""
    state = hass.states.get(entity_id)
    if state is None:
        _LOGGER.warning("Automation not found: %s", entity_id)
        return False

    try:
        await hass.services.async_call(
            "automation",
            "turn_on" if enabled else "turn_off",
            {ATTR_ENTITY_ID: entity_id},
            blocking=True,
        )
        return True
    except Exception as err:
        _LOGGER.error("Failed to %s %s: %s", "wake" if enabled else "snooze", entity_id, err)
        return False


def get_friendly_name(hass: HomeAssistant, entity_id: str) -> str:
    """Get friendly name for entity."""
    if state := hass.states.get(entity_id):
        return state.attributes.get(ATTR_FRIENDLY_NAME, entity_id)
    return entity_id


def schedule_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
    *,
    resume_callback: ResumeCallback | None = None,
) -> None:
    """Schedule automation to resume at specified time."""
    runtime_schedule_resume(
        hass,
        data,
        entity_id,
        resume_at,
        resume_callback=resume_callback,
        track_point_in_time=async_track_point_in_time,
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
        track_point_in_time=async_track_point_in_time,
    )


async def async_save(data: AutomationPauseData) -> bool:
    """Save runtime state to storage with retry logic."""
    return await infrastructure_async_save(data, sleep=asyncio.sleep)
