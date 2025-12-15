"""Config flow for AutoSnooze."""
from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from . import DOMAIN


class AutomationPauseConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle config flow for AutoSnooze."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle user step."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            return self.async_create_entry(title="AutoSnooze", data={})

        return self.async_show_form(step_id="user")
