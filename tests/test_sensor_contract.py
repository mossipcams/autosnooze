"""Contract tests for AutoSnooze sensor payload shape."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from custom_components.autosnooze.models import AutomationPauseData, PausedAutomation, ScheduledSnooze
from custom_components.autosnooze.const import SENSOR_SCHEMA_VERSION
from custom_components.autosnooze.sensor import AutoSnoozeCountSensor

UTC = timezone.utc


class MockConfigEntry:
    """Small config entry stub for sensor construction."""

    def __init__(self, runtime_data: AutomationPauseData, entry_id: str = "entry-id") -> None:
        self.entry_id = entry_id
        self.runtime_data = runtime_data
        self.options: dict = {}


def _assert_iso_datetime(value: str) -> None:
    parsed = datetime.fromisoformat(value)
    assert parsed.tzinfo is not None


def test_sensor_contract_exposes_paused_and_scheduled_roots() -> None:
    """Sensor payload includes normalized roots plus backward-compatible aliases."""
    now = datetime.now(UTC)
    data = AutomationPauseData()
    data.paused["automation.kitchen"] = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        days=0,
        hours=1,
        minutes=0,
    )
    data.scheduled["automation.porch"] = ScheduledSnooze(
        entity_id="automation.porch",
        friendly_name="Porch",
        disable_at=now + timedelta(minutes=10),
        resume_at=now + timedelta(hours=2),
    )

    attrs = AutoSnoozeCountSensor(MockConfigEntry(data)).extra_state_attributes

    assert "paused" in attrs
    assert "scheduled" in attrs
    assert attrs["schema_version"] == SENSOR_SCHEMA_VERSION
    assert "paused_automations" in attrs
    assert "scheduled_snoozes" in attrs
    assert attrs["paused"] == attrs["paused_automations"]
    assert attrs["scheduled"] == attrs["scheduled_snoozes"]


def test_sensor_contract_datetime_fields_are_iso8601() -> None:
    """Paused and scheduled payload datetimes are timezone-aware ISO strings."""
    now = datetime.now(UTC)
    data = AutomationPauseData()
    data.paused["automation.bedroom"] = PausedAutomation(
        entity_id="automation.bedroom",
        friendly_name="Bedroom",
        resume_at=now + timedelta(hours=3),
        paused_at=now,
        disable_at=now,
    )
    data.scheduled["automation.hallway"] = ScheduledSnooze(
        entity_id="automation.hallway",
        friendly_name="Hallway",
        disable_at=now + timedelta(minutes=15),
        resume_at=now + timedelta(hours=1),
    )

    attrs = AutoSnoozeCountSensor(MockConfigEntry(data)).extra_state_attributes

    paused_entry = attrs["paused"]["automation.bedroom"]
    scheduled_entry = attrs["scheduled"]["automation.hallway"]

    assert set(paused_entry.keys()) >= {"friendly_name", "resume_at", "paused_at"}
    assert set(scheduled_entry.keys()) >= {"friendly_name", "disable_at", "resume_at"}

    _assert_iso_datetime(paused_entry["resume_at"])
    _assert_iso_datetime(paused_entry["paused_at"])
    _assert_iso_datetime(paused_entry["disable_at"])
    _assert_iso_datetime(scheduled_entry["disable_at"])
    _assert_iso_datetime(scheduled_entry["resume_at"])
