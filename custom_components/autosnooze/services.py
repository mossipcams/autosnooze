"""Service handlers for AutoSnooze integration."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
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
from .application.adjust import async_handle_adjust_service
from .application.pause import (
    _contains_guardrail_term,
    _is_critical_automation,
    _validate_guardrails,
    async_handle_pause_service,
    async_pause_automations,
)
from .application.resume import async_handle_cancel_all_service, async_handle_cancel_service
from .application.scheduled import async_handle_cancel_scheduled_service
from .models import AutomationPauseData, ensure_utc_aware

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


_DirectServiceHandler = Callable[[HomeAssistant, AutomationPauseData, ServiceCall], Awaitable[None]]
_DIRECT_SERVICE_HANDLERS: list[tuple[str, Any, _DirectServiceHandler]] = [
    ("pause", PAUSE_SCHEMA, async_handle_pause_service),
    ("cancel", CANCEL_SCHEMA, async_handle_cancel_service),
    ("cancel_scheduled", CANCEL_SCHEMA, async_handle_cancel_scheduled_service),
    ("adjust", ADJUST_SCHEMA, async_handle_adjust_service),
]
_FILTER_PAUSE_SERVICES: list[tuple[str, Any, str, str, str]] = [
    (
        "pause_by_area",
        PAUSE_BY_AREA_SCHEMA,
        "area_id",
        "get_automations_by_area",
        "No automations found in area(s): %s",
    ),
    (
        "pause_by_label",
        PAUSE_BY_LABEL_SCHEMA,
        "label_id",
        "get_automations_by_label",
        "No automations found with label(s): %s",
    ),
]


def register_services(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Register integration services."""

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
        notify_on_resume = call.data.get("notify_on_resume", False)
        confirm = call.data.get("confirm", False)

        entity_ids = get_automations_fn(hass, filter_ids)
        if not entity_ids:
            _LOGGER.warning(not_found_msg, filter_ids)
            return

        _validate_guardrails(hass, entity_ids, confirm=confirm)
        await async_pause_automations(
            hass,
            data,
            entity_ids,
            days,
            hours,
            minutes,
            disable_at,
            resume_at_dt,
            notify_on_resume,
        )

    for service, schema, handler in _DIRECT_SERVICE_HANDLERS:

        async def _service_handler(call: ServiceCall, _handler: _DirectServiceHandler = handler) -> None:
            await _handler(hass, data, call)

        hass.services.async_register(DOMAIN, service, _service_handler, schema=schema)

    async def _cancel_all_handler(_call: ServiceCall) -> None:
        await async_handle_cancel_all_service(hass, data)

    hass.services.async_register(DOMAIN, "cancel_all", _cancel_all_handler)

    for service, schema, filter_key, get_automations_attr, not_found_msg in _FILTER_PAUSE_SERVICES:

        async def _filter_service_handler(
            call: ServiceCall,
            _filter_key: str = filter_key,
            _get_automations_attr: str = get_automations_attr,
            _not_found_msg: str = not_found_msg,
        ) -> None:
            get_automations_fn = globals()[_get_automations_attr]
            await _handle_pause_by_filter(call, _filter_key, get_automations_fn, _not_found_msg)

        hass.services.async_register(DOMAIN, service, _filter_service_handler, schema=schema)
