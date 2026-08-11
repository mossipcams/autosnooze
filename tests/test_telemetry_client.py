"""Tests for TelemetryClient behavior."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.exceptions import ServiceValidationError

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


def test_track_does_not_raise_when_sanitize_fails(telemetry_client) -> None:
    telemetry_client.track("not_real", {"entity_id": "automation.secret"}, source="card")


def test_track_does_not_raise_when_sanitize_raises(telemetry_client) -> None:
    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.sanitize_event_properties",
        side_effect=RuntimeError("boom"),
    ):
        telemetry_client.track("integration_active", {}, source="startup")


@pytest.mark.asyncio
async def test_async_flush_does_not_raise_on_hard_failure(telemetry_client) -> None:
    await telemetry_client.async_setup()
    telemetry_client._queue.append(
        {
            "appID": "test",
            "clientUser": "abc",
            "type": "integration_active",
            "payload": {"source": "startup"},
        }
    )

    with patch.object(telemetry_client, "_post_batch", side_effect=RuntimeError("boom")):
        await telemetry_client.async_flush()


@pytest.mark.asyncio
async def test_async_setup_disables_on_storage_failure(telemetry_client) -> None:
    telemetry_client.store.async_load = AsyncMock(side_effect=OSError("disk full"))
    await telemetry_client.async_setup()
    assert telemetry_client._disabled is True
    telemetry_client.track("integration_active", {}, source="startup")
    assert telemetry_client._queue == []


@pytest.mark.asyncio
async def test_track_debounces_flush_into_one_post(telemetry_client) -> None:
    import asyncio

    await telemetry_client.async_setup()
    tasks: list[asyncio.Task] = []

    def create_task(coro):
        task = asyncio.get_running_loop().create_task(coro)
        tasks.append(task)
        return task

    telemetry_client.hass.async_create_task = create_task

    with (
        patch.object(telemetry_client, "_post_batch", new_callable=AsyncMock) as post,
        patch(
            "custom_components.autosnooze.infrastructure.telemetry.asyncio.sleep",
            new_callable=AsyncMock,
        ),
    ):
        telemetry_client.track("integration_active", {}, source="startup")
        telemetry_client.track(
            "snooze_button_clicked",
            {"target_count": 1, "schedule_mode": False},
            source="card",
        )
        assert len(tasks) == 1
        await tasks[0]

    assert post.await_count == 1
    assert telemetry_client._queue == []


@pytest.mark.asyncio
async def test_async_unload_cancels_pending_flush_and_blocks_track(telemetry_client) -> None:
    await telemetry_client.async_setup()
    pending = MagicMock()
    pending.done.return_value = False
    telemetry_client.hass.async_create_task = MagicMock(return_value=pending)

    telemetry_client.track("integration_active", {}, source="startup")
    assert telemetry_client._queue
    assert telemetry_client._debounce_task is pending

    telemetry_client.async_unload()

    pending.cancel.assert_called_once()
    assert telemetry_client._queue == []
    assert telemetry_client._debounce_task is None
    assert telemetry_client._flush_scheduled is False

    telemetry_client.track("integration_active", {}, source="startup")
    assert telemetry_client._queue == []


@pytest.mark.asyncio
async def test_track_operation_failed_omits_invalid_strategy(telemetry_client) -> None:
    await telemetry_client.async_setup()
    error = ServiceValidationError("nope")
    error.translation_key = "invalid_duration"

    telemetry_client.track_operation_failed("pause", error, strategy="", target_count=2)
    payload = telemetry_client._queue[0]["payload"]
    assert payload["operation"] == "pause"
    assert payload["error_code"] == "invalid_duration"
    assert payload["target_count"] == "2"
    assert "strategy" not in payload

    telemetry_client._queue.clear()
    telemetry_client.track_operation_failed("pause", error, strategy="duration", target_count=1)
    assert telemetry_client._queue[0]["payload"]["strategy"] == "duration"
