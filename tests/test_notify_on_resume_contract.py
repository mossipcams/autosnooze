"""Contract and persistence tests for notification triggers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
import voluptuous as vol

from custom_components.autosnooze.const import PAUSE_SCHEMA
from custom_components.autosnooze.runtime.restore import validate_stored_data
from custom_components.autosnooze.models import PausedAutomation, ScheduledSnooze

UTC = timezone.utc


def test_pause_schema_accepts_notification_trigger_without_lead_for_non_pre_end() -> None:
    """Pause schema should accept a simple trigger without requiring lead minutes."""
    validated = PAUSE_SCHEMA(
        {
            "entity_id": ["automation.kitchen"],
            "hours": 1,
            "notification_trigger": "end",
        }
    )

    assert validated["notification_trigger"] == "end"
    assert "notification_lead_minutes" not in validated


def test_pause_schema_requires_valid_lead_for_about_to_end() -> None:
    """Pre-end notifications require one of the supported lead times."""
    validated = PAUSE_SCHEMA(
        {
            "entity_id": ["automation.kitchen"],
            "hours": 1,
            "notification_trigger": "about_to_end",
            "notification_lead_minutes": 60,
        }
    )

    assert validated["notification_trigger"] == "about_to_end"
    assert validated["notification_lead_minutes"] == 60

    with pytest.raises(vol.Invalid):
        PAUSE_SCHEMA(
            {
                "entity_id": ["automation.kitchen"],
                "hours": 1,
                "notification_trigger": "about_to_end",
            }
        )

    with pytest.raises(vol.Invalid):
        PAUSE_SCHEMA(
            {
                "entity_id": ["automation.kitchen"],
                "hours": 1,
                "notification_trigger": "about_to_end",
                "notification_lead_minutes": 10,
            }
        )


def test_pause_schema_rejects_legacy_notify_on_resume_flag() -> None:
    """The legacy boolean notify flag should no longer be accepted."""
    with pytest.raises(vol.Invalid):
        PAUSE_SCHEMA(
            {
                "entity_id": ["automation.kitchen"],
                "hours": 1,
                "notify_on_resume": True,
            }
        )


def test_paused_automation_roundtrip_preserves_notification_trigger() -> None:
    """Paused automation serialization should preserve notification trigger fields."""
    now = datetime.now(UTC)
    original = PausedAutomation(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        resume_at=now + timedelta(hours=1),
        paused_at=now,
        notification_trigger="about_to_end",
        notification_lead_minutes=30,
    )

    restored = PausedAutomation.from_dict(original.entity_id, original.to_dict())

    assert restored.notification_trigger == "about_to_end"
    assert restored.notification_lead_minutes == 30


def test_scheduled_snooze_roundtrip_preserves_notification_trigger() -> None:
    """Scheduled snooze serialization should preserve notification trigger fields."""
    now = datetime.now(UTC)
    original = ScheduledSnooze(
        entity_id="automation.kitchen",
        friendly_name="Kitchen",
        disable_at=now + timedelta(minutes=15),
        resume_at=now + timedelta(hours=1),
        notification_trigger="start",
    )

    restored = ScheduledSnooze.from_dict(original.entity_id, original.to_dict())

    assert restored.notification_trigger == "start"
    assert restored.notification_lead_minutes is None


def test_validate_stored_data_keeps_notification_fields() -> None:
    """Stored data should keep valid trigger settings for paused and scheduled entries."""
    now = datetime.now(UTC)

    validated = validate_stored_data(
        {
            "paused": {
                "automation.kitchen": {
                    "friendly_name": "Kitchen",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                    "notification_trigger": "about_to_end",
                    "notification_lead_minutes": 30,
                },
            },
            "scheduled": {
                "automation.scheduled": {
                    "friendly_name": "Scheduled",
                    "disable_at": (now + timedelta(minutes=15)).isoformat(),
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "notification_trigger": "end",
                }
            },
        }
    )

    paused = PausedAutomation.from_dict("automation.kitchen", validated["paused"]["automation.kitchen"])
    scheduled = ScheduledSnooze.from_dict("automation.scheduled", validated["scheduled"]["automation.scheduled"])

    assert paused.notification_trigger == "about_to_end"
    assert paused.notification_lead_minutes == 30
    assert scheduled.notification_trigger == "end"
    assert scheduled.notification_lead_minutes is None


def test_validate_stored_data_rejects_invalid_trigger_and_lead_combinations() -> None:
    """Stored data should reject invalid trigger/lead combinations."""
    now = datetime.now(UTC)

    validated = validate_stored_data(
        {
            "paused": {
                "automation.invalid_trigger": {
                    "friendly_name": "Invalid Trigger",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                    "notification_trigger": "manual",
                },
                "automation.invalid_lead": {
                    "friendly_name": "Invalid Lead",
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "paused_at": now.isoformat(),
                    "notification_trigger": "end",
                    "notification_lead_minutes": 60,
                },
            },
            "scheduled": {
                "automation.missing_lead": {
                    "friendly_name": "Missing Lead",
                    "disable_at": (now + timedelta(minutes=15)).isoformat(),
                    "resume_at": (now + timedelta(hours=1)).isoformat(),
                    "notification_trigger": "about_to_end",
                }
            },
        }
    )

    assert validated["paused"] == {}
    assert validated["scheduled"] == {}
