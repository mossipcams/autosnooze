"""Count-based transition performance characterization."""

from __future__ import annotations

import asyncio
import logging
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze.application.batching import BATCH_CONCURRENCY
from custom_components.autosnooze.application.pause import async_pause_automations
from custom_components.autosnooze.application.resume import async_resume_batch
from custom_components.autosnooze.models import PausedAutomation
from custom_components.autosnooze.runtime.state import AutomationPauseData
from datetime import datetime, timedelta, timezone

UTC = timezone.utc


@pytest.mark.asyncio
@pytest.mark.parametrize("entity_count", [1, 10, 50, 100])
async def test_batch_baseline_records_calls_saves_publications_and_timers(
    entity_count: int,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Batch characterization records key operation counts without thresholds."""
    caplog.set_level(logging.INFO, logger="custom_components.autosnooze.logging_utils")
    data = AutomationPauseData(store=MagicMock())
    data.notify = MagicMock()
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={})
    entity_ids = [f"automation.baseline_{index}" for index in range(entity_count)]
    set_state = AsyncMock(return_value=True)
    save_data = AsyncMock(return_value=True)
    schedule_resume = MagicMock()

    await async_pause_automations(
        hass,
        data,
        entity_ids,
        minutes=30,
        set_automation_state=set_state,
        save_data=save_data,
        schedule_resume_callback=schedule_resume,
    )

    record = next(record for record in caplog.records if getattr(record, "command", None) == "pause")
    assert record.entity_count == entity_count
    assert record.ha_call_count == entity_count
    assert record.save_count == 1
    assert record.publication_count == 1
    assert record.timer_count == entity_count
    assert record.max_lock_hold_ms >= 0


@pytest.mark.asyncio
async def test_fifty_entity_batch_saves_and_publishes_once(caplog: pytest.LogCaptureFixture) -> None:
    """A 50-entity successful pause performs one durable commit and one publication."""
    caplog.set_level(logging.INFO, logger="custom_components.autosnooze.logging_utils")
    data = AutomationPauseData(store=MagicMock())
    data.notify = MagicMock()
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={})
    entity_ids = [f"automation.fifty_{index}" for index in range(50)]
    save_data = AsyncMock(return_value=True)

    with (
        pytest.MonkeyPatch.context() as monkeypatch,
    ):
        monkeypatch.setattr(
            "custom_components.autosnooze.runtime.ports.is_automation_enabled",
            lambda _hass, _entity_id: True,
        )
        monkeypatch.setattr(
            "custom_components.autosnooze.runtime.ports.get_friendly_name",
            lambda _hass, entity_id: entity_id,
        )
        await async_pause_automations(
            hass,
            data,
            entity_ids,
            minutes=30,
            set_automation_state=AsyncMock(return_value=True),
            save_data=save_data,
            schedule_resume_callback=MagicMock(),
        )

    record = next(record for record in caplog.records if getattr(record, "command", None) == "pause")
    assert record.entity_count == 50
    assert record.save_count == 1
    assert record.publication_count == 1
    save_data.assert_awaited_once()


@pytest.mark.asyncio
async def test_batch_latency_is_bounded_by_concurrency_not_entity_count() -> None:
    """Blocked-call waves scale with concurrency, not entity count."""
    entity_count = BATCH_CONCURRENCY * 2
    data = AutomationPauseData(store=MagicMock())
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={})
    entity_ids = [f"automation.latency_{index}" for index in range(entity_count)]

    active = 0
    waves = 0
    release = asyncio.Event()
    wave_started = asyncio.Event()

    async def set_state(_hass, _entity_id, enabled):
        del enabled
        nonlocal active, waves
        active += 1
        if active == 1:
            waves += 1
            wave_started.set()
        await release.wait()
        active -= 1
        if active == 0:
            release.clear()
            wave_started.set()
        return True

    with (
        pytest.MonkeyPatch.context() as monkeypatch,
    ):
        monkeypatch.setattr(
            "custom_components.autosnooze.runtime.ports.is_automation_enabled",
            lambda _hass, _entity_id: True,
        )
        monkeypatch.setattr(
            "custom_components.autosnooze.runtime.ports.get_friendly_name",
            lambda _hass, entity_id: entity_id,
        )
        task = asyncio.create_task(
            async_pause_automations(
                hass,
                data,
                entity_ids,
                minutes=30,
                set_automation_state=set_state,
                save_data=AsyncMock(return_value=True),
                schedule_resume_callback=MagicMock(),
            )
        )

        await wave_started.wait()
        wave_started.clear()
        release.set()
        await wave_started.wait()
        wave_started.clear()
        release.set()
        await task

    assert waves == 2

    resume_data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    for entity_id in entity_ids:
        resume_data.paused[entity_id] = PausedAutomation(entity_id, entity_id, now + timedelta(hours=1), now)

    active = 0
    resume_waves = 0
    release = asyncio.Event()
    wave_started = asyncio.Event()

    async def resume_state(_hass, _entity_id, *, enabled):
        del enabled
        nonlocal active, resume_waves
        active += 1
        if active == 1:
            resume_waves += 1
            wave_started.set()
        await release.wait()
        active -= 1
        if active == 0:
            release.clear()
            wave_started.set()
        return True

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=resume_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
    ):
        task = asyncio.create_task(async_resume_batch(hass, resume_data, entity_ids))
        await wave_started.wait()
        wave_started.clear()
        release.set()
        await wave_started.wait()
        wave_started.clear()
        release.set()
        await task

    assert resume_waves == 2


@pytest.mark.asyncio
async def test_same_deadline_expiry_saves_and_notifies_once(caplog: pytest.LogCaptureFixture) -> None:
    """N due entities sharing a deadline produce one save and one publication."""
    from custom_components.autosnooze.application.runtime_wiring import wire_runtime_callbacks
    from custom_components.autosnooze.runtime.timers import schedule_resume

    caplog.set_level(logging.INFO, logger="custom_components.autosnooze.logging_utils")
    data = AutomationPauseData(store=MagicMock())
    data.notify = MagicMock()
    wire_runtime_callbacks(data)
    hass = MagicMock()
    now = datetime.now(UTC)
    resume_at = now + timedelta(minutes=5)
    entity_ids = [f"automation.deadline_{index}" for index in range(5)]
    for entity_id in entity_ids:
        data.paused[entity_id] = PausedAutomation(entity_id, entity_id, resume_at, now)

    save_data = AsyncMock(return_value=True)
    scheduled_callbacks: list[object] = []

    def track_time(_hass: object, callback: object, _when: datetime) -> MagicMock:
        scheduled_callbacks.append(callback)
        return MagicMock()

    created_tasks: list[object] = []

    def create_task(coro: object) -> object:
        created_tasks.append(coro)
        return coro

    hass.async_create_task = MagicMock(side_effect=create_task)

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.async_save", save_data),
        patch("custom_components.autosnooze.application.notifications.send_resume_notification", AsyncMock()),
        patch("custom_components.autosnooze.runtime.ports.async_track_point_in_time", side_effect=track_time),
    ):
        for entity_id in entity_ids:
            schedule_resume(hass, data, entity_id, resume_at, track_point_in_time=track_time)
        assert len(scheduled_callbacks) == 1
        scheduled_callbacks[0](resume_at)
        await created_tasks[0]

    save_data.assert_awaited_once()
    data.notify.assert_called_once()
