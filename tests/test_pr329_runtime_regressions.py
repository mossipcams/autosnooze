"""Temporary PR #329 backend runtime regression tests."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze.coordinator import async_resume_batch
from custom_components.autosnooze.runtime.state import AutomationPauseData
from custom_components.autosnooze.models import PausedAutomation

UTC = timezone.utc


def _paused(entity_id: str, *, minutes: int = 30, retries: int = 0) -> PausedAutomation:
    now = datetime.now(UTC)
    return PausedAutomation(
        entity_id=entity_id,
        friendly_name=entity_id,
        resume_at=now + timedelta(minutes=minutes),
        paused_at=now,
        resume_retries=retries,
    )


@pytest.mark.asyncio
async def test_resume_batch_deduplicates_entity_ids_before_wake_calls() -> None:
    """Duplicate batch ids should not trigger duplicate wake service calls."""
    mock_hass = MagicMock()
    mock_store = MagicMock()
    mock_store.async_save = AsyncMock()
    data = AutomationPauseData(store=mock_store)
    data.notify = MagicMock()
    data.paused["automation.test"] = _paused("automation.test")

    with (
        patch(
            "custom_components.autosnooze.coordinator.async_set_automation_state",
            AsyncMock(return_value=True),
        ) as set_state,
        patch(
            "custom_components.autosnooze.coordinator.async_save",
            AsyncMock(return_value=True),
        ) as save_state,
    ):
        await async_resume_batch(mock_hass, data, ["automation.test", "automation.test"])

    assert set_state.await_count == 1
    save_state.assert_awaited_once_with(data)
    data.notify.assert_called_once_with()
    assert "automation.test" not in data.paused


@pytest.mark.asyncio
async def test_resume_batch_skips_wake_calls_for_unknown_entity_ids() -> None:
    """Unknown batch ids should not trigger wake calls."""
    data = AutomationPauseData(store=MagicMock())
    data.notify = MagicMock()

    with (
        patch(
            "custom_components.autosnooze.coordinator.async_set_automation_state",
            AsyncMock(return_value=True),
        ) as set_state,
        patch(
            "custom_components.autosnooze.coordinator.async_save",
            AsyncMock(return_value=True),
        ) as save_state,
    ):
        await async_resume_batch(MagicMock(), data, ["automation.missing"])

    set_state.assert_not_awaited()
    save_state.assert_awaited_once_with(data)
    data.notify.assert_called_once_with()


@pytest.mark.asyncio
async def test_resume_batch_keeps_failed_entities_and_persists_once() -> None:
    """A failed wake should be retried without corrupting successful resumptions."""
    data = AutomationPauseData(store=MagicMock())
    data.notify = MagicMock()
    data.paused["automation.success"] = _paused("automation.success")
    data.paused["automation.retry"] = _paused("automation.retry", retries=1)

    async def _set_state(_hass: MagicMock, entity_id: str, *, enabled: bool) -> bool:
        assert enabled is True
        return entity_id == "automation.success"

    with (
        patch(
            "custom_components.autosnooze.coordinator.async_set_automation_state",
            AsyncMock(side_effect=_set_state),
        ) as set_state,
        patch(
            "custom_components.autosnooze.coordinator.async_save",
            AsyncMock(return_value=True),
        ) as save_state,
        patch("custom_components.autosnooze.coordinator.schedule_resume") as schedule_resume,
    ):
        await async_resume_batch(
            MagicMock(),
            data,
            ["automation.success", "automation.missing", "automation.retry"],
        )

    assert set_state.await_args_list[0].args[1] == "automation.success"
    assert set_state.await_args_list[1].args[1] == "automation.retry"
    save_state.assert_awaited_once_with(data)
    data.notify.assert_called_once_with()
    schedule_resume.assert_called_once()
    assert "automation.success" not in data.paused
    assert data.paused["automation.retry"].resume_retries == 2
