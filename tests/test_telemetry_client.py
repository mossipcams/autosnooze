"""Tests for TelemetryClient behavior."""

from __future__ import annotations

import hashlib
import asyncio
from queue import Queue
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.exceptions import ServiceValidationError

from custom_components.autosnooze.infrastructure.telemetry import (
    TelemetryClient,
    _filter_posthog_message,
)


def test_posthog_wire_filter_removes_sdk_context() -> None:
    message = {
        "event": "integration_active",
        "properties": {
            "source": "startup",
            "$os": "Linux",
            "$python_version": "3.13.0",
            "$lib": "posthog-python",
            "$is_server": True,
        },
    }

    filtered = _filter_posthog_message(message)

    assert filtered is not None
    assert filtered["properties"] == {"source": "startup"}


def test_posthog_wire_filter_keeps_geoip_disable_flag() -> None:
    message = {
        "event": "snooze_created",
        "properties": {
            "source": "card",
            "strategy": "duration",
            "duration_minutes": 30,
            "target_count": 1,
            "$geoip_disable": True,
            "$os": "Linux",
            "$lib": "posthog-python",
            "$geoip_city_name": "Quincy",
        },
    }

    filtered = _filter_posthog_message(message)

    assert filtered is not None
    assert filtered["properties"]["$geoip_disable"] is True
    assert "$os" not in filtered["properties"]
    assert "$lib" not in filtered["properties"]
    assert "$geoip_city_name" not in filtered["properties"]


@pytest.mark.asyncio
async def test_async_unload_discards_queued_posthog_events_after_opt_out() -> None:
    class Consumer:
        def __init__(self) -> None:
            self.paused = False

        def pause(self) -> None:
            self.paused = True

    class Lane:
        def __init__(self) -> None:
            self.queue: Queue[dict[str, Any]] = Queue()
            self.consumers = [Consumer()]
            self.closed = False

        def close(self) -> None:
            self.closed = True

    class PostHog:
        def __init__(self) -> None:
            self.disabled = False
            self._analytics_lane = Lane()
            self._lanes = [self._analytics_lane]
            self.shutdown_called = False

        def shutdown(self) -> None:
            self.shutdown_called = True

    posthog = PostHog()
    posthog._analytics_lane.queue.put({"event": "queued_before_opt_out"})

    async def executor_job(callback: Any) -> None:
        callback()

    hass = MagicMock()
    hass.async_add_executor_job = executor_job
    client = TelemetryClient(
        hass,
        MagicMock(options={"telemetry_enabled": True}),
        MagicMock(),
        _posthog=posthog,
    )

    await client.async_unload()

    assert posthog._analytics_lane.closed is True
    assert posthog._analytics_lane.consumers[0].paused is True
    assert posthog._analytics_lane.queue.empty()
    assert posthog.shutdown_called is True


@pytest.fixture
def captured_captures():
    captures: list[dict[str, Any]] = []

    def record_capture(
        event: str,
        *,
        distinct_id: str | None = None,
        properties: dict[str, Any] | None = None,
        disable_geoip: bool | None = None,
        **_kwargs: Any,
    ) -> None:
        captures.append(
            {
                "event": event,
                "distinct_id": distinct_id,
                "properties": properties,
                "disable_geoip": disable_geoip,
            }
        )

    mock_posthog = MagicMock()
    mock_posthog.capture = MagicMock(side_effect=record_capture)
    mock_posthog.disabled = False

    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.Posthog",
        return_value=mock_posthog,
    ):
        yield captures, mock_posthog


@pytest.fixture
def telemetry_client(hass, captured_captures):
    _captures, _mock_posthog = captured_captures
    entry = MagicMock()
    entry.options = {"telemetry_enabled": True}
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"install_id": "test-install-uuid"})
    store.async_save = AsyncMock(return_value=None)
    hass.async_create_task = MagicMock()
    client = TelemetryClient(hass, entry, store)
    return client


@pytest.mark.asyncio
async def test_disabled_client_is_noop(telemetry_client, captured_captures) -> None:
    captures, mock_posthog = captured_captures
    telemetry_client.entry.options = {"telemetry_enabled": False}
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    assert captures == []
    mock_posthog.capture.assert_not_called()


@pytest.mark.asyncio
async def test_client_hashes_install_id_for_distinct_id(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    assert len(captures) == 1
    assert captures[0]["distinct_id"] == hashlib.sha256(b"test-install-uuid").hexdigest()
    assert "clientUser" not in captures[0]
    assert "appID" not in captures[0]
    assert "payload" not in captures[0]


@pytest.mark.asyncio
async def test_install_id_never_in_properties(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
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
    properties = captures[0]["properties"]
    assert properties is not None
    assert "test-install-uuid" not in str(properties)
    assert "install_id" not in properties


@pytest.mark.asyncio
async def test_capture_called_with_disable_geoip(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    assert captures[0]["disable_geoip"] is True


@pytest.mark.asyncio
async def test_every_event_includes_set_person_properties(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    telemetry_client.track("wake_clicked", {"scope": "one"}, source="card")
    for capture in captures:
        properties = capture["properties"]
        assert properties is not None
        assert "$set" in properties
        assert "$set_once" in properties
        assert "autosnooze_version" not in properties
        assert "home_assistant_version" not in properties
        assert "event_schema_version" not in properties
        assert properties["$set"]["event_schema_version"] == "3"
        assert properties["$set_once"]["initial_autosnooze_version"] == properties["$set"]["autosnooze_version"]
        assert properties["$set_once"]["initial_home_assistant_version"] == properties["$set"]["home_assistant_version"]


@pytest.mark.asyncio
async def test_card_supplied_set_rejects_event(telemetry_client, captured_captures) -> None:
    captures, mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track(
        "wake_clicked",
        {"scope": "one", "$set": {"autosnooze_version": "evil"}, "$set_once": {"initial_autosnooze_version": "evil"}},
        source="card",
    )
    assert captures == []
    mock_posthog.capture.assert_not_called()


@pytest.mark.asyncio
async def test_integration_active_throttled_once_per_day(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    telemetry_client.track("integration_active", {}, source="startup")
    assert len(captures) == 1


@pytest.mark.asyncio
async def test_card_viewed_throttled_once_per_day(hass, telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("card_viewed", {"card_type": "full"}, source="card", card_type="full")
    telemetry_client.track("card_viewed", {"card_type": "full"}, source="card", card_type="full")
    assert len(captures) == 1


def test_track_does_not_raise_when_sanitize_fails(telemetry_client) -> None:
    telemetry_client.track("not_real", {"entity_id": "automation.secret"}, source="card")


def test_track_does_not_raise_when_sanitize_raises(telemetry_client) -> None:
    with patch(
        "custom_components.autosnooze.infrastructure.telemetry.sanitize_event_properties",
        side_effect=RuntimeError("boom"),
    ):
        telemetry_client.track("integration_active", {}, source="startup")


@pytest.mark.asyncio
async def test_invalid_daily_event_does_not_consume_throttle(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()

    telemetry_client.track("card_viewed", {}, source="card", card_type="invalid")
    telemetry_client.track("card_viewed", {"card_type": "full"}, source="card", card_type="full")

    assert len(captures) == 1
    assert captures[0]["event"] == "card_viewed"


@pytest.mark.asyncio
async def test_posthog_failure_does_not_consume_throttle(telemetry_client, captured_captures) -> None:
    captures, mock_posthog = captured_captures
    await telemetry_client.async_setup()
    mock_posthog.capture.side_effect = [RuntimeError("offline"), None]

    telemetry_client.track("integration_active", {}, source="startup")
    telemetry_client.track("integration_active", {}, source="startup")

    assert mock_posthog.capture.call_count == 2
    assert len(captures) == 0


@pytest.mark.asyncio
async def test_throttle_persistence_normalizes_corrupt_storage(telemetry_client) -> None:
    telemetry_client._install_id = "test-install-id"
    telemetry_client.store.async_load = AsyncMock(return_value="corrupt")
    telemetry_client.store.async_save = AsyncMock()

    await telemetry_client._persist_throttle_day("last_card_viewed_day", "2026-08-13")

    telemetry_client.store.async_save.assert_awaited_once_with(
        {
            "last_card_viewed_day": "2026-08-13",
            "install_id": telemetry_client._install_id,
        }
    )


@pytest.mark.asyncio
async def test_throttle_persistence_swallows_load_failure(telemetry_client) -> None:
    telemetry_client.store.async_load = AsyncMock(side_effect=OSError("offline"))

    await telemetry_client._persist_throttle_day("last_card_viewed_day", "2026-08-13")


@pytest.mark.asyncio
async def test_concurrent_throttle_persistence_preserves_both_keys(telemetry_client) -> None:
    stored: dict[str, Any] = {"install_id": telemetry_client._install_id}

    async def load() -> dict[str, Any]:
        return dict(stored)

    async def save(value: dict[str, Any]) -> None:
        stored.clear()
        stored.update(value)

    telemetry_client.store.async_load = load
    telemetry_client.store.async_save = save

    await asyncio.gather(
        telemetry_client._persist_throttle_day("last_card_viewed_day", "2026-08-13"),
        telemetry_client._persist_throttle_day("last_integration_active_day", "2026-08-13"),
    )

    assert stored == {
        "install_id": telemetry_client._install_id,
        "last_card_viewed_day": "2026-08-13",
        "last_integration_active_day": "2026-08-13",
    }


@pytest.mark.asyncio
async def test_capture_does_not_raise_on_posthog_failure(telemetry_client, captured_captures) -> None:
    _captures, mock_posthog = captured_captures
    await telemetry_client.async_setup()
    mock_posthog.capture.side_effect = RuntimeError("boom")
    telemetry_client.track("integration_active", {}, source="startup")


@pytest.mark.asyncio
async def test_async_setup_disables_on_storage_failure(telemetry_client, captured_captures) -> None:
    captures, mock_posthog = captured_captures
    telemetry_client.store.async_load = AsyncMock(side_effect=OSError("disk full"))
    await telemetry_client.async_setup()
    assert telemetry_client._disabled is True
    telemetry_client.track("integration_active", {}, source="startup")
    assert captures == []
    mock_posthog.capture.assert_not_called()


@pytest.mark.asyncio
async def test_async_unload_disables_client_and_blocks_track(telemetry_client, captured_captures) -> None:
    captures, mock_posthog = captured_captures
    await telemetry_client.async_setup()
    telemetry_client.track("integration_active", {}, source="startup")
    assert len(captures) == 1

    telemetry_client.hass.async_add_executor_job = AsyncMock()
    await telemetry_client.async_unload()
    assert mock_posthog.disabled is True
    telemetry_client.hass.async_add_executor_job.assert_called_with(mock_posthog.shutdown)
    assert telemetry_client._posthog is None

    telemetry_client.track("integration_active", {}, source="startup")
    assert len(captures) == 1


@pytest.mark.asyncio
async def test_track_operation_failed_omits_invalid_strategy(telemetry_client, captured_captures) -> None:
    captures, _mock_posthog = captured_captures
    await telemetry_client.async_setup()
    error = ServiceValidationError("nope")
    error.translation_key = "invalid_duration"

    telemetry_client.track_operation_failed("pause", error, strategy="", target_count=2)
    properties = captures[0]["properties"]
    assert properties is not None
    assert properties["operation"] == "pause"
    assert properties["error_code"] == "invalid_duration"
    assert properties["target_count"] == 2
    assert "strategy" not in properties

    telemetry_client.track_operation_failed("pause", error, strategy="duration", target_count=1)
    assert captures[1]["properties"]["strategy"] == "duration"
