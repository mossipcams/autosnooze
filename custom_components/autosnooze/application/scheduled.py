"""Scheduled snooze application flow for AutoSnooze."""

from __future__ import annotations

from datetime import datetime
import logging
from time import perf_counter

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.util import dt as dt_util

from ..const import SCHEDULED_DISABLE_RETRY_DELAY
from ..domain.notifications import NOTIFICATION_TRIGGER_NONE
from ..logging_utils import _log_command
from ..models import PausedAutomation, ScheduledSnooze
from ..runtime import ports as runtime_ports
from ..runtime.persistence_commit import commit_and_persist
from ..runtime.timers import cancel_scheduled_timer
from ..runtime.state import AutomationPauseData

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

    data.begin_command()
    lifecycle_generation = data.lifecycle_generation
    try:
        await _execute_scheduled_disable(
            hass,
            data,
            entity_id,
            resume_at,
            lifecycle_generation=lifecycle_generation,
        )
    finally:
        data.end_command()


async def _execute_scheduled_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
    *,
    lifecycle_generation: int,
) -> None:
    async with data.lock:
        cancel_scheduled_timer(data, entity_id)
        expected_scheduled = data.scheduled.get(entity_id)

    originally_enabled = runtime_ports.is_automation_enabled(hass, entity_id)
    if originally_enabled:
        disabled_successfully = await runtime_ports.async_set_automation_state(hass, entity_id, enabled=False)
    else:
        disabled_successfully = True
    if data.unloaded:
        if originally_enabled and disabled_successfully and not await runtime_ports.async_set_automation_state(hass, entity_id, enabled=True):
            _LOGGER.warning("Failed to compensate scheduled disable crossing unload for %s", entity_id)
        return

    stale_after_disable = False
    undo_stale_disable = False
    notify_after_commit = False

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

                def _drop_expired_schedule() -> None:
                    data.scheduled.pop(entity_id, None)

                await commit_and_persist(
                    data,
                    lifecycle_generation=lifecycle_generation,
                    mutate=_drop_expired_schedule,
                    affected_entity_ids=[entity_id],
                    raise_on_failure=True,
                )
                _LOGGER.warning(
                    "Failed to execute scheduled disable for %s; skipping retry because resume time has passed",
                    entity_id,
                )
                data.notify()
                return

            def _schedule_disable_retry() -> None:
                nonlocal scheduled
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
                data.bump_entity_generation(entity_id)
                runtime_ports.schedule_disable(hass, data, entity_id, scheduled)

            await commit_and_persist(
                data,
                lifecycle_generation=lifecycle_generation,
                mutate=_schedule_disable_retry,
                affected_entity_ids=[entity_id],
                raise_on_failure=True,
            )
            _LOGGER.warning(
                "Failed to execute scheduled disable for %s, retrying at %s",
                entity_id,
                retry_at,
            )
            data.notify()
            return

        now = dt_util.utcnow()
        friendly_name = scheduled.friendly_name if scheduled else runtime_ports.get_friendly_name(hass, entity_id)
        disable_at_value = scheduled.disable_at if scheduled else None
        notification_trigger = scheduled.notification_trigger if scheduled is not None else NOTIFICATION_TRIGGER_NONE
        notification_lead_minutes = scheduled.notification_lead_minutes if scheduled is not None else None

        def _commit_scheduled_disable() -> None:
            data.scheduled.pop(entity_id, None)
            data.paused[entity_id] = PausedAutomation(
                entity_id=entity_id,
                friendly_name=friendly_name,
                resume_at=resume_at,
                paused_at=now,
                disable_at=disable_at_value,
                originally_enabled=originally_enabled,
                notification_trigger=notification_trigger,
                notification_lead_minutes=notification_lead_minutes,
            )
            data.bump_entity_generation(entity_id)
            runtime_ports.schedule_resume(hass, data, entity_id, resume_at)
            runtime_ports.schedule_pre_resume_notification(hass, data, data.paused[entity_id])

        await commit_and_persist(
            data,
            lifecycle_generation=lifecycle_generation,
            mutate=_commit_scheduled_disable,
            affected_entity_ids=[entity_id],
            raise_on_failure=True,
        )
        notify_after_commit = True
    if undo_stale_disable:
        if not await runtime_ports.async_set_automation_state(hass, entity_id, enabled=True):
            _LOGGER.warning("Failed to undo stale scheduled disable for %s", entity_id)
        return
    if stale_after_disable:
        return
    if notify_after_commit:
        paused = data.paused.get(entity_id)
        if data.started_notification_callback is not None and paused is not None:
            await data.started_notification_callback(hass, [paused])
        data.notify()
        _LOGGER.info("Executed scheduled snooze for %s until %s", entity_id, resume_at)


async def async_cancel_scheduled(hass: HomeAssistant, data: AutomationPauseData, entity_id: str) -> None:
    """Cancel a scheduled snooze."""
    if data.unloaded:
        return
    def _cancel_scheduled() -> None:
        cancel_scheduled_timer(data, entity_id)
        data.scheduled.pop(entity_id, None)
        data.bump_entity_generation(entity_id)

    await commit_and_persist(
        data,
        lifecycle_generation=data.lifecycle_generation,
        mutate=_cancel_scheduled,
        affected_entity_ids=[entity_id],
        raise_on_failure=True,
    )
    data.notify()
    _LOGGER.info("Cancelled scheduled snooze for: %s", entity_id)


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

        valid_entity_ids = list(dict.fromkeys(entity_ids))

        def _cancel_scheduled_batch() -> None:
            for entity_id in valid_entity_ids:
                cancel_scheduled_timer(data, entity_id)
                data.scheduled.pop(entity_id, None)
                data.bump_entity_generation(entity_id)

        await commit_and_persist(
            data,
            lifecycle_generation=data.lifecycle_generation,
            mutate=_cancel_scheduled_batch,
            affected_entity_ids=valid_entity_ids,
            raise_on_failure=True,
        )
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
