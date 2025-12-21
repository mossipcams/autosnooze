"""AutoSnooze integration - Temporarily pause Home Assistant automations."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import (
    CARD_PATH,
    CARD_URL,
    CARD_URL_VERSIONED,
    DOMAIN,
    PLATFORMS,
    STORAGE_VERSION,
    VERSION,
)
from .coordinator import async_load_stored
from .models import AutomationPauseConfigEntry, AutomationPauseData
from .services import register_services

_LOGGER = logging.getLogger(__name__)

# Re-export for backwards compatibility
__all__ = [
    "DOMAIN",
    "VERSION",
    "AutomationPauseConfigEntry",
    "AutomationPauseData",
]


async def async_setup_entry(hass: HomeAssistant, entry: AutomationPauseConfigEntry) -> bool:
    """Set up AutoSnooze from a config entry."""
    store = Store[dict[str, Any]](hass, STORAGE_VERSION, f"{DOMAIN}.storage")
    data = AutomationPauseData(store=store)
    entry.runtime_data = data

    # Register static path to serve the JS file (required for both methods)
    await _async_register_static_path(hass)

    # Register as Lovelace resource ONLY (like HACS cards do)
    # This is how working HACS cards register - they don't use add_extra_js_url
    # Using add_extra_js_url was causing iOS refresh issues
    if hass.is_running:
        await _async_register_lovelace_resource(hass)
    else:

        async def _register_when_started(_event: Any) -> None:
            await _async_register_lovelace_resource(hass)

        hass.bus.async_listen_once("homeassistant_started", _register_when_started)

    # FR-07: Persistence - Load stored data on restart
    await async_load_stored(hass, data)

    # Register services
    register_services(hass, data)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def _async_register_static_path(hass: HomeAssistant) -> None:
    """Register static path to serve the JS file.

    cache_headers=False prevents iOS WebView from caching the file for 31 days.
    """
    try:
        await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(CARD_PATH), cache_headers=False)])
        _LOGGER.debug("Registered static path: %s", CARD_URL)
    except RuntimeError:
        # Path already registered (happens on integration reload)
        pass


async def _async_register_lovelace_resource(hass: HomeAssistant) -> None:
    """Register the card as a Lovelace resource.

    Following HACS pattern: use namespace prefix to identify OUR resources only.
    See: https://github.com/hacs/integration/pull/4402
    """
    lovelace_data = hass.data.get("lovelace")
    if lovelace_data is None:
        _LOGGER.debug("No lovelace data found in hass.data")
        return

    # Version-aware resource access (HA 2025.2.0+ uses attribute, older uses dict)
    # See: https://github.com/hacs/integration/pull/4402
    resources = getattr(lovelace_data, "resources", None)
    if resources is None:
        # Fallback for older HA versions
        resources = lovelace_data.get("resources") if hasattr(lovelace_data, "get") else None
    if resources is None:
        _LOGGER.debug("Lovelace resources not available (YAML mode?)")
        return

    # Namespace: our base URL without query params (like HACS does)
    # This ensures we ONLY match and modify OUR resource, never others
    namespace = CARD_URL  # "/autosnooze-card.js"

    # Find existing autosnooze resource by checking if URL starts with our namespace
    existing_resource = None
    for resource in resources.async_items():
        url = resource.get("url", "")
        # Match: /autosnooze-card.js or /autosnooze-card.js?v=X.X.X
        if url.startswith(namespace):
            existing_resource = resource
            break

    if existing_resource:
        # Only update if version changed - and only update OUR resource
        if existing_resource.get("url") != CARD_URL_VERSIONED:
            try:
                await resources.async_update_item(
                    existing_resource["id"],
                    {"url": CARD_URL_VERSIONED, "res_type": "module"},
                )
                _LOGGER.info("Updated AutoSnooze card resource to v%s", VERSION)
            except Exception as err:
                _LOGGER.warning("Failed to update Lovelace resource: %s", err)
        else:
            _LOGGER.debug("AutoSnooze card already registered with current version")
        return

    # No existing resource found - create new one
    try:
        _LOGGER.debug("Creating new resource: %s", CARD_URL_VERSIONED)
        await resources.async_create_item({"url": CARD_URL_VERSIONED, "res_type": "module"})
        _LOGGER.info("Registered AutoSnooze card as Lovelace resource (v%s)", VERSION)
    except Exception as err:
        _LOGGER.warning("Failed to register Lovelace resource: %s", err)


async def async_unload_entry(hass: HomeAssistant, entry: AutomationPauseConfigEntry) -> bool:
    """Unload config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        # Cancel all timers
        data = entry.runtime_data
        for unsub in data.timers.values():
            unsub()
        data.timers.clear()

        # Cancel all scheduled timers
        for unsub in data.scheduled_timers.values():
            unsub()
        data.scheduled_timers.clear()

        # Clear all listeners to prevent orphaned callbacks
        data.listeners.clear()

        # Only remove services if this is the last entry
        if not hass.config_entries.async_loaded_entries(DOMAIN):
            for service in (
                "pause",
                "cancel",
                "cancel_all",
                "pause_by_area",
                "pause_by_label",
                "cancel_scheduled",
            ):
                hass.services.async_remove(DOMAIN, service)

    return unload_ok
