"""Coordinator tests for AutoSnooze.

Consolidated from test_coordinator_coverage.py and test_coordinator_mutations.py.
Tests validation, save logic, scheduling, timers, and resume operations.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME

from custom_components.autosnooze.coordinator import (
    async_cancel_scheduled,
    async_cancel_scheduled_batch,
    async_execute_scheduled_disable,
    async_resume,
    async_resume_batch,
    async_save,
    async_set_automation_state,
    cancel_scheduled_timer,
    cancel_timer,
    get_friendly_name,
    schedule_disable,
    schedule_resume,
    validate_stored_data,
    validate_stored_entry,
)
from custom_components.autosnooze.models import (
    AutomationPauseData,
    PausedAutomation,
    ScheduledSnooze,
)

UTC = timezone.utc


# =============================================================================
# Validation Tests (Parametrized)
# =============================================================================


class TestValidateStoredEntry:
    """Tests for validate_stored_entry function using parametrization."""

    @pytest.mark.parametrize(
        "entity_id,data,entry_type,expected,description",
        [
            # Invalid entity ID
            (
                "light.test",
                {"resume_at": "2025-01-01T00:00:00+00:00", "paused_at": "2025-01-01T00:00:00+00:00"},
                "paused",
                False,
                "rejects non-automation entity ID",
            ),
            # Non-dict data
            ("automation.test", "not-a-dict", "paused", False, "rejects non-dict data"),
            ("automation.test", None, "paused", False, "rejects None data"),
            ("automation.test", [], "paused", False, "rejects list data"),
            # Missing required fields - paused
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
            # Missing required fields - scheduled
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
            # Invalid datetime format
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
            # Negative numeric fields
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
            # Non-numeric days
            (
                "automation.test",
                {"resume_at": "2025-01-01T01:00:00+00:00", "paused_at": "2025-01-01T00:00:00+00:00", "days": "one"},
                "paused",
                False,
                "rejects non-numeric days",
            ),
            # Scheduled time ordering
            (
                "automation.test",
                {"disable_at": "2025-01-01T02:00:00+00:00", "resume_at": "2025-01-01T01:00:00+00:00"},
                "scheduled",
                False,
                "rejects scheduled with resume_at before disable_at",
            ),
            (
                "automation.test",
                {"disable_at": "2025-01-01T01:00:00+00:00", "resume_at": "2025-01-01T01:00:00+00:00"},
                "scheduled",
                False,
                "rejects scheduled with resume_at equal to disable_at",
            ),
            # Valid entries
            (
                "automation.test",
                {"resume_at": "2025-01-01T01:00:00+00:00", "paused_at": "2025-01-01T00:00:00+00:00", "days": 0, "hours": 1},
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
            ({"paused": {}, "scheduled": "not-a-dict"}, True),
        ],
        ids=["non-dict", "none", "list", "non-dict-paused", "non-dict-scheduled"],
    )
    def test_handles_invalid_storage_types(self, storage_input, expected_empty: bool) -> None:
        """Test that invalid storage types return empty dicts."""
        result = validate_stored_data(storage_input)
        if expected_empty:
            assert result == {"paused": {}, "scheduled": {}}

    def test_filters_invalid_paused_entries(self) -> None:
        """Test that invalid paused entries are filtered out."""
        now = datetime.now(UTC)
        result = validate_stored_data(
            {
                "paused": {
                    "automation.valid": {
                        "resume_at": (now + timedelta(hours=1)).isoformat(),
                        "paused_at": now.isoformat(),
                    },
                    "light.invalid": {
                        "resume_at": (now + timedelta(hours=1)).isoformat(),
                        "paused_at": now.isoformat(),
                    },
                    "automation.missing_field": {
                        "resume_at": (now + timedelta(hours=1)).isoformat(),
                    },
                },
                "scheduled": {},
            }
        )

        assert "automation.valid" in result["paused"]
        assert "light.invalid" not in result["paused"]
        assert "automation.missing_field" not in result["paused"]

    def test_filters_invalid_scheduled_entries(self) -> None:
        """Test that invalid scheduled entries are filtered out."""
        now = datetime.now(UTC)
        result = validate_stored_data(
            {
                "paused": {},
                "scheduled": {
                    "automation.valid": {
                        "disable_at": (now + timedelta(hours=1)).isoformat(),
                        "resume_at": (now + timedelta(hours=2)).isoformat(),
                    },
                    "automation.invalid_order": {
                        "disable_at": (now + timedelta(hours=2)).isoformat(),
                        "resume_at": (now + timedelta(hours=1)).isoformat(),
                    },
                },
            }
        )

        assert "automation.valid" in result["scheduled"]
        assert "automation.invalid_order" not in result["scheduled"]

    def test_preserves_valid_entries(self) -> None:
        """Test that all valid entries are preserved."""
        now = datetime.now(UTC)
        result = validate_stored_data(
            {
                "paused": {
                    "automation.test1": {
                        "resume_at": (now + timedelta(hours=1)).isoformat(),
                        "paused_at": now.isoformat(),
                    },
                    "automation.test2": {
                        "resume_at": (now + timedelta(hours=2)).isoformat(),
                        "paused_at": now.isoformat(),
                    },
                },
                "scheduled": {
                    "automation.test3": {
                        "disable_at": (now + timedelta(hours=1)).isoformat(),
                        "resume_at": (now + timedelta(hours=2)).isoformat(),
                    },
                },
            }
        )

        assert len(result["paused"]) == 2
        assert len(result["scheduled"]) == 1


# =============================================================================
# Save Operations
# =============================================================================


class TestAsyncSave:
    """Tests for async_save function including retry logic."""

    @pytest.mark.asyncio
    async def test_returns_true_when_no_store(self) -> None:
        """Verify returns True when store is None."""
        data = AutomationPauseData(store=None)
        result = await async_save(data)
        assert result is True

    @pytest.mark.asyncio
    async def test_saves_correct_data_structure(self) -> None:
        """Verify saves correct data structure with paused and scheduled."""
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

        await async_save(data)

        call_args = mock_store.async_save.call_args[0][0]
        assert "paused" in call_args
        assert "scheduled" in call_args
        assert "automation.test" in call_args["paused"]

    @pytest.mark.asyncio
    async def test_returns_true_on_success(self) -> None:
        """Verify returns True when save succeeds."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        result = await async_save(data)
        assert result is True

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "error_type,should_retry",
        [
            (IOError, True),
            (OSError, True),
            (ValueError, False),
        ],
        ids=["ioerror-retries", "oserror-retries", "valueerror-no-retry"],
    )
    async def test_retry_behavior(self, error_type, should_retry: bool) -> None:
        """Test retry behavior for different error types."""
        mock_store = MagicMock()
        call_count = [0]

        async def failing_save(data):
            call_count[0] += 1
            if should_retry and call_count[0] < 3:
                raise error_type("Test error")
            elif not should_retry:
                raise error_type("Test error")

        mock_store.async_save = failing_save
        data = AutomationPauseData(store=mock_store)

        with patch("custom_components.autosnooze.coordinator.asyncio.sleep", new_callable=AsyncMock):
            result = await async_save(data)

        if should_retry:
            assert result is True
            assert call_count[0] == 3
        else:
            assert result is False
            assert call_count[0] == 1

    @pytest.mark.asyncio
    async def test_fails_after_max_retries(self) -> None:
        """Test that save fails after max retries exhausted."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=IOError("Persistent error"))
        data = AutomationPauseData(store=mock_store)

        with patch("custom_components.autosnooze.coordinator.asyncio.sleep", new_callable=AsyncMock):
            result = await async_save(data)

        assert result is False
        assert mock_store.async_save.call_count == 4  # Initial + 3 retries


# =============================================================================
# Timer Management
# =============================================================================


class TestCancelTimer:
    """Tests for cancel_timer and cancel_scheduled_timer functions."""

    def test_cancel_timer_calls_unsub(self) -> None:
        """Verify unsub function is called when cancelling timer."""
        data = AutomationPauseData()
        unsub = MagicMock()
        data.timers["automation.test"] = unsub

        cancel_timer(data, "automation.test")

        unsub.assert_called_once()

    def test_cancel_timer_removes_from_dict(self) -> None:
        """Verify entity is removed from timers dict."""
        data = AutomationPauseData()
        unsub = MagicMock()
        data.timers["automation.test"] = unsub

        cancel_timer(data, "automation.test")

        assert "automation.test" not in data.timers

    def test_cancel_timer_no_error_when_not_exists(self) -> None:
        """Verify no error when cancelling non-existent timer."""
        data = AutomationPauseData()
        cancel_timer(data, "automation.nonexistent")

    def test_cancel_scheduled_timer_calls_unsub(self) -> None:
        """Verify unsub function is called when cancelling scheduled timer."""
        data = AutomationPauseData()
        unsub = MagicMock()
        data.scheduled_timers["automation.test"] = unsub

        cancel_scheduled_timer(data, "automation.test")

        unsub.assert_called_once()

    def test_cancel_scheduled_timer_removes_from_dict(self) -> None:
        """Verify entity is removed from scheduled_timers dict."""
        data = AutomationPauseData()
        unsub = MagicMock()
        data.scheduled_timers["automation.test"] = unsub

        cancel_scheduled_timer(data, "automation.test")

        assert "automation.test" not in data.scheduled_timers


# =============================================================================
# Scheduling
# =============================================================================


class TestScheduleResume:
    """Tests for schedule_resume function."""

    def test_cancels_existing_timer(self) -> None:
        """Test that existing timer is cancelled before scheduling new one."""
        mock_hass = MagicMock()
        data = AutomationPauseData()
        old_unsub = MagicMock()
        data.timers["automation.test"] = old_unsub

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            schedule_resume(mock_hass, data, "automation.test", datetime.now(UTC) + timedelta(hours=1))

        old_unsub.assert_called_once()

    def test_schedules_new_timer(self) -> None:
        """Test that new timer is scheduled and stored."""
        mock_hass = MagicMock()
        data = AutomationPauseData()

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            new_unsub = MagicMock()
            mock_track.return_value = new_unsub
            resume_at = datetime.now(UTC) + timedelta(hours=1)

            schedule_resume(mock_hass, data, "automation.test", resume_at)

        mock_track.assert_called_once()
        assert data.timers["automation.test"] == new_unsub


class TestScheduleDisable:
    """Tests for schedule_disable function."""

    def test_cancels_existing_scheduled_timer(self) -> None:
        """Test that existing scheduled timer is cancelled."""
        mock_hass = MagicMock()
        data = AutomationPauseData()
        old_unsub = MagicMock()
        data.scheduled_timers["automation.test"] = old_unsub

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

        old_unsub.assert_called_once()

    def test_schedules_new_disable_timer(self) -> None:
        """Test that new disable timer is scheduled."""
        mock_hass = MagicMock()
        data = AutomationPauseData()

        now = datetime.now(UTC)
        scheduled = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            new_unsub = MagicMock()
            mock_track.return_value = new_unsub
            schedule_disable(mock_hass, data, "automation.test", scheduled)

        mock_track.assert_called_once()
        assert data.scheduled_timers["automation.test"] == new_unsub


# =============================================================================
# Automation State Management
# =============================================================================


class TestAsyncSetAutomationState:
    """Tests for async_set_automation_state function."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "enabled,expected_service",
        [(True, "turn_on"), (False, "turn_off")],
        ids=["enable-uses-turn_on", "disable-uses-turn_off"],
    )
    async def test_uses_correct_service(self, enabled: bool, expected_service: str) -> None:
        """Verify correct service name is used."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        await async_set_automation_state(mock_hass, "automation.test", enabled=enabled)

        call_args = mock_hass.services.async_call.call_args
        assert call_args[0][0] == "automation"
        assert call_args[0][1] == expected_service

    @pytest.mark.asyncio
    async def test_uses_correct_entity_id_in_service_call(self) -> None:
        """Verify the entity_id is correctly passed to service call."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        await async_set_automation_state(mock_hass, "automation.specific_one", enabled=True)

        call_args = mock_hass.services.async_call.call_args
        assert call_args[0][2] == {ATTR_ENTITY_ID: "automation.specific_one"}

    @pytest.mark.asyncio
    async def test_uses_blocking_true(self) -> None:
        """Verify blocking=True is passed to service call."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        call_args = mock_hass.services.async_call.call_args
        assert call_args[1]["blocking"] is True

    @pytest.mark.asyncio
    async def test_returns_true_on_success(self) -> None:
        """Verify returns True when service call succeeds."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        result = await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_when_state_is_none(self) -> None:
        """Verify returns False when automation doesn't exist."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None
        mock_hass.services.async_call = AsyncMock()

        result = await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is False
        mock_hass.services.async_call.assert_not_called()

    @pytest.mark.asyncio
    async def test_returns_false_on_exception(self) -> None:
        """Verify returns False when exception occurs."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock(side_effect=Exception("Error"))

        result = await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is False


class TestGetFriendlyName:
    """Tests for get_friendly_name function."""

    def test_returns_friendly_name_when_present(self) -> None:
        """Verify returns the friendly_name attribute value."""
        mock_hass = MagicMock()
        mock_state = MagicMock()
        mock_state.attributes = {ATTR_FRIENDLY_NAME: "My Friendly Name"}
        mock_hass.states.get.return_value = mock_state

        result = get_friendly_name(mock_hass, "automation.test")

        assert result == "My Friendly Name"

    def test_returns_entity_id_when_no_friendly_name(self) -> None:
        """Verify returns entity_id when friendly_name not in attributes."""
        mock_hass = MagicMock()
        mock_state = MagicMock()
        mock_state.attributes = {}
        mock_hass.states.get.return_value = mock_state

        result = get_friendly_name(mock_hass, "automation.my_entity")

        assert result == "automation.my_entity"

    def test_returns_entity_id_when_state_is_none(self) -> None:
        """Verify returns entity_id when entity has no state."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None

        result = get_friendly_name(mock_hass, "automation.unknown_entity")

        assert result == "automation.unknown_entity"


# =============================================================================
# Resume Operations
# =============================================================================


class TestAsyncResume:
    """Tests for async_resume function."""

    @pytest.mark.asyncio
    async def test_skips_when_unloaded(self) -> None:
        """Verify early return when data.unloaded is True."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.unloaded = True
        mock_hass.services.async_call = AsyncMock()

        await async_resume(mock_hass, data, "automation.test")

        mock_hass.services.async_call.assert_not_called()

    @pytest.mark.asyncio
    async def test_cancels_timer_for_entity(self) -> None:
        """Verify timer is cancelled for the entity."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        unsub = MagicMock()
        data.timers["automation.test"] = unsub

        await async_resume(mock_hass, data, "automation.test")

        unsub.assert_called_once()
        assert "automation.test" not in data.timers

    @pytest.mark.asyncio
    async def test_removes_from_paused_dict(self) -> None:
        """Verify entity is removed from paused dict."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
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

        await async_resume(mock_hass, data, "automation.test")

        assert "automation.test" not in data.paused

    @pytest.mark.asyncio
    async def test_calls_turn_on_service(self) -> None:
        """Verify calls turn_on service."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_resume(mock_hass, data, "automation.test")

        mock_hass.services.async_call.assert_called_once()
        call_args = mock_hass.services.async_call.call_args
        assert call_args[0][1] == "turn_on"

    @pytest.mark.asyncio
    async def test_saves_after_resume(self) -> None:
        """Verify data is saved after resume."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_resume(mock_hass, data, "automation.test")

        mock_store.async_save.assert_called_once()

    @pytest.mark.asyncio
    async def test_notifies_listeners(self) -> None:
        """Verify listeners are notified after resume."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        listener = MagicMock()
        data.add_listener(listener)

        await async_resume(mock_hass, data, "automation.test")

        listener.assert_called_once()


class TestAsyncResumeBatch:
    """Tests for async_resume_batch function."""

    @pytest.mark.asyncio
    async def test_skips_when_unloaded(self) -> None:
        """Verify early return when data.unloaded is True."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.unloaded = True
        mock_hass.services.async_call = AsyncMock()

        await async_resume_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        mock_hass.services.async_call.assert_not_called()

    @pytest.mark.asyncio
    async def test_skips_when_empty_list(self) -> None:
        """Verify early return when entity_ids is empty."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        mock_hass.services.async_call = AsyncMock()

        await async_resume_batch(mock_hass, data, [])

        mock_hass.services.async_call.assert_not_called()
        mock_store.async_save.assert_not_called()

    @pytest.mark.asyncio
    async def test_resumes_all_entities(self) -> None:
        """Verify all entities are resumed."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

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
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )

        await async_resume_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        assert "automation.test1" not in data.paused
        assert "automation.test2" not in data.paused
        assert mock_hass.services.async_call.call_count == 2

    @pytest.mark.asyncio
    async def test_single_save_for_batch(self) -> None:
        """Verify only one save is performed for batch."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_resume_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        assert mock_store.async_save.call_count == 1

    @pytest.mark.asyncio
    async def test_single_notify_for_batch(self) -> None:
        """Verify only one notify is performed for batch."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        listener = MagicMock()
        data.add_listener(listener)

        await async_resume_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        assert listener.call_count == 1


# =============================================================================
# Execute Scheduled Disable
# =============================================================================


class TestAsyncExecuteScheduledDisable:
    """Tests for async_execute_scheduled_disable function."""

    @pytest.mark.asyncio
    async def test_cancels_scheduled_timer(self) -> None:
        """Test that scheduled timer is cancelled during execution."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        unsub = MagicMock()
        data.scheduled_timers["automation.test"] = unsub

        now = datetime.now(UTC)
        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(mock_hass, data, "automation.test", now + timedelta(hours=1))

        unsub.assert_called_once()
        assert "automation.test" not in data.scheduled_timers

    @pytest.mark.asyncio
    async def test_adds_to_paused_on_success(self) -> None:
        """Test that automation is added to paused dict on successful disable."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(mock_hass, data, "automation.test", now + timedelta(hours=1))

        assert "automation.test" in data.paused

    @pytest.mark.asyncio
    async def test_uses_scheduled_friendly_name(self) -> None:
        """Test that friendly name from scheduled snooze is used."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Original Name",
            disable_at=now,
            resume_at=now + timedelta(hours=1),
        )

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(mock_hass, data, "automation.test", now + timedelta(hours=1))

        assert data.paused["automation.test"].friendly_name == "Original Name"

    @pytest.mark.asyncio
    async def test_notifies_listeners(self) -> None:
        """Test that listeners are notified after execution."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        listener = MagicMock()
        data.add_listener(listener)

        now = datetime.now(UTC)
        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(mock_hass, data, "automation.test", now + timedelta(hours=1))

        listener.assert_called()


# =============================================================================
# Cancel Scheduled Operations
# =============================================================================


class TestAsyncCancelScheduled:
    """Tests for async_cancel_scheduled function."""

    @pytest.mark.asyncio
    async def test_cancels_timer(self) -> None:
        """Test that scheduled timer is cancelled."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        unsub = MagicMock()
        data.scheduled_timers["automation.test"] = unsub

        await async_cancel_scheduled(mock_hass, data, "automation.test")

        unsub.assert_called_once()
        assert "automation.test" not in data.scheduled_timers

    @pytest.mark.asyncio
    async def test_removes_from_scheduled_dict(self) -> None:
        """Test that automation is removed from scheduled dict."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        await async_cancel_scheduled(mock_hass, data, "automation.test")

        assert "automation.test" not in data.scheduled

    @pytest.mark.asyncio
    async def test_saves_after_cancel(self) -> None:
        """Test that data is saved after cancellation."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_cancel_scheduled(mock_hass, data, "automation.test")

        mock_store.async_save.assert_called()

    @pytest.mark.asyncio
    async def test_notifies_listeners(self) -> None:
        """Test that listeners are notified after cancellation."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        listener = MagicMock()
        data.add_listener(listener)

        await async_cancel_scheduled(mock_hass, data, "automation.test")

        listener.assert_called()


class TestAsyncCancelScheduledBatch:
    """Tests for async_cancel_scheduled_batch function."""

    @pytest.mark.asyncio
    async def test_cancels_multiple_timers(self) -> None:
        """Test that multiple scheduled timers are cancelled."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        unsub1 = MagicMock()
        unsub2 = MagicMock()
        data.scheduled_timers["automation.test1"] = unsub1
        data.scheduled_timers["automation.test2"] = unsub2

        await async_cancel_scheduled_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        unsub1.assert_called_once()
        unsub2.assert_called_once()
        assert "automation.test1" not in data.scheduled_timers
        assert "automation.test2" not in data.scheduled_timers

    @pytest.mark.asyncio
    async def test_removes_from_scheduled_dict(self) -> None:
        """Test that automations are removed from scheduled dict."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

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
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        await async_cancel_scheduled_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        assert "automation.test1" not in data.scheduled
        assert "automation.test2" not in data.scheduled

    @pytest.mark.asyncio
    async def test_single_save_for_batch(self) -> None:
        """Test that only one save is performed for batch cancellation."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_cancel_scheduled_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        assert mock_store.async_save.call_count == 1

    @pytest.mark.asyncio
    async def test_notifies_listeners_once(self) -> None:
        """Test that listeners are notified once after batch cancellation."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        listener = MagicMock()
        data.add_listener(listener)

        await async_cancel_scheduled_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        assert listener.call_count == 1

    @pytest.mark.asyncio
    async def test_handles_empty_list(self) -> None:
        """Test that empty list is handled gracefully."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_cancel_scheduled_batch(mock_hass, data, [])

        mock_store.async_save.assert_not_called()

    @pytest.mark.asyncio
    async def test_skips_when_unloaded(self) -> None:
        """Test that batch cancel is skipped when integration is unloaded."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.unloaded = True

        await async_cancel_scheduled_batch(mock_hass, data, ["automation.test"])

        mock_store.async_save.assert_not_called()
