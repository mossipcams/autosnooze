"""Additional coordinator tests to kill surviving mutations.

These tests specifically target mutations that survived in:
- async_set_automation_state
- async_resume
- async_resume_batch
- get_friendly_name
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME

from custom_components.autosnooze.coordinator import (
    async_resume,
    async_resume_batch,
    async_set_automation_state,
    get_friendly_name,
    cancel_timer,
    cancel_scheduled_timer,
    schedule_resume,
    async_save,
)
from custom_components.autosnooze.models import (
    AutomationPauseData,
    PausedAutomation,
)

UTC = timezone.utc


class TestAsyncSetAutomationStateMutations:
    """Tests targeting surviving mutations in async_set_automation_state."""

    @pytest.mark.asyncio
    async def test_turn_on_uses_correct_service_name(self) -> None:
        """Verify the exact service name 'turn_on' is used when enabling."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        # Must be exactly "turn_on", not any other string
        call_args = mock_hass.services.async_call.call_args
        assert call_args[0][0] == "automation"
        assert call_args[0][1] == "turn_on"

    @pytest.mark.asyncio
    async def test_turn_off_uses_correct_service_name(self) -> None:
        """Verify the exact service name 'turn_off' is used when disabling."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        await async_set_automation_state(mock_hass, "automation.test", enabled=False)

        # Must be exactly "turn_off", not any other string
        call_args = mock_hass.services.async_call.call_args
        assert call_args[0][0] == "automation"
        assert call_args[0][1] == "turn_off"

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


class TestGetFriendlyNameMutations:
    """Tests targeting surviving mutations in get_friendly_name."""

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
        mock_state.attributes = {}  # No friendly_name
        mock_hass.states.get.return_value = mock_state

        result = get_friendly_name(mock_hass, "automation.my_entity")

        assert result == "automation.my_entity"

    def test_returns_entity_id_when_state_is_none(self) -> None:
        """Verify returns entity_id when entity has no state."""
        mock_hass = MagicMock()
        mock_hass.states.get.return_value = None

        result = get_friendly_name(mock_hass, "automation.unknown_entity")

        assert result == "automation.unknown_entity"

    def test_uses_get_method_with_default(self) -> None:
        """Verify uses attributes.get with entity_id as default when key missing."""
        mock_hass = MagicMock()
        mock_state = MagicMock()
        mock_state.attributes = {}  # No friendly_name key at all
        mock_hass.states.get.return_value = mock_state

        result = get_friendly_name(mock_hass, "automation.test_entity")

        # When friendly_name key is missing, should return entity_id as default
        assert result == "automation.test_entity"


class TestAsyncResumeMutations:
    """Tests targeting surviving mutations in async_resume."""

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
    async def test_calls_set_automation_state_with_enabled_true(self) -> None:
        """Verify calls async_set_automation_state with enabled=True."""
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
    async def test_notifies_listeners_after_resume(self) -> None:
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


class TestAsyncResumeBatchMutations:
    """Tests targeting surviving mutations in async_resume_batch."""

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


class TestCancelTimerMutations:
    """Tests targeting surviving mutations in cancel_timer functions."""

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

        # Should not raise
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


class TestScheduleResumeMutations:
    """Tests targeting surviving mutations in schedule_resume."""

    def test_cancels_existing_timer_before_scheduling(self) -> None:
        """Verify existing timer is cancelled before new one is scheduled."""
        mock_hass = MagicMock()
        data = AutomationPauseData()

        old_unsub = MagicMock()
        data.timers["automation.test"] = old_unsub

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            schedule_resume(mock_hass, data, "automation.test", datetime.now(UTC) + timedelta(hours=1))

        old_unsub.assert_called_once()

    def test_stores_new_unsub_in_timers(self) -> None:
        """Verify new unsub function is stored in timers dict."""
        mock_hass = MagicMock()
        data = AutomationPauseData()

        new_unsub = MagicMock()
        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = new_unsub
            schedule_resume(mock_hass, data, "automation.test", datetime.now(UTC) + timedelta(hours=1))

        assert data.timers["automation.test"] == new_unsub


class TestAsyncSaveMutations:
    """Tests targeting surviving mutations in async_save."""

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
    async def test_returns_false_on_non_transient_error(self) -> None:
        """Verify returns False on non-transient error without retry."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock(side_effect=ValueError("Invalid data"))
        data = AutomationPauseData(store=mock_store)

        result = await async_save(data)

        assert result is False
        assert mock_store.async_save.call_count == 1  # No retries
