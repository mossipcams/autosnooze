"""Tests for config_flow.py to ensure coverage."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from custom_components.autosnooze.config_flow import (
    AutoSnoozeOptionsFlow,
    parse_duration_string,
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

    def test_config_entry_stored(self, options_flow, mock_config_entry):
        """Test that config entry is stored."""
        assert options_flow._entry == mock_config_entry

    @pytest.mark.asyncio
    async def test_step_init_shows_form_on_first_call(self, options_flow):
        """Test that step_init shows form when no user input."""
        result = await options_flow.async_step_init(None)
        assert result["type"] == "form"
        assert result["step_id"] == "init"

    @pytest.mark.asyncio
    async def test_step_init_saves_valid_presets(self, options_flow):
        """Test that valid presets from individual fields are saved."""
        result = await options_flow.async_step_init(
            {
                "preset_1": "15m",
                "preset_2": "1h",
                "preset_3": "4h",
            }
        )
        assert result["type"] == "create_entry"
        assert result["data"]["duration_presets"] == [
            {"label": "15m", "minutes": 15},
            {"label": "1h", "minutes": 60},
            {"label": "4h", "minutes": 240},
        ]

    @pytest.mark.asyncio
    async def test_step_init_returns_empty_list_for_all_empty_fields(self, options_flow):
        """Test that all empty fields returns empty list (use defaults)."""
        result = await options_flow.async_step_init(
            {
                "preset_1": "",
                "preset_2": "",
                "preset_3": "",
            }
        )
        assert result["type"] == "create_entry"
        assert result["data"]["duration_presets"] == []

    @pytest.mark.asyncio
    async def test_step_init_returns_empty_list_for_whitespace_fields(self, options_flow):
        """Test that whitespace-only fields are treated as empty."""
        result = await options_flow.async_step_init(
            {
                "preset_1": "   ",
                "preset_2": "",
                "preset_3": "",
            }
        )
        assert result["type"] == "create_entry"
        assert result["data"]["duration_presets"] == []

    @pytest.mark.asyncio
    async def test_step_init_shows_error_for_invalid_preset(self, options_flow):
        """Test that invalid preset shows error on specific field."""
        result = await options_flow.async_step_init(
            {
                "preset_1": "1h",
                "preset_2": "invalid",
                "preset_3": "",
            }
        )
        assert result["type"] == "form"
        assert result["errors"]["preset_2"] == "invalid_duration_format"

    @pytest.mark.asyncio
    async def test_step_init_skips_empty_fields_in_middle(self, options_flow):
        """Test that empty fields in the middle are skipped."""
        result = await options_flow.async_step_init(
            {
                "preset_1": "30m",
                "preset_2": "",
                "preset_3": "2h",
            }
        )
        assert result["type"] == "create_entry"
        assert result["data"]["duration_presets"] == [
            {"label": "30m", "minutes": 30},
            {"label": "2h", "minutes": 120},
        ]

    @pytest.mark.asyncio
    async def test_step_init_shows_current_presets_in_form(self, mock_config_entry):
        """Test that form shows current presets in individual fields."""
        mock_config_entry.options = {
            "duration_presets": [
                {"label": "30m", "minutes": 30},
                {"label": "2h", "minutes": 120},
            ]
        }
        flow = AutoSnoozeOptionsFlow(mock_config_entry)
        result = await flow.async_step_init(None)
        assert result["type"] == "form"
        # The schema should have individual preset fields
        schema = result["data_schema"]
        assert schema is not None
