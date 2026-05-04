"""Resume application flow for AutoSnooze."""

from __future__ import annotations

import logging
from time import perf_counter

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.util import dt as dt_util

from ..const import MAX_RESUME_RETRIES, RESUME_RETRY_DELAY
from ..logging_utils import _log_command, _raise_save_failed
from ..runtime.ports import async_save, async_set_automation_state, cancel_timer, schedule_resume
from ..runtime.state import AutomationPauseData

_LOGGER = logging.getLogger(__name__)


async def async_resume(hass: HomeAssistant, data: AutomationPauseData, entity_id: str) -> None:
    """Wake up a snoozed automation."""
    if data.unloaded:
        return
    async with data.lock:
        expected_pause = data.paused.get(entity_id)

    woke_successfully = await async_set_automation_state(hass, entity_id, enabled=True)
    re_disable_entity = False
    async with data.lock:
        paused = data.paused.get(entity_id)
        if expected_pause is not None and paused is not expected_pause:
            re_disable_entity = woke_successfully and paused is not None
            paused = None
        if woke_successfully:
            if paused is not None or expected_pause is None:
                cancel_timer(data, entity_id)
                if paused is not None:
                    data.paused.pop(entity_id, None)
        elif paused is not None:
            if paused.resume_retries >= MAX_RESUME_RETRIES:
                cancel_timer(data, entity_id)
                data.paused.pop(entity_id, None)
                _LOGGER.error("Giving up waking %s after %d retries", entity_id, paused.resume_retries)
            else:
                paused.resume_retries += 1
                retry_at = dt_util.utcnow() + RESUME_RETRY_DELAY
                paused.resume_at = retry_at
                schedule_resume(hass, data, entity_id, retry_at, resume_callback=async_resume)
        if not await async_save(data):
            _raise_save_failed()
    if re_disable_entity:
        if not await async_set_automation_state(hass, entity_id, enabled=False):
            _LOGGER.warning("Failed to restore disabled state for stale resume of %s", entity_id)
    data.notify()
    if woke_successfully:
        _LOGGER.info("Woke automation: %s", entity_id)
    elif entity_id not in data.paused:
        pass
    else:
        _LOGGER.warning("Failed to wake %s; retry scheduled", entity_id)


async def async_resume_batch(hass: HomeAssistant, data: AutomationPauseData, entity_ids: list[str]) -> None:
    """Wake up multiple snoozed automations efficiently with single save."""
    started_at = perf_counter()
    outcome = "success"
    try:
        if data.unloaded:
            return
        if not entity_ids:
            return

        async with data.lock:
            candidates = {
                entity_id: data.paused[entity_id] for entity_id in dict.fromkeys(entity_ids) if entity_id in data.paused
            }
            candidate_ids = list(candidates)

        results: dict[str, bool] = {}
        for entity_id in candidate_ids:
            results[entity_id] = await async_set_automation_state(hass, entity_id, enabled=True)

        failed = 0
        woke = 0
        re_disable_entities: list[str] = []
        async with data.lock:
            for entity_id in candidate_ids:
                paused = data.paused.get(entity_id)
                if paused is not candidates[entity_id]:
                    if results.get(entity_id) is True and paused is not None:
                        re_disable_entities.append(entity_id)
                    continue
                if paused is None:
                    continue

                if results.get(entity_id) is True:
                    cancel_timer(data, entity_id)
                    data.paused.pop(entity_id, None)
                    woke += 1
                else:
                    if paused.resume_retries >= MAX_RESUME_RETRIES:
                        cancel_timer(data, entity_id)
                        data.paused.pop(entity_id, None)
                        _LOGGER.error("Giving up waking %s after %d retries", entity_id, paused.resume_retries)
                    else:
                        failed += 1
                        paused.resume_retries += 1
                        retry_at = dt_util.utcnow() + RESUME_RETRY_DELAY
                        paused.resume_at = retry_at
                        schedule_resume(hass, data, entity_id, retry_at, resume_callback=async_resume)
            if not await async_save(data):
                _raise_save_failed()
        for entity_id in re_disable_entities:
            if not await async_set_automation_state(hass, entity_id, enabled=False):
                _LOGGER.warning("Failed to restore disabled state for stale resume of %s", entity_id)
        data.notify()
        if failed:
            _LOGGER.warning("Woke %d automations, %d failed and were rescheduled", woke, failed)
        else:
            _LOGGER.info("Woke %d automations", woke)
    except Exception:
        outcome = "error"
        raise
    finally:
        _log_command("cancel", outcome, started_at)


async def async_handle_cancel_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> None:
    """Handle cancel service application flow."""
    if data.unloaded:
        return

    entity_ids = call.data[ATTR_ENTITY_ID]
    valid_ids: list[str] = []
    for entity_id in entity_ids:
        if entity_id not in data.paused:
            continue
        valid_ids.append(entity_id)

    if valid_ids:
        await async_resume_batch(hass, data, valid_ids)


async def async_handle_cancel_all_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
) -> None:
    """Handle cancel-all service application flow."""
    if data.unloaded:
        return

    entity_ids = list(data.paused.keys())
    if entity_ids:
        await async_resume_batch(hass, data, entity_ids)
