"""Restore and validation helpers for AutoSnooze runtime state."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from ..infrastructure.storage import async_save
from ..models import AutomationPauseData, PausedAutomation, ScheduledSnooze, parse_datetime_utc

_LOGGER = logging.getLogger(__name__)


def validate_stored_entry(
    entity_id: str,
    entry_data: Any,
    entry_type: str,
) -> bool:
    if not entity_id.startswith("automation."):
        _LOGGER.warning("Invalid entity_id %s: not an automation entity", entity_id)
        return False

    if not isinstance(entry_data, dict):
        _LOGGER.warning("Invalid data for %s: expected dict, got %s", entity_id, type(entry_data).__name__)
        return False

    required = ["resume_at", "paused_at"] if entry_type == "paused" else ["disable_at", "resume_at"]
    for field_name in required:
        if field_name not in entry_data:
            _LOGGER.warning("Invalid data for %s: missing required field '%s'", entity_id, field_name)
            return False

    for field_name in required:
        try:
            parse_datetime_utc(entry_data[field_name])
        except (ValueError, TypeError) as err:
            _LOGGER.warning("Invalid data for %s: invalid datetime in '%s': %s", entity_id, field_name, err)
            return False

    if entry_type == "paused":
        for field_name in ["days", "hours", "minutes"]:
            value = entry_data.get(field_name, 0)
            if not isinstance(value, (int, float)) or value < 0:
                _LOGGER.warning("Invalid data for %s: %s must be non-negative, got %s", entity_id, field_name, value)
                return False

    if entry_type == "scheduled":
        disable_at = parse_datetime_utc(entry_data["disable_at"])
        resume_at = parse_datetime_utc(entry_data["resume_at"])
        if resume_at <= disable_at:
            _LOGGER.warning("Invalid scheduled snooze for %s: resume_at must be after disable_at", entity_id)
            return False

    return True


def validate_stored_data(stored: Any) -> dict[str, Any]:
    if not isinstance(stored, dict):
        _LOGGER.error("Corrupted storage: expected dict, got %s", type(stored).__name__)
        return {"paused": {}, "scheduled": {}}

    result: dict[str, Any] = {"paused": {}, "scheduled": {}}
    invalid_count = 0

    paused = stored.get("paused", {})
    if isinstance(paused, dict):
        for entity_id, entry_data in paused.items():
            if validate_stored_entry(entity_id, entry_data, "paused"):
                result["paused"][entity_id] = entry_data
            else:
                invalid_count += 1
    else:
        _LOGGER.warning("Invalid 'paused' schema: expected dict, got %s", type(paused).__name__)

    scheduled = stored.get("scheduled", {})
    if isinstance(scheduled, dict):
        for entity_id, entry_data in scheduled.items():
            if validate_stored_entry(entity_id, entry_data, "scheduled"):
                result["scheduled"][entity_id] = entry_data
            else:
                invalid_count += 1
    else:
        _LOGGER.warning("Invalid 'scheduled' schema: expected dict, got %s", type(scheduled).__name__)

    if invalid_count > 0:
        _LOGGER.info("Skipped %d invalid entries during storage load", invalid_count)

    return result


async def async_load_stored(hass: HomeAssistant, data: AutomationPauseData) -> None:
    if data.store is None:
        return

    try:
        stored = await data.store.async_load()
    except Exception as err:
        _LOGGER.error("Failed to load stored data: %s", err)
        return

    if not stored:
        return

    validated = validate_stored_data(stored)
    now = dt_util.utcnow()
    expired: list[str] = []
    expired_scheduled: list[str] = []

    from ..coordinator import async_set_automation_state, schedule_disable, schedule_resume

    async with data.lock:
        for entity_id, info in validated.get("paused", {}).items():
            try:
                if hass.states.get(entity_id) is None:
                    _LOGGER.info("Cleaning up deleted automation from storage: %s", entity_id)
                    expired.append(entity_id)
                    continue

                paused = PausedAutomation.from_dict(entity_id, info)
                if paused.resume_at <= now:
                    expired.append(entity_id)
                else:
                    if await async_set_automation_state(hass, entity_id, enabled=False):
                        data.paused[entity_id] = paused
                        schedule_resume(hass, data, entity_id, paused.resume_at)
                    else:
                        _LOGGER.warning("Failed to restore paused state for %s, removing from storage", entity_id)
                        expired.append(entity_id)
            except (KeyError, ValueError) as err:
                _LOGGER.warning("Invalid stored data for %s: %s", entity_id, err)
                expired.append(entity_id)

        for entity_id, info in validated.get("scheduled", {}).items():
            try:
                if hass.states.get(entity_id) is None:
                    _LOGGER.info("Cleaning up deleted automation from scheduled storage: %s", entity_id)
                    expired_scheduled.append(entity_id)
                    continue

                scheduled = ScheduledSnooze.from_dict(entity_id, info)
                if scheduled.disable_at <= now:
                    if scheduled.resume_at <= now:
                        expired_scheduled.append(entity_id)
                    else:
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

        for entity_id in expired:
            await async_set_automation_state(hass, entity_id, enabled=True)

        if expired or expired_scheduled:
            await async_save(data)

    data.notify()
