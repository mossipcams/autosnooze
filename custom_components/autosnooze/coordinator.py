"""Coordinator for AutoSnooze integration - handles state, persistence, and timers."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
import logging
from time import perf_counter
from typing import Literal

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
from .domain.notifications import (
    NOTIFICATION_TRIGGER_ABOUT_TO_END,
    NOTIFICATION_TRIGGER_END,
    NOTIFICATION_TRIGGER_START,
)
from .infrastructure.storage import async_save as infrastructure_async_save
from .logging_utils import _log_command, _raise_save_failed
from .models import (
    PausedAutomation,
    ScheduledSnooze,
)
from .runtime.state import AutomationPauseData
from .runtime.restore import (
    async_load_stored as runtime_async_load_stored,
    configure_default_restore_callbacks,
)
from .runtime.timers import (
    cancel_notification_timer as runtime_cancel_notification_timer,
    cancel_scheduled_timer as runtime_cancel_scheduled_timer,
    cancel_timer as runtime_cancel_timer,
    configure_default_timer_callbacks,
    schedule_disable as runtime_schedule_disable,
    schedule_pre_resume_notification as runtime_schedule_pre_resume_notification,
    schedule_resume as runtime_schedule_resume,
)

_LOGGER = logging.getLogger(__name__)
ResumeReason = Literal["manual", "expired"]
_RESUME_NOTIFICATION_ID = "autosnooze_resume_finished"
_START_NOTIFICATION_TITLE = "AutoSnooze started"
_PRE_RESUME_NOTIFICATION_TITLE = "AutoSnooze ending soon"
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


def _build_started_notification(paused: PausedAutomation) -> tuple[str, str]:
    """Build copy for a single snooze-start notification."""
    return (
        _START_NOTIFICATION_TITLE,
        f"{paused.friendly_name} snooze started.",
    )


def _build_started_batch_notification(paused_items: list[PausedAutomation]) -> tuple[str, str]:
    """Build copy for a batch snooze-start notification."""
    names = ", ".join(paused.friendly_name for paused in paused_items)
    count = len(paused_items)
    return (
        _START_NOTIFICATION_TITLE,
        f"{count} automations snooze started: {names}.",
    )


def _build_pre_resume_notification(paused: PausedAutomation) -> tuple[str, str]:
    """Build copy for a single pre-resume notification."""
    lead_minutes = paused.notification_lead_minutes or 0
    minute_label = "minute" if lead_minutes == 1 else "minutes"
    return (
        _PRE_RESUME_NOTIFICATION_TITLE,
        f"{paused.friendly_name} will resume in {lead_minutes} {minute_label}.",
    )


async def _dismiss_resume_notification(hass: HomeAssistant) -> None:
    """Dismiss the active resume notification without breaking resume flow on failure."""
    try:
        await hass.services.async_call(
            "persistent_notification",
            "dismiss",
            {"notification_id": _RESUME_NOTIFICATION_ID},
            blocking=True,
        )
    except Exception as err:
        _LOGGER.warning("Failed to dismiss resume notification: %s", err)


async def _send_resume_notification(hass: HomeAssistant, title: str, message: str) -> None:
    """Send a persistent notification without breaking resume flow on failure."""
    await _dismiss_resume_notification(hass)

    try:
        await hass.services.async_call(
            "persistent_notification",
            "create",
            {
                "title": title,
                "message": message,
                "notification_id": _RESUME_NOTIFICATION_ID,
            },
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

    eligible = [paused for paused in resumed_items if paused.notification_trigger == NOTIFICATION_TRIGGER_END]
    if not eligible:
        return

    if len(eligible) == 1:
        title, message = _build_resume_notification(eligible[0])
    else:
        title, message = _build_resume_batch_notification(eligible)

    await _send_resume_notification(hass, title, message)


async def _notify_started_automations(
    hass: HomeAssistant,
    started_items: list[PausedAutomation],
    *,
    save_succeeded: bool,
) -> None:
    """Notify only for successful snooze starts that requested start notifications."""
    if not save_succeeded:
        return

    eligible = [paused for paused in started_items if paused.notification_trigger == NOTIFICATION_TRIGGER_START]
    if not eligible:
        return

    if len(eligible) == 1:
        title, message = _build_started_notification(eligible[0])
    else:
        title, message = _build_started_batch_notification(eligible)

    await _send_resume_notification(hass, title, message)


async def async_send_pre_resume_notification(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
) -> None:
    """Send a notification shortly before a snooze ends when configured."""
    async with data.lock:
        paused = data.paused.get(entity_id)
        if (
            paused is None
            or paused.notification_trigger != NOTIFICATION_TRIGGER_ABOUT_TO_END
            or paused.notification_lead_minutes is None
        ):
            return

    title, message = _build_pre_resume_notification(paused)
    await _send_resume_notification(hass, title, message)


def cancel_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel timer for entity if exists."""
    runtime_cancel_timer(data, entity_id)


def cancel_scheduled_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel scheduled timer for entity if exists."""
    runtime_cancel_scheduled_timer(data, entity_id)


def cancel_notification_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel pre-resume notification timer for entity if it exists."""
    runtime_cancel_notification_timer(data, entity_id)


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


def schedule_pre_resume_notification(
    hass: HomeAssistant,
    data: AutomationPauseData,
    paused: PausedAutomation,
) -> bool:
    """Schedule a notification shortly before an active snooze ends."""
    return runtime_schedule_pre_resume_notification(
        hass,
        data,
        paused,
        notification_callback=async_send_pre_resume_notification,
        track_point_in_time=async_track_point_in_time,
    )


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
    async with data.lock:
        expected_pause = data.paused.get(entity_id)
    # Perform the HA service call outside the state lock so a slow wake request
    # does not block unrelated pause/resume operations.
    woke_successfully = await async_set_automation_state(hass, entity_id, enabled=True)
    resumed_item: PausedAutomation | None = None
    save_succeeded = False
    re_disable_entity = False
    async with data.lock:
        paused = data.paused.get(entity_id)
        if expected_pause is not None and paused is not expected_pause:
            re_disable_entity = woke_successfully and paused is not None
            paused = None
        if woke_successfully:
            if paused is not None or expected_pause is None:
                resumed_item = paused
                cancel_timer(data, entity_id)
                cancel_notification_timer(data, entity_id)
                if paused is not None:
                    data.paused.pop(entity_id, None)
        elif paused is not None:
            cancel_notification_timer(data, entity_id)
            if paused.resume_retries >= MAX_RESUME_RETRIES:
                cancel_timer(data, entity_id)
                data.paused.pop(entity_id, None)
                _LOGGER.error("Giving up waking %s after %d retries", entity_id, paused.resume_retries)
            else:
                paused.resume_retries += 1
                retry_at = dt_util.utcnow() + RESUME_RETRY_DELAY
                paused.resume_at = retry_at
                schedule_resume(hass, data, entity_id, retry_at, reason="expired")
        save_succeeded = await async_save(data)
        if not save_succeeded:
            _raise_save_failed()
    if re_disable_entity:
        if not await async_set_automation_state(hass, entity_id, enabled=False):
            _LOGGER.warning("Failed to restore disabled state for stale resume of %s", entity_id)
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
        resumed_items: list[PausedAutomation] = []
        save_succeeded = False
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

                cancel_notification_timer(data, entity_id)
                if results.get(entity_id) is True:
                    resumed_items.append(paused)
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
                        schedule_resume(hass, data, entity_id, retry_at, reason="expired")
            # Single save after all operations
            save_succeeded = await async_save(data)
            if not save_succeeded:
                _raise_save_failed()
        for entity_id in re_disable_entities:
            if not await async_set_automation_state(hass, entity_id, enabled=False):
                _LOGGER.warning("Failed to restore disabled state for stale resume of %s", entity_id)
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
        schedule_pre_resume_notification(hass, data, paused)
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
                schedule_pre_resume_notification(hass, data, paused)
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
                notification_trigger=(scheduled.notification_trigger if scheduled is not None else "none"),
                notification_lead_minutes=(scheduled.notification_lead_minutes if scheduled is not None else None),
            )

            paused = data.paused[entity_id]
            schedule_resume(hass, data, entity_id, resume_at)
            schedule_pre_resume_notification(hass, data, paused)
            if not await async_save(data):
                _raise_save_failed()
    if undo_stale_disable:
        if not await async_set_automation_state(hass, entity_id, enabled=True):
            _LOGGER.warning("Failed to undo stale scheduled disable for %s", entity_id)
        return
    if stale_after_disable:
        return
    data.notify()
    await _notify_started_automations(
        hass,
        [paused],
        save_succeeded=True,
    )
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


async def async_load_stored(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Load and restore snoozed automations from storage (FR-07: Persistence)."""
    await runtime_async_load_stored(hass, data)


configure_default_timer_callbacks(
    resume_callback=async_resume,
    notification_callback=async_send_pre_resume_notification,
    disable_callback=async_execute_scheduled_disable,
)
configure_default_restore_callbacks(
    started_notification_callback=lambda hass, paused_entries: _notify_started_automations(
        hass,
        paused_entries,
        save_succeeded=True,
    )
)
