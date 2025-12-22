"""Comprehensive tests for AutoSnooze coordinator functions.

These tests verify:
1. Automation state management (enable/disable)
2. Timer scheduling and cancellation
3. Resume operations
4. Scheduled disable execution
5. Error handling in coordinator functions
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

UTC = timezone.utc


class TestAutomationStateManagement:
    """Tests for automation enable/disable operations."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        hass.services.async_call = AsyncMock()
        mock_state = MagicMock()
        mock_state.attributes = {"friendly_name": "Test"}
        hass.states.get.return_value = mock_state
        return hass

    @pytest.mark.asyncio
    async def test_async_set_automation_state_enables_automation(self, mock_hass: MagicMock) -> None:
        """Test that async_set_automation_state can enable automation."""
        from custom_components.autosnooze.coordinator import async_set_automation_state

        result = await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is True
        mock_hass.services.async_call.assert_called_once_with(
            "automation", "turn_on", {"entity_id": "automation.test"}, blocking=True
        )

    @pytest.mark.asyncio
    async def test_async_set_automation_state_disables_automation(self, mock_hass: MagicMock) -> None:
        """Test that async_set_automation_state can disable automation."""
        from custom_components.autosnooze.coordinator import async_set_automation_state

        result = await async_set_automation_state(mock_hass, "automation.test", enabled=False)

        assert result is True
        mock_hass.services.async_call.assert_called_once_with(
            "automation", "turn_off", {"entity_id": "automation.test"}, blocking=True
        )

    @pytest.mark.asyncio
    async def test_async_set_automation_state_returns_false_when_not_found(self, mock_hass: MagicMock) -> None:
        """Test that async_set_automation_state returns False when automation doesn't exist."""
        from custom_components.autosnooze.coordinator import async_set_automation_state

        mock_hass.states.get.return_value = None

        result = await async_set_automation_state(mock_hass, "automation.missing", enabled=True)

        assert result is False

    @pytest.mark.asyncio
    async def test_async_set_automation_state_handles_service_error(self, mock_hass: MagicMock) -> None:
        """Test that async_set_automation_state handles service call errors."""
        from custom_components.autosnooze.coordinator import async_set_automation_state

        mock_hass.services.async_call = AsyncMock(side_effect=Exception("Service failed"))

        result = await async_set_automation_state(mock_hass, "automation.test", enabled=True)

        assert result is False


class TestFriendlyNameRetrieval:
    """Tests for get_friendly_name helper."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        return hass

    def test_get_friendly_name_returns_from_attributes(self, mock_hass: MagicMock) -> None:
        """Test that get_friendly_name returns name from entity attributes."""
        from custom_components.autosnooze.coordinator import get_friendly_name

        mock_state = MagicMock()
        mock_state.attributes = {"friendly_name": "My Automation"}
        mock_hass.states.get.return_value = mock_state

        result = get_friendly_name(mock_hass, "automation.test")

        assert result == "My Automation"

    def test_get_friendly_name_returns_entity_id_as_fallback(self, mock_hass: MagicMock) -> None:
        """Test that get_friendly_name returns entity_id when state not found."""
        from custom_components.autosnooze.coordinator import get_friendly_name

        mock_hass.states.get.return_value = None

        result = get_friendly_name(mock_hass, "automation.test")

        assert result == "automation.test"


class TestTimerManagement:
    """Tests for timer scheduling and cancellation."""

    @pytest.fixture
    def mock_data(self) -> MagicMock:
        """Create mock automation pause data."""
        from custom_components.autosnooze.models import AutomationPauseData

        return AutomationPauseData()

    def test_cancel_timer_removes_and_calls_unsub(self, mock_data: MagicMock) -> None:
        """Test that cancel_timer removes timer and calls unsub function."""
        from custom_components.autosnooze.coordinator import cancel_timer

        unsub_mock = MagicMock()
        mock_data.timers["automation.test"] = unsub_mock

        cancel_timer(mock_data, "automation.test")

        unsub_mock.assert_called_once()
        assert "automation.test" not in mock_data.timers

    def test_cancel_timer_handles_missing_timer(self, mock_data: MagicMock) -> None:
        """Test that cancel_timer handles missing timer gracefully."""
        from custom_components.autosnooze.coordinator import cancel_timer

        # Should not raise error
        cancel_timer(mock_data, "automation.missing")

    def test_cancel_scheduled_timer_removes_and_calls_unsub(self, mock_data: MagicMock) -> None:
        """Test that cancel_scheduled_timer removes timer and calls unsub function."""
        from custom_components.autosnooze.coordinator import cancel_scheduled_timer

        unsub_mock = MagicMock()
        mock_data.scheduled_timers["automation.test"] = unsub_mock

        cancel_scheduled_timer(mock_data, "automation.test")

        unsub_mock.assert_called_once()
        assert "automation.test" not in mock_data.scheduled_timers


class TestResumeOperations:
    """Tests for resume (wake) operations."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        hass.services.async_call = AsyncMock()
        mock_state = MagicMock()
        mock_state.attributes = {"friendly_name": "Test"}
        hass.states.get.return_value = mock_state
        return hass

    @pytest.fixture
    def mock_data(self) -> MagicMock:
        """Create mock automation pause data with paused automation."""
        from custom_components.autosnooze.models import AutomationPauseData, PausedAutomation

        data = AutomationPauseData()
        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )
        data.notify = MagicMock()
        return data

    @pytest.mark.asyncio
    async def test_async_resume_enables_automation(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test that async_resume enables the automation."""
        from custom_components.autosnooze.coordinator import async_resume

        with patch("custom_components.autosnooze.coordinator.async_set_automation_state", return_value=True), patch(
            "custom_components.autosnooze.coordinator.async_save"
        ), patch("custom_components.autosnooze.coordinator.cancel_timer"):
            await async_resume(mock_hass, mock_data, "automation.test")

        # Should be removed from paused dict
        assert "automation.test" not in mock_data.paused
        mock_data.notify.assert_called_once()

    @pytest.mark.asyncio
    async def test_async_resume_cancels_timer(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test that async_resume cancels the resume timer."""
        from custom_components.autosnooze.coordinator import async_resume

        unsub_mock = MagicMock()
        mock_data.timers["automation.test"] = unsub_mock

        with patch("custom_components.autosnooze.coordinator.async_set_automation_state", return_value=True), patch(
            "custom_components.autosnooze.coordinator.async_save"
        ):
            await async_resume(mock_hass, mock_data, "automation.test")

        unsub_mock.assert_called_once()


class TestScheduledDisableExecution:
    """Tests for scheduled disable execution."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        hass.services.async_call = AsyncMock()
        mock_state = MagicMock()
        mock_state.attributes = {"friendly_name": "Test"}
        hass.states.get.return_value = mock_state
        return hass

    @pytest.fixture
    def mock_data(self) -> MagicMock:
        """Create mock automation pause data with scheduled snooze."""
        from custom_components.autosnooze.models import AutomationPauseData, ScheduledSnooze

        data = AutomationPauseData()
        now = datetime.now(UTC)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now - timedelta(minutes=1),
            resume_at=now + timedelta(hours=1),
        )
        data.notify = MagicMock()
        return data

    @pytest.mark.asyncio
    async def test_async_execute_scheduled_disable_moves_to_paused(
        self, mock_hass: MagicMock, mock_data: MagicMock
    ) -> None:
        """Test that executing scheduled disable moves snooze to paused."""
        from custom_components.autosnooze.coordinator import async_execute_scheduled_disable

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        with patch("custom_components.autosnooze.coordinator.async_set_automation_state", return_value=True), patch(
            "custom_components.autosnooze.coordinator.schedule_resume"
        ), patch("custom_components.autosnooze.coordinator.async_save"), patch(
            "custom_components.autosnooze.coordinator.cancel_scheduled_timer"
        ):
            await async_execute_scheduled_disable(mock_hass, mock_data, "automation.test", resume_at)

        # Should be removed from scheduled and added to paused
        assert "automation.test" not in mock_data.scheduled
        assert "automation.test" in mock_data.paused
        mock_data.notify.assert_called_once()

    @pytest.mark.asyncio
    async def test_async_execute_scheduled_disable_handles_disable_failure(
        self, mock_hass: MagicMock, mock_data: MagicMock
    ) -> None:
        """Test that execution handles automation disable failure."""
        from custom_components.autosnooze.coordinator import async_execute_scheduled_disable

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)

        with patch("custom_components.autosnooze.coordinator.async_set_automation_state", return_value=False), patch(
            "custom_components.autosnooze.coordinator.async_save"
        ), patch("custom_components.autosnooze.coordinator.cancel_scheduled_timer"):
            await async_execute_scheduled_disable(mock_hass, mock_data, "automation.test", resume_at)

        # Should be removed from scheduled but NOT added to paused if disable failed
        assert "automation.test" not in mock_data.scheduled
        assert "automation.test" not in mock_data.paused


class TestCancelScheduled:
    """Tests for canceling scheduled snoozes."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        return hass

    @pytest.fixture
    def mock_data(self) -> MagicMock:
        """Create mock automation pause data with scheduled snooze."""
        from custom_components.autosnooze.models import AutomationPauseData, ScheduledSnooze

        data = AutomationPauseData()
        now = datetime.now(UTC)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )
        data.notify = MagicMock()
        return data

    @pytest.mark.asyncio
    async def test_async_cancel_scheduled_removes_schedule(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test that cancel_scheduled removes scheduled snooze."""
        from custom_components.autosnooze.coordinator import async_cancel_scheduled

        with patch("custom_components.autosnooze.coordinator.async_save"), patch(
            "custom_components.autosnooze.coordinator.cancel_scheduled_timer"
        ):
            await async_cancel_scheduled(mock_hass, mock_data, "automation.test")

        # Should be removed from scheduled dict
        assert "automation.test" not in mock_data.scheduled
        mock_data.notify.assert_called_once()