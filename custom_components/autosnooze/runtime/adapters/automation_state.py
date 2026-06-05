"""Home Assistant automation state adapter."""

from __future__ import annotations

from inspect import isawaitable
import logging

from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


def is_automation_enabled(hass: HomeAssistant, entity_id: str) -> bool:
    """Return whether an automation entity is currently enabled."""
    state = hass.states.get(entity_id)
    return state is not None and state.state == "on"


async def async_set_automation_state(hass: HomeAssistant, entity_id: str, *, enabled: bool) -> bool:
    """Enable or disable an automation."""
    state = hass.states.get(entity_id)
    if state is None:
        _LOGGER.warning("Automation not found: %s", entity_id)
        return False

    try:
        result = hass.services.async_call(
            "automation",
            "turn_on" if enabled else "turn_off",
            {ATTR_ENTITY_ID: entity_id},
            blocking=True,
        )
        if isawaitable(result):
            await result
        return True
    except Exception as err:
        _LOGGER.error("Failed to %s %s: %s", "wake" if enabled else "snooze", entity_id, err)
        return False


def get_friendly_name(hass: HomeAssistant, entity_id: str) -> str:
    """Get friendly name for entity."""
    if state := hass.states.get(entity_id):
        return state.attributes.get(ATTR_FRIENDLY_NAME, entity_id)
    return entity_id
