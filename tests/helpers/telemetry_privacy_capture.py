"""Drive TelemetryClient and capture PostHog capture calls for privacy CI."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
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
    TelemetryClient,
)
from custom_components.autosnooze.runtime.state import AutomationPauseData  # noqa: E402

FIXED_AUTOSNOOZE_VERSION = "0.2.27"
FIXED_HA_VERSION = "2024.1.0-test"
FIXED_INSTALL_ID = "privacy-test-install-id"
EXPECTED_DISTINCT_ID = hashlib.sha256(FIXED_INSTALL_ID.encode("utf-8")).hexdigest()

APPROVED_CAPTURE_KWARGS = frozenset({"distinct_id", "properties", "disable_geoip"})

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
    "$set": {"autosnooze_version": "evil"},
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
        "distinct_id",
        "$ip",
    }
)

STANDARD_PAYLOAD_KEYS = frozenset({"source"})

SET_PAYLOAD_KEYS = frozenset(
    {
        "autosnooze_version",
        "home_assistant_version",
        "event_schema_version",
    }
)

SET_ONCE_PAYLOAD_KEYS = frozenset(
    {
        "initial_autosnooze_version",
        "initial_home_assistant_version",
    }
)

CARD_REPORT_EVENTS: dict[str, dict[str, Any]] = {
    "card_viewed": {"properties": {}, "source": "card", "card_type": "full"},
    "selection_feature_used": {"properties": {"target_count": 3}, "source": "card"},
    "duration_option_selected": {"properties": {"duration_minutes": 30}, "source": "card"},
    "confirmation_result": {"properties": {"target_count": 2}, "source": "card"},
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
    "snooze_button_clicked": {
        "properties": {"target_count": 2, "schedule_mode": False, "until_tomorrow": True},
        "source": "card",
    },
    "wake_clicked": {"properties": {"scope": "one"}, "source": "card"},
    "adjust_opened": {"properties": {"scope": "one"}, "source": "card"},
    "adjust_option_selected": {
        "properties": {"direction": "extend", "delta_minutes": 15},
        "source": "card",
    },
    "scheduled_cancel_clicked": {"properties": {"target_count": 1}, "source": "card"},
    "filter_tab_selected": {"properties": {"tab": "areas"}, "source": "card"},
    "hide_snoozed_toggled": {"properties": {"enabled": True}, "source": "card"},
    "schedule_mode_toggled": {"properties": {"enabled": True}, "source": "card"},
    "until_tomorrow_selected": {"properties": {}, "source": "card"},
    "custom_duration_toggled": {"properties": {"enabled": True}, "source": "card"},
    "notification_options_changed": {
        "properties": {"trigger": "start", "enabled": True, "notification_lead_minutes": 15},
        "source": "card",
    },
    "confirmation_dismissed": {"properties": {"target_count": 1}, "source": "card"},
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
        "properties": {"delta_minutes": 15, "direction": "extend", "target_count": 2},
        "source": "card",
    },
    "snooze_ended": {"properties": {"reason": "timer"}, "source": "timer"},
    "scheduled_snooze_cancelled": {
        "properties": {"target_count": 1, "minutes_before_start": 30},
        "source": "service",
    },
    "notification_used": {"properties": {"trigger": "start"}, "source": "card"},
    "notification_cleared": {"properties": {"target_count": 1}, "source": "service"},
    "operation_failed": {
        "properties": {
            "operation": "pause",
            "error_code": "unknown",
            "strategy": "duration",
            "target_count": 1,
        },
        "source": "service",
    },
}

EXPECTED_EVENT_COUNT = len(EVENT_SCHEMAS)


def _polluted_properties(base: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    merged.update(CANARY_PROPERTIES)
    return merged


def _allowed_payload_keys(event: str) -> frozenset[str]:
    return STANDARD_PAYLOAD_KEYS | EVENT_SCHEMAS[event] | {"$set", "$set_once"}


def _scan_set_payload(prefix: str, payload: dict[str, Any], allowed_keys: frozenset[str]) -> list[str]:
    undocumented: list[str] = []
    if not isinstance(payload, dict):
        return [prefix]
    for key in payload:
        if key not in allowed_keys:
            undocumented.append(f"{prefix}.{key}")
    return undocumented


def _scan_payload(event: str, payload: dict[str, Any]) -> tuple[list[str], list[str]]:
    undocumented: list[str] = []
    forbidden: list[str] = []
    allowed = _allowed_payload_keys(event)
    for key in payload:
        if key not in allowed:
            undocumented.append(f"{event}.{key}")
        if key in FORBIDDEN_PAYLOAD_FIELDS:
            forbidden.append(f"{event}.{key}")
    if "$set" in payload:
        undocumented.extend(_scan_set_payload(f"{event}.$set", payload["$set"], SET_PAYLOAD_KEYS))
    if "$set_once" in payload:
        undocumented.extend(_scan_set_payload(f"{event}.$set_once", payload["$set_once"], SET_ONCE_PAYLOAD_KEYS))
    return undocumented, forbidden


def _scan_canaries(text: str) -> list[str]:
    return [canary for canary in CANARY_STRINGS if canary in text]


def _make_capture_recorder(
    captured: list[dict[str, Any]],
    capture_violations: list[str],
) -> MagicMock:
    def record_capture(*args: Any, **kwargs: Any) -> None:
        if len(args) != 1 or not isinstance(args[0], str):
            capture_violations.append(f"unexpected capture positional args: {args!r}")
            return
        if "event" in kwargs:
            capture_violations.append("capture must not pass event as keyword")
            return
        extra_kwargs = set(kwargs) - APPROVED_CAPTURE_KWARGS
        if extra_kwargs:
            capture_violations.append(f"unexpected capture kwargs: {sorted(extra_kwargs)}")
            return
        event = args[0]
        distinct_id = kwargs.get("distinct_id")
        properties = kwargs.get("properties")
        disable_geoip = kwargs.get("disable_geoip")
        if distinct_id is None:
            capture_violations.append(f"{event}: missing distinct_id")
            return
        if properties is None:
            capture_violations.append(f"{event}: missing properties")
            return
        if disable_geoip is None:
            capture_violations.append(f"{event}: missing disable_geoip")
            return
        captured.append(
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
    return mock_posthog


async def _build_client(
    *,
    enabled: bool,
    capture_violations: list[str],
) -> tuple[TelemetryClient, list[dict[str, Any]]]:
    captured: list[dict[str, Any]] = []
    mock_posthog = _make_capture_recorder(captured, capture_violations)
    hass = MagicMock()
    hass.async_create_task = MagicMock()
    entry = MagicMock()
    entry.options = {"telemetry_enabled": enabled}
    store = MagicMock()
    store.async_load = AsyncMock(
        return_value={
            "install_id": FIXED_INSTALL_ID,
            "last_card_viewed_day": None,
            "last_integration_active_day": None,
        }
    )
    store.async_save = AsyncMock(return_value=None)

    with (
        patch(
            "custom_components.autosnooze.infrastructure.telemetry.Posthog",
            return_value=mock_posthog,
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
        client._last_integration_active_day = None
        return client, captured


async def _exercise_report_telemetry(
    client: TelemetryClient,
    hass: MagicMock,
    event: str,
    spec: dict[str, Any],
    *,
    properties: dict[str, Any],
) -> None:
    data = AutomationPauseData(telemetry=client, hass=hass)
    call = MagicMock()
    call.data = {
        "event": event,
        "properties": properties,
        "source": spec["source"],
    }
    card_type = spec.get("card_type")
    if card_type is not None:
        call.data["card_type"] = card_type
    await async_handle_report_telemetry(hass, data, call)


async def capture() -> dict[str, Any]:
    payloads: dict[str, dict[str, Any]] = {}
    captured: list[dict[str, Any]] = []
    undocumented_fields: list[str] = []
    forbidden_fields: list[str] = []
    canary_hits: list[str] = []
    capture_violations: list[str] = []
    distinct_id_mismatches: list[str] = []
    disable_geoip_violations: list[str] = []
    extra_keys_reject_failures: list[str] = []

    client, captured = await _build_client(enabled=True, capture_violations=capture_violations)
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
            await _exercise_report_telemetry(
                client,
                hass,
                event,
                spec,
                properties=dict(spec.get("properties", {})),
            )

        for event, spec in TRACK_EVENTS.items():
            client.track(
                event,
                dict(spec.get("properties", {})),
                source=spec["source"],
                card_type=spec.get("card_type"),
            )

        golden_count = len(captured)
        client._last_card_viewed_day = None
        client._last_integration_active_day = None

        for event, spec in CARD_REPORT_EVENTS.items():
            before = len(captured)
            await _exercise_report_telemetry(
                client,
                hass,
                event,
                spec,
                properties=_polluted_properties(spec.get("properties", {})),
            )
            if len(captured) != before:
                extra_keys_reject_failures.append(event)

        for event, spec in TRACK_EVENTS.items():
            before = len(captured)
            client.track(
                event,
                _polluted_properties(spec.get("properties", {})),
                source=spec["source"],
                card_type=spec.get("card_type"),
            )
            if len(captured) != before:
                extra_keys_reject_failures.append(event)

        extra_keys_rejected = len(extra_keys_reject_failures) == 0

        rejected_before = len(captured)
        client.track(
            "snooze_created",
            {
                "strategy": "duration",
                "input_method": CANARY_STRINGS[0],
                "duration_minutes": 30,
                "target_count": 1,
                "notification_trigger": "none",
                "notification_lead_minutes": 0,
                "confirmation_used": False,
            },
            source="card",
        )
        rejected_after = len(captured)

    disabled_capture_violations: list[str] = []
    disabled_client, disabled_captured = await _build_client(
        enabled=False,
        capture_violations=disabled_capture_violations,
    )
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
            await _exercise_report_telemetry(
                disabled_client,
                disabled_hass,
                event,
                spec,
                properties=dict(spec.get("properties", {})),
            )
        for event, spec in TRACK_EVENTS.items():
            disabled_client.track(
                event,
                dict(spec.get("properties", {})),
                source=spec["source"],
                card_type=spec.get("card_type"),
            )

    for call in captured:
        canary_hits.extend(_scan_canaries(json.dumps(call)))
        if call.get("disable_geoip") is not True:
            disable_geoip_violations.append(str(call.get("disable_geoip")))
        if call.get("distinct_id") != EXPECTED_DISTINCT_ID:
            distinct_id_mismatches.append(str(call.get("distinct_id")))
        if FIXED_INSTALL_ID in json.dumps(call):
            canary_hits.append(FIXED_INSTALL_ID)
        event = call["event"]
        payload = call["properties"]
        payloads[event] = payload
        event_undocumented, event_forbidden = _scan_payload(event, payload)
        undocumented_fields.extend(event_undocumented)
        forbidden_fields.extend(event_forbidden)
        canary_hits.extend(_scan_canaries(json.dumps(payload)))
        assert "clientUser" not in payload
        assert "distinct_id" not in payload
        assert "install_id" not in payload
        assert call.get("distinct_id")

    events_exercised = len(CARD_REPORT_EVENTS) + len(TRACK_EVENTS)

    return {
        "payloads": payloads,
        "meta": {
            "events_exercised": events_exercised,
            "expected_event_count": EXPECTED_EVENT_COUNT,
            "outbound_requests": len(captured),
            "golden_capture_count": golden_count,
            "telemetry_requests_while_disabled": len(disabled_captured),
            "undocumented_fields": len(undocumented_fields),
            "forbidden_ha_fields": len(forbidden_fields),
            "canary_hits": sorted(set(canary_hits)),
            "capture_violations": sorted(set(capture_violations)),
            "distinct_id_mismatches": sorted(set(distinct_id_mismatches)),
            "disable_geoip_violations": sorted(set(disable_geoip_violations)),
            "allowed_key_canary_rejected": rejected_after == rejected_before,
            "extra_keys_rejected": extra_keys_rejected,
            "extra_keys_reject_failures": sorted(extra_keys_reject_failures),
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
