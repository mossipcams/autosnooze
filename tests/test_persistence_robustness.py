"""Tests for persistence robustness features.

These tests verify:
1. Deleted automation cleanup on load
2. Data validation during load
3. Graceful handling of corrupted storage
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

        # Return state for existing, None for deleted
        def get_state(entity_id: str) -> MagicMock | None:
            if "existing" in entity_id:
                mock_state = MagicMock()
                mock_state.attributes = {"friendly_name": entity_id}
                return mock_state
            return None

        mock_hass.states.get.side_effect = get_state

        with (
            patch("custom_components.autosnooze.coordinator.schedule_resume"),
            patch("custom_components.autosnooze.coordinator.schedule_disable"),
        ):
            await _async_load_stored(mock_hass, data)

        # Deleted automations should be removed
        assert "automation.deleted1" not in data.paused
        assert "automation.deleted2" not in data.scheduled

        # Existing automations should be loaded
        assert "automation.existing1" in data.paused
        assert "automation.existing2" in data.scheduled


class TestStorageValidation:
    """Tests for storage data validation during load."""

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
    @pytest.mark.parametrize(
        "storage,expected_paused,expected_scheduled",
        [
            (None, 0, 0),
            ({"scheduled": {}}, 0, 0),
            ({"paused": {}}, 0, 0),
        ],
        ids=["empty-storage", "missing-paused-key", "missing-scheduled-key"],
    )
    async def test_handles_missing_or_empty_storage(
        self,
        mock_hass: MagicMock,
        mock_store: MagicMock,
        storage: dict | None,
        expected_paused: int,
        expected_scheduled: int,
    ) -> None:
        """Test that missing or malformed storage is handled gracefully."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        mock_store.async_load = AsyncMock(return_value=storage)

        await _async_load_stored(mock_hass, data)

        assert len(data.paused) == expected_paused
        assert len(data.scheduled) == expected_scheduled

    @pytest.mark.asyncio
    async def test_skips_entries_with_invalid_datetime(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that entries with invalid datetime are skipped."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.models import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {
                "automation.valid": {
                    "friendly_name": "Valid",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                },
                "automation.invalid": {
                    "friendly_name": "Invalid",
                    "resume_at": "not-a-datetime",
                    "paused_at": now.isoformat(),
                },
            },
            "scheduled": {},
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        # Both entities exist
        mock_state = MagicMock()
        mock_state.attributes = {"friendly_name": "Test"}
        mock_hass.states.get.return_value = mock_state

        with patch("custom_components.autosnooze.coordinator.schedule_resume"):
            await _async_load_stored(mock_hass, data)

        # Valid entry should be loaded, invalid should be skipped
        assert "automation.valid" in data.paused
        assert "automation.invalid" not in data.paused


class TestSaveFailureRecovery:
    """Tests for save failure handling."""

    @pytest.fixture
    def mock_store(self) -> MagicMock:
        """Create mock store."""
        store = MagicMock()
        store.async_save = AsyncMock()
        return store

    @pytest.mark.asyncio
    async def test_save_failure_does_not_corrupt_runtime_state(self, mock_store: MagicMock) -> None:
        """Test that failed saves don't affect runtime data."""
        from custom_components.autosnooze.coordinator import async_save as _async_save
        from custom_components.autosnooze.models import AutomationPauseData, PausedAutomation

        mock_store.async_save = AsyncMock(side_effect=IOError("Disk error"))

        data = AutomationPauseData(store=mock_store)
        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
        )

        # Save should fail but not raise
        await _async_save(data)

        # Runtime data should be unchanged even after save failure
        assert "automation.test" in data.paused
        assert data.paused["automation.test"].friendly_name == "Test"
