"""Pause application flow for AutoSnooze."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import datetime

from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall

from ..models import AutomationPauseData, ensure_utc_aware

GuardrailValidator = Callable[[HomeAssistant, list[str]], None]
PauseAutomations = Callable[
    [HomeAssistant, AutomationPauseData, list[str], int, int, int, datetime | None, datetime | None],
    Awaitable[None],
]

_guardrail_validator: Callable[[HomeAssistant, list[str], bool], None] | None = None
_pause_automations_impl: PauseAutomations | None = None


def configure_pause_dependencies(
    *,
    validate_guardrails: Callable[[HomeAssistant, list[str], bool], None],
    pause_automations: PauseAutomations,
) -> None:
    """Wire service-layer implementations into the pause application flow."""
    global _guardrail_validator, _pause_automations_impl
    _guardrail_validator = validate_guardrails
    _pause_automations_impl = pause_automations


def _validate_guardrails(hass: HomeAssistant, entity_ids: list[str], confirm: bool = False) -> None:
    if _guardrail_validator is None:
        raise RuntimeError("Pause guardrail validator is not configured")
    _guardrail_validator(hass, entity_ids, confirm)


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
    if _pause_automations_impl is None:
        raise RuntimeError("Pause implementation is not configured")
    await _pause_automations_impl(hass, data, entity_ids, days, hours, minutes, disable_at, resume_at_dt)


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
