# AutoSnooze Telemetry Privacy Verification

[![Telemetry Privacy Verification](https://github.com/mossipcams/autosnooze/actions/workflows/telemetry-privacy.yml/badge.svg)](https://github.com/mossipcams/autosnooze/actions/workflows/telemetry-privacy.yml)

This check runs on every push to `main` and on pull requests. It drives the real Python `TelemetryClient`, seeds deliberately identifiable Home Assistant data, intercepts outbound TelemetryDeck requests, and fails on any private or undocumented field.

## Collected fields

TelemetryDeck envelope keys per request batch item:

- `appID`
- `clientUser` (SHA-256 hash of a per-install UUID, never the raw install ID)
- `type` (event name)
- `payload` (sanitized property object)

Shared `payload` keys on every event:

- `autosnooze_version`
- `home_assistant_version`
- `event_schema_version`
- `source` (`card`, `service`, `timer`, or `startup`)

Event-specific `payload` keys:

| Event | Properties |
|-------|------------|
| `integration_active` | versions and source only |
| `card_viewed` | `card_type` |
| `selection_feature_used` | `method` |
| `duration_option_selected` | `method` |
| `snooze_created` | `strategy`, `input_method`, `duration_minutes`, `target_count`, `notification_trigger`, `notification_lead_minutes`, `confirmation_used` |
| `scheduled_snooze_created` | `minutes_until_start`, `planned_duration_minutes`, `target_count`, `resume_local_hour` |
| `scheduled_snooze_started` | `target_count`, `planned_duration_minutes` |
| `snooze_adjusted` | `delta_minutes`, `direction` |
| `snooze_ended` | `reason` |
| `scheduled_snooze_cancelled` | `target_count`, `minutes_before_start` |
| `notification_used` | `trigger` |
| `notification_cleared` | `target_count` |
| `operation_failed` | `operation`, `error_code`, `strategy`, `target_count` |
| `confirmation_result` | `result` |

## Captured payloads

The committed golden file lists the exact `payload` object for each of the 14 events after sanitization:

- [telemetry-payloads.json](./telemetry-payloads.json)

CI compares live capture output to this file with strict equality.

## Seeded test data

The harness injects these canary values into attempted properties and HA-like fields. None may appear in captured JSON.

- `automation.guest_private_bedroom`
- `Guest's Private Bedroom`
- `guest@example.com`
- `https://private-home.example.com`
- `192.168.1.45`
- `private-user-id-12345`
- `private-config-entry-67890`

These Home Assistant field names are also forbidden inside `payload`:

- `entity_id`, `friendly_name`, `user_id`, `config_entry_id`, `area_id`, `device_id`, `latitude`, `longitude`, `install_id`, `clientUser`

## Test source

- [tests/telemetry-privacy.spec.ts](../tests/telemetry-privacy.spec.ts)

The Vitest spec spawns the Python capture helper, which calls `TelemetryClient.track` and `report_telemetry` while mocking `async_get_clientsession` / `session.post`.

## Reproduce locally

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements_test.txt
npm ci
npx vitest run tests/telemetry-privacy.spec.ts
```
