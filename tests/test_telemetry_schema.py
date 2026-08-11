"""Tests for telemetry schema sanitization."""

from __future__ import annotations

import pytest

from custom_components.autosnooze.infrastructure.telemetry import (
    ERROR_CODE_ALLOWLIST,
    EVENT_SCHEMAS,
    SNOOZE_STRATEGIES,
    map_translation_key_to_error_code,
    sanitize_event_properties,
)

PLANNED_EVENTS = {
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
    "snooze_button_clicked",
    "wake_clicked",
    "adjust_opened",
    "adjust_option_selected",
    "scheduled_cancel_clicked",
    "filter_tab_selected",
    "hide_snoozed_toggled",
    "schedule_mode_toggled",
    "until_tomorrow_selected",
    "custom_duration_toggled",
    "notification_options_changed",
    "confirmation_dismissed",
}


def test_event_schemas_cover_planned_events() -> None:
    assert set(EVENT_SCHEMAS) == PLANNED_EVENTS


def test_sanitize_strips_unknown_event() -> None:
    assert sanitize_event_properties("not_real", {}, source="card") is None


def test_sanitize_strips_unknown_properties(monkeypatch) -> None:
    monkeypatch.setattr(
        "custom_components.autosnooze.infrastructure.telemetry.VERSION",
        "1.2.3",
    )
    monkeypatch.setattr(
        "custom_components.autosnooze.infrastructure.telemetry._ha_version",
        lambda: "2024.1.0",
    )
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
            "_private": "hidden",
            "user_email": "user@example.com",
        },
        source="card",
    )
    assert payload is not None
    assert set(payload.keys()) == {
        "autosnooze_version",
        "home_assistant_version",
        "event_schema_version",
        "source",
        "strategy",
        "input_method",
        "duration_minutes",
        "target_count",
        "notification_trigger",
        "notification_lead_minutes",
        "confirmation_used",
    }
    assert "entity_id" not in payload
    assert all(not key.startswith("_") for key in payload)
    assert all("secret" not in key for key in payload)
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


def test_sanitize_rejects_non_dict_properties() -> None:
    assert sanitize_event_properties("snooze_created", "bad", source="card") is None


def test_sanitize_rejects_nested_object_values() -> None:
    assert (
        sanitize_event_properties(
            "snooze_created",
            {
                "strategy": "duration",
                "input_method": "card",
                "duration_minutes": {"nested": True},
                "target_count": 1,
                "notification_trigger": "none",
                "notification_lead_minutes": 0,
                "confirmation_used": False,
            },
            source="card",
        )
        is None
    )


def test_sanitize_rejects_canary_string_in_allowed_field() -> None:
    assert (
        sanitize_event_properties(
            "snooze_created",
            {
                "strategy": "duration",
                "input_method": "automation.guest_private_bedroom",
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


@pytest.mark.parametrize(
    ("event", "properties", "kwargs"),
    [
        (
            "snooze_button_clicked",
            {"target_count": 2, "schedule_mode": True},
            {},
        ),
        ("wake_clicked", {"scope": "all"}, {}),
        ("adjust_opened", {"scope": "group"}, {}),
        (
            "adjust_option_selected",
            {"direction": "shorten", "delta_minutes": 15},
            {},
        ),
        ("filter_tab_selected", {"tab": "areas"}, {}),
        ("hide_snoozed_toggled", {"enabled": True}, {}),
        ("schedule_mode_toggled", {"enabled": False}, {}),
        ("custom_duration_toggled", {"enabled": True}, {}),
        (
            "notification_options_changed",
            {"trigger": "start", "enabled": True},
            {},
        ),
        ("scheduled_cancel_clicked", {}, {}),
        ("until_tomorrow_selected", {}, {}),
        ("confirmation_dismissed", {}, {}),
    ],
)
def test_sanitize_accepts_card_action_events(event, properties, kwargs, monkeypatch) -> None:
    monkeypatch.setattr(
        "custom_components.autosnooze.infrastructure.telemetry.VERSION",
        "1.2.3",
    )
    monkeypatch.setattr(
        "custom_components.autosnooze.infrastructure.telemetry._ha_version",
        lambda: "2024.1.0",
    )
    payload = sanitize_event_properties(event, properties, source="card", **kwargs)
    assert payload is not None
    assert payload["source"] == "card"


def test_sanitize_rejects_invalid_wake_scope() -> None:
    assert sanitize_event_properties("wake_clicked", {"scope": "batch"}, source="card") is None


def test_sanitize_rejects_out_of_range_int() -> None:
    assert (
        sanitize_event_properties(
            "snooze_created",
            {
                "strategy": "duration",
                "input_method": "card",
                "duration_minutes": 999999,
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
