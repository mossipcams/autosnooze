"""Tests for User Flow 3: Bulk Operations (By Area/Label).

This file tests bulk operations including:
- pause_by_area service and get_automations_by_area helper
- pause_by_label service and get_automations_by_label helper
- Automatic label creation (autosnooze_include/autosnooze_exclude)
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.const import ATTR_ENTITY_ID
import voluptuous as vol

from custom_components.autosnooze import DOMAIN, _async_ensure_labels_exist
from custom_components.autosnooze.const import (
    LABEL_EXCLUDE_CONFIG,
    LABEL_INCLUDE_CONFIG,
)
from custom_components.autosnooze.services import (
    get_automations_by_area,
    get_automations_by_label,
)

UTC = timezone.utc


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


def create_mock_entity(
    entity_id: str,
    domain: str = "automation",
    area_id: str | None = None,
    labels: set[str] | None = None,
) -> MagicMock:
    """Create a mock entity registry entry."""
    entity = MagicMock()
    entity.entity_id = entity_id
    entity.domain = domain
    entity.area_id = area_id
    entity.labels = labels or set()
    return entity


# =============================================================================
# Get Automations By Area Tests
# =============================================================================


class TestGetAutomationsByArea:
    """Tests for get_automations_by_area function."""

    def test_returns_automations_in_area(self) -> None:
        """Test that automations in specified area are returned."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", area_id="living_room"),
            "automation.test2": create_mock_entity("automation.test2", area_id="bedroom"),
            "automation.test3": create_mock_entity("automation.test3", area_id="living_room"),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["living_room"])

        assert "automation.test1" in result
        assert "automation.test3" in result
        assert "automation.test2" not in result

    def test_returns_empty_list_when_no_matches(self) -> None:
        """Test that empty list is returned when no automations in area."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", area_id="bedroom"),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["living_room"])

        assert result == []

    def test_filters_non_automation_entities(self) -> None:
        """Test that non-automation entities are filtered out."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", area_id="living_room"),
            "light.test2": create_mock_entity("light.test2", domain="light", area_id="living_room"),
            "switch.test3": create_mock_entity("switch.test3", domain="switch", area_id="living_room"),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["living_room"])

        assert result == ["automation.test1"]

    def test_handles_multiple_areas(self) -> None:
        """Test that multiple areas can be searched."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", area_id="living_room"),
            "automation.test2": create_mock_entity("automation.test2", area_id="bedroom"),
            "automation.test3": create_mock_entity("automation.test3", area_id="kitchen"),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["living_room", "bedroom"])

        assert "automation.test1" in result
        assert "automation.test2" in result
        assert "automation.test3" not in result

    def test_handles_entities_without_area(self) -> None:
        """Test that entities without area_id are not matched."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", area_id=None),
            "automation.test2": create_mock_entity("automation.test2", area_id="living_room"),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["living_room"])

        assert result == ["automation.test2"]


# =============================================================================
# Get Automations By Label Tests
# =============================================================================


class TestGetAutomationsByLabel:
    """Tests for get_automations_by_label function."""

    def test_returns_automations_with_label(self) -> None:
        """Test that automations with specified label are returned."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels={"snooze", "important"}),
            "automation.test2": create_mock_entity("automation.test2", labels={"other"}),
            "automation.test3": create_mock_entity("automation.test3", labels={"snooze"}),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["snooze"])

        assert "automation.test1" in result
        assert "automation.test3" in result
        assert "automation.test2" not in result

    def test_returns_empty_list_when_no_matches(self) -> None:
        """Test that empty list is returned when no automations have label."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels={"other"}),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["snooze"])

        assert result == []

    def test_filters_non_automation_entities(self) -> None:
        """Test that non-automation entities are filtered out."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels={"snooze"}),
            "light.test2": create_mock_entity("light.test2", domain="light", labels={"snooze"}),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["snooze"])

        assert result == ["automation.test1"]

    def test_handles_multiple_labels(self) -> None:
        """Test that multiple labels can be searched (OR logic)."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels={"label1"}),
            "automation.test2": create_mock_entity("automation.test2", labels={"label2"}),
            "automation.test3": create_mock_entity("automation.test3", labels={"label3"}),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["label1", "label2"])

        assert "automation.test1" in result
        assert "automation.test2" in result
        assert "automation.test3" not in result

    def test_handles_entities_without_labels(self) -> None:
        """Test that entities without labels are not matched."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels=None),
            "automation.test2": create_mock_entity("automation.test2", labels=set()),
            "automation.test3": create_mock_entity("automation.test3", labels={"snooze"}),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["snooze"])

        assert result == ["automation.test3"]

    def test_matches_any_label_in_list(self) -> None:
        """Test that entity with any matching label is returned."""
        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test1": create_mock_entity("automation.test1", labels={"a", "b", "c"}),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["b"])

        assert result == ["automation.test1"]


# =============================================================================
# Label Creation Tests
# =============================================================================


class TestAsyncEnsureLabelsExist:
    """Tests for _async_ensure_labels_exist function."""

    @pytest.fixture
    def mock_label_registry(self) -> MagicMock:
        """Create mock label registry."""
        registry = MagicMock()
        registry.async_create = MagicMock()
        return registry

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock hass."""
        return MagicMock()

    @pytest.mark.asyncio
    async def test_creates_both_labels_when_none_exist(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test creates both include and exclude labels when none exist."""
        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

        assert mock_label_registry.async_create.call_count == 2

    @pytest.mark.asyncio
    async def test_handles_value_error_when_label_exists(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test handles ValueError when label already exists."""
        mock_label_registry.async_create.side_effect = ValueError("Label already exists")

        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

    @pytest.mark.asyncio
    async def test_handles_generic_exception_gracefully(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test handles generic exceptions without failing."""
        mock_label_registry.async_create.side_effect = Exception("Unexpected error")

        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

    @pytest.mark.asyncio
    async def test_creates_include_label_with_correct_properties(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test include label is created with correct name, color, icon, description."""
        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

        calls = mock_label_registry.async_create.call_args_list

        include_call = None
        for call in calls:
            if call.kwargs.get("name") == LABEL_INCLUDE_CONFIG["name"]:
                include_call = call
                break

        assert include_call is not None
        assert include_call.kwargs["color"] == LABEL_INCLUDE_CONFIG["color"]
        assert include_call.kwargs["icon"] == LABEL_INCLUDE_CONFIG["icon"]
        assert include_call.kwargs["description"] == LABEL_INCLUDE_CONFIG["description"]

    @pytest.mark.asyncio
    async def test_creates_exclude_label_with_correct_properties(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test exclude label is created with correct name, color, icon, description."""
        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

        calls = mock_label_registry.async_create.call_args_list

        exclude_call = None
        for call in calls:
            if call.kwargs.get("name") == LABEL_EXCLUDE_CONFIG["name"]:
                exclude_call = call
                break

        assert exclude_call is not None
        assert exclude_call.kwargs["color"] == LABEL_EXCLUDE_CONFIG["color"]
        assert exclude_call.kwargs["icon"] == LABEL_EXCLUDE_CONFIG["icon"]
        assert exclude_call.kwargs["description"] == LABEL_EXCLUDE_CONFIG["description"]

    @pytest.mark.asyncio
    async def test_continues_after_first_label_fails(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test continues to create second label even if first fails."""
        mock_label_registry.async_create.side_effect = [
            ValueError("Label already exists"),
            None,
        ]

        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

        assert mock_label_registry.async_create.call_count == 2


# =============================================================================
# Pause By Area Integration Tests
# =============================================================================


class TestPauseByAreaService:
    """Test the pause_by_area service."""

    @pytest.mark.asyncio
    async def test_pause_by_area_requires_area_id(self, hass: HomeAssistant, setup_integration) -> None:
        """Test pause_by_area raises error when no area_id provided."""
        with pytest.raises(vol.MultipleInvalid):
            await hass.services.async_call(DOMAIN, "pause_by_area", {}, blocking=True)

    @pytest.mark.asyncio
    async def test_pause_by_area_with_empty_area(self, hass: HomeAssistant, setup_integration) -> None:
        """Test pause_by_area handles area with no automations."""
        await hass.services.async_call(
            DOMAIN,
            "pause_by_area",
            {"area_id": ["nonexistent_area"], "hours": 1},
            blocking=True,
        )


# =============================================================================
# Pause By Label Integration Tests
# =============================================================================


class TestPauseByLabelService:
    """Test the pause_by_label service."""

    @pytest.mark.asyncio
    async def test_pause_by_label_requires_label_id(self, hass: HomeAssistant, setup_integration) -> None:
        """Test pause_by_label raises error when no label_id provided."""
        with pytest.raises(vol.MultipleInvalid):
            await hass.services.async_call(DOMAIN, "pause_by_label", {}, blocking=True)

    @pytest.mark.asyncio
    async def test_pause_by_label_with_nonexistent_label(self, hass: HomeAssistant, setup_integration) -> None:
        """Test pause_by_label handles nonexistent label."""
        await hass.services.async_call(
            DOMAIN,
            "pause_by_label",
            {"label_id": ["nonexistent_label"], "hours": 1},
            blocking=True,
        )
