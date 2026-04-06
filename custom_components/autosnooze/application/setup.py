"""Integration setup flow for AutoSnooze."""

from __future__ import annotations

from typing import Any


async def async_setup_integration_entry(
    hass: Any,
    entry: Any,
    *,
    register_static_path,
    register_lovelace_resource,
    ensure_labels_exist,
    load_stored,
    register_services,
    storage_factory,
    platforms,
    update_listener,
    data_factory,
) -> bool:
    """Set up the integration entry using injected collaborators."""
    store = storage_factory()
    data = data_factory(store, hass)
    entry.runtime_data = data

    await register_static_path(hass)

    if hass.is_running:
        await register_lovelace_resource(hass)
        await ensure_labels_exist(hass)
        await load_stored(hass, data)
    else:

        async def _register_when_started(_event: Any) -> None:
            if data.unloaded:
                return
            await register_lovelace_resource(hass)
            await ensure_labels_exist(hass)
            await load_stored(hass, data)

        data.startup_listener_unsub = hass.bus.async_listen_once("homeassistant_started", _register_when_started)

    register_services(hass, data)
    await hass.config_entries.async_forward_entry_setups(entry, platforms)
    entry.async_on_unload(entry.add_update_listener(update_listener))
    return True
