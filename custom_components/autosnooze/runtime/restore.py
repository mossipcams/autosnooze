"""Restore and validation helpers for AutoSnooze runtime state."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from ..const import MAX_RESUME_RETRIES, RESUME_RETRY_DELAY
from ..domain.notifications import NOTIFICATION_TRIGGER_NONE, validate_notification_config
from ..infrastructure.storage import async_save
from ..models import PausedAutomation, ScheduledSnooze, parse_datetime_utc
from .state import AutomationPauseData

_LOGGER = logging.getLogger(__name__)
StartedNotificationCallback = Callable[[HomeAssistant, list[PausedAutomation]], Awaitable[None]]
_default_started_notification_callback: StartedNotificationCallback | None = None


def configure_default_restore_callbacks(
    *,
    started_notification_callback: StartedNotificationCallback | None = None,
) -> None:
    """Register higher-layer callbacks used during restore-specific workflows."""
    global _default_started_notification_callback
    _default_started_notification_callback = started_notification_callback


async def _notify_started_automations_on_restore(
    hass: HomeAssistant,
    started_items: list[PausedAutomation],
) -> None:
    """Emit start notifications for due scheduled snoozes activated during restore."""
    if _default_started_notification_callback is None or not started_items:
        return
    await _default_started_notification_callback(hass, started_items)


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

    try:
        validate_notification_config(
            entry_data.get("notification_trigger", NOTIFICATION_TRIGGER_NONE),
            entry_data.get("notification_lead_minutes"),
        )
    except ValueError as err:
        _LOGGER.warning("Invalid data for %s: %s", entity_id, err)
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
    expired_pauses: dict[str, PausedAutomation] = {}
    expired_scheduled: list[str] = []
    paused_to_restore: list[PausedAutomation] = []
    scheduled_to_execute: list[ScheduledSnooze] = []
    scheduled_to_restore: list[ScheduledSnooze] = []
    restored_paused: list[PausedAutomation] = []
    failed_expired_wakes: list[PausedAutomation] = []
    executed_scheduled: list[ScheduledSnooze] = []
    restored_started: list[PausedAutomation] = []

    from .ports import (
        async_set_automation_state,
        schedule_disable,
        schedule_pre_resume_notification,
        schedule_resume,
    )

    for entity_id, info in validated.get("paused", {}).items():
        try:
            if hass.states.get(entity_id) is None:
                _LOGGER.info("Cleaning up deleted automation from storage: %s", entity_id)
                expired.append(entity_id)
                continue

            paused = PausedAutomation.from_dict(entity_id, info)
            if paused.resume_at <= now:
                expired.append(entity_id)
                expired_pauses[entity_id] = paused
            else:
                paused_to_restore.append(paused)
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
                    scheduled_to_execute.append(scheduled)
            else:
                scheduled_to_restore.append(scheduled)
        except (KeyError, ValueError) as err:
            _LOGGER.warning("Invalid scheduled data for %s: %s", entity_id, err)
            expired_scheduled.append(entity_id)

    for paused in paused_to_restore:
        if await async_set_automation_state(hass, paused.entity_id, enabled=False):
            restored_paused.append(paused)
        else:
            _LOGGER.warning("Failed to restore paused state for %s, removing from storage", paused.entity_id)
            expired.append(paused.entity_id)

    for scheduled in scheduled_to_execute:
        if await async_set_automation_state(hass, scheduled.entity_id, enabled=False):
            executed_scheduled.append(scheduled)
        else:
            _LOGGER.warning(
                "Failed to execute scheduled disable for %s, removing from storage",
                scheduled.entity_id,
            )
            expired_scheduled.append(scheduled.entity_id)

    for entity_id in expired:
        paused = expired_pauses.get(entity_id)
        if paused is None:
            await async_set_automation_state(hass, entity_id, enabled=True)
            continue
        if await async_set_automation_state(hass, entity_id, enabled=True):
            continue
        if paused.resume_retries < MAX_RESUME_RETRIES:
            paused.resume_retries += 1
            paused.resume_at = dt_util.utcnow() + RESUME_RETRY_DELAY
        failed_expired_wakes.append(paused)

    async with data.lock:
        for paused in restored_paused:
            current_paused = data.paused.get(paused.entity_id)
            if data.scheduled.get(paused.entity_id) is not None or (
                current_paused is not None and current_paused != paused
            ):
                _LOGGER.info(
                    "Skipping stale stored pause for %s; runtime state changed during restore",
                    paused.entity_id,
                )
                continue

            data.paused[paused.entity_id] = paused
            schedule_resume(hass, data, paused.entity_id, paused.resume_at)
            schedule_pre_resume_notification(hass, data, paused)

        for paused in failed_expired_wakes:
            data.paused[paused.entity_id] = paused
            if paused.resume_retries < MAX_RESUME_RETRIES:
                schedule_resume(hass, data, paused.entity_id, paused.resume_at)

        for scheduled in executed_scheduled:
            paused = PausedAutomation(
                entity_id=scheduled.entity_id,
                friendly_name=scheduled.friendly_name,
                resume_at=scheduled.resume_at,
                paused_at=now,
                disable_at=scheduled.disable_at,
                notification_trigger=scheduled.notification_trigger,
                notification_lead_minutes=scheduled.notification_lead_minutes,
            )
            current_paused = data.paused.get(scheduled.entity_id)
            current_scheduled = data.scheduled.get(scheduled.entity_id)
            if (current_paused is not None and current_paused != paused) or (
                current_scheduled is not None and current_scheduled != scheduled
            ):
                _LOGGER.info(
                    "Skipping stale stored scheduled execution for %s; runtime state changed during restore",
                    scheduled.entity_id,
                )
                continue

            data.paused[scheduled.entity_id] = paused
            schedule_resume(hass, data, scheduled.entity_id, scheduled.resume_at)
            schedule_pre_resume_notification(hass, data, paused)
            restored_started.append(paused)

        for scheduled in scheduled_to_restore:
            current_scheduled = data.scheduled.get(scheduled.entity_id)
            if data.paused.get(scheduled.entity_id) is not None or (
                current_scheduled is not None and current_scheduled != scheduled
            ):
                _LOGGER.info(
                    "Skipping stale stored schedule for %s; runtime state changed during restore",
                    scheduled.entity_id,
                )
                continue

            data.scheduled[scheduled.entity_id] = scheduled
            schedule_disable(hass, data, scheduled.entity_id, scheduled)

        if expired or expired_scheduled:
            if not await async_save(data):
                _LOGGER.warning("Failed to persist cleanup of expired entries during storage load")

    data.notify()
    await _notify_started_automations_on_restore(hass, restored_started)
