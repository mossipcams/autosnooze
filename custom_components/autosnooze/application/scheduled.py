"""Scheduled snooze application flow for AutoSnooze."""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall

from ..models import AutomationPauseData

CancelScheduledBatch = Callable[[HomeAssistant, AutomationPauseData, list[str]], Awaitable[None]]

_cancel_scheduled_batch_impl: CancelScheduledBatch | None = None


def configure_scheduled_dependencies(*, cancel_scheduled_batch: CancelScheduledBatch) -> None:
    """Wire coordinator scheduled-cancel behavior into the scheduled application flow."""
    global _cancel_scheduled_batch_impl
    _cancel_scheduled_batch_impl = cancel_scheduled_batch


async def async_cancel_scheduled_batch(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
) -> None:
    if _cancel_scheduled_batch_impl is None:
        raise RuntimeError("Cancel scheduled batch implementation is not configured")
    await _cancel_scheduled_batch_impl(hass, data, entity_ids)


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
