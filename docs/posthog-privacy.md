# AutoSnooze PostHog Privacy Verification

[![PostHog Privacy Verification](https://github.com/mossipcams/autosnooze/actions/workflows/posthog-privacy.yml/badge.svg)](https://github.com/mossipcams/autosnooze/actions/workflows/posthog-privacy.yml)

This check runs on every push to `main` and on pull requests. It drives the real Python `TelemetryClient`, sends contract-shaped golden payloads and polluted reject-path payloads, intercepts outbound PostHog SDK calls via a strict spy, and fails on any private or undocumented field.

Telemetry is **not fully anonymous**: each signal uses `distinct_id` (SHA-256 of a random per-install UUID). That groups events per install without sending the raw ID, HA user identity, or home configuration. PostHog can see the source IP of your Home Assistant instance on HTTPS requests; AutoSnooze disables geo-IP enrichment and does not put IPs in event properties.

## PostHog SDK spy

The privacy harness replaces `posthog.Posthog` with a callable spy that records constructor arguments and returns a minimal client surface.

### Constructor allowlist

When telemetry is enabled, `Posthog()` must be called exactly once with:

- positional project API key only (`POSTHOG_PROJECT_API_KEY`)
- `host=POSTHOG_HOST` (`https://us.i.posthog.com`)
- `disable_geoip=True`
- `enable_exception_autocapture=False`
- `enable_local_evaluation=False`
- `sync_mode=False`
- `before_send` filters the final SDK-enriched message to the AutoSnooze allowlist

Any extra init kwargs (`super_properties`, `personal_api_key`, `on_error`, `privacy_mode`, `debug`, `send`, etc.) or wrong values fail CI. A disabled client may still construct but must capture nothing.

### Capture-only SDK surface

The spy implements `capture`, `disabled`, and `shutdown` only. Calls to `set`, `set_once`, `alias`, `capture_exception`, `group_identify`, `identify_context`, `capture_ai`, feature-flag APIs, or any other SDK method fail CI.

### Capture envelope

Approved AutoSnooze capture is only:

```
capture(event, distinct_id=..., properties=..., disable_geoip=True)
```

- `event` is positional (not a keyword)
- no `timestamp`, `uuid`, `groups`, `flags`, `send_feature_flags`, or `_property_allowlist`
- `disable_geoip` must be `True`
- `distinct_id` is SHA-256 of the install UUID (`^[0-9a-f]{64}$`)

### Exact property shape

For each captured event, `properties.keys()` must equal exactly:

```
{"source"} | EVENT_SCHEMAS[event] | {"$set", "$set_once"} | optional {"platform"}
```

Missing keys and extra keys both fail. Event-body values are only `bool`, `int` (not bool), or `str` — no lists, `None`, or nested dicts except `$set` and `$set_once`.

- `source` in `{card, service, timer, startup}`
- optional `platform` in `{web, mobile, tablet}`; no user-agent, model, or screen data is sent
- `$set` keys/values exactly `{autosnooze_version, home_assistant_version, event_schema_version}` with fixed test versions
- `$set_once` keys/values exactly `{initial_autosnooze_version, initial_home_assistant_version}`
- `$geoip_disable: true` is kept so PostHog Cloud does not geolocate the instance IP
- any other property key starting with `$` is rejected (PostHog reserved keys such as `$ip`, `$email`, `$geoip_city_name`, `$groups`)
- event body must not contain version keys, `distinct_id`, `install_id`, `clientUser`, or the project API key

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
| `notification_used` | `trigger` (`none`, `start`, `about_to_end`, or `end`) |
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

PostHog leak canaries also include `$ip`, `$email`, `$geoip_city_name`, evil `$set_once`, `$groups`, and numeric `latitude`/`longitude`.

Card report calls also place `entity_id` and `friendly_name` on the top-level service `call.data`; the handler must not forward them.

These Home Assistant and PostHog field names are forbidden inside `properties`:

- `entity_id`, `friendly_name`, `user_id`, `config_entry_id`, `area_id`, `device_id`, `latitude`, `longitude`, `install_id`, `clientUser`, `distinct_id`, `email`, `name`, `ip_address`
- `$ip`, `$email`, `$name`, `$user_id`, `$device_id`, `$anon_distinct_id`, `$session_id`, `$groups`, `$group_key`, `$group_type`, `$group_set`, `$unset`, `$geoip_city_name`, `$geoip_country_code`, `$current_url`, `$host`

## Test source

- [tests/test_posthog_privacy.py](../tests/test_posthog_privacy.py)
- [tests/helpers/posthog_privacy_capture.py](../tests/helpers/posthog_privacy_capture.py)

The pytest module drives `TelemetryClient.track` and `report_telemetry` through a PostHog SDK spy that records constructor arguments and `capture` calls.

## Reproduce locally

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements_test.txt
.venv/bin/python -m pytest tests/test_posthog_privacy.py -q -s
```
