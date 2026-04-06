"""Scheduled snooze application flow for AutoSnooze."""

from __future__ import annotations

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall

from ..models import AutomationPauseData


async def async_cancel_scheduled_batch(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
) -> None:
    from ..coordinator import async_cancel_scheduled_batch as cancel_scheduled_batch_impl

    await cancel_scheduled_batch_impl(hass, data, entity_ids)


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
