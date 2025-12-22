"""Comprehensive tests for AutoSnooze data models.

These tests verify:
1. PausedAutomation model serialization/deserialization
2. ScheduledSnooze model serialization/deserialization
3. AutomationPauseData state management
4. Listener notification system
5. Datetime parsing and timezone handling
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest

UTC = timezone.utc


class TestPausedAutomationModel:
    """Tests for PausedAutomation data model."""

    def test_to_dict_serializes_all_fields(self) -> None:
        """Test that to_dict includes all required fields."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test Automation",
            resume_at=resume_at,
            paused_at=now,
            days=1,
            hours=2,
            minutes=30,
        )

        result = paused.to_dict()

        assert result["friendly_name"] == "Test Automation"
        assert result["resume_at"] == resume_at.isoformat()
        assert result["paused_at"] == now.isoformat()
        assert result["days"] == 1
        assert result["hours"] == 2
        assert result["minutes"] == 30

    def test_to_dict_includes_disable_at_when_set(self) -> None:
        """Test that to_dict includes disable_at when it's set."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        disable_at = now - timedelta(minutes=30)
        resume_at = now + timedelta(hours=1)

        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=resume_at,
            paused_at=now,
            disable_at=disable_at,
        )

        result = paused.to_dict()

        assert "disable_at" in result
        assert result["disable_at"] == disable_at.isoformat()

    def test_to_dict_excludes_disable_at_when_none(self) -> None:
        """Test that to_dict excludes disable_at when it's None."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            disable_at=None,
        )

        result = paused.to_dict()

        assert "disable_at" not in result

    def test_from_dict_deserializes_all_fields(self) -> None:
        """Test that from_dict correctly reconstructs PausedAutomation."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        data = {
            "friendly_name": "Test Automation",
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "days": 1,
            "hours": 2,
            "minutes": 30,
        }

        paused = PausedAutomation.from_dict("automation.test", data)

        assert paused.entity_id == "automation.test"
        assert paused.friendly_name == "Test Automation"
        assert paused.days == 1
        assert paused.hours == 2
        assert paused.minutes == 30

    def test_from_dict_uses_entity_id_as_fallback_name(self) -> None:
        """Test that from_dict uses entity_id when friendly_name is missing."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
        }

        paused = PausedAutomation.from_dict("automation.test", data)

        assert paused.friendly_name == "automation.test"

    def test_from_dict_handles_disable_at(self) -> None:
        """Test that from_dict correctly handles disable_at field."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        disable_at = now - timedelta(minutes=30)
        data = {
            "friendly_name": "Test",
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "disable_at": disable_at.isoformat(),
        }

        paused = PausedAutomation.from_dict("automation.test", data)

        assert paused.disable_at is not None
        assert paused.disable_at.replace(microsecond=0) == disable_at.replace(microsecond=0)

    def test_from_dict_sets_default_duration_values(self) -> None:
        """Test that from_dict sets default values for duration fields."""
        from custom_components.autosnooze.models import PausedAutomation

        now = datetime.now(UTC)
        data = {
            "friendly_name": "Test",
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
        }

        paused = PausedAutomation.from_dict("automation.test", data)

        assert paused.days == 0
        assert paused.hours == 0
        assert paused.minutes == 0


class TestScheduledSnoozeModel:
    """Tests for ScheduledSnooze data model."""

    def test_to_dict_serializes_all_fields(self) -> None:
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

        assert result["friendly_name"] == "Test Automation"
        assert result["disable_at"] == disable_at.isoformat()
        assert result["resume_at"] == resume_at.isoformat()

    def test_from_dict_deserializes_all_fields(self) -> None:
        """Test that from_dict correctly reconstructs ScheduledSnooze."""
        from custom_components.autosnooze.models import ScheduledSnooze

        now = datetime.now(UTC)
        data = {
            "friendly_name": "Test Automation",
            "disable_at": (now + timedelta(hours=1)).isoformat(),
            "resume_at": (now + timedelta(hours=2)).isoformat(),
        }

        scheduled = ScheduledSnooze.from_dict("automation.test", data)

        assert scheduled.entity_id == "automation.test"
        assert scheduled.friendly_name == "Test Automation"

    def test_from_dict_uses_entity_id_as_fallback_name(self) -> None:
        """Test that from_dict uses entity_id when friendly_name is missing."""
        from custom_components.autosnooze.models import ScheduledSnooze

        now = datetime.now(UTC)
        data = {
            "disable_at": (now + timedelta(hours=1)).isoformat(),
            "resume_at": (now + timedelta(hours=2)).isoformat(),
        }

        scheduled = ScheduledSnooze.from_dict("automation.test", data)

        assert scheduled.friendly_name == "automation.test"


class TestAutomationPauseDataModel:
    """Tests for AutomationPauseData state management."""

    def test_initialization_creates_empty_collections(self) -> None:
        """Test that AutomationPauseData initializes with empty collections."""
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData()

        assert len(data.paused) == 0
        assert len(data.scheduled) == 0
        assert len(data.timers) == 0
        assert len(data.scheduled_timers) == 0
        assert len(data.listeners) == 0

    def test_add_listener_returns_removal_function(self) -> None:
        """Test that add_listener returns a function to remove the listener."""
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData()
        callback = MagicMock()

        remove_fn = data.add_listener(callback)

        assert len(data.listeners) == 1
        assert callback in data.listeners

        # Call removal function
        remove_fn()

        assert len(data.listeners) == 0
        assert callback not in data.listeners

    def test_notify_calls_all_listeners(self) -> None:
        """Test that notify calls all registered listeners."""
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData()
        callback1 = MagicMock()
        callback2 = MagicMock()

        data.add_listener(callback1)
        data.add_listener(callback2)

        data.notify()

        callback1.assert_called_once()
        callback2.assert_called_once()

    def test_get_paused_dict_returns_serializable_dict(self) -> None:
        """Test that get_paused_dict returns properly serialized data."""
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
        assert isinstance(result["automation.test"], dict)
        assert "friendly_name" in result["automation.test"]

    def test_get_scheduled_dict_returns_serializable_dict(self) -> None:
        """Test that get_scheduled_dict returns properly serialized data."""
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
        assert isinstance(result["automation.test"], dict)
        assert "friendly_name" in result["automation.test"]


class TestDatetimeUtilities:
    """Tests for datetime parsing and timezone utilities."""

    def test_parse_datetime_utc_with_utc_string(self) -> None:
        """Test parsing UTC ISO string."""
        from custom_components.autosnooze.models import parse_datetime_utc

        dt_str = "2024-12-25T14:30:00+00:00"
        result = parse_datetime_utc(dt_str)

        assert result.tzinfo is not None
        assert result.hour == 14
        assert result.minute == 30

    def test_parse_datetime_utc_with_naive_string(self) -> None:
        """Test parsing naive ISO string adds UTC timezone."""
        from custom_components.autosnooze.models import parse_datetime_utc

        dt_str = "2024-12-25T14:30:00"
        result = parse_datetime_utc(dt_str)

        assert result.tzinfo is not None
        assert result.tzinfo == timezone.utc

    def test_parse_datetime_utc_raises_on_invalid_string(self) -> None:
        """Test that invalid datetime string raises ValueError."""
        from custom_components.autosnooze.models import parse_datetime_utc

        with pytest.raises(ValueError):
            parse_datetime_utc("not-a-datetime")

    def test_ensure_utc_aware_with_naive_datetime(self) -> None:
        """Test that naive datetime gets UTC timezone added."""
        from custom_components.autosnooze.models import ensure_utc_aware

        naive_dt = datetime(2024, 12, 25, 14, 30, 0)
        result = ensure_utc_aware(naive_dt)

        assert result.tzinfo is not None
        assert result.tzinfo == timezone.utc
        assert result.hour == 14
        assert result.minute == 30

    def test_ensure_utc_aware_with_aware_datetime(self) -> None:
        """Test that aware datetime is preserved."""
        from custom_components.autosnooze.models import ensure_utc_aware

        aware_dt = datetime(2024, 12, 25, 14, 30, 0, tzinfo=timezone.utc)
        result = ensure_utc_aware(aware_dt)

        assert result.tzinfo is not None
        assert result == aware_dt

    def test_ensure_utc_aware_with_none(self) -> None:
        """Test that None is returned as None."""
        from custom_components.autosnooze.models import ensure_utc_aware

        result = ensure_utc_aware(None)

        assert result is None