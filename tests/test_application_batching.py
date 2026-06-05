"""Bounded application batch execution."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze.application.batching import BATCH_CONCURRENCY
from custom_components.autosnooze.application.pause import async_pause_automations
from custom_components.autosnooze.application.resume import async_resume_batch
from custom_components.autosnooze.domain.transitions import TransitionOutcome
from custom_components.autosnooze.models import PausedAutomation
from custom_components.autosnooze.runtime.state import AutomationPauseData

UTC = timezone.utc


@pytest.mark.asyncio
async def test_pause_batch_never_exceeds_configured_concurrency() -> None:
    data = AutomationPauseData(store=MagicMock())
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={})
    entity_ids = [f"automation.pause_{index}" for index in range(BATCH_CONCURRENCY * 2)]

    active = 0
    maximum = 0
    all_started = asyncio.Event()
    release = asyncio.Event()

    async def set_state(_hass, _entity_id, enabled):
        del enabled
        nonlocal active, maximum
        active += 1
        maximum = max(maximum, active)
        if maximum >= BATCH_CONCURRENCY:
            all_started.set()
        await release.wait()
        active -= 1
        return True

    with (
        patch("custom_components.autosnooze.runtime.ports.is_automation_enabled", return_value=True),
        patch("custom_components.autosnooze.runtime.ports.get_friendly_name", side_effect=lambda _h, eid: eid),
    ):
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
        await all_started.wait()
        assert maximum == BATCH_CONCURRENCY
        release.set()
        await task

    assert maximum <= BATCH_CONCURRENCY


@pytest.mark.asyncio
async def test_resume_batch_never_exceeds_configured_concurrency() -> None:
    data = AutomationPauseData(store=MagicMock())
    now = datetime.now(UTC)
    entity_ids = [f"automation.batch_{index}" for index in range(BATCH_CONCURRENCY * 2)]
    for entity_id in entity_ids:
        data.paused[entity_id] = PausedAutomation(entity_id, entity_id, now + timedelta(hours=1), now)

    active = 0
    maximum = 0
    all_started = asyncio.Event()
    release = asyncio.Event()

    async def set_state(_hass, _entity_id, *, enabled):
        del enabled
        nonlocal active, maximum
        active += 1
        maximum = max(maximum, active)
        if maximum >= BATCH_CONCURRENCY:
            all_started.set()
        await release.wait()
        active -= 1
        return True

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=set_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
    ):
        task = asyncio.create_task(async_resume_batch(MagicMock(), data, entity_ids))
        await all_started.wait()
        assert maximum == BATCH_CONCURRENCY
        release.set()
        await task

    assert maximum <= BATCH_CONCURRENCY


@pytest.mark.asyncio
async def test_batch_returns_ordered_per_entity_partial_results() -> None:
    data = AutomationPauseData(store=MagicMock())
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(state="on", attributes={})

    async def set_state(_hass, entity_id, enabled):
        del enabled
        return entity_id == "automation.ok"

    with (
        patch("custom_components.autosnooze.runtime.ports.is_automation_enabled", return_value=True),
        patch("custom_components.autosnooze.runtime.ports.get_friendly_name", side_effect=lambda _h, eid: eid),
    ):
        pause_result = await async_pause_automations(
            hass,
            data,
            ["automation.ok", "automation.failed"],
            minutes=30,
            set_automation_state=set_state,
            save_data=AsyncMock(return_value=True),
            schedule_resume_callback=MagicMock(),
        )

    assert [entity.entity_id for entity in pause_result.entities] == ["automation.ok", "automation.failed"]
    assert [entity.outcome for entity in pause_result.entities] == [
        TransitionOutcome.SUCCEEDED,
        TransitionOutcome.REJECTED,
    ]

    data.paused.clear()
    now = datetime.now(UTC)
    data.paused["automation.ok"] = PausedAutomation("automation.ok", "automation.ok", now + timedelta(hours=1), now)
    data.paused["automation.failed"] = PausedAutomation(
        "automation.failed", "automation.failed", now + timedelta(hours=1), now
    )

    async def resume_state(_hass, entity_id, *, enabled):
        del enabled
        return entity_id == "automation.ok"

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=resume_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
    ):
        resume_result = await async_resume_batch(
            hass,
            data,
            ["automation.ok", "automation.missing", "automation.failed"],
        )

    assert [entity.entity_id for entity in resume_result.entities] == [
        "automation.ok",
        "automation.missing",
        "automation.failed",
    ]
    assert [entity.outcome for entity in resume_result.entities] == [
        TransitionOutcome.SUCCEEDED,
        TransitionOutcome.REJECTED,
        TransitionOutcome.RETRYING,
    ]


@pytest.mark.asyncio
async def test_stale_result_during_concurrent_batch_is_compensated() -> None:
    data = AutomationPauseData(store=MagicMock())
    hass = MagicMock()
    now = datetime.now(UTC)
    old_pause = PausedAutomation(
        entity_id="automation.test",
        friendly_name="Old",
        resume_at=now + timedelta(hours=1),
        paused_at=now - timedelta(hours=1),
    )
    newer_pause = PausedAutomation(
        entity_id="automation.test",
        friendly_name="New",
        resume_at=now + timedelta(hours=2),
        paused_at=now + timedelta(minutes=1),
    )
    data.paused["automation.test"] = old_pause

    service_started = asyncio.Event()
    allow_service_finish = asyncio.Event()
    state_calls: list[bool] = []

    async def record_state_change(_hass, _entity_id, *, enabled):
        state_calls.append(enabled)
        if enabled:
            service_started.set()
            await allow_service_finish.wait()
        return True

    with patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=record_state_change):
        resume_task = asyncio.create_task(async_resume_batch(hass, data, ["automation.test"]))
        await asyncio.wait_for(service_started.wait(), timeout=1)
        data.paused["automation.test"] = newer_pause
        allow_service_finish.set()
        await resume_task

    assert data.paused["automation.test"] is newer_pause
    assert state_calls == [True, False]
