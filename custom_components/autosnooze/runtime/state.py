"""Runtime state container for AutoSnooze."""

from __future__ import annotations

import asyncio
import importlib
import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from ..const import SIGNAL_STATE_CHANGED

if TYPE_CHECKING:
    from ..models import PausedAutomation, ScheduledSnooze

_LOGGER = logging.getLogger(__name__)


def _get_dispatcher_send() -> Callable[[HomeAssistant, str], None]:
    models_module = importlib.import_module("custom_components.autosnooze.models")
    dispatcher_send = getattr(models_module, "async_dispatcher_send", async_dispatcher_send)
    return dispatcher_send


@dataclass
class AutomationPauseData:
    """Runtime data for AutoSnooze."""

    paused: dict[str, PausedAutomation] = field(default_factory=dict)
    scheduled: dict[str, ScheduledSnooze] = field(default_factory=dict)
    timers: dict[str, Callable[[], None]] = field(default_factory=dict)
    scheduled_timers: dict[str, Callable[[], None]] = field(default_factory=dict)
    listeners: list[Callable[[], None]] = field(default_factory=list)
    store: Store | None = None
    hass: HomeAssistant | None = None
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    unloaded: bool = False
    startup_listener_unsub: Callable[[], None] | None = None

    def add_listener(self, callback_fn: Callable[[], None]) -> Callable[[], None]:
        self.listeners.append(callback_fn)

        def remove() -> None:
            try:
                self.listeners.remove(callback_fn)
            except ValueError:
                pass

        return remove

    def notify(self) -> None:
        if self.unloaded:
            return
        if self.hass is not None:
            _get_dispatcher_send()(self.hass, SIGNAL_STATE_CHANGED)
        for listener in list(self.listeners):
            try:
                listener()
            except Exception:
                _LOGGER.exception("Error in state change listener")

    def get_paused_dict(self) -> dict[str, dict[str, object]]:
        return {key: value.to_dict() for key, value in self.paused.items()}

    def get_scheduled_dict(self) -> dict[str, dict[str, object]]:
        return {key: value.to_dict() for key, value in self.scheduled.items()}
