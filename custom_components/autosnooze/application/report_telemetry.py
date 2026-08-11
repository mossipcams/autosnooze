"""Untrusted card telemetry service handler."""

from __future__ import annotations

from typing import Any

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

    event = call.data.get("event")
    if not isinstance(event, str):
        return

    properties = call.data.get("properties")
    if properties is not None and not isinstance(properties, dict):
        return

    source = call.data.get("source", "card")
    if not isinstance(source, str):
        source = "card"

    card_type = call.data.get("card_type")
    if card_type is not None and not isinstance(card_type, str):
        card_type = None

    client.track(event, properties, source=source, card_type=card_type)
