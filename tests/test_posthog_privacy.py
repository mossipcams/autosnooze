"""Privacy CI: capture all PostHog events and assert golden payloads."""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from custom_components.autosnooze.infrastructure.telemetry import EVENT_SCHEMAS
from tests.helpers.posthog_privacy_capture import (
    _start_posthog_sink,
    _stop_posthog_sink,
    capture,
)

REPO_ROOT = Path(__file__).resolve().parents[1]
GOLDEN_PATH = REPO_ROOT / "docs" / "posthog-payloads.json"
EXPECTED = len(EVENT_SCHEMAS)


def test_posthog_privacy_sink_closes_listening_socket(socket_enabled: None) -> None:
    server, thread, _bodies, _host = _start_posthog_sink()

    _stop_posthog_sink(server, thread)

    assert server.socket.fileno() == -1


def _publish_summary(meta: dict[str, object]) -> None:
    passed = (
        meta["events_exercised"] == EXPECTED
        and meta["outbound_requests"] == EXPECTED
        and meta["telemetry_requests_while_disabled"] == 0
        and meta["undocumented_fields"] == 0
        and meta["forbidden_ha_fields"] == 0
        and meta["canary_hits"] == []
        and meta["capture_violations"] == []
        and meta["distinct_id_mismatches"] == []
        and meta["disable_geoip_violations"] == []
        and meta["allowed_key_canary_rejected"] is True
        and meta["extra_keys_rejected"] is True
        and meta["constructor_violations"] == []
        and meta["unexpected_sdk_calls"] == []
        and meta["shape_violations"] == []
        and meta["reserved_property_hits"] == []
        and meta["project_key_leaks"] == []
    )
    report = "\n".join(
        [
            "AutoSnooze PostHog Privacy Verification",
            f"Telemetry events exercised: {meta['events_exercised']}/{EXPECTED}",
            f"PostHog captures recorded: {meta['outbound_requests']}",
            f"Undocumented fields found: {meta['undocumented_fields']}",
            f"Private canary values found: {len(meta['canary_hits'])}",
            f"Forbidden Home Assistant fields found: {meta['forbidden_ha_fields']}",
            f"Capture violations: {len(meta['capture_violations'])}",
            f"Constructor violations: {len(meta['constructor_violations'])}",
            f"Unexpected SDK calls: {len(meta['unexpected_sdk_calls'])}",
            f"Shape violations: {len(meta['shape_violations'])}",
            f"Reserved property hits: {len(meta['reserved_property_hits'])}",
            f"Project key leaks: {len(meta['project_key_leaks'])}",
            f"distinct_id mismatches: {len(meta['distinct_id_mismatches'])}",
            f"disable_geoip violations: {len(meta['disable_geoip_violations'])}",
            f"Allowed-key canary rejected: {meta['allowed_key_canary_rejected']}",
            f"Extra keys rejected: {meta['extra_keys_rejected']}",
            f"Telemetry captures while disabled: {meta['telemetry_requests_while_disabled']}",
            f"RESULT: {'PASSED' if passed else 'FAILED'}",
            "",
        ]
    )
    print(report, end="")
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with Path(summary_path).open("a", encoding="utf-8") as handle:
            handle.write(report)


@pytest.mark.asyncio
async def test_posthog_privacy_capture(socket_enabled: None) -> None:
    result = await capture()
    meta = result["meta"]

    assert meta["events_exercised"] == EXPECTED
    assert meta["expected_event_count"] == EXPECTED
    assert meta["outbound_requests"] == EXPECTED
    assert meta["golden_capture_count"] == EXPECTED
    assert meta["telemetry_requests_while_disabled"] == 0
    assert meta["undocumented_fields"] == 0
    assert meta["forbidden_ha_fields"] == 0
    assert meta["canary_hits"] == []
    assert meta["capture_violations"] == []
    assert meta["distinct_id_mismatches"] == []
    assert meta["disable_geoip_violations"] == []
    assert meta["allowed_key_canary_rejected"] is True
    assert meta["extra_keys_rejected"] is True
    assert meta["constructor_violations"] == []
    assert meta["unexpected_sdk_calls"] == []
    assert meta["shape_violations"] == []
    assert meta["reserved_property_hits"] == []
    assert meta["project_key_leaks"] == []
    assert set(result["payloads"].keys()) == set(EVENT_SCHEMAS)

    documented = json.loads(GOLDEN_PATH.read_text(encoding="utf-8"))
    assert set(result["payloads"].keys()) == set(documented.keys())
    for event, actual in result["payloads"].items():
        assert actual == documented[event]
        assert actual["$geoip_disable"] is True
        for forbidden in ("$lib", "$ip", "$geoip_city_name"):
            assert forbidden not in actual

    _publish_summary(meta)
