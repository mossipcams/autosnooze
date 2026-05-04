"""Tests for dispatcher-based sensor update fanout."""

from __future__ import annotations

from datetime import timezone
from unittest.mock import MagicMock

import pytest

from custom_components.autosnooze.runtime.state import AutomationPauseData
from custom_components.autosnooze.sensor import AutoSnoozeCountSensor

UTC = timezone.utc


class MockConfigEntry:
    def __init__(self, runtime_data: AutomationPauseData, entry_id: str = "entry") -> None:
        self.entry_id = entry_id
        self.runtime_data = runtime_data
        self.options: dict = {}


@pytest.mark.asyncio
async def test_dispatcher_updates_once_per_notify_and_unsubscribes_on_remove(monkeypatch) -> None:
    callbacks: dict[str, list] = {}

    def fake_connect(_hass, signal: str, callback):
        callbacks.setdefault(signal, []).append(callback)

        def _remove() -> None:
            callbacks[signal].remove(callback)

        return _remove

    def fake_send(_hass, signal: str) -> None:
        for callback in list(callbacks.get(signal, [])):
            callback()

    monkeypatch.setattr("custom_components.autosnooze.sensor.async_dispatcher_connect", fake_connect)
    monkeypatch.setattr("custom_components.autosnooze.runtime.state.async_dispatcher_send", fake_send)

    data = AutomationPauseData(hass=MagicMock())
    entry = MockConfigEntry(data)
    sensor = AutoSnoozeCountSensor(entry)
    sensor.hass = data.hass
    sensor.async_write_ha_state = MagicMock()

    await sensor.async_added_to_hass()

    data.notify()
    sensor.async_write_ha_state.assert_called_once()

    data.notify()
    assert sensor.async_write_ha_state.call_count == 2

    await sensor.async_will_remove_from_hass()
    data.notify()
    assert sensor.async_write_ha_state.call_count == 2
