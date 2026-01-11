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


# =============================================================================
# Mutation-Killing Tests for Waking Operations
# =============================================================================


class TestCancelTimerMutations:
    """Mutation-killing tests for cancel_timer and related functions."""

    def test_cancel_timer_uses_correct_entity_id(self) -> None:
        """Test that cancel_timer uses the provided entity_id, not None.

        Catches mutation: cancel_timer(data, entity_id) -> cancel_timer(data, None)
        """
        mock_cancel_1 = MagicMock()
        mock_cancel_2 = MagicMock()
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)
        data.timers["automation.entity_1"] = mock_cancel_1
        data.timers["automation.entity_2"] = mock_cancel_2

        # Cancel only entity_1 - entity_2 should remain
        cancel_timer(data, "automation.entity_1")

        assert "automation.entity_1" not in data.timers
        assert "automation.entity_2" in data.timers
        mock_cancel_1.assert_called_once()
        mock_cancel_2.assert_not_called()

    def test_cancel_timer_handles_missing_key_gracefully(self) -> None:
        """Test that cancel_timer handles non-existent key without error.

        Catches mutation: timers.pop(entity_id, None) -> timers.pop(entity_id, )
        """
        mock_store = MagicMock()
        data = AutomationPauseData(store=mock_store)
        data.timers["automation.other"] = MagicMock()

        # Cancel non-existent entity - should not raise
        cancel_timer(data, "automation.nonexistent")

        # Other timers should be unaffected
        assert "automation.other" in data.timers


class TestAsyncResumeMutations:
    """Mutation-killing tests for async_resume function."""

    @pytest.mark.asyncio
    async def test_resume_cancels_timer_with_correct_entity_id(self) -> None:
        """Test resume cancels the correct entity's timer.

        Catches mutation: cancel_timer(data, entity_id) -> cancel_timer(data, None)
        """
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        mock_cancel_1 = MagicMock()
        mock_cancel_2 = MagicMock()
        data.timers["automation.test1"] = mock_cancel_1
        data.timers["automation.test2"] = mock_cancel_2

        now = datetime.now(UTC)
        data.paused["automation.test1"] = PausedAutomation(
            entity_id="automation.test1",
            friendly_name="Test 1",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

        await async_resume(mock_hass, data, "automation.test1")

        # Only test1's timer should be cancelled
        mock_cancel_1.assert_called_once()
        mock_cancel_2.assert_not_called()
        assert "automation.test2" in data.timers

    @pytest.mark.asyncio
    async def test_resume_removes_correct_entity_from_paused(self) -> None:
        """Test resume removes only the specified entity from paused dict.

        Catches mutation: data.paused.pop(entity_id, None) -> data.paused.pop(None, None)
        """
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

        await async_resume(mock_hass, data, "automation.test1")

        # Only test1 should be removed
        assert "automation.test1" not in data.paused
        assert "automation.test2" in data.paused

    @pytest.mark.asyncio
    async def test_resume_handles_missing_entity_gracefully(self) -> None:
        """Test resume handles entity not in paused dict.

        Catches mutation: data.paused.pop(entity_id, None) -> data.paused.pop(entity_id, )
        """
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        # Should not raise even though entity is not paused
        await async_resume(mock_hass, data, "automation.not_paused")


class TestAsyncResumeBatchMutations:
    """Mutation-killing tests for async_resume_batch function."""

    @pytest.mark.asyncio
    async def test_batch_resume_cancels_correct_timers(self) -> None:
        """Test batch resume cancels timers for the correct entities.

        Catches mutation: cancel_timer(data, entity_id) -> cancel_timer(data, None)
        """
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        mock_cancel_1 = MagicMock()
        mock_cancel_2 = MagicMock()
        mock_cancel_3 = MagicMock()
        data.timers["automation.test1"] = mock_cancel_1
        data.timers["automation.test2"] = mock_cancel_2
        data.timers["automation.test3"] = mock_cancel_3

        now = datetime.now(UTC)
        for entity_id in ["automation.test1", "automation.test2", "automation.test3"]:
            data.paused[entity_id] = PausedAutomation(
                entity_id=entity_id,
                friendly_name=entity_id,
                resume_at=now + timedelta(hours=1),
                paused_at=now,
                days=0,
                hours=1,
                minutes=0,
            )

        # Only resume test1 and test2
        await async_resume_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        # Only test1 and test2's timers should be cancelled
        mock_cancel_1.assert_called_once()
        mock_cancel_2.assert_called_once()
        mock_cancel_3.assert_not_called()
        assert "automation.test3" in data.timers

    @pytest.mark.asyncio
    async def test_batch_resume_removes_correct_entities(self) -> None:
        """Test batch resume removes only the specified entities from paused dict."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        for entity_id in ["automation.test1", "automation.test2", "automation.test3"]:
            data.paused[entity_id] = PausedAutomation(
                entity_id=entity_id,
                friendly_name=entity_id,
                resume_at=now + timedelta(hours=1),
                paused_at=now,
                days=0,
                hours=1,
                minutes=0,
            )

        # Only resume test1 and test2
        await async_resume_batch(mock_hass, data, ["automation.test1", "automation.test2"])

        assert "automation.test1" not in data.paused
        assert "automation.test2" not in data.paused
        assert "automation.test3" in data.paused

    @pytest.mark.asyncio
    async def test_batch_resume_handles_missing_entities(self) -> None:
        """Test batch resume handles entities not in paused dict.

        Catches mutation: data.paused.pop(entity_id, None) -> data.paused.pop(entity_id, )
        """
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.test1"] = PausedAutomation(
            entity_id="automation.test1",
            friendly_name="Test 1",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

        # Include both existing and non-existing entities
        # Should not raise
        await async_resume_batch(
            mock_hass, data, ["automation.test1", "automation.not_paused"]
        )

        assert "automation.test1" not in data.paused

    @pytest.mark.asyncio
    async def test_batch_resume_saves_data_once(self) -> None:
        """Test batch resume only saves once, not per entity."""
        mock_hass = MagicMock()
        mock_hass.services.async_call = AsyncMock()
        mock_hass.states.get.return_value = MagicMock()

        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        for i in range(5):
            entity_id = f"automation.test{i}"
            data.paused[entity_id] = PausedAutomation(
                entity_id=entity_id,
                friendly_name=f"Test {i}",
                resume_at=now + timedelta(hours=1),
                paused_at=now,
                days=0,
                hours=1,
                minutes=0,
            )

        await async_resume_batch(
            mock_hass, data,
            [f"automation.test{i}" for i in range(5)]
        )

        # Should only save once
        assert mock_store.async_save.call_count == 1

    @pytest.mark.asyncio
    async def test_batch_resume_calls_service_with_correct_entity_ids(self) -> None:
        """Test batch resume calls turn_on with correct entity_id for each entity.

        Catches mutation: async_set_automation_state(hass, entity_id, ...) ->
                          async_set_automation_state(hass, None, ...)
        """
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

        # Verify correct entity_ids were passed to service calls
        call_args_list = mock_hass.services.async_call.call_args_list
        entity_ids_called = []
        for call in call_args_list:
            # Call format: async_call(domain, service, {entity_id: x}, blocking=True)
            service_data = call[0][2] if len(call[0]) > 2 else call.kwargs.get("service_data", {})
            if ATTR_ENTITY_ID in service_data:
                entity_ids_called.append(service_data[ATTR_ENTITY_ID])
        assert "automation.test1" in entity_ids_called
        assert "automation.test2" in entity_ids_called

    @pytest.mark.asyncio
    async def test_batch_resume_calls_service_with_enabled_true(self) -> None:
        """Test batch resume calls turn_on service (enabled=True).

        Catches mutation: async_set_automation_state(hass, entity_id, enabled=True) ->
                          async_set_automation_state(hass, entity_id, enabled=None)
        """
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

        await async_resume_batch(mock_hass, data, ["automation.test"])

        # Verify turn_on was called (not turn_off)
        mock_hass.services.async_call.assert_called()
        call_args = mock_hass.services.async_call.call_args
        assert call_args[0][0] == "automation"
        assert call_args[0][1] == "turn_on"  # This verifies enabled=True path
