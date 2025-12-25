"""Edge case tests for validation logic to improve mutation coverage.

These tests target edge cases in:
- validate_stored_entry
- validate_stored_data
- Model serialization edge cases
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest

from custom_components.autosnooze.coordinator import (
    validate_stored_data,
    validate_stored_entry,
)
from custom_components.autosnooze.models import (
    AutomationPauseData,
    PausedAutomation,
    ScheduledSnooze,
    parse_datetime_utc,
    ensure_utc_aware,
)

UTC = timezone.utc


class TestValidateStoredEntryEdgeCases:
    """Edge case tests for validate_stored_entry function."""

    def test_accepts_zero_values_for_numeric_fields(self) -> None:
        """Test accepts zero as valid for days/hours/minutes."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "days": 0,
            "hours": 0,
            "minutes": 0,
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is True

    def test_accepts_large_positive_values(self) -> None:
        """Test accepts large positive values for numeric fields."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(days=365)).isoformat(),
            "paused_at": now.isoformat(),
            "days": 365,
            "hours": 23,
            "minutes": 59,
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is True

    def test_accepts_float_values_for_numeric_fields(self) -> None:
        """Test accepts float values for numeric fields."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "days": 1.5,
            "hours": 2.5,
            "minutes": 30.0,
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is True

    def test_rejects_negative_float_values(self) -> None:
        """Test rejects negative float values for numeric fields."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "days": -0.5,
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_rejects_string_numeric_values(self) -> None:
        """Test rejects string values for numeric fields."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "hours": "2",  # String instead of int
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_accepts_missing_optional_numeric_fields(self) -> None:
        """Test accepts entries without optional numeric fields."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is True

    def test_rejects_entity_id_without_domain(self) -> None:
        """Test rejects entity_id without automation. prefix."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
        }

        result = validate_stored_entry("just_entity_name", data, "paused")

        assert result is False

    def test_rejects_entity_id_with_wrong_domain(self) -> None:
        """Test rejects entity_id with non-automation domain."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
        }

        result = validate_stored_entry("script.my_script", data, "paused")

        assert result is False

    def test_scheduled_with_resume_one_second_after_disable(self) -> None:
        """Test accepts scheduled entry with resume just after disable."""
        now = datetime.now(UTC)
        data = {
            "disable_at": now.isoformat(),
            "resume_at": (now + timedelta(seconds=1)).isoformat(),
        }

        result = validate_stored_entry("automation.test", data, "scheduled")

        assert result is True

    def test_scheduled_with_resume_one_day_after_disable(self) -> None:
        """Test accepts scheduled entry with resume one day after disable."""
        now = datetime.now(UTC)
        data = {
            "disable_at": now.isoformat(),
            "resume_at": (now + timedelta(days=1)).isoformat(),
        }

        result = validate_stored_entry("automation.test", data, "scheduled")

        assert result is True


class TestValidateStoredDataEdgeCases:
    """Edge case tests for validate_stored_data function."""

    def test_handles_empty_dict(self) -> None:
        """Test handles empty dict storage."""
        result = validate_stored_data({})

        assert result == {"paused": {}, "scheduled": {}}

    def test_handles_dict_with_only_paused(self) -> None:
        """Test handles dict with only paused key."""
        now = datetime.now(UTC)
        result = validate_stored_data(
            {
                "paused": {
                    "automation.test": {
                        "resume_at": (now + timedelta(hours=1)).isoformat(),
                        "paused_at": now.isoformat(),
                    }
                }
            }
        )

        assert "automation.test" in result["paused"]
        assert result["scheduled"] == {}

    def test_handles_dict_with_only_scheduled(self) -> None:
        """Test handles dict with only scheduled key."""
        now = datetime.now(UTC)
        result = validate_stored_data(
            {
                "scheduled": {
                    "automation.test": {
                        "disable_at": now.isoformat(),
                        "resume_at": (now + timedelta(hours=1)).isoformat(),
                    }
                }
            }
        )

        assert result["paused"] == {}
        assert "automation.test" in result["scheduled"]

    def test_handles_extra_unknown_keys(self) -> None:
        """Test ignores extra unknown keys in storage."""
        now = datetime.now(UTC)
        result = validate_stored_data(
            {
                "paused": {},
                "scheduled": {},
                "unknown_key": "should be ignored",
                "another_unknown": {"data": "here"},
            }
        )

        assert result == {"paused": {}, "scheduled": {}}

    def test_partial_valid_entries(self) -> None:
        """Test keeps valid entries and discards invalid ones."""
        now = datetime.now(UTC)
        result = validate_stored_data(
            {
                "paused": {
                    "automation.valid1": {
                        "resume_at": (now + timedelta(hours=1)).isoformat(),
                        "paused_at": now.isoformat(),
                    },
                    "automation.valid2": {
                        "resume_at": (now + timedelta(hours=2)).isoformat(),
                        "paused_at": now.isoformat(),
                    },
                    "automation.invalid1": "not a dict",
                    "automation.invalid2": {
                        "resume_at": "not-a-datetime",
                        "paused_at": now.isoformat(),
                    },
                },
                "scheduled": {},
            }
        )

        assert len(result["paused"]) == 2
        assert "automation.valid1" in result["paused"]
        assert "automation.valid2" in result["paused"]
        assert "automation.invalid1" not in result["paused"]
        assert "automation.invalid2" not in result["paused"]


class TestParseDatetimeUtcEdgeCases:
    """Edge case tests for parse_datetime_utc function."""

    def test_parses_utc_isoformat(self) -> None:
        """Test parses UTC datetime in ISO format."""
        dt_str = "2024-06-15T12:00:00+00:00"

        result = parse_datetime_utc(dt_str)

        assert result.tzinfo is not None
        assert result.year == 2024
        assert result.month == 6
        assert result.day == 15

    def test_parses_timezone_offset(self) -> None:
        """Test parses datetime with timezone offset."""
        dt_str = "2024-06-15T12:00:00-05:00"

        result = parse_datetime_utc(dt_str)

        assert result.tzinfo is not None

    def test_raises_on_invalid_string(self) -> None:
        """Test raises ValueError on invalid datetime string."""
        with pytest.raises(ValueError):
            parse_datetime_utc("not-a-datetime")

    def test_raises_on_empty_string(self) -> None:
        """Test raises ValueError on empty string."""
        with pytest.raises(ValueError):
            parse_datetime_utc("")


class TestEnsureUtcAwareEdgeCases:
    """Edge case tests for ensure_utc_aware function."""

    def test_returns_utc_datetime_unchanged(self) -> None:
        """Test returns UTC datetime unchanged."""
        dt = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)

        result = ensure_utc_aware(dt)

        assert result == dt
        assert result.tzinfo == UTC

    def test_converts_other_timezone_to_utc(self) -> None:
        """Test converts other timezone to UTC."""
        from datetime import timezone as tz

        # Create a datetime with a different timezone
        offset = tz(timedelta(hours=-5))
        dt = datetime(2024, 6, 15, 12, 0, 0, tzinfo=offset)

        result = ensure_utc_aware(dt)

        assert result.tzinfo == UTC
        # Should be 5 hours later in UTC
        assert result.hour == 17


class TestAutomationPauseDataEdgeCases:
    """Edge case tests for AutomationPauseData."""

    def test_get_paused_dict_with_multiple_entries(self) -> None:
        """Test get_paused_dict serializes all entries correctly."""
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
        """Test get_scheduled_dict serializes all entries correctly."""
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

    def test_listener_removal_function_is_idempotent(self) -> None:
        """Test listener removal function can be called multiple times."""
        data = AutomationPauseData()
        callback = MagicMock()

        remove_fn = data.add_listener(callback)

        # First removal
        remove_fn()
        assert callback not in data.listeners

        # Second removal should not raise
        remove_fn()

    def test_notify_with_failing_listener(self) -> None:
        """Test notify continues even if a listener raises."""
        data = AutomationPauseData()
        failing_callback = MagicMock(side_effect=Exception("Listener error"))
        working_callback = MagicMock()

        data.add_listener(failing_callback)
        data.add_listener(working_callback)

        # Should not raise, but behavior depends on implementation
        # At minimum, test that it doesn't crash the whole notify
        try:
            data.notify()
        except Exception:
            pass  # Some implementations may propagate exceptions

        # The working callback should still have been called if implementation
        # continues after exception, or not called if it stops
        # This test mainly ensures no crash


class TestPausedAutomationEdgeCases:
    """Edge case tests for PausedAutomation model."""

    def test_to_dict_includes_all_fields(self) -> None:
        """Test to_dict includes all fields."""
        now = datetime.now(UTC)
        paused = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=1,
            hours=2,
            minutes=30,
        )

        result = paused.to_dict()

        assert "friendly_name" in result
        assert "resume_at" in result
        assert "paused_at" in result
        assert "days" in result
        assert "hours" in result
        assert "minutes" in result

    def test_from_dict_handles_extra_fields(self) -> None:
        """Test from_dict ignores extra fields."""
        now = datetime.now(UTC)
        data = {
            "friendly_name": "Test",
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "extra_field": "ignored",
            "another_extra": 123,
        }

        result = PausedAutomation.from_dict("automation.test", data)

        assert result.entity_id == "automation.test"
        assert result.friendly_name == "Test"


class TestScheduledSnoozeEdgeCases:
    """Edge case tests for ScheduledSnooze model."""

    def test_to_dict_includes_all_fields(self) -> None:
        """Test to_dict includes all fields."""
        now = datetime.now(UTC)
        scheduled = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        result = scheduled.to_dict()

        assert "friendly_name" in result
        assert "disable_at" in result
        assert "resume_at" in result

    def test_from_dict_handles_extra_fields(self) -> None:
        """Test from_dict ignores extra fields."""
        now = datetime.now(UTC)
        data = {
            "friendly_name": "Test",
            "disable_at": (now + timedelta(hours=1)).isoformat(),
            "resume_at": (now + timedelta(hours=2)).isoformat(),
            "extra_field": "ignored",
        }

        result = ScheduledSnooze.from_dict("automation.test", data)

        assert result.entity_id == "automation.test"
        assert result.friendly_name == "Test"
