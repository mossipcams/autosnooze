"""Additional tests for coordinator.py to improve coverage.

These tests focus on validation functions and save retry logic.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze.coordinator import (
    async_cancel_scheduled,
    async_cancel_scheduled_batch,
    async_execute_scheduled_disable,
    async_save,
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


class TestValidateStoredEntry:
    """Tests for validate_stored_entry function."""

    def test_rejects_non_automation_entity_id(self) -> None:
        """Test that non-automation entity IDs are rejected."""
        data = {
            "resume_at": datetime.now(UTC).isoformat(),
            "paused_at": datetime.now(UTC).isoformat(),
        }

        result = validate_stored_entry("light.test", data, "paused")

        assert result is False

    def test_rejects_non_dict_data(self) -> None:
        """Test that non-dict data is rejected."""
        result = validate_stored_entry("automation.test", "not-a-dict", "paused")

        assert result is False

    def test_rejects_paused_entry_missing_resume_at(self) -> None:
        """Test that paused entry missing resume_at is rejected."""
        data = {
            "paused_at": datetime.now(UTC).isoformat(),
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_rejects_paused_entry_missing_paused_at(self) -> None:
        """Test that paused entry missing paused_at is rejected."""
        data = {
            "resume_at": datetime.now(UTC).isoformat(),
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_rejects_scheduled_entry_missing_disable_at(self) -> None:
        """Test that scheduled entry missing disable_at is rejected."""
        data = {
            "resume_at": datetime.now(UTC).isoformat(),
        }

        result = validate_stored_entry("automation.test", data, "scheduled")

        assert result is False

    def test_rejects_scheduled_entry_missing_resume_at(self) -> None:
        """Test that scheduled entry missing resume_at is rejected."""
        data = {
            "disable_at": datetime.now(UTC).isoformat(),
        }

        result = validate_stored_entry("automation.test", data, "scheduled")

        assert result is False

    def test_rejects_invalid_datetime_in_resume_at(self) -> None:
        """Test that invalid datetime in resume_at is rejected."""
        data = {
            "resume_at": "not-a-datetime",
            "paused_at": datetime.now(UTC).isoformat(),
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_rejects_invalid_datetime_in_paused_at(self) -> None:
        """Test that invalid datetime in paused_at is rejected."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": "not-a-datetime",
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_rejects_negative_days(self) -> None:
        """Test that negative days value is rejected."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "days": -1,
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_rejects_negative_hours(self) -> None:
        """Test that negative hours value is rejected."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "hours": -1,
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_rejects_negative_minutes(self) -> None:
        """Test that negative minutes value is rejected."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "minutes": -1,
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_rejects_non_numeric_days(self) -> None:
        """Test that non-numeric days value is rejected."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "days": "one",
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is False

    def test_rejects_scheduled_with_resume_before_disable(self) -> None:
        """Test that scheduled entry with resume_at <= disable_at is rejected."""
        now = datetime.now(UTC)
        data = {
            "disable_at": (now + timedelta(hours=2)).isoformat(),
            "resume_at": (now + timedelta(hours=1)).isoformat(),  # Before disable_at
        }

        result = validate_stored_entry("automation.test", data, "scheduled")

        assert result is False

    def test_rejects_scheduled_with_resume_equal_disable(self) -> None:
        """Test that scheduled entry with resume_at == disable_at is rejected."""
        now = datetime.now(UTC)
        data = {
            "disable_at": (now + timedelta(hours=1)).isoformat(),
            "resume_at": (now + timedelta(hours=1)).isoformat(),  # Same as disable_at
        }

        result = validate_stored_entry("automation.test", data, "scheduled")

        assert result is False

    def test_accepts_valid_paused_entry(self) -> None:
        """Test that valid paused entry is accepted."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            "days": 0,
            "hours": 1,
            "minutes": 0,
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is True

    def test_accepts_valid_scheduled_entry(self) -> None:
        """Test that valid scheduled entry is accepted."""
        now = datetime.now(UTC)
        data = {
            "disable_at": (now + timedelta(hours=1)).isoformat(),
            "resume_at": (now + timedelta(hours=2)).isoformat(),
        }

        result = validate_stored_entry("automation.test", data, "scheduled")

        assert result is True

    def test_accepts_paused_entry_without_optional_fields(self) -> None:
        """Test that paused entry without optional numeric fields is accepted."""
        now = datetime.now(UTC)
        data = {
            "resume_at": (now + timedelta(hours=1)).isoformat(),
            "paused_at": now.isoformat(),
            # No days, hours, minutes - they default to 0
        }

        result = validate_stored_entry("automation.test", data, "paused")

        assert result is True


class TestValidateStoredData:
    """Tests for validate_stored_data function."""

    def test_handles_non_dict_storage(self) -> None:
        """Test that non-dict storage returns empty dicts."""
        result = validate_stored_data("not-a-dict")

        assert result == {"paused": {}, "scheduled": {}}

    def test_handles_none_storage(self) -> None:
        """Test that None storage returns empty dicts."""
        result = validate_stored_data(None)

        assert result == {"paused": {}, "scheduled": {}}

    def test_handles_list_storage(self) -> None:
        """Test that list storage returns empty dicts."""
        result = validate_stored_data([1, 2, 3])

        assert result == {"paused": {}, "scheduled": {}}

    def test_handles_non_dict_paused_value(self) -> None:
        """Test that non-dict paused value is handled."""
        result = validate_stored_data({"paused": "not-a-dict", "scheduled": {}})

        assert result == {"paused": {}, "scheduled": {}}

    def test_handles_non_dict_scheduled_value(self) -> None:
        """Test that non-dict scheduled value is handled."""
        result = validate_stored_data({"paused": {}, "scheduled": "not-a-dict"})

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
                    "light.invalid": {  # Invalid entity type
                        "resume_at": (now + timedelta(hours=1)).isoformat(),
                        "paused_at": now.isoformat(),
                    },
                    "automation.missing_field": {  # Missing required field
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
                        "resume_at": (now + timedelta(hours=1)).isoformat(),  # Before disable
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


class TestAsyncSaveRetryLogic:
    """Tests for async_save retry logic."""

    @pytest.mark.asyncio
    async def test_retries_on_ioerror(self) -> None:
        """Test that save retries on IOError."""
        mock_store = MagicMock()
        call_count = [0]

        async def failing_save(data):
            call_count[0] += 1
            if call_count[0] < 3:
                raise IOError("Disk error")

        mock_store.async_save = failing_save
        data = AutomationPauseData(store=mock_store)

        result = await async_save(data)

        assert result is True
        assert call_count[0] == 3  # Failed twice, succeeded on third

    @pytest.mark.asyncio
    async def test_retries_on_oserror(self) -> None:
        """Test that save retries on OSError."""
        mock_store = MagicMock()
        call_count = [0]

        async def failing_save(data):
            call_count[0] += 1
            if call_count[0] < 2:
                raise OSError("File system error")

        mock_store.async_save = failing_save
        data = AutomationPauseData(store=mock_store)

        result = await async_save(data)

        assert result is True
        assert call_count[0] == 2

    @pytest.mark.asyncio
    async def test_fails_after_max_retries(self) -> None:
        """Test that save fails after max retries exhausted."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=IOError("Persistent error"))
        data = AutomationPauseData(store=mock_store)

        # Patch the sleep to avoid actual delays in tests
        with patch("custom_components.autosnooze.coordinator.asyncio.sleep", new_callable=AsyncMock):
            result = await async_save(data)

        assert result is False
        # Initial + 3 retries = 4 total calls
        assert mock_store.async_save.call_count == 4

    @pytest.mark.asyncio
    async def test_no_retry_on_non_transient_error(self) -> None:
        """Test that non-transient errors don't trigger retry."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=ValueError("Invalid data"))
        data = AutomationPauseData(store=mock_store)

        result = await async_save(data)

        assert result is False
        assert mock_store.async_save.call_count == 1  # No retries


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
            now = datetime.now(UTC)
            schedule_resume(mock_hass, data, "automation.test", now + timedelta(hours=1))

        old_unsub.assert_called_once()

    def test_schedules_new_timer(self) -> None:
        """Test that new timer is scheduled."""
        mock_hass = MagicMock()
        data = AutomationPauseData()

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            new_unsub = MagicMock()
            mock_track.return_value = new_unsub
            now = datetime.now(UTC)
            resume_at = now + timedelta(hours=1)

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
        resume_at = now + timedelta(hours=1)

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(mock_hass, data, "automation.test", resume_at)

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
        resume_at = now + timedelta(hours=1)

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(mock_hass, data, "automation.test", resume_at)

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

        # Should only be called once, not twice
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

        # Listener should only be called once
        assert listener.call_count == 1

    @pytest.mark.asyncio
    async def test_handles_empty_list(self) -> None:
        """Test that empty list is handled gracefully."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_cancel_scheduled_batch(mock_hass, data, [])

        # Should not call save for empty list
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
