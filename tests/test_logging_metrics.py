"""Tests for structured logging/metrics hooks in active runtime paths."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import logging
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze.coordinator import async_resume_batch
from custom_components.autosnooze.application.pause import async_pause_automations
from custom_components.autosnooze.runtime.state import AutomationPauseData
from custom_components.autosnooze.models import PausedAutomation

UTC = timezone.utc


def _assert_structured_record(record: logging.LogRecord, command: str) -> None:
    assert getattr(record, "command", None) == command
    assert getattr(record, "operation_id", None) is not None
    assert getattr(record, "outcome", None) in {"success", "error"}
    assert getattr(record, "latency_bucket", None) in {"lt_10ms", "lt_100ms", "lt_1000ms", "gte_1000ms"}


@pytest.mark.asyncio
async def test_pause_path_emits_structured_log_fields(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger="custom_components.autosnooze.logging_utils")
    hass = MagicMock()
    hass.states.get.return_value = MagicMock(attributes={"friendly_name": "Kitchen"})
    data = AutomationPauseData(store=MagicMock())

    with (
        patch(
            "custom_components.autosnooze.application.pause.async_set_automation_state",
            new_callable=AsyncMock,
            return_value=True,
        ),
        patch("custom_components.autosnooze.application.pause.schedule_resume"),
        patch("custom_components.autosnooze.application.pause.async_save", new_callable=AsyncMock, return_value=True),
    ):
        await async_pause_automations(hass, data, ["automation.kitchen"], hours=1)

    record = next(r for r in caplog.records if getattr(r, "command", None) == "pause")
    _assert_structured_record(record, "pause")


@pytest.mark.asyncio
async def test_cancel_batch_path_emits_structured_log_fields(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger="custom_components.autosnooze.logging_utils")
    hass = MagicMock()
    now = datetime.now(UTC)
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.kitchen"] = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        paused_at=now,
        resume_at=now + timedelta(hours=1),
    )

    with (
        patch(
            "custom_components.autosnooze.coordinator.async_set_automation_state",
            new_callable=AsyncMock,
            return_value=True,
        ),
        patch("custom_components.autosnooze.coordinator.async_save", new_callable=AsyncMock, return_value=True),
        patch("custom_components.autosnooze.coordinator.cancel_timer"),
    ):
        await async_resume_batch(hass, data, ["automation.kitchen"])

    record = next(r for r in caplog.records if getattr(r, "command", None) == "cancel")
    _assert_structured_record(record, "cancel")
