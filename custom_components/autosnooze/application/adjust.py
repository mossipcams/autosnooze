"""Adjust application flow for AutoSnooze."""

from __future__ import annotations

from datetime import timedelta

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError

from ..const import DOMAIN
from ..models import AutomationPauseData


async def async_adjust_snooze_batch(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    delta: timedelta,
) -> None:
    from ..coordinator import async_adjust_snooze_batch as adjust_batch_impl

    await adjust_batch_impl(hass, data, entity_ids, delta)


async def async_handle_adjust_service(
    hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> None:
    """Handle adjust service application flow."""
    if data.unloaded:
        return

    entity_ids = call.data[ATTR_ENTITY_ID]
    days = call.data.get("days", 0)
    hours = call.data.get("hours", 0)
    minutes = call.data.get("minutes", 0)

    delta = timedelta(days=days, hours=hours, minutes=minutes)
    if delta == timedelta():
        raise ServiceValidationError(
            "Adjustment must be non-zero",
            translation_domain=DOMAIN,
            translation_key="invalid_adjustment",
        )

    await async_adjust_snooze_batch(hass, data, entity_ids, delta)
