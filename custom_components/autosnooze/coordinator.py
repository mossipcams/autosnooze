"""Coordinator for AutoSnooze integration - handles state, persistence, and timers."""

from __future__ import annotations

from datetime import datetime, timedelta
import logging
from time import perf_counter
from typing import Any, Literal

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
from .infrastructure.storage import async_save
from .logging_utils import _log_command, _raise_save_failed
from .models import (
    AutomationPauseData,
    PausedAutomation,
    ScheduledSnooze,
)
from .runtime.restore import (
    async_load_stored,
    validate_stored_data,
    validate_stored_entry,
)
from .runtime.timers import (
    cancel_scheduled_timer,
    cancel_timer,
    schedule_disable as runtime_schedule_disable,
    schedule_resume as runtime_schedule_resume,
)

_LOGGER = logging.getLogger(__name__)
ResumeReason = Literal["manual", "expired"]
_RESUME_NOTIFICATION_TITLE = "AutoSnooze finished"


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


def _build_resume_notification(paused: PausedAutomation) -> tuple[str, str]:
    """Build copy for a single natural-expiry notification."""
    return (
        _RESUME_NOTIFICATION_TITLE,
        f"{paused.friendly_name} resumed automatically after its snooze ended.",
    )


def _build_resume_batch_notification(paused_items: list[PausedAutomation]) -> tuple[str, str]:
    """Build copy for a batch natural-expiry notification."""
    names = ", ".join(paused.friendly_name for paused in paused_items)
    count = len(paused_items)
    return (
        _RESUME_NOTIFICATION_TITLE,
        f"{count} automations resumed automatically after their snooze ended: {names}.",
    )


async def _send_resume_notification(hass: HomeAssistant, title: str, message: str) -> None:
    """Send a persistent notification without breaking resume flow on failure."""
    try:
        await hass.services.async_call(
            "persistent_notification",
            "create",
            {"title": title, "message": message},
            blocking=True,
        )
    except Exception as err:
        _LOGGER.warning("Failed to send resume notification: %s", err)


async def _notify_resumed_automations(
    hass: HomeAssistant,
    resumed_items: list[PausedAutomation],
    *,
    reason: ResumeReason,
    save_succeeded: bool,
) -> None:
    """Notify only for successful natural-expiry resumes that requested it."""
    if reason != "expired" or not save_succeeded:
        return

    eligible = [paused for paused in resumed_items if paused.notify_on_resume]
    if not eligible:
        return

    if len(eligible) == 1:
        title, message = _build_resume_notification(eligible[0])
    else:
        title, message = _build_resume_batch_notification(eligible)

    await _send_resume_notification(hass, title, message)


def schedule_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
    reason: ResumeReason = "expired",
) -> None:
    """Schedule automation to resume at specified time (FR-06: Auto-Re-enable)."""
    runtime_schedule_resume(
        hass,
        data,
        entity_id,
        resume_at,
        reason=reason,
        track_point_in_time=async_track_point_in_time,
    )


def _clear_paused_after_wake(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel resume timer and remove paused state after a successful wake."""
    cancel_timer(data, entity_id)
    data.paused.pop(entity_id, None)


def _handle_wake_failure(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    paused: PausedAutomation,
) -> bool:
    """Apply retry or give-up state after a failed wake. Returns True if retry was scheduled."""
    if paused.resume_retries >= MAX_RESUME_RETRIES:
        _clear_paused_after_wake(data, entity_id)
        _LOGGER.error("Giving up waking %s after %d retries", entity_id, paused.resume_retries)
        return False

    paused.resume_retries += 1
    retry_at = dt_util.utcnow() + RESUME_RETRY_DELAY
    paused.resume_at = retry_at
    schedule_resume(hass, data, entity_id, retry_at, reason="expired")
    return True


async def async_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    *,
    reason: ResumeReason = "manual",
) -> None:
    """Wake up a snoozed automation."""
    # Check if integration is unloaded to prevent post-unload operations
    if data.unloaded:
        return
    # Perform the HA service call outside the state lock so a slow wake request
    # does not block unrelated pause/resume operations.
    woke_successfully = await async_set_automation_state(hass, entity_id, enabled=True)
    resumed_item: PausedAutomation | None = None
    save_succeeded = False
    async with data.lock:
        paused = data.paused.get(entity_id)
        if woke_successfully:
            resumed_item = paused
            _clear_paused_after_wake(data, entity_id)
        elif paused is not None:
            _handle_wake_failure(hass, data, entity_id, paused)
        save_succeeded = await async_save(data)
    data.notify()
    if resumed_item is not None:
        await _notify_resumed_automations(
            hass,
            [resumed_item],
            reason=reason,
            save_succeeded=save_succeeded,
        )
    if woke_successfully:
        _LOGGER.info("Woke automation: %s", entity_id)
    elif entity_id not in data.paused:
        pass  # Already logged above when giving up
    else:
        _LOGGER.warning("Failed to wake %s; retry scheduled", entity_id)


async def async_resume_batch(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    *,
    reason: ResumeReason = "manual",
) -> None:
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
            candidate_ids = list(dict.fromkeys(entity_id for entity_id in entity_ids if entity_id in data.paused))

        results: dict[str, bool] = {}
        for entity_id in candidate_ids:
            # Keep HA service calls outside the state lock to avoid serializing
            # unrelated operations behind slow wake requests.
            results[entity_id] = await async_set_automation_state(hass, entity_id, enabled=True)

        failed = 0
        woke = 0
        resumed_items: list[PausedAutomation] = []
        save_succeeded = False
        async with data.lock:
            for entity_id in candidate_ids:
                paused = data.paused.get(entity_id)
                if paused is None:
                    continue

                if results.get(entity_id) is True:
                    resumed_items.append(paused)
                    _clear_paused_after_wake(data, entity_id)
                    woke += 1
                else:
                    if _handle_wake_failure(hass, data, entity_id, paused):
                        failed += 1
            # Single save after all operations
            save_succeeded = await async_save(data)
            if not save_succeeded:
                _raise_save_failed()
        data.notify()
        await _notify_resumed_automations(
            hass,
            resumed_items,
            reason=reason,
            save_succeeded=save_succeeded,
        )
        if failed:
            _LOGGER.warning("Woke %d automations, %d failed and were rescheduled", woke, failed)
        else:
            _LOGGER.info("Woke %d automations", woke)
    except Exception:
        outcome = "error"
        raise
    finally:
        _log_command("cancel", outcome, started_at)


def _apply_adjusted_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    paused: PausedAutomation,
    new_resume_at: datetime,
) -> None:
    """Apply adjusted resume time and clear stale duration fields."""
    paused.resume_at = new_resume_at
    paused.days = 0
    paused.hours = 0
    paused.minutes = 0
    schedule_resume(hass, data, entity_id, new_resume_at)


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

        _apply_adjusted_resume(hass, data, entity_id, paused, new_resume_at)
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
                _apply_adjusted_resume(hass, data, entity_id, paused, new_resume_at)
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
        scheduled = data.scheduled.get(entity_id)

        # DEF-014 FIX: Check disable BEFORE popping scheduled entry
        # This preserves the schedule for retry if disable fails
        if not await async_set_automation_state(hass, entity_id, enabled=False):
            now = dt_util.utcnow()
            retry_at = now + SCHEDULED_DISABLE_RETRY_DELAY

            # If resume time has passed (or retry would run at/after resume), stop retrying.
            if resume_at <= now or retry_at >= resume_at:
                data.scheduled.pop(entity_id, None)
                await async_save(data)
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
            await async_save(data)
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
            notify_on_resume=scheduled.notify_on_resume if scheduled is not None else False,
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
        _remove_scheduled_snoozes(data, [entity_id])
        if not await async_save(data):
            _raise_save_failed()
    data.notify()
    _LOGGER.info("Cancelled scheduled snooze for: %s", entity_id)


def _remove_scheduled_snoozes(data: AutomationPauseData, entity_ids: list[str]) -> None:
    for entity_id in entity_ids:
        cancel_scheduled_timer(data, entity_id)
        data.scheduled.pop(entity_id, None)


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
            _remove_scheduled_snoozes(data, entity_ids)
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
