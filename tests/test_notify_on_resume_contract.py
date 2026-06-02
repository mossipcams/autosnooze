"""Contract and persistence tests for notify_on_resume."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from custom_components.autosnooze.const import PAUSE_SCHEMA
from custom_components.autosnooze.coordinator import validate_stored_data
from custom_components.autosnooze.models import PausedAutomation, ScheduledSnooze

UTC = timezone.utc


def test_pause_schema_accepts_notify_on_resume_and_defaults_false() -> None:
    """Pause schema should accept the notification flag without breaking old callers."""
    validated = PAUSE_SCHEMA(
        {
            "entity_id": ["automation.kitchen"],
            "hours": 1,
            "notify_on_resume": True,
        }
    )

    assert validated["notify_on_resume"] is True

    backward_compatible = PAUSE_SCHEMA(
        {
            "entity_id": ["automation.kitchen"],
            "hours": 1,
        }
    )

    assert backward_compatible["notify_on_resume"] is False


def test_paused_automation_roundtrip_preserves_notify_on_resume() -> None:
    """Paused automation serialization should preserve notify_on_resume."""
    now = datetime.now(UTC)
    original = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        notify_on_resume=True,
    )

    restored = PausedAutomation.from_dict(original.entity_id, original.to_dict())

    assert restored.notify_on_resume is True


def test_scheduled_snooze_roundtrip_preserves_notify_on_resume() -> None:
    """Scheduled snooze serialization should preserve notify_on_resume."""
    now = datetime.now(UTC)
    original = ScheduledSnooze(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        disable_at=now + timedelta(minutes=15),
        resume_at=now + timedelta(hours=1),
        notify_on_resume=True,
    )

    restored = ScheduledSnooze.from_dict(original.entity_id, original.to_dict())

    assert restored.notify_on_resume is True


def test_validate_stored_data_keeps_notify_on_resume_and_defaults_missing_values() -> None:
    """Stored data should accept the flag and leave old entries backward-compatible."""
    now = datetime.now(UTC)

    validated = validate_stored_data(
        {
            "paused": {
                "automation.kitchen": {
                    "friendly_name": "Kitchen",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                    "notify_on_resume": True,
                },
                "automation.legacy": {
                    "friendly_name": "Legacy",
                    "resume_at": (now + timedelta(hours=2)).isoformat(),
                    "paused_at": now.isoformat(),
                },
            },
            "scheduled": {
                "automation.scheduled": {
                    "friendly_name": "Scheduled",
                    "disable_at": (now + timedelta(minutes=15)).isoformat(),
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "notify_on_resume": True,
                }
            },
        }
    )

    paused = PausedAutomation.from_dict("automation.kitchen", validated["paused"]["automation.kitchen"])
    legacy_paused = PausedAutomation.from_dict("automation.legacy", validated["paused"]["automation.legacy"])
    scheduled = ScheduledSnooze.from_dict("automation.scheduled", validated["scheduled"]["automation.scheduled"])

    assert paused.notify_on_resume is True
    assert legacy_paused.notify_on_resume is False
    assert scheduled.notify_on_resume is True
