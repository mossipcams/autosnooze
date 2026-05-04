"""Tests for extracted integration setup flow."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

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

    await async_setup_integration_entry(
        hass,
        entry,
        register_static_path=AsyncMock(),
        register_lovelace_resource=AsyncMock(),
        ensure_labels_exist=AsyncMock(),
        load_stored=AsyncMock(),
        register_services=MagicMock(),
        storage_factory=lambda: MagicMock(),
        platforms=["sensor"],
        update_listener=AsyncMock(),
        data_factory=lambda store, hass: AutomationPauseData(store=store, hass=hass),
    )

    assert isinstance(entry.runtime_data, AutomationPauseData)
    hass.config_entries.async_forward_entry_setups.assert_awaited_once_with(entry, ["sensor"])
