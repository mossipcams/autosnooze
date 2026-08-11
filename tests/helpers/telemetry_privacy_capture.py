"""Drive TelemetryClient and capture outbound TelemetryDeck payloads for privacy CI."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from custom_components.autosnooze.application.report_telemetry import (  # noqa: E402
    async_handle_report_telemetry,
)
from custom_components.autosnooze.infrastructure.telemetry import (  # noqa: E402
    EVENT_SCHEMAS,
    TELEMETRY_INGEST_URL,
    TelemetryClient,
)
from custom_components.autosnooze.runtime.state import AutomationPauseData  # noqa: E402

FIXED_AUTOSNOOZE_VERSION = "0.2.27"
FIXED_HA_VERSION = "2024.1.0-test"
FIXED_INSTALL_ID = "privacy-test-install-id"

CANARY_STRINGS = [
    "automation.guest_private_bedroom",
    "Guest's Private Bedroom",
    "guest@example.com",
    "https://private-home.example.com",
    "192.168.1.45",
    "private-user-id-12345",
    "private-config-entry-67890",
]

CANARY_PROPERTIES: dict[str, Any] = {
    "entity_id": "automation.guest_private_bedroom",
    "friendly_name": "Guest's Private Bedroom",
    "user_id": "private-user-id-12345",
    "config_entry_id": "private-config-entry-67890",
    "area_id": "private-bedroom-area",
    "device_id": "private-bedroom-device",
    "latitude": "37.7749",
    "longitude": "-122.4194",
    "install_id": "private-install-leak",
    "clientUser": "private-client-user-leak",
    "user_email": "guest@example.com",
    "ha_url": "https://private-home.example.com",
    "ip_address": "192.168.1.45",
}

FORBIDDEN_PAYLOAD_FIELDS = frozenset(
    {
        "entity_id",
        "friendly_name",
        "user_id",
        "config_entry_id",
        "area_id",
        "device_id",
        "latitude",
        "longitude",
        "install_id",
        "clientUser",
    }
)

STANDARD_PAYLOAD_KEYS = frozenset(
    {
        "autosnooze_version",
        "home_assistant_version",
        "event_schema_version",
        "source",
    }
)

CARD_REPORT_EVENTS: dict[str, dict[str, Any]] = {
    "card_viewed": {"properties": {}, "source": "card", "card_type": "full"},
    "selection_feature_used": {"properties": {"method": "all"}, "source": "card"},
    "duration_option_selected": {"properties": {"method": "preset"}, "source": "card"},
    "confirmation_result": {"properties": {"result": "confirmed"}, "source": "card"},
    "snooze_created": {
        "properties": {
            "strategy": "duration",
            "input_method": "card",
            "duration_minutes": 30,
            "target_count": 1,
            "notification_trigger": "none",
            "notification_lead_minutes": 0,
            "confirmation_used": False,
        },
        "source": "card",
    },
}

TRACK_EVENTS: dict[str, dict[str, Any]] = {
    "integration_active": {"properties": {}, "source": "startup"},
    "scheduled_snooze_created": {
        "properties": {
            "minutes_until_start": 60,
            "planned_duration_minutes": 120,
            "target_count": 2,
            "resume_local_hour": 7,
        },
        "source": "service",
    },
    "scheduled_snooze_started": {
        "properties": {"target_count": 2, "planned_duration_minutes": 120},
        "source": "timer",
    },
    "snooze_adjusted": {
        "properties": {"delta_minutes": 15, "direction": "extend"},
        "source": "card",
    },
    "snooze_ended": {"properties": {"reason": "expired"}, "source": "timer"},
    "scheduled_snooze_cancelled": {
        "properties": {"target_count": 1, "minutes_before_start": 30},
        "source": "service",
    },
    "notification_used": {"properties": {"trigger": "start"}, "source": "card"},
    "notification_cleared": {"properties": {"target_count": 1}, "source": "service"},
    "operation_failed": {
        "properties": {
            "operation": "pause_automations",
            "error_code": "unknown",
            "strategy": "duration",
            "target_count": 1,
        },
        "source": "service",
    },
}


def _polluted_properties(base: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    merged.update(CANARY_PROPERTIES)
    return merged


def _allowed_payload_keys(event: str) -> frozenset[str]:
    return STANDARD_PAYLOAD_KEYS | EVENT_SCHEMAS[event]


def _scan_payload(event: str, payload: dict[str, Any]) -> tuple[list[str], list[str]]:
    undocumented: list[str] = []
    forbidden: list[str] = []
    allowed = _allowed_payload_keys(event)
    if event == "card_viewed":
        allowed = allowed | {"card_type"}
    for key in payload:
        if key not in allowed:
            undocumented.append(f"{event}.{key}")
        if key in FORBIDDEN_PAYLOAD_FIELDS:
            forbidden.append(f"{event}.{key}")
    return undocumented, forbidden


def _scan_canaries(text: str) -> list[str]:
    return [canary for canary in CANARY_STRINGS if canary in text]


def _make_post_mock(captured_posts: list[dict[str, Any]]) -> MagicMock:
    def mock_post(url: str, *, json: list[dict[str, Any]], timeout: float) -> MagicMock:
        captured_posts.append({"url": url, "json": json})
        response = MagicMock()
        response.status = 200
        response.__aenter__ = AsyncMock(return_value=response)
        response.__aexit__ = AsyncMock(return_value=None)
        return response

    session = MagicMock()
    session.post = MagicMock(side_effect=mock_post)
    return session


async def _build_client(*, enabled: bool) -> tuple[TelemetryClient, list[dict[str, Any]]]:
    captured_posts: list[dict[str, Any]] = []
    hass = MagicMock()
    hass.async_create_task = MagicMock()
    entry = MagicMock()
    entry.options = {"telemetry_enabled": enabled}
    store = MagicMock()
    store.async_load = AsyncMock(return_value={"install_id": FIXED_INSTALL_ID, "last_card_viewed_day": None})
    store.async_save = AsyncMock(return_value=None)

    with (
        patch(
            "custom_components.autosnooze.infrastructure.telemetry.async_get_clientsession",
            return_value=_make_post_mock(captured_posts),
        ),
        patch(
            "custom_components.autosnooze.infrastructure.telemetry.VERSION",
            FIXED_AUTOSNOOZE_VERSION,
        ),
        patch(
            "custom_components.autosnooze.infrastructure.telemetry._ha_version",
            return_value=FIXED_HA_VERSION,
        ),
    ):
        client = TelemetryClient(hass, entry, store)
        await client.async_setup()
        client._last_card_viewed_day = None
        return client, captured_posts


async def _flush_posts(client: TelemetryClient, captured_posts: list[dict[str, Any]]) -> None:
    with (
        patch(
            "custom_components.autosnooze.infrastructure.telemetry.async_get_clientsession",
            return_value=_make_post_mock(captured_posts),
        ),
        patch(
            "custom_components.autosnooze.infrastructure.telemetry.VERSION",
            FIXED_AUTOSNOOZE_VERSION,
        ),
        patch(
            "custom_components.autosnooze.infrastructure.telemetry._ha_version",
            return_value=FIXED_HA_VERSION,
        ),
    ):
        await client.async_flush()


async def _exercise_report_telemetry(
    client: TelemetryClient,
    hass: MagicMock,
    event: str,
    spec: dict[str, Any],
) -> None:
    data = AutomationPauseData(telemetry=client, hass=hass)
    call = MagicMock()
    call.data = {
        "event": event,
        "properties": _polluted_properties(spec.get("properties", {})),
        "source": spec["source"],
    }
    card_type = spec.get("card_type")
    if card_type is not None:
        call.data["card_type"] = card_type
        call.data["friendly_name"] = CANARY_PROPERTIES["friendly_name"]
    await async_handle_report_telemetry(hass, data, call)


async def capture() -> dict[str, Any]:
    payloads: dict[str, dict[str, str]] = {}
    captured_posts: list[dict[str, Any]] = []
    undocumented_fields: list[str] = []
    forbidden_fields: list[str] = []
    canary_hits: list[str] = []

    client, captured_posts = await _build_client(enabled=True)
    hass = client.hass

    with (
        patch(
            "custom_components.autosnooze.infrastructure.telemetry.VERSION",
            FIXED_AUTOSNOOZE_VERSION,
        ),
        patch(
            "custom_components.autosnooze.infrastructure.telemetry._ha_version",
            return_value=FIXED_HA_VERSION,
        ),
    ):
        for event, spec in CARD_REPORT_EVENTS.items():
            await _exercise_report_telemetry(client, hass, event, spec)
            await _flush_posts(client, captured_posts)

        for event, spec in TRACK_EVENTS.items():
            polluted = _polluted_properties(spec.get("properties", {}))
            client.track(
                event,
                polluted,
                source=spec["source"],
                card_type=spec.get("card_type"),
            )
            await _flush_posts(client, captured_posts)

    disabled_posts: list[dict[str, Any]] = []
    disabled_client, disabled_posts = await _build_client(enabled=False)
    disabled_client.entry.options = {"telemetry_enabled": False}
    disabled_hass = disabled_client.hass

    with (
        patch(
            "custom_components.autosnooze.infrastructure.telemetry.VERSION",
            FIXED_AUTOSNOOZE_VERSION,
        ),
        patch(
            "custom_components.autosnooze.infrastructure.telemetry._ha_version",
            return_value=FIXED_HA_VERSION,
        ),
    ):
        for event, spec in CARD_REPORT_EVENTS.items():
            await _exercise_report_telemetry(disabled_client, disabled_hass, event, spec)
            await _flush_posts(disabled_client, disabled_posts)
        for event, spec in TRACK_EVENTS.items():
            disabled_client.track(
                event,
                _polluted_properties(spec.get("properties", {})),
                source=spec["source"],
                card_type=spec.get("card_type"),
            )
            await _flush_posts(disabled_client, disabled_posts)

    for post in captured_posts:
        assert post["url"] == TELEMETRY_INGEST_URL
        for signal in post["json"]:
            event = signal["type"]
            payload = signal["payload"]
            payloads[event] = payload
            event_undocumented, event_forbidden = _scan_payload(event, payload)
            undocumented_fields.extend(event_undocumented)
            forbidden_fields.extend(event_forbidden)
            canary_hits.extend(_scan_canaries(json.dumps(payload)))
            assert "clientUser" not in payload
            assert signal.get("clientUser")

    events_exercised = len(CARD_REPORT_EVENTS) + len(TRACK_EVENTS)

    return {
        "payloads": payloads,
        "meta": {
            "events_exercised": events_exercised,
            "outbound_requests": len(captured_posts),
            "telemetry_requests_while_disabled": len(disabled_posts),
            "undocumented_fields": len(undocumented_fields),
            "forbidden_ha_fields": len(forbidden_fields),
            "canary_hits": sorted(set(canary_hits)),
            "undocumented_field_names": sorted(set(undocumented_fields)),
            "forbidden_field_names": sorted(set(forbidden_fields)),
            "autosnooze_version": FIXED_AUTOSNOOZE_VERSION,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--write-golden",
        type=Path,
        help="Write payload map to docs/telemetry-payloads.json",
    )
    args = parser.parse_args()
    result = asyncio.run(capture())
    if args.write_golden:
        args.write_golden.parent.mkdir(parents=True, exist_ok=True)
        args.write_golden.write_text(
            json.dumps(result["payloads"], indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    json.dump(result, sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
