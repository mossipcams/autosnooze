"""Comprehensive tests for AutoSnooze services.

These tests verify:
1. Pause service with duration parameters
2. Pause service with date-based scheduling
3. Cancel (wake) service
4. Cancel all service
5. Pause by area service
6. Pause by label service
7. Cancel scheduled service
8. Error handling and validation
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.core import ServiceCall
from homeassistant.exceptions import ServiceValidationError

UTC = timezone.utc


class TestPauseService:
    """Tests for the main pause service."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        mock_state = MagicMock()
        mock_state.attributes = {"friendly_name": "Test Automation"}
        hass.states.get.return_value = mock_state
        return hass

    @pytest.fixture
    def mock_data(self) -> MagicMock:
        """Create mock automation pause data."""
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData()
        data.notify = MagicMock()
        return data

    @pytest.mark.asyncio
    async def test_pause_with_duration_parameters(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test pause service with days/hours/minutes parameters."""
        from custom_components.autosnooze.services import async_pause_automations

        with patch("custom_components.autosnooze.services.async_set_automation_state", return_value=True), patch(
            "custom_components.autosnooze.services.schedule_resume"
        ), patch("custom_components.autosnooze.services.async_save"):
            await async_pause_automations(
                mock_hass, mock_data, ["automation.test"], days=1, hours=2, minutes=30
            )

        # Should have added to paused dict
        assert "automation.test" in mock_data.paused
        paused = mock_data.paused["automation.test"]
        assert paused.days == 1
        assert paused.hours == 2
        assert paused.minutes == 30

    @pytest.mark.asyncio
    async def test_pause_with_resume_at_only(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test pause service with resume_at parameter (immediate disable)."""
        from custom_components.autosnooze.services import async_pause_automations

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=2)

        with patch("custom_components.autosnooze.services.async_set_automation_state", return_value=True), patch(
            "custom_components.autosnooze.services.schedule_resume"
        ), patch("custom_components.autosnooze.services.async_save"):
            await async_pause_automations(mock_hass, mock_data, ["automation.test"], resume_at_dt=resume_at)

        # Should have added to paused dict with resume_at
        assert "automation.test" in mock_data.paused
        paused = mock_data.paused["automation.test"]
        assert paused.resume_at == resume_at

    @pytest.mark.asyncio
    async def test_pause_with_disable_at_and_resume_at(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test pause service with both disable_at and resume_at (scheduled snooze)."""
        from custom_components.autosnooze.services import async_pause_automations

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=1)
        resume_at = now + timedelta(hours=3)

        with patch("custom_components.autosnooze.services.schedule_disable"), patch(
            "custom_components.autosnooze.services.async_save"
        ):
            await async_pause_automations(
                mock_hass, mock_data, ["automation.test"], disable_at=disable_at, resume_at_dt=resume_at
            )

        # Should have added to scheduled dict
        assert "automation.test" in mock_data.scheduled
        scheduled = mock_data.scheduled["automation.test"]
        assert scheduled.disable_at == disable_at
        assert scheduled.resume_at == resume_at

    @pytest.mark.asyncio
    async def test_pause_rejects_past_resume_time(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test that pause service rejects resume_at in the past."""
        from custom_components.autosnooze.services import async_pause_automations

        now = datetime.now(UTC)
        past_time = now - timedelta(hours=1)

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(mock_hass, mock_data, ["automation.test"], resume_at_dt=past_time)

        assert "resume_time_past" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_pause_rejects_disable_after_resume(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test that pause service rejects disable_at >= resume_at."""
        from custom_components.autosnooze.services import async_pause_automations

        now = datetime.now(UTC)
        disable_at = now + timedelta(hours=2)
        resume_at = now + timedelta(hours=1)  # Before disable_at

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(
                mock_hass, mock_data, ["automation.test"], disable_at=disable_at, resume_at_dt=resume_at
            )

        assert "disable_after_resume" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_pause_rejects_zero_duration(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test that pause service rejects zero duration."""
        from custom_components.autosnooze.services import async_pause_automations

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(mock_hass, mock_data, ["automation.test"], days=0, hours=0, minutes=0)

        assert "invalid_duration" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_pause_rejects_non_automation_entities(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test that pause service rejects non-automation entities."""
        from custom_components.autosnooze.services import async_pause_automations

        with pytest.raises(ServiceValidationError) as exc_info:
            await async_pause_automations(mock_hass, mock_data, ["light.test"], hours=1)

        assert "not_automation" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_pause_handles_multiple_entities(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test pause service with multiple entities."""
        from custom_components.autosnooze.services import async_pause_automations

        with patch("custom_components.autosnooze.services.async_set_automation_state", return_value=True), patch(
            "custom_components.autosnooze.services.schedule_resume"
        ), patch("custom_components.autosnooze.services.async_save"):
            await async_pause_automations(
                mock_hass, mock_data, ["automation.test1", "automation.test2"], hours=1
            )

        # Both should be paused
        assert "automation.test1" in mock_data.paused
        assert "automation.test2" in mock_data.paused

    @pytest.mark.asyncio
    async def test_pause_skips_entity_if_disable_fails(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test that pause service skips entity if disabling fails."""
        from custom_components.autosnooze.services import async_pause_automations

        with patch("custom_components.autosnooze.services.async_set_automation_state", return_value=False), patch(
            "custom_components.autosnooze.services.async_save"
        ):
            await async_pause_automations(mock_hass, mock_data, ["automation.test"], hours=1)

        # Should NOT be in paused dict if disable failed
        assert "automation.test" not in mock_data.paused


class TestCancelService:
    """Tests for the cancel (wake) service."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
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
        return data

    @pytest.mark.asyncio
    async def test_cancel_resumes_paused_automation(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test that cancel service resumes a paused automation."""
        from custom_components.autosnooze.coordinator import async_resume

        with patch("custom_components.autosnooze.coordinator.async_set_automation_state", return_value=True), patch(
            "custom_components.autosnooze.coordinator.async_save"
        ), patch("custom_components.autosnooze.coordinator.cancel_timer"):
            await async_resume(mock_hass, mock_data, "automation.test")

        # Should be removed from paused dict
        assert "automation.test" not in mock_data.paused


class TestCancelAllService:
    """Tests for the cancel_all service."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        return hass

    @pytest.fixture
    def mock_data(self) -> MagicMock:
        """Create mock automation pause data with multiple paused automations."""
        from custom_components.autosnooze.models import AutomationPauseData, PausedAutomation

        data = AutomationPauseData()
        now = datetime.now(UTC)
        for i in range(3):
            entity_id = f"automation.test{i}"
            data.paused[entity_id] = PausedAutomation(
                entity_id=entity_id,
                friendly_name=f"Test {i}",
                resume_at=now + timedelta(hours=1),
                paused_at=now,
            )
        return data

    @pytest.mark.asyncio
    async def test_cancel_all_resumes_all_paused_automations(self, mock_hass: MagicMock, mock_data: MagicMock) -> None:
        """Test that cancel_all resumes all paused automations."""
        from custom_components.autosnooze.coordinator import async_resume

        with patch("custom_components.autosnooze.coordinator.async_set_automation_state", return_value=True), patch(
            "custom_components.autosnooze.coordinator.async_save"
        ), patch("custom_components.autosnooze.coordinator.cancel_timer"):
            # Simulate cancel_all by resuming all
            for entity_id in list(mock_data.paused.keys()):
                await async_resume(mock_hass, mock_data, entity_id)

        # All should be removed
        assert len(mock_data.paused) == 0


class TestPauseByAreaService:
    """Tests for the pause_by_area service."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        mock_state = MagicMock()
        mock_state.attributes = {"friendly_name": "Test"}
        hass.states.get.return_value = mock_state
        return hass

    @pytest.mark.asyncio
    async def test_pause_by_area_finds_automations_in_area(self, mock_hass: MagicMock) -> None:
        """Test that pause_by_area finds automations in specified area."""
        from custom_components.autosnooze.services import get_automations_by_area

        with patch("custom_components.autosnooze.services.er.async_get") as mock_registry:
            mock_entity1 = MagicMock()
            mock_entity1.domain = "automation"
            mock_entity1.area_id = "living_room"
            mock_entity1.entity_id = "automation.lights"

            mock_entity2 = MagicMock()
            mock_entity2.domain = "automation"
            mock_entity2.area_id = "bedroom"
            mock_entity2.entity_id = "automation.fan"

            mock_registry.return_value.entities.values.return_value = [mock_entity1, mock_entity2]

            result = get_automations_by_area(mock_hass, ["living_room"])

        assert "automation.lights" in result
        assert "automation.fan" not in result

    @pytest.mark.asyncio
    async def test_pause_by_area_handles_multiple_areas(self, mock_hass: MagicMock) -> None:
        """Test that pause_by_area handles multiple area IDs."""
        from custom_components.autosnooze.services import get_automations_by_area

        with patch("custom_components.autosnooze.services.er.async_get") as mock_registry:
            mock_entity1 = MagicMock()
            mock_entity1.domain = "automation"
            mock_entity1.area_id = "living_room"
            mock_entity1.entity_id = "automation.lights"

            mock_entity2 = MagicMock()
            mock_entity2.domain = "automation"
            mock_entity2.area_id = "bedroom"
            mock_entity2.entity_id = "automation.fan"

            mock_registry.return_value.entities.values.return_value = [mock_entity1, mock_entity2]

            result = get_automations_by_area(mock_hass, ["living_room", "bedroom"])

        assert "automation.lights" in result
        assert "automation.fan" in result


class TestPauseByLabelService:
    """Tests for the pause_by_label service."""

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        return hass

    @pytest.mark.asyncio
    async def test_pause_by_label_finds_automations_with_label(self, mock_hass: MagicMock) -> None:
        """Test that pause_by_label finds automations with specified label."""
        from custom_components.autosnooze.services import get_automations_by_label

        with patch("custom_components.autosnooze.services.er.async_get") as mock_registry:
            mock_entity1 = MagicMock()
            mock_entity1.domain = "automation"
            mock_entity1.labels = ["lighting", "comfort"]
            mock_entity1.entity_id = "automation.lights"

            mock_entity2 = MagicMock()
            mock_entity2.domain = "automation"
            mock_entity2.labels = ["security"]
            mock_entity2.entity_id = "automation.alarm"

            mock_registry.return_value.entities.values.return_value = [mock_entity1, mock_entity2]

            result = get_automations_by_label(mock_hass, ["lighting"])

        assert "automation.lights" in result
        assert "automation.alarm" not in result

    @pytest.mark.asyncio
    async def test_pause_by_label_handles_multiple_labels(self, mock_hass: MagicMock) -> None:
        """Test that pause_by_label handles multiple label IDs."""
        from custom_components.autosnooze.services import get_automations_by_label

        with patch("custom_components.autosnooze.services.er.async_get") as mock_registry:
            mock_entity1 = MagicMock()
            mock_entity1.domain = "automation"
            mock_entity1.labels = ["lighting"]
            mock_entity1.entity_id = "automation.lights"

            mock_entity2 = MagicMock()
            mock_entity2.domain = "automation"
            mock_entity2.labels = ["security"]
            mock_entity2.entity_id = "automation.alarm"

            mock_registry.return_value.entities.values.return_value = [mock_entity1, mock_entity2]

            result = get_automations_by_label(mock_hass, ["lighting", "security"])

        assert "automation.lights" in result
        assert "automation.alarm" in result


class TestCancelScheduledService:
    """Tests for the cancel_scheduled service."""

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
        return data

    @pytest.mark.asyncio
    async def test_cancel_scheduled_removes_scheduled_snooze(
        self, mock_hass: MagicMock, mock_data: MagicMock
    ) -> None:
        """Test that cancel_scheduled removes scheduled snooze."""
        from custom_components.autosnooze.coordinator import async_cancel_scheduled

        with patch("custom_components.autosnooze.coordinator.async_save"), patch(
            "custom_components.autosnooze.coordinator.cancel_scheduled_timer"
        ):
            await async_cancel_scheduled(mock_hass, mock_data, "automation.test")

        # Should be removed from scheduled dict
        assert "automation.test" not in mock_data.scheduled


class TestTimezoneHandling:
    """Tests for timezone-aware datetime handling."""

    @pytest.mark.asyncio
    async def test_ensure_utc_aware_handles_naive_datetime(self) -> None:
        """Test that ensure_utc_aware adds UTC timezone to naive datetime."""
        from custom_components.autosnooze.models import ensure_utc_aware

        naive_dt = datetime(2024, 12, 25, 14, 30, 0)
        result = ensure_utc_aware(naive_dt)

        assert result.tzinfo is not None
        assert result.tzinfo == timezone.utc

    @pytest.mark.asyncio
    async def test_ensure_utc_aware_preserves_aware_datetime(self) -> None:
        """Test that ensure_utc_aware preserves already aware datetime."""
        from custom_components.autosnooze.models import ensure_utc_aware

        aware_dt = datetime(2024, 12, 25, 14, 30, 0, tzinfo=timezone.utc)
        result = ensure_utc_aware(aware_dt)

        assert result.tzinfo is not None
        assert result == aware_dt

    @pytest.mark.asyncio
    async def test_ensure_utc_aware_handles_none(self) -> None:
        """Test that ensure_utc_aware handles None input."""
        from custom_components.autosnooze.models import ensure_utc_aware

        result = ensure_utc_aware(None)

        assert result is None

    @pytest.mark.asyncio
    async def test_parse_datetime_utc_handles_naive_string(self) -> None:
        """Test that parse_datetime_utc adds UTC to naive datetime strings."""
        from custom_components.autosnooze.models import parse_datetime_utc

        result = parse_datetime_utc("2024-12-25T14:30:00")

        assert result.tzinfo is not None
        assert result.tzinfo == timezone.utc