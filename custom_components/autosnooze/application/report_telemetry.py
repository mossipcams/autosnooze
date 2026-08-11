"""Untrusted card telemetry service handler."""

from __future__ import annotations

from homeassistant.core import HomeAssistant, ServiceCall

from ..runtime.state import AutomationPauseData


async def async_handle_report_telemetry(
    _hass: HomeAssistant,
    data: AutomationPauseData,
    call: ServiceCall,
) -> None:
    client = data.telemetry
    if client is None or not client.is_enabled():
        return
    client.track(
        call.data.get("event"),
        call.data.get("properties"),
        source=call.data.get("source", "card"),
        card_type=call.data.get("card_type"),
    )
