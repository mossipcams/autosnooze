"""Tests for extracted integration setup flow."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_application_setup_initializes_runtime_and_services() -> None:
    """Setup helper wires runtime data, services, and platform forwarding."""
    from custom_components.autosnooze.application.setup import async_setup_integration_entry
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    hass.is_running = True
    hass.config_entries.async_forward_entry_setups = AsyncMock()
    entry = MagicMock()
    entry.add_update_listener = MagicMock(return_value=MagicMock())
    entry.async_on_unload = MagicMock()
    register_static_path = AsyncMock()
    register_lovelace_resource = AsyncMock()
    ensure_labels_exist = AsyncMock()
    load_stored = AsyncMock()
    register_services = MagicMock()
    store = MagicMock()
    data = AutomationPauseData(store=store, hass=hass)
    storage_factory = MagicMock(return_value=store)
    data_factory = MagicMock(return_value=data)
    update_listener = AsyncMock()

    result = await async_setup_integration_entry(
        hass,
        entry,
        register_static_path=register_static_path,
        register_lovelace_resource=register_lovelace_resource,
        ensure_labels_exist=ensure_labels_exist,
        load_stored=load_stored,
        register_services=register_services,
        storage_factory=storage_factory,
        platforms=["sensor"],
        update_listener=update_listener,
        data_factory=data_factory,
    )

    assert result is True
    storage_factory.assert_called_once_with()
    data_factory.assert_called_once_with(store, hass)
    assert entry.runtime_data is data
    register_static_path.assert_awaited_once_with(hass)
    register_lovelace_resource.assert_awaited_once_with(hass)
    ensure_labels_exist.assert_awaited_once_with(hass)
    load_stored.assert_awaited_once_with(hass, data)
    register_services.assert_called_once_with(hass, data)
    hass.config_entries.async_forward_entry_setups.assert_awaited_once_with(entry, ["sensor"])
    entry.add_update_listener.assert_called_once_with(update_listener)
    entry.async_on_unload.assert_called_once_with(entry.add_update_listener.return_value)


@pytest.mark.asyncio
async def test_application_setup_defers_startup_work_until_home_assistant_started() -> None:
    """Setup helper registers startup work when Home Assistant is not running yet."""
    from custom_components.autosnooze.application.setup import async_setup_integration_entry
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    hass.is_running = False
    hass.config_entries.async_forward_entry_setups = AsyncMock()
    hass.bus.async_listen_once = MagicMock(return_value=MagicMock())
    entry = MagicMock()
    entry.add_update_listener = MagicMock(return_value=MagicMock())
    entry.async_on_unload = MagicMock()
    register_lovelace_resource = AsyncMock()
    ensure_labels_exist = AsyncMock()
    load_stored = AsyncMock()
    store = MagicMock()
    data = AutomationPauseData(store=store, hass=hass)

    await async_setup_integration_entry(
        hass,
        entry,
        register_static_path=AsyncMock(),
        register_lovelace_resource=register_lovelace_resource,
        ensure_labels_exist=ensure_labels_exist,
        load_stored=load_stored,
        register_services=MagicMock(),
        storage_factory=MagicMock(return_value=store),
        platforms=["sensor"],
        update_listener=AsyncMock(),
        data_factory=MagicMock(return_value=data),
    )

    hass.bus.async_listen_once.assert_called_once()
    event_name, callback = hass.bus.async_listen_once.call_args.args
    assert event_name == "homeassistant_started"
    assert data.startup_listener_unsub is hass.bus.async_listen_once.return_value
    register_lovelace_resource.assert_not_awaited()
    ensure_labels_exist.assert_not_awaited()
    load_stored.assert_not_awaited()

    await callback(MagicMock())

    register_lovelace_resource.assert_awaited_once_with(hass)
    ensure_labels_exist.assert_awaited_once_with(hass)
    load_stored.assert_awaited_once_with(hass, data)


@pytest.mark.asyncio
async def test_application_setup_startup_callback_noops_after_unload() -> None:
    """Deferred startup work exits if the integration unloaded before startup."""
    from custom_components.autosnooze.application.setup import async_setup_integration_entry
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    hass.is_running = False
    hass.config_entries.async_forward_entry_setups = AsyncMock()
    hass.bus.async_listen_once = MagicMock(return_value=MagicMock())
    entry = MagicMock()
    entry.add_update_listener = MagicMock(return_value=MagicMock())
    entry.async_on_unload = MagicMock()
    register_lovelace_resource = AsyncMock()
    ensure_labels_exist = AsyncMock()
    load_stored = AsyncMock()
    data = AutomationPauseData(store=MagicMock(), hass=hass, unloaded=True)

    await async_setup_integration_entry(
        hass,
        entry,
        register_static_path=AsyncMock(),
        register_lovelace_resource=register_lovelace_resource,
        ensure_labels_exist=ensure_labels_exist,
        load_stored=load_stored,
        register_services=MagicMock(),
        storage_factory=MagicMock(return_value=MagicMock()),
        platforms=["sensor"],
        update_listener=AsyncMock(),
        data_factory=MagicMock(return_value=data),
    )

    callback = hass.bus.async_listen_once.call_args.args[1]
    await callback(MagicMock())

    register_lovelace_resource.assert_not_awaited()
    ensure_labels_exist.assert_not_awaited()
    load_stored.assert_not_awaited()


@pytest.mark.asyncio
async def test_runtime_callbacks_are_scoped_per_entry() -> None:
    """Two config entries must not overwrite each other's timer callbacks."""
    from datetime import datetime, timezone

    from custom_components.autosnooze.application.runtime_wiring import wire_runtime_callbacks
    from custom_components.autosnooze.runtime.state import AutomationPauseData
    from custom_components.autosnooze.runtime.timers import schedule_resume

    first = AutomationPauseData(store=MagicMock())
    second = AutomationPauseData(store=MagicMock())
    wire_runtime_callbacks(first)
    wire_runtime_callbacks(second)

    first_calls: list[str] = []
    second_calls: list[str] = []

    async def first_callback(_hass, _data, entity_id, *, reason="manual"):
        first_calls.append(entity_id)

    async def second_callback(_hass, _data, entity_id, *, reason="manual"):
        second_calls.append(entity_id)

    first.resume_callback = first_callback
    second.resume_callback = second_callback

    await first.resume_callback(MagicMock(), first, "automation.one", reason="expired")
    await second.resume_callback(MagicMock(), second, "automation.two", reason="expired")

    assert first_calls == ["automation.one"]
    assert second_calls == ["automation.two"]


@pytest.mark.asyncio
async def test_restore_reconciliation_is_owned_by_application_layer() -> None:
    """Setup should delegate stored-state reconciliation to application restore."""
    from custom_components.autosnooze.application.restore import async_restore_stored
    from custom_components.autosnooze.application.setup import async_setup_integration_entry
    from custom_components.autosnooze.runtime.restore import validate_stored_data

    assert async_restore_stored.__module__ == "custom_components.autosnooze.application.restore"
    assert validate_stored_data.__module__ == "custom_components.autosnooze.runtime.restore"

    hass = MagicMock()
    hass.is_running = True
    hass.config_entries.async_forward_entry_setups = AsyncMock()
    entry = MagicMock()
    entry.add_update_listener = MagicMock(return_value=MagicMock())
    entry.async_on_unload = MagicMock()
    load_stored = AsyncMock()
    data = MagicMock()

    await async_setup_integration_entry(
        hass,
        entry,
        register_static_path=AsyncMock(),
        register_lovelace_resource=AsyncMock(),
        ensure_labels_exist=AsyncMock(),
        load_stored=load_stored,
        register_services=MagicMock(),
        storage_factory=MagicMock(return_value=MagicMock()),
        platforms=["sensor"],
        update_listener=AsyncMock(),
        data_factory=MagicMock(return_value=data),
    )

    load_stored.assert_awaited_once_with(hass, data)
