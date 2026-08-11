"""Tests for untrusted card report_telemetry service handler."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest
import voluptuous as vol

from custom_components.autosnooze.application.report_telemetry import (
    async_handle_report_telemetry,
)
from custom_components.autosnooze.const import REPORT_TELEMETRY_SCHEMA
from custom_components.autosnooze.infrastructure.telemetry import TelemetryClient
from custom_components.autosnooze.runtime.state import AutomationPauseData


@pytest.fixture
def telemetry_client(hass):
    entry = MagicMock()
    entry.options = {"telemetry_enabled": True}
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"install_id": "test-install-uuid"})
    store.async_save = AsyncMock(return_value=None)
    hass.async_create_task = MagicMock()
    return TelemetryClient(hass, entry, store)


def test_report_telemetry_schema_accepts_null_optional_fields() -> None:
    """HA service UI / callService often sends null for empty optionals."""
    assert REPORT_TELEMETRY_SCHEMA(
        {
            "event": "card_viewed",
            "source": "card",
            "card_type": "full",
            "properties": None,
        }
    ) == {
        "event": "card_viewed",
        "source": "card",
        "card_type": "full",
        "properties": None,
    }
    assert REPORT_TELEMETRY_SCHEMA(
        {
            "event": "card_viewed",
            "source": "card",
            "card_type": None,
        }
    ) == {
        "event": "card_viewed",
        "source": "card",
        "card_type": None,
    }


def test_report_telemetry_schema_still_rejects_non_dict_properties() -> None:
    with pytest.raises(vol.Invalid):
        REPORT_TELEMETRY_SCHEMA(
            {
                "event": "card_viewed",
                "source": "card",
                "properties": "nope",
            }
        )


@pytest.mark.asyncio
async def test_report_telemetry_tracks_valid_card_event(hass, telemetry_client) -> None:
    await telemetry_client.async_setup()
    data = AutomationPauseData(telemetry=telemetry_client, hass=hass)
    call = MagicMock()
    call.data = {
        "event": "wake_clicked",
        "properties": {"scope": "one"},
        "source": "card",
    }

    await async_handle_report_telemetry(hass, data, call)

    assert len(telemetry_client._queue) == 1
    assert telemetry_client._queue[0]["type"] == "wake_clicked"
    assert telemetry_client._queue[0]["payload"]["scope"] == "one"


@pytest.mark.asyncio
async def test_report_telemetry_handles_null_properties_and_card_type(hass, telemetry_client) -> None:
    await telemetry_client.async_setup()
    data = AutomationPauseData(telemetry=telemetry_client, hass=hass)
    call = MagicMock()
    call.data = {
        "event": "selection_feature_used",
        "properties": None,
        "source": "card",
        "card_type": None,
    }

    await async_handle_report_telemetry(hass, data, call)

    assert len(telemetry_client._queue) == 1
    assert telemetry_client._queue[0]["type"] == "selection_feature_used"


@pytest.mark.asyncio
async def test_report_telemetry_noop_when_client_missing(hass) -> None:
    data = AutomationPauseData(telemetry=None, hass=hass)
    call = MagicMock()
    call.data = {"event": "wake_clicked", "properties": {"scope": "one"}, "source": "card"}

    await async_handle_report_telemetry(hass, data, call)


@pytest.mark.asyncio
async def test_report_telemetry_noop_when_disabled(hass, telemetry_client) -> None:
    await telemetry_client.async_setup()
    telemetry_client.entry.options = {"telemetry_enabled": False}
    data = AutomationPauseData(telemetry=telemetry_client, hass=hass)
    call = MagicMock()
    call.data = {"event": "wake_clicked", "properties": {"scope": "one"}, "source": "card"}

    await async_handle_report_telemetry(hass, data, call)

    assert telemetry_client._queue == []


@pytest.mark.asyncio
async def test_report_telemetry_noop_when_event_not_string(hass, telemetry_client) -> None:
    await telemetry_client.async_setup()
    data = AutomationPauseData(telemetry=telemetry_client, hass=hass)
    call = MagicMock()
    call.data = {"event": 123, "source": "card"}

    await async_handle_report_telemetry(hass, data, call)

    assert telemetry_client._queue == []


@pytest.mark.asyncio
async def test_report_telemetry_ignores_non_dict_properties(hass, telemetry_client) -> None:
    await telemetry_client.async_setup()
    data = AutomationPauseData(telemetry=telemetry_client, hass=hass)
    call = MagicMock()
    call.data = {
        "event": "selection_feature_used",
        "properties": "not-a-dict",
        "source": "card",
    }

    await async_handle_report_telemetry(hass, data, call)

    assert len(telemetry_client._queue) == 1
    assert telemetry_client._queue[0]["type"] == "selection_feature_used"


@pytest.mark.asyncio
async def test_report_telemetry_coerces_bad_source_and_card_type(hass, telemetry_client) -> None:
    await telemetry_client.async_setup()
    data = AutomationPauseData(telemetry=telemetry_client, hass=hass)
    call = MagicMock()
    call.data = {
        "event": "card_viewed",
        "source": 99,
        "card_type": 12,
    }

    await async_handle_report_telemetry(hass, data, call)

    # Bad card_type becomes None → sanitize rejects card_viewed without card_type.
    assert telemetry_client._queue == []
