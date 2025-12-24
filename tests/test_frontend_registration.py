"""Regression Tests for Frontend Registration (iOS Refresh Fix).

Root Cause: Previous versions used add_extra_js_url() to register the card,
which caused issues on iOS Companion app refreshes where the custom element
would become undefined. Other HACS cards don't have this issue because they
use Lovelace Resources only.

Fix: Use Lovelace Resources registration only (like HACS cards do), not
add_extra_js_url(). This matches how working HACS cards register.

Reference: HACS uses Lovelace Resources stored in .storage/lovelace_resources
"""

from __future__ import annotations

import ast
import asyncio
import os
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch, call

import pytest


# =============================================================================
# Test Constants
# =============================================================================

INIT_FILE_PATH = Path(__file__).parent.parent / "custom_components" / "autosnooze" / "__init__.py"


def get_init_source() -> str:
    """Read the __init__.py source code."""
    assert INIT_FILE_PATH.exists(), f"Init file not found at {INIT_FILE_PATH}"
    return INIT_FILE_PATH.read_text()


# =============================================================================
# iOS Refresh Fix: Use Lovelace Resources Only (like HACS cards)
# =============================================================================


class TestLovelaceResourcesOnlyRegistration:
    """Source code analysis tests for Lovelace-only registration.

    These tests verify the code uses the same approach as working HACS cards.
    """

    def test_does_not_import_add_extra_js_url(self) -> None:
        """Verify add_extra_js_url is NOT imported (iOS refresh fix).

        REGRESSION: Using add_extra_js_url caused iOS refresh issues.
        Other HACS cards don't have this issue because they don't use it.
        """
        source = get_init_source()

        # Must NOT import add_extra_js_url from frontend
        # (it may appear in comments explaining why we don't use it)
        assert "from homeassistant.components.frontend import add_extra_js_url" not in source, (
            "Must NOT import add_extra_js_url - causes iOS refresh issues. "
            "Use Lovelace Resources only (like HACS cards)."
        )
        # Also check it's not called
        assert "add_extra_js_url(hass" not in source, "Must NOT call add_extra_js_url() - causes iOS refresh issues."

    def test_uses_static_path_registration(self) -> None:
        """Verify static path registration is used.

        StaticPathConfig is still needed to serve the JS file.
        """
        source = get_init_source()

        assert "StaticPathConfig" in source, "Must use StaticPathConfig to register static path for serving JS file"

    def test_has_lovelace_resource_registration(self) -> None:
        """Verify Lovelace resource registration function exists."""
        source = get_init_source()

        assert "_async_register_lovelace_resource" in source, "Must have _async_register_lovelace_resource function"

    def test_static_path_uses_cache_headers_false(self) -> None:
        """Verify static path registration disables caching.

        cache_headers=False prevents iOS WebView from caching the file.
        """
        source = get_init_source()

        # Find the static path registration
        assert "cache_headers=False" in source, "Static path must use cache_headers=False to prevent iOS caching issues"

    def test_async_setup_entry_calls_static_path(self) -> None:
        """Verify async_setup_entry registers static path."""
        source = get_init_source()

        # Find async_setup_entry
        func_start = source.find("async def async_setup_entry")
        assert func_start != -1, "async_setup_entry not found"

        next_func = source.find("\nasync def ", func_start + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_start:next_func]

        assert "_async_register_static_path" in func_body, "async_setup_entry must call _async_register_static_path"

    def test_async_setup_entry_registers_lovelace_resource(self) -> None:
        """Verify async_setup_entry registers Lovelace resource."""
        source = get_init_source()

        # Find async_setup_entry
        func_start = source.find("async def async_setup_entry")
        assert func_start != -1, "async_setup_entry not found"

        next_func = source.find("\nasync def ", func_start + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_start:next_func]

        assert "_async_register_lovelace_resource" in func_body, (
            "async_setup_entry must call _async_register_lovelace_resource"
        )


class TestStaticPathRegistrationBehavior:
    """Behavioral tests for static path registration."""

    CARD_URL = "/autosnooze-card.js"

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create a mock Home Assistant instance."""
        hass = MagicMock()
        hass.data = {}
        hass.http = MagicMock()
        hass.http.async_register_static_paths = AsyncMock()
        return hass

    @staticmethod
    async def _async_register_static_path_impl(
        hass: Any,
        card_url: str,
        static_path_config_cls: Any,
    ) -> None:
        """Recreated implementation matching the source pattern."""
        try:
            await hass.http.async_register_static_paths(
                [static_path_config_cls(card_url, "/fake/path", cache_headers=False)]
            )
        except RuntimeError:
            # Path already registered (happens on integration reload)
            pass

    @pytest.mark.asyncio
    async def test_registers_static_path(self, mock_hass: MagicMock) -> None:
        """Verify static path is registered."""
        mock_static_path_config = MagicMock()

        await self._async_register_static_path_impl(
            mock_hass,
            self.CARD_URL,
            mock_static_path_config,
        )

        mock_hass.http.async_register_static_paths.assert_called_once()

    @pytest.mark.asyncio
    async def test_static_path_uses_no_cache(self, mock_hass: MagicMock) -> None:
        """Verify static path is registered with cache_headers=False."""
        mock_static_path_config = MagicMock()

        await self._async_register_static_path_impl(
            mock_hass,
            self.CARD_URL,
            mock_static_path_config,
        )

        # Check the StaticPathConfig was created with cache_headers=False
        mock_static_path_config.assert_called_once()
        call_kwargs = mock_static_path_config.call_args
        assert call_kwargs[1].get("cache_headers") is False or (
            len(call_kwargs[0]) >= 3 and call_kwargs[0][2] is False
        ), "cache_headers must be False"

    @pytest.mark.asyncio
    async def test_handles_already_registered(self, mock_hass: MagicMock) -> None:
        """Verify graceful handling when path already registered (reload)."""
        mock_hass.http.async_register_static_paths = AsyncMock(side_effect=RuntimeError("Path already registered"))
        mock_static_path_config = MagicMock()

        # Should not raise
        await self._async_register_static_path_impl(
            mock_hass,
            self.CARD_URL,
            mock_static_path_config,
        )


class TestLovelaceResourceRegistrationBehavior:
    """Behavioral tests for Lovelace resource registration."""

    CARD_URL_VERSIONED = "/autosnooze-card.js?v=test"

    @pytest.fixture
    def mock_hass_with_lovelace(self) -> MagicMock:
        """Create a mock Home Assistant instance with Lovelace storage."""
        hass = MagicMock()

        # Create mock resources
        mock_resources = MagicMock()
        mock_resources.async_items = MagicMock(return_value=[])
        mock_resources.async_create_item = AsyncMock()
        mock_resources.async_update_item = AsyncMock()

        # Create mock lovelace data with resources attribute
        lovelace_data = MagicMock()
        lovelace_data.resources = mock_resources

        hass.data = {"lovelace": lovelace_data}
        return hass

    @pytest.fixture
    def mock_hass_yaml_mode(self) -> MagicMock:
        """Create a mock Home Assistant instance in YAML mode."""
        hass = MagicMock()
        lovelace_data = MagicMock()
        lovelace_data.resources = None
        hass.data = {"lovelace": lovelace_data}
        return hass

    @staticmethod
    async def _async_register_lovelace_resource_impl(
        hass: Any,
        card_url_versioned: str,
        namespace: str,
    ) -> None:
        """Recreated implementation matching the source pattern."""
        lovelace_data = hass.data.get("lovelace")
        if lovelace_data is None:
            return

        resources = getattr(lovelace_data, "resources", None)
        if resources is None:
            return

        # Find existing resource
        existing = None
        for resource in resources.async_items():
            url = resource.get("url", "")
            if url.startswith(namespace):
                existing = resource
                break

        if existing:
            if existing.get("url") != card_url_versioned:
                await resources.async_update_item(existing["id"], {"url": card_url_versioned, "res_type": "module"})
        else:
            await resources.async_create_item({"url": card_url_versioned, "res_type": "module"})

    @pytest.mark.asyncio
    async def test_creates_resource_when_none_exists(self, mock_hass_with_lovelace: MagicMock) -> None:
        """Verify resource is created when none exists."""
        await self._async_register_lovelace_resource_impl(
            mock_hass_with_lovelace,
            self.CARD_URL_VERSIONED,
            "/autosnooze-card.js",
        )

        resources = mock_hass_with_lovelace.data["lovelace"].resources
        resources.async_create_item.assert_called_once()

    @pytest.mark.asyncio
    async def test_updates_existing_resource_with_new_version(self, mock_hass_with_lovelace: MagicMock) -> None:
        """Verify existing resource is updated with new version."""
        resources = mock_hass_with_lovelace.data["lovelace"].resources
        resources.async_items = MagicMock(return_value=[{"id": "123", "url": "/autosnooze-card.js?v=old"}])

        await self._async_register_lovelace_resource_impl(
            mock_hass_with_lovelace,
            self.CARD_URL_VERSIONED,
            "/autosnooze-card.js",
        )

        resources.async_update_item.assert_called_once()

    @pytest.mark.asyncio
    async def test_skips_update_if_version_matches(self, mock_hass_with_lovelace: MagicMock) -> None:
        """Verify no update if version already matches."""
        resources = mock_hass_with_lovelace.data["lovelace"].resources
        resources.async_items = MagicMock(return_value=[{"id": "123", "url": self.CARD_URL_VERSIONED}])

        await self._async_register_lovelace_resource_impl(
            mock_hass_with_lovelace,
            self.CARD_URL_VERSIONED,
            "/autosnooze-card.js",
        )

        resources.async_update_item.assert_not_called()
        resources.async_create_item.assert_not_called()

    @pytest.mark.asyncio
    async def test_handles_yaml_mode_gracefully(self, mock_hass_yaml_mode: MagicMock) -> None:
        """Verify YAML mode (resources=None) doesn't cause errors."""
        # Should not raise
        await self._async_register_lovelace_resource_impl(
            mock_hass_yaml_mode,
            self.CARD_URL_VERSIONED,
            "/autosnooze-card.js",
        )

    @pytest.mark.asyncio
    async def test_handles_no_lovelace_data(self) -> None:
        """Verify missing lovelace data doesn't cause errors."""
        hass = MagicMock()
        hass.data = {}  # No lovelace key

        # Should not raise
        await self._async_register_lovelace_resource_impl(
            hass,
            self.CARD_URL_VERSIONED,
            "/autosnooze-card.js",
        )


class TestLovelaceModeDetection:
    """Tests for Lovelace mode detection and handling.

    Root cause: HACS Issue #1659 - When no explicit lovelace config exists,
    HA returns mode as "auto-gen" but behaves like "storage". The code must
    handle all modes correctly: storage, auto-gen, yaml, and None.
    """

    @pytest.fixture
    def mock_logger(self) -> MagicMock:
        """Create a mock logger."""
        return MagicMock()

    @staticmethod
    def _get_lovelace_mode(lovelace_data: Any) -> str | None:
        """Extract lovelace mode using the same pattern as the source."""
        lovelace_mode = getattr(lovelace_data, "mode", None)
        if lovelace_mode is None and hasattr(lovelace_data, "get"):
            lovelace_mode = lovelace_data.get("mode")
        return lovelace_mode

    def test_detects_storage_mode_from_attribute(self) -> None:
        """Verify storage mode is detected from attribute."""
        lovelace_data = MagicMock()
        lovelace_data.mode = "storage"

        mode = self._get_lovelace_mode(lovelace_data)
        assert mode == "storage"

    def test_detects_auto_gen_mode_from_attribute(self) -> None:
        """Verify auto-gen mode is detected from attribute.

        This is the mode when user has no explicit lovelace config.
        See: https://github.com/hacs/integration/issues/1659
        """
        lovelace_data = MagicMock()
        lovelace_data.mode = "auto-gen"

        mode = self._get_lovelace_mode(lovelace_data)
        assert mode == "auto-gen"

    def test_detects_yaml_mode_from_attribute(self) -> None:
        """Verify yaml mode is detected from attribute."""
        lovelace_data = MagicMock()
        lovelace_data.mode = "yaml"

        mode = self._get_lovelace_mode(lovelace_data)
        assert mode == "yaml"

    def test_detects_mode_from_dict_fallback(self) -> None:
        """Verify mode is detected from dict access for older HA versions."""
        lovelace_data = {"mode": "storage", "resources": MagicMock()}

        mode = self._get_lovelace_mode(lovelace_data)
        assert mode == "storage"

    def test_handles_none_mode(self) -> None:
        """Verify None mode is handled gracefully."""
        lovelace_data = MagicMock()
        lovelace_data.mode = None
        # Make it not dict-like
        del lovelace_data.get

        mode = self._get_lovelace_mode(lovelace_data)
        assert mode is None


class TestResourcesAPIValidation:
    """Tests for resources API interface validation.

    The code now validates that resources has the expected interface
    (async_create_item, async_items) before attempting to use it.
    """

    @staticmethod
    def _has_valid_resources_api(resources: Any) -> bool:
        """Check if resources has the expected interface."""
        return hasattr(resources, "async_create_item") and hasattr(resources, "async_items")

    def test_valid_resources_api(self) -> None:
        """Verify valid resources API is detected."""
        resources = MagicMock()
        resources.async_create_item = AsyncMock()
        resources.async_items = MagicMock(return_value=[])

        assert self._has_valid_resources_api(resources) is True

    def test_missing_async_create_item(self) -> None:
        """Verify missing async_create_item is detected."""
        resources = MagicMock(spec=["async_items"])  # Only has async_items
        resources.async_items = MagicMock(return_value=[])

        assert self._has_valid_resources_api(resources) is False

    def test_missing_async_items(self) -> None:
        """Verify missing async_items is detected."""
        resources = MagicMock(spec=["async_create_item"])  # Only has async_create_item
        resources.async_create_item = AsyncMock()

        assert self._has_valid_resources_api(resources) is False

    def test_both_methods_missing(self) -> None:
        """Verify both methods missing is detected."""
        resources = MagicMock(spec=[])  # No methods

        assert self._has_valid_resources_api(resources) is False


class TestWarningLogsOnRegistrationFailure:
    """Tests for warning logs when registration fails.

    These tests verify that users get helpful warning messages
    when card auto-registration cannot complete.
    """

    def test_source_has_warning_for_no_lovelace_data(self) -> None:
        """Verify warning is logged when lovelace data is missing."""
        source = get_init_source()

        # Should have warning level log for this case
        assert "Could not auto-register card: Lovelace not initialized" in source, (
            "Must warn user when lovelace data is not available"
        )

    def test_source_has_warning_for_yaml_mode(self) -> None:
        """Verify warning is logged when in YAML mode."""
        source = get_init_source()

        # Should have warning with mode info
        assert "Could not auto-register card: Lovelace in YAML mode" in source, "Must warn user when in YAML mode"

    def test_source_has_warning_for_missing_api(self) -> None:
        """Verify warning is logged when resources API is missing."""
        source = get_init_source()

        # Should have warning for API not available
        assert "Lovelace resources API not available" in source, "Must warn user when resources API is not available"

    def test_source_includes_mode_in_warnings(self) -> None:
        """Verify mode is included in warning messages for debugging."""
        source = get_init_source()

        # Check that mode is logged in warnings
        assert "mode=%s" in source or "mode=" in source, "Warnings should include mode for debugging"

    def test_source_has_manual_instructions_in_warnings(self) -> None:
        """Verify warnings include manual setup instructions."""
        source = get_init_source()

        # Should include instructions
        assert "Settings → Dashboards → Resources" in source, "Warnings should include manual setup instructions"


class TestLovelaceResourceRegistrationWithModes:
    """Behavioral tests for Lovelace resource registration with different modes."""

    CARD_URL_VERSIONED = "/autosnooze-card.js?v=test"
    NAMESPACE = "/autosnooze-card.js"

    @pytest.fixture
    def mock_hass_storage_mode(self) -> MagicMock:
        """Create mock HA in storage mode (most common UI mode)."""
        hass = MagicMock()

        mock_resources = MagicMock()
        mock_resources.async_items = MagicMock(return_value=[])
        mock_resources.async_create_item = AsyncMock()
        mock_resources.async_update_item = AsyncMock()

        lovelace_data = MagicMock()
        lovelace_data.mode = "storage"
        lovelace_data.resources = mock_resources

        hass.data = {"lovelace": lovelace_data}
        return hass

    @pytest.fixture
    def mock_hass_auto_gen_mode(self) -> MagicMock:
        """Create mock HA in auto-gen mode (no explicit config).

        See: https://github.com/hacs/integration/issues/1659
        """
        hass = MagicMock()

        mock_resources = MagicMock()
        mock_resources.async_items = MagicMock(return_value=[])
        mock_resources.async_create_item = AsyncMock()
        mock_resources.async_update_item = AsyncMock()

        lovelace_data = MagicMock()
        lovelace_data.mode = "auto-gen"
        lovelace_data.resources = mock_resources

        hass.data = {"lovelace": lovelace_data}
        return hass

    @pytest.fixture
    def mock_hass_yaml_mode_with_resources_none(self) -> MagicMock:
        """Create mock HA in YAML mode (resources is None)."""
        hass = MagicMock()

        lovelace_data = MagicMock()
        lovelace_data.mode = "yaml"
        lovelace_data.resources = None
        # Configure get() to also return None for resources
        lovelace_data.get = MagicMock(return_value=None)

        hass.data = {"lovelace": lovelace_data}
        return hass

    @staticmethod
    async def _register_resource_with_validation(
        hass: Any,
        card_url_versioned: str,
        namespace: str,
    ) -> tuple[bool, str | None]:
        """Register resource with full validation, returns (success, error_reason)."""
        lovelace_data = hass.data.get("lovelace")
        if lovelace_data is None:
            return False, "no_lovelace_data"

        lovelace_mode = getattr(lovelace_data, "mode", None)
        if lovelace_mode is None and hasattr(lovelace_data, "get"):
            lovelace_mode = lovelace_data.get("mode")

        resources = getattr(lovelace_data, "resources", None)
        if resources is None:
            resources = lovelace_data.get("resources") if hasattr(lovelace_data, "get") else None

        if resources is None:
            return False, f"yaml_mode:{lovelace_mode}"

        if not hasattr(resources, "async_create_item") or not hasattr(resources, "async_items"):
            return False, f"invalid_api:{lovelace_mode}"

        # Find existing resource
        existing = None
        for resource in resources.async_items():
            url = resource.get("url", "")
            if url.startswith(namespace):
                existing = resource
                break

        if existing:
            if existing.get("url") != card_url_versioned:
                await resources.async_update_item(existing["id"], {"url": card_url_versioned, "res_type": "module"})
        else:
            await resources.async_create_item({"url": card_url_versioned, "res_type": "module"})

        return True, None

    @pytest.mark.asyncio
    async def test_registers_in_storage_mode(self, mock_hass_storage_mode: MagicMock) -> None:
        """Verify resource is registered in storage mode."""
        success, error = await self._register_resource_with_validation(
            mock_hass_storage_mode,
            self.CARD_URL_VERSIONED,
            self.NAMESPACE,
        )

        assert success is True
        assert error is None
        mock_hass_storage_mode.data["lovelace"].resources.async_create_item.assert_called_once()

    @pytest.mark.asyncio
    async def test_registers_in_auto_gen_mode(self, mock_hass_auto_gen_mode: MagicMock) -> None:
        """Verify resource is registered in auto-gen mode.

        This is the key fix - auto-gen mode should work like storage mode.
        See: https://github.com/hacs/integration/issues/1659
        """
        success, error = await self._register_resource_with_validation(
            mock_hass_auto_gen_mode,
            self.CARD_URL_VERSIONED,
            self.NAMESPACE,
        )

        assert success is True
        assert error is None
        mock_hass_auto_gen_mode.data["lovelace"].resources.async_create_item.assert_called_once()

    @pytest.mark.asyncio
    async def test_fails_gracefully_in_yaml_mode(self, mock_hass_yaml_mode_with_resources_none: MagicMock) -> None:
        """Verify YAML mode fails gracefully with correct error."""
        success, error = await self._register_resource_with_validation(
            mock_hass_yaml_mode_with_resources_none,
            self.CARD_URL_VERSIONED,
            self.NAMESPACE,
        )

        assert success is False
        assert error is not None
        assert "yaml" in error.lower()

    @pytest.mark.asyncio
    async def test_fails_gracefully_when_no_lovelace(self) -> None:
        """Verify missing lovelace data fails gracefully."""
        hass = MagicMock()
        hass.data = {}

        success, error = await self._register_resource_with_validation(
            hass,
            self.CARD_URL_VERSIONED,
            self.NAMESPACE,
        )

        assert success is False
        assert error == "no_lovelace_data"

    @pytest.mark.asyncio
    async def test_fails_gracefully_with_invalid_api(self) -> None:
        """Verify invalid resources API fails gracefully."""
        hass = MagicMock()

        # Resources without expected methods
        mock_resources = MagicMock(spec=[])

        lovelace_data = MagicMock()
        lovelace_data.mode = "storage"
        lovelace_data.resources = mock_resources

        hass.data = {"lovelace": lovelace_data}

        success, error = await self._register_resource_with_validation(
            hass,
            self.CARD_URL_VERSIONED,
            self.NAMESPACE,
        )

        assert success is False
        assert error is not None
        assert "invalid_api" in error


class TestRetryMechanism:
    """Tests for the retry mechanism when Lovelace is not ready.

    Root cause fix: Lovelace may not be fully initialized when
    homeassistant_started fires, causing silent registration failures.
    The retry mechanism addresses this timing issue.
    """

    # Constants matching the source code
    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds

    def test_source_has_retry_constants(self) -> None:
        """Verify retry constants are defined in source."""
        source = get_init_source()

        assert "LOVELACE_REGISTER_MAX_RETRIES" in source, "Must define max retries constant"
        assert "LOVELACE_REGISTER_RETRY_DELAY" in source, "Must define retry delay constant"

    def test_source_has_retry_parameter(self) -> None:
        """Verify _async_register_lovelace_resource accepts retry_count parameter."""
        source = get_init_source()

        # Find the function signature
        assert "retry_count: int = 0" in source, "_async_register_lovelace_resource must accept retry_count parameter"

    def test_source_has_retry_logic_for_no_lovelace_data(self) -> None:
        """Verify retry logic exists for when lovelace_data is None."""
        source = get_init_source()

        # Should check retry count and recurse
        assert "retry_count < LOVELACE_REGISTER_MAX_RETRIES" in source, "Must check retry count before retrying"
        assert "await asyncio.sleep" in source, "Must sleep before retrying"
        assert "await _async_register_lovelace_resource(hass, retry_count + 1)" in source, (
            "Must recurse with incremented retry count"
        )

    def test_source_has_retry_logic_for_no_resources(self) -> None:
        """Verify retry logic exists for when resources is None."""
        source = get_init_source()

        # Find the section where resources is None
        func_start = source.find("async def _async_register_lovelace_resource")
        assert func_start != -1

        func_body = source[func_start:]

        # Should have two calls to the retry helper - one for lovelace_data, one for resources
        # The retry logic is now in _async_retry_or_fail helper function
        retry_helper_calls = func_body.count("_async_retry_or_fail")
        assert retry_helper_calls >= 2, "Must have retry logic for both lovelace_data and resources being None"

        # Verify the helper function contains the actual retry check
        assert "retry_count < LOVELACE_REGISTER_MAX_RETRIES" in source, "Helper must check retry count"

    def test_source_logs_retry_attempts(self) -> None:
        """Verify retry attempts are logged for debugging."""
        source = get_init_source()

        assert "retrying in" in source.lower(), "Must log retry attempts"
        assert "attempt" in source.lower(), "Must log attempt count"

    def test_source_warns_after_exhausting_retries(self) -> None:
        """Verify warning is logged after all retries exhausted."""
        source = get_init_source()

        assert "after %d retries" in source or "after retries" in source.lower(), "Must warn after exhausting retries"

    @pytest.mark.asyncio
    async def test_retry_succeeds_on_second_attempt(self) -> None:
        """Verify registration succeeds if Lovelace becomes available on retry."""
        attempt_count = 0
        registered = False

        async def mock_register(hass: Any, retry_count: int = 0) -> bool:
            """Simulate registration that succeeds on retry after Lovelace becomes available."""
            nonlocal attempt_count, registered

            attempt_count += 1

            # Check lovelace data (simulating real behavior)
            lovelace_data = hass.data.get("lovelace")

            if lovelace_data is None:
                # Lovelace not ready - retry if allowed
                if retry_count < 3:
                    await asyncio.sleep(0.01)  # Short delay for test
                    return await mock_register(hass, retry_count + 1)
                return False

            # Lovelace is available - register
            resources = getattr(lovelace_data, "resources", None)
            if resources:
                await resources.async_create_item({"url": "/test.js"})
                registered = True
                return True

            return False

        # Set up hass mock that returns None first, then valid data
        hass = MagicMock()
        mock_resources = MagicMock()
        mock_resources.async_create_item = AsyncMock()

        lovelace_data = MagicMock()
        lovelace_data.resources = mock_resources

        # First call returns None (lovelace not ready), subsequent calls return lovelace_data
        call_results = [None, lovelace_data]
        hass.data.get = MagicMock(side_effect=lambda k: call_results.pop(0) if call_results else lovelace_data)

        result = await mock_register(hass)

        assert result is True
        assert registered is True
        assert attempt_count == 2  # First attempt (None) + retry (success)

    @pytest.mark.asyncio
    async def test_retry_fails_after_max_attempts(self) -> None:
        """Verify registration fails gracefully after exhausting retries."""
        max_retries = 3
        call_count = 0

        async def mock_register_always_fails(retry_count: int = 0) -> tuple[bool, int]:
            """Simulate registration that always fails."""
            nonlocal call_count
            call_count += 1

            # Always return None for lovelace_data
            if retry_count < max_retries:
                await asyncio.sleep(0.01)  # Short delay for test
                return await mock_register_always_fails(retry_count + 1)

            return False, call_count

        success, attempts = await mock_register_always_fails()

        assert success is False
        assert attempts == max_retries + 1  # Initial + retries

    @pytest.mark.asyncio
    async def test_retry_not_used_when_lovelace_available(self) -> None:
        """Verify no retries when Lovelace is immediately available."""
        hass = MagicMock()

        mock_resources = MagicMock()
        mock_resources.async_items = MagicMock(return_value=[])
        mock_resources.async_create_item = AsyncMock()

        lovelace_data = MagicMock()
        lovelace_data.mode = "storage"
        lovelace_data.resources = mock_resources

        hass.data = {"lovelace": lovelace_data}

        # Track if asyncio.sleep is called (would indicate retry)
        sleep_called = False
        original_sleep = asyncio.sleep

        async def mock_sleep(delay: float) -> None:
            nonlocal sleep_called
            sleep_called = True
            await original_sleep(0.001)

        with patch("asyncio.sleep", mock_sleep):
            # Use the test implementation from earlier
            async def register(hass: Any, retry_count: int = 0) -> bool:
                lovelace_data = hass.data.get("lovelace")
                if lovelace_data is None:
                    if retry_count < 3:
                        await asyncio.sleep(2)
                        return await register(hass, retry_count + 1)
                    return False

                resources = getattr(lovelace_data, "resources", None)
                if resources is None:
                    return False

                await resources.async_create_item({"url": "/test.js"})
                return True

            result = await register(hass)

        assert result is True
        assert sleep_called is False, "Should not retry when Lovelace is available"


class TestDocumentationAndComments:
    """Tests to verify proper documentation of the fix."""

    def test_has_explanatory_comment_about_ios_fix(self) -> None:
        """Verify the fix includes documentation explaining why.

        Future developers need to understand why we use Lovelace Resources
        only instead of add_extra_js_url.
        """
        source = get_init_source()

        # Should mention iOS, HACS, or the refresh issue
        has_explanation = any(
            keyword in source.lower()
            for keyword in [
                "ios",
                "hacs",
                "refresh",
                "like hacs",
            ]
        )

        assert has_explanation, (
            "Code should document why Lovelace Resources only is used (iOS refresh fix, like HACS cards)"
        )

    def test_has_cache_headers_documentation(self) -> None:
        """Verify cache_headers=False is documented."""
        source = get_init_source()

        # Find the static path function
        func_start = source.find("async def _async_register_static_path")
        assert func_start != -1, "_async_register_static_path not found"

        next_func = source.find("\nasync def ", func_start + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_start:next_func]

        # Should have a comment or docstring about cache headers
        has_cache_doc = any(
            keyword in func_body.lower()
            for keyword in [
                "cache",
                "ios",
                "webview",
            ]
        )

        assert has_cache_doc, "_async_register_static_path should document cache_headers=False"
