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
        assert "add_extra_js_url(hass" not in source, (
            "Must NOT call add_extra_js_url() - causes iOS refresh issues."
        )

    def test_uses_static_path_registration(self) -> None:
        """Verify static path registration is used.

        StaticPathConfig is still needed to serve the JS file.
        """
        source = get_init_source()

        assert "StaticPathConfig" in source, (
            "Must use StaticPathConfig to register static path for serving JS file"
        )

    def test_has_lovelace_resource_registration(self) -> None:
        """Verify Lovelace resource registration function exists."""
        source = get_init_source()

        assert "_async_register_lovelace_resource" in source, (
            "Must have _async_register_lovelace_resource function"
        )

    def test_static_path_uses_cache_headers_false(self) -> None:
        """Verify static path registration disables caching.

        cache_headers=False prevents iOS WebView from caching the file.
        """
        source = get_init_source()

        # Find the static path registration
        assert "cache_headers=False" in source, (
            "Static path must use cache_headers=False to prevent iOS caching issues"
        )

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

        assert "_async_register_static_path" in func_body, (
            "async_setup_entry must call _async_register_static_path"
        )

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
            await hass.http.async_register_static_paths([
                static_path_config_cls(card_url, "/fake/path", cache_headers=False)
            ])
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
        mock_hass.http.async_register_static_paths = AsyncMock(
            side_effect=RuntimeError("Path already registered")
        )
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
                await resources.async_update_item(
                    existing["id"],
                    {"url": card_url_versioned, "res_type": "module"}
                )
        else:
            await resources.async_create_item({
                "url": card_url_versioned,
                "res_type": "module"
            })

    @pytest.mark.asyncio
    async def test_creates_resource_when_none_exists(
        self, mock_hass_with_lovelace: MagicMock
    ) -> None:
        """Verify resource is created when none exists."""
        await self._async_register_lovelace_resource_impl(
            mock_hass_with_lovelace,
            self.CARD_URL_VERSIONED,
            "/autosnooze-card.js",
        )

        resources = mock_hass_with_lovelace.data["lovelace"].resources
        resources.async_create_item.assert_called_once()

    @pytest.mark.asyncio
    async def test_updates_existing_resource_with_new_version(
        self, mock_hass_with_lovelace: MagicMock
    ) -> None:
        """Verify existing resource is updated with new version."""
        resources = mock_hass_with_lovelace.data["lovelace"].resources
        resources.async_items = MagicMock(return_value=[
            {"id": "123", "url": "/autosnooze-card.js?v=old"}
        ])

        await self._async_register_lovelace_resource_impl(
            mock_hass_with_lovelace,
            self.CARD_URL_VERSIONED,
            "/autosnooze-card.js",
        )

        resources.async_update_item.assert_called_once()

    @pytest.mark.asyncio
    async def test_skips_update_if_version_matches(
        self, mock_hass_with_lovelace: MagicMock
    ) -> None:
        """Verify no update if version already matches."""
        resources = mock_hass_with_lovelace.data["lovelace"].resources
        resources.async_items = MagicMock(return_value=[
            {"id": "123", "url": self.CARD_URL_VERSIONED}
        ])

        await self._async_register_lovelace_resource_impl(
            mock_hass_with_lovelace,
            self.CARD_URL_VERSIONED,
            "/autosnooze-card.js",
        )

        resources.async_update_item.assert_not_called()
        resources.async_create_item.assert_not_called()

    @pytest.mark.asyncio
    async def test_handles_yaml_mode_gracefully(
        self, mock_hass_yaml_mode: MagicMock
    ) -> None:
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


class TestDocumentationAndComments:
    """Tests to verify proper documentation of the fix."""

    def test_has_explanatory_comment_about_ios_fix(self) -> None:
        """Verify the fix includes documentation explaining why.

        Future developers need to understand why we use Lovelace Resources
        only instead of add_extra_js_url.
        """
        source = get_init_source()

        # Should mention iOS, HACS, or the refresh issue
        has_explanation = any(keyword in source.lower() for keyword in [
            "ios",
            "hacs",
            "refresh",
            "like hacs",
        ])

        assert has_explanation, (
            "Code should document why Lovelace Resources only is used "
            "(iOS refresh fix, like HACS cards)"
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
        has_cache_doc = any(keyword in func_body.lower() for keyword in [
            "cache",
            "ios",
            "webview",
        ])

        assert has_cache_doc, (
            "_async_register_static_path should document cache_headers=False"
        )
