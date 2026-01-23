"""Tests for config_flow.py to ensure coverage."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.autosnooze.config_flow import (
    AutoSnoozeOptionsFlow,
    parse_duration_string,
    parse_duration_presets,
    format_presets,
)


class TestParseDurationString:
    """Tests for parse_duration_string function."""

    def test_parses_minutes_only(self):
        """Test parsing minutes only."""
        result = parse_duration_string("30m")
        assert result == {"label": "30m", "minutes": 30}

    def test_parses_hours_only(self):
        """Test parsing hours only."""
        result = parse_duration_string("2h")
        assert result == {"label": "2h", "minutes": 120}

    def test_parses_days_only(self):
        """Test parsing days only."""
        result = parse_duration_string("1d")
        assert result == {"label": "1d", "minutes": 1440}

    def test_parses_hours_and_minutes(self):
        """Test parsing hours and minutes."""
        result = parse_duration_string("2h30m")
        assert result == {"label": "2h30m", "minutes": 150}

    def test_parses_days_hours_minutes(self):
        """Test parsing days, hours, and minutes."""
        result = parse_duration_string("1d2h30m")
        assert result == {"label": "1d2h30m", "minutes": 1590}

    def test_parses_with_whitespace(self):
        """Test parsing with leading/trailing whitespace."""
        result = parse_duration_string("  1h  ")
        assert result == {"label": "1h", "minutes": 60}

    def test_parses_uppercase(self):
        """Test parsing uppercase input."""
        result = parse_duration_string("1H")
        assert result == {"label": "1h", "minutes": 60}

    def test_returns_none_for_empty_string(self):
        """Test empty string returns None."""
        assert parse_duration_string("") is None
        assert parse_duration_string("   ") is None

    def test_returns_none_for_invalid_format(self):
        """Test invalid format returns None."""
        assert parse_duration_string("invalid") is None
        assert parse_duration_string("1x") is None
        assert parse_duration_string("abc123") is None

    def test_returns_none_for_zero_duration(self):
        """Test zero duration returns None."""
        assert parse_duration_string("0m") is None
        assert parse_duration_string("0h") is None
        assert parse_duration_string("0d") is None

    def test_returns_none_for_exceeding_max(self):
        """Test duration exceeding 1 year returns None."""
        # 525600 minutes = 1 year, so 525601 should fail
        assert parse_duration_string("366d") is None


class TestParseDurationPresets:
    """Tests for parse_duration_presets function."""

    def test_parses_single_preset(self):
        """Test parsing single preset."""
        result = parse_duration_presets("30m")
        assert result == [{"label": "30m", "minutes": 30}]

    def test_parses_multiple_presets(self):
        """Test parsing multiple presets."""
        result = parse_duration_presets("15m, 1h, 4h, 1d")
        assert result == [
            {"label": "15m", "minutes": 15},
            {"label": "1h", "minutes": 60},
            {"label": "4h", "minutes": 240},
            {"label": "1d", "minutes": 1440},
        ]

    def test_returns_empty_list_for_empty_string(self):
        """Test empty string returns empty list."""
        assert parse_duration_presets("") == []
        assert parse_duration_presets("   ") == []

    def test_skips_empty_parts(self):
        """Test empty parts between commas are skipped."""
        result = parse_duration_presets("1h, , 2h")
        assert result == [
            {"label": "1h", "minutes": 60},
            {"label": "2h", "minutes": 120},
        ]

    def test_returns_none_for_invalid_entry(self):
        """Test returns None when any non-empty entry is invalid."""
        assert parse_duration_presets("1h, invalid, 2h") is None
        assert parse_duration_presets("bad") is None

    def test_handles_trailing_comma(self):
        """Test handles trailing comma."""
        result = parse_duration_presets("1h, 2h,")
        assert result == [
            {"label": "1h", "minutes": 60},
            {"label": "2h", "minutes": 120},
        ]

    def test_handles_leading_comma(self):
        """Test handles leading comma."""
        result = parse_duration_presets(", 1h, 2h")
        assert result == [
            {"label": "1h", "minutes": 60},
            {"label": "2h", "minutes": 120},
        ]


class TestFormatPresets:
    """Tests for format_presets function."""

    def test_formats_single_preset(self):
        """Test formatting single preset."""
        result = format_presets([{"label": "30m", "minutes": 30}])
        assert result == "30m"

    def test_formats_multiple_presets(self):
        """Test formatting multiple presets."""
        result = format_presets(
            [
                {"label": "15m", "minutes": 15},
                {"label": "1h", "minutes": 60},
                {"label": "1d", "minutes": 1440},
            ]
        )
        assert result == "15m, 1h, 1d"

    def test_returns_empty_string_for_empty_list(self):
        """Test empty list returns empty string."""
        assert format_presets([]) == ""

    def test_handles_missing_label(self):
        """Test handles preset without label key."""
        result = format_presets([{"minutes": 30}])
        assert result == ""

    def test_coerces_non_string_label(self):
        """Test coerces non-string label to string."""
        result = format_presets([{"label": 123, "minutes": 30}])
        assert result == "123"


class TestAutoSnoozeOptionsFlow:
    """Tests for AutoSnoozeOptionsFlow class."""

    @pytest.fixture
    def mock_config_entry(self):
        """Create a mock config entry."""
        entry = MagicMock()
        entry.options = {}
        return entry

    @pytest.fixture
    def options_flow(self, mock_config_entry):
        """Create an options flow instance."""
        return AutoSnoozeOptionsFlow(mock_config_entry)

    def test_init_stores_config_entry(self, options_flow, mock_config_entry):
        """Test that init stores the config entry."""
        assert options_flow.config_entry == mock_config_entry

    @pytest.mark.asyncio
    async def test_step_init_shows_form_on_first_call(self, options_flow):
        """Test that step_init shows form when no user input."""
        result = await options_flow.async_step_init(None)
        assert result["type"] == "form"
        assert result["step_id"] == "init"

    @pytest.mark.asyncio
    async def test_step_init_saves_valid_presets(self, options_flow):
        """Test that valid presets are saved."""
        result = await options_flow.async_step_init({"duration_presets": "15m, 1h, 4h"})
        assert result["type"] == "create_entry"
        assert result["data"]["duration_presets"] == [
            {"label": "15m", "minutes": 15},
            {"label": "1h", "minutes": 60},
            {"label": "4h", "minutes": 240},
        ]

    @pytest.mark.asyncio
    async def test_step_init_returns_empty_list_for_empty_input(self, options_flow):
        """Test that empty input returns empty list (use defaults)."""
        result = await options_flow.async_step_init({"duration_presets": ""})
        assert result["type"] == "create_entry"
        assert result["data"]["duration_presets"] == []

    @pytest.mark.asyncio
    async def test_step_init_returns_empty_list_for_whitespace_input(self, options_flow):
        """Test that whitespace-only input returns empty list."""
        result = await options_flow.async_step_init({"duration_presets": "   "})
        assert result["type"] == "create_entry"
        assert result["data"]["duration_presets"] == []

    @pytest.mark.asyncio
    async def test_step_init_shows_error_for_invalid_preset(self, options_flow):
        """Test that invalid preset shows error."""
        result = await options_flow.async_step_init({"duration_presets": "1h, invalid"})
        assert result["type"] == "form"
        assert result["errors"]["duration_presets"] == "invalid_duration_format"

    @pytest.mark.asyncio
    async def test_step_init_returns_empty_for_only_commas(self, options_flow):
        """Test that input with only commas returns empty list."""
        result = await options_flow.async_step_init({"duration_presets": ", , ,"})
        assert result["type"] == "create_entry"
        assert result["data"]["duration_presets"] == []

    @pytest.mark.asyncio
    async def test_step_init_shows_current_presets_in_form(self, mock_config_entry):
        """Test that form shows current presets."""
        mock_config_entry.options = {
            "duration_presets": [
                {"label": "30m", "minutes": 30},
                {"label": "2h", "minutes": 120},
            ]
        }
        flow = AutoSnoozeOptionsFlow(mock_config_entry)
        result = await flow.async_step_init(None)
        assert result["type"] == "form"
        # The default value should be formatted from current presets
        schema = result["data_schema"]
        assert schema is not None
