"""Pause application flow for AutoSnooze."""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Mapping
from datetime import datetime, timedelta
import logging
import re
from time import perf_counter
from typing import Any

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import label_registry as lr
from homeassistant.util import dt as dt_util

from ..const import CRITICAL_AUTOMATION_TERMS, DOMAIN, LABEL_CONFIRM_NAME
from ..domain.notifications import (
    NOTIFICATION_TRIGGER_NONE,
    NotificationTrigger,
    notification_window_supports_lead,
)
from ..domain.transitions import EntityTransitionResult, TransitionOutcome, TransitionResult
from ..logging_utils import _log_command
from ..models import PausedAutomation, ScheduledSnooze, ensure_utc_aware
from ..runtime import ports as runtime_ports
from ..runtime.timers import (
    cancel_notification_timer,
    cancel_scheduled_timer,
    cancel_timer,
)
from ..runtime.persistence_commit import commit_and_persist
from ..runtime.state import AutomationPauseData
from .batching import set_automation_states_bounded

_LOGGER = logging.getLogger(__name__)

type SetAutomationState = Callable[[HomeAssistant, str, bool], Awaitable[bool]]
type SaveData = Callable[[AutomationPauseData], Awaitable[bool]]
type NotifyStarted = Callable[[HomeAssistant, list[PausedAutomation]], Awaitable[None]]
type ScheduleResume = Callable[[HomeAssistant, AutomationPauseData, str, datetime], None]
type ScheduleDisable = Callable[[HomeAssistant, AutomationPauseData, str, ScheduledSnooze], None]
type SchedulePreResumeNotification = Callable[[HomeAssistant, AutomationPauseData, PausedAutomation], bool]


def _get_automations_by_filter(
    hass: HomeAssistant,
    filter_fn: Callable[[Any], bool],
) -> list[str]:
    """Get all automation entity IDs matching a filter predicate."""
    entity_reg = er.async_get(hass)
    return [
        entity.entity_id
        for entity in entity_reg.entities.values()
        if entity.domain == "automation" and filter_fn(entity)
    ]


def get_automations_by_area(hass: HomeAssistant, area_ids: list[str]) -> list[str]:
    """Get all automation entity IDs in the specified areas."""
    return _get_automations_by_filter(hass, lambda entity: entity.area_id in area_ids)


def get_automations_by_label(hass: HomeAssistant, label_ids: list[str]) -> list[str]:
    """Get all automation entity IDs with the specified labels."""
    return _get_automations_by_filter(
        hass,
        lambda entity: entity.labels and any(label in label_ids for label in entity.labels),
    )


def _entity_has_label_name(
    entity: Any,
    label_name: str,
    labels_by_id: Mapping[str, Any],
) -> bool:
    """Check whether entity has a label by id or name."""
    labels = entity.labels or set()
    for label_id in labels:
        if label_id == label_name:
            return True
        label = labels_by_id.get(label_id)
        if label and getattr(label, "name", None) == label_name:
            return True
    return False


def _contains_guardrail_term(text: str, term: str) -> bool:
    """Check whether a term appears as a token or phrase in text."""
    escaped = re.escape(term.lower())
    return re.search(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])", text.lower()) is not None


def _is_critical_automation(entity_id: str, friendly_name: str) -> bool:
    """Detect whether automation appears to control critical infrastructure."""
    targets = [entity_id, friendly_name]
    return any(_contains_guardrail_term(target, term) for target in targets for term in CRITICAL_AUTOMATION_TERMS)


def validate_guardrails(hass: HomeAssistant, entity_ids: list[str], confirm: bool = False) -> None:
    """Validate confirm label guardrails for pause operations."""
    entity_reg = er.async_get(hass)
    label_reg = lr.async_get(hass)
    labels_by_id = label_reg.labels if label_reg is not None else {}
    requires_confirm: list[str] = []

    for entity_id in entity_ids:
        entry = entity_reg.async_get(entity_id)
        state = hass.states.get(entity_id)
        friendly_name = state.attributes.get("friendly_name", "") if state is not None else ""
        has_confirm_label = entry is not None and _entity_has_label_name(entry, LABEL_CONFIRM_NAME, labels_by_id)
        if has_confirm_label or _is_critical_automation(entity_id, friendly_name):
            requires_confirm.append(entity_id)

    if requires_confirm and not confirm:
        raise ServiceValidationError(
            "One or more selected automations require confirmation before snoozing",
            translation_domain=DOMAIN,
            translation_key="confirm_required",
            translation_placeholders={"entity_id": ", ".join(sorted(requires_confirm))},
        )


async def _default_notify_started_automations(
    hass: HomeAssistant,
    paused_entries: list[PausedAutomation],
) -> None:
    del hass, paused_entries


async def async_pause_automations(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    days: int = 0,
    hours: int = 0,
    minutes: int = 0,
    disable_at: datetime | None = None,
    resume_at_dt: datetime | None = None,
    notification_trigger: NotificationTrigger = NOTIFICATION_TRIGGER_NONE,
    notification_lead_minutes: int | None = None,
    *,
    set_automation_state: SetAutomationState | None = None,
    save_data: SaveData | None = None,
    notify_started_automations: NotifyStarted | None = None,
    schedule_resume_callback: ScheduleResume | None = None,
    schedule_disable_callback: ScheduleDisable | None = None,
    schedule_pre_resume_notification_callback: SchedulePreResumeNotification | None = None,
) -> TransitionResult:
    """Pause automations with duration or dates."""
    set_state = set_automation_state or (
        lambda hass, entity_id, enabled: runtime_ports.async_set_automation_state(hass, entity_id, enabled=enabled)
    )
    save_runtime_data = save_data or runtime_ports.async_save
    notify_started = notify_started_automations or _default_notify_started_automations
    resume_scheduler = schedule_resume_callback or runtime_ports.schedule_resume
    disable_scheduler = schedule_disable_callback or runtime_ports.schedule_disable
    pre_resume_scheduler = schedule_pre_resume_notification_callback or runtime_ports.schedule_pre_resume_notification

    started_at = perf_counter()
    outcome = "success"
    entity_count = len(entity_ids)
    ha_call_count = 0
    save_count = 0
    publication_count = 0
    timer_count = 0
    max_lock_hold_ms = 0.0
    data.begin_command()
    lifecycle_generation = data.lifecycle_generation
    try:
        if data.unloaded:
            return TransitionResult(
                "pause",
                tuple(EntityTransitionResult(entity_id, TransitionOutcome.REJECTED) for entity_id in entity_ids),
            )

        if not entity_ids:
            return TransitionResult("pause", ())

        for entity_id in entity_ids:
            if not entity_id.startswith("automation."):
                raise ServiceValidationError(
                    f"{entity_id} is not an automation",
                    translation_domain=DOMAIN,
                    translation_key="not_automation",
                    translation_placeholders={"entity_id": entity_id},
                )

        now = dt_util.utcnow()
        disable_at = ensure_utc_aware(disable_at)
        resume_at_dt = ensure_utc_aware(resume_at_dt)

        if resume_at_dt is not None:
            if resume_at_dt <= now:
                raise ServiceValidationError(
                    "Resume time must be in the future",
                    translation_domain=DOMAIN,
                    translation_key="resume_time_past",
                )
            if disable_at is not None and disable_at >= resume_at_dt:
                raise ServiceValidationError(
                    "Disable time must be before resume time",
                    translation_domain=DOMAIN,
                    translation_key="disable_after_resume",
                )

        if resume_at_dt is not None:
            resume_at = resume_at_dt
            use_scheduled = disable_at is not None and disable_at > now
        else:
            if days == 0 and hours == 0 and minutes == 0:
                raise ServiceValidationError(
                    "Duration must be greater than zero",
                    translation_domain=DOMAIN,
                    translation_key="invalid_duration",
                )
            resume_at = now + timedelta(days=days, hours=hours, minutes=minutes)
            use_scheduled = False

        notification_window_start = disable_at if use_scheduled and disable_at is not None else now
        if not notification_window_supports_lead(
            notification_trigger,
            notification_lead_minutes,
            window=resume_at - notification_window_start,
        ):
            raise ServiceValidationError("notification_lead_minutes must be shorter than the snooze window")

        scheduled_entries: list[ScheduledSnooze] = []
        immediate_candidates: list[tuple[str, str, bool]] = []
        active_replacements: dict[str, PausedAutomation] = {}
        replacement_wake_results: dict[str, bool] = {}
        expected_generations: dict[str, int] = {}
        paused_entries: list[PausedAutomation] = []
        disable_results: dict[str, bool] = {}
        re_enable_stale_pauses: list[str] = []

        for entity_id in entity_ids:
            friendly_name = runtime_ports.get_friendly_name(hass, entity_id)

            if use_scheduled:
                assert disable_at is not None
                scheduled_entries.append(
                    ScheduledSnooze(
                        entity_id=entity_id,
                        friendly_name=friendly_name,
                        disable_at=disable_at,
                        resume_at=resume_at,
                        notification_trigger=notification_trigger,
                        notification_lead_minutes=notification_lead_minutes,
                    )
                )
                continue

            originally_enabled = runtime_ports.is_automation_enabled(hass, entity_id)
            immediate_candidates.append((entity_id, friendly_name, originally_enabled))

        if immediate_candidates:
            async with data.lock:
                expected_generations = {
                    entity_id: data.entity_generation(entity_id) for entity_id, _, _ in immediate_candidates
                }

            disable_targets = [
                entity_id for entity_id, _, originally_enabled in immediate_candidates if originally_enabled
            ]
            ha_call_count += len(disable_targets)
            disable_results = await set_automation_states_bounded(
                set_state,
                hass,
                disable_targets,
                enabled=False,
            )

            if data.unloaded:
                compensation_targets = [
                    entity_id
                    for entity_id, _, originally_enabled in immediate_candidates
                    if originally_enabled and disable_results.get(entity_id, False)
                ]
                ha_call_count += len(compensation_targets)
                compensation_results = await set_automation_states_bounded(
                    set_state,
                    hass,
                    compensation_targets,
                    enabled=True,
                )
                for entity_id in compensation_targets:
                    if not compensation_results.get(entity_id, False):
                        _LOGGER.warning("Failed to compensate pause crossing unload for %s", entity_id)

            schedule_mode_disable_at = (
                disable_at if disable_at is not None else (now if resume_at_dt is not None else None)
            )
            for entity_id, friendly_name, originally_enabled in immediate_candidates:
                if originally_enabled and not disable_results.get(entity_id, False):
                    continue
                if data.unloaded:
                    continue
                paused_entries.append(
                    PausedAutomation(
                        entity_id=entity_id,
                        friendly_name=friendly_name,
                        resume_at=resume_at,
                        paused_at=now,
                        days=days,
                        hours=hours,
                        minutes=minutes,
                        disable_at=schedule_mode_disable_at,
                        notification_trigger=notification_trigger,
                        notification_lead_minutes=notification_lead_minutes,
                        originally_enabled=originally_enabled,
                    )
                )

        if scheduled_entries:
            async with data.lock:
                active_replacements = {
                    scheduled.entity_id: paused
                    for scheduled in scheduled_entries
                    if (paused := data.paused.get(scheduled.entity_id)) is not None
                }

            if active_replacements:
                replacement_targets = list(active_replacements)
                ha_call_count += len(replacement_targets)
                replacement_wake_results = await set_automation_states_bounded(
                    set_state,
                    hass,
                    replacement_targets,
                    enabled=True,
                )
                for entity_id, woke in replacement_wake_results.items():
                    if not woke:
                        _LOGGER.warning(
                            "Failed to wake %s before replacing active snooze with a future schedule",
                            entity_id,
                        )

        re_disable_stale_replacements: list[str] = []
        affected_entity_ids = [entry.entity_id for entry in scheduled_entries] + [
            entry.entity_id for entry in paused_entries
        ]

        def _commit_pause_state() -> None:
            nonlocal timer_count
            for scheduled in scheduled_entries:
                active_replacement = active_replacements.get(scheduled.entity_id)
                if active_replacement is not None:
                    current_paused = data.paused.get(scheduled.entity_id)
                    if not replacement_wake_results.get(scheduled.entity_id, False):
                        continue
                    if current_paused is not active_replacement:
                        if current_paused is not None:
                            re_disable_stale_replacements.append(scheduled.entity_id)
                        continue

                cancel_timer(data, scheduled.entity_id)
                cancel_notification_timer(data, scheduled.entity_id)
                data.paused.pop(scheduled.entity_id, None)
                data.scheduled[scheduled.entity_id] = scheduled
                data.bump_entity_generation(scheduled.entity_id)
                disable_scheduler(hass, data, scheduled.entity_id, scheduled)
                timer_count += 1
                _LOGGER.info(
                    "Scheduled snooze for %s: disable at %s, resume at %s",
                    scheduled.entity_id,
                    scheduled.disable_at,
                    scheduled.resume_at,
                )

            for paused in paused_entries:
                if not data.is_entity_generation_current(
                    paused.entity_id, expected_generations.get(paused.entity_id, -1)
                ):
                    if paused.originally_enabled and disable_results.get(paused.entity_id, False):
                        re_enable_stale_pauses.append(paused.entity_id)
                    continue
                cancel_scheduled_timer(data, paused.entity_id)
                cancel_notification_timer(data, paused.entity_id)
                data.scheduled.pop(paused.entity_id, None)
                data.paused[paused.entity_id] = paused
                data.bump_entity_generation(paused.entity_id)
                if resume_scheduler(hass, data, paused.entity_id, paused.resume_at):
                    timer_count += 1
                pre_resume_scheduler(hass, data, paused)
                _LOGGER.info("Snoozed %s until %s", paused.entity_id, paused.resume_at)

        lock_started_at = perf_counter()
        if affected_entity_ids:
            save_count += 1
            await commit_and_persist(
                data,
                lifecycle_generation=lifecycle_generation,
                mutate=_commit_pause_state,
                affected_entity_ids=affected_entity_ids,
                save_data=save_runtime_data,
                raise_on_failure=True,
            )
        max_lock_hold_ms = max(max_lock_hold_ms, (perf_counter() - lock_started_at) * 1000)

        for entity_id in re_disable_stale_replacements:
            if not await set_state(hass, entity_id, False):
                _LOGGER.warning("Failed to restore disabled state for stale replacement of %s", entity_id)

        if re_enable_stale_pauses:
            ha_call_count += len(re_enable_stale_pauses)
            re_enable_results = await set_automation_states_bounded(
                set_state,
                hass,
                re_enable_stale_pauses,
                enabled=True,
            )
            for entity_id in re_enable_stale_pauses:
                if not re_enable_results.get(entity_id, False):
                    _LOGGER.warning("Failed to restore enabled state for stale pause of %s", entity_id)

        data.notify()
        publication_count += 1
        await notify_started(hass, paused_entries)

        outcomes: list[EntityTransitionResult] = []
        for entity_id in dict.fromkeys(entity_ids):
            if use_scheduled:
                scheduled = next((entry for entry in scheduled_entries if entry.entity_id == entity_id), None)
                if scheduled is None:
                    outcomes.append(EntityTransitionResult(entity_id, TransitionOutcome.REJECTED))
                elif scheduled.entity_id in data.scheduled:
                    outcomes.append(EntityTransitionResult(entity_id, TransitionOutcome.SUCCEEDED))
                else:
                    outcomes.append(EntityTransitionResult(entity_id, TransitionOutcome.REJECTED))
                continue

            candidate = next((entry for entry in immediate_candidates if entry[0] == entity_id), None)
            if candidate is None:
                outcomes.append(EntityTransitionResult(entity_id, TransitionOutcome.REJECTED))
                continue
            _, _, originally_enabled = candidate
            if entity_id in data.paused:
                outcomes.append(EntityTransitionResult(entity_id, TransitionOutcome.SUCCEEDED))
            else:
                outcomes.append(EntityTransitionResult(entity_id, TransitionOutcome.REJECTED))

        return TransitionResult("pause", tuple(outcomes))
    except Exception:
        outcome = "error"
        raise
    finally:
        data.end_command()
        _log_command(
            "pause",
            outcome,
            started_at,
            metrics={
                "entity_count": entity_count,
                "ha_call_count": ha_call_count,
                "save_count": save_count,
                "publication_count": publication_count,
                "timer_count": timer_count,
                "max_lock_hold_ms": max_lock_hold_ms,
            },
        )


def _validate_guardrails(hass: HomeAssistant, entity_ids: list[str], confirm: bool = False) -> None:
    validate_guardrails(hass, entity_ids, confirm=confirm)


async def async_handle_pause_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> TransitionResult:
    """Handle the pause service application flow."""
    entity_ids = call.data[ATTR_ENTITY_ID]
    if isinstance(entity_ids, str):
        entity_ids = [entity_ids]
    if data.unloaded:
        return TransitionResult(
            "pause",
            tuple(EntityTransitionResult(entity_id, TransitionOutcome.REJECTED) for entity_id in entity_ids),
        )

    confirm = call.data.get("confirm", False)
    days = call.data.get("days", 0)
    hours = call.data.get("hours", 0)
    minutes = call.data.get("minutes", 0)
    disable_at = ensure_utc_aware(call.data.get("disable_at"))
    resume_at_dt = ensure_utc_aware(call.data.get("resume_at"))
    notification_trigger = call.data.get("notification_trigger", NOTIFICATION_TRIGGER_NONE)
    notification_lead_minutes = call.data.get("notification_lead_minutes")

    _validate_guardrails(hass, entity_ids, confirm=confirm)
    return await async_pause_automations(
        hass,
        data,
        entity_ids,
        days,
        hours,
        minutes,
        disable_at,
        resume_at_dt,
        notification_trigger,
        notification_lead_minutes,
    )


async def async_handle_pause_by_area_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> None:
    """Handle pause-by-area service application flow."""
    if data.unloaded:
        return

    area_value = call.data["area_id"]
    area_ids = [area_value] if isinstance(area_value, str) else area_value
    entity_ids = get_automations_by_area(hass, area_ids)
    if not entity_ids:
        _LOGGER.warning("No automations found in area(s): %s", area_ids)
        return

    _validate_guardrails(hass, entity_ids, confirm=call.data.get("confirm", False))
    await async_pause_automations(
        hass,
        data,
        entity_ids,
        call.data.get("days", 0),
        call.data.get("hours", 0),
        call.data.get("minutes", 0),
        ensure_utc_aware(call.data.get("disable_at")),
        ensure_utc_aware(call.data.get("resume_at")),
        call.data.get("notification_trigger", NOTIFICATION_TRIGGER_NONE),
        call.data.get("notification_lead_minutes"),
    )


async def async_handle_pause_by_label_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> None:
    """Handle pause-by-label service application flow."""
    if data.unloaded:
        return

    label_value = call.data["label_id"]
    label_ids = [label_value] if isinstance(label_value, str) else label_value
    entity_ids = get_automations_by_label(hass, label_ids)
    if not entity_ids:
        _LOGGER.warning("No automations found with label(s): %s", label_ids)
        return

    _validate_guardrails(hass, entity_ids, confirm=call.data.get("confirm", False))
    await async_pause_automations(
        hass,
        data,
        entity_ids,
        call.data.get("days", 0),
        call.data.get("hours", 0),
        call.data.get("minutes", 0),
        ensure_utc_aware(call.data.get("disable_at")),
        ensure_utc_aware(call.data.get("resume_at")),
        call.data.get("notification_trigger", NOTIFICATION_TRIGGER_NONE),
        call.data.get("notification_lead_minutes"),
    )
