"""Data models for AutoSnooze integration."""

from __future__ import annotations

import asyncio
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
import logging
from typing import Any, TypeAlias

from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)


def parse_datetime_utc(dt_str: str) -> datetime:
    """Parse a datetime string and ensure it is UTC-aware.

    Uses Home Assistant's dt_util.parse_datetime for robust parsing,
    then ensures the result is timezone-aware (UTC) to prevent
    comparison errors with dt_util.utcnow().

    Args:
        dt_str: ISO format datetime string

    Returns:
        UTC-aware datetime object

    Raises:
        ValueError: If the string cannot be parsed as a datetime
    """
    parsed = dt_util.parse_datetime(dt_str)
    if parsed is None:
        raise ValueError(f"Invalid datetime string: {dt_str}")
    # If naive (no timezone info), assume UTC since we store datetimes in UTC
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def ensure_utc_aware(dt: datetime | None) -> datetime | None:
    """Ensure a datetime object is UTC-aware.

    Handles datetime objects that may come from service calls via cv.datetime,
    which can return offset-naive datetimes when the input lacks timezone info.

    DEF-013 FIX: Naive datetimes from user input are assumed to be in local
    timezone (not UTC), then converted to UTC for consistent storage.

    Args:
        dt: A datetime object or None

    Returns:
        UTC-aware datetime object, or None if input was None
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        # DEF-013 FIX: Assume naive datetimes are in local timezone, not UTC
        # This matches user expectations when entering times without timezone
        local_tz = dt_util.get_default_time_zone()
        dt = dt.replace(tzinfo=local_tz)
        # Convert to UTC for consistent internal handling
        return dt.astimezone(timezone.utc)
    # Already timezone-aware, convert to UTC
    return dt.astimezone(timezone.utc)


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
    disable_at: datetime | None = None  # Set when snooze originated from schedule mode
    resume_retries: int = 0

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for storage/attributes."""
        result = {
            "friendly_name": self.friendly_name,
            "resume_at": self.resume_at.isoformat(),
            "paused_at": self.paused_at.isoformat(),
            "days": self.days,
            "hours": self.hours,
            "minutes": self.minutes,
        }
        if self.disable_at is not None:
            result["disable_at"] = self.disable_at.isoformat()
        return result

    @classmethod
    def from_dict(cls, entity_id: str, data: dict[str, Any]) -> PausedAutomation:
        """Create from dictionary."""
        disable_at = None
        if "disable_at" in data:
            disable_at = parse_datetime_utc(data["disable_at"])
        return cls(
            entity_id=entity_id,
            friendly_name=data.get("friendly_name", entity_id),
            resume_at=parse_datetime_utc(data["resume_at"]),
            paused_at=parse_datetime_utc(data["paused_at"]),
            days=data.get("days", 0),
            hours=data.get("hours", 0),
            minutes=data.get("minutes", 0),
            disable_at=disable_at,
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
            disable_at=parse_datetime_utc(data["disable_at"]),
            resume_at=parse_datetime_utc(data["resume_at"]),
        )


@dataclass
class AutomationPauseData:
    """Runtime data for AutoSnooze."""

    paused: dict[str, PausedAutomation] = field(default_factory=dict)
    scheduled: dict[str, ScheduledSnooze] = field(default_factory=dict)
    timers: dict[str, Callable[[], None]] = field(default_factory=dict)
    scheduled_timers: dict[str, Callable[[], None]] = field(default_factory=dict)
    listeners: list[Callable[[], None]] = field(default_factory=list)
    store: Store | None = None
    # Lock to prevent concurrent state modifications (race conditions)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    # Flag to track if integration is unloaded (prevents post-unload operations)
    unloaded: bool = False
    # Unsub function for homeassistant_started listener (to cancel on early unload)
    startup_listener_unsub: Callable[[], None] | None = None

    def add_listener(self, callback_fn: Callable[[], None]) -> Callable[[], None]:
        """Add state change listener, return removal function.

        The removal function is safe to call multiple times.
        """
        self.listeners.append(callback_fn)

        def remove() -> None:
            try:
                self.listeners.remove(callback_fn)
            except ValueError:
                # Already removed - this is safe to ignore
                pass

        return remove

    def notify(self) -> None:
        """Notify all listeners of state change.

        Uses a copy of the listeners list to prevent RuntimeError
        if a listener modifies the list during iteration.
        """
        if self.unloaded:
            return
        for listener in list(self.listeners):
            try:
                listener()
            except Exception:
                _LOGGER.exception("Error in state change listener")

    def get_paused_dict(self) -> dict[str, dict[str, Any]]:
        """Get snoozed automations as serializable dict."""
        return {k: v.to_dict() for k, v in self.paused.items()}

    def get_scheduled_dict(self) -> dict[str, dict[str, Any]]:
        """Get scheduled snoozes as serializable dict."""
        return {k: v.to_dict() for k, v in self.scheduled.items()}


AutomationPauseConfigEntry: TypeAlias = ConfigEntry[AutomationPauseData]
