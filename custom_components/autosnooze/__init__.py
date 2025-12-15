"""AutoSnooze integration - Temporarily pause Home Assistant automations."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any
import logging

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import async_track_point_in_time
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)

DOMAIN = "autosnooze"
PLATFORMS = ["sensor"]
STORAGE_VERSION = 1


@dataclass
class PausedAutomation:
    """Represent a snoozed automation."""

    entity_id: str
    friendly_name: str
    resume_at: datetime
    paused_at: datetime
    days: int = 0
    hours: int = 0
    minutes: int = 0

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage/attributes."""
        return {
            "friendly_name": self.friendly_name,
            "resume_at": self.resume_at.isoformat(),
            "paused_at": self.paused_at.isoformat(),
            "days": self.days,
            "hours": self.hours,
            "minutes": self.minutes,
        }

    @classmethod
    def from_dict(cls, entity_id: str, data: dict[str, Any]) -> PausedAutomation:
        """Create from dictionary."""
        return cls(
            entity_id=entity_id,
            friendly_name=data.get("friendly_name", entity_id),
            resume_at=datetime.fromisoformat(data["resume_at"]),
            paused_at=datetime.fromisoformat(data["paused_at"]),
            days=data.get("days", 0),
            hours=data.get("hours", 0),
            minutes=data.get("minutes", 0),
        )


@dataclass
class AutomationPauseData:
    """Runtime data for AutoSnooze."""

    paused: dict[str, PausedAutomation] = field(default_factory=dict)
    timers: dict[str, Any] = field(default_factory=dict)
    listeners: list[Any] = field(default_factory=list)
    store: Store | None = None

    def add_listener(self, callback_fn: Any) -> Any:
        """Add state change listener, return removal function."""
        self.listeners.append(callback_fn)
        return lambda: self.listeners.remove(callback_fn)

    def notify(self) -> None:
        """Notify all listeners of state change."""
        for listener in self.listeners:
            listener()

    def get_paused_dict(self) -> dict[str, dict[str, Any]]:
        """Get snoozed automations as serializable dict."""
        return {k: v.to_dict() for k, v in self.paused.items()}


type AutomationPauseConfigEntry = ConfigEntry[AutomationPauseData]


# FR-05: Duration Input - days, hours, minutes parameters
PAUSE_SCHEMA = vol.Schema({
    vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
    vol.Optional("days", default=0): cv.positive_int,
    vol.Optional("hours", default=0): cv.positive_int,
    vol.Optional("minutes", default=0): cv.positive_int,
})

# FR-10: Early Wake Up
CANCEL_SCHEMA = vol.Schema({
    vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
})


async def async_setup_entry(
    hass: HomeAssistant, entry: AutomationPauseConfigEntry
) -> bool:
    """Set up AutoSnooze from a config entry."""
    store = Store[dict[str, Any]](hass, STORAGE_VERSION, f"{DOMAIN}.storage")
    data = AutomationPauseData(store=store)
    entry.runtime_data = data

    # FR-07: Persistence - Load stored data on restart
    await _async_load_stored(hass, data)

    # Register services
    _register_services(hass, data)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(
    hass: HomeAssistant, entry: AutomationPauseConfigEntry
) -> bool:
    """Unload config entry."""
    if unload_ok := await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        # Cancel all timers
        data = entry.runtime_data
        for unsub in data.timers.values():
            unsub()
        data.timers.clear()

        # Only remove services if this is the last entry
        if not hass.config_entries.async_loaded_entries(DOMAIN):
            for service in ("pause", "cancel", "cancel_all"):
                hass.services.async_remove(DOMAIN, service)

    return unload_ok


async def _async_load_stored(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Load and restore snoozed automations from storage (FR-07: Persistence)."""
    if data.store is None:
        return

    try:
        stored = await data.store.async_load()
    except Exception as err:
        _LOGGER.error("Failed to load stored data: %s", err)
        return

    if not stored or "paused" not in stored:
        return

    now = dt_util.utcnow()
    expired: list[str] = []

    for entity_id, info in stored["paused"].items():
        try:
            paused = PausedAutomation.from_dict(entity_id, info)
            if paused.resume_at <= now:
                expired.append(entity_id)
            else:
                data.paused[entity_id] = paused
                _schedule_resume(hass, data, entity_id, paused.resume_at)
                await _set_automation_state(hass, entity_id, enabled=False)
        except (KeyError, ValueError) as err:
            _LOGGER.warning("Invalid stored data for %s: %s", entity_id, err)
            expired.append(entity_id)

    # FR-06: Auto-Re-enable expired automations
    for entity_id in expired:
        await _set_automation_state(hass, entity_id, enabled=True)

    if expired:
        await _async_save(data)


async def _async_save(data: AutomationPauseData) -> None:
    """Save snoozed automations to storage."""
    if data.store is None:
        return

    try:
        await data.store.async_save({
            "paused": {k: v.to_dict() for k, v in data.paused.items()}
        })
    except Exception as err:
        _LOGGER.error("Failed to save data: %s", err)


async def _set_automation_state(
    hass: HomeAssistant, entity_id: str, *, enabled: bool
) -> bool:
    """Enable or disable an automation."""
    state = hass.states.get(entity_id)
    if state is None:
        _LOGGER.warning("Automation not found: %s", entity_id)
        return False

    try:
        await hass.services.async_call(
            "automation",
            "turn_on" if enabled else "turn_off",
            {ATTR_ENTITY_ID: entity_id},
            blocking=True,
        )
        return True
    except Exception as err:
        _LOGGER.error("Failed to %s %s: %s", "wake" if enabled else "snooze", entity_id, err)
        return False


def _get_friendly_name(hass: HomeAssistant, entity_id: str) -> str:
    """Get friendly name for entity."""
    if state := hass.states.get(entity_id):
        return state.attributes.get(ATTR_FRIENDLY_NAME, entity_id)
    return entity_id


def _cancel_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel timer for entity if exists."""
    if unsub := data.timers.pop(entity_id, None):
        unsub()


def _schedule_resume(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
) -> None:
    """Schedule automation to resume at specified time (FR-06: Auto-Re-enable)."""
    _cancel_timer(data, entity_id)

    @callback
    def on_timer(_now: datetime) -> None:
        hass.async_create_task(_async_resume(hass, data, entity_id))

    data.timers[entity_id] = async_track_point_in_time(hass, on_timer, resume_at)


async def _async_resume(
    hass: HomeAssistant, data: AutomationPauseData, entity_id: str
) -> None:
    """Wake up a snoozed automation."""
    _cancel_timer(data, entity_id)
    data.paused.pop(entity_id, None)
    await _set_automation_state(hass, entity_id, enabled=True)
    await _async_save(data)
    data.notify()
    _LOGGER.info("Woke automation: %s", entity_id)


def _register_services(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Register integration services."""

    async def handle_pause(call: ServiceCall) -> None:
        """Handle snooze service call."""
        entity_ids = call.data[ATTR_ENTITY_ID]
        days = call.data.get("days", 0)
        hours = call.data.get("hours", 0)
        minutes = call.data.get("minutes", 0)

        if days == 0 and hours == 0 and minutes == 0:
            raise ServiceValidationError(
                "Duration must be greater than zero",
                translation_domain=DOMAIN,
                translation_key="invalid_duration",
            )

        for entity_id in entity_ids:
            if not entity_id.startswith("automation."):
                raise ServiceValidationError(
                    f"{entity_id} is not an automation",
                    translation_domain=DOMAIN,
                    translation_key="not_automation",
                    translation_placeholders={"entity_id": entity_id},
                )

            if not await _set_automation_state(hass, entity_id, enabled=False):
                continue

            now = dt_util.utcnow()
            resume_at = now + timedelta(days=days, hours=hours, minutes=minutes)

            data.paused[entity_id] = PausedAutomation(
                entity_id=entity_id,
                friendly_name=_get_friendly_name(hass, entity_id),
                resume_at=resume_at,
                paused_at=now,
                days=days,
                hours=hours,
                minutes=minutes,
            )

            _schedule_resume(hass, data, entity_id, resume_at)
            _LOGGER.info("Snoozed %s until %s", entity_id, resume_at)

        await _async_save(data)
        data.notify()

    async def handle_cancel(call: ServiceCall) -> None:
        """Handle wake service call (FR-10: Early Wake Up)."""
        for entity_id in call.data[ATTR_ENTITY_ID]:
            if entity_id not in data.paused:
                _LOGGER.warning("Automation %s is not snoozed", entity_id)
                continue
            await _async_resume(hass, data, entity_id)

    async def handle_cancel_all(_call: ServiceCall) -> None:
        """Handle wake all service call."""
        for entity_id in list(data.paused.keys()):
            await _async_resume(hass, data, entity_id)

    hass.services.async_register(DOMAIN, "pause", handle_pause, schema=PAUSE_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel", handle_cancel, schema=CANCEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_all", handle_cancel_all)
