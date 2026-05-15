"""Tests for extracted application command handlers."""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.exceptions import ServiceValidationError


@pytest.mark.asyncio
async def test_resume_batch_wrapper_requires_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    """Resume wrapper fails clearly before service dependencies are configured."""
    from custom_components.autosnooze.application import resume
    from custom_components.autosnooze.models import AutomationPauseData

    monkeypatch.setattr(resume, "_resume_batch_impl", None)

    with pytest.raises(RuntimeError, match="^Resume batch implementation is not configured$"):
        await resume.async_resume_batch(MagicMock(), AutomationPauseData(store=MagicMock()), ["automation.a"])


@pytest.mark.asyncio
async def test_resume_batch_wrapper_forwards_configured_dependency(monkeypatch: pytest.MonkeyPatch) -> None:
    """Resume wrapper delegates the full call contract to the configured implementation."""
    from custom_components.autosnooze.application import resume
    from custom_components.autosnooze.models import AutomationPauseData

    monkeypatch.setattr(resume, "_resume_batch_impl", None)
    batch_resume = AsyncMock()
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    entity_ids = ["automation.a"]

    resume.configure_resume_dependencies(resume_batch=batch_resume)
    await resume.async_resume_batch(hass, data, entity_ids)

    batch_resume.assert_awaited_once_with(hass, data, entity_ids)


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
    from custom_components.autosnooze.models import AutomationPauseData

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
    from custom_components.autosnooze.models import AutomationPauseData

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
async def test_scheduled_batch_wrapper_requires_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    """Scheduled wrapper fails clearly before service dependencies are configured."""
    from custom_components.autosnooze.application import scheduled
    from custom_components.autosnooze.models import AutomationPauseData

    monkeypatch.setattr(scheduled, "_cancel_scheduled_batch_impl", None)

    with pytest.raises(RuntimeError, match="^Cancel scheduled batch implementation is not configured$"):
        await scheduled.async_cancel_scheduled_batch(
            MagicMock(),
            AutomationPauseData(store=MagicMock()),
            ["automation.a"],
        )


@pytest.mark.asyncio
async def test_scheduled_batch_wrapper_forwards_configured_dependency(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Scheduled wrapper delegates the full call contract to the configured implementation."""
    from custom_components.autosnooze.application import scheduled
    from custom_components.autosnooze.models import AutomationPauseData

    monkeypatch.setattr(scheduled, "_cancel_scheduled_batch_impl", None)
    batch_cancel = AsyncMock()
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    entity_ids = ["automation.a"]

    scheduled.configure_scheduled_dependencies(cancel_scheduled_batch=batch_cancel)
    await scheduled.async_cancel_scheduled_batch(hass, data, entity_ids)

    batch_cancel.assert_awaited_once_with(hass, data, entity_ids)


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
    from custom_components.autosnooze.models import AutomationPauseData

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
async def test_adjust_batch_wrapper_requires_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    """Adjust wrapper fails clearly before service dependencies are configured."""
    from custom_components.autosnooze.application import adjust
    from custom_components.autosnooze.models import AutomationPauseData

    monkeypatch.setattr(adjust, "_adjust_batch_impl", None)

    with pytest.raises(RuntimeError, match="^Adjust batch implementation is not configured$"):
        await adjust.async_adjust_snooze_batch(
            MagicMock(),
            AutomationPauseData(store=MagicMock()),
            ["automation.a"],
            timedelta(minutes=5),
        )


@pytest.mark.asyncio
async def test_adjust_batch_wrapper_forwards_configured_dependency(monkeypatch: pytest.MonkeyPatch) -> None:
    """Adjust wrapper delegates the full call contract to the configured implementation."""
    from custom_components.autosnooze.application import adjust
    from custom_components.autosnooze.models import AutomationPauseData

    monkeypatch.setattr(adjust, "_adjust_batch_impl", None)
    batch_adjust = AsyncMock()
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    entity_ids = ["automation.a"]
    delta = timedelta(minutes=5)

    adjust.configure_adjust_dependencies(adjust_batch=batch_adjust)
    await adjust.async_adjust_snooze_batch(hass, data, entity_ids, delta)

    batch_adjust.assert_awaited_once_with(hass, data, entity_ids, delta)


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
    from custom_components.autosnooze.models import AutomationPauseData

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
    from custom_components.autosnooze.models import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.a"]}

    with pytest.raises(ServiceValidationError) as exc_info:
        await async_handle_adjust_service(hass, data, call)

    assert str(exc_info.value) == "Adjustment must be non-zero"
    assert exc_info.value.translation_domain == DOMAIN
    assert exc_info.value.translation_key == "invalid_adjustment"
