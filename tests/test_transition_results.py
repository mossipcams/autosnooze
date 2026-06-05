"""Explicit application transition result contracts."""

from __future__ import annotations

from custom_components.autosnooze.domain.transitions import (
    EntityTransitionResult,
    RecoveryStatus,
    TransitionOutcome,
    TransitionResult,
)
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze.application.resume import async_resume, async_resume_batch
from custom_components.autosnooze.const import MAX_RESUME_RETRIES
from custom_components.autosnooze.models import PausedAutomation
from custom_components.autosnooze.runtime.state import AutomationPauseData

UTC = timezone.utc


def test_transition_result_models_represent_all_terminal_and_recovery_outcomes() -> None:
    """Result models represent every required outcome without raw dictionaries."""
    outcomes = (
        TransitionOutcome.SUCCEEDED,
        TransitionOutcome.REJECTED,
        TransitionOutcome.RETRYING,
        TransitionOutcome.RECOVERY_REQUIRED,
        TransitionOutcome.STALE_COMPENSATED,
    )
    entities = tuple(
        EntityTransitionResult(
            entity_id=f"automation.{outcome.value}",
            outcome=outcome,
            recovery_status=(
                RecoveryStatus.REQUIRED if outcome is TransitionOutcome.RECOVERY_REQUIRED else RecoveryStatus.NONE
            ),
        )
        for outcome in outcomes
    )

    result = TransitionResult(command="resume", entities=entities)

    assert result.complete_success is False
    assert result.partial_success is True
    assert tuple(entity.outcome for entity in result.entities) == outcomes


def _paused(entity_id: str, retries: int = 0) -> PausedAutomation:
    now = datetime.now(UTC)
    return PausedAutomation(
        entity_id=entity_id,
        friendly_name=entity_id,
        resume_at=now + timedelta(minutes=30),
        paused_at=now,
        resume_retries=retries,
    )


@pytest.mark.asyncio
async def test_failed_resume_returns_recovery_required_without_removing_pause() -> None:
    entity_id = "automation.failed"
    data = AutomationPauseData(store=MagicMock())
    data.paused[entity_id] = _paused(entity_id, MAX_RESUME_RETRIES)
    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", AsyncMock(return_value=False)),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
    ):
        result = await async_resume(MagicMock(), data, entity_id)

    assert result.entities[0].outcome is TransitionOutcome.RECOVERY_REQUIRED
    assert data.paused[entity_id].recovery_status is RecoveryStatus.REQUIRED


@pytest.mark.asyncio
async def test_resume_batch_returns_ordered_partial_outcomes() -> None:
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.ok"] = _paused("automation.ok")
    data.paused["automation.failed"] = _paused("automation.failed")

    async def set_state(_hass, entity_id, *, enabled):
        return entity_id == "automation.ok"

    with (
        patch("custom_components.autosnooze.runtime.ports.async_set_automation_state", side_effect=set_state),
        patch("custom_components.autosnooze.runtime.ports.async_save", AsyncMock(return_value=True)),
        patch("custom_components.autosnooze.runtime.ports.schedule_resume"),
    ):
        result = await async_resume_batch(
            MagicMock(),
            data,
            ["automation.ok", "automation.missing", "automation.failed"],
        )

    assert [entity.entity_id for entity in result.entities] == [
        "automation.ok",
        "automation.missing",
        "automation.failed",
    ]
    assert [entity.outcome for entity in result.entities] == [
        TransitionOutcome.SUCCEEDED,
        TransitionOutcome.REJECTED,
        TransitionOutcome.RETRYING,
    ]
