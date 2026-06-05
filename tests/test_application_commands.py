"""Tests for extracted application command handlers."""

from __future__ import annotations

from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID


@pytest.mark.asyncio
async def test_unknown_entity_service_request_is_explicitly_rejected() -> None:
    """Unknown entities are returned as rejected rather than silently filtered."""
    from custom_components.autosnooze.application.resume import async_handle_cancel_service
    from custom_components.autosnooze.domain.transitions import TransitionOutcome
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    data.paused["automation.exists"] = MagicMock()
    call = MagicMock()
    call.data = {ATTR_ENTITY_ID: ["automation.exists", "automation.missing"]}

    from custom_components.autosnooze.domain.transitions import EntityTransitionResult, TransitionResult

    with patch(
        "custom_components.autosnooze.application.resume.async_resume_batch",
        new_callable=AsyncMock,
    ) as batch_resume:
        batch_resume.return_value = TransitionResult(
            "cancel",
            (
                EntityTransitionResult("automation.exists", TransitionOutcome.SUCCEEDED),
                EntityTransitionResult("automation.missing", TransitionOutcome.REJECTED),
            ),
        )
        result = await async_handle_cancel_service(hass, data, call)

    batch_resume.assert_called_once_with(
        hass,
        data,
        ["automation.exists", "automation.missing"],
        reason="manual",
    )
    assert [entity.entity_id for entity in result.entities] == ["automation.exists", "automation.missing"]


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


@pytest.mark.asyncio
async def test_all_resume_entry_points_delegate_to_application_resume_command() -> None:
    """Manual, timer, retry, and restore expiry paths use application resume commands."""
    from datetime import datetime, timezone

    from custom_components.autosnooze.application.resume import async_handle_cancel_service, async_resume
    from custom_components.autosnooze.application.runtime_wiring import wire_runtime_callbacks
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    wire_runtime_callbacks(data)

    with patch("custom_components.autosnooze.application.resume.async_resume_batch", AsyncMock()) as batch_resume:
        call = MagicMock()
        call.data = {ATTR_ENTITY_ID: ["automation.exists"]}
        data.paused["automation.exists"] = MagicMock()
        await async_handle_cancel_service(hass, data, call)
        batch_resume.assert_awaited_once_with(hass, data, ["automation.exists"], reason="manual")

    timer_data = AutomationPauseData(store=MagicMock())
    with patch("custom_components.autosnooze.application.runtime_wiring.async_resume", AsyncMock()) as timer_resume:
        wire_runtime_callbacks(timer_data)
        await timer_data.resume_callback(hass, timer_data, "automation.timer", reason="expired")

    timer_resume.assert_awaited_once_with(hass, timer_data, "automation.timer", reason="expired")

    with patch("custom_components.autosnooze.application.restore.async_resume", AsyncMock()) as restore_resume:
        from custom_components.autosnooze.application.restore import async_restore_stored

        store = MagicMock()
        now = datetime.now(timezone.utc)
        store.async_load = AsyncMock(
            return_value={
                "paused": {
                    "automation.expired": {
                        "friendly_name": "Expired",
                        "resume_at": (now - timedelta(minutes=1)).isoformat(),
                        "paused_at": (now - timedelta(hours=1)).isoformat(),
                    }
                },
                "scheduled": {},
            }
        )
        restore_data = AutomationPauseData(store=store)
        wire_runtime_callbacks(restore_data)
        hass.states.get.return_value = MagicMock()

        with patch(
            "custom_components.autosnooze.runtime.ports.async_save",
            AsyncMock(return_value=True),
        ):
            await async_restore_stored(hass, restore_data)

        restore_resume.assert_awaited_once_with(
            hass,
            restore_data,
            "automation.expired",
            reason="expired",
            publish=False,
        )


@pytest.mark.asyncio
async def test_pause_by_area_and_label_delegate_to_application_pause() -> None:
    """Area/label services delegate to application pause commands."""
    from custom_components.autosnooze.application.pause import (
        async_handle_pause_by_area_service,
        async_handle_pause_by_label_service,
    )
    from custom_components.autosnooze.runtime.state import AutomationPauseData

    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    call = MagicMock()
    call.data = {
        "area_id": "living_room",
        "days": 0,
        "hours": 1,
        "minutes": 0,
        "confirm": False,
    }

    with (
        patch(
            "custom_components.autosnooze.application.pause.get_automations_by_area",
            return_value=["automation.area"],
        ) as get_by_area,
        patch("custom_components.autosnooze.application.pause.async_pause_automations", AsyncMock()) as pause,
        patch("custom_components.autosnooze.application.pause._validate_guardrails"),
    ):
        await async_handle_pause_by_area_service(hass, data, call)

    get_by_area.assert_called_once_with(hass, ["living_room"])
    pause.assert_awaited_once()

    label_call = MagicMock()
    label_call.data = {
        "label_id": "autosnooze_include",
        "days": 0,
        "hours": 0,
        "minutes": 30,
        "confirm": False,
    }

    with (
        patch(
            "custom_components.autosnooze.application.pause.get_automations_by_label",
            return_value=["automation.label"],
        ) as get_by_label,
        patch("custom_components.autosnooze.application.pause.async_pause_automations", AsyncMock()) as pause,
        patch("custom_components.autosnooze.application.pause._validate_guardrails"),
    ):
        await async_handle_pause_by_label_service(hass, data, label_call)

    get_by_label.assert_called_once_with(hass, ["autosnooze_include"])
    pause.assert_awaited_once()
