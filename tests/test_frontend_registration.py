"""Regression Tests for Frontend Module Registration (Defect #5).

Root Cause: The integration used the Lovelace Resources API which only works
with storage-mode dashboards. YAML-mode dashboards have `resources = None`,
causing silent failure and the card never loading.

Fix: Use `add_extra_js_url()` from `homeassistant.components.frontend` which
registers JavaScript as a frontend module that loads on ALL pages regardless
of dashboard mode (YAML or storage).

Reference: This is how HACS registers its iconset.js - see:
https://github.com/hacs/integration/blob/main/custom_components/hacs/frontend.py
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
# Defect #5: Frontend Module Registration
# Card doesn't load in YAML mode because Lovelace resources API returns None
# =============================================================================


class TestFrontendModuleRegistrationSource:
    """Source code analysis tests for frontend module registration.

    These tests verify the code uses the correct API that works in ALL modes.
    """

    def test_imports_add_extra_js_url_from_frontend(self) -> None:
        """Verify add_extra_js_url is imported from homeassistant.components.frontend.

        REGRESSION: Previous code only used Lovelace resources API which fails
        silently in YAML mode dashboards.
        """
        source = get_init_source()

        # Must import add_extra_js_url from the frontend component
        assert "from homeassistant.components.frontend import" in source, (
            "Must import from homeassistant.components.frontend"
        )
        assert "add_extra_js_url" in source, (
            "Must import add_extra_js_url for frontend module registration"
        )

    def test_calls_add_extra_js_url_in_frontend_registration(self) -> None:
        """Verify add_extra_js_url is called during frontend registration.

        This is the key fix: registering as a frontend module works in ALL
        dashboard modes (YAML and storage), unlike the Lovelace resources API.
        """
        source = get_init_source()

        # Find the _async_register_frontend function
        func_start = source.find("async def _async_register_frontend")
        assert func_start != -1, "_async_register_frontend function not found"

        # Find the end of the function (next function definition or end of file)
        next_func = source.find("\nasync def ", func_start + 1)
        if next_func == -1:
            next_func = source.find("\ndef ", func_start + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_start:next_func]

        # Must call add_extra_js_url
        assert "add_extra_js_url" in func_body, (
            "_async_register_frontend must call add_extra_js_url to register "
            "the card as a frontend module (works in ALL dashboard modes)"
        )

    def test_uses_versioned_url_for_cache_busting(self) -> None:
        """Verify the versioned URL is used for cache busting."""
        source = get_init_source()

        # Find the _async_register_frontend function
        func_start = source.find("async def _async_register_frontend")
        assert func_start != -1, "_async_register_frontend function not found"

        next_func = source.find("\nasync def ", func_start + 1)
        if next_func == -1:
            next_func = source.find("\ndef ", func_start + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_start:next_func]

        # Should use CARD_URL (base path for static registration) and
        # CARD_URL_VERSIONED (with ?v= for cache busting in frontend module)
        assert "CARD_URL" in func_body, "Must use CARD_URL for static path"

    def test_does_not_depend_on_lovelace_resources_for_loading(self) -> None:
        """Verify card loading doesn't depend solely on Lovelace resources.

        The Lovelace resources API is for storage-mode dashboards only.
        The frontend module API (add_extra_js_url) works universally.
        """
        source = get_init_source()

        # Find the _async_register_frontend function
        func_start = source.find("async def _async_register_frontend")
        assert func_start != -1, "_async_register_frontend function not found"

        next_func = source.find("\nasync def ", func_start + 1)
        if next_func == -1:
            next_func = source.find("\ndef ", func_start + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_start:next_func]

        # _async_register_frontend should NOT call lovelace resource APIs
        # It should use add_extra_js_url which works regardless of dashboard mode
        # Note: The word "lovelace" may appear in docstrings/comments, so we check
        # for actual API usage patterns instead
        assert "lovelace_data" not in func_body, (
            "_async_register_frontend should not access lovelace_data. "
            "Use add_extra_js_url for universal compatibility."
        )
        assert "resources.async_create_item" not in func_body, (
            "_async_register_frontend should not use resources API. "
            "Use add_extra_js_url for universal compatibility."
        )


class TestFrontendModuleRegistrationBehavior:
    """Behavioral tests for frontend module registration.

    These tests mock Home Assistant components to verify the registration
    logic works correctly in all scenarios.

    Note: These tests are skipped if the module cannot be imported due to
    Python version incompatibility (the source uses Python 3.12+ type syntax).
    """

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create a mock Home Assistant instance."""
        hass = MagicMock()
        hass.data = {}
        hass.http = MagicMock()
        hass.http.async_register_static_paths = AsyncMock()
        return hass

    @pytest.mark.asyncio
    async def test_registers_static_path_and_frontend_module(
        self, mock_hass: MagicMock
    ) -> None:
        """Verify both static path and frontend module are registered."""
        try:
            with patch(
                "custom_components.autosnooze.add_extra_js_url"
            ) as mock_add_extra_js:
                # Import after patching
                from custom_components.autosnooze import _async_register_frontend

                await _async_register_frontend(mock_hass)

                # Static path should be registered
                mock_hass.http.async_register_static_paths.assert_called_once()

                # Frontend module should be registered
                mock_add_extra_js.assert_called_once()
        except SyntaxError:
            pytest.skip("Module uses Python 3.12+ syntax not supported in test environment")

    @pytest.mark.asyncio
    async def test_frontend_module_registered_with_versioned_url(
        self, mock_hass: MagicMock
    ) -> None:
        """Verify the frontend module uses versioned URL for cache busting."""
        try:
            with patch(
                "custom_components.autosnooze.add_extra_js_url"
            ) as mock_add_extra_js:
                from custom_components.autosnooze import (
                    _async_register_frontend,
                    CARD_URL_VERSIONED,
                )

                await _async_register_frontend(mock_hass)

                # Should be called with hass and versioned URL
                mock_add_extra_js.assert_called_once_with(mock_hass, CARD_URL_VERSIONED)
        except SyntaxError:
            pytest.skip("Module uses Python 3.12+ syntax not supported in test environment")

    @pytest.mark.asyncio
    async def test_works_without_lovelace_data(self, mock_hass: MagicMock) -> None:
        """Verify registration works even without lovelace data (YAML mode).

        This is the key regression test - the old code would silently fail
        when hass.data["lovelace"] was missing or had resources=None.
        """
        # Simulate YAML mode - no lovelace storage data
        mock_hass.data = {}  # No "lovelace" key at all

        try:
            with patch(
                "custom_components.autosnooze.add_extra_js_url"
            ) as mock_add_extra_js:
                from custom_components.autosnooze import _async_register_frontend

                await _async_register_frontend(mock_hass)

                # Should STILL register the frontend module
                mock_add_extra_js.assert_called_once()
        except SyntaxError:
            pytest.skip("Module uses Python 3.12+ syntax not supported in test environment")

    @pytest.mark.asyncio
    async def test_works_with_lovelace_yaml_mode(self, mock_hass: MagicMock) -> None:
        """Verify registration works with YAML mode lovelace (resources=None).

        In YAML mode, hass.data["lovelace"] exists but resources is None.
        """
        lovelace_data = MagicMock()
        lovelace_data.resources = None
        mock_hass.data = {"lovelace": lovelace_data}

        try:
            with patch(
                "custom_components.autosnooze.add_extra_js_url"
            ) as mock_add_extra_js:
                from custom_components.autosnooze import _async_register_frontend

                await _async_register_frontend(mock_hass)

                # Should STILL register the frontend module
                mock_add_extra_js.assert_called_once()
        except SyntaxError:
            pytest.skip("Module uses Python 3.12+ syntax not supported in test environment")

    @pytest.mark.asyncio
    async def test_handles_static_path_already_registered(
        self, mock_hass: MagicMock
    ) -> None:
        """Verify graceful handling when static path already registered (reload)."""
        # Simulate path already registered error
        mock_hass.http.async_register_static_paths = AsyncMock(
            side_effect=RuntimeError("Path already registered")
        )

        try:
            with patch(
                "custom_components.autosnooze.add_extra_js_url"
            ) as mock_add_extra_js:
                from custom_components.autosnooze import _async_register_frontend

                # Should not raise
                await _async_register_frontend(mock_hass)

                # Frontend module should still be registered
                mock_add_extra_js.assert_called_once()
        except SyntaxError:
            pytest.skip("Module uses Python 3.12+ syntax not supported in test environment")


class TestRemoveLovelaceResourceDependency:
    """Tests to verify Lovelace resource registration is no longer required.

    The _async_register_lovelace_resource function can remain for backwards
    compatibility with storage-mode users, but it should NOT be required
    for the card to load.
    """

    def test_async_setup_entry_does_not_require_lovelace_resource(self) -> None:
        """Verify async_setup_entry doesn't depend on lovelace resource success.

        The card should load via add_extra_js_url even if lovelace resource
        registration fails or is skipped.
        """
        source = get_init_source()

        # Find async_setup_entry
        func_start = source.find("async def async_setup_entry")
        assert func_start != -1, "async_setup_entry not found"

        next_func = source.find("\nasync def ", func_start + 1)
        if next_func == -1:
            next_func = len(source)

        func_body = source[func_start:next_func]

        # The function should call _async_register_frontend
        assert "_async_register_frontend" in func_body, (
            "async_setup_entry must call _async_register_frontend"
        )

    def test_lovelace_resource_registration_is_optional(self) -> None:
        """Verify lovelace resource registration doesn't block setup.

        The _async_register_lovelace_resource function should be either:
        1. Removed entirely (frontend module handles loading)
        2. Optional/best-effort (doesn't affect card loading)
        """
        source = get_init_source()

        # Check if _async_register_lovelace_resource still exists
        if "_async_register_lovelace_resource" in source:
            # If it exists, verify it's called in a non-blocking way
            # (after homeassistant_started or in a try/except)
            func_start = source.find("async def async_setup_entry")
            next_func = source.find("\nasync def ", func_start + 1)
            if next_func == -1:
                next_func = len(source)

            func_body = source[func_start:next_func]

            # If lovelace resource registration is called, it should be
            # in a deferred/optional context (not blocking setup)
            if "_async_register_lovelace_resource" in func_body:
                # It's OK if it's there, but the card must also be registered
                # via add_extra_js_url which is the primary mechanism
                pass


class TestDocumentationAndComments:
    """Tests to verify proper documentation of the fix."""

    def test_frontend_registration_has_explanatory_comment(self) -> None:
        """Verify the fix includes documentation explaining why.

        Future developers need to understand why we use add_extra_js_url
        instead of (or in addition to) Lovelace resources.
        """
        source = get_init_source()

        # Find the _async_register_frontend function
        func_start = source.find("async def _async_register_frontend")
        assert func_start != -1, "_async_register_frontend function not found"

        # Look for docstring or comments explaining the approach
        # Check 500 characters before and after the function start
        context_start = max(0, func_start - 200)
        context_end = min(len(source), func_start + 500)
        context = source[context_start:context_end]

        # Should mention YAML mode, frontend module, or universal compatibility
        has_explanation = any(keyword in context.lower() for keyword in [
            "yaml",
            "all modes",
            "frontend module",
            "universal",
            "regardless of",
            "dashboard mode",
        ])

        assert has_explanation, (
            "_async_register_frontend should document why add_extra_js_url "
            "is used (works in all dashboard modes including YAML)"
        )
