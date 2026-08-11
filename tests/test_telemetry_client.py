"""Tests for TelemetryClient behavior."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from custom_components.autosnooze.infrastructure.telemetry import TelemetryClient


@pytest.fixture
def telemetry_client(hass):
    entry = MagicMock()
    entry.options = {"telemetry_enabled": True}
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"install_id": "test-install-uuid"})
    store.async_save = AsyncMock(return_value=None)
    hass.async_create_task = MagicMock()
    client = TelemetryClient(hass, entry, store)
    return client


@pytest.mark.asyncio
async def test_disabled_client_is_noop(telemetry_client) -> None:
    telemetry_client.entry.options = {"telemetry_enabled": False}
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    assert telemetry_client._queue == []


@pytest.mark.asyncio
async def test_client_hashes_install_id_for_client_user(telemetry_client) -> None:
    import hashlib

    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    assert len(telemetry_client._queue) == 1
    signal = telemetry_client._queue[0]
    assert signal["clientUser"] == hashlib.sha256(b"test-install-uuid").hexdigest()


@pytest.mark.asyncio
async def test_install_id_never_in_payload(telemetry_client) -> None:
    await telemetry_client.async_setup()
    telemetry_client.track(
        "snooze_created",
        {
            "strategy": "duration",
            "input_method": "card",
            "duration_minutes": 30,
            "target_count": 1,
            "notification_trigger": "none",
            "notification_lead_minutes": 0,
            "confirmation_used": False,
        },
        source="card",
    )
    payload = telemetry_client._queue[0]["payload"]
    assert "test-install-uuid" not in str(payload)
    assert "install_id" not in payload


@pytest.mark.asyncio
async def test_flush_discards_failures_silently(hass, telemetry_client) -> None:
    await telemetry_client.async_setup()
    telemetry_client._queue.append(
        {
            "appID": "test",
            "clientUser": "abc",
            "type": "integration_active",
            "payload": {"source": "startup"},
        }
    )

    session = MagicMock()
    response = MagicMock()
    response.status = 500
    response.__aenter__ = AsyncMock(return_value=response)
    response.__aexit__ = AsyncMock(return_value=None)
    session.post = MagicMock(return_value=response)

    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.async_get_clientsession",
        return_value=session,
    ):
        await telemetry_client.async_flush()

    assert telemetry_client._queue == []


@pytest.mark.asyncio
async def test_card_viewed_throttled_once_per_day(hass, telemetry_client) -> None:
    await telemetry_client.async_setup()
    telemetry_client.track("card_viewed", {"card_type": "full"}, source="card", card_type="full")
    telemetry_client.track("card_viewed", {"card_type": "full"}, source="card", card_type="full")
    assert len(telemetry_client._queue) == 1
