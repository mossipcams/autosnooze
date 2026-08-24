"""Startup recovery tests for persisted pause/schedule replay."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.autosnooze import async_load_stored
from custom_components.autosnooze.runtime.state import AutomationPauseData

UTC = timezone.utc


def _stored_payload(now: datetime) -> dict:
    return {
        "paused": {
            "automation.future_paused": {
                "friendly_name": "Future Paused",
                "resume_at": (now + timedelta(hours=1)).isoformat(),
                "paused_at": (now - timedelta(minutes=10)).isoformat(),
            },
            "automation.expired_paused": {
                "friendly_name": "Expired Paused",
                "resume_at": (now - timedelta(minutes=1)).isoformat(),
                "paused_at": (now - timedelta(hours=2)).isoformat(),
            },
        },
        "scheduled": {
            "automation.future_scheduled": {
                "friendly_name": "Future Scheduled",
                "disable_at": (now + timedelta(minutes=30)).isoformat(),
                "resume_at": (now + timedelta(hours=2)).isoformat(),
            },
            "automation.expired_scheduled": {
                "friendly_name": "Expired Scheduled",
                "disable_at": (now - timedelta(hours=2)).isoformat(),
                "resume_at": (now - timedelta(hours=1)).isoformat(),
            },
        },
    }


def _build_hass() -> MagicMock:
    hass = MagicMock()
    hass.states.get.side_effect = lambda entity_id: MagicMock(entity_id=entity_id)
    return hass


@pytest.mark.asyncio
async def test_startup_recovery_restores_future_entries_and_skips_expired() -> None:
    now = datetime.now(UTC)
    data = AutomationPauseData()
    data.store = MagicMock()
    data.store.async_load = AsyncMock(return_value=_stored_payload(now))
    data.store.async_save = AsyncMock()
    data.notify = MagicMock()
    hass = _build_hass()

    unsubs: list[MagicMock] = []

    def fake_track(_hass, _callback, _when):
        unsub = MagicMock()
        unsubs.append(unsub)
        return unsub

    with (
        pytest.MonkeyPatch.context() as mp,
    ):
        mp.setattr("custom_components.autosnooze.runtime.ports.async_track_point_in_time", fake_track)
        mp.setattr(
            "custom_components.autosnooze.runtime.ports.async_set_automation_state",
            AsyncMock(return_value=True),
        )
        await async_load_stored(hass, data)

    assert "automation.future_paused" in data.paused
    assert "automation.expired_paused" not in data.paused
    assert "automation.future_scheduled" in data.scheduled
    assert "automation.expired_scheduled" not in data.scheduled
    assert len(data.timers) == 1
    assert len(data.scheduled_timers) == 1
    data.notify.assert_called_once()


@pytest.mark.asyncio
async def test_startup_recovery_restores_paused_input_boolean() -> None:
    now = datetime.now(UTC)
    data = AutomationPauseData(store=MagicMock())
    data.store.async_load = AsyncMock(
        return_value={
            "paused": {
                "input_boolean.away_mode": {
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                }
            },
            "scheduled": {},
        }
    )
    hass = _build_hass()
    set_state = AsyncMock(return_value=True)

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("custom_components.autosnooze.runtime.ports.async_set_automation_state", set_state)
        mp.setattr("custom_components.autosnooze.runtime.ports.schedule_resume", MagicMock())
        await async_load_stored(hass, data)

    assert "input_boolean.away_mode" in data.paused
    set_state.assert_awaited_once_with(hass, "input_boolean.away_mode", enabled=False)


@pytest.mark.asyncio
async def test_startup_recovery_defers_scheduled_previous_when_state_is_unavailable() -> None:
    """Recovery must preserve a scheduled Boolean until its previous state is stable."""
    now = datetime.now(UTC)
    entity_id = "input_boolean.away_mode"
    data = AutomationPauseData(store=MagicMock())
    data.store.async_load = AsyncMock(
        return_value={
            "paused": {},
            "scheduled": {
                entity_id: {
                    "disable_at": (now - timedelta(minutes=5)).isoformat(),
                    "resume_at": (now + timedelta(minutes=10)).isoformat(),
                    "resume_state": "previous",
                }
            },
        }
    )
    data.store.async_save = AsyncMock()
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="unavailable")
    set_state = AsyncMock(return_value=True)
    schedule_disable = MagicMock()

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("custom_components.autosnooze.runtime.ports.async_set_automation_state", set_state)
        mp.setattr("custom_components.autosnooze.runtime.ports.schedule_disable", schedule_disable)
        await async_load_stored(hass, data)

    set_state.assert_not_awaited()
    assert entity_id in data.scheduled
    assert entity_id not in data.paused
    assert data.scheduled[entity_id].disable_at > now
    schedule_disable.assert_called_once()


@pytest.mark.asyncio
async def test_startup_recovery_applies_persisted_off_resume_state() -> None:
    """An expired snooze applies its persisted Boolean end state after restart."""
    now = datetime.now(UTC)
    entity_id = "input_boolean.away_mode"
    data = AutomationPauseData(store=MagicMock())
    data.store.async_load = AsyncMock(
        return_value={
            "paused": {
                entity_id: {
                    "resume_at": (now - timedelta(minutes=1)).isoformat(),
                    "paused_at": (now - timedelta(hours=1)).isoformat(),
                    "resume_state": "off",
                }
            },
            "scheduled": {},
        }
    )
    data.store.async_save = AsyncMock()
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="off")
    set_state = AsyncMock(return_value=True)

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("custom_components.autosnooze.runtime.ports.async_set_automation_state", set_state)
        await async_load_stored(hass, data)

    set_state.assert_awaited_once_with(hass, entity_id, enabled=False)
    assert entity_id not in data.paused


@pytest.mark.asyncio
async def test_startup_recovery_replay_reregistration_is_idempotent() -> None:
    now = datetime.now(UTC)
    data = AutomationPauseData()
    data.store = MagicMock()
    data.store.async_load = AsyncMock(return_value=_stored_payload(now))
    data.store.async_save = AsyncMock()
    data.notify = MagicMock()
    hass = _build_hass()

    created_unsubs: list[MagicMock] = []

    def fake_track(_hass, _callback, _when):
        unsub = MagicMock()
        created_unsubs.append(unsub)
        return unsub

    with (
        pytest.MonkeyPatch.context() as mp,
    ):
        mp.setattr("custom_components.autosnooze.runtime.ports.async_track_point_in_time", fake_track)
        mp.setattr(
            "custom_components.autosnooze.runtime.ports.async_set_automation_state",
            AsyncMock(return_value=True),
        )
        await async_load_stored(hass, data)
        await async_load_stored(hass, data)

    # Exactly one active timer per entity after replay.
    assert len(data.timers) == 1
    assert len(data.scheduled_timers) == 1
    # First generation timers should have been cancelled on re-register.
    created_unsubs[0].assert_called_once()
    created_unsubs[1].assert_called_once()


@pytest.mark.asyncio
async def test_startup_recovery_retains_entries_when_backend_state_changes_fail() -> None:
    now = datetime.now(UTC)
    data = AutomationPauseData(store=MagicMock())
    data.store.async_load = AsyncMock(
        return_value={
            "paused": {
                "automation.failed_pause": {
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                },
                "automation.restored_pause": {
                    "resume_at": (now + timedelta(hours=2)).isoformat(),
                    "paused_at": now.isoformat(),
                },
            },
            "scheduled": {
                "automation.failed_schedule": {
                    "disable_at": (now - timedelta(minutes=5)).isoformat(),
                    "resume_at": (now + timedelta(hours=3)).isoformat(),
                }
            },
        }
    )
    data.store.async_save = AsyncMock()
    hass = _build_hass()

    async def set_state(_hass: object, entity_id: str, *, enabled: bool) -> bool:
        assert enabled is False
        return entity_id == "automation.restored_pause"

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr("custom_components.autosnooze.runtime.ports.async_set_automation_state", set_state)
        mp.setattr("custom_components.autosnooze.runtime.ports.schedule_resume", MagicMock())
        await async_load_stored(hass, data)

    assert set(data.paused) == {"automation.failed_pause", "automation.restored_pause"}
    assert set(data.scheduled) == {"automation.failed_schedule"}
    data.store.async_save.assert_not_awaited()
