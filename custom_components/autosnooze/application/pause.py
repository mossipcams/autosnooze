"""Pause application flow for AutoSnooze."""

from __future__ import annotations

from collections.abc import Mapping
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
from ..runtime.ports import (
    async_save,
    async_set_automation_state,
    cancel_scheduled_timer,
    cancel_timer,
    get_friendly_name,
    schedule_disable,
    schedule_resume,
)
from ..logging_utils import _log_command, _raise_save_failed
from ..models import AutomationPauseData, PausedAutomation, ScheduledSnooze, ensure_utc_aware
from .resume import async_resume
from .scheduled import async_execute_scheduled_disable

_LOGGER = logging.getLogger(__name__)


def _validate_guardrails(hass: HomeAssistant, entity_ids: list[str], confirm: bool = False) -> None:
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
    """Check whether a term appears as a token/phrase in text."""
    escaped = re.escape(term.lower())
    return re.search(rf"(?<![a-z0-9]){escaped}(?![a-z0-9])", text.lower()) is not None


def _is_critical_automation(entity_id: str, friendly_name: str) -> bool:
    """Detect whether automation appears to control critical infrastructure."""
    targets = [entity_id, friendly_name]
    return any(_contains_guardrail_term(target, term) for target in targets for term in CRITICAL_AUTOMATION_TERMS)


async def async_pause_automations(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    days: int = 0,
    hours: int = 0,
    minutes: int = 0,
    disable_at: datetime | None = None,
    resume_at_dt: datetime | None = None,
) -> None:
    """Pause automations with duration or dates."""
    started_at = perf_counter()
    outcome = "success"
    try:
        if data.unloaded:
            return

        if not entity_ids:
            return

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

        scheduled_entries: list[ScheduledSnooze] = []
        paused_entries: list[PausedAutomation] = []
        active_replacements: dict[str, PausedAutomation] = {}
        replacement_wake_results: dict[str, bool] = {}

        for entity_id in entity_ids:
            friendly_name = get_friendly_name(hass, entity_id)

            if use_scheduled:
                assert disable_at is not None
                scheduled_entries.append(
                    ScheduledSnooze(
                        entity_id=entity_id,
                        friendly_name=friendly_name,
                        disable_at=disable_at,
                        resume_at=resume_at,
                    )
                )
                continue

            if not await async_set_automation_state(hass, entity_id, enabled=False):
                continue

            schedule_mode_disable_at = (
                disable_at if disable_at is not None else (now if resume_at_dt is not None else None)
            )
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
                )
            )

        if scheduled_entries:
            async with data.lock:
                active_replacements = {
                    scheduled.entity_id: paused
                    for scheduled in scheduled_entries
                    if (paused := data.paused.get(scheduled.entity_id)) is not None
                }

            for entity_id in active_replacements:
                replacement_wake_results[entity_id] = await async_set_automation_state(hass, entity_id, enabled=True)
                if not replacement_wake_results[entity_id]:
                    _LOGGER.warning(
                        "Failed to wake %s before replacing active snooze with a future schedule",
                        entity_id,
                    )

        re_disable_stale_replacements: list[str] = []
        async with data.lock:
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
                data.paused.pop(scheduled.entity_id, None)
                data.scheduled[scheduled.entity_id] = scheduled
                schedule_disable(
                    hass,
                    data,
                    scheduled.entity_id,
                    scheduled,
                    disable_callback=async_execute_scheduled_disable,
                )
                _LOGGER.info(
                    "Scheduled snooze for %s: disable at %s, resume at %s",
                    scheduled.entity_id,
                    scheduled.disable_at,
                    scheduled.resume_at,
                )

            for paused in paused_entries:
                cancel_scheduled_timer(data, paused.entity_id)
                data.scheduled.pop(paused.entity_id, None)
                data.paused[paused.entity_id] = paused
                schedule_resume(hass, data, paused.entity_id, paused.resume_at, resume_callback=async_resume)
                _LOGGER.info("Snoozed %s until %s", paused.entity_id, paused.resume_at)

            if not await async_save(data):
                _raise_save_failed()
        for entity_id in re_disable_stale_replacements:
            if not await async_set_automation_state(hass, entity_id, enabled=False):
                _LOGGER.warning("Failed to restore disabled state for stale replacement of %s", entity_id)
        data.notify()
    except Exception:
        outcome = "error"
        raise
    finally:
        _log_command("pause", outcome, started_at)


async def async_handle_pause_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> None:
    """Handle the pause service application flow."""
    if data.unloaded:
        return

    entity_ids = call.data[ATTR_ENTITY_ID]
    confirm = call.data.get("confirm", False)
    days = call.data.get("days", 0)
    hours = call.data.get("hours", 0)
    minutes = call.data.get("minutes", 0)
    disable_at = ensure_utc_aware(call.data.get("disable_at"))
    resume_at_dt = ensure_utc_aware(call.data.get("resume_at"))

    _validate_guardrails(hass, entity_ids, confirm=confirm)
    await async_pause_automations(hass, data, entity_ids, days, hours, minutes, disable_at, resume_at_dt)
