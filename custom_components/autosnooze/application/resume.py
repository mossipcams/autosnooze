"""Resume application flow for AutoSnooze."""

from __future__ import annotations

import logging
from time import perf_counter
from typing import Literal

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.util import dt as dt_util

from ..const import MAX_RESUME_RETRIES, RESUME_RETRY_DELAY
from ..domain.notifications import NOTIFICATION_TRIGGER_NONE
from ..domain.transitions import EntityTransitionResult, RecoveryStatus, TransitionOutcome, TransitionResult
from ..logging_utils import _log_command
from ..runtime import ports as runtime_ports
from ..runtime.persistence_commit import commit_and_persist
from ..runtime.state import AutomationPauseData
from ..runtime.timers import cancel_notification_timer, cancel_timer
from .batching import BATCH_CONCURRENCY, set_automation_states_bounded

ResumeReason = Literal["manual", "expired"]
_LOGGER = logging.getLogger(__name__)


async def async_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    *,
    reason: ResumeReason = "manual",
    publish: bool = True,
) -> TransitionResult:
    """Wake up a snoozed automation."""
    if data.unloaded:
        return TransitionResult("resume", (EntityTransitionResult(entity_id, TransitionOutcome.REJECTED),))
    data.begin_command()
    lifecycle_generation = data.lifecycle_generation
    try:
        return await _resume_entity(
            hass,
            data,
            entity_id,
            reason=reason,
            publish=publish,
            lifecycle_generation=lifecycle_generation,
        )
    finally:
        data.end_command()


async def _resume_entity(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    *,
    reason: ResumeReason,
    publish: bool,
    lifecycle_generation: int,
) -> TransitionResult:
    async with data.lock:
        expected_pause = data.paused.get(entity_id)
        expected_generation = data.entity_generation(entity_id)

    woke_successfully = (
        True
        if expected_pause is not None and not expected_pause.originally_enabled
        else await runtime_ports.async_set_automation_state(hass, entity_id, enabled=True)
    )
    re_disable_entity = False
    stale_generation = False

    def _commit_resume_state() -> None:
        nonlocal re_disable_entity, stale_generation
        paused = data.paused.get(entity_id)
        if not data.is_entity_generation_current(entity_id, expected_generation):
            stale_generation = True
            re_disable_entity = woke_successfully and paused is not None
            return
        if expected_pause is not None and paused is not expected_pause:
            re_disable_entity = woke_successfully and paused is not None
            paused = None
        if woke_successfully:
            if paused is not None or expected_pause is None:
                cancel_timer(data, entity_id)
                cancel_notification_timer(data, entity_id)
                if paused is not None:
                    data.paused.pop(entity_id, None)
                    data.bump_entity_generation(entity_id)
        elif paused is not None:
            cancel_notification_timer(data, entity_id)
            if paused.resume_retries >= MAX_RESUME_RETRIES:
                cancel_timer(data, entity_id)
                paused.recovery_status = RecoveryStatus.REQUIRED
                _LOGGER.error("Automatic wake exhausted for %s after %d retries", entity_id, paused.resume_retries)
            else:
                paused.resume_retries += 1
                paused.recovery_status = RecoveryStatus.RETRYING
                if reason != "expired":
                    retry_at = dt_util.utcnow() + RESUME_RETRY_DELAY
                    paused.resume_at = retry_at
                    runtime_ports.schedule_resume(hass, data, entity_id, retry_at)

    await commit_and_persist(
        data,
        lifecycle_generation=lifecycle_generation,
        mutate=_commit_resume_state,
        affected_entity_ids=[entity_id],
        raise_on_failure=True,
    )
    if stale_generation:
        re_disable_entity = re_disable_entity or (woke_successfully and data.paused.get(entity_id) is not None)
    if re_disable_entity:
        if not await runtime_ports.async_set_automation_state(hass, entity_id, enabled=False):
            _LOGGER.warning("Failed to restore disabled state for stale resume of %s", entity_id)
    if publish:
        data.notify()
    if woke_successfully:
        _LOGGER.info("Woke automation: %s", entity_id)
    elif entity_id not in data.paused:
        pass
    else:
        _LOGGER.warning("Failed to wake %s; retry scheduled", entity_id)
    paused = data.paused.get(entity_id)
    if woke_successfully:
        outcome = TransitionOutcome.SUCCEEDED
        recovery_status = RecoveryStatus.NONE
    elif paused is not None and paused.recovery_status is RecoveryStatus.REQUIRED:
        outcome = TransitionOutcome.RECOVERY_REQUIRED
        recovery_status = RecoveryStatus.REQUIRED
    else:
        outcome = TransitionOutcome.RETRYING
        recovery_status = RecoveryStatus.RETRYING
    return TransitionResult("resume", (EntityTransitionResult(entity_id, outcome, recovery_status),))


async def async_resume_batch(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    *,
    reason: ResumeReason = "manual",
) -> TransitionResult:
    """Wake up multiple snoozed automations efficiently with single save."""
    del reason  # Application resume only handles manual/service-driven flows.
    started_at = perf_counter()
    outcome = "success"
    data.begin_command()
    lifecycle_generation = data.lifecycle_generation
    try:
        if data.unloaded:
            return TransitionResult(
                "resume",
                tuple(EntityTransitionResult(entity_id, TransitionOutcome.REJECTED) for entity_id in entity_ids),
            )
        if not entity_ids:
            return TransitionResult("resume", ())

        async with data.lock:
            candidates = {
                entity_id: data.paused[entity_id] for entity_id in dict.fromkeys(entity_ids) if entity_id in data.paused
            }
            expected_generations = {entity_id: data.entity_generation(entity_id) for entity_id in candidates}
            candidate_ids = list(candidates)

        wake_results = await set_automation_states_bounded(
            lambda hass, entity_id, enabled: runtime_ports.async_set_automation_state(hass, entity_id, enabled=enabled),
            hass,
            candidate_ids,
            enabled=True,
            should_apply=lambda entity_id: candidates[entity_id].originally_enabled,
        )
        results = wake_results

        failed = 0
        woke = 0
        re_disable_entities: list[str] = []

        def _commit_resume_batch() -> None:
            nonlocal failed, woke
            for entity_id in candidate_ids:
                paused = data.paused.get(entity_id)
                if not data.is_entity_generation_current(entity_id, expected_generations[entity_id]):
                    if results.get(entity_id) is True and paused is not None:
                        re_disable_entities.append(entity_id)
                    continue
                if paused is not candidates[entity_id]:
                    if results.get(entity_id) is True and paused is not None:
                        re_disable_entities.append(entity_id)
                    continue
                if paused is None:
                    continue

                cancel_notification_timer(data, entity_id)
                if results.get(entity_id) is True:
                    cancel_timer(data, entity_id)
                    data.paused.pop(entity_id, None)
                    data.bump_entity_generation(entity_id)
                    woke += 1
                else:
                    if paused.resume_retries >= MAX_RESUME_RETRIES:
                        cancel_timer(data, entity_id)
                        paused.recovery_status = RecoveryStatus.REQUIRED
                        _LOGGER.error(
                            "Automatic wake exhausted for %s after %d retries", entity_id, paused.resume_retries
                        )
                    else:
                        failed += 1
                        paused.resume_retries += 1
                        paused.recovery_status = RecoveryStatus.RETRYING
                        retry_at = dt_util.utcnow() + RESUME_RETRY_DELAY
                        paused.resume_at = retry_at
                        runtime_ports.schedule_resume(hass, data, entity_id, retry_at)

        if entity_ids:
            await commit_and_persist(
                data,
                lifecycle_generation=lifecycle_generation,
                mutate=_commit_resume_batch,
                affected_entity_ids=candidate_ids or list(dict.fromkeys(entity_ids)),
                raise_on_failure=True,
            )
        for entity_id in re_disable_entities:
            if not await runtime_ports.async_set_automation_state(hass, entity_id, enabled=False):
                _LOGGER.warning("Failed to restore disabled state for stale resume of %s", entity_id)
        data.notify()
        if failed:
            _LOGGER.warning("Woke %d automations, %d failed and were rescheduled", woke, failed)
        else:
            _LOGGER.info("Woke %d automations", woke)
        outcomes: list[EntityTransitionResult] = []
        for entity_id in dict.fromkeys(entity_ids):
            if entity_id not in candidates:
                outcomes.append(EntityTransitionResult(entity_id, TransitionOutcome.REJECTED))
            elif results.get(entity_id):
                outcomes.append(EntityTransitionResult(entity_id, TransitionOutcome.SUCCEEDED))
            else:
                paused = data.paused.get(entity_id)
                recovery_status = paused.recovery_status if paused is not None else RecoveryStatus.REQUIRED
                outcome = (
                    TransitionOutcome.RECOVERY_REQUIRED
                    if recovery_status is RecoveryStatus.REQUIRED
                    else TransitionOutcome.RETRYING
                )
                outcomes.append(EntityTransitionResult(entity_id, outcome, recovery_status))
        return TransitionResult("resume", tuple(outcomes))
    except Exception:
        outcome = "error"
        raise
    finally:
        data.end_command()
        _log_command("cancel", outcome, started_at)


async def async_clear_notification_config_batch(
    _hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
) -> None:
    """Clear notification settings from paused automations with one save."""
    started_at = perf_counter()
    outcome = "success"
    try:
        if data.unloaded:
            return
        if not entity_ids:
            return

        changed_entity_ids: list[str] = []
        async with data.lock:
            for entity_id in dict.fromkeys(entity_ids):
                paused = data.paused.get(entity_id)
                if paused is None:
                    continue
                if (
                    paused.notification_trigger == NOTIFICATION_TRIGGER_NONE
                    and paused.notification_lead_minutes is None
                ):
                    continue
                changed_entity_ids.append(entity_id)

        if not changed_entity_ids:
            return

        def _commit_clear_notifications() -> None:
            for entity_id in changed_entity_ids:
                paused = data.paused.get(entity_id)
                if paused is None:
                    continue
                cancel_notification_timer(data, entity_id)
                paused.notification_trigger = NOTIFICATION_TRIGGER_NONE
                paused.notification_lead_minutes = None

        await commit_and_persist(
            data,
            lifecycle_generation=data.lifecycle_generation,
            mutate=_commit_clear_notifications,
            affected_entity_ids=changed_entity_ids,
            raise_on_failure=True,
        )

        data.notify()
        _LOGGER.info("Cleared notification config for paused automations")
    except Exception:
        outcome = "error"
        raise
    finally:
        _log_command("clear_notification", outcome, started_at)


async def async_handle_cancel_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> TransitionResult:
    """Handle cancel service application flow."""
    entity_ids = call.data[ATTR_ENTITY_ID]
    if isinstance(entity_ids, str):
        entity_ids = [entity_ids]
    if data.unloaded:
        return TransitionResult(
            "cancel",
            tuple(EntityTransitionResult(entity_id, TransitionOutcome.REJECTED) for entity_id in entity_ids),
        )

    return await async_resume_batch(hass, data, list(dict.fromkeys(entity_ids)), reason="manual")


async def async_handle_cancel_all_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
) -> TransitionResult:
    """Handle cancel-all service application flow."""
    entity_ids = list(data.paused.keys())
    if data.unloaded:
        return TransitionResult("cancel_all", ())
    if not entity_ids:
        return TransitionResult("cancel_all", ())
    return await async_resume_batch(hass, data, entity_ids, reason="manual")


async def async_handle_clear_notification_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> None:
    """Handle clear-notification service application flow."""
    if data.unloaded:
        return

    valid_ids = [entity_id for entity_id in call.data[ATTR_ENTITY_ID] if entity_id in data.paused]
    if valid_ids:
        await async_clear_notification_config_batch(hass, data, valid_ids)
