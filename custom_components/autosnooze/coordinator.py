"""Coordinator for AutoSnooze integration - handles state, persistence, and timers."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
import logging
from time import perf_counter
from typing import Any

from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME
from homeassistant.exceptions import ServiceValidationError
from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_track_point_in_time
from homeassistant.util import dt as dt_util

from .const import (
    DOMAIN,
    MAX_RESUME_RETRIES,
    MIN_ADJUST_BUFFER,
    RESUME_RETRY_DELAY,
    SCHEDULED_DISABLE_RETRY_DELAY,
)
from .infrastructure.storage import async_save as infrastructure_async_save
from .logging_utils import _log_command, _raise_save_failed
from .models import (
    AutomationPauseData,
    PausedAutomation,
    ScheduledSnooze,
)
from .runtime.restore import (
    async_load_stored as runtime_async_load_stored,
    validate_stored_data as runtime_validate_stored_data,
    validate_stored_entry as runtime_validate_stored_entry,
)
from .runtime.timers import (
    cancel_scheduled_timer as runtime_cancel_scheduled_timer,
    cancel_timer as runtime_cancel_timer,
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


def cancel_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel timer for entity if exists."""
    runtime_cancel_timer(data, entity_id)


def cancel_scheduled_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel scheduled timer for entity if exists."""
    runtime_cancel_scheduled_timer(data, entity_id)


def schedule_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
) -> None:
    """Schedule automation to resume at specified time (FR-06: Auto-Re-enable)."""
    runtime_schedule_resume(
        hass,
        data,
        entity_id,
        resume_at,
        resume_callback=async_resume,
        track_point_in_time=async_track_point_in_time,
    )


async def async_resume(hass: HomeAssistant, data: AutomationPauseData, entity_id: str) -> None:
    """Wake up a snoozed automation."""
    # Check if integration is unloaded to prevent post-unload operations
    if data.unloaded:
        return
    async with data.lock:
        expected_pause = data.paused.get(entity_id)
    # Perform the HA service call outside the state lock so a slow wake request
    # does not block unrelated pause/resume operations.
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
                schedule_resume(hass, data, entity_id, retry_at)
        if not await async_save(data):
            _raise_save_failed()
    if re_disable_entity:
        if not await async_set_automation_state(hass, entity_id, enabled=False):
            _LOGGER.warning("Failed to restore disabled state for stale resume of %s", entity_id)
    data.notify()
    if woke_successfully:
        _LOGGER.info("Woke automation: %s", entity_id)
    elif entity_id not in data.paused:
        pass  # Already logged above when giving up
    else:
        _LOGGER.warning("Failed to wake %s; retry scheduled", entity_id)


async def async_resume_batch(hass: HomeAssistant, data: AutomationPauseData, entity_ids: list[str]) -> None:
    """Wake up multiple snoozed automations efficiently with single save.

    DEF-011 FIX: Batch operations to reduce disk I/O.
    """
    started_at = perf_counter()
    outcome = "success"
    try:
        # Check if integration is unloaded to prevent post-unload operations
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
            # Keep HA service calls outside the state lock to avoid serializing
            # unrelated operations behind slow wake requests.
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
                        schedule_resume(hass, data, entity_id, retry_at)
            # Single save after all operations
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
        # Clear stale duration fields -- resume_at is the source of truth after adjustment
        paused.days = 0
        paused.hours = 0
        paused.minutes = 0

        schedule_resume(hass, data, entity_id, new_resume_at)
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

                schedule_resume(hass, data, entity_id, new_resume_at)
            if not await async_save(data):
                _raise_save_failed()
        data.notify()
        _LOGGER.info("Adjusted snooze for %d automations", len(entity_ids))
    except Exception:
        outcome = "error"
        raise
    finally:
        _log_command("adjust", outcome, started_at)


def schedule_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    scheduled: ScheduledSnooze,
) -> None:
    """Schedule automation to be disabled at a future time."""
    runtime_schedule_disable(
        hass,
        data,
        entity_id,
        scheduled,
        disable_callback=async_execute_scheduled_disable,
        track_point_in_time=async_track_point_in_time,
    )


async def async_execute_scheduled_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
) -> None:
    """Execute a scheduled disable - disable automation and schedule resume."""
    # Check if integration is unloaded to prevent post-unload operations
    if data.unloaded:
        return

    async with data.lock:
        cancel_scheduled_timer(data, entity_id)
        expected_scheduled = data.scheduled.get(entity_id)

    # DEF-014 FIX: Check disable BEFORE popping scheduled entry.
    # Keep the HA call outside the state lock so a slow service call does not
    # block unrelated pause/resume operations.
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

                # If resume time has passed (or retry would run at/after resume), stop retrying.
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
                schedule_disable(hass, data, entity_id, scheduled)
                if not await async_save(data):
                    _raise_save_failed()
                _LOGGER.warning(
                    "Failed to execute scheduled disable for %s, retrying at %s",
                    entity_id,
                    retry_at,
                )
                data.notify()
                return

            # Only pop after successful disable
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

            schedule_resume(hass, data, entity_id, resume_at)
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
    # Check if integration is unloaded to prevent post-unload operations
    if data.unloaded:
        return
    async with data.lock:
        cancel_scheduled_timer(data, entity_id)
        data.scheduled.pop(entity_id, None)
        if not await async_save(data):
            _raise_save_failed()
    data.notify()
    _LOGGER.info("Cancelled scheduled snooze for: %s", entity_id)


async def async_cancel_scheduled_batch(hass: HomeAssistant, data: AutomationPauseData, entity_ids: list[str]) -> None:
    """Cancel multiple scheduled snoozes efficiently with single save.

    Similar to async_resume_batch (DEF-011 fix), this batches operations
    to reduce disk I/O when cancelling multiple scheduled snoozes.
    """
    started_at = perf_counter()
    outcome = "success"
    try:
        # Check if integration is unloaded to prevent post-unload operations
        if data.unloaded:
            return
        if not entity_ids:
            return

        async with data.lock:
            for entity_id in entity_ids:
                cancel_scheduled_timer(data, entity_id)
                data.scheduled.pop(entity_id, None)
            # Single save after all operations
            if not await async_save(data):
                _raise_save_failed()
        data.notify()
        _LOGGER.info("Cancelled %d scheduled snoozes", len(entity_ids))
    except Exception:
        outcome = "error"
        raise
    finally:
        _log_command("cancel_scheduled", outcome, started_at)


async def async_save(data: AutomationPauseData) -> bool:
    """Save snoozed automations to storage with retry logic.

    Returns:
        True if save succeeded, False if all retries exhausted.
    """
    return await infrastructure_async_save(data, sleep=asyncio.sleep)


def validate_stored_entry(
    entity_id: str,
    entry_data: Any,
    entry_type: str,
) -> bool:
    """Validate a single stored entry.

    Args:
        entity_id: The entity ID (key in storage)
        entry_data: The entry data
        entry_type: "paused" or "scheduled"

    Returns:
        True if valid, False if invalid.
    """
    return runtime_validate_stored_entry(entity_id, entry_data, entry_type)


def validate_stored_data(stored: Any) -> dict[str, Any]:
    """Validate and sanitize stored data.

    Returns validated data with invalid entries removed.
    """
    return runtime_validate_stored_data(stored)


async def async_load_stored(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Load and restore snoozed automations from storage (FR-07: Persistence)."""
    await runtime_async_load_stored(
        hass,
        data,
        resume_callback=async_resume,
        disable_callback=async_execute_scheduled_disable,
    )
