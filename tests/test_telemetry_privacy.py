"""Privacy CI: capture all telemetry events and assert golden payloads."""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from tests.helpers.telemetry_privacy_capture import capture

REPO_ROOT = Path(__file__).resolve().parents[1]
GOLDEN_PATH = REPO_ROOT / "docs" / "telemetry-payloads.json"


def _publish_summary(meta: dict[str, object]) -> None:
    passed = (
        meta["events_exercised"] == 14
        and meta["outbound_requests"] == 14
        and meta["telemetry_requests_while_disabled"] == 0
        and meta["undocumented_fields"] == 0
        and meta["forbidden_ha_fields"] == 0
        and meta["canary_hits"] == []
    )
    report = "\n".join(
        [
            "AutoSnooze Telemetry Privacy Verification",
            "Telemetry events exercised: 14/14",
            f"Outbound requests captured: {meta['outbound_requests']}",
            f"Undocumented fields found: {meta['undocumented_fields']}",
            f"Private canary values found: {len(meta['canary_hits'])}",
            f"Forbidden Home Assistant fields found: {meta['forbidden_ha_fields']}",
            f"Telemetry requests while disabled: {meta['telemetry_requests_while_disabled']}",
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
async def test_telemetry_privacy_capture() -> None:
    result = await capture()
    meta = result["meta"]

    assert meta["events_exercised"] == 14
    assert meta["outbound_requests"] == 14
    assert meta["telemetry_requests_while_disabled"] == 0
    assert meta["undocumented_fields"] == 0
    assert meta["forbidden_ha_fields"] == 0
    assert meta["canary_hits"] == []

    documented = json.loads(GOLDEN_PATH.read_text(encoding="utf-8"))
    assert set(result["payloads"].keys()) == set(documented.keys())
    for event, actual in result["payloads"].items():
        assert actual == documented[event]

    _publish_summary(meta)
