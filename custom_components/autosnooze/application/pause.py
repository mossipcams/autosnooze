"""Pause application flow for AutoSnooze."""

from __future__ import annotations

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall

from ..models import AutomationPauseData, ensure_utc_aware


def _validate_guardrails(hass: HomeAssistant, entity_ids: list[str], confirm: bool = False) -> None:
    from ..services import _validate_guardrails as validate_guardrails_impl

    validate_guardrails_impl(hass, entity_ids, confirm=confirm)


async def async_pause_automations(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_ids: list[str],
    days: int = 0,
    hours: int = 0,
    minutes: int = 0,
    disable_at=None,
    resume_at_dt=None,
) -> None:
    from ..services import async_pause_automations as pause_automations_impl

    await pause_automations_impl(hass, data, entity_ids, days, hours, minutes, disable_at, resume_at_dt)


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
