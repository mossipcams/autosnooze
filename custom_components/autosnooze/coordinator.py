"""Coordinator for AutoSnooze integration - handles state, persistence, and timers."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from datetime import datetime
import logging
from typing import Any

from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_point_in_time
from homeassistant.util import dt as dt_util

from .const import MAX_SAVE_RETRIES, SAVE_RETRY_DELAYS, TRANSIENT_ERRORS
from .models import (
    AutomationPauseData,
    PausedAutomation,
    ScheduledSnooze,
    parse_datetime_utc,
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


def _cancel_timer_from_dict(timers: dict[str, Callable[[], None]], entity_id: str) -> None:
    """Cancel and remove timer from given dict if exists."""
    if unsub := timers.pop(entity_id, None):
        unsub()


def cancel_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel timer for entity if exists."""
    _cancel_timer_from_dict(data.timers, entity_id)


def cancel_scheduled_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel scheduled timer for entity if exists."""
    _cancel_timer_from_dict(data.scheduled_timers, entity_id)


def schedule_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
) -> None:
    """Schedule automation to resume at specified time (FR-06: Auto-Re-enable)."""
    cancel_timer(data, entity_id)

    @callback
    def on_timer(_now: datetime) -> None:
        # Check if integration is unloaded to prevent post-unload operations
        if data.unloaded:
            return
        hass.async_create_task(async_resume(hass, data, entity_id))

    data.timers[entity_id] = async_track_point_in_time(hass, on_timer, resume_at)


async def async_resume(hass: HomeAssistant, data: AutomationPauseData, entity_id: str) -> None:
    """Wake up a snoozed automation."""
    # Check if integration is unloaded to prevent post-unload operations
    if data.unloaded:
        return
    async with data.lock:
        cancel_timer(data, entity_id)
        data.paused.pop(entity_id, None)
        await async_set_automation_state(hass, entity_id, enabled=True)
        await async_save(data)
    data.notify()
    _LOGGER.info("Woke automation: %s", entity_id)


async def async_resume_batch(hass: HomeAssistant, data: AutomationPauseData, entity_ids: list[str]) -> None:
    """Wake up multiple snoozed automations efficiently with single save.

    DEF-011 FIX: Batch operations to reduce disk I/O.
    """
    # Check if integration is unloaded to prevent post-unload operations
    if data.unloaded:
        return
    if not entity_ids:
        return

    async with data.lock:
        for entity_id in entity_ids:
            cancel_timer(data, entity_id)
            data.paused.pop(entity_id, None)
            await async_set_automation_state(hass, entity_id, enabled=True)
        # Single save after all operations
        await async_save(data)
    data.notify()
    _LOGGER.info("Woke %d automations", len(entity_ids))


def schedule_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    scheduled: ScheduledSnooze,
) -> None:
    """Schedule automation to be disabled at a future time."""
    cancel_scheduled_timer(data, entity_id)

    @callback
    def on_disable_timer(_now: datetime) -> None:
        # Check if integration is unloaded to prevent post-unload operations
        if data.unloaded:
            return
        hass.async_create_task(async_execute_scheduled_disable(hass, data, entity_id, scheduled.resume_at))

    data.scheduled_timers[entity_id] = async_track_point_in_time(hass, on_disable_timer, scheduled.disable_at)


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

        # DEF-014 FIX: Check disable BEFORE popping scheduled entry
        # This preserves the schedule for retry if disable fails
        if not await async_set_automation_state(hass, entity_id, enabled=False):
            _LOGGER.warning(
                "Failed to execute scheduled disable for %s, schedule preserved for retry",
                entity_id,
            )
            # Don't pop the scheduled entry - let it be retried on next load
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
        await async_save(data)
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
        await async_save(data)
    data.notify()
    _LOGGER.info("Cancelled scheduled snooze for: %s", entity_id)


async def async_save(data: AutomationPauseData) -> bool:
    """Save snoozed automations to storage with retry logic.

    Returns:
        True if save succeeded, False if all retries exhausted.
    """
    if data.store is None:
        return True  # Nothing to save, consider success

    save_data = {
        "paused": data.get_paused_dict(),
        "scheduled": data.get_scheduled_dict(),
    }

    last_error = None
    for attempt in range(MAX_SAVE_RETRIES + 1):  # Initial + retries
        try:
            await data.store.async_save(save_data)
            return True
        except TRANSIENT_ERRORS as err:
            last_error = err
            if attempt < MAX_SAVE_RETRIES:
                delay = SAVE_RETRY_DELAYS[attempt]
                _LOGGER.warning(
                    "Save attempt %d failed, retrying in %.1fs: %s",
                    attempt + 1,
                    delay,
                    err,
                )
                await asyncio.sleep(delay)
        except Exception as err:
            # Non-transient error - don't retry
            _LOGGER.error("Failed to save data: %s", err)
            return False

    # All retries exhausted
    _LOGGER.error(
        "Failed to save data after %d attempts: %s",
        MAX_SAVE_RETRIES + 1,
        last_error,
    )
    return False


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
    # Validate entity ID format
    if not entity_id.startswith("automation."):
        _LOGGER.warning(
            "Invalid entity_id %s: not an automation entity",
            entity_id,
        )
        return False

    # Validate data is a dict
    if not isinstance(entry_data, dict):
        _LOGGER.warning(
            "Invalid data for %s: expected dict, got %s",
            entity_id,
            type(entry_data).__name__,
        )
        return False

    # Validate required fields exist
    if entry_type == "paused":
        required = ["resume_at", "paused_at"]
    else:  # scheduled
        required = ["disable_at", "resume_at"]

    for field_name in required:
        if field_name not in entry_data:
            _LOGGER.warning(
                "Invalid data for %s: missing required field '%s'",
                entity_id,
                field_name,
            )
            return False

    # Validate datetime fields
    for field_name in required:
        try:
            parse_datetime_utc(entry_data[field_name])
        except (ValueError, TypeError) as err:
            _LOGGER.warning(
                "Invalid data for %s: invalid datetime in '%s': %s",
                entity_id,
                field_name,
                err,
            )
            return False

    # Validate numeric fields are non-negative (for paused entries)
    if entry_type == "paused":
        for field_name in ["days", "hours", "minutes"]:
            value = entry_data.get(field_name, 0)
            if not isinstance(value, (int, float)) or value < 0:
                _LOGGER.warning(
                    "Invalid data for %s: %s must be non-negative, got %s",
                    entity_id,
                    field_name,
                    value,
                )
                return False

    # Validate scheduled entry has disable_at < resume_at
    if entry_type == "scheduled":
        disable_at = parse_datetime_utc(entry_data["disable_at"])
        resume_at = parse_datetime_utc(entry_data["resume_at"])
        if resume_at <= disable_at:
            _LOGGER.warning(
                "Invalid scheduled snooze for %s: resume_at must be after disable_at",
                entity_id,
            )
            return False

    return True


def validate_stored_data(stored: Any) -> dict[str, Any]:
    """Validate and sanitize stored data.

    Returns validated data with invalid entries removed.
    """
    # Handle completely invalid storage
    if not isinstance(stored, dict):
        _LOGGER.error(
            "Corrupted storage: expected dict, got %s",
            type(stored).__name__,
        )
        return {"paused": {}, "scheduled": {}}

    result: dict[str, Any] = {"paused": {}, "scheduled": {}}
    invalid_count = 0

    # Validate paused entries
    paused = stored.get("paused", {})
    if isinstance(paused, dict):
        for entity_id, entry_data in paused.items():
            if validate_stored_entry(entity_id, entry_data, "paused"):
                result["paused"][entity_id] = entry_data
            else:
                invalid_count += 1
    else:
        _LOGGER.warning(
            "Invalid 'paused' schema: expected dict, got %s",
            type(paused).__name__,
        )

    # Validate scheduled entries
    scheduled = stored.get("scheduled", {})
    if isinstance(scheduled, dict):
        for entity_id, entry_data in scheduled.items():
            if validate_stored_entry(entity_id, entry_data, "scheduled"):
                result["scheduled"][entity_id] = entry_data
            else:
                invalid_count += 1
    else:
        _LOGGER.warning(
            "Invalid 'scheduled' schema: expected dict, got %s",
            type(scheduled).__name__,
        )

    if invalid_count > 0:
        _LOGGER.info(
            "Skipped %d invalid entries during storage load",
            invalid_count,
        )

    return result


async def async_load_stored(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Load and restore snoozed automations from storage (FR-07: Persistence)."""
    if data.store is None:
        return

    try:
        stored = await data.store.async_load()
    except Exception as err:
        _LOGGER.error("Failed to load stored data: %s", err)
        return

    if not stored:
        return

    # Validate stored data before processing
    validated = validate_stored_data(stored)

    now = dt_util.utcnow()
    expired: list[str] = []

    # Load paused automations
    for entity_id, info in validated.get("paused", {}).items():
        try:
            # DEF-015 NOTE: This existence check is an optimization to avoid unnecessary
            # service calls. If entity is deleted between check and disable call (TOCTOU),
            # async_set_automation_state handles it gracefully by returning False.
            if hass.states.get(entity_id) is None:
                _LOGGER.info("Cleaning up deleted automation from storage: %s", entity_id)
                expired.append(entity_id)
                continue

            paused = PausedAutomation.from_dict(entity_id, info)
            if paused.resume_at <= now:
                expired.append(entity_id)
            else:
                # Try to disable first - only track if disable succeeds
                if await async_set_automation_state(hass, entity_id, enabled=False):
                    data.paused[entity_id] = paused
                    schedule_resume(hass, data, entity_id, paused.resume_at)
                else:
                    # DEF-012 FIX: Clean up storage entries that can't be restored
                    _LOGGER.warning(
                        "Failed to restore paused state for %s, removing from storage",
                        entity_id,
                    )
                    expired.append(entity_id)
        except (KeyError, ValueError) as err:
            _LOGGER.warning("Invalid stored data for %s: %s", entity_id, err)
            expired.append(entity_id)

    # Load scheduled snoozes
    expired_scheduled: list[str] = []
    for entity_id, info in validated.get("scheduled", {}).items():
        try:
            # Check if automation still exists - clean up deleted automations
            if hass.states.get(entity_id) is None:
                _LOGGER.info(
                    "Cleaning up deleted automation from scheduled storage: %s",
                    entity_id,
                )
                expired_scheduled.append(entity_id)
                continue

            scheduled = ScheduledSnooze.from_dict(entity_id, info)
            if scheduled.disable_at <= now:
                # Should have already disabled, check if resume is also past
                if scheduled.resume_at <= now:
                    expired_scheduled.append(entity_id)
                else:
                    # Disable now and schedule resume - only track if disable succeeds
                    if await async_set_automation_state(hass, entity_id, enabled=False):
                        paused = PausedAutomation(
                            entity_id=entity_id,
                            friendly_name=scheduled.friendly_name,
                            resume_at=scheduled.resume_at,
                            paused_at=now,
                            disable_at=scheduled.disable_at,
                        )
                        data.paused[entity_id] = paused
                        schedule_resume(hass, data, entity_id, scheduled.resume_at)
                    else:
                        # DEF-012 FIX: Clean up storage entries that can't be restored
                        _LOGGER.warning(
                            "Failed to execute scheduled disable for %s, removing from storage",
                            entity_id,
                        )
                        expired_scheduled.append(entity_id)
            else:
                data.scheduled[entity_id] = scheduled
                schedule_disable(hass, data, entity_id, scheduled)
        except (KeyError, ValueError) as err:
            _LOGGER.warning("Invalid scheduled data for %s: %s", entity_id, err)
            expired_scheduled.append(entity_id)

    # FR-06: Auto-Re-enable expired automations
    for entity_id in expired:
        await async_set_automation_state(hass, entity_id, enabled=True)

    if expired or expired_scheduled:
        await async_save(data)

    # Notify listeners to update UI with loaded state
    data.notify()
