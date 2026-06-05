"""Tests for persistence robustness features.

These tests verify:
1. Deleted automation cleanup on load
2. Data validation during load
3. Graceful handling of corrupted storage
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

UTC = timezone.utc


@pytest.mark.asyncio
async def test_restore_load_error_is_not_treated_as_empty_storage() -> None:
    """Storage load failures must be observable to integration setup."""
    from custom_components.autosnooze.application.restore import async_restore_stored as async_load_stored
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    store = MagicMock()
    store.async_load = AsyncMock(side_effect=OSError("storage unavailable"))
    data = AutomationPauseData(store=store)

    with pytest.raises(RuntimeError, match="Failed to load stored AutoSnooze data"):
        await async_load_stored(MagicMock(), data)


@pytest.mark.asyncio
async def test_restore_only_removes_record_after_confirmed_enabled_state() -> None:
    """Failed restore wake retains the record; confirmed wake removes it."""
    from custom_components.autosnooze.models import PausedAutomation
    from custom_components.autosnooze.application.restore import async_restore_stored as async_load_stored
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    entity_id = "automation.expired_restore"
    now = datetime.now(UTC)
    stored_pause = PausedAutomation(
        entity_id=entity_id,
        friendly_name=entity_id,
        resume_at=now - timedelta(minutes=1),
        paused_at=now - timedelta(hours=1),
    )

    stored_payload = {"paused": {entity_id: stored_pause.to_dict()}, "scheduled": {}}

    mock_hass = MagicMock()
    mock_hass.states.get.return_value = MagicMock()

    failed_store = MagicMock()
    failed_store.async_load = AsyncMock(return_value=stored_payload)
    failed_store.async_save = AsyncMock()
    failed_data = AutomationPauseData(store=failed_store)

    with patch(
        "custom_components.autosnooze.runtime.ports.async_set_automation_state",
        AsyncMock(return_value=False),
    ):
        await async_load_stored(mock_hass, failed_data)

    assert entity_id in failed_data.paused

    success_store = MagicMock()
    success_store.async_load = AsyncMock(return_value=stored_payload)
    success_store.async_save = AsyncMock()
    success_data = AutomationPauseData(store=success_store)

    with patch(
        "custom_components.autosnooze.runtime.ports.async_set_automation_state",
        AsyncMock(return_value=True),
    ):
        await async_load_stored(mock_hass, success_data)

    assert entity_id not in success_data.paused
    success_store.async_save.assert_called()

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
        from custom_components.autosnooze.runtime.state import AutomationPauseData

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
        from custom_components.autosnooze.runtime.state import AutomationPauseData

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

        with patch("custom_components.autosnooze.runtime.ports.schedule_resume"):
            await _async_load_stored(mock_hass, data)

        # Existing automation SHOULD be in paused dict
        assert "automation.existing" in data.paused

    @pytest.mark.asyncio
    async def test_deleted_scheduled_automation_is_cleaned_up(
        self, mock_hass: MagicMock, mock_store: MagicMock
    ) -> None:
        """Test that deleted automations are removed from scheduled storage on load."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.runtime.state import AutomationPauseData

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
        from custom_components.autosnooze.runtime.state import AutomationPauseData

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

        with patch("custom_components.autosnooze.runtime.ports.schedule_disable"):
            await _async_load_stored(mock_hass, data)

        # Existing automation SHOULD be in scheduled dict
        assert "automation.existing_scheduled" in data.scheduled

    @pytest.mark.asyncio
    async def test_due_scheduled_automation_restores_about_to_end_notification_when_loaded_as_paused(
        self, mock_hass: MagicMock, mock_store: MagicMock
    ) -> None:
        """Test that due scheduled snoozes preserve pre-end notification config during restore."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.runtime.state import AutomationPauseData

        now = datetime.now(UTC)
        data = AutomationPauseData(store=mock_store)

        stored_data = {
            "paused": {},
            "scheduled": {
                "automation.existing_scheduled": {
                    "friendly_name": "Existing Scheduled",
                    "disable_at": (now - timedelta(minutes=5)).isoformat(),
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "notification_trigger": "about_to_end",
                    "notification_lead_minutes": 60,
                },
            },
        }
        mock_store.async_load = AsyncMock(return_value=stored_data)

        mock_state = MagicMock()
        mock_state.attributes = {"friendly_name": "Existing Scheduled"}
        mock_hass.states.get.return_value = mock_state

        with (
            patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
            patch(
                "custom_components.autosnooze.runtime.ports.schedule_pre_resume_notification"
            ) as schedule_notification,
        ):
            await _async_load_stored(mock_hass, data)

        assert data.paused["automation.existing_scheduled"].notification_trigger == "about_to_end"
        assert data.paused["automation.existing_scheduled"].notification_lead_minutes == 60
        schedule_notification.assert_called_once()

    @pytest.mark.asyncio
    async def test_mixed_deleted_and_existing_automations(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that only deleted automations are cleaned up, existing ones remain."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.runtime.state import AutomationPauseData

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
            patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
            patch("custom_components.autosnooze.runtime.ports.schedule_disable"),
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
    async def test_handles_empty_storage(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that empty storage is handled gracefully."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.runtime.state import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        mock_store.async_load = AsyncMock(return_value=None)

        await _async_load_stored(mock_hass, data)

        assert len(data.paused) == 0
        assert len(data.scheduled) == 0

    @pytest.mark.asyncio
    async def test_handles_missing_paused_key(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that missing 'paused' key is handled gracefully."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.runtime.state import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        mock_store.async_load = AsyncMock(return_value={"scheduled": {}})

        await _async_load_stored(mock_hass, data)

        assert len(data.paused) == 0

    @pytest.mark.asyncio
    async def test_handles_missing_scheduled_key(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that missing 'scheduled' key is handled gracefully."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.runtime.state import AutomationPauseData

        data = AutomationPauseData(store=mock_store)
        mock_store.async_load = AsyncMock(return_value={"paused": {}})

        await _async_load_stored(mock_hass, data)

        assert len(data.scheduled) == 0

    @pytest.mark.asyncio
    async def test_skips_entries_with_invalid_datetime(self, mock_hass: MagicMock, mock_store: MagicMock) -> None:
        """Test that entries with invalid datetime are skipped."""
        from custom_components.autosnooze.coordinator import async_load_stored as _async_load_stored
        from custom_components.autosnooze.runtime.state import AutomationPauseData

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

        with patch("custom_components.autosnooze.runtime.ports.schedule_resume"):
            await _async_load_stored(mock_hass, data)

        # Valid entry should be loaded, invalid should be skipped
        assert "automation.valid" in data.paused
        assert "automation.invalid" not in data.paused


@pytest.mark.asyncio
async def test_slow_persistence_does_not_hold_runtime_lock() -> None:
    """A blocked save must not prevent unrelated transitions from acquiring the lock."""
    import asyncio
    from unittest.mock import AsyncMock, MagicMock

    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    entity_id = "automation.slow_save"
    data = AutomationPauseData(store=MagicMock())
    hass = MagicMock()
    enabled_state = MagicMock()
    enabled_state.state = "on"
    hass.states.get.return_value = enabled_state

    save_started = asyncio.Event()
    allow_save_finish = asyncio.Event()

    async def set_state(_hass: MagicMock, _entity_id: str, enabled: bool) -> bool:
        return True

    async def slow_save(_data: AutomationPauseData, **_kwargs: object) -> bool:
        save_started.set()
        await allow_save_finish.wait()
        return True

    pause_task = asyncio.create_task(
        async_pause_automations(
            hass,
            data,
            [entity_id],
            minutes=30,
            set_automation_state=set_state,
            save_data=slow_save,
            schedule_resume_callback=MagicMock(),
        )
    )

    await save_started.wait()
    acquired_during_save = False
    try:
        await asyncio.wait_for(data.lock.acquire(), timeout=0.05)
        acquired_during_save = True
    finally:
        if acquired_during_save:
            data.lock.release()

    allow_save_finish.set()
    await pause_task

    assert acquired_during_save is True


@pytest.mark.asyncio
async def test_persistence_failure_after_ha_effect_creates_recovery_state() -> None:
    """A post-effect save failure must mark recovery state instead of only raising."""
    from custom_components.autosnooze.application.pause import async_pause_automations
    from custom_components.autosnooze.domain.transitions import RecoveryStatus
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    entity_id = "automation.save_failed"
    data = AutomationPauseData(store=MagicMock())
    hass = MagicMock()
    enabled_state = MagicMock()
    enabled_state.state = "on"
    hass.states.get.return_value = enabled_state

    async def set_state(_hass: MagicMock, _entity_id: str, enabled: bool) -> bool:
        return True

    async def failing_save(_data: AutomationPauseData, **_kwargs: object) -> bool:
        return False

    with pytest.raises(Exception, match="Failed to persist autosnooze state"):
        await async_pause_automations(
            hass,
            data,
            [entity_id],
            minutes=30,
            set_automation_state=set_state,
            save_data=failing_save,
            schedule_resume_callback=MagicMock(),
        )

    assert entity_id in data.paused
    assert data.paused[entity_id].recovery_status is RecoveryStatus.REQUIRED


@pytest.mark.asyncio
async def test_coalesced_writer_preserves_latest_snapshot_and_safety_writes() -> None:
    """Coalescing keeps the latest snapshot while immediate writes stay durable."""
    from custom_components.autosnooze.infrastructure.storage import async_save, async_save_coalesced
    from custom_components.autosnooze.models import PausedAutomation
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    now = datetime.now(UTC)
    store = MagicMock()
    allow_first_save = asyncio.Event()
    saved_payloads: list[dict[str, object]] = []

    async def slow_save(payload: dict[str, object]) -> None:
        saved_payloads.append(payload)
        if len(saved_payloads) == 1:
            await allow_first_save.wait()

    store.async_save = AsyncMock(side_effect=slow_save)
    data = AutomationPauseData(store=store)
    data.paused["automation.one"] = PausedAutomation(
        entity_id="automation.one",
        friendly_name="One",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
    )

    first_save = asyncio.create_task(async_save_coalesced(data))
    await asyncio.sleep(0)
    data.paused["automation.two"] = PausedAutomation(
        entity_id="automation.two",
        friendly_name="Two",
        resume_at=now + timedelta(hours=2),
        paused_at=now,
    )
    second_save = asyncio.create_task(async_save_coalesced(data))
    allow_first_save.set()
    assert await first_save is True
    assert await second_save is True

    assert len(saved_payloads) == 2
    assert "automation.one" in saved_payloads[0]["paused"]
    assert "automation.two" in saved_payloads[1]["paused"]

    store.async_save = AsyncMock()
    data.paused["automation.three"] = PausedAutomation(
        entity_id="automation.three",
        friendly_name="Three",
        resume_at=now + timedelta(hours=3),
        paused_at=now,
    )
    assert await async_save(data, coalesce=False) is True
    store.async_save.assert_awaited_once()


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
        from custom_components.autosnooze.runtime.state import AutomationPauseData
        from custom_components.autosnooze.models import PausedAutomation

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
