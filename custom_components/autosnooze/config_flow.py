"""Config flow for AutoSnooze."""

from __future__ import annotations

import re
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback

from . import DOMAIN
from .const import DEFAULT_DURATION_PRESETS


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


def parse_duration_presets(presets_str: str) -> list[dict[str, str | int]] | None:
    """Parse comma-separated duration strings into a list of preset dicts.

    Returns empty list if input is empty.
    Returns None if any non-empty entry is invalid (validation error).
    """
    if not presets_str.strip():
        return []

    presets = []
    for part in presets_str.split(","):
        trimmed = part.strip()
        if not trimmed:
            continue
        parsed = parse_duration_string(trimmed)
        if parsed:
            presets.append(parsed)
        else:
            # Invalid non-empty entry - return None to signal validation error
            return None

    return presets


def format_presets(presets: list[dict[str, str | int]]) -> str:
    """Format a list of preset dicts back to a comma-separated string."""
    if not presets:
        return ""
    return ", ".join(str(preset.get("label", "")) for preset in presets)


class AutoSnoozeOptionsFlow(OptionsFlow):
    """Handle options flow for AutoSnooze."""

    def __init__(self, config_entry):
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None):
        """Handle the initial step of options flow."""
        errors: dict[str, str] = {}

        if user_input is not None:
            presets_input = user_input.get("duration_presets", "").strip()
            if presets_input:
                presets = parse_duration_presets(presets_input)
                if presets is None:
                    # Validation error - invalid entry found
                    errors["duration_presets"] = "invalid_duration_format"
                elif not presets:
                    # All entries were empty (e.g., ",,,") - treat as default
                    return self.async_create_entry(title="", data={"duration_presets": []})
                else:
                    return self.async_create_entry(title="", data={"duration_presets": presets})
            else:
                # Empty input means use defaults
                return self.async_create_entry(title="", data={"duration_presets": []})

        # Get current values
        current_presets = self.config_entry.options.get("duration_presets", [])
        default_value = format_presets(current_presets) if current_presets else format_presets(DEFAULT_DURATION_PRESETS)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional("duration_presets", default=default_value): str,
                }
            ),
            errors=errors,
        )
