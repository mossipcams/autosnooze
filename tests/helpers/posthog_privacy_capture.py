"""Drive TelemetryClient and capture PostHog capture calls for privacy CI."""

from __future__ import annotations

import argparse
import asyncio
import gzip
import hashlib
import json
import re
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

from posthog import Posthog as RealPosthog

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
    _filter_posthog_message,
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
    "before_send": _filter_posthog_message,
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
        "$lib",
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


class PostHogWrapper:
    def __init__(
        self,
        real_client: RealPosthog,
        capture_violations: list[str],
        unexpected_sdk_calls: list[str],
        capture_calls: list[dict[str, Any]],
    ) -> None:
        self._real = real_client
        self._capture_violations = capture_violations
        self._unexpected_sdk_calls = unexpected_sdk_calls
        self._capture_calls = capture_calls

    @property
    def disabled(self) -> bool:
        return self._real.disabled

    @disabled.setter
    def disabled(self, value: bool) -> None:
        self._real.disabled = value

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
        self._capture_calls.append(
            {
                "event": event,
                "distinct_id": distinct_id,
                "properties": properties,
                "disable_geoip": disable_geoip,
            }
        )
        self._real.capture(*args, **kwargs)

    def shutdown(self) -> None:
        self._real.shutdown()

    def flush(self) -> None:
        self._real.flush()

    def __getattr__(self, name: str) -> Any:
        if name.startswith("_"):
            raise AttributeError(name)

        def _record_unexpected(*_args: Any, **_kwargs: Any) -> None:
            self._unexpected_sdk_calls.append(name)

        return _record_unexpected


def _start_posthog_sink() -> tuple[HTTPServer, threading.Thread, list[bytes], str]:
    bodies: list[bytes] = []

    class _SinkHandler(BaseHTTPRequestHandler):
        def do_POST(self) -> None:
            length = int(self.headers.get("Content-Length", 0))
            bodies.append(self.rfile.read(length))
            self.send_response(200)
            self.end_headers()

        def log_message(self, _format: str, *_args: object) -> None:
            pass

    server = HTTPServer(("127.0.0.1", 0), _SinkHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    posthog_host = f"http://127.0.0.1:{server.server_address[1]}"
    return server, thread, bodies, posthog_host


def _stop_posthog_sink(server: HTTPServer, thread: threading.Thread) -> None:
    try:
        server.shutdown()
        thread.join(timeout=5)
    finally:
        server.server_close()


def _posthog_events_from_body(raw: bytes) -> list[dict[str, Any]]:
    try:
        decoded = gzip.decompress(raw)
    except OSError:
        decoded = raw
    payload = json.loads(decoded)
    if isinstance(payload, dict) and "batch" in payload:
        batch = payload["batch"]
        return batch if isinstance(batch, list) else [batch]
    if isinstance(payload, list):
        return payload
    return [payload]


def _wire_events(bodies: list[bytes]) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for raw in bodies:
        events.extend(_posthog_events_from_body(raw))
    return events


def _validate_constructor(
    args: tuple[Any, ...],
    kwargs: dict[str, Any],
    *,
    expected_host: str,
) -> list[str]:
    violations: list[str] = []
    if args != (POSTHOG_PROJECT_API_KEY,):
        violations.append(f"unexpected constructor args: {args!r}")
    approved_kwargs = {**APPROVED_CONSTRUCTOR_KWARGS, "host": expected_host}
    expected_keys = set(approved_kwargs)
    actual_keys = set(kwargs)
    if actual_keys != expected_keys:
        missing = sorted(expected_keys - actual_keys)
        extra = sorted(actual_keys - expected_keys)
        if missing:
            violations.append(f"constructor missing kwargs: {missing}")
        if extra:
            violations.append(f"constructor extra kwargs: {extra}")
    for key, expected in approved_kwargs.items():
        if key == "before_send":
            if kwargs.get(key) is not expected:
                violations.append("constructor before_send must use AutoSnooze wire filter")
        elif kwargs.get(key) != expected:
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
    return STANDARD_PAYLOAD_KEYS | EVENT_SCHEMAS[event] | {"platform", "$set", "$set_once", "$geoip_disable"}


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
        if isinstance(key, str) and key.startswith("$") and key not in ("$set", "$set_once", "$geoip_disable"):
            hits.append(path)
        if isinstance(value, dict):
            hits.extend(_scan_reserved_keys(value, path))
    return hits


def _validate_shape(event: str, payload: dict[str, Any]) -> list[str]:
    violations: list[str] = []
    expected_keys = _allowed_payload_keys(event)
    required_keys = expected_keys - {"platform"}
    actual_keys = set(payload.keys())
    if actual_keys not in (required_keys, expected_keys):
        missing = sorted(required_keys - actual_keys)
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

    if payload.get("$geoip_disable") is not True:
        violations.append(f"{event}: $geoip_disable must be True")

    for key in payload:
        if key in ("$set", "$set_once", "$geoip_disable"):
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
    capture_violations: list[str],
    unexpected_sdk_calls: list[str],
    constructor_calls: list[tuple[tuple[Any, ...], dict[str, Any]]],
    capture_calls: list[dict[str, Any]],
) -> Any:
    def factory(*args: Any, **kwargs: Any) -> PostHogWrapper:
        constructor_calls.append((args, kwargs))
        real_client = RealPosthog(*args, **kwargs)
        return PostHogWrapper(
            real_client,
            capture_violations,
            unexpected_sdk_calls,
            capture_calls,
        )

    return factory


async def _build_client(
    *,
    enabled: bool,
    posthog_host: str,
    capture_violations: list[str],
    unexpected_sdk_calls: list[str],
    constructor_calls: list[tuple[tuple[Any, ...], dict[str, Any]]],
    capture_calls: list[dict[str, Any]],
) -> TelemetryClient:
    factory = _make_posthog_factory(
        capture_violations,
        unexpected_sdk_calls,
        constructor_calls,
        capture_calls,
    )
    hass = MagicMock()
    hass.async_add_executor_job = lambda callback, *args: asyncio.get_running_loop().run_in_executor(
        None, callback, *args
    )
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
            "custom_components.autosnooze.infrastructure.telemetry.POSTHOG_HOST",
            posthog_host,
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
        return client


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
    enabled_capture_calls: list[dict[str, Any]] = []

    server, thread, bodies, posthog_host = _start_posthog_sink()
    client: TelemetryClient | None = None
    try:
        client = await _build_client(
            enabled=True,
            posthog_host=posthog_host,
            capture_violations=capture_violations,
            unexpected_sdk_calls=unexpected_sdk_calls,
            constructor_calls=enabled_constructor_calls,
            capture_calls=enabled_capture_calls,
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

            assert client._posthog is not None
            client._posthog.flush()
            golden_count = len(_wire_events(bodies))
            client._last_card_viewed_day = None
            client._last_integration_active_day = None

            for event, spec in CARD_REPORT_EVENTS.items():
                before = len(enabled_capture_calls)
                await _exercise_report_telemetry(
                    client,
                    hass,
                    event,
                    spec,
                    properties=_polluted_properties(spec.get("properties", {})),
                    call_data_extras=POLLUTED_CALL_DATA_EXTRAS,
                )
                if len(enabled_capture_calls) != before:
                    extra_keys_reject_failures.append(event)

            for event, spec in TRACK_EVENTS.items():
                before = len(enabled_capture_calls)
                client.track(
                    event,
                    _polluted_properties(spec.get("properties", {})),
                    source=spec["source"],
                    card_type=spec.get("card_type"),
                )
                if len(enabled_capture_calls) != before:
                    extra_keys_reject_failures.append(event)

            extra_keys_rejected = len(extra_keys_reject_failures) == 0

            rejected_before = len(enabled_capture_calls)
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
            rejected_after = len(enabled_capture_calls)

            client._posthog.flush()

        for args, kwargs in enabled_constructor_calls:
            constructor_violations.extend(_validate_constructor(args, kwargs, expected_host=posthog_host))
        if len(enabled_constructor_calls) != 1:
            constructor_violations.append(
                f"enabled client constructed {len(enabled_constructor_calls)} times, expected 1"
            )

        disabled_capture_violations: list[str] = []
        disabled_unexpected_sdk_calls: list[str] = []
        disabled_constructor_calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []
        disabled_capture_calls: list[dict[str, Any]] = []
        disabled_server, disabled_thread, disabled_bodies, disabled_host = _start_posthog_sink()
        try:
            disabled_client = await _build_client(
                enabled=False,
                posthog_host=disabled_host,
                capture_violations=disabled_capture_violations,
                unexpected_sdk_calls=disabled_unexpected_sdk_calls,
                constructor_calls=disabled_constructor_calls,
                capture_calls=disabled_capture_calls,
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
                if disabled_client._posthog is not None:
                    disabled_client._posthog.flush()

            telemetry_requests_while_disabled = len(_wire_events(disabled_bodies))
            if disabled_client._posthog is not None:
                disabled_client._posthog.shutdown()
        finally:
            _stop_posthog_sink(disabled_server, disabled_thread)

        wire_events = _wire_events(bodies)
        for wire_event in wire_events:
            serialized = json.dumps(wire_event)
            canary_hits.extend(_scan_canaries(serialized))
            project_key_leaks.extend(_scan_project_key_leaks(serialized))
            distinct_id = wire_event.get("distinct_id")
            if distinct_id != EXPECTED_DISTINCT_ID:
                distinct_id_mismatches.append(str(distinct_id))
            event = wire_event["event"]
            payload = wire_event.get("properties", {})
            if payload.get("$geoip_disable") is not True:
                disable_geoip_violations.append(event)
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
            assert distinct_id

        events_exercised = len(CARD_REPORT_EVENTS) + len(TRACK_EVENTS)

        return {
            "payloads": payloads,
            "meta": {
                "events_exercised": events_exercised,
                "expected_event_count": EXPECTED_EVENT_COUNT,
                "outbound_requests": len(wire_events),
                "golden_capture_count": golden_count,
                "telemetry_requests_while_disabled": telemetry_requests_while_disabled,
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
    finally:
        if client is not None and client._posthog is not None:
            client._posthog.shutdown()
        _stop_posthog_sink(server, thread)


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
