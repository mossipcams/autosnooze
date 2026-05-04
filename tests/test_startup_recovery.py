"""Startup recovery tests for persisted pause/schedule replay."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from custom_components.autosnooze.coordinator import async_load_stored
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
