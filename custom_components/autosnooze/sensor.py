"""Sensor platform for Automation Pause."""
from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.core import callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo

from . import DOMAIN, VERSION, AutomationPauseConfigEntry


async def async_setup_entry(
    hass,
    entry: AutomationPauseConfigEntry,
    async_add_entities,
) -> None:
    """Set up sensor platform."""
    async_add_entities([AutoSnoozeCountSensor(entry)])


class AutoSnoozeCountSensor(SensorEntity):
    """Sensor showing snoozed automations count."""

    _attr_has_entity_name = True
    _attr_translation_key = "snoozed_count"
    _attr_icon = "mdi:sleep"

    def __init__(self, entry: AutomationPauseConfigEntry) -> None:
        """Initialize sensor."""
        self._entry = entry
        self._attr_unique_id = f"{entry.entry_id}_snoozed_count"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name="AutoSnooze",
            entry_type=DeviceEntryType.SERVICE,
            sw_version=VERSION,
        )
        self._unsub: callable | None = None

    async def async_added_to_hass(self) -> None:
        """Register listener when added."""
        @callback
        def update() -> None:
            self.async_write_ha_state()

        self._unsub = self._entry.runtime_data.add_listener(update)

    async def async_will_remove_from_hass(self) -> None:
        """Remove listener when removed."""
        if self._unsub:
            self._unsub()
            self._unsub = None

    @property
    def native_value(self) -> int:
        """Return count of snoozed automations."""
        return len(self._entry.runtime_data.paused)

    @property
    def extra_state_attributes(self) -> dict:
        """Return snoozed automations details."""
        return {
            "paused_automations": self._entry.runtime_data.get_paused_dict(),
            "scheduled_snoozes": self._entry.runtime_data.get_scheduled_dict(),
        }
