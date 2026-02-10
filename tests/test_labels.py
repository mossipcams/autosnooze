"""Tests for automatic label creation."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from custom_components.autosnooze import _async_ensure_labels_exist
from custom_components.autosnooze.const import (
    LABEL_CONFIRM_CONFIG,
    LABEL_EXCLUDE_CONFIG,
    LABEL_INCLUDE_CONFIG,
    LABEL_PROTECTED_CONFIG,
)


class TestAsyncEnsureLabelsExist:
    """Tests for _async_ensure_labels_exist function."""

    @pytest.fixture
    def mock_label_registry(self) -> MagicMock:
        """Create mock label registry."""
        registry = MagicMock()
        registry.async_create = MagicMock()
        return registry

    @pytest.fixture
    def mock_hass(self) -> MagicMock:
        """Create mock hass."""
        return MagicMock()

    @pytest.mark.asyncio
    async def test_creates_both_labels_when_none_exist(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test creates both include and exclude labels when none exist."""
        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

        assert mock_label_registry.async_create.call_count == 4

    @pytest.mark.asyncio
    async def test_handles_value_error_when_label_exists(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test handles ValueError when label already exists."""
        mock_label_registry.async_create.side_effect = ValueError("Label already exists")

        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            # Should not raise
            await _async_ensure_labels_exist(mock_hass)

    @pytest.mark.asyncio
    async def test_handles_generic_exception_gracefully(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test handles generic exceptions without failing."""
        mock_label_registry.async_create.side_effect = Exception("Unexpected error")

        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            # Should not raise
            await _async_ensure_labels_exist(mock_hass)

    @pytest.mark.asyncio
    async def test_creates_include_label_with_correct_properties(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test include label is created with correct name, color, icon, description."""
        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

        calls = mock_label_registry.async_create.call_args_list

        # Find the include label call
        include_call = None
        for call in calls:
            if call.kwargs.get("name") == LABEL_INCLUDE_CONFIG["name"]:
                include_call = call
                break

        assert include_call is not None
        assert include_call.kwargs["color"] == LABEL_INCLUDE_CONFIG["color"]
        assert include_call.kwargs["icon"] == LABEL_INCLUDE_CONFIG["icon"]
        assert include_call.kwargs["description"] == LABEL_INCLUDE_CONFIG["description"]

    @pytest.mark.asyncio
    async def test_creates_exclude_label_with_correct_properties(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test exclude label is created with correct name, color, icon, description."""
        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

        calls = mock_label_registry.async_create.call_args_list

        # Find the exclude label call
        exclude_call = None
        for call in calls:
            if call.kwargs.get("name") == LABEL_EXCLUDE_CONFIG["name"]:
                exclude_call = call
                break

        assert exclude_call is not None
        assert exclude_call.kwargs["color"] == LABEL_EXCLUDE_CONFIG["color"]
        assert exclude_call.kwargs["icon"] == LABEL_EXCLUDE_CONFIG["icon"]
        assert exclude_call.kwargs["description"] == LABEL_EXCLUDE_CONFIG["description"]

    @pytest.mark.asyncio
    async def test_continues_after_first_label_fails(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test continues creating remaining labels even if one fails."""
        # First call raises ValueError, remaining calls succeed
        call_counter = {"count": 0}

        def _side_effect(*_args, **_kwargs):
            call_counter["count"] += 1
            if call_counter["count"] == 1:
                raise ValueError("Label already exists")
            return None

        mock_label_registry.async_create.side_effect = _side_effect

        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

        # Should have attempted all labels
        assert mock_label_registry.async_create.call_count == 4

    @pytest.mark.asyncio
    async def test_logs_info_when_creating_label(self, mock_hass: MagicMock, mock_label_registry: MagicMock) -> None:
        """Test logs info message when creating a label."""
        with (
            patch(
                "custom_components.autosnooze.lr.async_get",
                return_value=mock_label_registry,
            ),
            patch("custom_components.autosnooze._LOGGER") as mock_logger,
        ):
            await _async_ensure_labels_exist(mock_hass)

        # Should log info for each created label
        assert mock_logger.info.call_count == 4

    @pytest.mark.asyncio
    async def test_logs_debug_when_label_exists(self, mock_hass: MagicMock, mock_label_registry: MagicMock) -> None:
        """Test logs debug message when label already exists (ValueError)."""
        mock_label_registry.async_create.side_effect = ValueError("Label already exists")

        with (
            patch(
                "custom_components.autosnooze.lr.async_get",
                return_value=mock_label_registry,
            ),
            patch("custom_components.autosnooze._LOGGER") as mock_logger,
        ):
            await _async_ensure_labels_exist(mock_hass)

        # Should log debug for each existing label
        assert mock_logger.debug.call_count == 4

    @pytest.mark.asyncio
    async def test_logs_warning_on_exception(self, mock_hass: MagicMock, mock_label_registry: MagicMock) -> None:
        """Test logs warning when an exception occurs."""
        mock_label_registry.async_create.side_effect = Exception("Test error")

        with (
            patch(
                "custom_components.autosnooze.lr.async_get",
                return_value=mock_label_registry,
            ),
            patch("custom_components.autosnooze._LOGGER") as mock_logger,
        ):
            await _async_ensure_labels_exist(mock_hass)

        # Should log warning for each failed label
        assert mock_logger.warning.call_count == 4

    @pytest.mark.asyncio
    async def test_creates_protected_and_confirm_labels(
        self, mock_hass: MagicMock, mock_label_registry: MagicMock
    ) -> None:
        """Test guardrail labels are created."""
        with patch(
            "custom_components.autosnooze.lr.async_get",
            return_value=mock_label_registry,
        ):
            await _async_ensure_labels_exist(mock_hass)

        calls = mock_label_registry.async_create.call_args_list
        created_names = {call.kwargs.get("name") for call in calls}
        assert LABEL_PROTECTED_CONFIG["name"] in created_names
        assert LABEL_CONFIRM_CONFIG["name"] in created_names
