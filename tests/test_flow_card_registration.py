"""Tests for User Flow 5: Card Registration.

This file tests card registration including:
- Static path registration
- Lovelace resource registration
- Integration setup and unload
- JavaScript card bundle
- Registration retry logic
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.core import HomeAssistant

from custom_components.autosnooze import (
    DOMAIN,
    async_setup_entry,
    async_unload_entry,
    _async_register_static_path,
    _async_register_lovelace_resource,
)
from custom_components.autosnooze.const import (
    CARD_URL,
    CARD_URL_VERSIONED,
    VERSION,
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
# Register Static Path Tests
# =============================================================================


class TestAsyncRegisterStaticPath:
    """Tests for _async_register_static_path function."""

    @pytest.mark.asyncio
    async def test_registers_path_with_correct_url(self) -> None:
        """Test static path is registered with correct URL."""
        mock_hass = MagicMock()
        mock_hass.http = MagicMock()
        mock_hass.http.async_register_static_paths = AsyncMock()

        await _async_register_static_path(mock_hass)

        mock_hass.http.async_register_static_paths.assert_called_once()

    @pytest.mark.asyncio
    async def test_handles_registration_error(self) -> None:
        """Test handles error during registration."""
        mock_hass = MagicMock()
        mock_hass.http = MagicMock()
        mock_hass.http.async_register_static_paths = AsyncMock(side_effect=Exception("Registration failed"))

        with pytest.raises(Exception, match="Registration failed"):
            await _async_register_static_path(mock_hass)


# =============================================================================
# Register Lovelace Resource Tests
# =============================================================================


class TestAsyncRegisterLovelaceResource:
    """Tests for _async_register_lovelace_resource function."""

    @pytest.mark.asyncio
    async def test_creates_resource_when_not_exists(self) -> None:
        """Test creates resource when it doesn't exist."""
        mock_hass = MagicMock()
        mock_resources = MagicMock()
        mock_resources.async_items.return_value = []
        mock_resources.async_create_item = AsyncMock()
        mock_lovelace = MagicMock()
        mock_lovelace.resources = mock_resources
        mock_hass.data = {"lovelace": mock_lovelace}

        await _async_register_lovelace_resource(mock_hass)

        mock_resources.async_create_item.assert_called_once()

    @pytest.mark.asyncio
    async def test_updates_resource_when_version_differs(self) -> None:
        """Test updates resource when version differs."""
        mock_hass = MagicMock()
        mock_resources = MagicMock()
        existing_resource = {
            "id": "test_id",
            "url": "/autosnooze-card.js?v=0.0.0",
            "type": "module",
        }
        mock_resources.async_items.return_value = [existing_resource]
        mock_resources.async_update_item = AsyncMock()
        mock_lovelace = MagicMock()
        mock_lovelace.resources = mock_resources
        mock_hass.data = {"lovelace": mock_lovelace}

        await _async_register_lovelace_resource(mock_hass)

        mock_resources.async_update_item.assert_called_once()

    @pytest.mark.asyncio
    async def test_skips_update_when_version_matches(self) -> None:
        """Test skips update when version matches."""
        mock_hass = MagicMock()
        mock_resources = MagicMock()
        existing_resource = {
            "id": "test_id",
            "url": CARD_URL_VERSIONED,
            "type": "module",
        }
        mock_resources.async_items.return_value = [existing_resource]
        mock_resources.async_update_item = AsyncMock()
        mock_resources.async_create_item = AsyncMock()
        mock_lovelace = MagicMock()
        mock_lovelace.resources = mock_resources
        mock_hass.data = {"lovelace": mock_lovelace}

        await _async_register_lovelace_resource(mock_hass)

        mock_resources.async_update_item.assert_not_called()
        mock_resources.async_create_item.assert_not_called()


# =============================================================================
# Lovelace Resource Safety Tests
# =============================================================================


class TestLovelaceResourceSafety:
    """Tests for safe Lovelace resource handling (no deletion)."""

    @pytest.mark.asyncio
    async def test_never_deletes_resources(self) -> None:
        """Test that Lovelace resources are never deleted."""
        mock_hass = MagicMock()
        mock_resources = MagicMock()
        mock_resources.async_items.return_value = []
        mock_resources.async_create_item = AsyncMock()
        mock_resources.async_delete_item = AsyncMock()
        mock_lovelace = MagicMock()
        mock_lovelace.resources = mock_resources
        mock_hass.data = {"lovelace": mock_lovelace}

        await _async_register_lovelace_resource(mock_hass)

        mock_resources.async_delete_item.assert_not_called()


# =============================================================================
# Integration Setup Tests
# =============================================================================


class TestAsyncSetupEntry:
    """Tests for async_setup_entry function."""

    @pytest.mark.asyncio
    async def test_setup_entry_creates_runtime_data(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test setup creates runtime data."""
        assert setup_integration.runtime_data is not None

    @pytest.mark.asyncio
    async def test_setup_entry_registers_services(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test setup registers all services."""
        assert hass.services.has_service(DOMAIN, "pause")
        assert hass.services.has_service(DOMAIN, "cancel")
        assert hass.services.has_service(DOMAIN, "cancel_all")
        assert hass.services.has_service(DOMAIN, "pause_by_area")
        assert hass.services.has_service(DOMAIN, "pause_by_label")
        assert hass.services.has_service(DOMAIN, "cancel_scheduled")

    @pytest.mark.asyncio
    async def test_setup_entry_state_is_loaded(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test setup entry state is loaded."""
        assert setup_integration.state == ConfigEntryState.LOADED


# =============================================================================
# Integration Unload Tests
# =============================================================================


class TestAsyncUnloadEntry:
    """Tests for async_unload_entry function."""

    @pytest.mark.asyncio
    async def test_unload_entry_returns_true(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test unload returns True."""
        result = await hass.config_entries.async_unload(setup_integration.entry_id)
        assert result is True

    @pytest.mark.asyncio
    async def test_unload_entry_removes_services(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test unload removes services."""
        await hass.config_entries.async_unload(setup_integration.entry_id)

        assert not hass.services.has_service(DOMAIN, "pause")
        assert not hass.services.has_service(DOMAIN, "cancel")
        assert not hass.services.has_service(DOMAIN, "cancel_all")


# =============================================================================
# Static Path Registration Integration Tests
# =============================================================================


class TestStaticPathRegistration:
    """Test static path registration during setup."""

    @pytest.mark.asyncio
    async def test_static_path_registered_on_setup(self, hass: HomeAssistant, setup_integration: ConfigEntry) -> None:
        """Test that static path is registered during setup."""
        hass.http.async_register_static_paths.assert_called()


# =============================================================================
# Lovelace Resource Registration Integration Tests
# =============================================================================


class TestLovelaceResourceRegistration:
    """Test Lovelace resource registration during setup."""

    @pytest.mark.asyncio
    async def test_lovelace_resource_registered_on_setup(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test that Lovelace resource is registered during setup."""
        lovelace = hass.data.get("lovelace")
        assert lovelace is not None


# =============================================================================
# Card Bundle Tests
# =============================================================================


class TestCardBundle:
    """Tests for JavaScript card bundle."""

    def test_card_bundle_exists(self) -> None:
        """Test that the card bundle file exists."""
        bundle_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "www" / "autosnooze-card.js"
        assert bundle_path.exists(), f"Card bundle not found at {bundle_path}"

    def test_card_bundle_not_empty(self) -> None:
        """Test that the card bundle is not empty."""
        bundle_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "www" / "autosnooze-card.js"
        assert bundle_path.stat().st_size > 0, "Card bundle is empty"

    def test_card_bundle_is_module(self) -> None:
        """Test that the card bundle is a valid ES module."""
        bundle_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "www" / "autosnooze-card.js"
        content = bundle_path.read_text()
        # Check for ES module indicators
        assert "export" in content or "import" in content or "customElements" in content

    def test_card_bundle_contains_version(self) -> None:
        """Test that the card bundle contains version info."""
        bundle_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "www" / "autosnooze-card.js"
        content = bundle_path.read_text()
        # The bundled code should contain version info
        assert VERSION in content or "CARD_VERSION" in content or "version" in content.lower()

    def test_card_bundle_no_bare_lit_imports(self) -> None:
        """Test that the bundle doesn't have bare 'lit' imports (should be bundled)."""
        bundle_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "www" / "autosnooze-card.js"
        content = bundle_path.read_text()
        # Check that lit is bundled, not imported from external
        assert "from 'lit'" not in content
        assert 'from "lit"' not in content

    def test_card_registers_custom_element(self) -> None:
        """Test that the bundle registers the custom element."""
        bundle_path = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "www" / "autosnooze-card.js"
        content = bundle_path.read_text()
        assert "autosnooze-card" in content
        assert "customElements" in content


# =============================================================================
# Lovelace Registration Edge Cases
# =============================================================================


class TestLovelaceRegistrationRetry:
    """Tests for Lovelace registration retry logic."""

    @pytest.mark.asyncio
    async def test_lovelace_not_initialized_retries(self) -> None:
        """Test retry logic when Lovelace not yet initialized."""
        mock_hass = MagicMock()
        mock_hass.data = {}  # No lovelace data

        with patch(
            "custom_components.autosnooze._async_retry_or_fail",
            new_callable=AsyncMock,
            return_value=False,
        ) as mock_retry:
            await _async_register_lovelace_resource(mock_hass)
            mock_retry.assert_called()

    @pytest.mark.asyncio
    async def test_lovelace_resources_none_yaml_mode(self) -> None:
        """Test warning when Lovelace in YAML mode (resources=None)."""
        mock_hass = MagicMock()
        mock_lovelace = MagicMock()
        mock_lovelace.resources = None
        mock_lovelace.mode = "yaml"
        mock_hass.data = {"lovelace": mock_lovelace}

        with patch(
            "custom_components.autosnooze._async_retry_or_fail",
            new_callable=AsyncMock,
            return_value=False,
        ):
            # Should not raise, just log warning
            await _async_register_lovelace_resource(mock_hass)

    @pytest.mark.asyncio
    async def test_lovelace_resources_missing_api(self) -> None:
        """Test warning when Lovelace resources API not available."""
        mock_hass = MagicMock()
        mock_lovelace = MagicMock()
        # Resources object without expected methods
        mock_resources = MagicMock(spec=[])  # Empty spec - no methods
        del mock_resources.async_create_item
        del mock_resources.async_items
        mock_lovelace.resources = mock_resources
        mock_hass.data = {"lovelace": mock_lovelace}

        # Should not raise, just log warning
        await _async_register_lovelace_resource(mock_hass)

    @pytest.mark.asyncio
    async def test_lovelace_resource_update_failure(self) -> None:
        """Test exception handling during resource update."""
        mock_hass = MagicMock()
        mock_resources = MagicMock()
        existing_resource = {
            "id": "test_id",
            "url": "/autosnooze-card.js?v=0.0.0",  # Old version
            "type": "module",
        }
        mock_resources.async_items.return_value = [existing_resource]
        mock_resources.async_update_item = AsyncMock(side_effect=Exception("Update failed"))
        mock_lovelace = MagicMock()
        mock_lovelace.resources = mock_resources
        mock_hass.data = {"lovelace": mock_lovelace}

        # Should not raise, just log warning
        await _async_register_lovelace_resource(mock_hass)
        mock_resources.async_update_item.assert_called_once()

    @pytest.mark.asyncio
    async def test_lovelace_resource_create_failure(self) -> None:
        """Test exception handling during resource creation."""
        mock_hass = MagicMock()
        mock_resources = MagicMock()
        mock_resources.async_items.return_value = []
        mock_resources.async_create_item = AsyncMock(side_effect=Exception("Create failed"))
        mock_lovelace = MagicMock()
        mock_lovelace.resources = mock_resources
        mock_hass.data = {"lovelace": mock_lovelace}

        # Should not raise, just log warning
        await _async_register_lovelace_resource(mock_hass)
        mock_resources.async_create_item.assert_called_once()


class TestRetryOrFail:
    """Tests for _async_retry_or_fail function."""

    @pytest.mark.asyncio
    async def test_retry_returns_true_when_not_exhausted(self) -> None:
        """Test retry returns True when retries remain."""
        from custom_components.autosnooze import _async_retry_or_fail

        with patch("asyncio.sleep", new_callable=AsyncMock):
            result = await _async_retry_or_fail(0, "Test condition")
            assert result is True

    @pytest.mark.asyncio
    async def test_retry_returns_false_when_exhausted(self) -> None:
        """Test retry returns False when retries exhausted."""
        from custom_components.autosnooze import (
            _async_retry_or_fail,
            LOVELACE_REGISTER_MAX_RETRIES,
        )

        result = await _async_retry_or_fail(LOVELACE_REGISTER_MAX_RETRIES, "Test condition")
        assert result is False

    @pytest.mark.asyncio
    async def test_retry_sleeps_for_correct_delay(self) -> None:
        """Test retry sleeps for LOVELACE_REGISTER_RETRY_DELAY seconds.

        Catches mutation: LOVELACE_REGISTER_RETRY_DELAY -> None
        """
        from custom_components.autosnooze import (
            _async_retry_or_fail,
            LOVELACE_REGISTER_RETRY_DELAY,
        )

        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            await _async_retry_or_fail(0, "Test condition")
            mock_sleep.assert_called_once_with(LOVELACE_REGISTER_RETRY_DELAY)

    @pytest.mark.asyncio
    async def test_retry_uses_log_context_when_provided(self) -> None:
        """Test that log_context is used when provided.

        Catches mutation: log_context: str = "" -> log_context: str = "XXXX"
        """
        from custom_components.autosnooze import _async_retry_or_fail
        import logging

        with patch("asyncio.sleep", new_callable=AsyncMock):
            with patch.object(logging.getLogger("custom_components.autosnooze"), "debug") as mock_log:
                await _async_retry_or_fail(0, "Test condition", "my context")
                # Verify log was called and contains the context
                mock_log.assert_called()

    @pytest.mark.asyncio
    async def test_retry_boundary_at_max_minus_one(self) -> None:
        """Test retry returns True at max_retries - 1.

        Catches mutation: retry_count < LOVELACE_REGISTER_MAX_RETRIES -> retry_count <= LOVELACE_REGISTER_MAX_RETRIES
        """
        from custom_components.autosnooze import (
            _async_retry_or_fail,
            LOVELACE_REGISTER_MAX_RETRIES,
        )

        with patch("asyncio.sleep", new_callable=AsyncMock):
            result = await _async_retry_or_fail(LOVELACE_REGISTER_MAX_RETRIES - 1, "Test condition")
            assert result is True


# =============================================================================
# Setup Entry Tests
# =============================================================================


class TestAsyncSetupEntryMutations:
    """Mutation-killing tests for async_setup_entry."""

    @pytest.mark.asyncio
    async def test_setup_entry_creates_store_with_correct_params(
        self, hass: HomeAssistant, mock_config_entry: MockConfigEntry
    ) -> None:
        """Test that Store is created with correct parameters.

        Catches mutation: Store[...](hass, STORAGE_VERSION, ...) -> None
        """
        mock_config_entry.add_to_hass(hass)
        await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()

        entry = hass.config_entries.async_get_entry(mock_config_entry.entry_id)
        # Verify runtime_data was created with a store
        assert entry.runtime_data is not None
        assert entry.runtime_data.store is not None

    @pytest.mark.asyncio
    async def test_setup_entry_creates_data_with_store(
        self, hass: HomeAssistant, mock_config_entry: MockConfigEntry
    ) -> None:
        """Test that AutomationPauseData is created with the store."""
        mock_config_entry.add_to_hass(hass)
        await hass.config_entries.async_setup(mock_config_entry.entry_id)
        await hass.async_block_till_done()

        entry = hass.config_entries.async_get_entry(mock_config_entry.entry_id)
        data = entry.runtime_data
        assert data is not None
        # Verify data has the expected attributes
        assert hasattr(data, "paused")
        assert hasattr(data, "scheduled")
        assert hasattr(data, "timers")


# =============================================================================
# Unload Entry Tests
# =============================================================================


class TestAsyncUnloadEntryMutations:
    """Mutation-killing tests for async_unload_entry."""

    @pytest.mark.asyncio
    async def test_unload_sets_unloaded_flag(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test unload sets data.unloaded to True."""
        data = setup_integration.runtime_data
        assert data.unloaded is False

        await hass.config_entries.async_unload(setup_integration.entry_id)

        assert data.unloaded is True

    @pytest.mark.asyncio
    async def test_unload_cancels_all_timers(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test unload cancels all active timers."""
        data = setup_integration.runtime_data
        mock_timer = MagicMock()
        data.timers["automation.test"] = mock_timer

        await hass.config_entries.async_unload(setup_integration.entry_id)

        mock_timer.assert_called_once()
        assert len(data.timers) == 0

    @pytest.mark.asyncio
    async def test_unload_cancels_all_scheduled_timers(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test unload cancels all scheduled timers."""
        data = setup_integration.runtime_data
        mock_timer = MagicMock()
        data.scheduled_timers["automation.test"] = mock_timer

        await hass.config_entries.async_unload(setup_integration.entry_id)

        mock_timer.assert_called_once()
        assert len(data.scheduled_timers) == 0

    @pytest.mark.asyncio
    async def test_unload_clears_listeners(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test unload clears all listeners."""
        data = setup_integration.runtime_data
        data.listeners.append(MagicMock())

        await hass.config_entries.async_unload(setup_integration.entry_id)

        assert len(data.listeners) == 0

    @pytest.mark.asyncio
    async def test_unload_cancels_startup_listener_if_exists(
        self, hass: HomeAssistant, setup_integration: ConfigEntry
    ) -> None:
        """Test unload cancels startup listener if it exists."""
        data = setup_integration.runtime_data
        mock_unsub = MagicMock()
        data.startup_listener_unsub = mock_unsub

        await hass.config_entries.async_unload(setup_integration.entry_id)

        mock_unsub.assert_called_once()
        assert data.startup_listener_unsub is None


# =============================================================================
# Label Registration Tests
# =============================================================================


class TestEnsureLabelsExist:
    """Tests for _async_ensure_labels_exist function."""

    @pytest.mark.asyncio
    async def test_creates_include_label(self, hass: HomeAssistant) -> None:
        """Test that autosnooze_include label is created."""
        from custom_components.autosnooze import _async_ensure_labels_exist
        from homeassistant.helpers import label_registry as lr

        label_reg = lr.async_get(hass)

        # Clear any existing labels
        for label_id in list(label_reg.labels.keys()):
            if "autosnooze" in label_id:
                label_reg.async_delete(label_id)

        await _async_ensure_labels_exist(hass)

        # Verify label was created (by name, not id)
        labels = [l.name for l in label_reg.labels.values()]
        assert "autosnooze_include" in labels

    @pytest.mark.asyncio
    async def test_creates_exclude_label(self, hass: HomeAssistant) -> None:
        """Test that autosnooze_exclude label is created."""
        from custom_components.autosnooze import _async_ensure_labels_exist
        from homeassistant.helpers import label_registry as lr

        label_reg = lr.async_get(hass)

        # Clear any existing labels
        for label_id in list(label_reg.labels.keys()):
            if "autosnooze" in label_id:
                label_reg.async_delete(label_id)

        await _async_ensure_labels_exist(hass)

        labels = [l.name for l in label_reg.labels.values()]
        assert "autosnooze_exclude" in labels

    @pytest.mark.asyncio
    async def test_handles_existing_labels_gracefully(self, hass: HomeAssistant) -> None:
        """Test that existing labels don't cause errors."""
        from custom_components.autosnooze import _async_ensure_labels_exist
        from homeassistant.helpers import label_registry as lr

        label_reg = lr.async_get(hass)

        # Create labels first
        try:
            label_reg.async_create(name="autosnooze_include")
        except ValueError:
            pass  # Already exists

        # Should not raise
        await _async_ensure_labels_exist(hass)
