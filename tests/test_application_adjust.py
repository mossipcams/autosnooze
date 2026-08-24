"""Tests for adjust application flow error handling."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.exceptions import ServiceValidationError

from custom_components.autosnooze.application.adjust import async_adjust_snooze_batch
from custom_components.autosnooze.models import PausedAutomation
from custom_components.autosnooze.runtime.state import AutomationPauseData

UTC = timezone.utc


def _paused(entity_id: str) -> PausedAutomation:
    now = datetime.now(UTC)
    return PausedAutomation(
        entity_id=entity_id,
        friendly_name=entity_id,
        resume_at=now + timedelta(hours=2),
        paused_at=now,
    )


@pytest.mark.asyncio
async def test_adjust_raises_when_no_requested_entity_is_snoozed() -> None:
    """When none of the requested entities are snoozed, service must not return success."""
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    save = AsyncMock(return_value=True)

    with (
        patch("custom_components.autosnooze.application.adjust.schedule_resume"),
        patch("custom_components.autosnooze.application.adjust.schedule_pre_resume_notification"),
        patch("custom_components.autosnooze.application.adjust.async_save", save),
        pytest.raises(ServiceValidationError) as exc_info,
    ):
        await async_adjust_snooze_batch(
            hass,
            data,
            ["automation.a", "automation.b"],
            timedelta(minutes=30),
        )

    assert exc_info.value.translation_domain == "autosnooze"
    assert exc_info.value.translation_key == "adjust_failed"
    assert data.paused == {}
    save.assert_not_awaited()


@pytest.mark.asyncio
async def test_adjust_succeeds_when_at_least_one_entity_is_snoozed() -> None:
    """Partial adjust success must not raise when at least one entity is adjusted."""
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.a"] = _paused("automation.a")
    save = AsyncMock(return_value=True)

    with (
        patch("custom_components.autosnooze.application.adjust.schedule_resume"),
        patch("custom_components.autosnooze.application.adjust.schedule_pre_resume_notification"),
        patch("custom_components.autosnooze.application.adjust.async_save", save),
    ):
        await async_adjust_snooze_batch(
            hass,
            data,
            ["automation.a", "automation.b"],
            timedelta(minutes=30),
        )

    assert "automation.a" in data.paused
    save.assert_awaited_once()
