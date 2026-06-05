"""Recovery invariants for failed resume and restore workflows."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze.application.resume import async_resume
from custom_components.autosnooze.const import MAX_RESUME_RETRIES
from custom_components.autosnooze.models import PausedAutomation
from custom_components.autosnooze.application.restore import async_restore_stored as async_load_stored
from custom_components.autosnooze.runtime.state import AutomationPauseData

UTC = timezone.utc


def _paused(entity_id: str, *, resume_at: datetime, retries: int = 0) -> PausedAutomation:
    return PausedAutomation(
        entity_id=entity_id,
        friendly_name=entity_id,
        resume_at=resume_at,
        paused_at=resume_at - timedelta(hours=1),
        resume_retries=retries,
    )


@pytest.mark.asyncio
async def test_failed_resume_after_retry_limit_retains_recovery_record() -> None:
    """A final failed wake must retain the only automatic recovery record."""
    entity_id = "automation.failed_resume"
    data = AutomationPauseData(store=MagicMock())
    data.notify = MagicMock()
    data.paused[entity_id] = _paused(
        entity_id,
        resume_at=datetime.now(UTC),
        retries=MAX_RESUME_RETRIES,
    )

    with (
        patch(
            "custom_components.autosnooze.runtime.ports.async_set_automation_state",
            AsyncMock(return_value=False),
        ),
        patch(
            "custom_components.autosnooze.runtime.ports.async_save",
            AsyncMock(return_value=True),
        ),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume") as schedule_resume,
    ):
        await async_resume(MagicMock(), data, entity_id)

    assert entity_id in data.paused
    assert data.paused[entity_id].resume_retries == MAX_RESUME_RETRIES
    schedule_resume.assert_not_called()


@pytest.mark.asyncio
async def test_failed_expired_restore_retains_recovery_record() -> None:
    """An expired stored pause must remain tracked when its wake fails."""
    entity_id = "automation.failed_restore"
    now = datetime.now(UTC)
    stored_pause = _paused(entity_id, resume_at=now - timedelta(minutes=1))
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"paused": {entity_id: stored_pause.to_dict()}, "scheduled": {}})
    data = AutomationPauseData(store=store)
    data.notify = MagicMock()
    hass = MagicMock()
    hass.states.get.return_value = MagicMock()

    with (
        patch(
            "custom_components.autosnooze.runtime.ports.async_set_automation_state",
            AsyncMock(return_value=False),
        ),
        patch(
            "custom_components.autosnooze.runtime.ports.async_save",
            AsyncMock(return_value=True),
        ),
    ):
        await async_load_stored(hass, data)

    assert entity_id in data.paused
    assert data.paused[entity_id].resume_at <= now


@pytest.mark.asyncio
async def test_originally_off_automation_is_not_enabled_on_resume() -> None:
    """AutoSnooze must not enable an automation it did not disable."""
    entity_id = "automation.originally_off"
    data = AutomationPauseData(store=MagicMock())
    data.paused[entity_id] = _paused(entity_id, resume_at=datetime.now(UTC))
    data.paused[entity_id].originally_enabled = False

    with (
        patch(
            "custom_components.autosnooze.runtime.ports.async_set_automation_state",
            AsyncMock(return_value=True),
        ) as set_state,
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
    ):
        result = await async_resume(MagicMock(), data, entity_id)

    set_state.assert_not_awaited()
    assert result.complete_success
    assert entity_id not in data.paused
