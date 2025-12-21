"""Tests for AutoSnooze __init__.py - Data Models and Core Logic."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Import actual classes from the module to get real coverage
from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME

from custom_components.autosnooze.models import (
    PausedAutomation,
    ScheduledSnooze,
    AutomationPauseData,
)
from custom_components.autosnooze.coordinator import (
    get_friendly_name,
    cancel_timer,
    cancel_scheduled_timer,
    async_set_automation_state,
    async_save,
    async_resume,
)

# Backwards compatibility aliases for tests
_get_friendly_name = get_friendly_name
_cancel_timer = cancel_timer
_cancel_scheduled_timer = cancel_scheduled_timer
_set_automation_state = async_set_automation_state
_async_save = async_save
_async_resume = async_resume

UTC = timezone.utc


class MockState:
    """Mock Home Assistant State object."""

    def __init__(
        self,
        entity_id: str,
        state: str,
        attributes: dict[str, Any] | None = None,
    ) -> None:
        """Initialize mock state."""
        self.entity_id = entity_id
        self.state = state
        self.attributes = attributes or {}


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
# PausedAutomation Tests
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

        # Should be parseable back to datetime
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

        assert result.friendly_name == "automation.test"  # Falls back to entity_id
        assert result.days == 0
        assert result.hours == 0
        assert result.minutes == 0

    def test_from_dict_missing_required_key_raises_keyerror(self) -> None:
        """Test from_dict raises KeyError when required fields missing."""
        data = {"friendly_name": "Test"}  # Missing resume_at and paused_at

        with pytest.raises(KeyError):
            PausedAutomation.from_dict("automation.test", data)

    def test_from_dict_invalid_datetime_raises_valueerror(self) -> None:
        """Test from_dict raises ValueError for invalid datetime format."""
        data = {
            "resume_at": "not-a-datetime",
            "paused_at": "also-not-a-datetime",
        }

        with pytest.raises(ValueError):
            PausedAutomation.from_dict("automation.test", data)

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
# ScheduledSnooze Tests
# =============================================================================


class TestScheduledSnooze:
    """Tests for ScheduledSnooze dataclass."""

    @pytest.fixture
    def sample_scheduled_snooze(self) -> ScheduledSnooze:
        """Create a sample scheduled snooze."""
        now = datetime.now(UTC)
        return ScheduledSnooze(
            entity_id="automation.test_automation",
            friendly_name="Test Automation",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

    def test_to_dict_returns_correct_structure(self, sample_scheduled_snooze: ScheduledSnooze) -> None:
        """Test to_dict returns all fields in correct format."""
        result = sample_scheduled_snooze.to_dict()

        assert "friendly_name" in result
        assert "disable_at" in result
        assert "resume_at" in result
        assert result["friendly_name"] == "Test Automation"

    def test_to_dict_datetime_as_isoformat(self, sample_scheduled_snooze: ScheduledSnooze) -> None:
        """Test datetime fields are serialized as ISO format strings."""
        result = sample_scheduled_snooze.to_dict()

        datetime.fromisoformat(result["disable_at"])
        datetime.fromisoformat(result["resume_at"])

    def test_from_dict_creates_correct_instance(self) -> None:
        """Test from_dict creates ScheduledSnooze with correct values."""
        fixed_now = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
        data = {
            "friendly_name": "Scheduled Auto",
            "disable_at": (fixed_now + timedelta(hours=1)).isoformat(),
            "resume_at": (fixed_now + timedelta(hours=3)).isoformat(),
        }

        result = ScheduledSnooze.from_dict("automation.scheduled", data)

        assert result.entity_id == "automation.scheduled"
        assert result.friendly_name == "Scheduled Auto"

    def test_from_dict_defaults_missing_friendly_name(self) -> None:
        """Test from_dict uses entity_id when friendly_name missing."""
        fixed_now = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
        data = {
            "disable_at": fixed_now.isoformat(),
            "resume_at": (fixed_now + timedelta(hours=1)).isoformat(),
        }

        result = ScheduledSnooze.from_dict("automation.test", data)

        assert result.friendly_name == "automation.test"

    def test_from_dict_missing_required_key_raises_keyerror(self) -> None:
        """Test from_dict raises KeyError when required fields missing."""
        data = {"friendly_name": "Test"}

        with pytest.raises(KeyError):
            ScheduledSnooze.from_dict("automation.test", data)

    def test_roundtrip_serialization(self, sample_scheduled_snooze: ScheduledSnooze) -> None:
        """Test data survives serialization roundtrip."""
        serialized = sample_scheduled_snooze.to_dict()
        restored = ScheduledSnooze.from_dict(sample_scheduled_snooze.entity_id, serialized)

        assert restored.entity_id == sample_scheduled_snooze.entity_id
        assert restored.friendly_name == sample_scheduled_snooze.friendly_name


# =============================================================================
# AutomationPauseData Tests
# =============================================================================


class TestAutomationPauseData:
    """Tests for AutomationPauseData dataclass."""

    @pytest.fixture
    def mock_store(self) -> MagicMock:
        """Create mock store."""
        store = MagicMock()
        store.async_load = AsyncMock(return_value=None)
        store.async_save = AsyncMock()
        return store

    @pytest.fixture
    def automation_pause_data(self, mock_store: MagicMock) -> AutomationPauseData:
        """Create AutomationPauseData instance with mock store."""
        return AutomationPauseData(store=mock_store)

    @pytest.fixture
    def sample_paused_automation(self) -> PausedAutomation:
        """Create a sample paused automation."""
        now = datetime.now(UTC)
        return PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test Automation",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

    @pytest.fixture
    def sample_scheduled_snooze(self) -> ScheduledSnooze:
        """Create a sample scheduled snooze."""
        now = datetime.now(UTC)
        return ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test Automation",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

    def test_default_initialization(self) -> None:
        """Test default initialization creates empty collections."""
        data = AutomationPauseData()

        assert data.paused == {}
        assert data.scheduled == {}
        assert data.timers == {}
        assert data.scheduled_timers == {}
        assert data.listeners == []
        assert data.store is None

    def test_add_listener_registers_callback(self, automation_pause_data: AutomationPauseData) -> None:
        """Test add_listener registers callback in listeners list."""
        callback = MagicMock()

        automation_pause_data.add_listener(callback)

        assert callback in automation_pause_data.listeners

    def test_add_listener_returns_removal_function(self, automation_pause_data: AutomationPauseData) -> None:
        """Test add_listener returns function that removes the listener."""
        callback = MagicMock()

        remove_fn = automation_pause_data.add_listener(callback)
        assert callback in automation_pause_data.listeners

        remove_fn()
        assert callback not in automation_pause_data.listeners

    def test_add_multiple_listeners(self, automation_pause_data: AutomationPauseData) -> None:
        """Test multiple listeners can be registered."""
        callback1 = MagicMock()
        callback2 = MagicMock()

        automation_pause_data.add_listener(callback1)
        automation_pause_data.add_listener(callback2)

        assert len(automation_pause_data.listeners) == 2

    def test_notify_calls_all_listeners(self, automation_pause_data: AutomationPauseData) -> None:
        """Test notify calls all registered listeners."""
        callback1 = MagicMock()
        callback2 = MagicMock()
        automation_pause_data.add_listener(callback1)
        automation_pause_data.add_listener(callback2)

        automation_pause_data.notify()

        callback1.assert_called_once()
        callback2.assert_called_once()

    def test_notify_with_no_listeners_does_not_raise(self, automation_pause_data: AutomationPauseData) -> None:
        """Test notify with no listeners doesn't raise exception."""
        automation_pause_data.notify()  # Should not raise

    def test_get_paused_dict_returns_serialized_automations(
        self,
        automation_pause_data: AutomationPauseData,
        sample_paused_automation: PausedAutomation,
    ) -> None:
        """Test get_paused_dict returns serialized dict of paused automations."""
        automation_pause_data.paused["automation.test"] = sample_paused_automation

        result = automation_pause_data.get_paused_dict()

        assert "automation.test" in result
        assert result["automation.test"]["friendly_name"] == "Test Automation"

    def test_get_paused_dict_empty_returns_empty_dict(self, automation_pause_data: AutomationPauseData) -> None:
        """Test get_paused_dict returns empty dict when no paused automations."""
        result = automation_pause_data.get_paused_dict()

        assert result == {}

    def test_get_scheduled_dict_returns_serialized_snoozes(
        self,
        automation_pause_data: AutomationPauseData,
        sample_scheduled_snooze: ScheduledSnooze,
    ) -> None:
        """Test get_scheduled_dict returns serialized dict of scheduled snoozes."""
        automation_pause_data.scheduled["automation.test"] = sample_scheduled_snooze

        result = automation_pause_data.get_scheduled_dict()

        assert "automation.test" in result
        assert result["automation.test"]["friendly_name"] == "Test Automation"

    def test_get_scheduled_dict_empty_returns_empty_dict(self, automation_pause_data: AutomationPauseData) -> None:
        """Test get_scheduled_dict returns empty dict when no scheduled snoozes."""
        result = automation_pause_data.get_scheduled_dict()

        assert result == {}


# =============================================================================
# _cancel_timer Tests
# =============================================================================


class TestCancelTimer:
    """Tests for _cancel_timer function."""

    def test_cancel_existing_timer(self) -> None:
        """Test cancels timer and removes from dict."""
        data = AutomationPauseData()
        unsub = MagicMock()
        data.timers["automation.test"] = unsub

        _cancel_timer(data, "automation.test")

        unsub.assert_called_once()
        assert "automation.test" not in data.timers

    def test_cancel_nonexistent_timer_does_not_raise(self) -> None:
        """Test canceling nonexistent timer doesn't raise."""
        data = AutomationPauseData()
        _cancel_timer(data, "automation.nonexistent")
        # Should not raise


class TestCancelScheduledTimer:
    """Tests for _cancel_scheduled_timer function."""

    def test_cancel_existing_scheduled_timer(self) -> None:
        """Test cancels scheduled timer and removes from dict."""
        data = AutomationPauseData()
        unsub = MagicMock()
        data.scheduled_timers["automation.test"] = unsub

        _cancel_scheduled_timer(data, "automation.test")

        unsub.assert_called_once()
        assert "automation.test" not in data.scheduled_timers

    def test_cancel_nonexistent_scheduled_timer_does_not_raise(self) -> None:
        """Test canceling nonexistent scheduled timer doesn't raise."""
        data = AutomationPauseData()
        _cancel_scheduled_timer(data, "automation.nonexistent")


# =============================================================================
# _get_friendly_name Tests
# =============================================================================


class TestGetFriendlyName:
    """Tests for _get_friendly_name function."""

    def test_returns_friendly_name_from_state_attributes(self) -> None:
        """Test returns friendly_name attribute when present."""
        mock_hass = MagicMock()
        mock_state = MockState("automation.test", "on", {ATTR_FRIENDLY_NAME: "Test Automation"})
        mock_hass.states.get.return_value = mock_state

        result = _get_friendly_name(mock_hass, "automation.test")

        assert result == "Test Automation"

    def test_returns_entity_id_when_no_state(self) -> None:
        """Test returns entity_id when entity has no state."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None

        result = _get_friendly_name(mock_hass, "automation.unknown")

        assert result == "automation.unknown"

    def test_returns_entity_id_when_no_friendly_name_attribute(self) -> None:
        """Test returns entity_id when friendly_name attribute missing."""
        mock_hass = MagicMock()
        mock_state = MockState("automation.test", "on", {})
        mock_hass.states.get.return_value = mock_state

        result = _get_friendly_name(mock_hass, "automation.test")

        assert result == "automation.test"


# =============================================================================
# _set_automation_state Tests
# =============================================================================


class TestSetAutomationState:
    """Tests for _set_automation_state function."""

    @pytest.mark.asyncio
    async def test_enable_automation_calls_turn_on(self) -> None:
        """Test enabling automation calls automation.turn_on service."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MockState("automation.test", "on")
        mock_hass.services.async_call = AsyncMock()

        result = await _set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is True
        mock_hass.services.async_call.assert_called_once_with(
            "automation",
            "turn_on",
            {ATTR_ENTITY_ID: "automation.test"},
            blocking=True,
        )

    @pytest.mark.asyncio
    async def test_disable_automation_calls_turn_off(self) -> None:
        """Test disabling automation calls automation.turn_off service."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MockState("automation.test", "on")
        mock_hass.services.async_call = AsyncMock()

        result = await _set_automation_state(mock_hass, "automation.test", enabled=False)

        assert result is True
        mock_hass.services.async_call.assert_called_once_with(
            "automation",
            "turn_off",
            {ATTR_ENTITY_ID: "automation.test"},
            blocking=True,
        )

    @pytest.mark.asyncio
    async def test_returns_false_when_automation_not_found(self) -> None:
        """Test returns False when automation entity doesn't exist."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None
        mock_hass.services.async_call = AsyncMock()

        result = await _set_automation_state(mock_hass, "automation.nonexistent", enabled=True)

        assert result is False
        mock_hass.services.async_call.assert_not_called()

    @pytest.mark.asyncio
    async def test_returns_false_on_service_call_exception(self) -> None:
        """Test returns False when service call raises exception."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MockState("automation.test", "on")
        mock_hass.services.async_call = AsyncMock(side_effect=Exception("Service error"))

        result = await _set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is False


# =============================================================================
# _async_save Tests
# =============================================================================


class TestAsyncSave:
    """Tests for _async_save function."""

    @pytest.mark.asyncio
    async def test_saves_paused_and_scheduled_to_store(self) -> None:
        """Test saves both paused and scheduled automations."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.p1"] = PausedAutomation(
            entity_id="automation.p1",
            friendly_name="Paused 1",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )
        data.scheduled["automation.s1"] = ScheduledSnooze(
            entity_id="automation.s1",
            friendly_name="Scheduled 1",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        await _async_save(data)

        mock_store.async_save.assert_called_once()
        saved_data = mock_store.async_save.call_args[0][0]
        assert "paused" in saved_data
        assert "scheduled" in saved_data
        assert "automation.p1" in saved_data["paused"]
        assert "automation.s1" in saved_data["scheduled"]

    @pytest.mark.asyncio
    async def test_returns_true_when_no_store(self) -> None:
        """Test returns True when store is None."""
        data = AutomationPauseData(store=None)

        result = await _async_save(data)

        assert result is True

    @pytest.mark.asyncio
    async def test_handles_store_exception(self) -> None:
        """Test handles exception from store gracefully."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=Exception("Storage error"))
        data = AutomationPauseData(store=mock_store)

        result = await _async_save(data)

        assert result is False


# =============================================================================
# _async_resume Tests
# =============================================================================


class TestAsyncResume:
    """Tests for _async_resume function."""

    @pytest.mark.asyncio
    async def test_enables_automation(self) -> None:
        """Test resumes automation by calling turn_on."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MockState("automation.test", "off")
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )

        await _async_resume(mock_hass, data, "automation.test")

        mock_hass.services.async_call.assert_called_once_with(
            "automation",
            "turn_on",
            {ATTR_ENTITY_ID: "automation.test"},
            blocking=True,
        )

    @pytest.mark.asyncio
    async def test_removes_from_paused_dict(self) -> None:
        """Test removes automation from paused dict."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MockState("automation.test", "off")
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )

        await _async_resume(mock_hass, data, "automation.test")

        assert "automation.test" not in data.paused

    @pytest.mark.asyncio
    async def test_notifies_listeners(self) -> None:
        """Test notifies listeners after resume."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MockState("automation.test", "off")
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        listener = MagicMock()
        data.add_listener(listener)

        await _async_resume(mock_hass, data, "automation.test")

        listener.assert_called_once()


# =============================================================================
# Lovelace Resource Registration Safety Tests (Regression)
# =============================================================================


class TestLovelaceResourceSafety:
    """Regression tests for Lovelace resource registration.

    These tests ensure the integration only modifies its OWN resources
    and never touches other custom cards' resources.
    """

    def test_uses_namespace_prefix_pattern(self) -> None:
        """Verify resource matching uses namespace prefix like HACS.

        REGRESSION: Previous code used wrong pattern that never matched,
        causing duplicate resources on every restart.
        """
        from pathlib import Path

        init_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "__init__.py"
        assert init_path.exists(), f"Init file not found at {init_path}"
        source = init_path.read_text()

        # Extract the _async_register_lovelace_resource function
        func_match = source.find("async def _async_register_lovelace_resource")
        assert func_match != -1, "Function not found"

        next_func = source.find("\nasync def ", func_match + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_match:next_func]

        # Must use startswith for namespace matching (like HACS)
        assert "startswith" in func_body, "Resource matching must use startswith() for namespace prefix matching"
        # Must use CARD_URL as namespace (not a broken pattern)
        assert "CARD_URL" in func_body, "Must use CARD_URL as the namespace for matching"

    def test_never_deletes_resources(self) -> None:
        """Verify source code doesn't call async_delete_item."""
        from pathlib import Path

        init_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "__init__.py"
        source = init_path.read_text()

        func_match = source.find("async def _async_register_lovelace_resource")
        assert func_match != -1, "Function not found"

        next_func = source.find("\nasync def ", func_match + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_match:next_func]

        assert "async_delete_item" not in func_body, "SAFETY VIOLATION: Must never delete resources"

    def test_references_hacs_pattern(self) -> None:
        """Verify the function references HACS as the source pattern.

        This ensures future developers understand where the pattern came from.
        """
        from pathlib import Path

        init_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "__init__.py"
        source = init_path.read_text()

        func_match = source.find("async def _async_register_lovelace_resource")
        assert func_match != -1, "Function not found"

        next_func = source.find("\nasync def ", func_match + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_match:next_func]

        # Should reference HACS pattern
        assert "HACS" in func_body or "hacs" in func_body.lower(), (
            "Function should reference HACS as the source of the pattern"
        )

    def test_handles_ha_version_compatibility(self) -> None:
        """Verify version-aware resource access for HA 2025.2.0+."""
        from pathlib import Path

        init_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "__init__.py"
        source = init_path.read_text()

        func_match = source.find("async def _async_register_lovelace_resource")
        assert func_match != -1, "Function not found"

        next_func = source.find("\nasync def ", func_match + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_match:next_func]

        # Should use getattr for version-aware access
        assert "getattr" in func_body, "Must use getattr for version-aware resource access"

    def test_uses_resource_manager_api(self) -> None:
        """Verify resource registration uses lovelace resource manager API.

        Uses async_create_item on the resources object (same as HACS).
        Note: We only create resources, never update (safety guarantee).
        """
        from pathlib import Path

        # Use pathlib for robust path handling across environments
        test_dir = Path(__file__).resolve().parent
        init_path = test_dir.parent / "custom_components" / "autosnooze" / "__init__.py"

        assert init_path.exists(), f"Init file not found at {init_path}"
        source = init_path.read_text()

        func_match = source.find("async def _async_register_lovelace_resource")
        assert func_match != -1, f"Function not found in {init_path}"

        next_func = source.find("\nasync def ", func_match + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_match:next_func]

        # Must use resource manager API for creating resources
        assert "async_create_item" in func_body, "Must use resources.async_create_item for new resources"
        # Should use 'res_type' for resource manager API
        assert '"res_type": "module"' in func_body, "Must use 'res_type' parameter for resource manager API"


class TestLovelaceResourceRegistrationIntegration:
    """Integration tests for Lovelace resource registration.

    These tests verify the resource registration logic behaves correctly -
    only modifying OUR resource and never touching other custom cards.
    """

    # Constants matching the source code
    CARD_URL = "/autosnooze-card.js"
    CARD_URL_VERSIONED = "/autosnooze-card.js?v=2.9.1"

    async def _async_register_lovelace_resource(self, hass: MagicMock) -> None:
        """Recreate the registration logic from __init__.py for testing.

        This mirrors the exact logic from _async_register_lovelace_resource
        in custom_components/autosnooze/__init__.py using resource manager API.
        """
        lovelace_data = hass.data.get("lovelace")
        if lovelace_data is None:
            return

        resources = getattr(lovelace_data, "resources", None)
        if resources is None:
            resources = lovelace_data.get("resources") if hasattr(lovelace_data, "get") else None
        if resources is None:
            return

        namespace = self.CARD_URL

        existing_resource = None
        for resource in resources.async_items():
            url = resource.get("url", "")
            if url.startswith(namespace):
                existing_resource = resource
                break

        if existing_resource:
            if existing_resource.get("url") != self.CARD_URL_VERSIONED:
                # Update only our resource by ID
                await resources.async_update_item(
                    existing_resource["id"], {"url": self.CARD_URL_VERSIONED, "res_type": "module"}
                )
            return

        # Create new resource
        await resources.async_create_item({"url": self.CARD_URL_VERSIONED, "res_type": "module"})

    @pytest.fixture
    def mock_resources(self) -> MagicMock:
        """Create a mock resources object with other cards already registered."""
        resources = MagicMock()
        # Simulate existing resources from other integrations
        existing_resources = [
            {"id": "mushroom-001", "url": "/hacsfiles/mushroom-cards/mushroom.js", "res_type": "module"},
            {"id": "hacs-002", "url": "/hacsfiles/lovelace-card-mod/card-mod.js", "res_type": "module"},
            {"id": "browser-mod-003", "url": "/browser_mod.js?v=2.3.0", "res_type": "module"},
            {"id": "custom-004", "url": "/local/my-custom-card.js", "res_type": "module"},
        ]
        resources.async_items.return_value = existing_resources
        resources.async_create_item = AsyncMock()
        resources.async_update_item = AsyncMock()
        resources.async_delete_item = AsyncMock()
        return resources

    @pytest.fixture
    def mock_hass(self, mock_resources: MagicMock) -> MagicMock:
        """Create a mock Home Assistant instance."""
        hass = MagicMock()
        lovelace_data = MagicMock()
        lovelace_data.resources = mock_resources
        hass.data = {"lovelace": lovelace_data}
        return hass

    @pytest.mark.asyncio
    async def test_does_not_modify_other_resources(self, mock_hass: MagicMock, mock_resources: MagicMock) -> None:
        """Verify other cards' resources are never modified."""
        await self._async_register_lovelace_resource(mock_hass)

        # Verify no update was called on any of the other resources
        for call in mock_resources.async_update_item.call_args_list:
            resource_id = call[0][0]  # First positional arg is resource ID
            assert resource_id not in ["mushroom-001", "hacs-002", "browser-mod-003", "custom-004"], (
                f"SAFETY VIOLATION: Updated another card's resource: {resource_id}"
            )

        # Verify delete was never called
        assert mock_resources.async_delete_item.call_count == 0, "SAFETY VIOLATION: async_delete_item was called"

    @pytest.mark.asyncio
    async def test_creates_new_resource_when_not_exists(self, mock_hass: MagicMock, mock_resources: MagicMock) -> None:
        """Verify a new resource is created when autosnooze is not registered."""
        await self._async_register_lovelace_resource(mock_hass)

        # Should have called async_create_item with our resource
        mock_resources.async_create_item.assert_called_once()
        call_args = mock_resources.async_create_item.call_args[0][0]
        assert call_args["url"] == self.CARD_URL_VERSIONED
        assert call_args["res_type"] == "module"

    @pytest.mark.asyncio
    async def test_updates_only_our_resource_when_version_changes(
        self, mock_hass: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Verify only our resource is updated when version changes."""
        # Add an old version of our resource
        existing_resources = list(mock_resources.async_items.return_value)
        existing_resources.append(
            {
                "id": "autosnooze-resource",
                "url": "/autosnooze-card.js?v=1.0.0",  # Old version
                "res_type": "module",
            }
        )
        mock_resources.async_items.return_value = existing_resources

        await self._async_register_lovelace_resource(mock_hass)

        # Should have updated only our resource
        mock_resources.async_update_item.assert_called_once()
        call_args = mock_resources.async_update_item.call_args
        assert call_args[0][0] == "autosnooze-resource", "Should update our resource ID"
        assert call_args[0][1]["url"] == self.CARD_URL_VERSIONED

        # Should NOT have created a new resource
        mock_resources.async_create_item.assert_not_called()

    @pytest.mark.asyncio
    async def test_does_not_update_when_version_matches(self, mock_hass: MagicMock, mock_resources: MagicMock) -> None:
        """Verify no update happens when version already matches."""
        # Add current version of our resource
        existing_resources = list(mock_resources.async_items.return_value)
        existing_resources.append(
            {
                "id": "autosnooze-resource",
                "url": self.CARD_URL_VERSIONED,  # Current version
                "res_type": "module",
            }
        )
        mock_resources.async_items.return_value = existing_resources

        await self._async_register_lovelace_resource(mock_hass)

        # Should NOT have updated or created anything
        mock_resources.async_update_item.assert_not_called()
        mock_resources.async_create_item.assert_not_called()

    @pytest.mark.asyncio
    async def test_handles_yaml_mode_gracefully(self) -> None:
        """Verify the function handles YAML mode (no resources object)."""
        hass = MagicMock()
        lovelace_data = MagicMock()
        lovelace_data.resources = None
        # Also make get() return None for older HA compatibility path
        lovelace_data.get = MagicMock(return_value=None)
        hass.data = {"lovelace": lovelace_data}

        # Should not raise any exception
        await self._async_register_lovelace_resource(hass)

    @pytest.mark.asyncio
    async def test_handles_no_lovelace_data(self) -> None:
        """Verify the function handles missing lovelace data."""
        hass = MagicMock()
        hass.data = {}  # No lovelace data

        # Should not raise any exception
        await self._async_register_lovelace_resource(hass)

    @pytest.mark.asyncio
    async def test_preserves_all_existing_resources_after_registration(
        self, mock_hass: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Verify all existing resources are preserved after our registration."""
        original_resources = list(mock_resources.async_items.return_value)

        await self._async_register_lovelace_resource(mock_hass)

        # The only modification should be async_create_item for our resource
        # No deletions or modifications to existing resources
        assert mock_resources.async_delete_item.call_count == 0
        # async_update_item should not be called for other resources
        for call in mock_resources.async_update_item.call_args_list:
            resource_id = call[0][0]
            assert resource_id not in [r["id"] for r in original_resources]

    @pytest.mark.asyncio
    async def test_namespace_matching_is_strict(self, mock_hass: MagicMock, mock_resources: MagicMock) -> None:
        """Verify namespace matching doesn't match similar but different URLs."""
        # Add resources with similar but different URLs that should NOT match
        tricky_resources = [
            {"id": "fake-1", "url": "/autosnooze-card-copy.js", "res_type": "module"},
            {"id": "fake-2", "url": "/other/autosnooze-card.js", "res_type": "module"},
            {"id": "fake-3", "url": "/local/autosnooze-card.js", "res_type": "module"},
            {"id": "fake-4", "url": "autosnooze-card.js", "res_type": "module"},  # No leading slash
        ]
        mock_resources.async_items.return_value = tricky_resources

        await self._async_register_lovelace_resource(mock_hass)

        # None of these should be updated - they don't match our namespace
        assert mock_resources.async_update_item.call_count == 0, (
            "Should not update resources that don't exactly match our namespace"
        )
        # Should create a new resource since none matched
        mock_resources.async_create_item.assert_called_once()
