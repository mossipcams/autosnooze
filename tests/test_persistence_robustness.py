"""Tests for persistence robustness features.

These tests verify:
1. Deleted automation cleanup on load
2. Data validation during load
3. Graceful handling of corrupted storage
4. Retry logic for save operations
5. Validation of stored data structure
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

UTC = timezone.utc


class TestDeletedAutomationCleanup:
    """Tests that verify deleted automations are cleaned up from storage on load."""

    @pytest.fixture
    def mock_store(self) -> MagicMock:
        """Create mock store."""
        store = MagicMock()
        store.async_save = AsyncMock()
        return store

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        hass.services.async_call = AsyncMock()
        return hass

    @pytest.mark.asyncio
    async def test_deleted_paused_automation_is_cleaned_up(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that deleted automations are removed from paused storage on load."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {
                "automation.deleted": {
                    "friendly_name": "Deleted Automation",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                    "days": 0,
                    "hours": 1,
                    "minutes": 0,
                },
            },
            "scheduled": {},
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        # Entity does not exist
        mock_hass.states.get.return_value = None

        await _async_load_stored(mock_hass, data)

        # Deleted automation should NOT be in paused dict
        assert "automation.deleted" not in data.paused
        # Storage should be updated to remove the entry
        mock_store.async_save.assert_called()

    @pytest.mark.asyncio
    async def test_existing_paused_automation_is_loaded(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that existing automations are still loaded from paused storage."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {
                "automation.existing": {
                    "friendly_name": "Existing Automation",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                    "days": 0,
                    "hours": 1,
                    "minutes": 0,
                },
            },
            "scheduled": {},
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        # Entity exists
        mock_state = MagicMock()
        mock_state.attributes = {"friendly_name": "Existing Automation"}
        mock_hass.states.get.return_value = mock_state

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await _async_load_stored(mock_hass, data)

        # Existing automation SHOULD be in paused dict
        assert "automation.existing" in data.paused

    @pytest.mark.asyncio
    async def test_deleted_scheduled_automation_is_cleaned_up(
        self, mock_hass: MagicMock, mock_store: MagicMock
    ) -> None:
        """Test that deleted automations are removed from scheduled storage on load."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {},
            "scheduled": {
                "automation.deleted_scheduled": {
                    "friendly_name": "Deleted Scheduled",
                    "disable_at": (now + timedelta(hours=1)).isoformat(),
                    "resume_at": (now + timedelta(hours=2)).isoformat(),
                },
            },
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        # Entity does not exist
        mock_hass.states.get.return_value = None

        await _async_load_stored(mock_hass, data)

        # Deleted automation should NOT be in scheduled dict
        assert "automation.deleted_scheduled" not in data.scheduled
        # Storage should be updated to remove the entry
        mock_store.async_save.assert_called()

    @pytest.mark.asyncio
    async def test_existing_scheduled_automation_is_loaded(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that existing automations are still loaded from scheduled storage."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {},
            "scheduled": {
                "automation.existing_scheduled": {
                    "friendly_name": "Existing Scheduled",
                    "disable_at": (now + timedelta(hours=1)).isoformat(),
                    "resume_at": (now + timedelta(hours=2)).isoformat(),
                },
            },
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        # Entity exists
        mock_state = MagicMock()
        mock_state.attributes = {"friendly_name": "Existing Scheduled"}
        mock_hass.states.get.return_value = mock_state

        with patch("custom_components.autosnooze.coordinator.schedule_disable"):
            await _async_load_stored(mock_hass, data)

        # Existing automation SHOULD be in scheduled dict
        assert "automation.existing_scheduled" in data.scheduled

    @pytest.mark.asyncio
    async def test_mixed_deleted_and_existing_automations(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that only deleted automations are cleaned up, existing ones remain."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {
                "automation.deleted1": {
                    "friendly_name": "Deleted 1",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                },
                "automation.existing1": {
                    "friendly_name": "Existing 1",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                },
            },
            "scheduled": {
                "automation.deleted2": {
                    "friendly_name": "Deleted 2",
                    "disable_at": (now + timedelta(hours=1)).isoformat(),
                    "resume_at": (now + timedelta(hours=2)).isoformat(),
                },
                "automation.existing2": {
                    "friendly_name": "Existing 2",
                    "disable_at": (now + timedelta(hours=1)).isoformat(),
                    "resume_at": (now + timedelta(hours=2)).isoformat(),
                },
            },
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        def mock_get_state(entity_id: str):
            if "deleted" in entity_id:
                return None
            mock_state = MagicMock()
            mock_state.attributes = {"friendly_name": entity_id}
            return mock_state

        mock_hass.states.get.side_effect = mock_get_state

        with patch("custom_components.autosnooze.coordinator.schedule_resume"), patch(
            "custom_components.autosnooze.coordinator.schedule_disable"
        ):
            await _async_load_stored(mock_hass, data)

        # Existing automations should be loaded
        assert "automation.existing1" in data.paused
        assert "automation.existing2" in data.scheduled
        # Deleted automations should NOT be loaded
        assert "automation.deleted1" not in data.paused
        assert "automation.deleted2" not in data.scheduled


class TestStorageValidation:
    """Tests for storage data validation logic."""

    @pytest.fixture
    def mock_store(self) -> MagicMock:
        """Create mock store."""
        store = MagicMock()
        store.async_save = AsyncMock()
        return store

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
    async def test_handles_completely_invalid_storage_data(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that completely invalid storage (not a dict) is handled gracefully."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        # Return invalid data (not a dict)
        mock_store.async_load = AsyncMock(return_value="invalid_string_data")

        # Should not crash
        await async_load_stored(mock_hass, data)

        # Should have no loaded data
        assert len(data.paused) == 0
        assert len(data.scheduled) == 0

    @pytest.mark.asyncio
    async def test_handles_missing_required_fields(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that entries with missing required fields are skipped."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {
                "automation.invalid": {
                    "friendly_name": "Invalid",
                    # Missing resume_at
                    "paused_at": now.isoformat(),
                },
            },
            "scheduled": {},
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        await async_load_stored(mock_hass, data)

        # Invalid entry should be skipped
        assert "automation.invalid" not in data.paused

    @pytest.mark.asyncio
    async def test_handles_invalid_datetime_formats(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that entries with invalid datetime formats are skipped."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {
                "automation.invalid": {
                    "friendly_name": "Invalid",
                    "resume_at": "not-a-datetime",
                    "paused_at": "also-not-a-datetime",
                },
            },
            "scheduled": {},
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        await async_load_stored(mock_hass, data)

        # Invalid entry should be skipped
        assert "automation.invalid" not in data.paused

    @pytest.mark.asyncio
    async def test_handles_negative_duration_values(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that entries with negative duration values are skipped."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {
                "automation.invalid": {
                    "friendly_name": "Invalid",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                    "days": -1,  # Invalid
                },
            },
            "scheduled": {},
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        await async_load_stored(mock_hass, data)

        # Invalid entry should be skipped
        assert "automation.invalid" not in data.paused

    @pytest.mark.asyncio
    async def test_handles_invalid_entity_id_format(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that entries with non-automation entity IDs are skipped."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {
                "light.not_automation": {
                    "friendly_name": "Not an automation",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                },
            },
            "scheduled": {},
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        await async_load_stored(mock_hass, data)

        # Invalid entity ID should be skipped
        assert "light.not_automation" not in data.paused

    @pytest.mark.asyncio
    async def test_scheduled_validation_disable_after_resume(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that scheduled entries with disable_at >= resume_at are skipped."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {},
            "scheduled": {
                "automation.invalid": {
                    "friendly_name": "Invalid",
                    "disable_at": (now + timedelta(hours=2)).isoformat(),
                    "resume_at": (now + timedelta(hours=1)).isoformat(),  # Before disable_at
                },
            },
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        await async_load_stored(mock_hass, data)

        # Invalid scheduled entry should be skipped
        assert "automation.invalid" not in data.scheduled


class TestSaveRetryLogic:
    """Tests for save operation retry logic with exponential backoff."""

    @pytest.fixture
    def mock_store(self) -> MagicMock:
        """Create mock store."""
        store = MagicMock()
        store.async_save = AsyncMock()
        return store

    @pytest.mark.asyncio
    async def test_save_succeeds_on_first_attempt(self, mock_store: MagicMock) -> None:
        """Test that save returns True on first successful attempt."""
        from custom_components.autosnooze.coordinator import async_save
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        mock_store.async_save = AsyncMock()

        result = await async_save(data)

        assert result is True
        assert mock_store.async_save.call_count == 1

    @pytest.mark.asyncio
    async def test_save_retries_on_transient_errors(self, mock_store: MagicMock) -> None:
        """Test that save retries on IOError/OSError."""
        from custom_components.autosnooze.coordinator import async_save
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        # Fail twice, then succeed
        mock_store.async_save = AsyncMock(side_effect=[IOError("Network error"), IOError("Network error"), None])

        result = await async_save(data)

        assert result is True
        assert mock_store.async_save.call_count == 3

    @pytest.mark.asyncio
    async def test_save_returns_false_after_all_retries_exhausted(self, mock_store: MagicMock) -> None:
        """Test that save returns False after MAX_SAVE_RETRIES exhausted."""
        from custom_components.autosnooze.coordinator import async_save
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        # Always fail with transient error
        mock_store.async_save = AsyncMock(side_effect=IOError("Network error"))

        result = await async_save(data)

        assert result is False
        # Should try: initial + MAX_SAVE_RETRIES (3) = 4 total attempts
        assert mock_store.async_save.call_count == 4

    @pytest.mark.asyncio
    async def test_save_does_not_retry_non_transient_errors(self, mock_store: MagicMock) -> None:
        """Test that save does not retry on non-transient errors."""
        from custom_components.autosnooze.coordinator import async_save
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        # Non-transient error (ValueError)
        mock_store.async_save = AsyncMock(side_effect=ValueError("Invalid data"))

        result = await async_save(data)

        assert result is False
        # Should only try once (no retries for non-transient errors)
        assert mock_store.async_save.call_count == 1

    @pytest.mark.asyncio
    async def test_save_returns_true_when_no_store(self) -> None:
        """Test that save returns True when store is None."""
        from custom_components.autosnooze.coordinator import async_save
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=None)

        result = await async_save(data)

        assert result is True


class TestExpiredAutomationHandling:
    """Tests for handling expired automations on load."""

    @pytest.fixture
    def mock_store(self) -> MagicMock:
        """Create mock store."""
        store = MagicMock()
        store.async_save = AsyncMock()
        return store

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
    async def test_expired_paused_automation_is_resumed(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that expired paused automations are automatically resumed on load."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {
                "automation.expired": {
                    "friendly_name": "Expired",
                    "resume_at": (now - timedelta(hours=1)).isoformat(),  # In the past
                    "paused_at": (now - timedelta(hours=2)).isoformat(),
                },
            },
            "scheduled": {},
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        with patch("custom_components.autosnooze.coordinator.async_set_automation_state") as mock_set_state:
            mock_set_state.return_value = True
            await async_load_stored(mock_hass, data)

            # Should have called to enable the expired automation
            mock_set_state.assert_called_with(mock_hass, "automation.expired", enabled=True)

        # Expired automation should NOT be in paused dict
        assert "automation.expired" not in data.paused

    @pytest.mark.asyncio
    async def test_expired_scheduled_automation_is_handled(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that expired scheduled automations are handled correctly on load."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {},
            "scheduled": {
                "automation.expired_scheduled": {
                    "friendly_name": "Expired Scheduled",
                    "disable_at": (now - timedelta(hours=2)).isoformat(),  # Past
                    "resume_at": (now - timedelta(hours=1)).isoformat(),  # Also past
                },
            },
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        await async_load_stored(mock_hass, data)

        # Fully expired scheduled automation should NOT be loaded
        assert "automation.expired_scheduled" not in data.scheduled
        assert "automation.expired_scheduled" not in data.paused


class TestStorageLoadErrorHandling:
    """Tests for error handling during storage load."""

    @pytest.fixture
    def mock_store(self) -> MagicMock:
        """Create mock store."""
        store = MagicMock()
        store.async_save = AsyncMock()
        return store

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock Home Assistant instance."""
        hass = MagicMock()
        return hass

    @pytest.mark.asyncio
    async def test_handles_storage_load_exception(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that exceptions during storage load are handled gracefully."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        mock_store.async_load = AsyncMock(side_effect=Exception("Storage corrupted"))

        # Should not crash
        await async_load_stored(mock_hass, data)

        # Should have no loaded data
        assert len(data.paused) == 0
        assert len(data.scheduled) == 0

    @pytest.mark.asyncio
    async def test_handles_none_storage_data(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that None storage data is handled gracefully."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        mock_store.async_load = AsyncMock(return_value=None)

        # Should not crash
        await async_load_stored(mock_hass, data)

        # Should have no loaded data
        assert len(data.paused) == 0
        assert len(data.scheduled) == 0

    @pytest.mark.asyncio
    async def test_handles_no_store_configured(self, mock_hass: MagicMock) -> None:
        """Test that load handles missing store gracefully."""
        from custom_components.autosnooze.coordinator import async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=None)

        # Should not crash
        await async_load_stored(mock_hass, data)

        # Should have no loaded data
        assert len(data.paused) == 0
        assert len(data.scheduled) == 0
