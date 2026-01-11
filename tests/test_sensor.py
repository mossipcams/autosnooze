"""Tests for sensor.py mutations.

These tests target surviving mutants from mutation testing,
focusing on business logic and entity configuration.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceEntryType

from custom_components.autosnooze import DOMAIN
from custom_components.autosnooze.const import VERSION
from custom_components.autosnooze.sensor import AutoSnoozeCountSensor


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for all tests."""
    yield


@pytest.fixture(autouse=True)
async def mock_dependencies(hass: HomeAssistant):
    """Mock dependencies required by AutoSnooze for all tests."""
    mock_resources = MagicMock()
    mock_resources.async_items.return_value = []
    mock_resources.async_create_item = AsyncMock()
    mock_resources.async_update_item = AsyncMock()
    mock_lovelace = MagicMock()
    mock_lovelace.resources = mock_resources
    hass.data["lovelace"] = mock_lovelace

    if not hasattr(hass, "http") or hass.http is None:
        hass.http = MagicMock()
    hass.http.async_register_static_paths = AsyncMock()

    for dep in ["frontend", "http", "lovelace", "automation"]:
        hass.config.components.add(dep)

    async def mock_automation_service(call):
        pass

    hass.services.async_register("automation", "turn_on", mock_automation_service)
    hass.services.async_register("automation", "turn_off", mock_automation_service)
    hass.services.async_register("automation", "toggle", mock_automation_service)

    yield


@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    """Create a mock config entry."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="AutoSnooze",
        data={},
        unique_id=DOMAIN,
        version=1,
    )


@pytest.fixture
async def setup_integration(hass: HomeAssistant, mock_config_entry: MockConfigEntry):
    """Set up the AutoSnooze integration."""
    mock_config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    return hass.config_entries.async_get_entry(mock_config_entry.entry_id)


# =============================================================================
# Listener Registration Tests (Business Logic - Priority)
# =============================================================================


class TestListenerRegistration:
    """Tests for sensor listener registration.

    These tests kill mutants:
    - async_added_to_hass__mutmut_1: self._unsub = None (instead of add_listener result)
    - async_added_to_hass__mutmut_2: add_listener(None) (instead of update callback)
    """

    async def test_sensor_registers_listener_on_add_to_hass(
        self, hass: HomeAssistant, setup_integration
    ):
        """Verify sensor registers a listener when added to hass.

        Kills mutant: async_added_to_hass__mutmut_1
        The listener must be stored in _unsub, not set to None.
        """
        entry = setup_integration
        coordinator = entry.runtime_data

        # Track listener registration
        registered_listeners = []
        original_add_listener = coordinator.add_listener

        def tracking_add_listener(callback):
            registered_listeners.append(callback)
            return original_add_listener(callback)

        coordinator.add_listener = tracking_add_listener

        # Create and add sensor to hass
        sensor = AutoSnoozeCountSensor(entry)
        sensor.hass = hass

        await sensor.async_added_to_hass()

        # Verify listener was registered
        assert len(registered_listeners) == 1
        # Verify _unsub is callable (not None)
        assert sensor._unsub is not None
        assert callable(sensor._unsub)

    async def test_sensor_listener_callback_updates_state(
        self, hass: HomeAssistant, setup_integration
    ):
        """Verify the listener callback actually triggers state updates.

        Kills mutant: async_added_to_hass__mutmut_2
        The callback must call async_write_ha_state, not be None.
        """
        entry = setup_integration
        coordinator = entry.runtime_data

        # Create sensor and mock async_write_ha_state BEFORE adding to hass
        # so the callback closure captures the mock
        sensor = AutoSnoozeCountSensor(entry)
        sensor.hass = hass
        mock_write_state = MagicMock()
        sensor.async_write_ha_state = mock_write_state

        # Count listeners before adding our sensor
        listeners_before = len(coordinator.listeners)

        await sensor.async_added_to_hass()

        # Verify a new listener was added
        assert len(coordinator.listeners) == listeners_before + 1

        # Call the newly added listener (last one)
        coordinator.listeners[-1]()

        # Verify the state was written
        mock_write_state.assert_called_once()

    async def test_sensor_unsubscribes_on_remove_from_hass(
        self, hass: HomeAssistant, setup_integration
    ):
        """Verify sensor unsubscribes when removed from hass."""
        entry = setup_integration

        sensor = AutoSnoozeCountSensor(entry)
        sensor.hass = hass

        await sensor.async_added_to_hass()
        unsub_func = sensor._unsub
        assert unsub_func is not None

        await sensor.async_will_remove_from_hass()

        # Verify _unsub is set to None after removal
        assert sensor._unsub is None


# =============================================================================
# DeviceInfo Tests (Formatting but important for integration)
# =============================================================================


class TestDeviceInfo:
    """Tests for sensor DeviceInfo configuration.

    These tests kill mutants that modify DeviceInfo properties:
    - __init____mutmut_5, 9, 13, 14: name mutations
    - __init____mutmut_6, 10: entry_type mutations
    - __init____mutmut_7, 11: sw_version mutations
    """

    async def test_device_info_name_is_autosnooze(
        self, hass: HomeAssistant, setup_integration
    ):
        """Verify device name is exactly 'AutoSnooze'.

        Kills mutants: __init____mutmut_5, 9, 13, 14
        """
        entry = setup_integration
        sensor = AutoSnoozeCountSensor(entry)

        assert sensor._attr_device_info is not None
        assert sensor._attr_device_info["name"] == "AutoSnooze"

    async def test_device_info_entry_type_is_service(
        self, hass: HomeAssistant, setup_integration
    ):
        """Verify device entry_type is SERVICE.

        Kills mutants: __init____mutmut_6, 10
        """
        entry = setup_integration
        sensor = AutoSnoozeCountSensor(entry)

        assert sensor._attr_device_info is not None
        assert sensor._attr_device_info["entry_type"] == DeviceEntryType.SERVICE

    async def test_device_info_sw_version_matches_const(
        self, hass: HomeAssistant, setup_integration
    ):
        """Verify device sw_version matches VERSION constant.

        Kills mutants: __init____mutmut_7, 11
        """
        entry = setup_integration
        sensor = AutoSnoozeCountSensor(entry)

        assert sensor._attr_device_info is not None
        assert sensor._attr_device_info["sw_version"] == VERSION
        # Also verify VERSION is not None
        assert VERSION is not None


# =============================================================================
# Initialization Tests
# =============================================================================


class TestSensorInitialization:
    """Tests for sensor initialization.

    Kills mutant: __init____mutmut_15 (self._unsub = "" instead of None)
    """

    async def test_unsub_initialized_to_none(
        self, hass: HomeAssistant, setup_integration
    ):
        """Verify _unsub is initialized to None, not an empty string."""
        entry = setup_integration
        sensor = AutoSnoozeCountSensor(entry)

        # _unsub should be None, not ""
        assert sensor._unsub is None
        # Extra check: it should not be truthy (empty string is falsy but not None)
        assert sensor._unsub != ""

    async def test_unique_id_format(
        self, hass: HomeAssistant, setup_integration
    ):
        """Verify unique_id is properly formatted."""
        entry = setup_integration
        sensor = AutoSnoozeCountSensor(entry)

        assert sensor._attr_unique_id == f"{entry.entry_id}_snoozed_count"

    async def test_device_identifiers_contain_domain_and_entry_id(
        self, hass: HomeAssistant, setup_integration
    ):
        """Verify device identifiers are properly set."""
        entry = setup_integration
        sensor = AutoSnoozeCountSensor(entry)

        assert sensor._attr_device_info is not None
        identifiers = sensor._attr_device_info["identifiers"]
        assert (DOMAIN, entry.entry_id) in identifiers
