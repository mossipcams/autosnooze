"""Tests for TelemetryClient behavior."""

from __future__ import annotations

import hashlib
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from homeassistant.exceptions import ServiceValidationError

from custom_components.autosnooze.infrastructure.telemetry import TelemetryClient


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

    telemetry_client.hass.async_add_executor_job = MagicMock()
    telemetry_client.async_unload()
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
