"""Tests for User Flow 4: Scheduled Snoozes.

This file tests scheduled snooze operations including:
- Schedule disable (disable_at parameter)
- Cancel scheduled snoozes
- Scheduled snooze data model
- Execute scheduled disable
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.const import ATTR_ENTITY_ID
import voluptuous as vol

from custom_components.autosnooze import DOMAIN
from custom_components.autosnooze.coordinator import (
    async_cancel_scheduled,
    async_cancel_scheduled_batch,
    async_execute_scheduled_disable,
    cancel_scheduled_timer,
    schedule_disable,
)
from custom_components.autosnooze.models import (
    AutomationPauseData,
    ScheduledSnooze,
)

UTC = timezone.utc


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable custom integrations for all tests."""
    yield


@pytest.fixture(autouse=True)
async def mock_dependencies(hass: HomeAssistant):
    """Mock dependencies required by AutoSnooze for all tests."""
    mock_resources = MagicMock()
    mock_resources.async_items.return_value = []
    mock_resources.async_create_item = AsyncMock()
    mock_resources.async_update_item = AsyncMock()
    mock_lovelace = MagicMock()
    mock_lovelace.resources = mock_resources
    hass.data["lovelace"] = mock_lovelace

    if not hasattr(hass, "http") or hass.http is None:
        hass.http = MagicMock()
    hass.http.async_register_static_paths = AsyncMock()

    for dep in ["frontend", "http", "lovelace", "automation"]:
        hass.config.components.add(dep)

    async def mock_automation_service(call):
        pass

    hass.services.async_register("automation", "turn_on", mock_automation_service)
    hass.services.async_register("automation", "turn_off", mock_automation_service)
    hass.services.async_register("automation", "toggle", mock_automation_service)

    yield


@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    """Create a mock config entry."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="AutoSnooze",
        data={},
        unique_id=DOMAIN,
        version=1,
    )


@pytest.fixture
async def setup_integration(hass: HomeAssistant, mock_config_entry: MockConfigEntry):
    """Set up the AutoSnooze integration."""
    mock_config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    return hass.config_entries.async_get_entry(mock_config_entry.entry_id)


# =============================================================================
# ScheduledSnooze Model Tests
# =============================================================================


class TestScheduledSnooze:
    """Tests for ScheduledSnooze dataclass."""

    @pytest.fixture
    def sample_scheduled_snooze(self) -> ScheduledSnooze:
        """Create a sample scheduled snooze."""
        now = datetime.now(UTC)
        return ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test Automation",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

    def test_to_dict_returns_correct_structure(self, sample_scheduled_snooze: ScheduledSnooze) -> None:
        """Test to_dict returns all fields in correct format."""
        result = sample_scheduled_snooze.to_dict()

        assert "friendly_name" in result
        assert "disable_at" in result
        assert "resume_at" in result
        assert result["friendly_name"] == "Test Automation"

    def test_to_dict_datetime_as_isoformat(self, sample_scheduled_snooze: ScheduledSnooze) -> None:
        """Test datetime fields are serialized as ISO format strings."""
        result = sample_scheduled_snooze.to_dict()

        datetime.fromisoformat(result["disable_at"])
        datetime.fromisoformat(result["resume_at"])

    def test_from_dict_creates_correct_instance(self) -> None:
        """Test from_dict creates ScheduledSnooze with correct values."""
        now = datetime.now(UTC)
        data = {
            "friendly_name": "My Scheduled",
            "disable_at": (now + timedelta(hours=1)).isoformat(),
            "resume_at": (now + timedelta(hours=2)).isoformat(),
        }

        result = ScheduledSnooze.from_dict("automation.test", data)

        assert result.entity_id == "automation.test"
        assert result.friendly_name == "My Scheduled"

    def test_from_dict_defaults_missing_friendly_name(self) -> None:
        """Test from_dict uses entity_id as default friendly_name."""
        now = datetime.now(UTC)
        data = {
            "disable_at": (now + timedelta(hours=1)).isoformat(),
            "resume_at": (now + timedelta(hours=2)).isoformat(),
        }

        result = ScheduledSnooze.from_dict("automation.test", data)

        assert result.friendly_name == "automation.test"

    def test_roundtrip_serialization(self, sample_scheduled_snooze: ScheduledSnooze) -> None:
        """Test data survives serialization roundtrip."""
        serialized = sample_scheduled_snooze.to_dict()
        restored = ScheduledSnooze.from_dict(sample_scheduled_snooze.entity_id, serialized)

        assert restored.entity_id == sample_scheduled_snooze.entity_id
        assert restored.friendly_name == sample_scheduled_snooze.friendly_name


# =============================================================================
# Schedule Disable Tests
# =============================================================================


class TestScheduleDisable:
    """Tests for schedule_disable function."""

    def test_schedule_disable_creates_timer(self) -> None:
        """Test schedule_disable creates a timer entry."""
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        scheduled = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now + timedelta(hours=1),
            resume_at=now + timedelta(hours=2),
        )

        with patch("custom_components.autosnooze.coordinator.async_track_point_in_time") as mock_track:
            mock_track.return_value = MagicMock()
            schedule_disable(
                mock_hass,
                data,
                "automation.test",
                scheduled,
            )

        assert "automation.test" in data.scheduled_timers


# =============================================================================
# Cancel Scheduled Timer Tests
# =============================================================================


class TestCancelScheduledTimer:
    """Tests for cancel_scheduled_timer function."""

    def test_cancel_scheduled_timer_removes_from_dict(self) -> None:
        """Test cancelling a scheduled timer removes it from the dict."""
        mock_cancel = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.scheduled_timers["automation.test"] = mock_cancel

        cancel_scheduled_timer(data, "automation.test")

        assert "automation.test" not in data.scheduled_timers
        mock_cancel.assert_called_once()

    def test_cancel_scheduled_timer_nonexistent_is_noop(self) -> None:
        """Test cancelling nonexistent timer is a no-op."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        cancel_scheduled_timer(data, "automation.nonexistent")
        assert len(data.scheduled_timers) == 0


# =============================================================================
# Async Cancel Scheduled Tests
# =============================================================================


class TestAsyncCancelScheduled:
    """Tests for async_cancel_scheduled function."""

    @pytest.mark.asyncio
    async def test_cancel_scheduled_removes_from_scheduled(self) -> None:
        """Test cancel_scheduled removes entity from scheduled dict."""
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

        with patch("custom_components.autosnooze.coordinator.cancel_scheduled_timer"):
            await async_cancel_scheduled(mock_hass, data, "automation.test")

        assert "automation.test" not in data.scheduled

    @pytest.mark.asyncio
    async def test_cancel_scheduled_nonexistent_is_noop(self) -> None:
        """Test cancelling nonexistent scheduled snooze is a no-op."""
        mock_hass = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        with patch("custom_components.autosnooze.coordinator.cancel_scheduled_timer"):
            await async_cancel_scheduled(mock_hass, data, "automation.nonexistent")


# =============================================================================
# Async Cancel Scheduled Batch Tests
# =============================================================================


class TestAsyncCancelScheduledBatch:
    """Tests for async_cancel_scheduled_batch function."""

    @pytest.mark.asyncio
    async def test_cancel_scheduled_batch_cancels_multiple(self) -> None:
        """Test batch cancel handles multiple entities."""
        mock_hass = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        for entity_id in ["automation.test1", "automation.test2"]:
            data.scheduled[entity_id] = ScheduledSnooze(
                entity_id=entity_id,
                friendly_name=entity_id,
                disable_at=now + timedelta(hours=1),
                resume_at=now + timedelta(hours=2),
            )

        with patch("custom_components.autosnooze.coordinator.cancel_scheduled_timer"):
            await async_cancel_scheduled_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        assert "automation.test1" not in data.scheduled
        assert "automation.test2" not in data.scheduled


# =============================================================================
# Async Execute Scheduled Disable Tests
# =============================================================================


class TestAsyncExecuteScheduledDisable:
    """Tests for async_execute_scheduled_disable function."""

    @pytest.mark.asyncio
    async def test_execute_scheduled_disable_moves_to_paused(self) -> None:
        """Test execute moves entity from scheduled to paused."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now,
            resume_at=resume_at,
        )

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(mock_hass, data, "automation.test", resume_at)

        assert "automation.test" not in data.scheduled
        assert "automation.test" in data.paused

    @pytest.mark.asyncio
    async def test_execute_scheduled_disable_turns_off_automation(self) -> None:
        """Test execute calls automation.turn_off service."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        resume_at = now + timedelta(hours=1)
        data.scheduled["automation.test"] = ScheduledSnooze(
            entity_id="automation.test",
            friendly_name="Test",
            disable_at=now,
            resume_at=resume_at,
        )

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await async_execute_scheduled_disable(mock_hass, data, "automation.test", resume_at)

        mock_hass.services.async_call.assert_called_with(
            "automation",
            "turn_off",
            {ATTR_ENTITY_ID: "automation.test"},
            blocking=True,
        )


# =============================================================================
# Cancel Scheduled Service Integration Tests
# =============================================================================


class TestCancelScheduledService:
    """Test the cancel_scheduled service."""

    @pytest.mark.asyncio
    async def test_cancel_scheduled_requires_entity_id(self, hass: HomeAssistant, setup_integration) -> None:
        """Test cancel_scheduled raises error when no entity_id provided."""
        with pytest.raises(vol.MultipleInvalid):
            await hass.services.async_call(DOMAIN, "cancel_scheduled", {}, blocking=True)

    @pytest.mark.asyncio
    async def test_cancel_scheduled_non_scheduled_succeeds(self, hass: HomeAssistant, setup_integration) -> None:
        """Test cancelling non-scheduled automation doesn't error."""
        hass.states.async_set(
            "automation.test",
            "on",
            {"friendly_name": "Test"},
        )
        await hass.services.async_call(
            DOMAIN,
            "cancel_scheduled",
            {ATTR_ENTITY_ID: "automation.test"},
            blocking=True,
        )
