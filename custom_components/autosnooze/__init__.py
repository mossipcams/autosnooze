"""AutoSnooze integration - Temporarily pause Home Assistant automations."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
import json
from pathlib import Path
from typing import Any
import logging

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import ATTR_ENTITY_ID, ATTR_FRIENDLY_NAME
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv, entity_registry as er
from homeassistant.helpers.event import async_track_point_in_time
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.components.http import StaticPathConfig

_LOGGER = logging.getLogger(__name__)

DOMAIN = "autosnooze"
PLATFORMS = ["sensor"]
STORAGE_VERSION = 2

# Read version from manifest for cache-busting
MANIFEST_PATH = Path(__file__).parent / "manifest.json"
with open(MANIFEST_PATH, encoding="utf-8") as manifest_file:
    MANIFEST = json.load(manifest_file)
VERSION = MANIFEST.get("version", "0.0.0")

CARD_PATH = Path(__file__).parent / "www" / "autosnooze-card.js"
# Query param versioning - standard approach in HA ecosystem
CARD_URL = f"/{DOMAIN}/autosnooze-card.js"
CARD_URL_VERSIONED = f"/{DOMAIN}/autosnooze-card.js?v={VERSION}"


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
class ScheduledSnooze:
    """Represent a scheduled future snooze."""

    entity_id: str
    friendly_name: str
    disable_at: datetime
    resume_at: datetime

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage/attributes."""
        return {
            "friendly_name": self.friendly_name,
            "disable_at": self.disable_at.isoformat(),
            "resume_at": self.resume_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, entity_id: str, data: dict[str, Any]) -> ScheduledSnooze:
        """Create from dictionary."""
        return cls(
            entity_id=entity_id,
            friendly_name=data.get("friendly_name", entity_id),
            disable_at=datetime.fromisoformat(data["disable_at"]),
            resume_at=datetime.fromisoformat(data["resume_at"]),
        )


@dataclass
class AutomationPauseData:
    """Runtime data for AutoSnooze."""

    paused: dict[str, PausedAutomation] = field(default_factory=dict)
    scheduled: dict[str, ScheduledSnooze] = field(default_factory=dict)
    timers: dict[str, Any] = field(default_factory=dict)
    scheduled_timers: dict[str, Any] = field(default_factory=dict)
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

    def get_scheduled_dict(self) -> dict[str, dict[str, Any]]:
        """Get scheduled snoozes as serializable dict."""
        return {k: v.to_dict() for k, v in self.scheduled.items()}


type AutomationPauseConfigEntry = ConfigEntry[AutomationPauseData]


# FR-05: Duration Input - days, hours, minutes parameters
# Also supports date-based scheduling with disable_at/resume_at
PAUSE_SCHEMA = vol.Schema({
    vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
    # Duration-based (existing)
    vol.Optional("days", default=0): cv.positive_int,
    vol.Optional("hours", default=0): cv.positive_int,
    vol.Optional("minutes", default=0): cv.positive_int,
    # Date-based (new) - overrides duration if provided
    vol.Optional("disable_at"): cv.datetime,
    vol.Optional("resume_at"): cv.datetime,
})

# FR-10: Early Wake Up
CANCEL_SCHEMA = vol.Schema({
    vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
})

# Pause by area
PAUSE_BY_AREA_SCHEMA = vol.Schema({
    vol.Required("area_id"): vol.Any(cv.string, [cv.string]),
    vol.Optional("days", default=0): cv.positive_int,
    vol.Optional("hours", default=0): cv.positive_int,
    vol.Optional("minutes", default=0): cv.positive_int,
    vol.Optional("disable_at"): cv.datetime,
    vol.Optional("resume_at"): cv.datetime,
})

# Pause by label
PAUSE_BY_LABEL_SCHEMA = vol.Schema({
    vol.Required("label_id"): vol.Any(cv.string, [cv.string]),
    vol.Optional("days", default=0): cv.positive_int,
    vol.Optional("hours", default=0): cv.positive_int,
    vol.Optional("minutes", default=0): cv.positive_int,
    vol.Optional("disable_at"): cv.datetime,
    vol.Optional("resume_at"): cv.datetime,
})


async def async_setup_entry(
    hass: HomeAssistant, entry: AutomationPauseConfigEntry
) -> bool:
    """Set up AutoSnooze from a config entry."""
    store = Store[dict[str, Any]](hass, STORAGE_VERSION, f"{DOMAIN}.storage")
    data = AutomationPauseData(store=store)
    entry.runtime_data = data

    # Register frontend card
    await _async_register_frontend(hass)

    # FR-07: Persistence - Load stored data on restart
    await _async_load_stored(hass, data)

    # Register services
    _register_services(hass, data)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def _async_register_frontend(hass: HomeAssistant) -> None:
    """Register the frontend card."""
    # Register static path to serve the JS file (skip if already registered on reload)
    try:
        await hass.http.async_register_static_paths([
            StaticPathConfig(CARD_URL, str(CARD_PATH), cache_headers=True)
        ])
    except RuntimeError:
        # Path already registered (happens on integration reload)
        pass

    # Register as Lovelace resource
    await _async_register_lovelace_resource(hass)


async def _async_register_lovelace_resource(hass: HomeAssistant) -> None:
    """Register the card as a Lovelace resource."""
    lovelace_data = hass.data.get("lovelace")
    if lovelace_data is None:
        return

    # Use attribute access (not .get()) per HA 2026.2 deprecation warning
    resources = getattr(lovelace_data, "resources", None)
    if resources is None:
        _LOGGER.debug("Lovelace resources not available (YAML mode?)")
        return

    # Check if already registered (with or without version query param)
    existing_resource = None
    for resource in resources.async_items():
        url = resource.get("url", "")
        # Match any autosnooze card URL (base path, ignoring query params)
        if url.startswith(CARD_URL):
            existing_resource = resource
            break

    if existing_resource:
        # Update existing resource if URL changed (new version)
        if existing_resource.get("url") != CARD_URL_VERSIONED:
            try:
                await resources.async_update_item(
                    existing_resource["id"],
                    {"url": CARD_URL_VERSIONED, "res_type": "module"}
                )
                _LOGGER.info("Updated AutoSnooze card resource to v%s", VERSION)
            except Exception as err:
                _LOGGER.warning("Failed to update Lovelace resource: %s", err)
        else:
            _LOGGER.debug("AutoSnooze card already registered with current version")
        return

    # Add new resource
    try:
        await resources.async_create_item({
            "url": CARD_URL_VERSIONED,
            "res_type": "module"
        })
        _LOGGER.info("Registered AutoSnooze card as Lovelace resource (v%s)", VERSION)
    except Exception as err:
        _LOGGER.warning("Failed to register Lovelace resource: %s", err)


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

        # Cancel all scheduled timers
        for unsub in data.scheduled_timers.values():
            unsub()
        data.scheduled_timers.clear()

        # Only remove services if this is the last entry
        if not hass.config_entries.async_loaded_entries(DOMAIN):
            for service in ("pause", "cancel", "cancel_all", "pause_by_area", "pause_by_label", "cancel_scheduled"):
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

    if not stored:
        return

    now = dt_util.utcnow()
    expired: list[str] = []

    # Load paused automations
    for entity_id, info in stored.get("paused", {}).items():
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

    # Load scheduled snoozes
    expired_scheduled: list[str] = []
    for entity_id, info in stored.get("scheduled", {}).items():
        try:
            scheduled = ScheduledSnooze.from_dict(entity_id, info)
            if scheduled.disable_at <= now:
                # Should have already disabled, check if resume is also past
                if scheduled.resume_at <= now:
                    expired_scheduled.append(entity_id)
                else:
                    # Disable now and schedule resume
                    await _set_automation_state(hass, entity_id, enabled=False)
                    paused = PausedAutomation(
                        entity_id=entity_id,
                        friendly_name=scheduled.friendly_name,
                        resume_at=scheduled.resume_at,
                        paused_at=now,
                    )
                    data.paused[entity_id] = paused
                    _schedule_resume(hass, data, entity_id, scheduled.resume_at)
            else:
                data.scheduled[entity_id] = scheduled
                _schedule_disable(hass, data, entity_id, scheduled)
        except (KeyError, ValueError) as err:
            _LOGGER.warning("Invalid scheduled data for %s: %s", entity_id, err)
            expired_scheduled.append(entity_id)

    # FR-06: Auto-Re-enable expired automations
    for entity_id in expired:
        await _set_automation_state(hass, entity_id, enabled=True)

    if expired or expired_scheduled:
        await _async_save(data)


async def _async_save(data: AutomationPauseData) -> None:
    """Save snoozed automations to storage."""
    if data.store is None:
        return

    try:
        await data.store.async_save({
            "paused": {k: v.to_dict() for k, v in data.paused.items()},
            "scheduled": {k: v.to_dict() for k, v in data.scheduled.items()},
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


def _cancel_scheduled_timer(data: AutomationPauseData, entity_id: str) -> None:
    """Cancel scheduled timer for entity if exists."""
    if unsub := data.scheduled_timers.pop(entity_id, None):
        unsub()


def _schedule_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    scheduled: ScheduledSnooze,
) -> None:
    """Schedule automation to be disabled at a future time."""
    _cancel_scheduled_timer(data, entity_id)

    @callback
    def on_disable_timer(_now: datetime) -> None:
        hass.async_create_task(
            _async_execute_scheduled_disable(hass, data, entity_id, scheduled.resume_at)
        )

    data.scheduled_timers[entity_id] = async_track_point_in_time(
        hass, on_disable_timer, scheduled.disable_at
    )


async def _async_execute_scheduled_disable(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    resume_at: datetime,
) -> None:
    """Execute a scheduled disable - disable automation and schedule resume."""
    _cancel_scheduled_timer(data, entity_id)
    scheduled = data.scheduled.pop(entity_id, None)

    if not await _set_automation_state(hass, entity_id, enabled=False):
        await _async_save(data)
        data.notify()
        return

    now = dt_util.utcnow()
    friendly_name = scheduled.friendly_name if scheduled else _get_friendly_name(hass, entity_id)

    data.paused[entity_id] = PausedAutomation(
        entity_id=entity_id,
        friendly_name=friendly_name,
        resume_at=resume_at,
        paused_at=now,
    )

    _schedule_resume(hass, data, entity_id, resume_at)
    await _async_save(data)
    data.notify()
    _LOGGER.info("Executed scheduled snooze for %s until %s", entity_id, resume_at)


async def _async_cancel_scheduled(
    hass: HomeAssistant, data: AutomationPauseData, entity_id: str
) -> None:
    """Cancel a scheduled snooze."""
    _cancel_scheduled_timer(data, entity_id)
    data.scheduled.pop(entity_id, None)
    await _async_save(data)
    data.notify()
    _LOGGER.info("Cancelled scheduled snooze for: %s", entity_id)


def _get_automations_by_area(hass: HomeAssistant, area_ids: list[str]) -> list[str]:
    """Get all automation entity IDs in the specified areas."""
    entity_reg = er.async_get(hass)
    automations = []

    for entity in entity_reg.entities.values():
        if entity.domain == "automation" and entity.area_id in area_ids:
            automations.append(entity.entity_id)

    return automations


def _get_automations_by_label(hass: HomeAssistant, label_ids: list[str]) -> list[str]:
    """Get all automation entity IDs with the specified labels."""
    entity_reg = er.async_get(hass)
    automations = []

    for entity in entity_reg.entities.values():
        if entity.domain == "automation" and entity.labels:
            if any(label in label_ids for label in entity.labels):
                automations.append(entity.entity_id)

    return automations


def _register_services(hass: HomeAssistant, data: AutomationPauseData) -> None:
    """Register integration services."""

    async def _pause_automations(
        entity_ids: list[str],
        days: int = 0,
        hours: int = 0,
        minutes: int = 0,
        disable_at: datetime | None = None,
        resume_at_dt: datetime | None = None,
    ) -> None:
        """Internal helper to pause automations with duration or dates."""
        now = dt_util.utcnow()

        # Determine if using date-based or duration-based scheduling
        if resume_at_dt is not None:
            # Date-based scheduling
            resume_at = resume_at_dt
            use_scheduled = disable_at is not None and disable_at > now
        else:
            # Duration-based scheduling
            if days == 0 and hours == 0 and minutes == 0:
                raise ServiceValidationError(
                    "Duration must be greater than zero",
                    translation_domain=DOMAIN,
                    translation_key="invalid_duration",
                )
            resume_at = now + timedelta(days=days, hours=hours, minutes=minutes)
            use_scheduled = False

        for entity_id in entity_ids:
            if not entity_id.startswith("automation."):
                raise ServiceValidationError(
                    f"{entity_id} is not an automation",
                    translation_domain=DOMAIN,
                    translation_key="not_automation",
                    translation_placeholders={"entity_id": entity_id},
                )

            friendly_name = _get_friendly_name(hass, entity_id)

            if use_scheduled:
                # Schedule future disable
                scheduled = ScheduledSnooze(
                    entity_id=entity_id,
                    friendly_name=friendly_name,
                    disable_at=disable_at,
                    resume_at=resume_at,
                )
                data.scheduled[entity_id] = scheduled
                _schedule_disable(hass, data, entity_id, scheduled)
                _LOGGER.info("Scheduled snooze for %s: disable at %s, resume at %s",
                           entity_id, disable_at, resume_at)
            else:
                # Immediate disable
                if not await _set_automation_state(hass, entity_id, enabled=False):
                    continue

                data.paused[entity_id] = PausedAutomation(
                    entity_id=entity_id,
                    friendly_name=friendly_name,
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

    async def handle_pause(call: ServiceCall) -> None:
        """Handle snooze service call."""
        entity_ids = call.data[ATTR_ENTITY_ID]
        days = call.data.get("days", 0)
        hours = call.data.get("hours", 0)
        minutes = call.data.get("minutes", 0)
        disable_at = call.data.get("disable_at")
        resume_at_dt = call.data.get("resume_at")

        await _pause_automations(
            entity_ids, days, hours, minutes, disable_at, resume_at_dt
        )

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

    async def handle_pause_by_area(call: ServiceCall) -> None:
        """Handle pause by area service call."""
        area_id = call.data["area_id"]
        area_ids = [area_id] if isinstance(area_id, str) else area_id
        days = call.data.get("days", 0)
        hours = call.data.get("hours", 0)
        minutes = call.data.get("minutes", 0)
        disable_at = call.data.get("disable_at")
        resume_at_dt = call.data.get("resume_at")

        entity_ids = _get_automations_by_area(hass, area_ids)
        if not entity_ids:
            _LOGGER.warning("No automations found in area(s): %s", area_ids)
            return

        await _pause_automations(
            entity_ids, days, hours, minutes, disable_at, resume_at_dt
        )

    async def handle_pause_by_label(call: ServiceCall) -> None:
        """Handle pause by label service call."""
        label_id = call.data["label_id"]
        label_ids = [label_id] if isinstance(label_id, str) else label_id
        days = call.data.get("days", 0)
        hours = call.data.get("hours", 0)
        minutes = call.data.get("minutes", 0)
        disable_at = call.data.get("disable_at")
        resume_at_dt = call.data.get("resume_at")

        entity_ids = _get_automations_by_label(hass, label_ids)
        if not entity_ids:
            _LOGGER.warning("No automations found with label(s): %s", label_ids)
            return

        await _pause_automations(
            entity_ids, days, hours, minutes, disable_at, resume_at_dt
        )

    async def handle_cancel_scheduled(call: ServiceCall) -> None:
        """Handle cancel scheduled snooze service call."""
        for entity_id in call.data[ATTR_ENTITY_ID]:
            if entity_id not in data.scheduled:
                _LOGGER.warning("Automation %s has no scheduled snooze", entity_id)
                continue
            await _async_cancel_scheduled(hass, data, entity_id)

    hass.services.async_register(DOMAIN, "pause", handle_pause, schema=PAUSE_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel", handle_cancel, schema=CANCEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_all", handle_cancel_all)
    hass.services.async_register(DOMAIN, "pause_by_area", handle_pause_by_area, schema=PAUSE_BY_AREA_SCHEMA)
    hass.services.async_register(DOMAIN, "pause_by_label", handle_pause_by_label, schema=PAUSE_BY_LABEL_SCHEMA)
    hass.services.async_register(DOMAIN, "cancel_scheduled", handle_cancel_scheduled, schema=CANCEL_SCHEMA)
