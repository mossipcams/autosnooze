"""Integration tests for AutoSnooze using Home Assistant test fixtures.

These tests exercise the actual integration code paths using the
pytest-homeassistant-custom-component fixtures.
"""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.autosnooze import DOMAIN
from custom_components.autosnooze.const import VERSION


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for all tests."""
    yield


@pytest.fixture(autouse=True)
async def mock_dependencies(hass: HomeAssistant):
    """Mock dependencies required by AutoSnooze for all tests.

    This fixture runs automatically for every test to ensure the manifest
    dependencies (frontend, http, lovelace) are properly mocked.
    """
    # Mock the Lovelace resources
    mock_resources = MagicMock()
    mock_resources.async_items.return_value = []
    mock_resources.async_create_item = AsyncMock()
    mock_resources.async_update_item = AsyncMock()
    mock_lovelace = MagicMock()
    mock_lovelace.resources = mock_resources
    hass.data["lovelace"] = mock_lovelace

    # Mock HTTP
    if not hasattr(hass, "http") or hass.http is None:
        hass.http = MagicMock()
    hass.http.async_register_static_paths = AsyncMock()

    # Mark dependency integrations as loaded in hass.config.components
    # This tells HA these integrations are already set up
    for dep in ["frontend", "http", "lovelace"]:
        hass.config.components.add(dep)

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
    """Set up the AutoSnooze integration.

    Note: Dependencies (frontend, http, lovelace) are already mocked by the
    autouse mock_dependencies fixture.
    """
    mock_config_entry.add_to_hass(hass)

    # Set up the integration
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()

    # Return the actual entry from config_entries which has runtime_data set
    return hass.config_entries.async_get_entry(mock_config_entry.entry_id)


@pytest.fixture
async def setup_integration_with_automations(hass: HomeAssistant, setup_integration: ConfigEntry):
    """Set up integration with mock automations."""
    # Add mock automation states
    hass.states.async_set(
        "automation.test_automation_1",
        "on",
        {"friendly_name": "Test Automation 1"},
    )
    hass.states.async_set(
        "automation.test_automation_2",
        "on",
        {"friendly_name": "Test Automation 2"},
    )
    hass.states.async_set(
        "automation.test_automation_3",
        "on",
        {"friendly_name": "Test Automation 3"},
    )
    return setup_integration


# =============================================================================
# Config Flow Tests
# =============================================================================


class TestConfigFlow:
    """Test the config flow."""

    async def test_user_flow_shows_form(self, hass: HomeAssistant) -> None:
        """Test that user flow shows the form initially."""
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})

        assert result["type"] == "form"
        assert result["step_id"] == "user"

    async def test_user_flow_creates_entry(self, hass: HomeAssistant) -> None:
        """Test that submitting the form creates an entry."""
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})

        # Submit the form
        result = await hass.config_entries.flow.async_configure(result["flow_id"], user_input={})

        assert result["type"] == "create_entry"
        assert result["title"] == "AutoSnooze"
        assert result["data"] == {}

    async def test_user_flow_aborts_if_already_configured(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test that flow aborts if already configured."""
        # Try to set up again
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})

        assert result["type"] == "abort"
        assert result["reason"] == "already_configured"


# =============================================================================
# Sensor Tests
# =============================================================================


class TestSensor:
    """Test the sensor platform."""

    async def test_sensor_initial_state_is_zero(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that sensor starts at 0."""
        entry = setup_integration
        # Access runtime data to check initial state
        data = entry.runtime_data
        assert len(data.paused) == 0

    async def test_sensor_attributes_include_paused_automations(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test that sensor attributes include paused automations dict."""
        entry = setup_integration
        data = entry.runtime_data

        # Verify the data structure supports attributes
        assert hasattr(data, "get_paused_dict")
        assert hasattr(data, "get_scheduled_dict")
        assert data.get_paused_dict() == {}
        assert data.get_scheduled_dict() == {}


# =============================================================================
# Services Tests
# =============================================================================


class TestPauseService:
    """Test the pause service."""

    async def test_pause_service_is_registered(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that the pause service is registered."""
        assert hass.services.has_service(DOMAIN, "pause")

    async def test_pause_automation_with_duration(
        self, hass: HomeAssistant, setup_integration_with_automations
    ) -> None:
        """Test pausing an automation with duration."""
        entry = setup_integration_with_automations

        # Call the pause service
        await hass.services.async_call(
            DOMAIN,
            "pause",
            {
                ATTR_ENTITY_ID: ["automation.test_automation_1"],
                "hours": 1,
            },
            blocking=True,
        )

        # Check that the automation was added to paused
        data = entry.runtime_data
        assert "automation.test_automation_1" in data.paused

    async def test_pause_automation_with_zero_duration_raises(
        self, hass: HomeAssistant, setup_integration_with_automations: ConfigEntry
    ) -> None:
        """Test that zero duration raises ServiceValidationError."""
        with pytest.raises(ServiceValidationError) as exc_info:
            await hass.services.async_call(
                DOMAIN,
                "pause",
                {
                    ATTR_ENTITY_ID: ["automation.test_automation_1"],
                    "days": 0,
                    "hours": 0,
                    "minutes": 0,
                },
                blocking=True,
            )

        assert "duration" in str(exc_info.value).lower() or exc_info.value.translation_key == "invalid_duration"

    async def test_pause_non_automation_raises(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that pausing a non-automation entity raises error."""
        with pytest.raises(ServiceValidationError) as exc_info:
            await hass.services.async_call(
                DOMAIN,
                "pause",
                {
                    ATTR_ENTITY_ID: ["light.living_room"],
                    "hours": 1,
                },
                blocking=True,
            )

        assert exc_info.value.translation_key == "not_automation"

    async def test_pause_with_resume_at_in_past_raises(
        self, hass: HomeAssistant, setup_integration_with_automations: ConfigEntry
    ) -> None:
        """Test that resume_at in the past raises error."""
        past_time = dt_util.utcnow() - timedelta(hours=1)

        with pytest.raises(ServiceValidationError) as exc_info:
            await hass.services.async_call(
                DOMAIN,
                "pause",
                {
                    ATTR_ENTITY_ID: ["automation.test_automation_1"],
                    "resume_at": past_time.isoformat(),
                },
                blocking=True,
            )

        assert exc_info.value.translation_key == "resume_time_past"

    async def test_pause_with_disable_at_after_resume_at_raises(
        self, hass: HomeAssistant, setup_integration_with_automations: ConfigEntry
    ) -> None:
        """Test that disable_at after resume_at raises error."""
        now = dt_util.utcnow()
        disable_at = now + timedelta(hours=2)
        resume_at = now + timedelta(hours=1)

        with pytest.raises(ServiceValidationError) as exc_info:
            await hass.services.async_call(
                DOMAIN,
                "pause",
                {
                    ATTR_ENTITY_ID: ["automation.test_automation_1"],
                    "disable_at": disable_at.isoformat(),
                    "resume_at": resume_at.isoformat(),
                },
                blocking=True,
            )

        assert exc_info.value.translation_key == "disable_after_resume"


class TestCancelService:
    """Test the cancel service."""

    async def test_cancel_service_is_registered(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that the cancel service is registered."""
        assert hass.services.has_service(DOMAIN, "cancel")

    async def test_cancel_paused_automation(
        self, hass: HomeAssistant, setup_integration_with_automations: ConfigEntry
    ) -> None:
        """Test canceling a paused automation."""
        entry = setup_integration_with_automations
        data = entry.runtime_data

        # First pause an automation
        await hass.services.async_call(
            DOMAIN,
            "pause",
            {
                ATTR_ENTITY_ID: ["automation.test_automation_1"],
                "hours": 1,
            },
            blocking=True,
        )

        assert "automation.test_automation_1" in data.paused

        # Now cancel it
        await hass.services.async_call(
            DOMAIN,
            "cancel",
            {
                ATTR_ENTITY_ID: ["automation.test_automation_1"],
            },
            blocking=True,
        )

        # Should be removed from paused
        assert "automation.test_automation_1" not in data.paused


class TestCancelAllService:
    """Test the cancel_all service."""

    async def test_cancel_all_service_is_registered(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that the cancel_all service is registered."""
        assert hass.services.has_service(DOMAIN, "cancel_all")

    async def test_cancel_all_clears_all_paused(
        self, hass: HomeAssistant, setup_integration_with_automations: ConfigEntry
    ) -> None:
        """Test that cancel_all clears all paused automations."""
        entry = setup_integration_with_automations
        data = entry.runtime_data

        # Pause multiple automations
        await hass.services.async_call(
            DOMAIN,
            "pause",
            {
                ATTR_ENTITY_ID: [
                    "automation.test_automation_1",
                    "automation.test_automation_2",
                ],
                "hours": 1,
            },
            blocking=True,
        )

        assert len(data.paused) == 2

        # Cancel all
        await hass.services.async_call(
            DOMAIN,
            "cancel_all",
            {},
            blocking=True,
        )

        assert len(data.paused) == 0


class TestPauseByAreaService:
    """Test the pause_by_area service."""

    async def test_pause_by_area_service_is_registered(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test that the pause_by_area service is registered."""
        assert hass.services.has_service(DOMAIN, "pause_by_area")

    async def test_pause_by_area_finds_automations(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that pause_by_area finds automations in the area."""
        entry = setup_integration

        # Create entity registry entry with area
        entity_reg = er.async_get(hass)
        entity_reg.async_get_or_create(
            "automation",
            "test",
            "automation_in_area",
            suggested_object_id="test_area_automation",
        )
        entity_reg.async_update_entity(
            "automation.test_area_automation",
            area_id="living_room",
        )

        # Set state for the automation
        hass.states.async_set(
            "automation.test_area_automation",
            "on",
            {"friendly_name": "Test Area Automation"},
        )

        # Pause by area
        await hass.services.async_call(
            DOMAIN,
            "pause_by_area",
            {
                "area_id": "living_room",
                "hours": 1,
            },
            blocking=True,
        )

        data = entry.runtime_data
        assert "automation.test_area_automation" in data.paused


class TestPauseByLabelService:
    """Test the pause_by_label service."""

    async def test_pause_by_label_service_is_registered(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test that the pause_by_label service is registered."""
        assert hass.services.has_service(DOMAIN, "pause_by_label")

    async def test_pause_by_label_finds_automations(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that pause_by_label finds automations with the label."""
        entry = setup_integration

        # Create entity registry entry with label
        entity_reg = er.async_get(hass)
        entity_reg.async_get_or_create(
            "automation",
            "test",
            "automation_with_label",
            suggested_object_id="test_label_automation",
        )
        entity_reg.async_update_entity(
            "automation.test_label_automation",
            labels={"snooze_this"},
        )

        # Set state for the automation
        hass.states.async_set(
            "automation.test_label_automation",
            "on",
            {"friendly_name": "Test Label Automation"},
        )

        # Pause by label
        await hass.services.async_call(
            DOMAIN,
            "pause_by_label",
            {
                "label_id": "snooze_this",
                "hours": 1,
            },
            blocking=True,
        )

        data = entry.runtime_data
        assert "automation.test_label_automation" in data.paused


class TestCancelScheduledService:
    """Test the cancel_scheduled service."""

    async def test_cancel_scheduled_service_is_registered(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test that the cancel_scheduled service is registered."""
        assert hass.services.has_service(DOMAIN, "cancel_scheduled")


# =============================================================================
# Setup/Unload Tests
# =============================================================================


class TestSetupEntry:
    """Test async_setup_entry."""

    async def test_setup_entry_loads_successfully(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that setup_entry loads successfully."""
        entry = setup_integration
        assert entry.state == ConfigEntryState.LOADED

    async def test_setup_entry_registers_services(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that setup_entry registers all services."""
        services = [
            "pause",
            "cancel",
            "cancel_all",
            "pause_by_area",
            "pause_by_label",
            "cancel_scheduled",
        ]
        for service in services:
            assert hass.services.has_service(DOMAIN, service), f"Service {service} not registered"

    async def test_setup_entry_creates_runtime_data(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that setup_entry creates runtime data."""
        entry = setup_integration
        assert hasattr(entry, "runtime_data")
        assert entry.runtime_data is not None

    async def test_setup_entry_initializes_store(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that setup_entry initializes the store."""
        entry = setup_integration
        data = entry.runtime_data
        assert data.store is not None


class TestUnloadEntry:
    """Test async_unload_entry."""

    async def test_unload_entry_succeeds(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that unload_entry succeeds."""
        entry = setup_integration

        # Unload the entry
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()

        assert entry.state == ConfigEntryState.NOT_LOADED

    async def test_unload_entry_cancels_timers(
        self, hass: HomeAssistant, setup_integration_with_automations: ConfigEntry
    ) -> None:
        """Test that unload_entry cancels all timers."""
        entry = setup_integration_with_automations
        data = entry.runtime_data

        # Add a mock timer
        mock_unsub = MagicMock()
        data.timers["test_timer"] = mock_unsub

        # Unload
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()

        # Timer should have been called and dict cleared
        mock_unsub.assert_called_once()

    async def test_unload_entry_removes_services(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that unload_entry removes services when last entry."""
        entry = setup_integration

        # Verify services exist
        assert hass.services.has_service(DOMAIN, "pause")

        # Unload
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()

        # Services should be removed
        assert not hass.services.has_service(DOMAIN, "pause")

    async def test_unload_entry_clears_listeners(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that unload_entry clears listeners."""
        entry = setup_integration
        data = entry.runtime_data

        # Add a listener
        listener_called = []
        data.add_listener(lambda: listener_called.append(True))

        # Unload
        await hass.config_entries.async_unload(entry.entry_id)
        await hass.async_block_till_done()

        # Listeners should be cleared
        assert len(data.listeners) == 0


# =============================================================================
# Static Path Registration Tests
# =============================================================================


class TestStaticPathRegistration:
    """Test static path registration."""

    async def test_registers_static_path(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that static path is registered."""
        # Check that http.async_register_static_paths was called
        hass.http.async_register_static_paths.assert_called()


# =============================================================================
# Lovelace Resource Registration Tests
# =============================================================================


class TestLovelaceResourceRegistration:
    """Test Lovelace resource registration."""

    async def test_creates_lovelace_resource(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that Lovelace resource is created."""
        mock_resources = hass.data["lovelace"].resources
        mock_resources.async_create_item.assert_called()

    async def test_lovelace_resource_url_includes_version(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test that Lovelace resource URL includes version."""
        mock_resources = hass.data["lovelace"].resources
        call_args = mock_resources.async_create_item.call_args

        if call_args:
            resource_data = call_args[0][0]
            assert "v=" in resource_data["url"]
            assert VERSION in resource_data["url"]
