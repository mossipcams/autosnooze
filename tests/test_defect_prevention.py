"""Defect Prevention Tests for AutoSnooze Integration.

These tests target potential defect-prone areas identified through code analysis:
- Duration validation edge cases (zero, negative, large values)
- Schedule validation boundary conditions (exact now, year boundaries)
- Persistence edge cases (missing automations, corrupted data)
- Service call error handling
- Datetime parsing edge cases
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

UTC = timezone.utc


# =============================================================================
# DURATION VALIDATION EDGE CASES
# =============================================================================


class TestDurationValidation:
    """Tests for duration validation in service calls."""

    @pytest.mark.asyncio
    async def test_rejects_all_zero_duration(self) -> None:
        """Test that duration with all zeros is rejected."""
        from homeassistant.exceptions import ServiceValidationError

        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                days=0,
                hours=0,
                minutes=0,
            )

        assert (
            "duration" in str(exc_info.value).lower()
            or exc_info.value.translation_key == "invalid_duration"
        )

    @pytest.mark.asyncio
    async def test_accepts_single_nonzero_value(self) -> None:
        """Test that duration with at least one non-zero value is accepted."""
        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(
            attributes={"friendly_name": "Test"}
        )
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with patch("custom_components.autosnooze.services.schedule_resume"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                days=0,
                hours=0,
                minutes=1,  # Only minutes is non-zero
            )

        assert "automation.test" in data.paused

    @pytest.mark.asyncio
    async def test_accepts_only_days_nonzero(self) -> None:
        """Test that duration with only days non-zero is accepted."""
        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(
            attributes={"friendly_name": "Test"}
        )
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with patch("custom_components.autosnooze.services.schedule_resume"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                days=1,
                hours=0,
                minutes=0,
            )

        assert "automation.test" in data.paused

    @pytest.mark.asyncio
    async def test_handles_large_duration_values(self) -> None:
        """Test that very large duration values are handled."""
        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(
            attributes={"friendly_name": "Test"}
        )
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with patch("custom_components.autosnooze.services.schedule_resume"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                days=365,  # 1 year
                hours=24,
                minutes=60,
            )

        assert "automation.test" in data.paused


# =============================================================================
# SCHEDULE VALIDATION EDGE CASES
# =============================================================================


class TestScheduleValidation:
    """Tests for schedule validation in service calls."""

    @pytest.mark.asyncio
    async def test_rejects_resume_at_in_past(self) -> None:
        """Test that resume_at in the past is rejected."""
        from homeassistant.exceptions import ServiceValidationError

        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        past = now - timedelta(hours=1)

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                resume_at_dt=past,
            )

        assert exc_info.value.translation_key == "resume_time_past"

    @pytest.mark.asyncio
    async def test_rejects_resume_at_exactly_now(self) -> None:
        """Test that resume_at at exactly current time is rejected."""
        from homeassistant.exceptions import ServiceValidationError

        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        # Use a time that is guaranteed to be in the past by the time the check runs
        past = datetime.now(UTC) - timedelta(seconds=1)

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                resume_at_dt=past,
            )

        assert exc_info.value.translation_key == "resume_time_past"

    @pytest.mark.asyncio
    async def test_accepts_resume_at_in_future(self) -> None:
        """Test that resume_at in the future is accepted."""
        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(
            attributes={"friendly_name": "Test"}
        )
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        future = now + timedelta(hours=1)

        with patch("custom_components.autosnooze.services.schedule_resume"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                resume_at_dt=future,
            )

        assert "automation.test" in data.paused

    @pytest.mark.asyncio
    async def test_rejects_disable_at_after_resume_at(self) -> None:
        """Test that disable_at after resume_at is rejected."""
        from homeassistant.exceptions import ServiceValidationError

        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=2)
        resume_at = now + timedelta(hours=1)  # Before disable_at

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                disable_at=disable_at,
                resume_at_dt=resume_at,
            )

        assert exc_info.value.translation_key == "disable_after_resume"

    @pytest.mark.asyncio
    async def test_rejects_disable_at_equals_resume_at(self) -> None:
        """Test that disable_at equal to resume_at is rejected."""
        from homeassistant.exceptions import ServiceValidationError

        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        same_time = now + timedelta(hours=1)

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                disable_at=same_time,
                resume_at_dt=same_time,
            )

        assert exc_info.value.translation_key == "disable_after_resume"

    @pytest.mark.asyncio
    async def test_accepts_disable_at_before_resume_at(self) -> None:
        """Test that disable_at before resume_at is accepted for future schedule."""
        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(
            attributes={"friendly_name": "Test"}
        )
        mock_hass.services.async_call = AsyncMock()

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
                ["automation.test"],
                disable_at=disable_at,
                resume_at_dt=resume_at,
            )

        assert "automation.test" in data.scheduled


# =============================================================================
# ENTITY VALIDATION
# =============================================================================


class TestEntityValidation:
    """Tests for entity validation in service calls."""

    @pytest.mark.asyncio
    async def test_rejects_non_automation_entity(self) -> None:
        """Test that non-automation entities are rejected."""
        from homeassistant.exceptions import ServiceValidationError

        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["light.test"],  # Not an automation
                hours=1,
            )

        assert exc_info.value.translation_key == "not_automation"

    @pytest.mark.asyncio
    async def test_rejects_switch_entity(self) -> None:
        """Test that switch entities are rejected."""
        from homeassistant.exceptions import ServiceValidationError

        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass,
                data,
                ["switch.test"],
                hours=1,
            )

        assert exc_info.value.translation_key == "not_automation"

    @pytest.mark.asyncio
    async def test_accepts_automation_entity(self) -> None:
        """Test that automation entities are accepted."""
        from custom_components.autosnooze.models import AutomationPauseData
        from custom_components.autosnooze.services import async_pause_automations

        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(
            attributes={"friendly_name": "Test"}
        )
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with patch("custom_components.autosnooze.services.schedule_resume"):
            await async_pause_automations(
                mock_hass,
                data,
                ["automation.test"],
                hours=1,
            )

        assert "automation.test" in data.paused


# =============================================================================
# DATETIME PARSING EDGE CASES
# =============================================================================


class TestDatetimeParsing:
    """Tests for datetime parsing utilities."""

    def test_parse_datetime_utc_with_timezone(self) -> None:
        """Test parsing datetime with timezone info."""
        from custom_components.autosnooze.models import parse_datetime_utc

        dt_str = "2024-12-25T14:30:00+00:00"
        result = parse_datetime_utc(dt_str)

        assert result.tzinfo is not None
        assert result.year == 2024
        assert result.month == 12
        assert result.day == 25

    def test_parse_datetime_utc_without_timezone(self) -> None:
        """Test parsing datetime without timezone assumes UTC."""
        from custom_components.autosnooze.models import parse_datetime_utc

        dt_str = "2024-12-25T14:30:00"
        result = parse_datetime_utc(dt_str)

        assert result.tzinfo == timezone.utc

    def test_parse_datetime_utc_invalid_string(self) -> None:
        """Test that invalid datetime string raises ValueError."""
        from custom_components.autosnooze.models import parse_datetime_utc

        with pytest.raises(ValueError):
            parse_datetime_utc("not-a-datetime")

    def test_parse_datetime_utc_empty_string(self) -> None:
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

        assert result.tzinfo == timezone.utc

    def test_ensure_utc_aware_with_aware_datetime(self) -> None:
        """Test ensure_utc_aware preserves aware datetime."""
        from custom_components.autosnooze.models import ensure_utc_aware

        aware_dt = datetime(2024, 12, 25, 14, 30, 0, tzinfo=timezone.utc)
        result = ensure_utc_aware(aware_dt)

        assert result == aware_dt
        assert result.tzinfo == timezone.utc


# =============================================================================
# STORAGE VALIDATION EDGE CASES
# =============================================================================


class TestStorageValidation:
    """Tests for storage validation edge cases."""

    def test_validate_stored_entry_with_float_days(self) -> None:
        """Test that float days value is rejected."""
        from custom_components.autosnooze.coordinator import validate_stored_entry

        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "days": 1.5,  # Float instead of int
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_validate_stored_entry_with_string_hours(self) -> None:
        """Test that string hours value is rejected."""
        from custom_components.autosnooze.coordinator import validate_stored_entry

        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "hours": "two",  # String instead of int
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_validate_stored_entry_with_none_resume_at(self) -> None:
        """Test that None resume_at is rejected."""
        from custom_components.autosnooze.coordinator import validate_stored_entry

        now = datetime.now(UTC)
        data = {
            "resume_at": None,  # None instead of datetime string
            "paused_at": now.isoformat(),
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_validate_stored_entry_with_empty_entity_id(self) -> None:
        """Test that empty entity_id is rejected."""
        from custom_components.autosnooze.coordinator import validate_stored_entry

        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
        }

        result = validate_stored_entry("", data, "paused")

        assert result is False

    def test_validate_stored_data_with_mixed_valid_invalid(self) -> None:
        """Test that mixed valid/invalid entries are filtered correctly."""
        from custom_components.autosnooze.coordinator import validate_stored_data

        now = datetime.now(UTC)
        storage_data = {
            "paused": {
                "automation.valid": {
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                },
                "automation.invalid_negative_days": {
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                    "days": -1,
                },
                "automation.invalid_missing_field": {
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    # Missing paused_at
                },
            },
            "scheduled": {},
        }

        result = validate_stored_data(storage_data)

        assert "automation.valid" in result["paused"]
        assert "automation.invalid_negative_days" not in result["paused"]
        assert "automation.invalid_missing_field" not in result["paused"]
        assert len(result["paused"]) == 1

    def test_validate_stored_data_with_completely_empty(self) -> None:
        """Test that completely empty storage returns empty dicts."""
        from custom_components.autosnooze.coordinator import validate_stored_data

        result = validate_stored_data({})

        assert result == {"paused": {}, "scheduled": {}}

    def test_validate_stored_data_with_missing_keys(self) -> None:
        """Test that missing paused/scheduled keys return empty dicts."""
        from custom_components.autosnooze.coordinator import validate_stored_data

        result = validate_stored_data({"some_other_key": "value"})

        assert result == {"paused": {}, "scheduled": {}}


# =============================================================================
# PERSISTENCE EDGE CASES
# =============================================================================


class TestPersistenceEdgeCases:
    """Tests for persistence edge cases."""

    @pytest.mark.asyncio
    async def test_save_with_none_store(self) -> None:
        """Test that save handles None store gracefully."""
        from custom_components.autosnooze.coordinator import async_save
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=None)

        result = await async_save(data)

        # Should return False or handle gracefully
        assert result is False

    @pytest.mark.asyncio
    async def test_save_with_empty_data(self) -> None:
        """Test that save works with empty paused/scheduled dicts."""
        from custom_components.autosnooze.coordinator import async_save
        from custom_components.autosnooze.models import AutomationPauseData

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        result = await async_save(data)

        assert result is True
        mock_store.async_save.assert_called_once()


# =============================================================================
# PAUSED AUTOMATION MODEL
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


# =============================================================================
# SCHEDULED SNOOZE MODEL
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


# =============================================================================
# AUTOMATION PAUSE DATA MODEL
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

    def test_get_paused_dict_with_items(self) -> None:
        """Test get_paused_dict returns correct format."""
        from custom_components.autosnooze.models import (
            AutomationPauseData,
            PausedAutomation,
        )

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
        from custom_components.autosnooze.models import (
            AutomationPauseData,
            ScheduledSnooze,
        )

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


# =============================================================================
# AREA AND LABEL FILTERING EDGE CASES
# =============================================================================


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


class TestAreaFilteringEdgeCases:
    """Tests for area filtering edge cases."""

    def test_empty_area_list_returns_empty(self) -> None:
        """Test that empty area list returns empty result."""
        from custom_components.autosnooze.services import get_automations_by_area

        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test": create_mock_entity(
                "automation.test", area_id="living_room"
            ),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, [])

        assert result == []

    def test_nonexistent_area_returns_empty(self) -> None:
        """Test that nonexistent area returns empty result."""
        from custom_components.autosnooze.services import get_automations_by_area

        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test": create_mock_entity(
                "automation.test", area_id="living_room"
            ),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_area(mock_hass, ["nonexistent_area"])

        assert result == []


class TestLabelFilteringEdgeCases:
    """Tests for label filtering edge cases."""

    def test_empty_label_list_returns_empty(self) -> None:
        """Test that empty label list returns empty result."""
        from custom_components.autosnooze.services import get_automations_by_label

        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test": create_mock_entity(
                "automation.test", labels={"test_label"}
            ),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, [])

        assert result == []

    def test_nonexistent_label_returns_empty(self) -> None:
        """Test that nonexistent label returns empty result."""
        from custom_components.autosnooze.services import get_automations_by_label

        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test": create_mock_entity(
                "automation.test", labels={"some_label"}
            ),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["nonexistent_label"])

        assert result == []

    def test_entity_with_empty_labels_set_not_matched(self) -> None:
        """Test that entity with empty labels set is not matched."""
        from custom_components.autosnooze.services import get_automations_by_label

        mock_hass = MagicMock()
        mock_entity_reg = MagicMock()
        mock_entity_reg.entities = {
            "automation.test": create_mock_entity("automation.test", labels=set()),
        }

        with patch(
            "custom_components.autosnooze.services.er.async_get",
            return_value=mock_entity_reg,
        ):
            result = get_automations_by_label(mock_hass, ["any_label"])

        assert result == []
