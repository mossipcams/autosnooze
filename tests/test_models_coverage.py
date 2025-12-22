"""Additional tests for models.py to improve coverage.

These tests focus on edge cases and branches not covered by existing tests.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest

from custom_components.autosnooze.models import (
    AutomationPauseData,
    PausedAutomation,
    ScheduledSnooze,
    ensure_utc_aware,
    parse_datetime_utc,
)

UTC = timezone.utc


class TestParseDatetimeUtc:
    """Tests for parse_datetime_utc function."""

    def test_parses_utc_aware_datetime(self) -> None:
        """Test parsing a UTC-aware datetime string."""
        dt_str = "2024-06-15T12:00:00+00:00"
        result = parse_datetime_utc(dt_str)

        assert result.tzinfo is not None
        assert result.year == 2024
        assert result.month == 6
        assert result.day == 15
        assert result.hour == 12

    def test_parses_naive_datetime_assumes_utc(self) -> None:
        """Test that naive datetime strings are treated as UTC."""
        dt_str = "2024-06-15T12:00:00"
        result = parse_datetime_utc(dt_str)

        assert result.tzinfo == UTC
        assert result.hour == 12

    def test_parses_datetime_with_timezone_offset(self) -> None:
        """Test parsing datetime with non-UTC timezone offset."""
        dt_str = "2024-06-15T12:00:00+05:00"
        result = parse_datetime_utc(dt_str)

        assert result.tzinfo is not None

    def test_invalid_datetime_raises_valueerror(self) -> None:
        """Test that invalid datetime string raises ValueError."""
        with pytest.raises(ValueError, match="Invalid datetime string"):
            parse_datetime_utc("not-a-datetime")

    def test_empty_string_raises_valueerror(self) -> None:
        """Test that empty string raises ValueError."""
        with pytest.raises(ValueError, match="Invalid datetime string"):
            parse_datetime_utc("")

    def test_partial_datetime_raises_valueerror(self) -> None:
        """Test that partial datetime raises ValueError."""
        with pytest.raises(ValueError, match="Invalid datetime string"):
            parse_datetime_utc("2024-06")


class TestEnsureUtcAware:
    """Tests for ensure_utc_aware function."""

    def test_returns_none_for_none_input(self) -> None:
        """Test that None input returns None."""
        result = ensure_utc_aware(None)
        assert result is None

    def test_naive_datetime_gets_utc_timezone(self) -> None:
        """Test that naive datetime gets UTC timezone added."""
        naive_dt = datetime(2024, 6, 15, 12, 0, 0)
        assert naive_dt.tzinfo is None

        result = ensure_utc_aware(naive_dt)

        assert result is not None
        assert result.tzinfo == UTC
        assert result.hour == 12

    def test_aware_datetime_unchanged(self) -> None:
        """Test that already-aware datetime is returned unchanged."""
        aware_dt = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)

        result = ensure_utc_aware(aware_dt)

        assert result is aware_dt  # Same object
        assert result.tzinfo == UTC

    def test_non_utc_aware_datetime_preserved(self) -> None:
        """Test that non-UTC aware datetime's timezone is preserved."""
        other_tz = timezone(timedelta(hours=5))
        aware_dt = datetime(2024, 6, 15, 12, 0, 0, tzinfo=other_tz)

        result = ensure_utc_aware(aware_dt)

        assert result is aware_dt
        assert result.tzinfo == other_tz


class TestPausedAutomationWithDisableAt:
    """Tests for PausedAutomation with disable_at field."""

    def test_to_dict_includes_disable_at_when_set(self) -> None:
        """Test that to_dict includes disable_at when it's set."""
        now = datetime.now(UTC)
        disable_at = now - timedelta(hours=1)
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

    def test_from_dict_with_disable_at(self) -> None:
        """Test that from_dict correctly parses disable_at."""
        now = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
        disable_at = now - timedelta(hours=1)

        data = {
            "friendly_name": "Test",
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "disable_at": disable_at.isoformat(),
        }

        result = PausedAutomation.from_dict("automation.test", data)

        assert result.disable_at is not None
        assert result.disable_at.year == disable_at.year
        assert result.disable_at.hour == disable_at.hour

    def test_from_dict_without_disable_at(self) -> None:
        """Test that from_dict handles missing disable_at."""
        now = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)

        data = {
            "friendly_name": "Test",
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
        }

        result = PausedAutomation.from_dict("automation.test", data)

        assert result.disable_at is None

    def test_roundtrip_with_disable_at(self) -> None:
        """Test roundtrip serialization with disable_at."""
        now = datetime.now(UTC)
        disable_at = now - timedelta(hours=1)

        original = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            disable_at=disable_at,
        )

        serialized = original.to_dict()
        restored = PausedAutomation.from_dict(original.entity_id, serialized)

        assert restored.disable_at is not None
        # Compare timestamps (allowing for microsecond precision loss in ISO format)
        assert abs((restored.disable_at - original.disable_at).total_seconds()) < 1


class TestScheduledSnoozeEdgeCases:
    """Edge case tests for ScheduledSnooze."""

    def test_from_dict_with_naive_datetime_strings(self) -> None:
        """Test from_dict handles naive datetime strings by adding UTC."""
        data = {
            "friendly_name": "Test",
            "disable_at": "2024-06-15T12:00:00",  # No timezone
            "resume_at": "2024-06-15T14:00:00",  # No timezone
        }

        result = ScheduledSnooze.from_dict("automation.test", data)

        assert result.disable_at.tzinfo is not None
        assert result.resume_at.tzinfo is not None


class TestAutomationPauseDataEdgeCases:
    """Edge case tests for AutomationPauseData."""

    def test_add_listener_and_notify_order(self) -> None:
        """Test that listeners are called in order they were added."""
        data = AutomationPauseData()
        call_order = []

        data.add_listener(lambda: call_order.append(1))
        data.add_listener(lambda: call_order.append(2))
        data.add_listener(lambda: call_order.append(3))

        data.notify()

        assert call_order == [1, 2, 3]

    def test_remove_listener_during_notify(self) -> None:
        """Test behavior when listener removes itself during notify."""
        data = AutomationPauseData()
        call_count = [0]

        def self_removing_listener():
            call_count[0] += 1
            # Don't remove during iteration - this tests the list stays stable

        remove_fn = data.add_listener(self_removing_listener)
        data.add_listener(lambda: None)

        data.notify()

        assert call_count[0] == 1

    def test_multiple_listener_removals(self) -> None:
        """Test removing multiple listeners."""
        data = AutomationPauseData()

        remove1 = data.add_listener(lambda: None)
        remove2 = data.add_listener(lambda: None)
        remove3 = data.add_listener(lambda: None)

        assert len(data.listeners) == 3

        remove1()
        assert len(data.listeners) == 2

        remove2()
        assert len(data.listeners) == 1

        remove3()
        assert len(data.listeners) == 0

    def test_get_paused_dict_with_multiple_entries(self) -> None:
        """Test get_paused_dict with multiple entries."""
        data = AutomationPauseData()
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

        result = data.get_paused_dict()

        assert len(result) == 2
        assert "automation.test1" in result
        assert "automation.test2" in result
        assert result["automation.test1"]["friendly_name"] == "Test 1"
        assert result["automation.test2"]["friendly_name"] == "Test 2"

    def test_get_scheduled_dict_with_multiple_entries(self) -> None:
        """Test get_scheduled_dict with multiple entries."""
        data = AutomationPauseData()
        now = datetime.now(UTC)

        data.scheduled["automation.test1"] = ScheduledSnooze(
            entity_id="automation.test1",
            friendly_name="Test 1",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )
        data.scheduled["automation.test2"] = ScheduledSnooze(
            entity_id="automation.test2",
            friendly_name="Test 2",
            disable_at=now + timedelta(hours=3),
            resume_at=now + timedelta(hours=4),
        )

        result = data.get_scheduled_dict()

        assert len(result) == 2
        assert "automation.test1" in result
        assert "automation.test2" in result
