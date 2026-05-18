"""Tests for extracted application command handlers."""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.exceptions import ServiceValidationError


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
async def test_handle_cancel_service_continues_after_leading_unknown_entity() -> None:
    """Cancel application keeps scanning after unknown entity ids."""
    from custom_components.autosnooze.application.resume import async_handle_cancel_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.exists"] = MagicMock()
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.missing", "automation.exists"]}

    with patch(
        "custom_components.autosnooze.application.resume.async_resume_batch",
        new_callable=AsyncMock,
    ) as batch_resume:
        await async_handle_cancel_service(hass, data, call)

    batch_resume.assert_awaited_once_with(hass, data, ["automation.exists"])


@pytest.mark.asyncio
async def test_handle_cancel_all_service_batches_all_paused_entities() -> None:
    """Cancel-all application delegates every paused entity id."""
    from custom_components.autosnooze.application.resume import async_handle_cancel_all_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.a"] = MagicMock()
    data.paused["automation.b"] = MagicMock()

    with patch(
        "custom_components.autosnooze.application.resume.async_resume_batch",
        new_callable=AsyncMock,
    ) as batch_resume:
        await async_handle_cancel_all_service(hass, data)

    batch_resume.assert_awaited_once_with(hass, data, ["automation.a", "automation.b"])


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
async def test_handle_cancel_scheduled_service_continues_after_leading_unknown_entity() -> None:
    """Scheduled cancel application keeps scanning after unknown entity ids."""
    from custom_components.autosnooze.application.scheduled import async_handle_cancel_scheduled_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.scheduled["automation.exists"] = MagicMock()
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.missing", "automation.exists"]}

    with patch(
        "custom_components.autosnooze.application.scheduled.async_cancel_scheduled_batch",
        new_callable=AsyncMock,
    ) as batch_cancel:
        await async_handle_cancel_scheduled_service(hass, data, call)

    batch_cancel.assert_awaited_once_with(hass, data, ["automation.exists"])


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


@pytest.mark.asyncio
async def test_handle_adjust_service_builds_delta_from_all_duration_fields() -> None:
    """Adjust application reads days, hours, and minutes from the service call."""
    from custom_components.autosnooze.application.adjust import async_handle_adjust_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.a"], "days": 2, "hours": 3, "minutes": 4}

    with patch(
        "custom_components.autosnooze.application.adjust.async_adjust_snooze_batch",
        new_callable=AsyncMock,
    ) as batch_adjust:
        await async_handle_adjust_service(hass, data, call)

    batch_adjust.assert_awaited_once_with(hass, data, ["automation.a"], timedelta(days=2, hours=3, minutes=4))


@pytest.mark.asyncio
async def test_handle_adjust_service_rejects_zero_adjustment() -> None:
    """Adjust application rejects calls that omit all duration fields."""
    from custom_components.autosnooze.application.adjust import async_handle_adjust_service
    from custom_components.autosnooze.const import DOMAIN
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.a"]}

    with pytest.raises(ServiceValidationError) as exc_info:
        await async_handle_adjust_service(hass, data, call)

    assert str(exc_info.value) == "Adjustment must be non-zero"
    assert exc_info.value.translation_domain == DOMAIN
    assert exc_info.value.translation_key == "invalid_adjustment"
