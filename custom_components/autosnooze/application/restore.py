"""Restore application flow for AutoSnooze."""

from __future__ import annotations

import logging

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import UnsupportedStorageVersionError
from homeassistant.util import dt as dt_util

from ..domain.transitions import TransitionOutcome
from ..models import PausedAutomation, ScheduledSnooze
from ..runtime import ports as runtime_ports
from ..runtime.restore import validate_stored_data
from ..runtime.state import AutomationPauseData
from .resume import async_resume

_LOGGER = logging.getLogger(__name__)


async def async_restore_stored(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Reconcile stored snooze state with Home Assistant and runtime timers."""
    if data.store is None:
        return

    try:
        stored = await data.store.async_load()
    except UnsupportedStorageVersionError as err:
        raise RuntimeError(
            f"Unsupported AutoSnooze storage version for {err.storage_key}: "
            f"found {err.found_version}, max supported {err.max_supported_version}"
        ) from err
    except Exception as err:
        raise RuntimeError("Failed to load stored AutoSnooze data") from err

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
    failed_restore_redisables: list[PausedAutomation] = []
    executed_scheduled: list[ScheduledSnooze] = []
    restored_started: list[PausedAutomation] = []

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
        if await runtime_ports.async_set_automation_state(hass, paused.entity_id, enabled=False):
            restored_paused.append(paused)
        else:
            _LOGGER.warning("Failed to restore paused state for %s, retaining recovery record", paused.entity_id)
            failed_restore_redisables.append(paused)

    for scheduled in scheduled_to_execute:
        if await runtime_ports.async_set_automation_state(hass, scheduled.entity_id, enabled=False):
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
            continue
        data.paused[entity_id] = paused
        result = await async_resume(hass, data, entity_id, reason="expired", publish=False)
        if result.entities and result.entities[0].outcome is not TransitionOutcome.SUCCEEDED:
            failed_expired_wakes.append(data.paused.get(entity_id, paused))

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
            runtime_ports.schedule_resume(hass, data, paused.entity_id, paused.resume_at)
            runtime_ports.schedule_pre_resume_notification(hass, data, paused)

        for paused in failed_expired_wakes:
            data.paused.setdefault(paused.entity_id, paused)

        for paused in failed_restore_redisables:
            data.paused.setdefault(paused.entity_id, paused)

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
            runtime_ports.schedule_resume(hass, data, scheduled.entity_id, scheduled.resume_at)
            runtime_ports.schedule_pre_resume_notification(hass, data, paused)
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
            runtime_ports.schedule_disable(hass, data, scheduled.entity_id, scheduled)

        if expired or expired_scheduled:
            if not await runtime_ports.async_save(data):
                _LOGGER.warning("Failed to persist cleanup of expired entries during storage load")

    data.notify()
    if data.started_notification_callback is not None and restored_started:
        await data.started_notification_callback(hass, restored_started)
