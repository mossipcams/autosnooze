"""Adjust application flow for AutoSnooze."""

from __future__ import annotations

from datetime import datetime, timedelta
import logging
from time import perf_counter

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.util import dt as dt_util

from ..const import DOMAIN, MIN_ADJUST_BUFFER
from ..logging_utils import _log_command, _raise_save_failed
from ..models import PausedAutomation
from ..runtime.ports import async_save, schedule_resume
from ..runtime.state import AutomationPauseData
from .resume import async_resume

_LOGGER = logging.getLogger(__name__)


async def async_adjust_snooze(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    delta: timedelta,
) -> None:
    """Adjust the resume time of a paused automation by a time delta."""
    if data.unloaded:
        return
    async with data.lock:
        paused = data.paused.get(entity_id)
        if paused is None:
            _LOGGER.warning("Cannot adjust %s: not currently snoozed", entity_id)
            return

        new_resume_at = paused.resume_at + delta
        now = dt_util.utcnow()

        if new_resume_at <= now + MIN_ADJUST_BUFFER:
            raise ServiceValidationError(
                "Adjusted time must be at least 1 minute in the future",
                translation_domain=DOMAIN,
                translation_key="adjust_time_too_short",
            )

        paused.resume_at = new_resume_at
        paused.days = 0
        paused.hours = 0
        paused.minutes = 0

        schedule_resume(hass, data, entity_id, new_resume_at, resume_callback=async_resume)
        if not await async_save(data):
            _raise_save_failed()
    data.notify()
    _LOGGER.info("Adjusted snooze for %s: new resume at %s", entity_id, new_resume_at)


async def async_adjust_snooze_batch(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    delta: timedelta,
) -> None:
    """Adjust the resume time of multiple paused automations with single save."""
    started_at = perf_counter()
    outcome = "success"
    try:
        if data.unloaded:
            return
        if not entity_ids:
            return

        now = dt_util.utcnow()
        updates: list[tuple[str, PausedAutomation, datetime]] = []

        async with data.lock:
            for entity_id in entity_ids:
                paused = data.paused.get(entity_id)
                if paused is None:
                    _LOGGER.warning("Cannot adjust %s: not currently snoozed", entity_id)
                    continue

                new_resume_at = paused.resume_at + delta

                if new_resume_at <= now + MIN_ADJUST_BUFFER:
                    raise ServiceValidationError(
                        "Adjusted time must be at least 1 minute in the future",
                        translation_domain=DOMAIN,
                        translation_key="adjust_time_too_short",
                    )

                updates.append((entity_id, paused, new_resume_at))

            for entity_id, paused, new_resume_at in updates:
                paused.resume_at = new_resume_at
                paused.days = 0
                paused.hours = 0
                paused.minutes = 0

                schedule_resume(hass, data, entity_id, new_resume_at, resume_callback=async_resume)
            if not await async_save(data):
                _raise_save_failed()
        data.notify()
        _LOGGER.info("Adjusted snooze for %d automations", len(entity_ids))
    except Exception:
        outcome = "error"
        raise
    finally:
        _log_command("adjust", outcome, started_at)


async def async_handle_adjust_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> None:
    """Handle adjust service application flow."""
    if data.unloaded:
        return

    entity_ids = call.data[ATTR_ENTITY_ID]
    days = call.data.get("days", 0)
    hours = call.data.get("hours", 0)
    minutes = call.data.get("minutes", 0)

    delta = timedelta(days=days, hours=hours, minutes=minutes)
    if delta == timedelta():
        raise ServiceValidationError(
            "Adjustment must be non-zero",
            translation_domain=DOMAIN,
            translation_key="invalid_adjustment",
        )

    await async_adjust_snooze_batch(hass, data, entity_ids, delta)
