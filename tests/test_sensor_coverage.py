"""Additional tests for sensor.py to improve coverage.

These tests focus on the sensor platform and AutoSnoozeCountSensor class.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, AsyncMock

import pytest

from custom_components.autosnooze.models import (
    AutomationPauseData,
    PausedAutomation,
    ScheduledSnooze,
)
from custom_components.autosnooze.sensor import AutoSnoozeCountSensor

UTC = timezone.utc


class MockConfigEntry:
    """Mock ConfigEntry for testing."""

    def __init__(self, runtime_data: AutomationPauseData, entry_id: str = "test_entry_id"):
        self.entry_id = entry_id
        self.runtime_data = runtime_data


class TestAutoSnoozeCountSensor:
    """Tests for AutoSnoozeCountSensor class."""

    @pytest.fixture
    def data(self) -> AutomationPauseData:
        """Create test data."""
        return AutomationPauseData()

    @pytest.fixture
    def entry(self, data: AutomationPauseData) -> MockConfigEntry:
        """Create mock config entry."""
        return MockConfigEntry(runtime_data=data)

    @pytest.fixture
    def sensor(self, entry: MockConfigEntry) -> AutoSnoozeCountSensor:
        """Create sensor instance."""
        return AutoSnoozeCountSensor(entry)

    def test_sensor_initialization(self, sensor: AutoSnoozeCountSensor, entry: MockConfigEntry) -> None:
        """Test sensor is initialized correctly."""
        assert sensor._entry == entry
        assert sensor._attr_unique_id == f"{entry.entry_id}_snoozed_count"
        assert sensor._attr_has_entity_name is True
        assert sensor._attr_translation_key == "snoozed_count"
        assert sensor._attr_icon == "mdi:sleep"

    def test_sensor_device_info(self, sensor: AutoSnoozeCountSensor) -> None:
        """Test sensor device info."""
        device_info = sensor._attr_device_info
        assert device_info is not None
        assert "identifiers" in device_info
        assert "name" in device_info
        assert device_info["name"] == "AutoSnooze"

    def test_native_value_returns_zero_when_empty(
        self, sensor: AutoSnoozeCountSensor, data: AutomationPauseData
    ) -> None:
        """Test that native_value returns 0 when no paused automations."""
        assert sensor.native_value == 0

    def test_native_value_returns_count(self, sensor: AutoSnoozeCountSensor, data: AutomationPauseData) -> None:
        """Test that native_value returns count of paused automations."""
        now = datetime.now(UTC)
        data.paused["automation.test1"] = PausedAutomation(
            entity_id="automation.test1",
            friendly_name="Test 1",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )
        data.paused["automation.test2"] = PausedAutomation(
            entity_id="automation.test2",
            friendly_name="Test 2",
            resume_at=now + timedelta(hours=2),
            paused_at=now,
        )

        assert sensor.native_value == 2

    def test_extra_state_attributes_empty(self, sensor: AutoSnoozeCountSensor, data: AutomationPauseData) -> None:
        """Test extra_state_attributes when no data."""
        attrs = sensor.extra_state_attributes

        assert "paused_automations" in attrs
        assert "scheduled_snoozes" in attrs
        assert attrs["paused_automations"] == {}
        assert attrs["scheduled_snoozes"] == {}

    def test_extra_state_attributes_with_data(self, sensor: AutoSnoozeCountSensor, data: AutomationPauseData) -> None:
        """Test extra_state_attributes with paused and scheduled data."""
        now = datetime.now(UTC)
        data.paused["automation.test1"] = PausedAutomation(
            entity_id="automation.test1",
            friendly_name="Test 1",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )
        data.scheduled["automation.test2"] = ScheduledSnooze(
            entity_id="automation.test2",
            friendly_name="Test 2",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        attrs = sensor.extra_state_attributes

        assert "automation.test1" in attrs["paused_automations"]
        assert "automation.test2" in attrs["scheduled_snoozes"]
        assert attrs["paused_automations"]["automation.test1"]["friendly_name"] == "Test 1"
        assert attrs["scheduled_snoozes"]["automation.test2"]["friendly_name"] == "Test 2"

    @pytest.mark.asyncio
    async def test_async_added_to_hass_registers_listener(
        self, sensor: AutoSnoozeCountSensor, data: AutomationPauseData
    ) -> None:
        """Test that async_added_to_hass registers a listener."""
        # Mock the async_write_ha_state method
        sensor.async_write_ha_state = MagicMock()

        await sensor.async_added_to_hass()

        # Listener should be registered
        assert sensor._unsub is not None
        assert len(data.listeners) == 1

        # Triggering notify should call async_write_ha_state
        data.notify()
        sensor.async_write_ha_state.assert_called_once()

    @pytest.mark.asyncio
    async def test_async_will_remove_from_hass_removes_listener(
        self, sensor: AutoSnoozeCountSensor, data: AutomationPauseData
    ) -> None:
        """Test that async_will_remove_from_hass removes the listener."""
        sensor.async_write_ha_state = MagicMock()

        await sensor.async_added_to_hass()
        assert len(data.listeners) == 1
        assert sensor._unsub is not None

        await sensor.async_will_remove_from_hass()

        assert sensor._unsub is None
        assert len(data.listeners) == 0

    @pytest.mark.asyncio
    async def test_async_will_remove_from_hass_handles_no_listener(self, sensor: AutoSnoozeCountSensor) -> None:
        """Test that async_will_remove_from_hass handles case when no listener registered."""
        assert sensor._unsub is None

        # Should not raise
        await sensor.async_will_remove_from_hass()

        assert sensor._unsub is None

    def test_native_value_updates_after_pause(self, sensor: AutoSnoozeCountSensor, data: AutomationPauseData) -> None:
        """Test that native_value reflects changes to paused dict."""
        now = datetime.now(UTC)

        assert sensor.native_value == 0

        data.paused["automation.test1"] = PausedAutomation(
            entity_id="automation.test1",
            friendly_name="Test 1",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )

        assert sensor.native_value == 1

        data.paused["automation.test2"] = PausedAutomation(
            entity_id="automation.test2",
            friendly_name="Test 2",
            resume_at=now + timedelta(hours=2),
            paused_at=now,
        )

        assert sensor.native_value == 2

        del data.paused["automation.test1"]

        assert sensor.native_value == 1

        data.paused.clear()

        assert sensor.native_value == 0


class TestAsyncSetupEntry:
    """Tests for async_setup_entry function."""

    @pytest.mark.asyncio
    async def test_setup_entry_adds_sensor(self) -> None:
        """Test that async_setup_entry adds the sensor entity."""
        from custom_components.autosnooze.sensor import async_setup_entry

        mock_hass = MagicMock()
        data = AutomationPauseData()
        entry = MockConfigEntry(runtime_data=data)

        added_entities = []

        def mock_add_entities(entities):
            added_entities.extend(entities)

        await async_setup_entry(mock_hass, entry, mock_add_entities)

        assert len(added_entities) == 1
        assert isinstance(added_entities[0], AutoSnoozeCountSensor)
