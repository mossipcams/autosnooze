"""Scheduled snooze application flow for AutoSnooze."""

from __future__ import annotations

from datetime import datetime
import logging
from time import perf_counter

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.util import dt as dt_util

from ..const import SCHEDULED_DISABLE_RETRY_DELAY
from ..logging_utils import _log_command, _raise_save_failed
from ..models import PausedAutomation, ScheduledSnooze
from ..runtime.ports import (
    async_save,
    async_set_automation_state,
    cancel_scheduled_timer,
    get_friendly_name,
    schedule_disable,
    schedule_resume,
)
from ..runtime.state import AutomationPauseData
from .resume import async_resume

_LOGGER = logging.getLogger(__name__)


async def async_execute_scheduled_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
) -> None:
    """Execute a scheduled disable - disable automation and schedule resume."""
    if data.unloaded:
        return

    async with data.lock:
        cancel_scheduled_timer(data, entity_id)
        expected_scheduled = data.scheduled.get(entity_id)

    disabled_successfully = await async_set_automation_state(hass, entity_id, enabled=False)

    stale_after_disable = False
    undo_stale_disable = False
    async with data.lock:
        current_scheduled = data.scheduled.get(entity_id)
        stale_after_disable = (expected_scheduled is not None and current_scheduled is not expected_scheduled) or (
            expected_scheduled is None and current_scheduled is not None
        )
        if stale_after_disable:
            undo_stale_disable = disabled_successfully and entity_id not in data.paused
        else:
            scheduled = current_scheduled if expected_scheduled is None else expected_scheduled

            if not disabled_successfully:
                now = dt_util.utcnow()
                retry_at = now + SCHEDULED_DISABLE_RETRY_DELAY

                if resume_at <= now or retry_at >= resume_at:
                    data.scheduled.pop(entity_id, None)
                    if not await async_save(data):
                        _raise_save_failed()
                    _LOGGER.warning(
                        "Failed to execute scheduled disable for %s; skipping retry because resume time has passed",
                        entity_id,
                    )
                    data.notify()
                    return

                if scheduled is None:
                    scheduled = ScheduledSnooze(
                        entity_id=entity_id,
                        friendly_name=get_friendly_name(hass, entity_id),
                        disable_at=retry_at,
                        resume_at=resume_at,
                    )
                else:
                    scheduled.disable_at = retry_at

                data.scheduled[entity_id] = scheduled
                schedule_disable(hass, data, entity_id, scheduled, disable_callback=async_execute_scheduled_disable)
                if not await async_save(data):
                    _raise_save_failed()
                _LOGGER.warning(
                    "Failed to execute scheduled disable for %s, retrying at %s",
                    entity_id,
                    retry_at,
                )
                data.notify()
                return

            scheduled = data.scheduled.pop(entity_id, None)
            now = dt_util.utcnow()
            friendly_name = scheduled.friendly_name if scheduled else get_friendly_name(hass, entity_id)
            disable_at = scheduled.disable_at if scheduled else None

            data.paused[entity_id] = PausedAutomation(
                entity_id=entity_id,
                friendly_name=friendly_name,
                resume_at=resume_at,
                paused_at=now,
                disable_at=disable_at,
            )

            schedule_resume(hass, data, entity_id, resume_at, resume_callback=async_resume)
            if not await async_save(data):
                _raise_save_failed()
    if undo_stale_disable:
        if not await async_set_automation_state(hass, entity_id, enabled=True):
            _LOGGER.warning("Failed to undo stale scheduled disable for %s", entity_id)
        return
    if stale_after_disable:
        return
    data.notify()
    _LOGGER.info("Executed scheduled snooze for %s until %s", entity_id, resume_at)


async def async_cancel_scheduled(hass: HomeAssistant, data: AutomationPauseData, entity_id: str) -> None:
    """Cancel a scheduled snooze."""
    if data.unloaded:
        return
    async with data.lock:
        cancel_scheduled_timer(data, entity_id)
        data.scheduled.pop(entity_id, None)
        if not await async_save(data):
            _raise_save_failed()
    data.notify()
    _LOGGER.info("Cancelled scheduled snooze for: %s", entity_id)


async def async_cancel_scheduled_batch(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
) -> None:
    """Cancel multiple scheduled snoozes efficiently with single save."""
    started_at = perf_counter()
    outcome = "success"
    try:
        if data.unloaded:
            return
        if not entity_ids:
            return

        async with data.lock:
            for entity_id in entity_ids:
                cancel_scheduled_timer(data, entity_id)
                data.scheduled.pop(entity_id, None)
            if not await async_save(data):
                _raise_save_failed()
        data.notify()
        _LOGGER.info("Cancelled %d scheduled snoozes", len(entity_ids))
    except Exception:
        outcome = "error"
        raise
    finally:
        _log_command("cancel_scheduled", outcome, started_at)


async def async_handle_cancel_scheduled_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> None:
    """Handle cancel-scheduled service application flow."""
    if data.unloaded:
        return

    entity_ids = call.data[ATTR_ENTITY_ID]
    valid_ids: list[str] = []
    for entity_id in entity_ids:
        if entity_id not in data.scheduled:
            continue
        valid_ids.append(entity_id)

    if valid_ids:
        await async_cancel_scheduled_batch(hass, data, valid_ids)
