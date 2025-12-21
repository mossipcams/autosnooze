"""Service handlers for AutoSnooze integration."""

from __future__ import annotations

from datetime import datetime, timedelta
import logging

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from .const import (
    CANCEL_SCHEMA,
    DOMAIN,
    PAUSE_BY_AREA_SCHEMA,
    PAUSE_BY_LABEL_SCHEMA,
    PAUSE_SCHEMA,
)
from .coordinator import (
    async_cancel_scheduled,
    async_resume,
    async_save,
    async_set_automation_state,
    get_friendly_name,
    schedule_disable,
    schedule_resume,
)
from .models import (
    AutomationPauseData,
    PausedAutomation,
    ScheduledSnooze,
    ensure_utc_aware,
)

_LOGGER = logging.getLogger(__name__)


def get_automations_by_area(hass: HomeAssistant, area_ids: list[str]) -> list[str]:
    """Get all automation entity IDs in the specified areas."""
    entity_reg = er.async_get(hass)
    automations = []

    for entity in entity_reg.entities.values():
        if entity.domain == "automation" and entity.area_id in area_ids:
            automations.append(entity.entity_id)

    return automations


def get_automations_by_label(hass: HomeAssistant, label_ids: list[str]) -> list[str]:
    """Get all automation entity IDs with the specified labels."""
    entity_reg = er.async_get(hass)
    automations = []

    for entity in entity_reg.entities.values():
        if entity.domain == "automation" and entity.labels:
            if any(label in label_ids for label in entity.labels):
                automations.append(entity.entity_id)

    return automations


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
    now = dt_util.utcnow()

    # Ensure incoming datetimes are UTC-aware to prevent comparison errors
    # with dt_util.utcnow() which is always offset-aware
    disable_at = ensure_utc_aware(disable_at)
    resume_at_dt = ensure_utc_aware(resume_at_dt)

    # Validate date-based scheduling constraints
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

    # Determine if using date-based or duration-based scheduling
    if resume_at_dt is not None:
        # Date-based scheduling
        resume_at = resume_at_dt
        use_scheduled = disable_at is not None and disable_at > now
    else:
        # Duration-based scheduling
        if days == 0 and hours == 0 and minutes == 0:
            raise ServiceValidationError(
                "Duration must be greater than zero",
                translation_domain=DOMAIN,
                translation_key="invalid_duration",
            )
        resume_at = now + timedelta(days=days, hours=hours, minutes=minutes)
        use_scheduled = False

    for entity_id in entity_ids:
        if not entity_id.startswith("automation."):
            raise ServiceValidationError(
                f"{entity_id} is not an automation",
                translation_domain=DOMAIN,
                translation_key="not_automation",
                translation_placeholders={"entity_id": entity_id},
            )

        friendly_name = get_friendly_name(hass, entity_id)

        if use_scheduled:
            # Schedule future disable
            scheduled = ScheduledSnooze(
                entity_id=entity_id,
                friendly_name=friendly_name,
                disable_at=disable_at,
                resume_at=resume_at,
            )
            data.scheduled[entity_id] = scheduled
            schedule_disable(hass, data, entity_id, scheduled)
            _LOGGER.info(
                "Scheduled snooze for %s: disable at %s, resume at %s",
                entity_id,
                disable_at,
                resume_at,
            )
        else:
            # Immediate disable
            if not await async_set_automation_state(hass, entity_id, enabled=False):
                continue

            # If using date-based scheduling (resume_at_dt provided), store disable_at
            # to indicate this was a schedule-mode snooze (for UI display)
            schedule_mode_disable_at = (
                disable_at if disable_at is not None else (now if resume_at_dt is not None else None)
            )

            data.paused[entity_id] = PausedAutomation(
                entity_id=entity_id,
                friendly_name=friendly_name,
                resume_at=resume_at,
                paused_at=now,
                days=days,
                hours=hours,
                minutes=minutes,
                disable_at=schedule_mode_disable_at,
            )

            schedule_resume(hass, data, entity_id, resume_at)
            _LOGGER.info("Snoozed %s until %s", entity_id, resume_at)

    await async_save(data)
    data.notify()


def register_services(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Register integration services."""

    async def handle_pause(call: ServiceCall) -> None:
        """Handle snooze service call."""
        entity_ids = call.data[ATTR_ENTITY_ID]
        days = call.data.get("days", 0)
        hours = call.data.get("hours", 0)
        minutes = call.data.get("minutes", 0)
        # Ensure datetimes from service calls are UTC-aware
        disable_at = ensure_utc_aware(call.data.get("disable_at"))
        resume_at_dt = ensure_utc_aware(call.data.get("resume_at"))

        await async_pause_automations(hass, data, entity_ids, days, hours, minutes, disable_at, resume_at_dt)

    async def handle_cancel(call: ServiceCall) -> None:
        """Handle wake service call (FR-10: Early Wake Up)."""
        for entity_id in call.data[ATTR_ENTITY_ID]:
            if entity_id not in data.paused:
                _LOGGER.warning("Automation %s is not snoozed", entity_id)
                continue
            await async_resume(hass, data, entity_id)

    async def handle_cancel_all(_call: ServiceCall) -> None:
        """Handle wake all service call."""
        for entity_id in list(data.paused.keys()):
            await async_resume(hass, data, entity_id)

    async def handle_pause_by_area(call: ServiceCall) -> None:
        """Handle pause by area service call."""
        area_id = call.data["area_id"]
        area_ids = [area_id] if isinstance(area_id, str) else area_id
        days = call.data.get("days", 0)
        hours = call.data.get("hours", 0)
        minutes = call.data.get("minutes", 0)
        # Ensure datetimes from service calls are UTC-aware
        disable_at = ensure_utc_aware(call.data.get("disable_at"))
        resume_at_dt = ensure_utc_aware(call.data.get("resume_at"))

        entity_ids = get_automations_by_area(hass, area_ids)
        if not entity_ids:
            _LOGGER.warning("No automations found in area(s): %s", area_ids)
            return

        await async_pause_automations(hass, data, entity_ids, days, hours, minutes, disable_at, resume_at_dt)

    async def handle_pause_by_label(call: ServiceCall) -> None:
        """Handle pause by label service call."""
        label_id = call.data["label_id"]
        label_ids = [label_id] if isinstance(label_id, str) else label_id
        days = call.data.get("days", 0)
        hours = call.data.get("hours", 0)
        minutes = call.data.get("minutes", 0)
        # Ensure datetimes from service calls are UTC-aware
        disable_at = ensure_utc_aware(call.data.get("disable_at"))
        resume_at_dt = ensure_utc_aware(call.data.get("resume_at"))

        entity_ids = get_automations_by_label(hass, label_ids)
        if not entity_ids:
            _LOGGER.warning("No automations found with label(s): %s", label_ids)
            return

        await async_pause_automations(hass, data, entity_ids, days, hours, minutes, disable_at, resume_at_dt)

    async def handle_cancel_scheduled(call: ServiceCall) -> None:
        """Handle cancel scheduled snooze service call."""
        for entity_id in call.data[ATTR_ENTITY_ID]:
            if entity_id not in data.scheduled:
                _LOGGER.warning("Automation %s has no scheduled snooze", entity_id)
                continue
            await async_cancel_scheduled(hass, data, entity_id)

    hass.services.async_register(DOMAIN, "pause", handle_pause, schema=PAUSE_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel", handle_cancel, schema=CANCEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_all", handle_cancel_all)
    hass.services.async_register(DOMAIN, "pause_by_area", handle_pause_by_area, schema=PAUSE_BY_AREA_SCHEMA)
    hass.services.async_register(DOMAIN, "pause_by_label", handle_pause_by_label, schema=PAUSE_BY_LABEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_scheduled", handle_cancel_scheduled, schema=CANCEL_SCHEMA)
