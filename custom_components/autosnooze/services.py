"""Service handlers for AutoSnooze integration."""

from __future__ import annotations

from collections.abc import Callable
import logging
from typing import Any

from homeassistant.core import HomeAssistant, ServiceCall

from homeassistant.helpers import entity_registry as er

from .const import (
    ADJUST_SCHEMA,
    CANCEL_SCHEMA,
    DOMAIN,
    PAUSE_BY_AREA_SCHEMA,
    PAUSE_BY_LABEL_SCHEMA,
    PAUSE_SCHEMA,
)
from .application.pause import (
    _contains_guardrail_term,
    _is_critical_automation,
    _validate_guardrails,
    async_handle_pause_service,
    async_pause_automations,
)
from .application.resume import async_handle_cancel_all_service, async_handle_cancel_service
from .application.scheduled import async_handle_cancel_scheduled_service
from .application.adjust import async_handle_adjust_service
from .models import (
    AutomationPauseData,
    ensure_utc_aware,
)

_LOGGER = logging.getLogger(__name__)


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
    return _get_automations_by_filter(hass, lambda e: e.area_id in area_ids)


def get_automations_by_label(hass: HomeAssistant, label_ids: list[str]) -> list[str]:
    """Get all automation entity IDs with the specified labels."""
    return _get_automations_by_filter(hass, lambda e: e.labels and any(label in label_ids for label in e.labels))


def register_services(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Register integration services."""

    async def handle_pause(call: ServiceCall) -> None:
        """Handle snooze service call."""
        await async_handle_pause_service(hass, data, call)

    async def handle_cancel(call: ServiceCall) -> None:
        """Handle wake service call (FR-10: Early Wake Up)."""
        await async_handle_cancel_service(hass, data, call)

    async def handle_cancel_all(_call: ServiceCall) -> None:
        """Handle wake all service call."""
        await async_handle_cancel_all_service(hass, data)

    async def _handle_pause_by_filter(
        call: ServiceCall,
        filter_key: str,
        get_automations_fn,
        not_found_msg: str,
    ) -> None:
        """Handle pause by area/label service calls (shared logic)."""
        if data.unloaded:
            return

        filter_value = call.data[filter_key]
        filter_ids = [filter_value] if isinstance(filter_value, str) else filter_value
        days = call.data.get("days", 0)
        hours = call.data.get("hours", 0)
        minutes = call.data.get("minutes", 0)
        disable_at = ensure_utc_aware(call.data.get("disable_at"))
        resume_at_dt = ensure_utc_aware(call.data.get("resume_at"))
        confirm = call.data.get("confirm", False)

        entity_ids = get_automations_fn(hass, filter_ids)
        if not entity_ids:
            _LOGGER.warning(not_found_msg, filter_ids)
            return

        _validate_guardrails(hass, entity_ids, confirm=confirm)
        await async_pause_automations(hass, data, entity_ids, days, hours, minutes, disable_at, resume_at_dt)

    async def handle_pause_by_area(call: ServiceCall) -> None:
        """Handle pause by area service call."""
        await _handle_pause_by_filter(
            call,
            "area_id",
            get_automations_by_area,
            "No automations found in area(s): %s",
        )

    async def handle_pause_by_label(call: ServiceCall) -> None:
        """Handle pause by label service call."""
        await _handle_pause_by_filter(
            call,
            "label_id",
            get_automations_by_label,
            "No automations found with label(s): %s",
        )

    async def handle_cancel_scheduled(call: ServiceCall) -> None:
        """Handle cancel scheduled snooze service call."""
        await async_handle_cancel_scheduled_service(hass, data, call)

    async def handle_adjust(call: ServiceCall) -> None:
        """Handle adjust snooze service call."""
        await async_handle_adjust_service(hass, data, call)

    hass.services.async_register(DOMAIN, "pause", handle_pause, schema=PAUSE_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel", handle_cancel, schema=CANCEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_all", handle_cancel_all)
    hass.services.async_register(DOMAIN, "pause_by_area", handle_pause_by_area, schema=PAUSE_BY_AREA_SCHEMA)
    hass.services.async_register(DOMAIN, "pause_by_label", handle_pause_by_label, schema=PAUSE_BY_LABEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_scheduled", handle_cancel_scheduled, schema=CANCEL_SCHEMA)
    hass.services.async_register(DOMAIN, "adjust", handle_adjust, schema=ADJUST_SCHEMA)
