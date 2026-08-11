"""Integration setup flow for AutoSnooze."""

from __future__ import annotations

from typing import Any

from homeassistant.helpers.storage import Store

from ..infrastructure.telemetry import TELEMETRY_STORAGE_KEY, TELEMETRY_STORAGE_VERSION, TelemetryClient


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

    telemetry_store = Store(hass, TELEMETRY_STORAGE_VERSION, TELEMETRY_STORAGE_KEY)
    data.telemetry = TelemetryClient(hass, entry, telemetry_store)
    await data.telemetry.async_setup()

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

    if data.telemetry is not None and data.telemetry.is_enabled():
        data.telemetry.track("integration_active", {}, source="startup")

    return True
