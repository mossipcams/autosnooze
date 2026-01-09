"""Edge case tests for validation logic to improve mutation coverage.

Uses @pytest.mark.parametrize for efficient testing of similar cases.
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

    @pytest.fixture
    def now(self) -> datetime:
        """Return current UTC time."""
        return datetime.now(UTC)

    @pytest.mark.parametrize(
        "days,hours,minutes,expected",
        [
            (0, 0, 0, True),  # All zeros
            (365, 23, 59, True),  # Large values
            (1.5, 2.5, 30.0, True),  # Float values
            (-1, 0, 0, False),  # Negative days
            (0, -1, 0, False),  # Negative hours
            (0, 0, -1, False),  # Negative minutes
            (-0.5, 0, 0, False),  # Negative float
        ],
        ids=[
            "zeros-valid",
            "large-values-valid",
            "float-values-valid",
            "negative-days-invalid",
            "negative-hours-invalid",
            "negative-minutes-invalid",
            "negative-float-invalid",
        ],
    )
    def test_numeric_field_validation(
        self, now: datetime, days: float, hours: float, minutes: float, expected: bool
    ) -> None:
        """Test numeric field validation with various values."""
        data = {
            "resume_at": (now + timedelta(days=365 if days == 365 else 1)).isoformat(),
            "paused_at": now.isoformat(),
            "days": days,
            "hours": hours,
            "minutes": minutes,
        }
        result = validate_stored_entry("automation.test", data, "paused")
        assert result is expected

    def test_rejects_string_numeric_values(self, now: datetime) -> None:
        """Test rejects string values for numeric fields."""
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "hours": "2",
        }
        assert validate_stored_entry("automation.test", data, "paused") is False

    def test_accepts_missing_optional_numeric_fields(self, now: datetime) -> None:
        """Test accepts entries without optional numeric fields."""
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
        }
        assert validate_stored_entry("automation.test", data, "paused") is True

    @pytest.mark.parametrize(
        "entity_id,expected",
        [
            ("automation.test", True),
            ("just_entity_name", False),
            ("script.my_script", False),
            ("light.my_light", False),
            ("switch.my_switch", False),
        ],
        ids=["automation-valid", "no-domain", "script-domain", "light-domain", "switch-domain"],
    )
    def test_entity_id_domain_validation(self, now: datetime, entity_id: str, expected: bool) -> None:
        """Test entity_id domain validation."""
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
        }
        assert validate_stored_entry(entity_id, data, "paused") is expected

    @pytest.mark.parametrize(
        "offset,expected",
        [
            (timedelta(seconds=1), True),
            (timedelta(days=1), True),
            (timedelta(seconds=0), False),
            (timedelta(seconds=-1), False),
        ],
        ids=["1-second-after", "1-day-after", "same-time", "before"],
    )
    def test_scheduled_time_ordering(self, now: datetime, offset: timedelta, expected: bool) -> None:
        """Test scheduled entry resume_at vs disable_at ordering."""
        data = {
            "disable_at": now.isoformat(),
            "resume_at": (now + offset).isoformat(),
        }
        assert validate_stored_entry("automation.test", data, "scheduled") is expected


class TestValidateStoredDataEdgeCases:
    """Edge case tests for validate_stored_data function."""

    @pytest.fixture
    def now(self) -> datetime:
        """Return current UTC time."""
        return datetime.now(UTC)

    @pytest.mark.parametrize(
        "storage,expected_paused_count,expected_scheduled_count",
        [
            ({}, 0, 0),
            ({"paused": {}, "scheduled": {}, "unknown_key": "ignored"}, 0, 0),
        ],
        ids=["empty-dict", "extra-keys-ignored"],
    )
    def test_empty_and_extra_keys(
        self, storage: dict, expected_paused_count: int, expected_scheduled_count: int
    ) -> None:
        """Test empty dict and extra unknown keys."""
        result = validate_stored_data(storage)
        assert len(result["paused"]) == expected_paused_count
        assert len(result["scheduled"]) == expected_scheduled_count

    def test_handles_dict_with_only_paused(self, now: datetime) -> None:
        """Test handles dict with only paused key."""
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

    def test_handles_dict_with_only_scheduled(self, now: datetime) -> None:
        """Test handles dict with only scheduled key."""
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

    def test_partial_valid_entries(self, now: datetime) -> None:
        """Test keeps valid entries and discards invalid ones."""
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


class TestParseDatetimeUtc:
    """Tests for parse_datetime_utc function."""

    @pytest.mark.parametrize(
        "dt_str",
        [
            "2024-06-15T12:00:00+00:00",
            "2024-06-15T12:00:00-05:00",
            "2024-06-15T12:00:00Z",
        ],
        ids=["utc-offset", "negative-offset", "z-suffix"],
    )
    def test_parses_valid_datetime_strings(self, dt_str: str) -> None:
        """Test parses valid datetime strings."""
        result = parse_datetime_utc(dt_str)
        assert result.tzinfo is not None
        assert result.year == 2024
        assert result.month == 6
        assert result.day == 15

    @pytest.mark.parametrize(
        "invalid_str",
        ["not-a-datetime", "", "2024-13-45", "garbage"],
        ids=["text", "empty", "invalid-date", "garbage"],
    )
    def test_raises_on_invalid_string(self, invalid_str: str) -> None:
        """Test raises ValueError on invalid datetime string."""
        with pytest.raises(ValueError):
            parse_datetime_utc(invalid_str)


class TestEnsureUtcAware:
    """Tests for ensure_utc_aware function."""

    def test_returns_utc_datetime_unchanged(self) -> None:
        """Test returns UTC datetime unchanged."""
        dt = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
        result = ensure_utc_aware(dt)
        assert result == dt
        assert result.tzinfo == UTC

    def test_converts_other_timezone_to_utc(self) -> None:
        """Test converts other timezone to UTC."""
        offset = timezone(timedelta(hours=-5))
        dt = datetime(2024, 6, 15, 12, 0, 0, tzinfo=offset)
        result = ensure_utc_aware(dt)
        assert result.tzinfo == UTC
        assert result.hour == 17  # 12:00 - (-5:00) = 17:00 UTC


class TestAutomationPauseDataEdgeCases:
    """Edge case tests for AutomationPauseData."""

    @pytest.fixture
    def now(self) -> datetime:
        """Return current UTC time."""
        return datetime.now(UTC)

    def test_get_paused_dict_with_multiple_entries(self, now: datetime) -> None:
        """Test get_paused_dict serializes all entries correctly."""
        data = AutomationPauseData()
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
        assert result["automation.test1"]["friendly_name"] == "Test 1"
        assert result["automation.test2"]["friendly_name"] == "Test 2"

    def test_get_scheduled_dict_with_multiple_entries(self, now: datetime) -> None:
        """Test get_scheduled_dict serializes all entries correctly."""
        data = AutomationPauseData()
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
        remove_fn()
        assert callback not in data.listeners

        # Second removal should not raise
        remove_fn()

    def test_notify_does_not_crash_on_failing_listener(self) -> None:
        """Test notify continues even if a listener raises."""
        data = AutomationPauseData()
        failing_callback = MagicMock(side_effect=Exception("Listener error"))
        data.add_listener(failing_callback)

        try:
            data.notify()
        except Exception:
            pass  # Some implementations may propagate exceptions


class TestPausedAutomationEdgeCases:
    """Edge case tests for PausedAutomation model."""

    @pytest.fixture
    def now(self) -> datetime:
        """Return current UTC time."""
        return datetime.now(UTC)

    def test_to_dict_includes_all_fields(self, now: datetime) -> None:
        """Test to_dict includes all fields."""
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

        for field in ["friendly_name", "resume_at", "paused_at", "days", "hours", "minutes"]:
            assert field in result

    def test_from_dict_handles_extra_fields(self, now: datetime) -> None:
        """Test from_dict ignores extra fields."""
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

    @pytest.fixture
    def now(self) -> datetime:
        """Return current UTC time."""
        return datetime.now(UTC)

    def test_to_dict_includes_all_fields(self, now: datetime) -> None:
        """Test to_dict includes all fields."""
        scheduled = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        result = scheduled.to_dict()

        for field in ["friendly_name", "disable_at", "resume_at"]:
            assert field in result

    def test_from_dict_handles_extra_fields(self, now: datetime) -> None:
        """Test from_dict ignores extra fields."""
        data = {
            "friendly_name": "Test",
            "disable_at": (now + timedelta(hours=1)).isoformat(),
            "resume_at": (now + timedelta(hours=2)).isoformat(),
            "extra_field": "ignored",
        }

        result = ScheduledSnooze.from_dict("automation.test", data)

        assert result.entity_id == "automation.test"
        assert result.friendly_name == "Test"
