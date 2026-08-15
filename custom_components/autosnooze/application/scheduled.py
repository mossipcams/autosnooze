"""Scheduled snooze application flow for AutoSnooze."""

from __future__ import annotations

import asyncio
from datetime import datetime
import logging
from time import perf_counter

from homeassistant.const import ATTR_ENTITY_ID, STATE_ON
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.util import dt as dt_util

from ..const import SCHEDULED_DISABLE_RETRY_DELAY
from ..domain.notifications import NOTIFICATION_TRIGGER_START
from ..infrastructure.telemetry import track_if_enabled
from ..logging_utils import _log_command, _raise_save_failed
from ..models import PausedAutomation, ScheduledSnooze
from ..runtime import ports as runtime_ports
from ..runtime.timers import cancel_scheduled_timer
from ..runtime.state import AutomationPauseData
from .notifications import notify_started, send_pre_resume_notification
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

    initial_state = hass.states.get(entity_id)
    was_enabled = initial_state is not None and initial_state.state == STATE_ON
    cancellation: asyncio.CancelledError | None = None
    state_change = asyncio.create_task(runtime_ports.async_set_automation_state(hass, entity_id, enabled=False))
    try:
        disabled_successfully = await asyncio.shield(state_change)
    except asyncio.CancelledError as err:
        cancellation = err
        disabled_successfully = await state_change

    def raise_cancellation() -> None:
        if cancellation is not None:
            raise cancellation

    if data.unloaded:
        if disabled_successfully and was_enabled:
            if not await runtime_ports.async_set_automation_state(hass, entity_id, enabled=True):
                _LOGGER.warning("Failed to restore %s after unload interrupted scheduled disable", entity_id)
        raise_cancellation()
        return

    stale_after_disable = False
    undo_stale_disable = False
    should_save = False
    early_notify = False
    paused_for_notification: PausedAutomation | None = None
    success_paused: PausedAutomation | None = None
    skip_retry_log = False
    retry_log_at: datetime | None = None

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
                    should_save = True
                    early_notify = True
                    skip_retry_log = True
                else:
                    if scheduled is None:
                        scheduled = ScheduledSnooze(
                            entity_id=entity_id,
                            friendly_name=runtime_ports.get_friendly_name(hass, entity_id),
                            disable_at=retry_at,
                            resume_at=resume_at,
                        )
                    else:
                        scheduled.disable_at = retry_at

                    data.scheduled[entity_id] = scheduled
                    runtime_ports.schedule_disable(
                        hass, data, entity_id, scheduled, disable_callback=async_execute_scheduled_disable
                    )
                    should_save = True
                    early_notify = True
                    retry_log_at = retry_at
            else:
                scheduled = data.scheduled.pop(entity_id, None)
                now = dt_util.utcnow()
                friendly_name = (
                    scheduled.friendly_name if scheduled else runtime_ports.get_friendly_name(hass, entity_id)
                )
                disable_at = scheduled.disable_at if scheduled else None

                success_paused = PausedAutomation(
                    entity_id=entity_id,
                    friendly_name=friendly_name,
                    resume_at=resume_at,
                    paused_at=now,
                    disable_at=disable_at,
                    notification_trigger=(scheduled.notification_trigger if scheduled is not None else "none"),
                    notification_lead_minutes=(scheduled.notification_lead_minutes if scheduled is not None else None),
                )
                data.paused[entity_id] = success_paused
                runtime_ports.schedule_resume(hass, data, entity_id, resume_at, resume_callback=async_resume)
                paused_for_notification = success_paused
                should_save = True

    if paused_for_notification is not None:
        runtime_ports.schedule_pre_resume_notification(
            hass,
            data,
            paused_for_notification,
            notification_callback=send_pre_resume_notification,
        )

    if should_save:
        if not await runtime_ports.async_save(data):
            _raise_save_failed()

    if data.unloaded:
        raise_cancellation()
        return

    if undo_stale_disable:
        if not await runtime_ports.async_set_automation_state(hass, entity_id, enabled=True):
            _LOGGER.warning("Failed to undo stale scheduled disable for %s", entity_id)
        raise_cancellation()
        return
    if stale_after_disable:
        raise_cancellation()
        return
    if early_notify:
        if skip_retry_log:
            _LOGGER.warning(
                "Failed to execute scheduled disable for %s; skipping retry because resume time has passed",
                entity_id,
            )
        else:
            _LOGGER.warning(
                "Failed to execute scheduled disable for %s, retrying at %s",
                entity_id,
                retry_log_at,
            )
        data.notify()
        raise_cancellation()
        return
    if success_paused is None:
        raise_cancellation()
        return
    data.notify()
    await notify_started(hass, [success_paused])
    if success_paused.notification_trigger == NOTIFICATION_TRIGGER_START:
        track_if_enabled(
            data,
            "notification_used",
            {"trigger": NOTIFICATION_TRIGGER_START},
            source="timer",
        )
    scheduled = data.paused.get(entity_id)
    planned_duration = 0
    if scheduled is not None:
        start = scheduled.disable_at or scheduled.paused_at
        planned_duration = max(int((scheduled.resume_at - start).total_seconds() // 60), 0)
    track_if_enabled(
        data,
        "scheduled_snooze_started",
        {
            "target_count": 1,
            "planned_duration_minutes": planned_duration,
        },
        source="timer",
    )
    _LOGGER.info("Executed scheduled snooze for %s until %s", entity_id, resume_at)
    raise_cancellation()


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
        entity_ids = list(dict.fromkeys(entity_ids))

        async with data.lock:
            for entity_id in entity_ids:
                cancel_scheduled_timer(data, entity_id)
                scheduled = data.scheduled.pop(entity_id, None)
                if scheduled is not None:
                    minutes_before_start = max(
                        int((scheduled.disable_at - dt_util.utcnow()).total_seconds() // 60),
                        0,
                    )
                    track_if_enabled(
                        data,
                        "scheduled_snooze_cancelled",
                        {
                            "target_count": 1,
                            "minutes_before_start": minutes_before_start,
                        },
                        source="service",
                    )
        if not await runtime_ports.async_save(data):
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
