"""AutoSnooze integration - Temporarily pause Home Assistant automations."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import label_registry as lr
from homeassistant.helpers.storage import Store

from .application.setup import async_setup_integration_entry
from .application.notifications import notify_started, send_pre_resume_notification
from .application.resume import async_resume
from .application.scheduled import async_execute_scheduled_disable
from .const import (
    DOMAIN,
    LABEL_CONFIRM_CONFIG,
    LABEL_EXCLUDE_CONFIG,
    LABEL_INCLUDE_CONFIG,
    PLATFORMS,
    STORAGE_VERSION,
    VERSION,
)
from .infrastructure import frontend as _frontend_resource_adapter
from .infrastructure.frontend import (
    LOVELACE_REGISTER_MAX_RETRIES,
    LOVELACE_REGISTER_RETRY_DELAY,
    _async_register_lovelace_resource,
    _async_register_static_path,
    _async_retry_or_fail,
)
from .runtime.state import AutomationPauseConfigEntry, AutomationPauseData
from .runtime import ports as runtime_ports
from .runtime.restore import RestoreCallbacks, async_load_stored as runtime_async_load_stored
from .services import register_services, unregister_services

_LOGGER = logging.getLogger(__name__)
asyncio = _frontend_resource_adapter.asyncio


async def async_load_stored(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Restore runtime state with explicitly composed application callbacks."""
    await runtime_async_load_stored(
        hass,
        data,
        RestoreCallbacks(
            set_automation_state=runtime_ports.async_set_automation_state,
            schedule_resume=lambda hass, data, entity_id, resume_at: runtime_ports.schedule_resume(
                hass, data, entity_id, resume_at, resume_callback=async_resume
            ),
            schedule_disable=lambda hass, data, entity_id, scheduled: runtime_ports.schedule_disable(
                hass, data, entity_id, scheduled, disable_callback=async_execute_scheduled_disable
            ),
            schedule_pre_resume_notification=lambda hass, data, paused: runtime_ports.schedule_pre_resume_notification(
                hass, data, paused, notification_callback=send_pre_resume_notification
            ),
            notify_started=notify_started,
        ),
    )


# Re-export for backwards compatibility
__all__ = [
    "DOMAIN",
    "VERSION",
    "AutomationPauseConfigEntry",
    "AutomationPauseData",
    "LOVELACE_REGISTER_MAX_RETRIES",
    "LOVELACE_REGISTER_RETRY_DELAY",
    "_async_register_lovelace_resource",
    "_async_register_static_path",
    "_async_retry_or_fail",
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
    return await async_setup_integration_entry(
        hass,
        entry,
        register_static_path=_async_register_static_path,
        register_lovelace_resource=_async_register_lovelace_resource,
        ensure_labels_exist=_async_ensure_labels_exist,
        load_stored=async_load_stored,
        register_services=register_services,
        storage_factory=lambda: Store[dict[str, Any]](hass, STORAGE_VERSION, f"{DOMAIN}.storage"),
        platforms=PLATFORMS,
        update_listener=_async_options_update_listener,
        data_factory=lambda store, runtime_hass: AutomationPauseData(store=store, hass=runtime_hass),
    )


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

        # Cancel all pre-resume notification timers
        for unsub in data.notification_timers.values():
            unsub()
        data.notification_timers.clear()

        # Clear all listeners to prevent orphaned callbacks
        data.listeners.clear()

        # Only remove services if this is the last entry
        # Note: During unload, our entry is still LOADED until this function returns,
        # so we check for <= 1 (only our entry remains in the loaded list)
        if len(hass.config_entries.async_loaded_entries(DOMAIN)) <= 1:
            unregister_services(hass)

    return unload_ok
