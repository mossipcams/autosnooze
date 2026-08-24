"""Lock scope tests: data.lock must not span await async_save or nested notify tasks."""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze import async_load_stored
from custom_components.autosnooze.application.adjust import async_adjust_snooze_batch
from custom_components.autosnooze.application.pause import async_pause_automations
from custom_components.autosnooze.application.resume import async_resume, async_resume_batch
from custom_components.autosnooze.application.scheduled import async_execute_scheduled_disable
from custom_components.autosnooze.infrastructure.storage import async_save as infrastructure_async_save
from custom_components.autosnooze.models import PausedAutomation, ScheduledSnooze
from custom_components.autosnooze.runtime.state import AutomationPauseData

UTC = timezone.utc


async def _assert_lock_acquirable_during_slow_save(
    data: AutomationPauseData,
    *,
    start_operation: Callable[[], Awaitable[None]],
    save_patch: str,
) -> None:
    save_started = asyncio.Event()
    allow_save_finish = asyncio.Event()

    async def slow_save(_data: AutomationPauseData) -> bool:
        save_started.set()
        await allow_save_finish.wait()
        return True

    with patch(save_patch, side_effect=slow_save):
        operation_task = asyncio.create_task(start_operation())
        await asyncio.wait_for(save_started.wait(), timeout=1)

        acquired_while_save_in_flight = False
        try:
            await asyncio.wait_for(data.lock.acquire(), timeout=0.05)
            acquired_while_save_in_flight = True
        finally:
            if acquired_while_save_in_flight:
                data.lock.release()

        allow_save_finish.set()
        await operation_task

    assert acquired_while_save_in_flight is True


@pytest.mark.asyncio
async def test_pause_releases_lock_before_async_save() -> None:
    mock_hass = MagicMock()
    mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Test"})
    data = AutomationPauseData(store=MagicMock())

    with (
        patch(
            "custom_components.autosnooze.application.pause.async_set_automation_state",
            new_callable=AsyncMock,
            return_value=True,
        ),
        patch("custom_components.autosnooze.application.pause.schedule_resume"),
    ):
        await _assert_lock_acquirable_during_slow_save(
            data,
            start_operation=lambda: async_pause_automations(mock_hass, data, ["automation.test"], hours=1),
            save_patch="custom_components.autosnooze.application.pause.runtime_async_save",
        )


@pytest.mark.asyncio
async def test_resume_releases_lock_before_async_save() -> None:
    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    data.paused["automation.test"] = PausedAutomation(
        entity_id="automation.test",
        friendly_name="Test",
        resume_at=now,
        paused_at=now - timedelta(hours=1),
    )

    with patch(
        "custom_components.autosnooze.runtime.ports.async_set_automation_state",
        new_callable=AsyncMock,
        return_value=True,
    ):
        await _assert_lock_acquirable_during_slow_save(
            data,
            start_operation=lambda: async_resume(mock_hass, data, "automation.test"),
            save_patch="custom_components.autosnooze.runtime.ports.async_save",
        )


@pytest.mark.asyncio
async def test_batch_resume_releases_lock_before_async_save() -> None:
    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    data.paused["automation.one"] = PausedAutomation(
        entity_id="automation.one",
        friendly_name="One",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
    )

    with patch(
        "custom_components.autosnooze.runtime.ports.async_set_automation_state",
        new_callable=AsyncMock,
        return_value=True,
    ):
        await _assert_lock_acquirable_during_slow_save(
            data,
            start_operation=lambda: async_resume_batch(mock_hass, data, ["automation.one"]),
            save_patch="custom_components.autosnooze.runtime.ports.async_save",
        )


@pytest.mark.asyncio
async def test_adjust_releases_lock_before_async_save() -> None:
    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    data.paused["automation.test"] = PausedAutomation(
        entity_id="automation.test",
        friendly_name="Test",
        resume_at=now + timedelta(hours=2),
        paused_at=now,
    )

    with (
        patch("custom_components.autosnooze.application.adjust.schedule_resume"),
        patch("custom_components.autosnooze.application.adjust.schedule_pre_resume_notification"),
    ):
        await _assert_lock_acquirable_during_slow_save(
            data,
            start_operation=lambda: async_adjust_snooze_batch(mock_hass, data, ["automation.test"], timedelta(hours=1)),
            save_patch="custom_components.autosnooze.application.adjust.async_save",
        )


@pytest.mark.asyncio
async def test_scheduled_disable_releases_lock_before_async_save() -> None:
    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    data.scheduled["automation.test"] = ScheduledSnooze(
        entity_id="automation.test",
        friendly_name="Test",
        disable_at=now,
        resume_at=now + timedelta(hours=1),
    )

    with (
        patch(
            "custom_components.autosnooze.runtime.ports.async_set_automation_state",
            new_callable=AsyncMock,
            return_value=True,
        ),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
        patch("custom_components.autosnooze.runtime.ports.schedule_pre_resume_notification"),
    ):
        await _assert_lock_acquirable_during_slow_save(
            data,
            start_operation=lambda: async_execute_scheduled_disable(
                mock_hass, data, "automation.test", now + timedelta(hours=1)
            ),
            save_patch="custom_components.autosnooze.runtime.ports.async_save",
        )


@pytest.mark.asyncio
async def test_storage_async_save_releases_data_lock_during_store_io() -> None:
    """infrastructure async_save must not hold data.lock while awaiting Store.async_save."""
    save_started = asyncio.Event()
    allow_save_finish = asyncio.Event()

    async def slow_store_save(_payload: dict[str, object]) -> None:
        save_started.set()
        await allow_save_finish.wait()

    now = datetime.now(UTC)
    store = MagicMock()
    store.async_save = slow_store_save
    data = AutomationPauseData(store=store)
    data.paused["automation.test"] = PausedAutomation(
        entity_id="automation.test",
        friendly_name="Test",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
    )

    save_task = asyncio.create_task(infrastructure_async_save(data))
    await asyncio.wait_for(save_started.wait(), timeout=1)

    acquired_while_save_in_flight = False
    try:
        await asyncio.wait_for(data.lock.acquire(), timeout=0.05)
        acquired_while_save_in_flight = True
    finally:
        if acquired_while_save_in_flight:
            data.lock.release()

    allow_save_finish.set()
    assert await save_task is True
    assert acquired_while_save_in_flight is True


@pytest.mark.asyncio
async def test_storage_async_save_snapshots_under_data_lock() -> None:
    """get_paused_dict/get_scheduled_dict must run while data.lock is held."""
    now = datetime.now(UTC)
    store = MagicMock()
    store.async_save = AsyncMock(return_value=None)
    data = AutomationPauseData(store=store)
    data.paused["automation.first"] = PausedAutomation(
        entity_id="automation.first",
        friendly_name="First",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
    )

    lock_held_during_paused_snapshot = False
    lock_held_during_scheduled_snapshot = False
    original_get_paused = AutomationPauseData.get_paused_dict
    original_get_scheduled = AutomationPauseData.get_scheduled_dict

    def tracking_get_paused(self: AutomationPauseData) -> dict[str, dict[str, object]]:
        nonlocal lock_held_during_paused_snapshot
        lock_held_during_paused_snapshot = self.lock.locked()
        return original_get_paused(self)

    def tracking_get_scheduled(self: AutomationPauseData) -> dict[str, dict[str, object]]:
        nonlocal lock_held_during_scheduled_snapshot
        lock_held_during_scheduled_snapshot = self.lock.locked()
        return original_get_scheduled(self)

    with (
        patch.object(AutomationPauseData, "get_paused_dict", tracking_get_paused),
        patch.object(AutomationPauseData, "get_scheduled_dict", tracking_get_scheduled),
    ):
        assert await infrastructure_async_save(data) is True

    assert lock_held_during_paused_snapshot is True
    assert lock_held_during_scheduled_snapshot is True


@pytest.mark.asyncio
async def test_storage_async_save_payload_is_immutable_during_store_io() -> None:
    """Mutations after the under-lock snapshot must not change the Store.async_save payload."""
    save_started = asyncio.Event()
    allow_save_finish = asyncio.Event()
    captured_payload: dict[str, object] = {}

    async def slow_store_save(payload: dict[str, object]) -> None:
        captured_payload["value"] = payload
        save_started.set()
        await allow_save_finish.wait()

    now = datetime.now(UTC)
    store = MagicMock()
    store.async_save = slow_store_save
    data = AutomationPauseData(store=store)
    data.paused["automation.first"] = PausedAutomation(
        entity_id="automation.first",
        friendly_name="First",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
    )

    save_task = asyncio.create_task(infrastructure_async_save(data))
    await asyncio.wait_for(save_started.wait(), timeout=1)

    data.paused["automation.second"] = PausedAutomation(
        entity_id="automation.second",
        friendly_name="Second",
        resume_at=now + timedelta(hours=2),
        paused_at=now,
    )

    allow_save_finish.set()
    assert await save_task is True

    payload = captured_payload["value"]
    assert isinstance(payload, dict)
    paused = payload["paused"]
    assert isinstance(paused, dict)
    assert set(paused) == {"automation.first"}


@pytest.mark.asyncio
async def test_restore_releases_lock_before_async_save() -> None:
    now = datetime.now(UTC)
    mock_store = MagicMock()
    mock_store.async_load = AsyncMock(
        return_value={
            "paused": {
                "automation.expired": {
                    "friendly_name": "Expired",
                    "resume_at": (now - timedelta(hours=1)).isoformat(),
                    "paused_at": (now - timedelta(hours=2)).isoformat(),
                }
            },
            "scheduled": {},
        }
    )
    data = AutomationPauseData(store=mock_store)
    mock_hass = MagicMock()
    mock_hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Expired"})

    with patch(
        "custom_components.autosnooze.runtime.ports.async_set_automation_state",
        new_callable=AsyncMock,
        return_value=True,
    ):
        await _assert_lock_acquirable_during_slow_save(
            data,
            start_operation=lambda: async_load_stored(mock_hass, data),
            save_patch="custom_components.autosnooze.runtime.restore.async_save",
        )
