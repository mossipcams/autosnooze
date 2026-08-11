"""Tests for telemetry schema sanitization."""

from __future__ import annotations

from custom_components.autosnooze.infrastructure.telemetry import (
    ERROR_CODE_ALLOWLIST,
    EVENT_SCHEMAS,
    SNOOZE_STRATEGIES,
    map_translation_key_to_error_code,
    sanitize_event_properties,
)


def test_event_schemas_cover_planned_events() -> None:
    expected = {
        "integration_active",
        "card_viewed",
        "selection_feature_used",
        "duration_option_selected",
        "snooze_created",
        "scheduled_snooze_created",
        "scheduled_snooze_started",
        "snooze_adjusted",
        "snooze_ended",
        "scheduled_snooze_cancelled",
        "notification_used",
        "notification_cleared",
        "operation_failed",
        "confirmation_result",
    }
    assert set(EVENT_SCHEMAS) == expected


def test_sanitize_strips_unknown_event() -> None:
    assert sanitize_event_properties("not_real", {}, source="card") is None


def test_sanitize_strips_unknown_properties() -> None:
    payload = sanitize_event_properties(
        "snooze_created",
        {
            "strategy": "duration",
            "input_method": "card",
            "duration_minutes": 30,
            "target_count": 1,
            "notification_trigger": "none",
            "notification_lead_minutes": 0,
            "confirmation_used": False,
            "entity_id": "automation.secret",
        },
        source="card",
    )
    assert payload is not None
    assert "entity_id" not in payload
    assert payload["strategy"] == "duration"
    assert payload["confirmation_used"] == "false"


def test_sanitize_rejects_invalid_strategy() -> None:
    assert (
        sanitize_event_properties(
            "snooze_created",
            {
                "strategy": "magic",
                "input_method": "card",
                "duration_minutes": 30,
                "target_count": 1,
                "notification_trigger": "none",
                "notification_lead_minutes": 0,
                "confirmation_used": False,
            },
            source="card",
        )
        is None
    )


def test_sanitize_card_viewed_requires_card_type() -> None:
    assert sanitize_event_properties("card_viewed", {}, source="card", card_type="full") is not None
    assert sanitize_event_properties("card_viewed", {}, source="card", card_type="bad") is None


def test_map_translation_key_confirm_required_alias() -> None:
    assert map_translation_key_to_error_code("confirm_required") == "confirmation_required"


def test_map_translation_key_unlisted_becomes_unknown() -> None:
    assert map_translation_key_to_error_code("not_automation") == "unknown"
    assert map_translation_key_to_error_code("adjust_time_too_short") == "unknown"


def test_error_code_allowlist_matches_plan() -> None:
    assert "confirmation_required" in ERROR_CODE_ALLOWLIST
    assert "confirm_required" not in ERROR_CODE_ALLOWLIST


def test_snooze_strategies_allowlist() -> None:
    assert (
        frozenset(
            {
                "duration",
                "resume_datetime",
                "resume_time",
                "end_of_day",
                "next_morning",
                "next_sunrise",
                "next_sunset",
                "scheduled_window",
            }
        )
        == SNOOZE_STRATEGIES
    )
