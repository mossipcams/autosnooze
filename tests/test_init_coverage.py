"""Tests for __init__.py to improve mutation testing coverage.

These tests focus on async_setup_entry, async_unload_entry, and Lovelace
resource registration that had surviving mutations.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock

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
    DOMAIN,
)
from custom_components.autosnooze.models import AutomationPauseData

UTC = timezone.utc


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
    async def test_includes_log_context_when_provided(self) -> None:
        """Test log context is included in debug message."""
        with (
            patch("custom_components.autosnooze.asyncio.sleep", new_callable=AsyncMock),
            patch("custom_components.autosnooze._LOGGER") as mock_logger,
        ):
            await _async_retry_or_fail(1, "Test condition", "extra context")
            mock_logger.debug.assert_called_once()
            call_args = mock_logger.debug.call_args[0]
            assert "extra context" in call_args[1] or "extra context" in str(call_args)

    @pytest.mark.asyncio
    async def test_does_not_sleep_when_retries_exhausted(self) -> None:
        """Test no sleep when retries are exhausted."""
        with patch("custom_components.autosnooze.asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            await _async_retry_or_fail(LOVELACE_REGISTER_MAX_RETRIES, "Test condition")
        mock_sleep.assert_not_called()


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

        # Should not raise
        await _async_register_static_path(mock_hass)

    @pytest.mark.asyncio
    async def test_static_path_has_cache_headers_false(self) -> None:
        """Test static path is registered with cache_headers=False."""
        mock_hass = MagicMock()
        mock_hass.http.async_register_static_paths = AsyncMock()

        await _async_register_static_path(mock_hass)

        call_args = mock_hass.http.async_register_static_paths.call_args[0][0]
        assert call_args[0].cache_headers is False


class TestAsyncRegisterLovelaceResource:
    """Tests for _async_register_lovelace_resource function."""

    @pytest.fixture
    def mock_resources(self) -> MagicMock:
        """Create mock Lovelace resources object."""
        resources = MagicMock()
        resources.async_items.return_value = []
        resources.async_create_item = AsyncMock()
        resources.async_update_item = AsyncMock()
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
    async def test_retries_when_lovelace_not_initialized(self) -> None:
        """Test retries registration when Lovelace not initialized."""
        mock_hass = MagicMock()
        mock_hass.data = {}  # No lovelace data

        with patch("custom_components.autosnooze.asyncio.sleep", new_callable=AsyncMock):
            await _async_register_lovelace_resource(mock_hass, retry_count=LOVELACE_REGISTER_MAX_RETRIES)

        # Should have given up after max retries without crashing

    @pytest.mark.asyncio
    async def test_retries_when_resources_none(self) -> None:
        """Test retries when resources is None."""
        mock_hass = MagicMock()
        lovelace_data = MagicMock()
        lovelace_data.resources = None
        lovelace_data.get = MagicMock(return_value=None)
        lovelace_data.mode = "yaml"
        mock_hass.data = {"lovelace": lovelace_data}

        with patch("custom_components.autosnooze.asyncio.sleep", new_callable=AsyncMock):
            await _async_register_lovelace_resource(mock_hass, retry_count=LOVELACE_REGISTER_MAX_RETRIES)

    @pytest.mark.asyncio
    async def test_handles_create_item_exception(
        self, mock_hass_with_lovelace: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Test handles exception from async_create_item gracefully."""
        mock_resources.async_create_item = AsyncMock(side_effect=Exception("Failed to create"))

        # Should not raise
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

        # Should not raise
        await _async_register_lovelace_resource(mock_hass_with_lovelace)

    @pytest.mark.asyncio
    async def test_uses_startswith_for_namespace_matching(
        self, mock_hass_with_lovelace: MagicMock, mock_resources: MagicMock
    ) -> None:
        """Test uses startswith for namespace matching."""
        # These should NOT match our namespace
        mock_resources.async_items.return_value = [
            {"id": "other-1", "url": "/other-autosnooze-card.js", "res_type": "module"},
            {"id": "other-2", "url": "/local/autosnooze-card.js", "res_type": "module"},
        ]

        await _async_register_lovelace_resource(mock_hass_with_lovelace)

        # Should create new since none matched
        mock_resources.async_create_item.assert_called_once()
        mock_resources.async_update_item.assert_not_called()

    @pytest.mark.asyncio
    async def test_handles_missing_resources_api(self) -> None:
        """Test handles resources without expected API methods."""
        mock_hass = MagicMock()
        lovelace_data = MagicMock()
        # Resources exists but missing required methods
        resources = MagicMock(spec=[])  # Empty spec - no methods
        lovelace_data.resources = resources
        mock_hass.data = {"lovelace": lovelace_data}

        # Should not raise
        await _async_register_lovelace_resource(mock_hass)


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

        # Should not have called load_stored yet
        mock_load.assert_not_called()
        # Should have registered listener
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


class TestAsyncUnloadEntry:
    """Tests for async_unload_entry function."""

    @pytest.fixture
    def mock_data(self) -> AutomationPauseData:
        """Create mock AutomationPauseData."""
        data = AutomationPauseData()
        return data

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

        # Should have removed all services
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

        mock_hass.config_entries.async_unload_platforms = AsyncMock(return_value=False)
        # Need fresh entry for this test
        entry2 = MagicMock()
        entry2.runtime_data = AutomationPauseData()
        result = await async_unload_entry(mock_hass, entry2)
        assert result is False

    @pytest.mark.asyncio
    async def test_does_not_cleanup_on_failed_unload(
        self, mock_hass: MagicMock, mock_entry: MagicMock, mock_data: AutomationPauseData
    ) -> None:
        """Test does not cleanup when platform unload fails."""
        mock_hass.config_entries.async_unload_platforms = AsyncMock(return_value=False)
        mock_data.timers["automation.test"] = MagicMock()

        await async_unload_entry(mock_hass, mock_entry)

        # Timer should NOT have been cancelled since unload failed
        assert "automation.test" in mock_data.timers
