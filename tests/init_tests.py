"""Tests for AutoSnooze __init__.py - Data Models and Integration Setup.

Consolidated tests covering:
- PausedAutomation and ScheduledSnooze dataclasses
- AutomationPauseData container
- Integration setup and unload
- Static path and Lovelace resource registration
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze import (
    async_setup_entry,
    async_unload_entry,
    _async_register_static_path,
    _async_register_lovelace_resource,
    _async_retry_or_fail,
    LOVELACE_REGISTER_MAX_RETRIES,
    LOVELACE_REGISTER_RETRY_DELAY,
)
from custom_components.autosnooze.const import (
    CARD_URL,
    CARD_URL_VERSIONED,
)
from custom_components.autosnooze.models import (
    PausedAutomation,
    ScheduledSnooze,
    AutomationPauseData,
)

UTC = timezone.utc


# =============================================================================
# PausedAutomation Tests
# =============================================================================


class TestPausedAutomation:
    """Tests for PausedAutomation dataclass."""

    @pytest.fixture
    def sample_paused_automation(self) -> PausedAutomation:
        """Create a sample paused automation."""
        now = datetime.now(UTC)
        return PausedAutomation(
            entity_id="automation.test_automation",
            friendly_name="Test Automation",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

    def test_to_dict_returns_correct_structure(self, sample_paused_automation: PausedAutomation) -> None:
        """Test to_dict returns all fields in correct format."""
        result = sample_paused_automation.to_dict()

        assert "friendly_name" in result
        assert "resume_at" in result
        assert "paused_at" in result
        assert "days" in result
        assert "hours" in result
        assert "minutes" in result
        assert result["friendly_name"] == "Test Automation"
        assert result["hours"] == 1

    def test_to_dict_datetime_as_isoformat(self, sample_paused_automation: PausedAutomation) -> None:
        """Test datetime fields are serialized as ISO format strings."""
        result = sample_paused_automation.to_dict()

        datetime.fromisoformat(result["resume_at"])
        datetime.fromisoformat(result["paused_at"])

    def test_from_dict_creates_correct_instance(self) -> None:
        """Test from_dict creates PausedAutomation with correct values."""
        fixed_now = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
        data = {
            "friendly_name": "My Automation",
            "resume_at": (fixed_now + timedelta(hours=2)).isoformat(),
            "paused_at": fixed_now.isoformat(),
            "days": 1,
            "hours": 2,
            "minutes": 30,
        }

        result = PausedAutomation.from_dict("automation.my_auto", data)

        assert result.entity_id == "automation.my_auto"
        assert result.friendly_name == "My Automation"
        assert result.days == 1
        assert result.hours == 2
        assert result.minutes == 30

    def test_from_dict_defaults_missing_optional_fields(self) -> None:
        """Test from_dict uses defaults for missing optional fields."""
        fixed_now = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
        data = {
            "resume_at": fixed_now.isoformat(),
            "paused_at": fixed_now.isoformat(),
        }

        result = PausedAutomation.from_dict("automation.test", data)

        assert result.friendly_name == "automation.test"
        assert result.days == 0
        assert result.hours == 0
        assert result.minutes == 0

    def test_from_dict_missing_required_key_raises_keyerror(self) -> None:
        """Test from_dict raises KeyError when required fields missing."""
        data = {"friendly_name": "Test"}

        with pytest.raises(KeyError):
            PausedAutomation.from_dict("automation.test", data)

    def test_from_dict_invalid_datetime_raises_valueerror(self) -> None:
        """Test from_dict raises ValueError for invalid datetime format."""
        data = {
            "resume_at": "not-a-datetime",
            "paused_at": "also-not-a-datetime",
        }

        with pytest.raises(ValueError):
            PausedAutomation.from_dict("automation.test", data)

    def test_roundtrip_serialization(self, sample_paused_automation: PausedAutomation) -> None:
        """Test data survives serialization roundtrip."""
        serialized = sample_paused_automation.to_dict()
        restored = PausedAutomation.from_dict(sample_paused_automation.entity_id, serialized)

        assert restored.entity_id == sample_paused_automation.entity_id
        assert restored.friendly_name == sample_paused_automation.friendly_name
        assert restored.days == sample_paused_automation.days
        assert restored.hours == sample_paused_automation.hours
        assert restored.minutes == sample_paused_automation.minutes


# =============================================================================
# ScheduledSnooze Tests
# =============================================================================


class TestScheduledSnooze:
    """Tests for ScheduledSnooze dataclass."""

    @pytest.fixture
    def sample_scheduled_snooze(self) -> ScheduledSnooze:
        """Create a sample scheduled snooze."""
        now = datetime.now(UTC)
        return ScheduledSnooze(
            entity_id="automation.test_automation",
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
        fixed_now = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
        data = {
            "friendly_name": "Scheduled Auto",
            "disable_at": (fixed_now + timedelta(hours=1)).isoformat(),
            "resume_at": (fixed_now + timedelta(hours=3)).isoformat(),
        }

        result = ScheduledSnooze.from_dict("automation.scheduled", data)

        assert result.entity_id == "automation.scheduled"
        assert result.friendly_name == "Scheduled Auto"

    def test_from_dict_defaults_missing_friendly_name(self) -> None:
        """Test from_dict uses entity_id when friendly_name missing."""
        fixed_now = datetime(2024, 6, 15, 12, 0, 0, tzinfo=UTC)
        data = {
            "disable_at": fixed_now.isoformat(),
            "resume_at": (fixed_now + timedelta(hours=1)).isoformat(),
        }

        result = ScheduledSnooze.from_dict("automation.test", data)

        assert result.friendly_name == "automation.test"

    def test_from_dict_missing_required_key_raises_keyerror(self) -> None:
        """Test from_dict raises KeyError when required fields missing."""
        data = {"friendly_name": "Test"}

        with pytest.raises(KeyError):
            ScheduledSnooze.from_dict("automation.test", data)

    def test_roundtrip_serialization(self, sample_scheduled_snooze: ScheduledSnooze) -> None:
        """Test data survives serialization roundtrip."""
        serialized = sample_scheduled_snooze.to_dict()
        restored = ScheduledSnooze.from_dict(sample_scheduled_snooze.entity_id, serialized)

        assert restored.entity_id == sample_scheduled_snooze.entity_id
        assert restored.friendly_name == sample_scheduled_snooze.friendly_name


# =============================================================================
# AutomationPauseData Tests
# =============================================================================


class TestAutomationPauseData:
    """Tests for AutomationPauseData dataclass."""

    @pytest.fixture
    def mock_store(self) -> MagicMock:
        """Create mock store."""
        store = MagicMock()
        store.async_load = AsyncMock(return_value=None)
        store.async_save = AsyncMock()
        return store

    @pytest.fixture
    def automation_pause_data(self, mock_store: MagicMock) -> AutomationPauseData:
        """Create AutomationPauseData instance with mock store."""
        return AutomationPauseData(store=mock_store)

    @pytest.fixture
    def sample_paused_automation(self) -> PausedAutomation:
        """Create a sample paused automation."""
        now = datetime.now(UTC)
        return PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test Automation",
            resume_at=now + timedelta(hours=1),
            paused_at=now,
            days=0,
            hours=1,
            minutes=0,
        )

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

    def test_default_initialization(self) -> None:
        """Test default initialization creates empty collections."""
        data = AutomationPauseData()

        assert data.paused == {}
        assert data.scheduled == {}
        assert data.timers == {}
        assert data.scheduled_timers == {}
        assert data.listeners == []
        assert data.store is None

    def test_add_listener_registers_callback(self, automation_pause_data: AutomationPauseData) -> None:
        """Test add_listener registers callback in listeners list."""
        callback = MagicMock()

        automation_pause_data.add_listener(callback)

        assert callback in automation_pause_data.listeners

    def test_add_listener_returns_removal_function(self, automation_pause_data: AutomationPauseData) -> None:
        """Test add_listener returns function that removes the listener."""
        callback = MagicMock()

        remove_fn = automation_pause_data.add_listener(callback)
        assert callback in automation_pause_data.listeners

        remove_fn()
        assert callback not in automation_pause_data.listeners

    def test_add_multiple_listeners(self, automation_pause_data: AutomationPauseData) -> None:
        """Test multiple listeners can be registered."""
        callback1 = MagicMock()
        callback2 = MagicMock()

        automation_pause_data.add_listener(callback1)
        automation_pause_data.add_listener(callback2)

        assert len(automation_pause_data.listeners) == 2

    def test_notify_calls_all_listeners(self, automation_pause_data: AutomationPauseData) -> None:
        """Test notify calls all registered listeners."""
        callback1 = MagicMock()
        callback2 = MagicMock()
        automation_pause_data.add_listener(callback1)
        automation_pause_data.add_listener(callback2)

        automation_pause_data.notify()

        callback1.assert_called_once()
        callback2.assert_called_once()

    def test_notify_with_no_listeners_does_not_raise(self, automation_pause_data: AutomationPauseData) -> None:
        """Test notify with no listeners doesn't raise exception."""
        automation_pause_data.notify()

    def test_get_paused_dict_returns_serialized_automations(
        self,
        automation_pause_data: AutomationPauseData,
        sample_paused_automation: PausedAutomation,
    ) -> None:
        """Test get_paused_dict returns serialized dict of paused automations."""
        automation_pause_data.paused["automation.test"] = sample_paused_automation

        result = automation_pause_data.get_paused_dict()

        assert "automation.test" in result
        assert result["automation.test"]["friendly_name"] == "Test Automation"

    def test_get_paused_dict_empty_returns_empty_dict(self, automation_pause_data: AutomationPauseData) -> None:
        """Test get_paused_dict returns empty dict when no paused automations."""
        result = automation_pause_data.get_paused_dict()

        assert result == {}

    def test_get_scheduled_dict_returns_serialized_snoozes(
        self,
        automation_pause_data: AutomationPauseData,
        sample_scheduled_snooze: ScheduledSnooze,
    ) -> None:
        """Test get_scheduled_dict returns serialized dict of scheduled snoozes."""
        automation_pause_data.scheduled["automation.test"] = sample_scheduled_snooze

        result = automation_pause_data.get_scheduled_dict()

        assert "automation.test" in result
        assert result["automation.test"]["friendly_name"] == "Test Automation"

    def test_get_scheduled_dict_empty_returns_empty_dict(self, automation_pause_data: AutomationPauseData) -> None:
        """Test get_scheduled_dict returns empty dict when no scheduled snoozes."""
        result = automation_pause_data.get_scheduled_dict()

        assert result == {}


# =============================================================================
# Retry Logic Tests
# =============================================================================


class TestAsyncRetryOrFail:
    """Tests for _async_retry_or_fail function."""

    @pytest.mark.asyncio
    async def test_returns_true_when_retry_count_less_than_max(self) -> None:
        """Test returns True to indicate retry should happen."""
        with patch("custom_components.autosnooze.asyncio.sleep", new_callable=AsyncMock):
            result = await _async_retry_or_fail(0, "Test condition")
        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_when_retries_exhausted(self) -> None:
        """Test returns False when max retries reached."""
        result = await _async_retry_or_fail(LOVELACE_REGISTER_MAX_RETRIES, "Test condition")
        assert result is False

    @pytest.mark.asyncio
    async def test_sleeps_for_correct_delay(self) -> None:
        """Test sleeps for LOVELACE_REGISTER_RETRY_DELAY seconds."""
        with patch("custom_components.autosnooze.asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            await _async_retry_or_fail(0, "Test condition")
        mock_sleep.assert_called_once_with(LOVELACE_REGISTER_RETRY_DELAY)

    @pytest.mark.asyncio
    async def test_does_not_sleep_when_retries_exhausted(self) -> None:
        """Test no sleep when retries are exhausted."""
        with patch("custom_components.autosnooze.asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            await _async_retry_or_fail(LOVELACE_REGISTER_MAX_RETRIES, "Test condition")
        mock_sleep.assert_not_called()


# =============================================================================
# Static Path Registration Tests
# =============================================================================


class TestAsyncRegisterStaticPath:
    """Tests for _async_register_static_path function."""

    @pytest.mark.asyncio
    async def test_registers_static_path_successfully(self) -> None:
        """Test static path registration calls http.async_register_static_paths."""
        mock_hass = MagicMock()
        mock_hass.http.async_register_static_paths = AsyncMock()

        await _async_register_static_path(mock_hass)

        mock_hass.http.async_register_static_paths.assert_called_once()
        call_args = mock_hass.http.async_register_static_paths.call_args[0][0]
        assert len(call_args) == 1
        assert call_args[0].url_path == CARD_URL

    @pytest.mark.asyncio
    async def test_handles_runtime_error_on_reload(self) -> None:
        """Test handles RuntimeError when path already registered."""
        mock_hass = MagicMock()
        mock_hass.http.async_register_static_paths = AsyncMock(side_effect=RuntimeError("Path already registered"))

        await _async_register_static_path(mock_hass)

    @pytest.mark.asyncio
    async def test_static_path_has_cache_headers_false(self) -> None:
        """Test static path is registered with cache_headers=False."""
        mock_hass = MagicMock()
        mock_hass.http.async_register_static_paths = AsyncMock()

        await _async_register_static_path(mock_hass)

        call_args = mock_hass.http.async_register_static_paths.call_args[0][0]
        assert call_args[0].cache_headers is False


# =============================================================================
# Lovelace Resource Registration Tests
# =============================================================================


class TestAsyncRegisterLovelaceResource:
    """Tests for Lovelace resource registration."""

    @pytest.fixture
    def mock_resources(self) -> MagicMock:
        """Create mock Lovelace resources object."""
        resources = MagicMock()
        resources.async_items.return_value = []
        resources.async_create_item = AsyncMock()
        resources.async_update_item = AsyncMock()
        resources.async_delete_item = AsyncMock()
        return resources

    @pytest.fixture
    def mock_hass_with_lovelace(self, mock_resources: MagicMock) -> MagicMock:
        """Create mock hass with Lovelace data."""
        hass = MagicMock()
        lovelace_data = MagicMock()
        lovelace_data.resources = mock_resources
        lovelace_data.mode = "storage"
        hass.data = {"lovelace": lovelace_data}
        return hass

    @pytest.mark.asyncio
    async def test_creates_resource_when_none_exists(
        self, mock_hass_with_lovelace: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Test creates new Lovelace resource when none exists."""
        await _async_register_lovelace_resource(mock_hass_with_lovelace)

        mock_resources.async_create_item.assert_called_once()
        call_args = mock_resources.async_create_item.call_args[0][0]
        assert call_args["url"] == CARD_URL_VERSIONED
        assert call_args["res_type"] == "module"

    @pytest.mark.asyncio
    async def test_updates_resource_when_version_differs(
        self, mock_hass_with_lovelace: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Test updates existing resource when version differs."""
        mock_resources.async_items.return_value = [
            {"id": "autosnooze-1", "url": "/autosnooze-card.js?v=0.0.1", "res_type": "module"}
        ]

        await _async_register_lovelace_resource(mock_hass_with_lovelace)

        mock_resources.async_update_item.assert_called_once()
        call_args = mock_resources.async_update_item.call_args[0]
        assert call_args[0] == "autosnooze-1"
        assert call_args[1]["url"] == CARD_URL_VERSIONED

    @pytest.mark.asyncio
    async def test_no_update_when_version_matches(
        self, mock_hass_with_lovelace: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Test no update when resource version already matches."""
        mock_resources.async_items.return_value = [
            {"id": "autosnooze-1", "url": CARD_URL_VERSIONED, "res_type": "module"}
        ]

        await _async_register_lovelace_resource(mock_hass_with_lovelace)

        mock_resources.async_update_item.assert_not_called()
        mock_resources.async_create_item.assert_not_called()

    @pytest.mark.asyncio
    async def test_does_not_modify_other_resources(
        self, mock_hass_with_lovelace: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Verify other cards' resources are never modified."""
        mock_resources.async_items.return_value = [
            {"id": "mushroom-001", "url": "/hacsfiles/mushroom-cards/mushroom.js", "res_type": "module"},
            {"id": "hacs-002", "url": "/hacsfiles/lovelace-card-mod/card-mod.js", "res_type": "module"},
        ]

        await _async_register_lovelace_resource(mock_hass_with_lovelace)

        for call in mock_resources.async_update_item.call_args_list:
            resource_id = call[0][0]
            assert resource_id not in ["mushroom-001", "hacs-002"]

        assert mock_resources.async_delete_item.call_count == 0

    @pytest.mark.asyncio
    async def test_uses_startswith_for_namespace_matching(
        self, mock_hass_with_lovelace: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Test uses startswith for namespace matching."""
        mock_resources.async_items.return_value = [
            {"id": "other-1", "url": "/other-autosnooze-card.js", "res_type": "module"},
            {"id": "other-2", "url": "/local/autosnooze-card.js", "res_type": "module"},
        ]

        await _async_register_lovelace_resource(mock_hass_with_lovelace)

        mock_resources.async_create_item.assert_called_once()
        mock_resources.async_update_item.assert_not_called()

    @pytest.mark.asyncio
    async def test_handles_yaml_mode(self) -> None:
        """Verify the function handles YAML mode gracefully."""
        mock_hass = MagicMock()
        lovelace_data = MagicMock()
        lovelace_data.resources = None
        lovelace_data.get = MagicMock(return_value=None)
        lovelace_data.mode = "yaml"
        mock_hass.data = {"lovelace": lovelace_data}

        with patch("custom_components.autosnooze.asyncio.sleep", new_callable=AsyncMock):
            await _async_register_lovelace_resource(mock_hass, retry_count=LOVELACE_REGISTER_MAX_RETRIES)

    @pytest.mark.asyncio
    async def test_handles_no_lovelace_data(self) -> None:
        """Verify the function handles missing lovelace data."""
        mock_hass = MagicMock()
        mock_hass.data = {}

        with patch("custom_components.autosnooze.asyncio.sleep", new_callable=AsyncMock):
            await _async_register_lovelace_resource(mock_hass, retry_count=LOVELACE_REGISTER_MAX_RETRIES)

    @pytest.mark.asyncio
    async def test_handles_create_item_exception(
        self, mock_hass_with_lovelace: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Test handles exception from async_create_item gracefully."""
        mock_resources.async_create_item = AsyncMock(side_effect=Exception("Failed to create"))

        await _async_register_lovelace_resource(mock_hass_with_lovelace)

    @pytest.mark.asyncio
    async def test_handles_update_item_exception(
        self, mock_hass_with_lovelace: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Test handles exception from async_update_item gracefully."""
        mock_resources.async_items.return_value = [
            {"id": "autosnooze-1", "url": "/autosnooze-card.js?v=0.0.1", "res_type": "module"}
        ]
        mock_resources.async_update_item = AsyncMock(side_effect=Exception("Failed to update"))

        await _async_register_lovelace_resource(mock_hass_with_lovelace)


class TestLovelaceResourceSafety:
    """Regression tests verifying source code patterns for safe Lovelace registration."""

    def test_uses_namespace_prefix_pattern(self) -> None:
        """Verify resource matching uses namespace prefix like HACS."""
        from pathlib import Path

        init_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "__init__.py"
        assert init_path.exists()
        source = init_path.read_text()

        func_match = source.find("async def _async_register_lovelace_resource")
        assert func_match != -1

        next_func = source.find("\nasync def ", func_match + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_match:next_func]

        assert "startswith" in func_body
        assert "CARD_URL" in func_body

    def test_never_deletes_resources(self) -> None:
        """Verify source code doesn't call async_delete_item."""
        from pathlib import Path

        init_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "__init__.py"
        source = init_path.read_text()

        func_match = source.find("async def _async_register_lovelace_resource")
        next_func = source.find("\nasync def ", func_match + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_match:next_func]

        assert "async_delete_item" not in func_body

    def test_uses_resource_manager_api(self) -> None:
        """Verify resource registration uses lovelace resource manager API."""
        from pathlib import Path

        init_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "__init__.py"
        source = init_path.read_text()

        func_match = source.find("async def _async_register_lovelace_resource")
        next_func = source.find("\nasync def ", func_match + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_match:next_func]

        assert "async_create_item" in func_body
        assert '"res_type": "module"' in func_body


# =============================================================================
# Integration Setup Tests
# =============================================================================


class TestAsyncSetupEntry:
    """Tests for async_setup_entry function."""

    @pytest.fixture
    def mock_entry(self) -> MagicMock:
        """Create mock config entry."""
        entry = MagicMock()
        entry.runtime_data = None
        return entry

    @pytest.fixture
    def mock_hass_running(self) -> MagicMock:
        """Create mock hass that is already running."""
        hass = MagicMock()
        hass.is_running = True
        hass.data = {}
        hass.http.async_register_static_paths = AsyncMock()
        hass.config_entries.async_forward_entry_setups = AsyncMock()
        return hass

    @pytest.fixture
    def mock_hass_starting(self) -> MagicMock:
        """Create mock hass that is still starting."""
        hass = MagicMock()
        hass.is_running = False
        hass.data = {}
        hass.http.async_register_static_paths = AsyncMock()
        hass.config_entries.async_forward_entry_setups = AsyncMock()
        hass.bus.async_listen_once = MagicMock(return_value=MagicMock())
        return hass

    @pytest.mark.asyncio
    async def test_creates_automation_pause_data(self, mock_hass_running: MagicMock, mock_entry: MagicMock) -> None:
        """Test creates AutomationPauseData and assigns to runtime_data."""
        with (
            patch("custom_components.autosnooze._async_register_lovelace_resource", new_callable=AsyncMock),
            patch("custom_components.autosnooze.async_load_stored", new_callable=AsyncMock),
            patch("custom_components.autosnooze.register_services"),
        ):
            result = await async_setup_entry(mock_hass_running, mock_entry)

        assert result is True
        assert mock_entry.runtime_data is not None
        assert isinstance(mock_entry.runtime_data, AutomationPauseData)

    @pytest.mark.asyncio
    async def test_registers_static_path(self, mock_hass_running: MagicMock, mock_entry: MagicMock) -> None:
        """Test registers static path for JS file."""
        with (
            patch("custom_components.autosnooze._async_register_lovelace_resource", new_callable=AsyncMock),
            patch("custom_components.autosnooze.async_load_stored", new_callable=AsyncMock),
            patch("custom_components.autosnooze.register_services"),
        ):
            await async_setup_entry(mock_hass_running, mock_entry)

        mock_hass_running.http.async_register_static_paths.assert_called()

    @pytest.mark.asyncio
    async def test_loads_stored_data_when_running(self, mock_hass_running: MagicMock, mock_entry: MagicMock) -> None:
        """Test loads stored data immediately when HA is running."""
        with (
            patch("custom_components.autosnooze._async_register_lovelace_resource", new_callable=AsyncMock),
            patch("custom_components.autosnooze.async_load_stored", new_callable=AsyncMock) as mock_load,
            patch("custom_components.autosnooze.register_services"),
        ):
            await async_setup_entry(mock_hass_running, mock_entry)

        mock_load.assert_called_once()

    @pytest.mark.asyncio
    async def test_defers_loading_when_not_running(self, mock_hass_starting: MagicMock, mock_entry: MagicMock) -> None:
        """Test defers loading when HA is still starting."""
        with (
            patch("custom_components.autosnooze._async_register_lovelace_resource", new_callable=AsyncMock),
            patch("custom_components.autosnooze.async_load_stored", new_callable=AsyncMock) as mock_load,
            patch("custom_components.autosnooze.register_services"),
        ):
            await async_setup_entry(mock_hass_starting, mock_entry)

        mock_load.assert_not_called()
        mock_hass_starting.bus.async_listen_once.assert_called_once()

    @pytest.mark.asyncio
    async def test_registers_services(self, mock_hass_running: MagicMock, mock_entry: MagicMock) -> None:
        """Test registers services."""
        with (
            patch("custom_components.autosnooze._async_register_lovelace_resource", new_callable=AsyncMock),
            patch("custom_components.autosnooze.async_load_stored", new_callable=AsyncMock),
            patch("custom_components.autosnooze.register_services") as mock_register,
        ):
            await async_setup_entry(mock_hass_running, mock_entry)

        mock_register.assert_called_once()

    @pytest.mark.asyncio
    async def test_forwards_entry_setups(self, mock_hass_running: MagicMock, mock_entry: MagicMock) -> None:
        """Test forwards entry setups for platforms."""
        with (
            patch("custom_components.autosnooze._async_register_lovelace_resource", new_callable=AsyncMock),
            patch("custom_components.autosnooze.async_load_stored", new_callable=AsyncMock),
            patch("custom_components.autosnooze.register_services"),
        ):
            await async_setup_entry(mock_hass_running, mock_entry)

        mock_hass_running.config_entries.async_forward_entry_setups.assert_called_once()


# =============================================================================
# Integration Unload Tests
# =============================================================================


class TestAsyncUnloadEntry:
    """Tests for async_unload_entry function."""

    @pytest.fixture
    def mock_data(self) -> AutomationPauseData:
        """Create mock AutomationPauseData."""
        return AutomationPauseData()

    @pytest.fixture
    def mock_entry(self, mock_data: AutomationPauseData) -> MagicMock:
        """Create mock config entry with runtime data."""
        entry = MagicMock()
        entry.runtime_data = mock_data
        return entry

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock hass."""
        hass = MagicMock()
        hass.config_entries.async_unload_platforms = AsyncMock(return_value=True)
        hass.config_entries.async_loaded_entries = MagicMock(return_value=[MagicMock()])
        hass.services.async_remove = MagicMock()
        return hass

    @pytest.mark.asyncio
    async def test_marks_data_as_unloaded(
        self, mock_hass: MagicMock, mock_entry: MagicMock, mock_data: AutomationPauseData
    ) -> None:
        """Test marks data as unloaded."""
        await async_unload_entry(mock_hass, mock_entry)

        assert mock_data.unloaded is True

    @pytest.mark.asyncio
    async def test_cancels_all_timers(
        self, mock_hass: MagicMock, mock_entry: MagicMock, mock_data: AutomationPauseData
    ) -> None:
        """Test cancels all resume timers."""
        unsub1 = MagicMock()
        unsub2 = MagicMock()
        mock_data.timers["automation.test1"] = unsub1
        mock_data.timers["automation.test2"] = unsub2

        await async_unload_entry(mock_hass, mock_entry)

        unsub1.assert_called_once()
        unsub2.assert_called_once()
        assert len(mock_data.timers) == 0

    @pytest.mark.asyncio
    async def test_cancels_all_scheduled_timers(
        self, mock_hass: MagicMock, mock_entry: MagicMock, mock_data: AutomationPauseData
    ) -> None:
        """Test cancels all scheduled timers."""
        unsub1 = MagicMock()
        unsub2 = MagicMock()
        mock_data.scheduled_timers["automation.test1"] = unsub1
        mock_data.scheduled_timers["automation.test2"] = unsub2

        await async_unload_entry(mock_hass, mock_entry)

        unsub1.assert_called_once()
        unsub2.assert_called_once()
        assert len(mock_data.scheduled_timers) == 0

    @pytest.mark.asyncio
    async def test_clears_listeners(
        self, mock_hass: MagicMock, mock_entry: MagicMock, mock_data: AutomationPauseData
    ) -> None:
        """Test clears all listeners."""
        mock_data.listeners.append(MagicMock())
        mock_data.listeners.append(MagicMock())

        await async_unload_entry(mock_hass, mock_entry)

        assert len(mock_data.listeners) == 0

    @pytest.mark.asyncio
    async def test_removes_services_when_last_entry(self, mock_hass: MagicMock, mock_entry: MagicMock) -> None:
        """Test removes services when this is the last entry."""
        mock_hass.config_entries.async_loaded_entries.return_value = [mock_entry]

        await async_unload_entry(mock_hass, mock_entry)

        assert mock_hass.services.async_remove.call_count >= 5

    @pytest.mark.asyncio
    async def test_keeps_services_when_other_entries_exist(self, mock_hass: MagicMock, mock_entry: MagicMock) -> None:
        """Test keeps services when other entries still exist."""
        mock_hass.config_entries.async_loaded_entries.return_value = [mock_entry, MagicMock()]

        await async_unload_entry(mock_hass, mock_entry)

        mock_hass.services.async_remove.assert_not_called()

    @pytest.mark.asyncio
    async def test_cancels_startup_listener_if_exists(
        self, mock_hass: MagicMock, mock_entry: MagicMock, mock_data: AutomationPauseData
    ) -> None:
        """Test cancels startup listener if HA hasn't started yet."""
        startup_unsub = MagicMock()
        mock_data.startup_listener_unsub = startup_unsub

        await async_unload_entry(mock_hass, mock_entry)

        startup_unsub.assert_called_once()
        assert mock_data.startup_listener_unsub is None

    @pytest.mark.asyncio
    async def test_returns_unload_ok_status(self, mock_hass: MagicMock, mock_entry: MagicMock) -> None:
        """Test returns the unload_ok status from platform unload."""
        mock_hass.config_entries.async_unload_platforms = AsyncMock(return_value=True)
        result = await async_unload_entry(mock_hass, mock_entry)
        assert result is True

    @pytest.mark.asyncio
    async def test_does_not_cleanup_on_failed_unload(
        self, mock_hass: MagicMock, mock_entry: MagicMock, mock_data: AutomationPauseData
    ) -> None:
        """Test does not cleanup when platform unload fails."""
        mock_hass.config_entries.async_unload_platforms = AsyncMock(return_value=False)
        mock_data.timers["automation.test"] = MagicMock()

        await async_unload_entry(mock_hass, mock_entry)

        assert "automation.test" in mock_data.timers
