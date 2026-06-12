"""Service handlers for AutoSnooze integration."""

from __future__ import annotations

from homeassistant.core import HomeAssistant, ServiceCall

from .const import (
    ADJUST_SCHEMA,
    CANCEL_SCHEMA,
    DOMAIN,
    PAUSE_BY_AREA_SCHEMA,
    PAUSE_BY_LABEL_SCHEMA,
    PAUSE_SCHEMA,
)
from .application.pause import (
    async_handle_pause_by_area_service,
    async_handle_pause_by_label_service,
    async_handle_pause_service,
)
from .application.resume import (
    async_handle_cancel_all_service,
    async_handle_cancel_service,
    async_handle_clear_notification_service,
)
from .application.scheduled import async_handle_cancel_scheduled_service
from .application.adjust import async_handle_adjust_service
from .runtime.state import AutomationPauseData

SERVICE_NAMES = (
    "pause",
    "cancel",
    "cancel_all",
    "pause_by_area",
    "pause_by_label",
    "cancel_scheduled",
    "clear_notification",
    "adjust",
)


def register_services(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Register integration services."""

    async def handle_pause(call: ServiceCall) -> None:
        await async_handle_pause_service(hass, data, call)

    async def handle_cancel(call: ServiceCall) -> None:
        """Handle wake service call (FR-10: Early Wake Up)."""
        await async_handle_cancel_service(hass, data, call)

    async def handle_cancel_all(_call: ServiceCall) -> None:
        """Handle wake all service call."""
        await async_handle_cancel_all_service(hass, data)

    async def handle_pause_by_area(call: ServiceCall) -> None:
        await async_handle_pause_by_area_service(hass, data, call)

    async def handle_pause_by_label(call: ServiceCall) -> None:
        await async_handle_pause_by_label_service(hass, data, call)

    async def handle_cancel_scheduled(call: ServiceCall) -> None:
        """Handle cancel scheduled snooze service call."""
        await async_handle_cancel_scheduled_service(hass, data, call)

    async def handle_clear_notification(call: ServiceCall) -> None:
        """Handle clear notification config service call."""
        await async_handle_clear_notification_service(hass, data, call)

    async def handle_adjust(call: ServiceCall) -> None:
        """Handle adjust snooze service call."""
        await async_handle_adjust_service(hass, data, call)

    hass.services.async_register(DOMAIN, "pause", handle_pause, schema=PAUSE_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel", handle_cancel, schema=CANCEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_all", handle_cancel_all)
    hass.services.async_register(DOMAIN, "pause_by_area", handle_pause_by_area, schema=PAUSE_BY_AREA_SCHEMA)
    hass.services.async_register(DOMAIN, "pause_by_label", handle_pause_by_label, schema=PAUSE_BY_LABEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_scheduled", handle_cancel_scheduled, schema=CANCEL_SCHEMA)
    hass.services.async_register(
        DOMAIN,
        "clear_notification",
        handle_clear_notification,
        schema=CANCEL_SCHEMA,
    )
    hass.services.async_register(DOMAIN, "adjust", handle_adjust, schema=ADJUST_SCHEMA)


def unregister_services(hass: HomeAssistant) -> None:
    """Remove every service registered by this integration."""
    for service in SERVICE_NAMES:
        hass.services.async_remove(DOMAIN, service)
