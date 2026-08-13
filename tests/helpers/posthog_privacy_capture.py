"""Drive TelemetryClient and capture PostHog capture calls for privacy CI."""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
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
    EVENT_SCHEMA_VERSION,
    POSTHOG_HOST,
    POSTHOG_PROJECT_API_KEY,
    SOURCES,
    TelemetryClient,
)
from custom_components.autosnooze.runtime.state import AutomationPauseData  # noqa: E402

FIXED_AUTOSNOOZE_VERSION = "0.2.27"
FIXED_HA_VERSION = "2024.1.0-test"
FIXED_INSTALL_ID = "privacy-test-install-id"
EXPECTED_DISTINCT_ID = hashlib.sha256(FIXED_INSTALL_ID.encode("utf-8")).hexdigest()
DISTINCT_ID_PATTERN = re.compile(r"^[0-9a-f]{64}$")

APPROVED_CONSTRUCTOR_KWARGS: dict[str, Any] = {
    "host": POSTHOG_HOST,
    "disable_geoip": True,
    "enable_exception_autocapture": False,
    "enable_local_evaluation": False,
    "sync_mode": False,
}

APPROVED_CAPTURE_KWARGS = frozenset({"distinct_id", "properties", "disable_geoip"})

VERSION_BODY_KEYS = frozenset(
    {
        "autosnooze_version",
        "home_assistant_version",
        "event_schema_version",
        "initial_autosnooze_version",
        "initial_home_assistant_version",
    }
)

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

EXPECTED_SET_VALUES = {
    "autosnooze_version": FIXED_AUTOSNOOZE_VERSION,
    "home_assistant_version": FIXED_HA_VERSION,
    "event_schema_version": EVENT_SCHEMA_VERSION,
}

EXPECTED_SET_ONCE_VALUES = {
    "initial_autosnooze_version": FIXED_AUTOSNOOZE_VERSION,
    "initial_home_assistant_version": FIXED_HA_VERSION,
}

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
    "latitude": 37.7749,
    "longitude": -122.4194,
    "install_id": "private-install-leak",
    "clientUser": "private-client-user-leak",
    "user_email": "guest@example.com",
    "ha_url": "https://private-home.example.com",
    "ip_address": "192.168.1.45",
    "email": "guest@example.com",
    "$ip": "192.168.1.45",
    "$email": "guest@example.com",
    "$geoip_city_name": "San Francisco",
    "$set_once": {"evil": "payload"},
    "$groups": {"company": "evil-corp"},
    "$set": {"autosnooze_version": "evil"},
}

POLLUTED_CALL_DATA_EXTRAS = {
    "entity_id": "automation.guest_private_bedroom",
    "friendly_name": "Guest's Private Bedroom",
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
        "email",
        "name",
        "ip_address",
        "$ip",
        "$email",
        "$name",
        "$user_id",
        "$device_id",
        "$anon_distinct_id",
        "$session_id",
        "$groups",
        "$group_key",
        "$group_type",
        "$group_set",
        "$unset",
        "$geoip_city_name",
        "$geoip_country_code",
        "$current_url",
        "$host",
    }
)

STANDARD_PAYLOAD_KEYS = frozenset({"source"})

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


class PostHogSpy:
    def __init__(
        self,
        captured: list[dict[str, Any]],
        capture_violations: list[str],
        unexpected_sdk_calls: list[str],
    ) -> None:
        self._captured = captured
        self._capture_violations = capture_violations
        self._unexpected_sdk_calls = unexpected_sdk_calls
        self.disabled = False

    def capture(self, *args: Any, **kwargs: Any) -> None:
        if len(args) != 1 or not isinstance(args[0], str):
            self._capture_violations.append(f"unexpected capture positional args: {args!r}")
            return
        if "event" in kwargs:
            self._capture_violations.append("capture must not pass event as keyword")
            return
        extra_kwargs = set(kwargs) - APPROVED_CAPTURE_KWARGS
        if extra_kwargs:
            self._capture_violations.append(f"unexpected capture kwargs: {sorted(extra_kwargs)}")
            return
        event = args[0]
        distinct_id = kwargs.get("distinct_id")
        properties = kwargs.get("properties")
        disable_geoip = kwargs.get("disable_geoip")
        if distinct_id is None:
            self._capture_violations.append(f"{event}: missing distinct_id")
            return
        if properties is None:
            self._capture_violations.append(f"{event}: missing properties")
            return
        if disable_geoip is not True:
            self._capture_violations.append(f"{event}: disable_geoip must be True")
            return
        if distinct_id != EXPECTED_DISTINCT_ID:
            self._capture_violations.append(f"{event}: unexpected distinct_id")
            return
        if not DISTINCT_ID_PATTERN.fullmatch(distinct_id):
            self._capture_violations.append(f"{event}: distinct_id format invalid")
            return
        self._captured.append(
            {
                "event": event,
                "distinct_id": distinct_id,
                "properties": properties,
                "disable_geoip": disable_geoip,
            }
        )

    def shutdown(self) -> None:
        return None

    def __getattr__(self, name: str) -> Any:
        def _record_unexpected(*_args: Any, **_kwargs: Any) -> None:
            self._unexpected_sdk_calls.append(name)

        return _record_unexpected


def _validate_constructor(args: tuple[Any, ...], kwargs: dict[str, Any]) -> list[str]:
    violations: list[str] = []
    if args != (POSTHOG_PROJECT_API_KEY,):
        violations.append(f"unexpected constructor args: {args!r}")
    expected_keys = set(APPROVED_CONSTRUCTOR_KWARGS)
    actual_keys = set(kwargs)
    if actual_keys != expected_keys:
        missing = sorted(expected_keys - actual_keys)
        extra = sorted(actual_keys - expected_keys)
        if missing:
            violations.append(f"constructor missing kwargs: {missing}")
        if extra:
            violations.append(f"constructor extra kwargs: {extra}")
    for key, expected in APPROVED_CONSTRUCTOR_KWARGS.items():
        if kwargs.get(key) != expected:
            violations.append(f"constructor kwarg {key}={kwargs.get(key)!r} expected {expected!r}")
    return violations


def _is_allowed_scalar(value: Any) -> bool:
    if isinstance(value, bool):
        return True
    if isinstance(value, int) and not isinstance(value, bool):
        return True
    return isinstance(value, str)


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


def _scan_reserved_keys(payload: Any, prefix: str = "") -> list[str]:
    hits: list[str] = []
    if not isinstance(payload, dict):
        return hits
    for key, value in payload.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(key, str) and key.startswith("$") and key not in ("$set", "$set_once"):
            hits.append(path)
        if isinstance(value, dict):
            hits.extend(_scan_reserved_keys(value, path))
    return hits


def _validate_shape(event: str, payload: dict[str, Any]) -> list[str]:
    violations: list[str] = []
    expected_keys = _allowed_payload_keys(event)
    actual_keys = set(payload.keys())
    if actual_keys != expected_keys:
        missing = sorted(expected_keys - actual_keys)
        extra = sorted(actual_keys - expected_keys)
        if missing:
            violations.append(f"{event}: missing keys {missing}")
        if extra:
            violations.append(f"{event}: extra keys {extra}")

    source = payload.get("source")
    if source not in SOURCES:
        violations.append(f"{event}: invalid source {source!r}")

    for key in EVENT_SCHEMAS[event]:
        if key in VERSION_BODY_KEYS:
            violations.append(f"{event}: version key in event body: {key}")
        value = payload.get(key)
        if not _is_allowed_scalar(value):
            violations.append(f"{event}: invalid type for {key}")

    for key in payload:
        if key in ("$set", "$set_once"):
            continue
        if key in EVENT_SCHEMAS[event] or key == "source":
            continue
        if key.startswith("$"):
            violations.append(f"{event}: reserved key {key}")

    set_payload = payload.get("$set")
    if not isinstance(set_payload, dict) or set(set_payload.keys()) != SET_PAYLOAD_KEYS:
        violations.append(f"{event}: invalid $set keys")
    elif set_payload != EXPECTED_SET_VALUES:
        violations.append(f"{event}: invalid $set values")

    set_once_payload = payload.get("$set_once")
    if not isinstance(set_once_payload, dict) or set(set_once_payload.keys()) != SET_ONCE_PAYLOAD_KEYS:
        violations.append(f"{event}: invalid $set_once keys")
    elif set_once_payload != EXPECTED_SET_ONCE_VALUES:
        violations.append(f"{event}: invalid $set_once values")

    return violations


def _scan_canaries(text: str) -> list[str]:
    return [canary for canary in CANARY_STRINGS if canary in text]


def _scan_project_key_leaks(text: str) -> list[str]:
    leaks: list[str] = []
    if POSTHOG_PROJECT_API_KEY in text:
        leaks.append("posthog_project_api_key")
    if FIXED_INSTALL_ID in text:
        leaks.append("fixed_install_id")
    return leaks


def _make_posthog_factory(
    captured: list[dict[str, Any]],
    capture_violations: list[str],
    unexpected_sdk_calls: list[str],
    constructor_calls: list[tuple[tuple[Any, ...], dict[str, Any]]],
) -> Any:
    def factory(*args: Any, **kwargs: Any) -> PostHogSpy:
        constructor_calls.append((args, kwargs))
        return PostHogSpy(captured, capture_violations, unexpected_sdk_calls)

    return factory


async def _build_client(
    *,
    enabled: bool,
    capture_violations: list[str],
    unexpected_sdk_calls: list[str],
    constructor_calls: list[tuple[tuple[Any, ...], dict[str, Any]]],
) -> tuple[TelemetryClient, list[dict[str, Any]]]:
    captured: list[dict[str, Any]] = []
    factory = _make_posthog_factory(
        captured,
        capture_violations,
        unexpected_sdk_calls,
        constructor_calls,
    )
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
            factory,
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
    call_data_extras: dict[str, Any] | None = None,
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
    if call_data_extras:
        call.data.update(call_data_extras)
    await async_handle_report_telemetry(hass, data, call)


async def capture() -> dict[str, Any]:
    payloads: dict[str, dict[str, Any]] = {}
    undocumented_fields: list[str] = []
    forbidden_fields: list[str] = []
    canary_hits: list[str] = []
    capture_violations: list[str] = []
    distinct_id_mismatches: list[str] = []
    disable_geoip_violations: list[str] = []
    extra_keys_reject_failures: list[str] = []
    constructor_violations: list[str] = []
    unexpected_sdk_calls: list[str] = []
    shape_violations: list[str] = []
    reserved_property_hits: list[str] = []
    project_key_leaks: list[str] = []
    enabled_constructor_calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []

    client, captured = await _build_client(
        enabled=True,
        capture_violations=capture_violations,
        unexpected_sdk_calls=unexpected_sdk_calls,
        constructor_calls=enabled_constructor_calls,
    )
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
                call_data_extras=POLLUTED_CALL_DATA_EXTRAS,
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

    for args, kwargs in enabled_constructor_calls:
        constructor_violations.extend(_validate_constructor(args, kwargs))
    if len(enabled_constructor_calls) != 1:
        constructor_violations.append(f"enabled client constructed {len(enabled_constructor_calls)} times, expected 1")

    disabled_capture_violations: list[str] = []
    disabled_unexpected_sdk_calls: list[str] = []
    disabled_constructor_calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []
    disabled_client, disabled_captured = await _build_client(
        enabled=False,
        capture_violations=disabled_capture_violations,
        unexpected_sdk_calls=disabled_unexpected_sdk_calls,
        constructor_calls=disabled_constructor_calls,
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
        serialized = json.dumps(call)
        canary_hits.extend(_scan_canaries(serialized))
        project_key_leaks.extend(_scan_project_key_leaks(serialized))
        if call.get("disable_geoip") is not True:
            disable_geoip_violations.append(str(call.get("disable_geoip")))
        if call.get("distinct_id") != EXPECTED_DISTINCT_ID:
            distinct_id_mismatches.append(str(call.get("distinct_id")))
        event = call["event"]
        payload = call["properties"]
        payloads[event] = payload
        shape_violations.extend(_validate_shape(event, payload))
        event_undocumented, event_forbidden = _scan_payload(event, payload)
        undocumented_fields.extend(event_undocumented)
        forbidden_fields.extend(event_forbidden)
        reserved_property_hits.extend(_scan_reserved_keys(payload))
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
            "constructor_violations": sorted(set(constructor_violations)),
            "unexpected_sdk_calls": sorted(set(unexpected_sdk_calls + disabled_unexpected_sdk_calls)),
            "shape_violations": sorted(set(shape_violations)),
            "reserved_property_hits": sorted(set(reserved_property_hits)),
            "project_key_leaks": sorted(set(project_key_leaks)),
            "autosnooze_version": FIXED_AUTOSNOOZE_VERSION,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--write-golden",
        type=Path,
        help="Write payload map to docs/posthog-payloads.json",
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
