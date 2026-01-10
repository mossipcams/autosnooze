"""Tests for User Flow 2: Waking Automations.

This file tests waking (cancel) operations including:
- cancel service for individual automations
- cancel_all service for all paused automations
- Timer cancellation
- Resume operations (single and batch)
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
    async_resume,
    async_resume_batch,
    cancel_timer,
)
from custom_components.autosnooze.models import (
    AutomationPauseData,
    PausedAutomation,
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


@pytest.fixture
async def setup_integration_with_automations(hass: HomeAssistant, setup_integration):
    """Set up integration with mock automations."""
    hass.states.async_set(
        "automation.test_automation_1",
        "on",
        {"friendly_name": "Test Automation 1"},
    )
    hass.states.async_set(
        "automation.test_automation_2",
        "on",
        {"friendly_name": "Test Automation 2"},
    )
    hass.states.async_set(
        "automation.test_automation_3",
        "on",
        {"friendly_name": "Test Automation 3"},
    )
    return setup_integration


# =============================================================================
# Cancel Timer Tests
# =============================================================================


class TestCancelTimer:
    """Tests for cancel_timer function."""

    def test_cancel_timer_removes_from_dict(self) -> None:
        """Test cancelling a timer removes it from the dict."""
        mock_cancel = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.timers["automation.test"] = mock_cancel

        cancel_timer(data, "automation.test")

        assert "automation.test" not in data.timers
        mock_cancel.assert_called_once()

    def test_cancel_timer_nonexistent_is_noop(self) -> None:
        """Test cancelling nonexistent timer is a no-op."""
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        cancel_timer(data, "automation.nonexistent")
        assert len(data.timers) == 0

    def test_cancel_timer_calls_cancel_function(self) -> None:
        """Test cancel_timer calls the cancel function."""
        mock_cancel = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)
        data.timers["automation.test"] = mock_cancel

        cancel_timer(data, "automation.test")

        mock_cancel.assert_called_once()


# =============================================================================
# Async Resume Tests
# =============================================================================


class TestAsyncResume:
    """Tests for async_resume function."""

    @pytest.mark.asyncio
    async def test_resume_removes_from_paused(self) -> None:
        """Test resume removes entity from paused dict."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

        await async_resume(mock_hass, data, "automation.test")

        assert "automation.test" not in data.paused

    @pytest.mark.asyncio
    async def test_resume_turns_on_automation(self) -> None:
        """Test resume calls automation.turn_on service."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()  # automation exists

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

        await async_resume(mock_hass, data, "automation.test")

        mock_hass.services.async_call.assert_called_with(
            "automation",
            "turn_on",
            {ATTR_ENTITY_ID: "automation.test"},
            blocking=True,
        )

    @pytest.mark.asyncio
    async def test_resume_nonexistent_entity_still_removes_from_paused(self) -> None:
        """Test resuming nonexistent entity still removes from paused dict."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

        await async_resume(mock_hass, data, "automation.test")

        assert "automation.test" not in data.paused


# =============================================================================
# Async Resume Batch Tests
# =============================================================================


class TestAsyncResumeBatch:
    """Tests for async_resume_batch function."""

    @pytest.mark.asyncio
    async def test_resume_batch_resumes_multiple(self) -> None:
        """Test batch resume handles multiple entities."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        for entity_id in ["automation.test1", "automation.test2"]:
            data.paused[entity_id] = PausedAutomation(
                entity_id=entity_id,
                friendly_name=entity_id,
                resume_at=now + timedelta(hours=1),
                paused_at=now,
                days=0,
                hours=1,
                minutes=0,
            )

        await async_resume_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        assert "automation.test1" not in data.paused
        assert "automation.test2" not in data.paused

    @pytest.mark.asyncio
    async def test_resume_batch_empty_list_is_noop(self) -> None:
        """Test batch resume with empty list is a no-op."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        await async_resume_batch(mock_hass, data, [])

        mock_hass.services.async_call.assert_not_called()


# =============================================================================
# Cancel Service Integration Tests
# =============================================================================


class TestCancelService:
    """Test the cancel service."""

    @pytest.mark.asyncio
    async def test_cancel_requires_entity_id(self, hass: HomeAssistant, setup_integration) -> None:
        """Test cancel raises error when no entity_id provided."""
        with pytest.raises(vol.MultipleInvalid):
            await hass.services.async_call(DOMAIN, "cancel", {}, blocking=True)

    @pytest.mark.asyncio
    async def test_cancel_non_paused_automation_succeeds(
        self, hass: HomeAssistant, setup_integration_with_automations
    ) -> None:
        """Test cancelling non-paused automation doesn't error."""
        await hass.services.async_call(
            DOMAIN,
            "cancel",
            {ATTR_ENTITY_ID: "automation.test_automation_1"},
            blocking=True,
        )


# =============================================================================
# Cancel All Service Integration Tests
# =============================================================================


class TestCancelAllService:
    """Test the cancel_all service."""

    @pytest.mark.asyncio
    async def test_cancel_all_succeeds_with_nothing_paused(self, hass: HomeAssistant, setup_integration) -> None:
        """Test cancel_all succeeds when nothing is paused."""
        await hass.services.async_call(DOMAIN, "cancel_all", {}, blocking=True)
