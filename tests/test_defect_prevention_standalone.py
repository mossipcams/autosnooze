"""Standalone Defect Prevention Tests for AutoSnooze Integration.

These tests can run without the full Home Assistant environment by mocking
the necessary components. They target potential defect-prone areas:
- Duration validation edge cases
- Schedule validation boundary conditions
- Datetime parsing edge cases
- Data model serialization
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

# Mock Home Assistant modules before importing our code
mock_ha = MagicMock()
mock_ha.core = MagicMock()
mock_ha.core.HomeAssistant = MagicMock
mock_ha.core.ServiceCall = MagicMock
mock_ha.exceptions = MagicMock()
mock_ha.exceptions.ServiceValidationError = Exception
mock_ha.helpers = MagicMock()
mock_ha.helpers.storage = MagicMock()
mock_ha.helpers.entity_registry = MagicMock()
mock_ha.util = MagicMock()
mock_ha.config_entries = MagicMock()
mock_ha.const = MagicMock()
mock_ha.const.ATTR_ENTITY_ID = "entity_id"
mock_ha.components = MagicMock()
mock_ha.helpers.event = MagicMock()

sys.modules["homeassistant"] = mock_ha
sys.modules["homeassistant.core"] = mock_ha.core
sys.modules["homeassistant.exceptions"] = mock_ha.exceptions
sys.modules["homeassistant.helpers"] = mock_ha.helpers
sys.modules["homeassistant.helpers.storage"] = mock_ha.helpers.storage
sys.modules["homeassistant.helpers.entity_registry"] = mock_ha.helpers.entity_registry
sys.modules["homeassistant.util"] = mock_ha.util
sys.modules["homeassistant.config_entries"] = mock_ha.config_entries
sys.modules["homeassistant.const"] = mock_ha.const
sys.modules["homeassistant.components"] = mock_ha.components
sys.modules["homeassistant.components.http"] = MagicMock()
sys.modules["homeassistant.components.lovelace"] = MagicMock()
sys.modules["homeassistant.components.frontend"] = MagicMock()
sys.modules["homeassistant.components.automation"] = MagicMock()
sys.modules["homeassistant.helpers.event"] = mock_ha.helpers.event


# Mock dt_util functions used by our code
def mock_parse_datetime(dt_str):
    """Parse datetime string."""
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


def mock_utcnow():
    """Return current UTC time."""
    return datetime.now(timezone.utc)


mock_ha.util.dt = MagicMock()
mock_ha.util.dt.parse_datetime = mock_parse_datetime
mock_ha.util.dt.utcnow = mock_utcnow
sys.modules["homeassistant.util.dt"] = mock_ha.util.dt

UTC = timezone.utc


# =============================================================================
# DATETIME PARSING TESTS
# =============================================================================


class TestDatetimeParsingStandalone:
    """Tests for datetime parsing utilities without Home Assistant dependencies."""

    def test_parse_iso_datetime_with_timezone(self) -> None:
        """Test parsing ISO datetime with timezone."""
        from custom_components.autosnooze.models import parse_datetime_utc

        dt_str = "2024-12-25T14:30:00+00:00"
        result = parse_datetime_utc(dt_str)

        assert result is not None
        assert result.tzinfo is not None
        assert result.year == 2024
        assert result.month == 12
        assert result.day == 25

    def test_parse_iso_datetime_without_timezone(self) -> None:
        """Test parsing ISO datetime without timezone assumes UTC."""
        from custom_components.autosnooze.models import parse_datetime_utc

        dt_str = "2024-12-25T14:30:00"
        result = parse_datetime_utc(dt_str)

        assert result is not None
        assert result.tzinfo == timezone.utc

    def test_parse_datetime_invalid_string(self) -> None:
        """Test that invalid datetime string raises ValueError."""
        from custom_components.autosnooze.models import parse_datetime_utc

        with pytest.raises(ValueError):
            parse_datetime_utc("not-a-datetime")

    def test_parse_datetime_empty_string(self) -> None:
        """Test that empty string raises ValueError."""
        from custom_components.autosnooze.models import parse_datetime_utc

        with pytest.raises(ValueError):
            parse_datetime_utc("")

    def test_ensure_utc_aware_with_none(self) -> None:
        """Test ensure_utc_aware returns None for None input."""
        from custom_components.autosnooze.models import ensure_utc_aware

        assert ensure_utc_aware(None) is None

    def test_ensure_utc_aware_with_naive_datetime(self) -> None:
        """Test ensure_utc_aware adds UTC to naive datetime."""
        from custom_components.autosnooze.models import ensure_utc_aware

        naive_dt = datetime(2024, 12, 25, 14, 30, 0)
        result = ensure_utc_aware(naive_dt)

        assert result is not None
        assert result.tzinfo == timezone.utc

    def test_ensure_utc_aware_with_aware_datetime(self) -> None:
        """Test ensure_utc_aware preserves aware datetime."""
        from custom_components.autosnooze.models import ensure_utc_aware

        aware_dt = datetime(2024, 12, 25, 14, 30, 0, tzinfo=timezone.utc)
        result = ensure_utc_aware(aware_dt)

        assert result == aware_dt
        assert result.tzinfo == timezone.utc


# =============================================================================
# PAUSED AUTOMATION MODEL TESTS
# =============================================================================


class TestPausedAutomationModel:
    """Tests for PausedAutomation model edge cases."""

    def test_to_dict_includes_all_fields(self) -> None:
        """Test that to_dict includes all required fields."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test Automation",
            resume_at=resume_at,
            paused_at=now,
            days=0,
            hours=1,
            minutes=30,
        )

        result = paused.to_dict()

        assert "friendly_name" in result
        assert "resume_at" in result
        assert "paused_at" in result
        assert "days" in result
        assert "hours" in result
        assert "minutes" in result
        assert result["friendly_name"] == "Test Automation"
        assert result["hours"] == 1
        assert result["minutes"] == 30

    def test_to_dict_includes_disable_at_when_set(self) -> None:
        """Test that to_dict includes disable_at when set."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=2)

        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=resume_at,
            paused_at=now,
            disable_at=now,
        )

        result = paused.to_dict()

        assert "disable_at" in result

    def test_to_dict_excludes_disable_at_when_none(self) -> None:
        """Test that to_dict excludes disable_at when None."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=resume_at,
            paused_at=now,
            disable_at=None,
        )

        result = paused.to_dict()

        assert "disable_at" not in result

    def test_from_dict_creates_valid_object(self) -> None:
        """Test that from_dict creates a valid PausedAutomation."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        data = {
            "friendly_name": "Test Automation",
            "resume_at": resume_at.isoformat(),
            "paused_at": now.isoformat(),
            "days": 0,
            "hours": 1,
            "minutes": 0,
        }

        result = PausedAutomation.from_dict("automation.test", data)

        assert result.entity_id == "automation.test"
        assert result.friendly_name == "Test Automation"
        assert result.hours == 1

    def test_from_dict_uses_entity_id_as_fallback_name(self) -> None:
        """Test that from_dict uses entity_id when friendly_name is missing."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        data = {
            # No friendly_name
            "resume_at": resume_at.isoformat(),
            "paused_at": now.isoformat(),
        }

        result = PausedAutomation.from_dict("automation.test", data)

        assert result.friendly_name == "automation.test"

    def test_from_dict_handles_missing_optional_fields(self) -> None:
        """Test that from_dict handles missing days/hours/minutes."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        data = {
            "friendly_name": "Test",
            "resume_at": resume_at.isoformat(),
            "paused_at": now.isoformat(),
            # No days, hours, minutes
        }

        result = PausedAutomation.from_dict("automation.test", data)

        assert result.days == 0
        assert result.hours == 0
        assert result.minutes == 0


# =============================================================================
# SCHEDULED SNOOZE MODEL TESTS
# =============================================================================


class TestScheduledSnoozeModel:
    """Tests for ScheduledSnooze model edge cases."""

    def test_to_dict_includes_all_fields(self) -> None:
        """Test that to_dict includes all required fields."""
        from custom_components.autosnooze.models import ScheduledSnooze

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=1)
        resume_at = now + timedelta(hours=2)

        scheduled = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test Automation",
            disable_at=disable_at,
            resume_at=resume_at,
        )

        result = scheduled.to_dict()

        assert "friendly_name" in result
        assert "disable_at" in result
        assert "resume_at" in result
        assert result["friendly_name"] == "Test Automation"

    def test_from_dict_creates_valid_object(self) -> None:
        """Test that from_dict creates a valid ScheduledSnooze."""
        from custom_components.autosnooze.models import ScheduledSnooze

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=1)
        resume_at = now + timedelta(hours=2)

        data = {
            "friendly_name": "Test Automation",
            "disable_at": disable_at.isoformat(),
            "resume_at": resume_at.isoformat(),
        }

        result = ScheduledSnooze.from_dict("automation.test", data)

        assert result.entity_id == "automation.test"
        assert result.friendly_name == "Test Automation"

    def test_from_dict_uses_entity_id_as_fallback(self) -> None:
        """Test that from_dict uses entity_id when friendly_name is missing."""
        from custom_components.autosnooze.models import ScheduledSnooze

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=1)
        resume_at = now + timedelta(hours=2)

        data = {
            # No friendly_name
            "disable_at": disable_at.isoformat(),
            "resume_at": resume_at.isoformat(),
        }

        result = ScheduledSnooze.from_dict("automation.test", data)

        assert result.friendly_name == "automation.test"


# =============================================================================
# AUTOMATION PAUSE DATA MODEL TESTS
# =============================================================================


class TestAutomationPauseDataModel:
    """Tests for AutomationPauseData model."""

    def test_listener_add_and_notify(self) -> None:
        """Test adding listener and notifying."""
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData()
        listener = MagicMock()

        data.add_listener(listener)
        data.notify()

        listener.assert_called_once()

    def test_listener_removal(self) -> None:
        """Test that listener removal function works."""
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData()
        listener = MagicMock()

        remove_fn = data.add_listener(listener)
        remove_fn()

        data.notify()

        listener.assert_not_called()

    def test_multiple_listeners(self) -> None:
        """Test multiple listeners are all notified."""
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData()
        listener1 = MagicMock()
        listener2 = MagicMock()

        data.add_listener(listener1)
        data.add_listener(listener2)
        data.notify()

        listener1.assert_called_once()
        listener2.assert_called_once()

    def test_get_paused_dict_with_items(self) -> None:
        """Test get_paused_dict returns correct format."""
        from custom_components.autosnooze.models import AutomationPauseData, PausedAutomation

        now = datetime.now(UTC)
        data = AutomationPauseData()
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )

        result = data.get_paused_dict()

        assert "automation.test" in result
        assert "friendly_name" in result["automation.test"]

    def test_get_scheduled_dict_with_items(self) -> None:
        """Test get_scheduled_dict returns correct format."""
        from custom_components.autosnooze.models import AutomationPauseData, ScheduledSnooze

        now = datetime.now(UTC)
        data = AutomationPauseData()
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        result = data.get_scheduled_dict()

        assert "automation.test" in result
        assert "disable_at" in result["automation.test"]

    def test_empty_get_paused_dict(self) -> None:
        """Test get_paused_dict with no items."""
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData()
        result = data.get_paused_dict()

        assert result == {}

    def test_empty_get_scheduled_dict(self) -> None:
        """Test get_scheduled_dict with no items."""
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData()
        result = data.get_scheduled_dict()

        assert result == {}


# =============================================================================
# DATETIME BOUNDARY CONDITIONS
# =============================================================================


class TestDatetimeBoundaryConditions:
    """Tests for datetime boundary conditions."""

    def test_year_boundary_parsing(self) -> None:
        """Test parsing datetime at year boundary."""
        from custom_components.autosnooze.models import parse_datetime_utc

        # Dec 31 23:59:59
        dt_str = "2024-12-31T23:59:59+00:00"
        result = parse_datetime_utc(dt_str)

        assert result.year == 2024
        assert result.month == 12
        assert result.day == 31
        assert result.hour == 23
        assert result.minute == 59

        # Jan 1 00:00:00
        dt_str = "2025-01-01T00:00:00+00:00"
        result = parse_datetime_utc(dt_str)

        assert result.year == 2025
        assert result.month == 1
        assert result.day == 1

    def test_leap_year_date_parsing(self) -> None:
        """Test parsing Feb 29 in a leap year."""
        from custom_components.autosnooze.models import parse_datetime_utc

        # 2024 is a leap year
        dt_str = "2024-02-29T12:00:00+00:00"
        result = parse_datetime_utc(dt_str)

        assert result.month == 2
        assert result.day == 29

    def test_duration_calculation_across_dst(self) -> None:
        """Test that duration calculations work with UTC (no DST issues)."""
        from custom_components.autosnooze.models import PausedAutomation

        # Using UTC means DST never affects our calculations
        now = datetime(2024, 3, 10, 1, 30, 0, tzinfo=UTC)  # Common DST transition day
        resume_at = now + timedelta(hours=24)

        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=resume_at,
            paused_at=now,
            hours=24,
        )

        # Resume should be exactly 24 hours later
        assert (paused.resume_at - paused.paused_at).total_seconds() == 86400  # 24 * 60 * 60

    def test_very_long_duration(self) -> None:
        """Test handling of very long durations (1 year)."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        # 365 days * 24 hours = 8760 hours
        resume_at = now + timedelta(days=365)

        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=resume_at,
            paused_at=now,
            days=365,
        )

        result = paused.to_dict()
        assert result["days"] == 365

    def test_zero_duration_values(self) -> None:
        """Test that zero duration values are properly stored."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        resume_at = now + timedelta(minutes=30)

        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=resume_at,
            paused_at=now,
            days=0,
            hours=0,
            minutes=30,
        )

        result = paused.to_dict()
        assert result["days"] == 0
        assert result["hours"] == 0
        assert result["minutes"] == 30


# =============================================================================
# SERIALIZATION ROUND-TRIP TESTS
# =============================================================================


class TestSerializationRoundTrip:
    """Tests for serialization round-trip (to_dict -> from_dict)."""

    def test_paused_automation_roundtrip(self) -> None:
        """Test PausedAutomation can be serialized and deserialized."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=2)

        original = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test Automation",
            resume_at=resume_at,
            paused_at=now,
            days=0,
            hours=2,
            minutes=0,
            disable_at=now - timedelta(minutes=5),
        )

        # Round trip
        serialized = original.to_dict()
        restored = PausedAutomation.from_dict("automation.test", serialized)

        assert restored.entity_id == original.entity_id
        assert restored.friendly_name == original.friendly_name
        assert restored.days == original.days
        assert restored.hours == original.hours
        assert restored.minutes == original.minutes
        # Datetime comparison (within 1 second due to serialization)
        assert abs((restored.resume_at - original.resume_at).total_seconds()) < 1
        assert abs((restored.paused_at - original.paused_at).total_seconds()) < 1
        assert restored.disable_at is not None

    def test_scheduled_snooze_roundtrip(self) -> None:
        """Test ScheduledSnooze can be serialized and deserialized."""
        from custom_components.autosnooze.models import ScheduledSnooze

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=1)
        resume_at = now + timedelta(hours=2)

        original = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test Automation",
            disable_at=disable_at,
            resume_at=resume_at,
        )

        # Round trip
        serialized = original.to_dict()
        restored = ScheduledSnooze.from_dict("automation.test", serialized)

        assert restored.entity_id == original.entity_id
        assert restored.friendly_name == original.friendly_name
        assert abs((restored.disable_at - original.disable_at).total_seconds()) < 1
        assert abs((restored.resume_at - original.resume_at).total_seconds()) < 1
