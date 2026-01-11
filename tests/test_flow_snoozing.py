"""Tests for User Flow 1: Snoozing Automations.

This file tests snoozing operations including:
- Pause service with duration parameters
- Validation of stored entries and data
- Timer scheduling for resume
- Automation state management
- PausedAutomation and AutomationPauseData models
- Sensor state and attributes
- Integration config flow
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME
from homeassistant.exceptions import ServiceValidationError
import voluptuous as vol

from custom_components.autosnooze import DOMAIN
from custom_components.autosnooze.coordinator import (
    async_save,
    async_set_automation_state,
    get_friendly_name,
    schedule_resume,
    validate_stored_data,
    validate_stored_entry,
)
from custom_components.autosnooze.models import (
    AutomationPauseData,
    PausedAutomation,
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


@pytest.fixture
async def setup_integration_with_automations(hass: HomeAssistant, setup_integration):
    """Set up integration with mock automations."""
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
    return setup_integration


# =============================================================================
# Validation Tests (Parametrized)
# =============================================================================


class TestValidateStoredEntry:
    """Tests for validate_stored_entry function using parametrization."""

    @pytest.mark.parametrize(
        "entity_id,data,entry_type,expected,description",
        [
            (
                "light.test",
                {"resume_at": "2025-01-01T00:00:00+00:00", "paused_at": "2025-01-01T00:00:00+00:00"},
                "paused",
                False,
                "rejects non-automation entity ID",
            ),
            ("automation.test", "not-a-dict", "paused", False, "rejects non-dict data"),
            ("automation.test", None, "paused", False, "rejects None data"),
            ("automation.test", [], "paused", False, "rejects list data"),
            (
                "automation.test",
                {"paused_at": "2025-01-01T00:00:00+00:00"},
                "paused",
                False,
                "rejects paused entry missing resume_at",
            ),
            (
                "automation.test",
                {"resume_at": "2025-01-01T00:00:00+00:00"},
                "paused",
                False,
                "rejects paused entry missing paused_at",
            ),
            (
                "automation.test",
                {"resume_at": "2025-01-01T00:00:00+00:00"},
                "scheduled",
                False,
                "rejects scheduled entry missing disable_at",
            ),
            (
                "automation.test",
                {"disable_at": "2025-01-01T00:00:00+00:00"},
                "scheduled",
                False,
                "rejects scheduled entry missing resume_at",
            ),
            (
                "automation.test",
                {"resume_at": "not-a-datetime", "paused_at": "2025-01-01T00:00:00+00:00"},
                "paused",
                False,
                "rejects invalid datetime in resume_at",
            ),
            (
                "automation.test",
                {"resume_at": "2025-01-01T01:00:00+00:00", "paused_at": "not-a-datetime"},
                "paused",
                False,
                "rejects invalid datetime in paused_at",
            ),
            (
                "automation.test",
                {"resume_at": "2025-01-01T01:00:00+00:00", "paused_at": "2025-01-01T00:00:00+00:00", "days": -1},
                "paused",
                False,
                "rejects negative days",
            ),
            (
                "automation.test",
                {"resume_at": "2025-01-01T01:00:00+00:00", "paused_at": "2025-01-01T00:00:00+00:00", "hours": -1},
                "paused",
                False,
                "rejects negative hours",
            ),
            (
                "automation.test",
                {"resume_at": "2025-01-01T01:00:00+00:00", "paused_at": "2025-01-01T00:00:00+00:00", "minutes": -1},
                "paused",
                False,
                "rejects negative minutes",
            ),
            (
                "automation.test",
                {"resume_at": "2025-01-01T01:00:00+00:00", "paused_at": "2025-01-01T00:00:00+00:00", "days": "one"},
                "paused",
                False,
                "rejects non-numeric days",
            ),
            (
                "automation.test",
                {"disable_at": "2025-01-01T02:00:00+00:00", "resume_at": "2025-01-01T01:00:00+00:00"},
                "scheduled",
                False,
                "rejects scheduled with resume_at before disable_at",
            ),
            (
                "automation.test",
                {
                    "resume_at": "2025-01-01T01:00:00+00:00",
                    "paused_at": "2025-01-01T00:00:00+00:00",
                    "days": 0,
                    "hours": 1,
                },
                "paused",
                True,
                "accepts valid paused entry",
            ),
            (
                "automation.test",
                {"disable_at": "2025-01-01T01:00:00+00:00", "resume_at": "2025-01-01T02:00:00+00:00"},
                "scheduled",
                True,
                "accepts valid scheduled entry",
            ),
            (
                "automation.test",
                {"resume_at": "2025-01-01T01:00:00+00:00", "paused_at": "2025-01-01T00:00:00+00:00"},
                "paused",
                True,
                "accepts paused entry without optional fields",
            ),
        ],
        ids=lambda x: x if isinstance(x, str) and len(x) > 20 else None,
    )
    def test_validate_stored_entry(
        self, entity_id: str, data: dict, entry_type: str, expected: bool, description: str
    ) -> None:
        """Parametrized validation test."""
        result = validate_stored_entry(entity_id, data, entry_type)
        assert result is expected, f"Failed: {description}"


class TestValidateStoredData:
    """Tests for validate_stored_data function using parametrization."""

    @pytest.mark.parametrize(
        "storage_input,expected_empty",
        [
            ("not-a-dict", True),
            (None, True),
            ([1, 2, 3], True),
            ({"paused": "not-a-dict", "scheduled": {}}, True),
        ],
    )
    def test_validate_stored_data_invalid_input(self, storage_input, expected_empty: bool) -> None:
        """Test that invalid input returns empty dicts."""
        result = validate_stored_data(storage_input)
        if expected_empty:
            assert len(result["paused"]) == 0
            assert len(result["scheduled"]) == 0

    def test_validate_stored_data_filters_invalid_entries(self) -> None:
        """Test that invalid entries are filtered out."""
        storage = {
            "paused": {
                "automation.valid": {
                    "resume_at": "2025-01-01T01:00:00+00:00",
                    "paused_at": "2025-01-01T00:00:00+00:00",
                },
                "light.invalid": {
                    "resume_at": "2025-01-01T01:00:00+00:00",
                    "paused_at": "2025-01-01T00:00:00+00:00",
                },
            },
            "scheduled": {},
        }

        result = validate_stored_data(storage)

        assert "automation.valid" in result["paused"]
        assert "light.invalid" not in result["paused"]


# =============================================================================
# Async Save Tests
# =============================================================================


class TestAsyncSave:
    """Tests for async_save function."""

    @pytest.mark.asyncio
    async def test_save_calls_store(self) -> None:
        """Test save calls the store."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_save(data)

        mock_store.async_save.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_handles_io_error_with_retry(self) -> None:
        """Test save retries on IOError."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=[IOError("disk full"), None])
        data = AutomationPauseData(store=mock_store)

        with patch("asyncio.sleep", new_callable=AsyncMock):
            await async_save(data)

        assert mock_store.async_save.call_count == 2

    @pytest.mark.asyncio
    async def test_save_handles_os_error_with_retry(self) -> None:
        """Test save retries on OSError."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=[OSError("permission denied"), None])
        data = AutomationPauseData(store=mock_store)

        with patch("asyncio.sleep", new_callable=AsyncMock):
            await async_save(data)

        assert mock_store.async_save.call_count == 2


# =============================================================================
# Schedule Resume Tests
# =============================================================================


class TestScheduleResume:
    """Tests for schedule_resume function."""

    def test_schedule_resume_creates_timer(self) -> None:
        """Test schedule_resume creates a timer entry."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            schedule_resume(
                mock_hass,
                data,
                "automation.test",
                resume_at,
            )

        assert "automation.test" in data.timers


# =============================================================================
# Async Set Automation State Tests
# =============================================================================


class TestAsyncSetAutomationState:
    """Tests for async_set_automation_state function."""

    @pytest.mark.asyncio
    async def test_set_state_calls_correct_service(self) -> None:
        """Test set_state calls the correct automation service."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        await async_set_automation_state(mock_hass, "automation.test", enabled=False)

        mock_hass.services.async_call.assert_called_with(
            "automation",
            "turn_off",
            {ATTR_ENTITY_ID: "automation.test"},
            blocking=True,
        )

    @pytest.mark.asyncio
    async def test_set_state_on(self) -> None:
        """Test set_state with enabled=True."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        mock_hass.services.async_call.assert_called_with(
            "automation",
            "turn_on",
            {ATTR_ENTITY_ID: "automation.test"},
            blocking=True,
        )


# =============================================================================
# Get Friendly Name Tests
# =============================================================================


class TestGetFriendlyName:
    """Tests for get_friendly_name function."""

    def test_get_friendly_name_from_attributes(self) -> None:
        """Test getting friendly name from entity attributes."""
        mock_hass = MagicMock()
        mock_state = MagicMock()
        mock_state.attributes = {ATTR_FRIENDLY_NAME: "My Automation"}
        mock_hass.states.get.return_value = mock_state

        result = get_friendly_name(mock_hass, "automation.test")

        assert result == "My Automation"

    def test_get_friendly_name_fallback_to_entity_id(self) -> None:
        """Test fallback to entity_id when no friendly name."""
        mock_hass = MagicMock()
        mock_state = MagicMock()
        mock_state.attributes = {}
        mock_hass.states.get.return_value = mock_state

        result = get_friendly_name(mock_hass, "automation.test")

        assert result == "automation.test"

    def test_get_friendly_name_no_state(self) -> None:
        """Test fallback when entity has no state."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None

        result = get_friendly_name(mock_hass, "automation.test")

        assert result == "automation.test"


# =============================================================================
# PausedAutomation Model Tests
# =============================================================================


class TestPausedAutomation:
    """Tests for PausedAutomation dataclass."""

    @pytest.fixture
    def sample_paused_automation(self) -> PausedAutomation:
        """Create a sample paused automation."""
        now = datetime.now(UTC)
        return PausedAutomation(
            entity_id="automation.test_automation",
            friendly_name="Test Automation",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

    def test_to_dict_returns_correct_structure(self, sample_paused_automation: PausedAutomation) -> None:
        """Test to_dict returns all fields in correct format."""
        result = sample_paused_automation.to_dict()

        assert "friendly_name" in result
        assert "resume_at" in result
        assert "paused_at" in result
        assert "days" in result
        assert "hours" in result
        assert "minutes" in result
        assert result["friendly_name"] == "Test Automation"
        assert result["hours"] == 1

    def test_to_dict_datetime_as_isoformat(self, sample_paused_automation: PausedAutomation) -> None:
        """Test datetime fields are serialized as ISO format strings."""
        result = sample_paused_automation.to_dict()

        datetime.fromisoformat(result["resume_at"])
        datetime.fromisoformat(result["paused_at"])

    def test_from_dict_creates_correct_instance(self) -> None:
        """Test from_dict creates PausedAutomation with correct values."""
        fixed_now = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
        data = {
            "friendly_name": "My Automation",
            "resume_at": (fixed_now + timedelta(hours=2)).isoformat(),
            "paused_at": fixed_now.isoformat(),
            "days": 1,
            "hours": 2,
            "minutes": 30,
        }

        result = PausedAutomation.from_dict("automation.my_auto", data)

        assert result.entity_id == "automation.my_auto"
        assert result.friendly_name == "My Automation"
        assert result.days == 1
        assert result.hours == 2
        assert result.minutes == 30

    def test_from_dict_defaults_missing_optional_fields(self) -> None:
        """Test from_dict uses defaults for missing optional fields."""
        fixed_now = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
        data = {
            "resume_at": fixed_now.isoformat(),
            "paused_at": fixed_now.isoformat(),
        }

        result = PausedAutomation.from_dict("automation.test", data)

        assert result.friendly_name == "automation.test"
        assert result.days == 0
        assert result.hours == 0
        assert result.minutes == 0

    def test_roundtrip_serialization(self, sample_paused_automation: PausedAutomation) -> None:
        """Test data survives serialization roundtrip."""
        serialized = sample_paused_automation.to_dict()
        restored = PausedAutomation.from_dict(sample_paused_automation.entity_id, serialized)

        assert restored.entity_id == sample_paused_automation.entity_id
        assert restored.friendly_name == sample_paused_automation.friendly_name
        assert restored.days == sample_paused_automation.days
        assert restored.hours == sample_paused_automation.hours
        assert restored.minutes == sample_paused_automation.minutes


# =============================================================================
# AutomationPauseData Tests
# =============================================================================


class TestAutomationPauseData:
    """Tests for AutomationPauseData container."""

    def test_init_creates_empty_dicts(self) -> None:
        """Test initialization creates empty data structures."""
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        assert len(data.paused) == 0
        assert len(data.scheduled) == 0
        assert len(data.timers) == 0
        assert len(data.scheduled_timers) == 0

    def test_add_listener(self) -> None:
        """Test adding a listener."""
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)
        listener = MagicMock()

        data.add_listener(listener)

        assert listener in data.listeners

    def test_notify_listeners_called(self) -> None:
        """Test listeners are called on notify."""
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)
        listener = MagicMock()
        data.add_listener(listener)

        data.notify()

        listener.assert_called_once()

    def test_get_paused_dict_serializes_paused(self) -> None:
        """Test get_paused_dict serializes paused automations."""
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

        result = data.get_paused_dict()

        assert "automation.test" in result


# =============================================================================
# Config Flow Integration Tests
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

        result = await hass.config_entries.flow.async_configure(result["flow_id"], user_input={})

        assert result["type"] == "create_entry"
        assert result["title"] == "AutoSnooze"
        assert result["data"] == {}

    async def test_duplicate_entry_aborts(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that duplicate entry is rejected."""
        result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})

        # Flow aborts immediately when a config entry with same unique_id exists
        assert result["type"] == "abort"
        assert result["reason"] == "already_configured"


# =============================================================================
# Pause Service Integration Tests
# =============================================================================


class TestPauseService:
    """Test the pause service."""

    @pytest.mark.asyncio
    async def test_pause_requires_entity_id(self, hass: HomeAssistant, setup_integration) -> None:
        """Test pause raises error when no entity_id provided."""
        with pytest.raises(vol.MultipleInvalid):
            await hass.services.async_call(DOMAIN, "pause", {}, blocking=True)

    @pytest.mark.asyncio
    async def test_pause_requires_duration_or_time(
        self, hass: HomeAssistant, setup_integration_with_automations
    ) -> None:
        """Test pause requires duration or resume_at."""
        with pytest.raises(ServiceValidationError):
            await hass.services.async_call(
                DOMAIN,
                "pause",
                {ATTR_ENTITY_ID: ["automation.test_automation_1"]},
                blocking=True,
            )

    @pytest.mark.asyncio
    async def test_pause_with_duration(self, hass: HomeAssistant, setup_integration_with_automations) -> None:
        """Test pause with duration succeeds."""
        await hass.services.async_call(
            DOMAIN,
            "pause",
            {ATTR_ENTITY_ID: ["automation.test_automation_1"], "hours": 1},
            blocking=True,
        )

    @pytest.mark.asyncio
    async def test_pause_non_automation_fails(self, hass: HomeAssistant, setup_integration) -> None:
        """Test pausing non-automation entity fails."""
        hass.states.async_set("light.test", "on", {"friendly_name": "Test Light"})

        with pytest.raises(ServiceValidationError):
            await hass.services.async_call(
                DOMAIN,
                "pause",
                {ATTR_ENTITY_ID: ["light.test"], "hours": 1},
                blocking=True,
            )


# =============================================================================
# Sensor Tests
# =============================================================================


class TestSensor:
    """Test the sensor entity."""

    @pytest.mark.asyncio
    async def test_sensor_created_on_setup(self, hass: HomeAssistant, setup_integration) -> None:
        """Test sensor is created during setup."""
        state = hass.states.get("sensor.autosnooze_snoozed_automations")
        assert state is not None

    @pytest.mark.asyncio
    async def test_sensor_initial_state(self, hass: HomeAssistant, setup_integration) -> None:
        """Test sensor initial state is 0."""
        state = hass.states.get("sensor.autosnooze_snoozed_automations")
        assert state.state == "0"

    @pytest.mark.asyncio
    async def test_sensor_has_attributes(self, hass: HomeAssistant, setup_integration) -> None:
        """Test sensor has paused_automations and scheduled_snoozes attributes."""
        state = hass.states.get("sensor.autosnooze_snoozed_automations")
        assert "paused_automations" in state.attributes
        assert "scheduled_snoozes" in state.attributes


# =============================================================================
# Mutation-Killing Tests
# =============================================================================


class TestAsyncSaveMutations:
    """Mutation-killing tests for async_save function."""

    @pytest.mark.asyncio
    async def test_save_returns_true_when_store_is_none(self) -> None:
        """Test save returns True when store is None (nothing to save)."""
        data = AutomationPauseData(store=None)
        result = await async_save(data)
        assert result is True

    @pytest.mark.asyncio
    async def test_save_returns_false_after_all_retries_exhausted(self) -> None:
        """Test save returns False when all retries are exhausted."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=IOError("persistent failure"))
        data = AutomationPauseData(store=mock_store)

        with patch("asyncio.sleep", new_callable=AsyncMock):
            result = await async_save(data)

        assert result is False
        # Should be MAX_SAVE_RETRIES + 1 = 4 attempts
        assert mock_store.async_save.call_count == 4

    @pytest.mark.asyncio
    async def test_save_returns_false_on_non_transient_error(self) -> None:
        """Test save returns False immediately on non-transient error."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=RuntimeError("fatal error"))
        data = AutomationPauseData(store=mock_store)

        result = await async_save(data)

        assert result is False
        # Should only attempt once, no retry
        assert mock_store.async_save.call_count == 1

    @pytest.mark.asyncio
    async def test_save_returns_true_on_success(self) -> None:
        """Test save returns True on successful save."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(return_value=None)
        data = AutomationPauseData(store=mock_store)

        result = await async_save(data)

        assert result is True
        assert mock_store.async_save.call_count == 1


class TestValidateStoredEntryMutations:
    """Mutation-killing tests for validate_stored_entry function."""

    @pytest.mark.parametrize(
        "entity_id,expected",
        [
            ("", False),  # Empty string
            ("automation", False),  # No dot
            ("automation.", True),  # Entity with dot (valid prefix check)
            (".automation", False),  # Dot at wrong position
            ("light.automation", False),  # Wrong domain
            ("switch.test", False),  # Wrong domain
            ("automation.valid", True),  # Valid
        ],
    )
    def test_entity_id_prefix_validation(self, entity_id: str, expected: bool) -> None:
        """Test entity_id must start with 'automation.'."""
        data = {
            "resume_at": "2025-01-01T01:00:00+00:00",
            "paused_at": "2025-01-01T00:00:00+00:00",
        }
        # For valid-prefix test cases, we need valid data
        if expected:
            result = validate_stored_entry(entity_id, data, "paused")
            assert result is expected
        else:
            result = validate_stored_entry(entity_id, data, "paused")
            assert result is False

    def test_scheduled_resume_equals_disable_is_invalid(self) -> None:
        """Test that scheduled entry with resume_at == disable_at is invalid."""
        same_time = "2025-01-01T12:00:00+00:00"
        data = {
            "disable_at": same_time,
            "resume_at": same_time,
        }
        result = validate_stored_entry("automation.test", data, "scheduled")
        assert result is False

    def test_scheduled_resume_before_disable_is_invalid(self) -> None:
        """Test that scheduled entry with resume_at < disable_at is invalid."""
        data = {
            "disable_at": "2025-01-01T12:00:00+00:00",
            "resume_at": "2025-01-01T11:00:00+00:00",
        }
        result = validate_stored_entry("automation.test", data, "scheduled")
        assert result is False

    def test_scheduled_resume_after_disable_is_valid(self) -> None:
        """Test that scheduled entry with resume_at > disable_at is valid."""
        data = {
            "disable_at": "2025-01-01T11:00:00+00:00",
            "resume_at": "2025-01-01T12:00:00+00:00",
        }
        result = validate_stored_entry("automation.test", data, "scheduled")
        assert result is True

    @pytest.mark.parametrize(
        "field,value,expected",
        [
            ("days", "5", False),  # String not int
            ("days", [], False),  # List not int/float
            ("days", {}, False),  # Dict not int/float
            ("hours", "two", False),  # String not int
            ("minutes", None, False),  # None not int
            ("days", -1, False),  # Negative
            ("hours", -0.5, False),  # Negative float
            ("minutes", -100, False),  # Negative
            ("days", 0, True),  # Zero is valid
            ("hours", 0.0, True),  # Zero float is valid
            ("minutes", 0, True),  # Zero is valid
            ("days", 1, True),  # Positive is valid
            ("hours", 1.5, True),  # Positive float is valid
        ],
    )
    def test_numeric_field_validation(self, field: str, value: any, expected: bool) -> None:
        """Test validation of numeric fields (days, hours, minutes)."""
        data = {
            "resume_at": "2025-01-01T01:00:00+00:00",
            "paused_at": "2025-01-01T00:00:00+00:00",
            field: value,
        }
        result = validate_stored_entry("automation.test", data, "paused")
        assert result is expected


class TestValidateStoredDataMutations:
    """Mutation-killing tests for validate_stored_data function."""

    def test_paused_as_list_returns_empty(self) -> None:
        """Test that paused as list (not dict) results in empty paused."""
        stored = {"paused": [1, 2, 3], "scheduled": {}}
        result = validate_stored_data(stored)
        assert result["paused"] == {}
        assert result["scheduled"] == {}

    def test_scheduled_as_list_returns_empty(self) -> None:
        """Test that scheduled as list (not dict) results in empty scheduled."""
        stored = {"paused": {}, "scheduled": ["a", "b"]}
        result = validate_stored_data(stored)
        assert result["paused"] == {}
        assert result["scheduled"] == {}

    def test_mixed_valid_invalid_preserves_valid(self) -> None:
        """Test that invalid entries are removed but valid are kept."""
        stored = {
            "paused": {
                "automation.valid1": {
                    "resume_at": "2025-01-01T01:00:00+00:00",
                    "paused_at": "2025-01-01T00:00:00+00:00",
                },
                "light.invalid": {
                    "resume_at": "2025-01-01T01:00:00+00:00",
                    "paused_at": "2025-01-01T00:00:00+00:00",
                },
                "automation.valid2": {
                    "resume_at": "2025-01-01T02:00:00+00:00",
                    "paused_at": "2025-01-01T00:00:00+00:00",
                },
            },
            "scheduled": {},
        }

        result = validate_stored_data(stored)

        assert "automation.valid1" in result["paused"]
        assert "automation.valid2" in result["paused"]
        assert "light.invalid" not in result["paused"]
        assert len(result["paused"]) == 2

    def test_result_has_both_paused_and_scheduled_keys(self) -> None:
        """Test result always has both 'paused' and 'scheduled' keys."""
        # Test with None
        result = validate_stored_data(None)
        assert "paused" in result
        assert "scheduled" in result

        # Test with empty dict
        result = validate_stored_data({})
        assert "paused" in result
        assert "scheduled" in result

        # Test with partial keys
        result = validate_stored_data({"paused": {}})
        assert "paused" in result
        assert "scheduled" in result


class TestAsyncSetAutomationStateMutations:
    """Mutation-killing tests for async_set_automation_state function."""

    @pytest.mark.asyncio
    async def test_returns_false_when_entity_not_found(self) -> None:
        """Test returns False when entity doesn't exist."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None

        result = await async_set_automation_state(mock_hass, "automation.nonexistent", enabled=True)

        assert result is False

    @pytest.mark.asyncio
    async def test_returns_true_on_success(self) -> None:
        """Test returns True when service call succeeds."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        result = await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_on_service_exception(self) -> None:
        """Test returns False when service call raises exception."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock(side_effect=Exception("Service failed"))

        result = await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is False


# =============================================================================
# Persistence Restoration Tests (async_load_stored)
# =============================================================================


class TestAsyncLoadStored:
    """Tests for async_load_stored function - persistence restoration."""

    @pytest.mark.asyncio
    async def test_load_stored_with_no_store(self) -> None:
        """Test early return when store is None."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        data = AutomationPauseData(store=None)

        # Should return early without error
        await async_load_stored(mock_hass, data)
        assert len(data.paused) == 0

    @pytest.mark.asyncio
    async def test_load_stored_with_empty_storage(self) -> None:
        """Test handling of empty/None storage data."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_load = AsyncMock(return_value=None)
        data = AutomationPauseData(store=mock_store)

        await async_load_stored(mock_hass, data)
        assert len(data.paused) == 0

    @pytest.mark.asyncio
    async def test_load_stored_handles_storage_exception(self) -> None:
        """Test graceful handling when storage load fails."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_load = AsyncMock(side_effect=Exception("Disk error"))
        data = AutomationPauseData(store=mock_store)

        # Should not raise, just log error
        await async_load_stored(mock_hass, data)
        assert len(data.paused) == 0

    @pytest.mark.asyncio
    async def test_load_stored_cleans_up_deleted_automation(self) -> None:
        """Test restoration cleans up automations that no longer exist."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None  # Entity doesn't exist
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        future_time = (datetime.now(UTC) + timedelta(hours=1)).isoformat()
        past_time = (datetime.now(UTC) - timedelta(hours=1)).isoformat()
        mock_store.async_load = AsyncMock(
            return_value={
                "paused": {
                    "automation.deleted": {
                        "resume_at": future_time,
                        "paused_at": past_time,
                    }
                },
                "scheduled": {},
            }
        )
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_load_stored(mock_hass, data)

        # Entity should not be in paused dict (cleaned up)
        assert "automation.deleted" not in data.paused
        # Save should be called to persist cleanup
        mock_store.async_save.assert_called_once()

    @pytest.mark.asyncio
    async def test_load_stored_expires_past_resume_time(self) -> None:
        """Test restoration re-enables automations past their resume time."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()  # Entity exists
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        past_time = (datetime.now(UTC) - timedelta(hours=1)).isoformat()
        mock_store.async_load = AsyncMock(
            return_value={
                "paused": {
                    "automation.expired": {
                        "resume_at": past_time,
                        "paused_at": past_time,
                    }
                },
                "scheduled": {},
            }
        )
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_load_stored(mock_hass, data)

        # Entity should not be tracked (expired)
        assert "automation.expired" not in data.paused
        # turn_on should be called to re-enable the automation
        mock_hass.services.async_call.assert_called()

    @pytest.mark.asyncio
    async def test_load_stored_restores_valid_paused_automation(self) -> None:
        """Test restoration of valid paused automation with future resume time."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()  # Entity exists
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        future_time = (datetime.now(UTC) + timedelta(hours=1)).isoformat()
        past_time = (datetime.now(UTC) - timedelta(minutes=30)).isoformat()
        mock_store.async_load = AsyncMock(
            return_value={
                "paused": {
                    "automation.valid": {
                        "resume_at": future_time,
                        "paused_at": past_time,
                        "friendly_name": "Valid Automation",
                    }
                },
                "scheduled": {},
            }
        )
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_load_stored(mock_hass, data)

        # Entity should be tracked
        assert "automation.valid" in data.paused

    @pytest.mark.asyncio
    async def test_load_stored_handles_disable_failure(self) -> None:
        """Test cleanup when automation disable fails during restoration."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()  # Entity exists
        # First call fails (turn_off), second succeeds (cleanup wouldn't call turn_on)
        mock_hass.services.async_call = AsyncMock(side_effect=Exception("Service failed"))

        mock_store = MagicMock()
        future_time = (datetime.now(UTC) + timedelta(hours=1)).isoformat()
        past_time = (datetime.now(UTC) - timedelta(minutes=30)).isoformat()
        mock_store.async_load = AsyncMock(
            return_value={
                "paused": {
                    "automation.failing": {
                        "resume_at": future_time,
                        "paused_at": past_time,
                    }
                },
                "scheduled": {},
            }
        )
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_load_stored(mock_hass, data)

        # Entity should not be tracked (failed to restore)
        assert "automation.failing" not in data.paused

    @pytest.mark.asyncio
    async def test_load_stored_invalid_data_cleaned_up(self) -> None:
        """Test invalid stored data is cleaned up."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_load = AsyncMock(
            return_value={
                "paused": {
                    "automation.invalid": {
                        # Missing required fields
                        "some_field": "value",
                    }
                },
                "scheduled": {},
            }
        )
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_load_stored(mock_hass, data)

        # Invalid entity should not be tracked
        assert "automation.invalid" not in data.paused


class TestAsyncLoadStoredScheduled:
    """Tests for scheduled snooze restoration in async_load_stored."""

    @pytest.mark.asyncio
    async def test_load_restores_future_scheduled_snooze(self) -> None:
        """Test restoration of scheduled snooze with future disable_at."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()  # Entity exists
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        future_disable = (datetime.now(UTC) + timedelta(hours=1)).isoformat()
        future_resume = (datetime.now(UTC) + timedelta(hours=2)).isoformat()
        mock_store.async_load = AsyncMock(
            return_value={
                "paused": {},
                "scheduled": {
                    "automation.scheduled": {
                        "disable_at": future_disable,
                        "resume_at": future_resume,
                        "friendly_name": "Scheduled Automation",
                    }
                },
            }
        )
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            await async_load_stored(mock_hass, data)

        # Entity should be in scheduled dict
        assert "automation.scheduled" in data.scheduled

    @pytest.mark.asyncio
    async def test_load_executes_past_disable_future_resume(self) -> None:
        """Test scheduled snooze past disable_at but future resume_at."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()  # Entity exists
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        past_disable = (datetime.now(UTC) - timedelta(minutes=30)).isoformat()
        future_resume = (datetime.now(UTC) + timedelta(hours=1)).isoformat()
        mock_store.async_load = AsyncMock(
            return_value={
                "paused": {},
                "scheduled": {
                    "automation.past_disable": {
                        "disable_at": past_disable,
                        "resume_at": future_resume,
                        "friendly_name": "Past Disable Automation",
                    }
                },
            }
        )
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            await async_load_stored(mock_hass, data)

        # Should be disabled immediately and moved to paused
        assert "automation.past_disable" in data.paused
        assert "automation.past_disable" not in data.scheduled

    @pytest.mark.asyncio
    async def test_load_cleans_up_fully_expired_scheduled(self) -> None:
        """Test cleanup of scheduled snooze where both times are past."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()  # Entity exists
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        past_disable = (datetime.now(UTC) - timedelta(hours=2)).isoformat()
        past_resume = (datetime.now(UTC) - timedelta(hours=1)).isoformat()
        mock_store.async_load = AsyncMock(
            return_value={
                "paused": {},
                "scheduled": {
                    "automation.expired_scheduled": {
                        "disable_at": past_disable,
                        "resume_at": past_resume,
                    }
                },
            }
        )
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_load_stored(mock_hass, data)

        # Should not be in either dict (fully expired)
        assert "automation.expired_scheduled" not in data.paused
        assert "automation.expired_scheduled" not in data.scheduled
        # Save should be called to persist cleanup
        mock_store.async_save.assert_called_once()

    @pytest.mark.asyncio
    async def test_load_cleans_up_deleted_scheduled_automation(self) -> None:
        """Test cleanup of scheduled snooze for deleted automation."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None  # Entity doesn't exist
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        future_disable = (datetime.now(UTC) + timedelta(hours=1)).isoformat()
        future_resume = (datetime.now(UTC) + timedelta(hours=2)).isoformat()
        mock_store.async_load = AsyncMock(
            return_value={
                "paused": {},
                "scheduled": {
                    "automation.deleted_scheduled": {
                        "disable_at": future_disable,
                        "resume_at": future_resume,
                    }
                },
            }
        )
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_load_stored(mock_hass, data)

        # Should not be tracked (entity deleted)
        assert "automation.deleted_scheduled" not in data.scheduled
        mock_store.async_save.assert_called_once()

    @pytest.mark.asyncio
    async def test_load_handles_scheduled_disable_failure(self) -> None:
        """Test cleanup when scheduled disable fails to execute."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()  # Entity exists
        mock_hass.services.async_call = AsyncMock(side_effect=Exception("Service failed"))

        mock_store = MagicMock()
        past_disable = (datetime.now(UTC) - timedelta(minutes=30)).isoformat()
        future_resume = (datetime.now(UTC) + timedelta(hours=1)).isoformat()
        mock_store.async_load = AsyncMock(
            return_value={
                "paused": {},
                "scheduled": {
                    "automation.failing_scheduled": {
                        "disable_at": past_disable,
                        "resume_at": future_resume,
                    }
                },
            }
        )
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_load_stored(mock_hass, data)

        # Should not be in paused (disable failed)
        assert "automation.failing_scheduled" not in data.paused

    @pytest.mark.asyncio
    async def test_load_notifies_listeners(self) -> None:
        """Test that load notifies listeners after loading."""
        from custom_components.autosnooze.coordinator import async_load_stored

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_load = AsyncMock(return_value={"paused": {}, "scheduled": {}})
        data = AutomationPauseData(store=mock_store)

        # Add a mock listener
        listener_called = []
        data.listeners.append(lambda: listener_called.append(True))

        await async_load_stored(mock_hass, data)

        # Listener should be called
        assert len(listener_called) == 1


# =============================================================================
# Service Validation Edge Cases
# =============================================================================


class TestServiceValidationEdgeCases:
    """Tests for service validation edge cases."""

    @pytest.mark.asyncio
    async def test_pause_with_empty_entity_list(self) -> None:
        """Test early return when no entities provided."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        # Should return early without save/notify
        await async_pause_automations(mock_hass, data, [], hours=1)

        # Save should not be called
        mock_store.async_save.assert_not_called()

    @pytest.mark.asyncio
    async def test_pause_with_resume_time_in_past(self) -> None:
        """Test ServiceValidationError when resume_at in past."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        data = AutomationPauseData(store=None)

        past_time = datetime.now(UTC) - timedelta(hours=1)

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                resume_at_dt=past_time,
            )

        assert "resume_time_past" in str(exc_info.value.translation_key)

    @pytest.mark.asyncio
    async def test_pause_with_disable_after_resume(self) -> None:
        """Test validation error when disable_at >= resume_at."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        data = AutomationPauseData(store=None)

        now = datetime.now(UTC)
        disable_time = now + timedelta(hours=2)
        resume_time = now + timedelta(hours=1)  # Resume before disable

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                disable_at=disable_time,
                resume_at_dt=resume_time,
            )

        assert "disable_after_resume" in str(exc_info.value.translation_key)

    @pytest.mark.asyncio
    async def test_pause_with_zero_duration(self) -> None:
        """Test validation error when duration is zero."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        data = AutomationPauseData(store=None)

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                days=0,
                hours=0,
                minutes=0,
            )

        assert "invalid_duration" in str(exc_info.value.translation_key)

    @pytest.mark.asyncio
    async def test_pause_with_non_automation_entity(self) -> None:
        """Test validation error for non-automation entity."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        data = AutomationPauseData(store=None)

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["light.not_an_automation"],
                hours=1,
            )

        assert "not_automation" in str(exc_info.value.translation_key)

    @pytest.mark.asyncio
    async def test_pause_scheduled_snooze_creation(self) -> None:
        """Test scheduled snooze creates correct entries."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        disable_time = now + timedelta(hours=1)
        resume_time = now + timedelta(hours=2)

        with patch("custom_components.autosnooze.services.schedule_disable") as mock_schedule:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                disable_at=disable_time,
                resume_at_dt=resume_time,
            )

        # Should be in scheduled dict, not paused
        assert "automation.test" in data.scheduled
        assert "automation.test" not in data.paused
        mock_schedule.assert_called_once()

    @pytest.mark.asyncio
    async def test_pause_disable_failure_continues(self) -> None:
        """Test that disable failure for one entity continues to others."""
        from custom_components.autosnooze.services import async_pause_automations
        from custom_components.autosnooze.coordinator import async_set_automation_state

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        # First call fails, second succeeds
        with (
            patch(
                "custom_components.autosnooze.services.async_set_automation_state",
                new_callable=AsyncMock,
                side_effect=[False, True],
            ),
            patch("custom_components.autosnooze.services.schedule_resume"),
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.failing", "automation.success"],
                hours=1,
            )

        # Only the successful one should be in paused
        assert "automation.failing" not in data.paused
        assert "automation.success" in data.paused


class TestCancelServiceEdgeCases:
    """Tests for cancel service edge cases."""

    @pytest.mark.asyncio
    async def test_cancel_warns_for_not_snoozed(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test warning when trying to cancel non-snoozed automation."""
        hass.states.async_set("automation.not_snoozed", "on", {"friendly_name": "Not Snoozed"})

        # Should not raise, just warn
        await hass.services.async_call(
            DOMAIN,
            "cancel",
            {ATTR_ENTITY_ID: ["automation.not_snoozed"]},
            blocking=True,
        )

    @pytest.mark.asyncio
    async def test_cancel_all_with_empty_list(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test cancel_all with no snoozed automations."""
        # Ensure no snoozed automations
        data = setup_integration.runtime_data
        data.paused.clear()

        # Should not raise
        await hass.services.async_call(
            DOMAIN,
            "cancel_all",
            {},
            blocking=True,
        )


class TestCancelScheduledEdgeCases:
    """Tests for cancel_scheduled service edge cases."""

    @pytest.mark.asyncio
    async def test_cancel_scheduled_warns_for_no_schedule(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test warning when trying to cancel non-existent scheduled snooze."""
        hass.states.async_set("automation.no_schedule", "on", {"friendly_name": "No Schedule"})

        # Should not raise, just warn
        await hass.services.async_call(
            DOMAIN,
            "cancel_scheduled",
            {ATTR_ENTITY_ID: ["automation.no_schedule"]},
            blocking=True,
        )


class TestPauseByFilterEdgeCases:
    """Tests for pause_by_area and pause_by_label edge cases."""

    @pytest.mark.asyncio
    async def test_pause_by_area_no_automations_found(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test warning when no automations found in area."""
        # Should not raise, just warn (no automations in area)
        await hass.services.async_call(
            DOMAIN,
            "pause_by_area",
            {"area_id": "nonexistent_area", "hours": 1},
            blocking=True,
        )

    @pytest.mark.asyncio
    async def test_pause_by_label_no_automations_found(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test warning when no automations found with label."""
        # Should not raise, just warn (no automations with label)
        await hass.services.async_call(
            DOMAIN,
            "pause_by_label",
            {"label_id": "nonexistent_label", "hours": 1},
            blocking=True,
        )


# =============================================================================
# Logging Verification Tests (for mutation testing)
# =============================================================================


class TestLoggingVerification:
    """Tests that verify logging output to catch logging-related mutations."""

    @pytest.mark.asyncio
    async def test_async_set_automation_state_logs_warning_when_not_found(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test that warning is logged with correct entity_id when automation not found."""
        import logging
        from custom_components.autosnooze.coordinator import async_set_automation_state

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None
        mock_hass.services.async_call = AsyncMock()

        with caplog.at_level(logging.WARNING):
            result = await async_set_automation_state(mock_hass, "automation.missing", enabled=True)

        assert result is False
        assert "automation.missing" in caplog.text
        assert "Automation not found" in caplog.text

    @pytest.mark.asyncio
    async def test_async_set_automation_state_logs_error_on_service_failure(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test that error is logged with entity_id and action when service call fails."""
        import logging
        from custom_components.autosnooze.coordinator import async_set_automation_state

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock(side_effect=Exception("Service error"))

        with caplog.at_level(logging.ERROR):
            result = await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is False
        assert "automation.test" in caplog.text
        assert "Failed to" in caplog.text
        assert "wake" in caplog.text  # enabled=True means wake

    @pytest.mark.asyncio
    async def test_async_set_automation_state_logs_snooze_on_disable(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test that error log says 'snooze' when disabling fails."""
        import logging
        from custom_components.autosnooze.coordinator import async_set_automation_state

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock(side_effect=Exception("Service error"))

        with caplog.at_level(logging.ERROR):
            result = await async_set_automation_state(mock_hass, "automation.test", enabled=False)

        assert result is False
        assert "snooze" in caplog.text  # enabled=False means snooze

    @pytest.mark.asyncio
    async def test_async_resume_logs_info_with_entity_id(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test that info log includes the correct entity_id when waking."""
        import logging
        from custom_components.autosnooze.coordinator import async_resume

        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.wake_test"] = PausedAutomation(
            entity_id="automation.wake_test",
            friendly_name="Wake Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

        with caplog.at_level(logging.INFO):
            await async_resume(mock_hass, data, "automation.wake_test")

        assert "automation.wake_test" in caplog.text
        assert "Woke automation" in caplog.text

    @pytest.mark.asyncio
    async def test_async_resume_batch_logs_count(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test that batch resume logs the correct count of automations."""
        import logging
        from custom_components.autosnooze.coordinator import async_resume_batch

        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        for i in range(3):
            entity_id = f"automation.batch_test_{i}"
            data.paused[entity_id] = PausedAutomation(
                entity_id=entity_id,
                friendly_name=f"Batch Test {i}",
                resume_at=now + timedelta(hours=1),
                paused_at=now,
                days=0,
                hours=1,
                minutes=0,
            )

        with caplog.at_level(logging.INFO):
            await async_resume_batch(
                mock_hass, data, ["automation.batch_test_0", "automation.batch_test_1", "automation.batch_test_2"]
            )

        assert "Woke 3 automations" in caplog.text

    @pytest.mark.asyncio
    async def test_schedule_resume_logs_scheduled_snooze_execution(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test that scheduled snooze execution logs entity_id and resume time."""
        import logging
        from custom_components.autosnooze.coordinator import async_execute_scheduled_disable

        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        from custom_components.autosnooze.models import ScheduledSnooze

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=2)
        data.scheduled["automation.scheduled_test"] = ScheduledSnooze(
            entity_id="automation.scheduled_test",
            friendly_name="Scheduled Test",
            disable_at=now,
            resume_at=resume_at,
        )

        with caplog.at_level(logging.INFO):
            await async_execute_scheduled_disable(mock_hass, data, "automation.scheduled_test", resume_at)

        assert "automation.scheduled_test" in caplog.text
        assert "Executed scheduled snooze" in caplog.text


class TestErrorPathVerification:
    """Tests for error paths to catch mutations in error handling."""

    @pytest.mark.asyncio
    async def test_async_save_logs_error_on_failure(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """Test that save failures are logged with error details."""
        import logging
        from custom_components.autosnooze.coordinator import async_save

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=Exception("Save failed"))
        data = AutomationPauseData(store=mock_store)

        with caplog.at_level(logging.ERROR):
            await async_save(data)

        assert "Failed to save data" in caplog.text

    def test_get_friendly_name_returns_entity_id_as_fallback(self) -> None:
        """Test that friendly name fallback uses entity_id correctly."""
        mock_hass = MagicMock()
        # State exists but no friendly_name attribute
        mock_state = MagicMock()
        mock_state.attributes = {}
        mock_hass.states.get.return_value = mock_state

        result = get_friendly_name(mock_hass, "automation.no_friendly_name")

        assert result == "automation.no_friendly_name"

    def test_get_friendly_name_returns_friendly_name_when_present(self) -> None:
        """Test that friendly name is returned when present."""
        mock_hass = MagicMock()
        mock_state = MagicMock()
        mock_state.attributes = {ATTR_FRIENDLY_NAME: "My Automation"}
        mock_hass.states.get.return_value = mock_state

        result = get_friendly_name(mock_hass, "automation.test")

        assert result == "My Automation"

    def test_get_friendly_name_when_state_none(self) -> None:
        """Test friendly name when state doesn't exist."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None

        result = get_friendly_name(mock_hass, "automation.missing")

        assert result == "automation.missing"


class TestReturnValueVerification:
    """Tests that verify specific return values to catch mutations."""

    @pytest.mark.asyncio
    async def test_async_set_automation_state_returns_true_on_success(self) -> None:
        """Test that successful state change returns True."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        result = await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is True

    @pytest.mark.asyncio
    async def test_async_set_automation_state_returns_false_when_not_found(self) -> None:
        """Test that missing automation returns False."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None

        result = await async_set_automation_state(mock_hass, "automation.missing", enabled=True)

        assert result is False

    @pytest.mark.asyncio
    async def test_async_set_automation_state_returns_false_on_error(self) -> None:
        """Test that service error returns False."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock(side_effect=Exception("Error"))

        result = await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is False


# =============================================================================
# Default Parameter Mutation Tests
# =============================================================================


class TestDefaultParameterMutations:
    """Tests to catch mutations in default parameter values."""

    @pytest.mark.asyncio
    async def test_pause_uses_default_days_of_zero(self) -> None:
        """Test that days defaults to 0, not 1.

        Catches mutation: days: int = 0 -> days: int = 1
        """
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        # Use only hours, relying on days default of 0
        with (
            patch(
                "custom_components.autosnooze.services.async_set_automation_state",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("custom_components.autosnooze.services.schedule_resume") as mock_schedule,
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                hours=1,  # Only specify hours, days should default to 0
            )

        # Verify resume time is ~1 hour from now, not ~25 hours (if days was 1)
        assert "automation.test" in data.paused
        paused = data.paused["automation.test"]
        assert paused.days == 0
        assert paused.hours == 1

    @pytest.mark.asyncio
    async def test_pause_uses_default_hours_of_zero(self) -> None:
        """Test that hours defaults to 0, not 1.

        Catches mutation: hours: int = 0 -> hours: int = 1
        """
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        # Use only minutes, relying on hours default of 0
        with (
            patch(
                "custom_components.autosnooze.services.async_set_automation_state",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("custom_components.autosnooze.services.schedule_resume"),
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                minutes=30,  # Only specify minutes, hours should default to 0
            )

        assert "automation.test" in data.paused
        paused = data.paused["automation.test"]
        assert paused.hours == 0
        assert paused.minutes == 30

    @pytest.mark.asyncio
    async def test_pause_uses_default_minutes_of_zero(self) -> None:
        """Test that minutes defaults to 0, not 1.

        Catches mutation: minutes: int = 0 -> minutes: int = 1
        """
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        # Use only hours, relying on minutes default of 0
        with (
            patch(
                "custom_components.autosnooze.services.async_set_automation_state",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("custom_components.autosnooze.services.schedule_resume"),
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                hours=2,  # Only specify hours, minutes should default to 0
            )

        assert "automation.test" in data.paused
        paused = data.paused["automation.test"]
        assert paused.hours == 2
        assert paused.minutes == 0


class TestScheduleResumeMutations:
    """Mutation-killing tests for schedule_resume function."""

    def test_schedule_resume_cancels_existing_timer_for_entity(self) -> None:
        """Test schedule_resume cancels only the specified entity's timer.

        Catches mutation: cancel_timer(data, entity_id) -> cancel_timer(data, None)
        """
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        mock_cancel_1 = MagicMock()
        mock_cancel_2 = MagicMock()
        data.timers["automation.test1"] = mock_cancel_1
        data.timers["automation.test2"] = mock_cancel_2

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            schedule_resume(mock_hass, data, "automation.test1", resume_at)

        # Only test1's timer should be cancelled
        mock_cancel_1.assert_called_once()
        mock_cancel_2.assert_not_called()
        assert "automation.test2" in data.timers

    def test_schedule_resume_stores_timer_for_correct_entity(self) -> None:
        """Test schedule_resume stores timer under the correct entity_id.

        Catches mutation: data.timers[entity_id] = ... -> data.timers[None] = ...
        """
        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_unsub = MagicMock()
            mock_track.return_value = mock_unsub
            schedule_resume(mock_hass, data, "automation.specific_entity", resume_at)

        assert "automation.specific_entity" in data.timers
        assert data.timers["automation.specific_entity"] == mock_unsub

    def test_schedule_resume_passes_callable_callback_to_tracker(self) -> None:
        """Test schedule_resume passes a callable callback to async_track_point_in_time.

        Catches mutation: async_track_point_in_time(hass, on_timer, ...) ->
                          async_track_point_in_time(hass, None, ...)
        """
        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            schedule_resume(mock_hass, data, "automation.test", resume_at)

            # Verify callback argument is callable (not None)
            mock_track.assert_called_once()
            call_args = mock_track.call_args
            callback_arg = call_args[0][1]  # Second positional arg is the callback
            assert callback_arg is not None
            assert callable(callback_arg)

    def test_schedule_resume_callback_creates_resume_task(self) -> None:
        """Test the callback passed to async_track_point_in_time creates async_resume task.

        Catches mutation by verifying the callback behavior is correct.
        """
        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        captured_callback = None

        def capture_callback(hass, callback, time):
            nonlocal captured_callback
            captured_callback = callback
            return MagicMock()

        with patch(
            "custom_components.autosnooze.coordinator.async_track_point_in_time",
            side_effect=capture_callback,
        ):
            schedule_resume(mock_hass, data, "automation.test", resume_at)

        # Invoke the callback and verify it creates a task
        assert captured_callback is not None
        captured_callback(now)  # Simulate timer firing
        mock_hass.async_create_task.assert_called_once()

    def test_schedule_resume_passes_correct_resume_time(self) -> None:
        """Test schedule_resume passes the correct resume_at time.

        Catches mutation: async_track_point_in_time(hass, callback, resume_at) ->
                          async_track_point_in_time(hass, callback, None)
        """
        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=3, minutes=30)

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            schedule_resume(mock_hass, data, "automation.test", resume_at)

            # Verify resume_at time is passed correctly
            call_args = mock_track.call_args
            time_arg = call_args[0][2]  # Third positional arg is the time
            assert time_arg == resume_at


class TestScheduleDisableMutations:
    """Mutation-killing tests for schedule_disable function."""

    def test_schedule_disable_cancels_timer_for_correct_entity(self) -> None:
        """Test schedule_disable cancels only the specified entity's scheduled timer.

        Catches mutation: cancel_scheduled_timer(data, entity_id) -> cancel_scheduled_timer(data, None)
        """
        from custom_components.autosnooze.coordinator import schedule_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        mock_cancel_1 = MagicMock()
        mock_cancel_2 = MagicMock()
        data.scheduled_timers["automation.test1"] = mock_cancel_1
        data.scheduled_timers["automation.test2"] = mock_cancel_2

        now = datetime.now(UTC)
        scheduled = ScheduledSnooze(
            entity_id="automation.test1",
            friendly_name="Test 1",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            schedule_disable(mock_hass, data, "automation.test1", scheduled)

        # Only test1's scheduled timer should be cancelled
        mock_cancel_1.assert_called_once()
        mock_cancel_2.assert_not_called()
        assert "automation.test2" in data.scheduled_timers

    def test_schedule_disable_stores_timer_for_correct_entity(self) -> None:
        """Test schedule_disable stores scheduled timer under the correct entity_id."""
        from custom_components.autosnooze.coordinator import schedule_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        scheduled = ScheduledSnooze(
            entity_id="automation.specific_entity",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_unsub = MagicMock()
            mock_track.return_value = mock_unsub
            schedule_disable(mock_hass, data, "automation.specific_entity", scheduled)

        assert "automation.specific_entity" in data.scheduled_timers
        assert data.scheduled_timers["automation.specific_entity"] == mock_unsub

    def test_schedule_disable_passes_callable_callback_to_tracker(self) -> None:
        """Test schedule_disable passes a callable callback to async_track_point_in_time.

        Catches mutations:
        - async_track_point_in_time(hass, on_disable_timer, ...) -> async_track_point_in_time(hass, None, ...)
        - async_track_point_in_time(hass, ...) -> async_track_point_in_time(None, ...)
        """
        from custom_components.autosnooze.coordinator import schedule_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        scheduled = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            schedule_disable(mock_hass, data, "automation.test", scheduled)

            # Verify callback argument is callable (not None)
            mock_track.assert_called_once()
            call_args = mock_track.call_args
            hass_arg = call_args[0][0]  # First positional arg is hass
            callback_arg = call_args[0][1]  # Second positional arg is the callback
            assert hass_arg is mock_hass
            assert callback_arg is not None
            assert callable(callback_arg)

    def test_schedule_disable_passes_correct_disable_time(self) -> None:
        """Test schedule_disable passes the correct disable_at time.

        Catches mutations:
        - async_track_point_in_time(hass, callback, scheduled.disable_at) ->
          async_track_point_in_time(hass, callback, None)
        - async_track_point_in_time(hass, callback, scheduled.disable_at) ->
          async_track_point_in_time(hass, callback, )
        """
        from custom_components.autosnooze.coordinator import schedule_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=2, minutes=15)
        scheduled = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=disable_at,
            resume_at=now + timedelta(hours=4),
        )

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            schedule_disable(mock_hass, data, "automation.test", scheduled)

            # Verify disable_at time is passed correctly
            call_args = mock_track.call_args
            time_arg = call_args[0][2]  # Third positional arg is the time
            assert time_arg == disable_at

    def test_schedule_disable_callback_creates_execute_task(self) -> None:
        """Test the callback passed to async_track_point_in_time creates task.

        Catches mutation by verifying callback behavior is correct.
        """
        from custom_components.autosnooze.coordinator import schedule_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        scheduled = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        captured_callback = None

        def capture_callback(hass, callback, time):
            nonlocal captured_callback
            captured_callback = callback
            return MagicMock()

        with patch(
            "custom_components.autosnooze.coordinator.async_track_point_in_time",
            side_effect=capture_callback,
        ):
            schedule_disable(mock_hass, data, "automation.test", scheduled)

        # Invoke the callback and verify it creates a task
        assert captured_callback is not None
        captured_callback(now)  # Simulate timer firing
        mock_hass.async_create_task.assert_called_once()


class TestCancelScheduledMutations:
    """Mutation-killing tests for cancel scheduled functions."""

    @pytest.mark.asyncio
    async def test_cancel_scheduled_removes_correct_entity(self) -> None:
        """Test async_cancel_scheduled removes only the specified entity.

        Catches mutation: data.scheduled.pop(entity_id, None) -> data.scheduled.pop(None, None)
        """
        from custom_components.autosnooze.coordinator import async_cancel_scheduled
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        for entity_id in ["automation.test1", "automation.test2"]:
            data.scheduled[entity_id] = ScheduledSnooze(
                entity_id=entity_id,
                friendly_name=entity_id,
                disable_at=now + timedelta(hours=1),
                resume_at=now + timedelta(hours=2),
            )

        await async_cancel_scheduled(mock_hass, data, "automation.test1")

        assert "automation.test1" not in data.scheduled
        assert "automation.test2" in data.scheduled

    @pytest.mark.asyncio
    async def test_cancel_scheduled_handles_missing_entity(self) -> None:
        """Test async_cancel_scheduled handles entity not in scheduled dict.

        Catches mutation: data.scheduled.pop(entity_id, None) -> data.scheduled.pop(entity_id, )
        """
        from custom_components.autosnooze.coordinator import async_cancel_scheduled

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        # Should not raise even though entity is not scheduled
        await async_cancel_scheduled(mock_hass, data, "automation.not_scheduled")

    @pytest.mark.asyncio
    async def test_cancel_scheduled_batch_removes_correct_entities(self) -> None:
        """Test async_cancel_scheduled_batch removes only the specified entities."""
        from custom_components.autosnooze.coordinator import async_cancel_scheduled_batch
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        for entity_id in ["automation.test1", "automation.test2", "automation.test3"]:
            data.scheduled[entity_id] = ScheduledSnooze(
                entity_id=entity_id,
                friendly_name=entity_id,
                disable_at=now + timedelta(hours=1),
                resume_at=now + timedelta(hours=2),
            )

        await async_cancel_scheduled_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        assert "automation.test1" not in data.scheduled
        assert "automation.test2" not in data.scheduled
        assert "automation.test3" in data.scheduled


class TestExecuteScheduledDisableMutations:
    """Mutation-killing tests for async_execute_scheduled_disable."""

    @pytest.mark.asyncio
    async def test_execute_scheduled_disable_removes_from_scheduled(self) -> None:
        """Test execute_scheduled_disable removes entity from scheduled dict."""
        from custom_components.autosnooze.coordinator import async_execute_scheduled_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        for entity_id in ["automation.test1", "automation.test2"]:
            data.scheduled[entity_id] = ScheduledSnooze(
                entity_id=entity_id,
                friendly_name=entity_id,
                disable_at=now,
                resume_at=now + timedelta(hours=1),
            )

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(
                mock_hass, data, "automation.test1", now + timedelta(hours=1)
            )

        # Only test1 should be moved to paused
        assert "automation.test1" not in data.scheduled
        assert "automation.test1" in data.paused
        assert "automation.test2" in data.scheduled

    @pytest.mark.asyncio
    async def test_execute_scheduled_disable_adds_to_paused(self) -> None:
        """Test execute_scheduled_disable adds entity to paused dict."""
        from custom_components.autosnooze.coordinator import async_execute_scheduled_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=2)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now,
            resume_at=resume_at,
        )

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(
                mock_hass, data, "automation.test", resume_at
            )

        assert "automation.test" in data.paused
        assert data.paused["automation.test"].entity_id == "automation.test"
        assert data.paused["automation.test"].resume_at == resume_at

    @pytest.mark.asyncio
    async def test_execute_scheduled_disable_uses_scheduled_friendly_name(self) -> None:
        """Test that friendly_name from scheduled entry is used, not None.

        Catches mutation: friendly_name = scheduled.friendly_name if scheduled else ... -> None
        """
        from custom_components.autosnooze.coordinator import async_execute_scheduled_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=2)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="My Friendly Name",
            disable_at=now,
            resume_at=resume_at,
        )

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(
                mock_hass, data, "automation.test", resume_at
            )

        assert data.paused["automation.test"].friendly_name == "My Friendly Name"

    @pytest.mark.asyncio
    async def test_execute_scheduled_disable_uses_disable_at_from_scheduled(self) -> None:
        """Test that disable_at from scheduled entry is preserved in paused entry."""
        from custom_components.autosnooze.coordinator import async_execute_scheduled_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        disable_at = now + timedelta(minutes=30)
        resume_at = now + timedelta(hours=2)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=disable_at,
            resume_at=resume_at,
        )

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(
                mock_hass, data, "automation.test", resume_at
            )

        assert data.paused["automation.test"].disable_at == disable_at

    @pytest.mark.asyncio
    async def test_execute_scheduled_disable_calls_schedule_resume_with_correct_args(
        self,
    ) -> None:
        """Test schedule_resume is called with the correct entity_id.

        Catches mutation: schedule_resume(hass, data, entity_id, ...) -> schedule_resume(hass, data, None, ...)
        """
        from custom_components.autosnooze.coordinator import async_execute_scheduled_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=2)
        data.scheduled["automation.specific"] = ScheduledSnooze(
            entity_id="automation.specific",
            friendly_name="Test",
            disable_at=now,
            resume_at=resume_at,
        )

        with patch("custom_components.autosnooze.coordinator.schedule_resume") as mock_schedule:
            await async_execute_scheduled_disable(
                mock_hass, data, "automation.specific", resume_at
            )

        mock_schedule.assert_called_once()
        call_args = mock_schedule.call_args
        assert call_args[0][2] == "automation.specific"  # entity_id is 3rd arg
        assert call_args[0][3] == resume_at  # resume_at is 4th arg


# =============================================================================
# Boundary Condition Tests
# =============================================================================


class TestBoundaryConditions:
    """Tests for boundary conditions to catch <= vs < mutations."""

    @pytest.mark.asyncio
    async def test_pause_resume_time_in_past_is_rejected(self) -> None:
        """Test that resume_at in the past is rejected.

        Catches mutation: resume_at_dt <= now -> resume_at_dt < now
        """
        from custom_components.autosnooze.services import async_pause_automations
        from homeassistant.exceptions import ServiceValidationError

        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now - timedelta(seconds=1)

        with pytest.raises(ServiceValidationError):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                resume_at_dt=resume_at,
            )

    @pytest.mark.asyncio
    async def test_pause_disable_time_equal_to_resume_is_rejected(self) -> None:
        """Test that disable_at exactly equal to resume_at is rejected.

        Catches mutation: disable_at >= resume_at_dt -> disable_at > resume_at_dt
        """
        from custom_components.autosnooze.services import async_pause_automations
        from homeassistant.exceptions import ServiceValidationError

        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        future_time = now + timedelta(hours=1)

        with pytest.raises(ServiceValidationError):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                disable_at=future_time,
                resume_at_dt=future_time,  # Same as disable_at
            )


class TestAsyncSaveMutations:
    """Mutation-killing tests for async_save function."""

    @pytest.mark.asyncio
    async def test_save_returns_true_when_store_is_none(self) -> None:
        """Test async_save returns True when store is None."""
        from custom_components.autosnooze.coordinator import async_save

        data = AutomationPauseData(store=None)
        result = await async_save(data)
        assert result is True

    @pytest.mark.asyncio
    async def test_save_returns_true_on_success(self) -> None:
        """Test async_save returns True on successful save."""
        from custom_components.autosnooze.coordinator import async_save

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        result = await async_save(data)
        assert result is True
        mock_store.async_save.assert_called_once()

    @pytest.mark.asyncio
    async def test_save_returns_false_on_non_transient_error(self) -> None:
        """Test async_save returns False on non-transient error."""
        from custom_components.autosnooze.coordinator import async_save

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=ValueError("Bad data"))
        data = AutomationPauseData(store=mock_store)

        result = await async_save(data)
        assert result is False

    @pytest.mark.asyncio
    async def test_save_includes_both_paused_and_scheduled_data(self) -> None:
        """Test that save includes both paused and scheduled data."""
        from custom_components.autosnooze.coordinator import async_save
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.paused"] = PausedAutomation(
            entity_id="automation.paused",
            friendly_name="Paused",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )
        data.scheduled["automation.scheduled"] = ScheduledSnooze(
            entity_id="automation.scheduled",
            friendly_name="Scheduled",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        await async_save(data)

        mock_store.async_save.assert_called_once()
        save_data = mock_store.async_save.call_args[0][0]
        assert "paused" in save_data
        assert "scheduled" in save_data
        assert "automation.paused" in save_data["paused"]
        assert "automation.scheduled" in save_data["scheduled"]


class TestValidateStoredEntryMutations:
    """Mutation-killing tests for validate_stored_entry."""

    def test_validate_rejects_non_automation_entity(self) -> None:
        """Test that non-automation entities are rejected."""
        from custom_components.autosnooze.coordinator import validate_stored_entry

        result = validate_stored_entry(
            "light.my_light",
            {"resume_at": "2024-01-01T00:00:00Z", "paused_at": "2024-01-01T00:00:00Z"},
            "paused",
        )
        assert result is False

    def test_validate_accepts_valid_automation_entity(self) -> None:
        """Test that valid automation entities are accepted."""
        from custom_components.autosnooze.coordinator import validate_stored_entry

        result = validate_stored_entry(
            "automation.valid",
            {"resume_at": "2024-01-01T00:00:00Z", "paused_at": "2024-01-01T00:00:00Z"},
            "paused",
        )
        assert result is True

    def test_validate_rejects_non_dict_data(self) -> None:
        """Test that non-dict entry data is rejected."""
        from custom_components.autosnooze.coordinator import validate_stored_entry

        result = validate_stored_entry("automation.test", "not a dict", "paused")
        assert result is False

    def test_validate_rejects_missing_required_fields(self) -> None:
        """Test that missing required fields are rejected."""
        from custom_components.autosnooze.coordinator import validate_stored_entry

        # Missing paused_at for paused entry
        result = validate_stored_entry(
            "automation.test",
            {"resume_at": "2024-01-01T00:00:00Z"},
            "paused",
        )
        assert result is False

    def test_validate_scheduled_rejects_resume_before_disable(self) -> None:
        """Test that scheduled entry with resume_at <= disable_at is rejected."""
        from custom_components.autosnooze.coordinator import validate_stored_entry

        result = validate_stored_entry(
            "automation.test",
            {
                "disable_at": "2024-01-01T12:00:00Z",
                "resume_at": "2024-01-01T11:00:00Z",  # Before disable_at
            },
            "scheduled",
        )
        assert result is False


class TestUnloadedCheckMutations:
    """Tests to verify data.unloaded checks work correctly."""

    @pytest.mark.asyncio
    async def test_resume_returns_early_when_unloaded(self) -> None:
        """Test async_resume returns early when data.unloaded is True."""
        from custom_components.autosnooze.coordinator import async_resume

        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.unloaded = True

        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

        await async_resume(mock_hass, data, "automation.test")

        # Should not call service when unloaded
        mock_hass.services.async_call.assert_not_called()
        # Entity should still be in paused dict
        assert "automation.test" in data.paused

    @pytest.mark.asyncio
    async def test_resume_batch_returns_early_when_unloaded(self) -> None:
        """Test async_resume_batch returns early when data.unloaded is True."""
        from custom_components.autosnooze.coordinator import async_resume_batch

        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.unloaded = True

        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

        await async_resume_batch(mock_hass, data, ["automation.test"])

        mock_hass.services.async_call.assert_not_called()
        assert "automation.test" in data.paused

    @pytest.mark.asyncio
    async def test_cancel_scheduled_returns_early_when_unloaded(self) -> None:
        """Test async_cancel_scheduled returns early when data.unloaded is True."""
        from custom_components.autosnooze.coordinator import async_cancel_scheduled
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.unloaded = True

        now = datetime.now(UTC)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        await async_cancel_scheduled(mock_hass, data, "automation.test")

        # Entity should still be in scheduled dict
        assert "automation.test" in data.scheduled
        mock_store.async_save.assert_not_called()

    @pytest.mark.asyncio
    async def test_execute_scheduled_disable_returns_early_when_unloaded(self) -> None:
        """Test async_execute_scheduled_disable returns early when unloaded."""
        from custom_components.autosnooze.coordinator import async_execute_scheduled_disable
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.unloaded = True

        now = datetime.now(UTC)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now,
            resume_at=now + timedelta(hours=1),
        )

        await async_execute_scheduled_disable(
            mock_hass, data, "automation.test", now + timedelta(hours=1)
        )

        mock_hass.services.async_call.assert_not_called()
        assert "automation.test" in data.scheduled
        assert "automation.test" not in data.paused

    @pytest.mark.asyncio
    async def test_cancel_scheduled_batch_returns_early_when_unloaded(self) -> None:
        """Test async_cancel_scheduled_batch returns early when unloaded."""
        from custom_components.autosnooze.coordinator import async_cancel_scheduled_batch
        from custom_components.autosnooze.models import ScheduledSnooze

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.unloaded = True

        now = datetime.now(UTC)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        await async_cancel_scheduled_batch(mock_hass, data, ["automation.test"])

        assert "automation.test" in data.scheduled
        mock_store.async_save.assert_not_called()


# =============================================================================
# Use Scheduled Logic Tests
# =============================================================================


class TestUseScheduledLogic:
    """Tests to catch mutations in use_scheduled logic."""

    @pytest.mark.asyncio
    async def test_use_scheduled_false_when_disable_at_is_none(self) -> None:
        """Test use_scheduled is False when disable_at is None.

        Catches mutation: disable_at is not None and ... -> disable_at is not None or ...
        """
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=2)

        with (
            patch(
                "custom_components.autosnooze.services.async_set_automation_state",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("custom_components.autosnooze.services.schedule_resume"),
            patch("custom_components.autosnooze.services.schedule_disable") as mock_schedule_disable,
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                resume_at_dt=resume_at,
                disable_at=None,  # No disable_at
            )

        # Should NOT call schedule_disable since disable_at is None
        mock_schedule_disable.assert_not_called()
        # Should be in paused, not scheduled
        assert "automation.test" in data.paused
        assert "automation.test" not in data.scheduled

    @pytest.mark.asyncio
    async def test_use_scheduled_false_when_disable_at_in_past(self) -> None:
        """Test use_scheduled is False when disable_at is in the past.

        Catches mutation: disable_at > now -> disable_at >= now
        """
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        disable_at = now - timedelta(seconds=10)  # In the past
        resume_at = now + timedelta(hours=2)

        with (
            patch(
                "custom_components.autosnooze.services.async_set_automation_state",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("custom_components.autosnooze.services.schedule_resume"),
            patch("custom_components.autosnooze.services.schedule_disable") as mock_schedule_disable,
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                resume_at_dt=resume_at,
                disable_at=disable_at,  # In the past
            )

        # Should NOT call schedule_disable since disable_at is in the past
        mock_schedule_disable.assert_not_called()
        # Should be in paused, not scheduled
        assert "automation.test" in data.paused
        assert "automation.test" not in data.scheduled

    @pytest.mark.asyncio
    async def test_use_scheduled_true_when_disable_at_in_future(self) -> None:
        """Test use_scheduled is True when disable_at is in the future."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=1)  # In the future
        resume_at = now + timedelta(hours=2)

        with (
            patch("custom_components.autosnooze.services.schedule_disable") as mock_schedule_disable,
            patch("custom_components.autosnooze.services.async_set_automation_state"),
            patch("custom_components.autosnooze.services.schedule_resume"),
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                resume_at_dt=resume_at,
                disable_at=disable_at,  # In the future
            )

        # Should call schedule_disable since disable_at is in the future
        mock_schedule_disable.assert_called_once()
        # Should be in scheduled, not paused
        assert "automation.test" in data.scheduled


class TestServiceErrorMessages:
    """Tests to verify error messages are not None."""

    @pytest.mark.asyncio
    async def test_zero_duration_error_has_message(self) -> None:
        """Test that zero duration error has a message.

        Catches mutation: "Duration must be..." -> None
        """
        from custom_components.autosnooze.services import async_pause_automations
        from homeassistant.exceptions import ServiceValidationError

        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        try:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                days=0,
                hours=0,
                minutes=0,
            )
            pytest.fail("Expected ServiceValidationError")
        except ServiceValidationError as err:
            # Verify error has a message
            assert str(err) is not None
            assert len(str(err)) > 0

    @pytest.mark.asyncio
    async def test_not_automation_error_has_message(self) -> None:
        """Test that non-automation entity error has a message.

        Catches mutation: f"{entity_id} is not an automation" -> None
        """
        from custom_components.autosnooze.services import async_pause_automations
        from homeassistant.exceptions import ServiceValidationError

        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        try:
            await async_pause_automations(
                mock_hass,
                data,
                ["light.not_automation"],
                hours=1,
            )
            pytest.fail("Expected ServiceValidationError")
        except ServiceValidationError as err:
            assert str(err) is not None
            assert len(str(err)) > 0

    @pytest.mark.asyncio
    async def test_resume_time_past_error_has_message(self) -> None:
        """Test that resume time in past error has a message.

        Catches mutation: "Resume time must be in the future" -> None
        """
        from custom_components.autosnooze.services import async_pause_automations
        from homeassistant.exceptions import ServiceValidationError

        mock_hass = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now - timedelta(hours=1)

        try:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                resume_at_dt=resume_at,
            )
            pytest.fail("Expected ServiceValidationError")
        except ServiceValidationError as err:
            assert str(err) is not None
            assert len(str(err)) > 0


class TestPausedAutomationCreation:
    """Tests for PausedAutomation creation in services."""

    @pytest.mark.asyncio
    async def test_paused_automation_stores_correct_entity_id(self) -> None:
        """Test that PausedAutomation is created with correct entity_id.

        Catches mutation: entity_id=entity_id -> entity_id=None
        """
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with (
            patch(
                "custom_components.autosnooze.services.async_set_automation_state",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("custom_components.autosnooze.services.schedule_resume"),
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.specific_entity"],
                hours=1,
            )

        assert "automation.specific_entity" in data.paused
        paused = data.paused["automation.specific_entity"]
        assert paused.entity_id == "automation.specific_entity"

    @pytest.mark.asyncio
    async def test_paused_automation_stores_correct_friendly_name(self) -> None:
        """Test that PausedAutomation stores the correct friendly_name."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(
            attributes={"friendly_name": "My Special Automation"}
        )
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with (
            patch(
                "custom_components.autosnooze.services.async_set_automation_state",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("custom_components.autosnooze.services.schedule_resume"),
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                hours=1,
            )

        assert data.paused["automation.test"].friendly_name == "My Special Automation"

    @pytest.mark.asyncio
    async def test_paused_automation_stores_correct_days_hours_minutes(self) -> None:
        """Test that PausedAutomation stores correct duration values."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with (
            patch(
                "custom_components.autosnooze.services.async_set_automation_state",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("custom_components.autosnooze.services.schedule_resume"),
        ):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                days=2,
                hours=5,
                minutes=30,
            )

        paused = data.paused["automation.test"]
        assert paused.days == 2
        assert paused.hours == 5
        assert paused.minutes == 30


class TestScheduledSnoozeCreation:
    """Tests for ScheduledSnooze creation in services."""

    @pytest.mark.asyncio
    async def test_scheduled_snooze_stores_correct_entity_id(self) -> None:
        """Test that ScheduledSnooze is created with correct entity_id."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=1)
        resume_at = now + timedelta(hours=2)

        with patch("custom_components.autosnooze.services.schedule_disable"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.specific"],
                resume_at_dt=resume_at,
                disable_at=disable_at,
            )

        assert "automation.specific" in data.scheduled
        scheduled = data.scheduled["automation.specific"]
        assert scheduled.entity_id == "automation.specific"

    @pytest.mark.asyncio
    async def test_scheduled_snooze_stores_correct_times(self) -> None:
        """Test that ScheduledSnooze stores correct disable_at and resume_at."""
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=1)
        resume_at = now + timedelta(hours=3)

        with patch("custom_components.autosnooze.services.schedule_disable"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                resume_at_dt=resume_at,
                disable_at=disable_at,
            )

        scheduled = data.scheduled["automation.test"]
        assert scheduled.disable_at == disable_at
        assert scheduled.resume_at == resume_at
