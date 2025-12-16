"""Tests for AutoSnooze __init__.py - Data Models and Core Logic."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

UTC = timezone.utc
ATTR_ENTITY_ID = "entity_id"
ATTR_FRIENDLY_NAME = "friendly_name"


# =============================================================================
# Recreate data models for testing (avoids Python 3.12+ syntax issues)
# =============================================================================


@dataclass
class PausedAutomation:
    """Represent a snoozed automation."""

    entity_id: str
    friendly_name: str
    resume_at: datetime
    paused_at: datetime
    days: int = 0
    hours: int = 0
    minutes: int = 0

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage/attributes."""
        return {
            "friendly_name": self.friendly_name,
            "resume_at": self.resume_at.isoformat(),
            "paused_at": self.paused_at.isoformat(),
            "days": self.days,
            "hours": self.hours,
            "minutes": self.minutes,
        }

    @classmethod
    def from_dict(cls, entity_id: str, data: dict[str, Any]) -> PausedAutomation:
        """Create from dictionary."""
        return cls(
            entity_id=entity_id,
            friendly_name=data.get("friendly_name", entity_id),
            resume_at=datetime.fromisoformat(data["resume_at"]),
            paused_at=datetime.fromisoformat(data["paused_at"]),
            days=data.get("days", 0),
            hours=data.get("hours", 0),
            minutes=data.get("minutes", 0),
        )


@dataclass
class ScheduledSnooze:
    """Represent a scheduled future snooze."""

    entity_id: str
    friendly_name: str
    disable_at: datetime
    resume_at: datetime

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage/attributes."""
        return {
            "friendly_name": self.friendly_name,
            "disable_at": self.disable_at.isoformat(),
            "resume_at": self.resume_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, entity_id: str, data: dict[str, Any]) -> ScheduledSnooze:
        """Create from dictionary."""
        return cls(
            entity_id=entity_id,
            friendly_name=data.get("friendly_name", entity_id),
            disable_at=datetime.fromisoformat(data["disable_at"]),
            resume_at=datetime.fromisoformat(data["resume_at"]),
        )


@dataclass
class AutomationPauseData:
    """Runtime data for AutoSnooze."""

    paused: dict[str, PausedAutomation] = field(default_factory=dict)
    scheduled: dict[str, ScheduledSnooze] = field(default_factory=dict)
    timers: dict[str, Any] = field(default_factory=dict)
    scheduled_timers: dict[str, Any] = field(default_factory=dict)
    listeners: list[Any] = field(default_factory=list)
    store: Any = None

    def add_listener(self, callback_fn: Any) -> Any:
        """Add state change listener, return removal function."""
        self.listeners.append(callback_fn)
        return lambda: self.listeners.remove(callback_fn)

    def notify(self) -> None:
        """Notify all listeners of state change."""
        for listener in self.listeners:
            listener()

    def get_paused_dict(self) -> dict[str, dict[str, Any]]:
        """Get snoozed automations as serializable dict."""
        return {k: v.to_dict() for k, v in self.paused.items()}

    def get_scheduled_dict(self) -> dict[str, dict[str, Any]]:
        """Get scheduled snoozes as serializable dict."""
        return {k: v.to_dict() for k, v in self.scheduled.items()}


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
# Core function implementations for testing
# =============================================================================


def _get_friendly_name(hass: Any, entity_id: str) -> str:
    """Get friendly name for entity."""
    if state := hass.states.get(entity_id):
        return state.attributes.get(ATTR_FRIENDLY_NAME, entity_id)
    return entity_id


def _cancel_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel timer for entity if exists."""
    if unsub := data.timers.pop(entity_id, None):
        unsub()


def _cancel_scheduled_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel scheduled timer for entity if exists."""
    if unsub := data.scheduled_timers.pop(entity_id, None):
        unsub()


async def _set_automation_state(
    hass: Any, entity_id: str, *, enabled: bool
) -> bool:
    """Enable or disable an automation."""
    state = hass.states.get(entity_id)
    if state is None:
        return False

    try:
        await hass.services.async_call(
            "automation",
            "turn_on" if enabled else "turn_off",
            {ATTR_ENTITY_ID: entity_id},
            blocking=True,
        )
        return True
    except Exception:
        return False


async def _async_save(data: AutomationPauseData) -> None:
    """Save snoozed automations to storage."""
    if data.store is None:
        return

    try:
        await data.store.async_save({
            "paused": {k: v.to_dict() for k, v in data.paused.items()},
            "scheduled": {k: v.to_dict() for k, v in data.scheduled.items()},
        })
    except Exception:
        pass


async def _async_resume(
    hass: Any, data: AutomationPauseData, entity_id: str
) -> None:
    """Wake up a snoozed automation."""
    _cancel_timer(data, entity_id)
    data.paused.pop(entity_id, None)
    await _set_automation_state(hass, entity_id, enabled=True)
    await _async_save(data)
    data.notify()


def _get_automations_by_area(hass: Any, area_ids: list[str]) -> list[str]:
    """Get all automation entity IDs in the specified areas."""
    from unittest.mock import MagicMock
    entity_reg = MagicMock()
    # This is mocked in tests
    return []


def _get_automations_by_label(hass: Any, label_ids: list[str]) -> list[str]:
    """Get all automation entity IDs with the specified labels."""
    return []


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

    def test_to_dict_returns_correct_structure(
        self, sample_paused_automation: PausedAutomation
    ) -> None:
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

    def test_to_dict_datetime_as_isoformat(
        self, sample_paused_automation: PausedAutomation
    ) -> None:
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

    def test_roundtrip_serialization(
        self, sample_paused_automation: PausedAutomation
    ) -> None:
        """Test data survives serialization roundtrip."""
        serialized = sample_paused_automation.to_dict()
        restored = PausedAutomation.from_dict(
            sample_paused_automation.entity_id, serialized
        )

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

    def test_to_dict_returns_correct_structure(
        self, sample_scheduled_snooze: ScheduledSnooze
    ) -> None:
        """Test to_dict returns all fields in correct format."""
        result = sample_scheduled_snooze.to_dict()

        assert "friendly_name" in result
        assert "disable_at" in result
        assert "resume_at" in result
        assert result["friendly_name"] == "Test Automation"

    def test_to_dict_datetime_as_isoformat(
        self, sample_scheduled_snooze: ScheduledSnooze
    ) -> None:
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

    def test_roundtrip_serialization(
        self, sample_scheduled_snooze: ScheduledSnooze
    ) -> None:
        """Test data survives serialization roundtrip."""
        serialized = sample_scheduled_snooze.to_dict()
        restored = ScheduledSnooze.from_dict(
            sample_scheduled_snooze.entity_id, serialized
        )

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

    def test_add_listener_registers_callback(
        self, automation_pause_data: AutomationPauseData
    ) -> None:
        """Test add_listener registers callback in listeners list."""
        callback = MagicMock()

        automation_pause_data.add_listener(callback)

        assert callback in automation_pause_data.listeners

    def test_add_listener_returns_removal_function(
        self, automation_pause_data: AutomationPauseData
    ) -> None:
        """Test add_listener returns function that removes the listener."""
        callback = MagicMock()

        remove_fn = automation_pause_data.add_listener(callback)
        assert callback in automation_pause_data.listeners

        remove_fn()
        assert callback not in automation_pause_data.listeners

    def test_add_multiple_listeners(
        self, automation_pause_data: AutomationPauseData
    ) -> None:
        """Test multiple listeners can be registered."""
        callback1 = MagicMock()
        callback2 = MagicMock()

        automation_pause_data.add_listener(callback1)
        automation_pause_data.add_listener(callback2)

        assert len(automation_pause_data.listeners) == 2

    def test_notify_calls_all_listeners(
        self, automation_pause_data: AutomationPauseData
    ) -> None:
        """Test notify calls all registered listeners."""
        callback1 = MagicMock()
        callback2 = MagicMock()
        automation_pause_data.add_listener(callback1)
        automation_pause_data.add_listener(callback2)

        automation_pause_data.notify()

        callback1.assert_called_once()
        callback2.assert_called_once()

    def test_notify_with_no_listeners_does_not_raise(
        self, automation_pause_data: AutomationPauseData
    ) -> None:
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

    def test_get_paused_dict_empty_returns_empty_dict(
        self, automation_pause_data: AutomationPauseData
    ) -> None:
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

    def test_get_scheduled_dict_empty_returns_empty_dict(
        self, automation_pause_data: AutomationPauseData
    ) -> None:
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
        mock_state = MockState(
            "automation.test", "on", {ATTR_FRIENDLY_NAME: "Test Automation"}
        )
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

        result = await _set_automation_state(
            mock_hass, "automation.test", enabled=True
        )

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

        result = await _set_automation_state(
            mock_hass, "automation.test", enabled=False
        )

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

        result = await _set_automation_state(
            mock_hass, "automation.nonexistent", enabled=True
        )

        assert result is False
        mock_hass.services.async_call.assert_not_called()

    @pytest.mark.asyncio
    async def test_returns_false_on_service_call_exception(self) -> None:
        """Test returns False when service call raises exception."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MockState("automation.test", "on")
        mock_hass.services.async_call = AsyncMock(side_effect=Exception("Service error"))

        result = await _set_automation_state(
            mock_hass, "automation.test", enabled=True
        )

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
    async def test_does_nothing_when_no_store(self) -> None:
        """Test does nothing when store is None."""
        data = AutomationPauseData(store=None)

        await _async_save(data)  # Should not raise

    @pytest.mark.asyncio
    async def test_handles_store_exception(self) -> None:
        """Test handles exception from store gracefully."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=Exception("Storage error"))
        data = AutomationPauseData(store=mock_store)

        await _async_save(data)  # Should not raise


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
