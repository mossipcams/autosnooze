"""Runtime state container for AutoSnooze."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import datetime
from typing import TYPE_CHECKING, Any, Literal, Protocol, TypeAlias

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from ..const import SIGNAL_STATE_CHANGED

if TYPE_CHECKING:
    from ..models import PausedAutomation, ScheduledSnooze

ResumeReason = Literal["manual", "expired"]
_LOGGER = logging.getLogger(__name__)
StartedNotificationCallback = Callable[[HomeAssistant, list["PausedAutomation"]], Awaitable[None]]


class EntryResumeCallback(Protocol):
    def __call__(
        self,
        hass: HomeAssistant,
        data: "AutomationPauseData",
        entity_id: str,
        *,
        reason: ResumeReason = "manual",
    ) -> Awaitable[None]: ...


class EntryDeadlineResumeCallback(Protocol):
    def __call__(
        self,
        hass: HomeAssistant,
        data: "AutomationPauseData",
        entity_ids: list[str],
        *,
        reason: ResumeReason = "expired",
    ) -> Awaitable[None]: ...


class EntryScheduledDisableCallback(Protocol):
    def __call__(
        self,
        hass: HomeAssistant,
        data: "AutomationPauseData",
        entity_id: str,
        resume_at: datetime,
    ) -> Awaitable[None]: ...


class EntryNotificationCallback(Protocol):
    def __call__(
        self,
        hass: HomeAssistant,
        data: "AutomationPauseData",
        entity_id: str,
    ) -> Awaitable[None]: ...


@dataclass
class AutomationPauseData:
    """Runtime data for AutoSnooze."""

    paused: dict[str, PausedAutomation] = field(default_factory=dict)
    scheduled: dict[str, ScheduledSnooze] = field(default_factory=dict)
    timers: dict[str, Callable[[], None]] = field(default_factory=dict)
    scheduled_timers: dict[str, Callable[[], None]] = field(default_factory=dict)
    notification_timers: dict[str, Callable[[], None]] = field(default_factory=dict)
    resume_deadline_entities: dict[datetime, set[str]] = field(default_factory=dict)
    resume_deadline_timers: dict[datetime, Callable[[], None]] = field(default_factory=dict)
    entity_resume_deadlines: dict[str, datetime] = field(default_factory=dict)
    snapshot_version: int = 0
    _last_published_snapshot_version: int = -1
    listeners: list[Callable[[], None]] = field(default_factory=list)
    store: Store | None = None
    hass: HomeAssistant | None = None
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    unloaded: bool = False
    lifecycle_generation: int = 0
    entity_generations: dict[str, int] = field(default_factory=dict)
    in_flight_commands: int = 0
    startup_listener_unsub: Callable[[], None] | None = None
    resume_callback: EntryResumeCallback | None = None
    deadline_resume_callback: EntryDeadlineResumeCallback | None = None
    scheduled_disable_callback: EntryScheduledDisableCallback | None = None
    notification_callback: EntryNotificationCallback | None = None
    started_notification_callback: StartedNotificationCallback | None = None
    _in_flight_done: asyncio.Event = field(default_factory=asyncio.Event)
    _pending_persistence_snapshot: Any = None
    _save_in_flight: bool = False
    _pending_followup_save: bool = False

    def __post_init__(self) -> None:
        self._in_flight_done.set()

    def begin_command(self) -> None:
        """Track an in-flight application command for unload coordination."""
        if self.in_flight_commands == 0:
            self._in_flight_done.clear()
        self.in_flight_commands += 1

    def end_command(self) -> None:
        """Release in-flight tracking after a command completes."""
        self.in_flight_commands = max(0, self.in_flight_commands - 1)
        if self.in_flight_commands == 0:
            self._in_flight_done.set()

    async def wait_for_in_flight_commands(self) -> None:
        """Wait until active commands finish after unload invalidation."""
        if self.in_flight_commands == 0:
            return
        await self._in_flight_done.wait()

    def bump_lifecycle(self) -> int:
        """Invalidate in-flight operations during unload."""
        self.lifecycle_generation += 1
        return self.lifecycle_generation

    def entity_generation(self, entity_id: str) -> int:
        """Return the current transition generation for one entity."""
        return self.entity_generations.get(entity_id, 0)

    def bump_entity_generation(self, entity_id: str) -> int:
        """Advance the transition generation for one entity."""
        generation = self.entity_generations.get(entity_id, 0) + 1
        self.entity_generations[entity_id] = generation
        return generation

    def is_entity_generation_current(self, entity_id: str, expected_generation: int) -> bool:
        """Return whether an entity generation token is still current."""
        return self.entity_generations.get(entity_id, 0) == expected_generation

    def add_listener(self, callback_fn: Callable[[], None]) -> Callable[[], None]:
        self.listeners.append(callback_fn)

        def remove() -> None:
            try:
                self.listeners.remove(callback_fn)
            except ValueError:
                pass

        return remove

    def bump_snapshot_version(self) -> int:
        """Advance the published runtime snapshot version."""
        self.snapshot_version += 1
        return self.snapshot_version

    def notify(self, *, force: bool = False) -> None:
        if self.unloaded:
            return
        if not force and self.snapshot_version == self._last_published_snapshot_version:
            return
        self._last_published_snapshot_version = self.snapshot_version
        if self.hass is not None:
            async_dispatcher_send(self.hass, SIGNAL_STATE_CHANGED)
        for listener in list(self.listeners):
            try:
                listener()
            except Exception:
                _LOGGER.exception("Error in state change listener")

    def get_paused_dict(self) -> dict[str, dict[str, object]]:
        return {key: value.to_dict() for key, value in self.paused.items()}

    def get_scheduled_dict(self) -> dict[str, dict[str, object]]:
        return {key: value.to_dict() for key, value in self.scheduled.items()}


AutomationPauseConfigEntry: TypeAlias = ConfigEntry[AutomationPauseData]
