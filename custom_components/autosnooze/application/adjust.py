"""Adjust application flow for AutoSnooze."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import timedelta

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError

from ..const import DOMAIN
from ..models import AutomationPauseData

AdjustBatch = Callable[[HomeAssistant, AutomationPauseData, list[str], timedelta], Awaitable[None]]

_adjust_batch_impl: AdjustBatch | None = None


def configure_adjust_dependencies(*, adjust_batch: AdjustBatch) -> None:
    """Wire coordinator adjust behavior into the adjust application flow."""
    global _adjust_batch_impl
    _adjust_batch_impl = adjust_batch


async def async_adjust_snooze_batch(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    delta: timedelta,
) -> None:
    if _adjust_batch_impl is None:
        raise RuntimeError("Adjust batch implementation is not configured")
    await _adjust_batch_impl(hass, data, entity_ids, delta)


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
