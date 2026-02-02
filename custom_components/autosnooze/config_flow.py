"""Config flow for AutoSnooze."""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback

from . import DOMAIN
from .const import DEFAULT_DURATION_PRESETS

# Number of individual preset fields to show (Last and Custom are added automatically)
NUM_PRESET_FIELDS = 4


class AutomationPauseConfigFlow(ConfigFlow, domain=DOMAIN):  # pyright: ignore[reportCallIssue,reportGeneralTypeIssues]
    """Handle config flow for AutoSnooze."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        """Get the options flow for this handler."""
        return AutoSnoozeOptionsFlow(config_entry)

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Handle user step."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            return self.async_create_entry(title="AutoSnooze", data={})

        return self.async_show_form(step_id="user")


def parse_duration_string(duration_str: str) -> dict[str, str | int] | None:
    """Parse a duration string like '30m', '1h', '2h30m', '1d' into a preset dict.

    Returns None if the string is invalid.
    """
    duration_str = duration_str.strip().lower()
    if not duration_str:
        return None

    # Pattern matches: 1d, 2h, 30m, 1d2h, 2h30m, 1d2h30m, etc.
    pattern = r"^(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?$"
    match = re.match(pattern, duration_str)
    if not match:
        return None

    days = int(match.group(1)) if match.group(1) else 0
    hours = int(match.group(2)) if match.group(2) else 0
    minutes = int(match.group(3)) if match.group(3) else 0

    total_minutes = days * 1440 + hours * 60 + minutes
    if total_minutes <= 0 or total_minutes > 525600:  # Max 1 year
        return None

    # Generate a clean label
    label_parts = []
    if days:
        label_parts.append(f"{days}d")
    if hours:
        label_parts.append(f"{hours}h")
    if minutes:
        label_parts.append(f"{minutes}m")

    return {"label": "".join(label_parts), "minutes": total_minutes}


class AutoSnoozeOptionsFlow(OptionsFlow):
    """Handle options flow for AutoSnooze."""

    def __init__(self, config_entry):
        """Initialize options flow."""
        self._entry = config_entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        """Handle the initial step of options flow."""
        errors: dict[str, str] = {}

        if user_input is not None:
            # Collect presets from individual fields
            presets: list[dict[str, str | int]] = []
            for i in range(1, NUM_PRESET_FIELDS + 1):
                field_key = f"preset_{i}"
                value = user_input.get(field_key, "").strip()
                if value:
                    parsed = parse_duration_string(value)
                    if parsed is None:
                        errors[field_key] = "invalid_duration_format"
                    else:
                        presets.append(parsed)

            if not errors:
                return self.async_create_entry(title="", data={"duration_presets": presets})

        # Get current values or defaults
        current_presets = self._entry.options.get("duration_presets", [])
        if not current_presets:
            current_presets = DEFAULT_DURATION_PRESETS

        # Build schema with individual fields
        schema_dict: dict[vol.Optional, Any] = {}
        for i in range(1, NUM_PRESET_FIELDS + 1):
            field_key = f"preset_{i}"
            # Get default value from current presets if available
            default_value = ""
            if i <= len(current_presets):
                default_value = str(current_presets[i - 1].get("label", ""))
            schema_dict[vol.Optional(field_key, default=default_value)] = str

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(schema_dict),
            errors=errors,
        )
