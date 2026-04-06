"""Tests for the extracted pause application flow."""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID

UTC = timezone.utc


@pytest.mark.asyncio
async def test_handle_pause_service_forwards_full_contract_fields() -> None:
    """Pause application delegates guardrails and pause execution."""
    from custom_components.autosnooze.application.pause import async_handle_pause_service
    from custom_components.autosnooze.models import AutomationPauseData

    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    disable_at = datetime(2030, 1, 1, 10, 0, tzinfo=UTC)
    resume_at = datetime(2030, 1, 1, 12, 0, tzinfo=UTC)
    call = MagicMock()
    call.data = {
        ATTR_ENTITY_ID: ["automation.a", "automation.b"],
        "days": 1,
        "hours": 2,
        "minutes": 3,
        "disable_at": disable_at,
        "resume_at": resume_at,
        "confirm": True,
    }

    with (
        patch("custom_components.autosnooze.application.pause._validate_guardrails") as validate_guardrails,
        patch(
            "custom_components.autosnooze.application.pause.async_pause_automations",
            new_callable=AsyncMock,
        ) as pause_automations,
    ):
        await async_handle_pause_service(mock_hass, data, call)

    validate_guardrails.assert_called_once_with(mock_hass, ["automation.a", "automation.b"], confirm=True)
    pause_automations.assert_called_once_with(
        mock_hass,
        data,
        ["automation.a", "automation.b"],
        1,
        2,
        3,
        disable_at,
        resume_at,
    )


@pytest.mark.asyncio
async def test_handle_pause_service_noops_when_unloaded() -> None:
    """Pause application exits early when integration is unloaded."""
    from custom_components.autosnooze.application.pause import async_handle_pause_service
    from custom_components.autosnooze.models import AutomationPauseData

    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock(), unloaded=True)
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.a"]}

    with (
        patch("custom_components.autosnooze.application.pause._validate_guardrails") as validate_guardrails,
        patch(
            "custom_components.autosnooze.application.pause.async_pause_automations",
            new_callable=AsyncMock,
        ) as pause_automations,
    ):
        await async_handle_pause_service(mock_hass, data, call)

    validate_guardrails.assert_not_called()
    pause_automations.assert_not_called()
