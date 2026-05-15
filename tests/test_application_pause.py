"""Tests for the extracted pause application flow."""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.const import ATTR_ENTITY_ID

UTC = timezone.utc


def test_validate_guardrails_wrapper_requires_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    """Guardrail wrapper fails clearly before dependencies are configured."""
    from custom_components.autosnooze.application import pause

    monkeypatch.setattr(pause, "_guardrail_validator", None)

    with pytest.raises(RuntimeError, match="^Pause guardrail validator is not configured$"):
        pause._validate_guardrails(MagicMock(), ["automation.a"])


def test_validate_guardrails_wrapper_defaults_confirm_false(monkeypatch: pytest.MonkeyPatch) -> None:
    """Guardrail wrapper defaults confirm to false and forwards all arguments."""
    from custom_components.autosnooze.application import pause

    validate_guardrails = MagicMock()
    hass = MagicMock()
    entity_ids = ["automation.a"]
    monkeypatch.setattr(pause, "_guardrail_validator", validate_guardrails)

    pause._validate_guardrails(hass, entity_ids)

    validate_guardrails.assert_called_once_with(hass, entity_ids, False)


@pytest.mark.asyncio
async def test_pause_automations_wrapper_requires_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    """Pause wrapper fails clearly before dependencies are configured."""
    from custom_components.autosnooze.application import pause
    from custom_components.autosnooze.models import AutomationPauseData

    monkeypatch.setattr(pause, "_pause_automations_impl", None)

    with pytest.raises(RuntimeError, match="^Pause implementation is not configured$"):
        await pause.async_pause_automations(
            MagicMock(),
            AutomationPauseData(store=MagicMock()),
            ["automation.a"],
        )


@pytest.mark.asyncio
async def test_pause_automations_wrapper_defaults_and_forwards_dependency(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Pause wrapper defaults duration fields and forwards the full call contract."""
    from custom_components.autosnooze.application import pause
    from custom_components.autosnooze.models import AutomationPauseData

    pause_automations = AsyncMock()
    hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
    entity_ids = ["automation.a"]
    monkeypatch.setattr(pause, "_pause_automations_impl", pause_automations)

    await pause.async_pause_automations(hass, data, entity_ids)

    pause_automations.assert_awaited_once_with(hass, data, entity_ids, 0, 0, 0, None, None)


@pytest.mark.asyncio
async def test_handle_pause_service_forwards_full_contract_fields() -> None:
    """Pause application delegates guardrails and pause execution."""
    from custom_components.autosnooze.application.pause import async_handle_pause_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

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
async def test_handle_pause_service_forwards_default_contract_fields() -> None:
    """Pause application supplies default service fields when optional inputs are omitted."""
    from custom_components.autosnooze.application.pause import async_handle_pause_service
    from custom_components.autosnooze.models import AutomationPauseData

    mock_hass = MagicMock()
    data = AutomationPauseData(store=MagicMock())
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

    validate_guardrails.assert_called_once_with(mock_hass, ["automation.a"], confirm=False)
    pause_automations.assert_awaited_once_with(
        mock_hass,
        data,
        ["automation.a"],
        0,
        0,
        0,
        None,
        None,
    )


@pytest.mark.asyncio
async def test_handle_pause_service_noops_when_unloaded() -> None:
    """Pause application exits early when integration is unloaded."""
    from custom_components.autosnooze.application.pause import async_handle_pause_service
    from custom_components.autosnooze.runtime.state import AutomationPauseData

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
