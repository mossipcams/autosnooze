"""Tests for extracted application command handlers."""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID


@pytest.mark.asyncio
async def test_handle_cancel_service_filters_unknown_entities() -> None:
    """Cancel application batches only paused entities."""
    from custom_components.autosnooze.application.resume import async_handle_cancel_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.exists"] = MagicMock()
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.exists", "automation.missing"]}

    with patch(
        "custom_components.autosnooze.application.resume.async_resume_batch",
        new_callable=AsyncMock,
    ) as batch_resume:
        await async_handle_cancel_service(hass, data, call)

    batch_resume.assert_called_once_with(hass, data, ["automation.exists"])


@pytest.mark.asyncio
async def test_handle_cancel_scheduled_service_filters_unknown_entities() -> None:
    """Scheduled cancel application batches only scheduled entities."""
    from custom_components.autosnooze.application.scheduled import async_handle_cancel_scheduled_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.scheduled["automation.exists"] = MagicMock()
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.exists", "automation.missing"]}

    with patch(
        "custom_components.autosnooze.application.scheduled.async_cancel_scheduled_batch",
        new_callable=AsyncMock,
    ) as batch_cancel:
        await async_handle_cancel_scheduled_service(hass, data, call)

    batch_cancel.assert_called_once_with(hass, data, ["automation.exists"])


@pytest.mark.asyncio
async def test_handle_adjust_service_builds_delta_and_calls_batch_adjust() -> None:
    """Adjust application computes timedelta and delegates."""
    from custom_components.autosnooze.application.adjust import async_handle_adjust_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.a"], "hours": 1, "minutes": 15}

    with patch(
        "custom_components.autosnooze.application.adjust.async_adjust_snooze_batch",
        new_callable=AsyncMock,
    ) as batch_adjust:
        await async_handle_adjust_service(hass, data, call)

    batch_adjust.assert_called_once_with(hass, data, ["automation.a"], timedelta(hours=1, minutes=15))
