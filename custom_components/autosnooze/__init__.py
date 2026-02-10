"""AutoSnooze integration - Temporarily pause Home Assistant automations."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.helpers import label_registry as lr
from homeassistant.helpers.storage import Store

from .const import (
    CARD_PATH,
    CARD_URL,
    CARD_URL_VERSIONED,
    DOMAIN,
    LABEL_CONFIRM_CONFIG,
    LABEL_EXCLUDE_CONFIG,
    LABEL_INCLUDE_CONFIG,
    PLATFORMS,
    STORAGE_VERSION,
    VERSION,
)
from .coordinator import async_load_stored
from .models import AutomationPauseConfigEntry, AutomationPauseData
from .services import register_services

_LOGGER = logging.getLogger(__name__)

# Retry configuration for Lovelace resource registration
# Lovelace may not be fully initialized when homeassistant_started fires
LOVELACE_REGISTER_MAX_RETRIES = 3
LOVELACE_REGISTER_RETRY_DELAY = 2  # seconds


async def _async_retry_or_fail(
    retry_count: int,
    condition_name: str,
    log_context: str = "",
) -> bool:
    """Handle retry logic for Lovelace registration.

    Returns True if should retry, False if retries exhausted.
    """
    if retry_count < LOVELACE_REGISTER_MAX_RETRIES:
        context = f" ({log_context})" if log_context else ""
        _LOGGER.debug(
            "%s%s, retrying in %ds (attempt %d/%d)",
            condition_name,
            context,
            LOVELACE_REGISTER_RETRY_DELAY,
            retry_count + 1,
            LOVELACE_REGISTER_MAX_RETRIES,
        )
        await asyncio.sleep(LOVELACE_REGISTER_RETRY_DELAY)
        return True
    return False


# Re-export for backwards compatibility
__all__ = [
    "DOMAIN",
    "VERSION",
    "AutomationPauseConfigEntry",
    "AutomationPauseData",
]


async def _async_ensure_labels_exist(hass: HomeAssistant) -> None:
    """Ensure AutoSnooze filter labels exist in the label registry.

    Creates autosnooze_include, autosnooze_exclude, and autosnooze_confirm
    labels if they don't already exist.

    This is idempotent - if labels already exist, they are not modified.
    """
    label_reg = lr.async_get(hass)

    for config in [LABEL_INCLUDE_CONFIG, LABEL_EXCLUDE_CONFIG, LABEL_CONFIRM_CONFIG]:
        try:
            label_reg.async_create(
                name=config["name"],
                color=config.get("color"),
                icon=config.get("icon"),
                description=config.get("description"),
            )
            _LOGGER.info("Created label '%s' for AutoSnooze filtering", config["name"])

        except ValueError:
            # Label already exists
            _LOGGER.debug("Label '%s' already exists", config["name"])
        except Exception as err:
            _LOGGER.warning("Failed to create label '%s': %s", config["name"], err)


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
    # FR-07: Persistence - Load stored data on restart
    # IMPORTANT: Must wait for HA to be fully started before loading stored data,
    # otherwise automation entities may not exist yet and will be incorrectly
    # cleaned up as "deleted". This matches the pattern used for Lovelace registration.
    if hass.is_running:
        await _async_register_lovelace_resource(hass)
        await _async_ensure_labels_exist(hass)
        await async_load_stored(hass, data)
    else:

        async def _register_when_started(_event: Any) -> None:
            # Check if we were unloaded before HA fully started
            if data.unloaded:
                return
            await _async_register_lovelace_resource(hass)
            await _async_ensure_labels_exist(hass)
            await async_load_stored(hass, data)

        # Store the unsub function so we can cancel on early unload
        data.startup_listener_unsub = hass.bus.async_listen_once("homeassistant_started", _register_when_started)

    # Register services
    register_services(hass, data)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    entry.async_on_unload(entry.add_update_listener(_async_options_update_listener))
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


async def _async_register_lovelace_resource(
    hass: HomeAssistant,
    retry_count: int = 0,
) -> None:
    """Register the card as a Lovelace resource.

    Following HACS pattern: use namespace prefix to identify OUR resources only.
    See: https://github.com/hacs/integration/pull/4402

    Includes retry logic because Lovelace may not be fully initialized when
    homeassistant_started fires. This is the root cause of "Custom element
    doesn't exist" errors - the resource registration silently fails.
    """
    lovelace_data = hass.data.get("lovelace")
    if lovelace_data is None:
        # Lovelace not initialized yet - retry if we haven't exhausted retries
        if await _async_retry_or_fail(retry_count, "Lovelace not initialized yet"):
            return await _async_register_lovelace_resource(hass, retry_count + 1)

        _LOGGER.warning(
            "Could not auto-register card: Lovelace not initialized after %d retries. "
            "Add resource manually: Settings → Dashboards → Resources → /autosnooze-card.js (module)",
            LOVELACE_REGISTER_MAX_RETRIES,
        )
        return

    # Log Lovelace mode for debugging (helps identify auto-gen vs storage vs yaml)
    lovelace_mode = getattr(lovelace_data, "mode", None)
    if lovelace_mode is None and hasattr(lovelace_data, "get"):
        lovelace_mode = lovelace_data.get("mode")
    _LOGGER.debug("Lovelace mode detected: %s", lovelace_mode)

    # Version-aware resource access (HA 2025.2.0+ uses attribute, older uses dict)
    # See: https://github.com/hacs/integration/pull/4402
    resources = getattr(lovelace_data, "resources", None)
    if resources is None:
        # Fallback for older HA versions
        resources = lovelace_data.get("resources") if hasattr(lovelace_data, "get") else None

    # In YAML mode, resources is None. In storage/auto-gen mode, it should exist.
    # See: https://github.com/hacs/integration/issues/1659
    if resources is None:
        # Resources not available - could be YAML mode or not yet loaded
        # Retry if we haven't exhausted retries (resources may load after lovelace_data)
        if await _async_retry_or_fail(retry_count, "Lovelace resources not available yet", f"mode={lovelace_mode}"):
            return await _async_register_lovelace_resource(hass, retry_count + 1)

        _LOGGER.warning(
            "Could not auto-register card: Lovelace in YAML mode (mode=%s). "
            "Add to configuration.yaml: lovelace: resources: [{url: /autosnooze-card.js, type: module}]",
            lovelace_mode,
        )
        return

    # Verify resources has the expected interface
    if not hasattr(resources, "async_create_item") or not hasattr(resources, "async_items"):
        _LOGGER.warning(
            "Could not auto-register card: Lovelace resources API not available (mode=%s). "
            "Add resource manually: Settings → Dashboards → Resources → /autosnooze-card.js (module)",
            lovelace_mode,
        )
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


async def _async_options_update_listener(hass: HomeAssistant, entry: AutomationPauseConfigEntry) -> None:
    """Reload integration when options change."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: AutomationPauseConfigEntry) -> bool:
    """Unload config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        data = entry.runtime_data

        # Mark as unloaded first to prevent timer callbacks from running
        data.unloaded = True

        # Cancel startup listener if HA hasn't fully started yet
        if data.startup_listener_unsub is not None:
            data.startup_listener_unsub()
            data.startup_listener_unsub = None

        # Cancel all timers
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
        # Note: During unload, our entry is still LOADED until this function returns,
        # so we check for <= 1 (only our entry remains in the loaded list)
        if len(hass.config_entries.async_loaded_entries(DOMAIN)) <= 1:
            for service in (
                "pause",
                "cancel",
                "cancel_all",
                "pause_by_area",
                "pause_by_label",
                "cancel_scheduled",
                "adjust",
            ):
                hass.services.async_remove(DOMAIN, service)

    return unload_ok
