"""Tests for telemetry schema sanitization."""

from __future__ import annotations

import pytest

from custom_components.autosnooze.infrastructure.telemetry import (
    ERROR_CODE_ALLOWLIST,
    EVENT_SCHEMAS,
    REQUIRED_EVENT_PROPERTIES,
    SNOOZE_STRATEGIES,
    map_translation_key_to_error_code,
    sanitize_event_properties,
)

PLANNED_EVENTS = {
    "integration_active",
    "input_boolean_snooze_created",
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


@pytest.mark.parametrize(
    "event",
    [event for event in EVENT_SCHEMAS if EVENT_SCHEMAS[event] and event != "card_viewed"],
)
def test_events_require_all_declared_properties(event: str) -> None:
    assert sanitize_event_properties(event, {}, source="card", card_type="full") is None
    assert REQUIRED_EVENT_PROPERTIES[event]


def test_sanitize_rejects_unknown_properties() -> None:
    assert (
        sanitize_event_properties(
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
                "$set": {"autosnooze_version": "evil"},
            },
            source="card",
        )
        is None
    )


def test_sanitize_accepts_clean_snooze_created() -> None:
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
        },
        source="card",
    )
    assert payload is not None
    assert set(payload.keys()) == {
        "source",
        "strategy",
        "input_method",
        "duration_minutes",
        "target_count",
        "notification_trigger",
        "notification_lead_minutes",
        "confirmation_used",
    }
    assert payload["strategy"] == "duration"
    assert payload["confirmation_used"] is False
    assert payload["duration_minutes"] == 30


@pytest.mark.parametrize("resume_state", ["previous", "on", "off"])
def test_sanitize_accepts_input_boolean_snooze_created(resume_state: str) -> None:
    payload = sanitize_event_properties(
        "input_boolean_snooze_created",
        {
            "resume_state": resume_state,
            "schedule_mode": False,
            "target_count": 2,
        },
        source="service",
    )

    assert payload == {
        "source": "service",
        "resume_state": resume_state,
        "schedule_mode": False,
        "target_count": 2,
    }


def test_sanitize_rejects_invalid_input_boolean_resume_state() -> None:
    assert (
        sanitize_event_properties(
            "input_boolean_snooze_created",
            {
                "resume_state": "unknown",
                "schedule_mode": False,
                "target_count": 1,
            },
            source="service",
        )
        is None
    )


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
            {"target_count": 2, "schedule_mode": True, "until_tomorrow": False},
            {},
        ),
        (
            "selection_feature_used",
            {"target_count": 5},
            {},
        ),
        (
            "confirmation_result",
            {"target_count": 3},
            {},
        ),
        (
            "confirmation_dismissed",
            {"target_count": 2},
            {},
        ),
        (
            "scheduled_cancel_clicked",
            {"target_count": 1},
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
            {"trigger": "start", "enabled": True, "notification_lead_minutes": 15},
            {},
        ),
        ("until_tomorrow_selected", {}, {}),
        ("duration_option_selected", {"duration_minutes": 30}, {}),
        ("snooze_ended", {"reason": "timer"}, {}),
        ("notification_used", {"trigger": "start"}, {}),
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


def test_sanitize_accepts_only_coarse_platform() -> None:
    payload = sanitize_event_properties(
        "wake_clicked",
        {"scope": "one"},
        source="card",
        platform="tablet",
    )
    assert payload is not None
    assert payload["platform"] == "tablet"
    assert sanitize_event_properties("wake_clicked", {"scope": "one"}, source="card", platform="ios") is None


def test_map_translation_key_confirm_required_alias() -> None:
    assert map_translation_key_to_error_code("confirm_required") == "confirmation_required"


def test_map_translation_key_real_ha_codes_map_to_themselves() -> None:
    assert map_translation_key_to_error_code("not_automation") == "not_automation"
    assert map_translation_key_to_error_code("invalid_previous_state") == "invalid_previous_state"
    assert map_translation_key_to_error_code("invalid_resume_preset") == "invalid_resume_preset"
    assert map_translation_key_to_error_code("invalid_adjustment") == "invalid_adjustment"
    assert map_translation_key_to_error_code("adjust_time_too_short") == "adjust_time_too_short"


def test_map_translation_key_unlisted_becomes_unknown() -> None:
    assert map_translation_key_to_error_code("totally_made_up") == "unknown"


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
