# AutoSnooze PostHog Privacy Verification

[![PostHog Privacy Verification](https://github.com/mossipcams/autosnooze/actions/workflows/posthog-privacy.yml/badge.svg)](https://github.com/mossipcams/autosnooze/actions/workflows/posthog-privacy.yml)

This check runs on every push to `main` and on pull requests. It drives the real Python `TelemetryClient`, sends contract-shaped golden payloads and polluted reject-path payloads, intercepts outbound PostHog `capture` calls, and fails on any private or undocumented field.

Telemetry is **not fully anonymous**: each signal uses `distinct_id` (SHA-256 of a random per-install UUID). That groups events per install without sending the raw ID, HA user identity, or home configuration. PostHog can see the source IP of your Home Assistant instance on HTTPS requests; AutoSnooze disables geo-IP enrichment and does not put IPs in event properties.

## Collected fields

PostHog capture envelope per event (exact kwargs only):

- `capture(event, distinct_id=..., properties=..., disable_geoip=True)`

Inside `properties`:

- `distinct_id` is never duplicated in the property object

Shared `properties` keys on every event:

- `source` (`card`, `service`, `timer`, or `startup`)

Unknown property keys **reject the event** at sanitize time; they are not stripped. Callers must not pass `$set`, `$set_once`, `entity_id`, or other extras in event properties.

Person properties are attached by `TelemetryClient.track()` after a successful sanitize via PostHog `$set` and `$set_once` inside `properties` (not part of the per-event schema allowlist):

- `$set.autosnooze_version`
- `$set.home_assistant_version`
- `$set.event_schema_version`
- `$set_once.initial_autosnooze_version`
- `$set_once.initial_home_assistant_version`

Version fields are **not** duplicated on the event body.

`integration_active` and `card_viewed` are throttled to once per UTC day per install.

### Full event catalog

| Event | Properties |
|-------|------------|
| `integration_active` | source and person properties only |
| `card_viewed` | `card_type` |
| `selection_feature_used` | `target_count` |
| `duration_option_selected` | `duration_minutes` |
| `snooze_created` | `strategy`, `input_method`, `duration_minutes`, `target_count`, `notification_trigger`, `notification_lead_minutes`, `confirmation_used` |
| `scheduled_snooze_created` | `minutes_until_start`, `planned_duration_minutes`, `target_count`, `resume_local_hour` |
| `scheduled_snooze_started` | `target_count`, `planned_duration_minutes` |
| `snooze_adjusted` | `delta_minutes`, `direction`, `target_count` |
| `snooze_ended` | `reason` (`timer` or `manual`) |
| `scheduled_snooze_cancelled` | `target_count`, `minutes_before_start` |
| `notification_used` | `trigger` |
| `notification_cleared` | `target_count` |
| `operation_failed` | `operation`, `error_code`, `strategy`, `target_count` |
| `confirmation_result` | `target_count` |
| `snooze_button_clicked` | `target_count`, `schedule_mode`, `until_tomorrow` |
| `wake_clicked` | `scope` |
| `adjust_opened` | `scope` |
| `adjust_option_selected` | `direction`, `delta_minutes` |
| `scheduled_cancel_clicked` | `target_count` |
| `filter_tab_selected` | `tab` |
| `hide_snoozed_toggled` | `enabled` |
| `schedule_mode_toggled` | `enabled` |
| `until_tomorrow_selected` | source only |
| `custom_duration_toggled` | `enabled` |
| `notification_options_changed` | `trigger`, `enabled`, `notification_lead_minutes` |
| `confirmation_dismissed` | `target_count` |

## Captured payloads

The committed golden file lists the exact `properties` object for each of the 26 events after sanitization (native bool/int types). Golden captures are built from clean contract-shaped payloads with no canary fields:

- [posthog-payloads.json](./posthog-payloads.json)

CI compares live capture output to this file with strict equality. Polluted payloads that add extra keys must produce zero new captures.

## Seeded test data

The harness sends clean contract payloads for golden capture, then re-sends every event with the same payload plus injected canary properties. Those polluted calls must not increase the capture count. None of the canary values may appear in captured JSON.

- `automation.guest_private_bedroom`
- `Guest's Private Bedroom`
- `guest@example.com`
- `https://private-home.example.com`
- `192.168.1.45`
- `private-user-id-12345`
- `private-config-entry-67890`

These Home Assistant field names are also forbidden inside `properties`:

- `entity_id`, `friendly_name`, `user_id`, `config_entry_id`, `area_id`, `device_id`, `latitude`, `longitude`, `install_id`, `clientUser`, `distinct_id`, `$ip`

## Test source

- [tests/test_posthog_privacy.py](../tests/test_posthog_privacy.py)

The pytest module runs the Python capture helper, which calls `TelemetryClient.track` and `report_telemetry` while mocking `posthog.Posthog.capture`.

## Reproduce locally

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements_test.txt
.venv/bin/python -m pytest tests/test_posthog_privacy.py -q
```
