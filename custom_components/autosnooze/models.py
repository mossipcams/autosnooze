"""Data models for AutoSnooze integration."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, TypeAlias

from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util


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

    Args:
        dt: A datetime object or None

    Returns:
        UTC-aware datetime object, or None if input was None
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


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


AutomationPauseConfigEntry: TypeAlias = ConfigEntry[AutomationPauseData]
