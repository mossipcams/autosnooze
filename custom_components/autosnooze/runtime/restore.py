"""Restore and validation helpers for AutoSnooze runtime state."""

from __future__ import annotations

import logging
from typing import Any

from ..domain.notifications import NOTIFICATION_TRIGGER_NONE, validate_notification_config
from ..models import parse_datetime_utc

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
