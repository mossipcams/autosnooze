"""Lifecycle interleaving regression tests."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.autosnooze.application.pause import async_pause_automations
from custom_components.autosnooze.application.scheduled import async_execute_scheduled_disable
from custom_components.autosnooze.models import ScheduledSnooze
from custom_components.autosnooze.runtime.state import AutomationPauseData

UTC = timezone.utc


@pytest.mark.asyncio
async def test_pause_crossing_unload_does_not_create_inert_timer() -> None:
    """A pause finishing after unload must compensate instead of committing."""
    entity_id = "automation.pause_crossing_unload"
    data = AutomationPauseData(store=MagicMock())
    hass = MagicMock()
    enabled_state = MagicMock()
    enabled_state.state = "on"
    hass.states.get.return_value = enabled_state
    disable_started = asyncio.Event()
    allow_disable_to_finish = asyncio.Event()
    state_changes: list[bool] = []

    async def set_state(_hass: MagicMock, _entity_id: str, enabled: bool) -> bool:
        state_changes.append(enabled)
        if not enabled:
            disable_started.set()
            await allow_disable_to_finish.wait()
        return True

    schedule_resume = MagicMock()
    pause_task = asyncio.create_task(
        async_pause_automations(
            hass,
            data,
            [entity_id],
            minutes=30,
            set_automation_state=set_state,
            save_data=AsyncMock(return_value=True),
            schedule_resume_callback=schedule_resume,
        )
    )

    await disable_started.wait()
    data.unloaded = True
    allow_disable_to_finish.set()
    await pause_task

    assert state_changes == [False, True]
    assert entity_id not in data.paused
    schedule_resume.assert_not_called()


@pytest.mark.asyncio
async def test_scheduled_disable_crossing_unload_does_not_create_inert_timer() -> None:
    """A scheduled disable finishing after unload must compensate."""
    entity_id = "automation.scheduled_crossing_unload"
    now = datetime.now(UTC)
    data = AutomationPauseData(store=MagicMock())
    hass = MagicMock()
    enabled_state = MagicMock()
    enabled_state.state = "on"
    hass.states.get.return_value = enabled_state
    data.scheduled[entity_id] = ScheduledSnooze(
        entity_id=entity_id,
        friendly_name=entity_id,
        disable_at=now,
        resume_at=now + timedelta(minutes=30),
    )
    disable_started = asyncio.Event()
    allow_disable_to_finish = asyncio.Event()
    state_changes: list[bool] = []

    async def set_state(_hass: MagicMock, _entity_id: str, *, enabled: bool) -> bool:
        state_changes.append(enabled)
        if not enabled:
            disable_started.set()
            await allow_disable_to_finish.wait()
        return True

    schedule_resume = MagicMock()
    with (
        pytest.MonkeyPatch.context() as monkeypatch,
    ):
        monkeypatch.setattr(
            "custom_components.autosnooze.runtime.ports.async_set_automation_state",
            set_state,
        )
        monkeypatch.setattr(
            "custom_components.autosnooze.runtime.ports.schedule_resume",
            schedule_resume,
        )
        task = asyncio.create_task(
            async_execute_scheduled_disable(
                hass,
                data,
                entity_id,
                now + timedelta(minutes=30),
            )
        )
        await disable_started.wait()
        data.unloaded = True
        allow_disable_to_finish.set()
        await task

    assert state_changes == [False, True]
    assert entity_id not in data.paused
    schedule_resume.assert_not_called()
