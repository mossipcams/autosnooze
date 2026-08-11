# Product telemetry plan

**Status:** Done
**Provider:** TelemetryDeck free tier
**App ID:** `C7769C33-556B-40B1-9C4D-0982BE33DEDE`
**Namespace:** `com.mossyhome`
**Ingest:** `https://nom.telemetrydeck.com/v2/namespace/com.mossyhome/`

TelemetryDeck gives anonymous per-installation counts, explicit events, property breakdowns, funnels, and dashboards. It double-hashes the installation identifier, rounds event timestamps to the hour, and does not store IP addresses. The free plan includes 50,000 signals monthly (enough for ~80 installations).

Do not use Aptabase. It disconnects events and cannot support unique-user or retention analysis.

## Integration settings (opt-out)

Home Assistant **Integration options** must include a toggle that stops sending telemetry.

| Setting | Value |
|---------|-------|
| Location | AutoSnooze config entry Options (alongside duration presets) |
| Default | **On** (telemetry sends until the user turns it off) |
| When off | `track()` no-ops; nothing is queued or posted |
| Effect timing | Read the option at send time so off takes effect without requiring a full integration reload for the stop |

Suggested option key: `telemetry_enabled` (default `True` when absent).

Suggested UI label intent: send anonymous usage data / turn off sending telemetry.

After telemetry is disabled, collect nothing.

## Privacy model

Generate a separate random telemetry installation ID. Store it in a dedicated HA `Store` (not `autosnooze.storage` pause state). SHA256 it for TelemetryDeck `clientUser`. Let TelemetryDeck hash again server-side. Never put the installation ID in visible event properties / payload.

### Do not collect

- Automation entity IDs, names, friendly names, or hashes of them
- Selected area, label, or category IDs or names
- Search text
- Home Assistant instance ID or config-entry ID
- Home Assistant user IDs or usernames
- Complete automation counts or registry contents
- Automation triggers, conditions, actions, YAML, or configuration
- Home Assistant URL, hostname, external URL, or referrer
- Notification device, service name, recipient, title, or message
- Exact absolute dates or ISO timestamps
- IP addresses, coordinates, timezone, or location
- Raw errors, logs, stack traces, or service payloads
- Browser fingerprints, screen resolution, device model, or unnecessary browser metadata
- DOM autocapture, generic click recording, heatmaps, or session replay
- Anything after telemetry is disabled

Exact duration values are useful and safe enough. For clock time, collect `resume_local_hour` or a 30-minute bucket, not the complete date and timestamp.

Never send exception text (can contain entity IDs or config details).

## Shared properties

Include with applicable events:

| Property | Values / notes |
|----------|----------------|
| `autosnooze_version` | Integration version |
| `home_assistant_version` | HA core version |
| `event_schema_version` | Schema constant (start at `1`) |
| `source` | `card` \| `service` \| `timer` \| `startup` |
| `card_type` | `full` \| `snoozed_only` (when applicable) |

## Events

| Event | Properties |
|-------|------------|
| `integration_active` | Versions. Send on successful integration startup. |
| `card_viewed` | `card_type`. Throttle to once per installation per day, not every render. |
| `selection_feature_used` | `method: all` |
| `duration_option_selected` | `method: preset` |
| `snooze_created` | `strategy`, `input_method`, `duration_minutes`, `target_count`, `notification_trigger`, `notification_lead_minutes`, `confirmation_used` |
| `scheduled_snooze_created` | `minutes_until_start`, `planned_duration_minutes`, `target_count`, `resume_local_hour` |
| `scheduled_snooze_started` | `target_count`, `planned_duration_minutes` |
| `snooze_adjusted` | `delta_minutes`, `direction: extend` |
| `snooze_ended` | `reason: expired` |
| `scheduled_snooze_cancelled` | `target_count`, `minutes_before_start` |
| `notification_used` | `trigger: start` |
| `notification_cleared` | `target_count` |
| `operation_failed` | `operation`, fixed `error_code`, `strategy`, `target_count` |
| `confirmation_result` | `result: confirmed` |

### `snooze_created` strategy values

`duration`, `resume_datetime`, `resume_time`, `end_of_day`, `next_morning`, `next_sunrise`, `next_sunset`, `scheduled_window`

### `operation_failed` error_code allowlist

`invalid_duration`, `resume_time_past`, `disable_after_resume`, `confirmation_required`, `save_failed`, `notification_lead_too_long`, `automation_state_failed`, `unknown`

Map HA `translation_key` `confirm_required` → `confirmation_required`. Unlisted keys (for example `not_automation`, `adjust_time_too_short`, `invalid_adjustment`) → `unknown`. Emit `automation_state_failed` only where `async_set_automation_state` returning `False` is a deliberate failure outcome.

## Implementation boundary

```
Card interaction → local AutoSnooze backend → sanitize → TelemetryDeck
Backend result   → local AutoSnooze backend → sanitize → TelemetryDeck
```

Telemetry must never delay or fail an AutoSnooze action. Queue in memory, batch, use a short timeout, and silently discard on delivery failure.

### Architecture (thin)

Preferred dependency flow stays `services → application → runtime/infrastructure/domain/models`.

| Piece | Location |
|-------|----------|
| Schema table, queue, HTTP, install ID, `track()` | `infrastructure/telemetry.py` |
| Card-event trust boundary | Thin `report_telemetry` service + small application handler that sanitizes then calls `track()` |
| Backend outcome hooks | Beside `_log_command` / application success and failure exits; timer paths for timer-only events |
| Options toggle | `config_flow.py` Options + strings/translations |
| Frontend sink | `src/services/telemetry.ts` via feature slices (not components) |

No Aptabase. No frontend direct TelemetryDeck calls. No `domain/telemetry_schema.py` or `application/telemetry.py` facade unless a second caller shape appears.

## Build tasks

1. `EVENT_SCHEMAS` + `track()` + queue/HTTP + install ID Store (tests first)
2. Options toggle (default **on**) + `integration_active` on successful setup
3. Workflow / timer hooks for backend events
4. `report_telemetry` + card/feature UI events (`card_viewed` throttle included)

## Decisions log

| Decision | Choice |
|----------|--------|
| Provider | TelemetryDeck free tier |
| Namespace | `com.mossyhome` |
| Default sending | **On** (opt-out via Integration options) |
| Module shape | One `infrastructure/telemetry.py` |
| Install ID | Separate Store UUID → SHA256 `clientUser`, never in payload |
| Frontend path | features → `services/telemetry.ts` → `autosnooze.report_telemetry` |
