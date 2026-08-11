# Telemetry design sketch

Contract for implementation. Derived from `.planning/product-telemetry-plan.md`.

## Caller usage (written first)

```python
# setup after successful entry
await client.async_setup()
client.track("integration_active", {}, source="startup")

# application pause success
client.track(
    "snooze_created",
    {
        "strategy": "duration",
        "input_method": "card",
        "duration_minutes": 240,
        "target_count": 2,
        "notification_trigger": "none",
        "notification_lead_minutes": 0,
        "confirmation_used": False,
    },
    source="card",
)

# card via service
await async_handle_report_telemetry(hass, data, call)  # event + properties from card

# options off
entry.options.get("telemetry_enabled", True) is False  # track no-ops
```

```typescript
// feature / card shell
void reportTelemetry(hass, { event: "card_viewed", card_type: "full", source: "card" });
```

## Data shape

Organizing structure: **registry table** (`EVENT_SCHEMAS`), not scattered if/else.

```python
EVENT_SCHEMA_VERSION = "1"
TELEMETRYDECK_APP_ID = "C7769C33-556B-40B1-9C4D-0982BE33DEDE"
TELEMETRYDECK_NAMESPACE = "com.mossyhome"
TELEMETRY_STORAGE_KEY = f"{DOMAIN}.telemetry"
OPTION_TELEMETRY_ENABLED = "telemetry_enabled"  # default True

EVENT_SCHEMAS: dict[str, frozenset[str]]  # event -> allowed property keys beyond shared
ERROR_CODE_ALLOWLIST: frozenset[str]
TRANSLATION_KEY_TO_ERROR_CODE: dict[str, str]  # confirm_required -> confirmation_required; else unknown

@dataclass
class TelemetryClient:
    hass: HomeAssistant
    entry: ConfigEntry
    store: Store  # separate from pause store
    _install_id: str | None
    _queue: list[dict]
    _last_card_viewed_day: str | None
    # methods:
    # async_setup() -> load/create install id + last_card_viewed_day
    # is_enabled() -> bool from entry.options default True
    # track(event, properties, *, source, card_type=None) -> None  # sync enqueue + create_task flush
    # sanitize(event, properties) -> dict | None
    # async_flush() -> POST batch, short timeout, silent discard
```

Signal body posted to TelemetryDeck (array of):

```json
{
  "appID": "C7769C33-556B-40B1-9C4D-0982BE33DEDE",
  "clientUser": "<sha256 hex of install uuid>",
  "type": "snooze_created",
  "payload": {
    "autosnooze_version": "x.y.z",
    "home_assistant_version": "2024.1.0",
    "event_schema_version": "1",
    "source": "card",
    "strategy": "duration",
    "duration_minutes": "240",
    "target_count": "2"
  }
}
```

Payload values are primitives (strings preferred for TD). Install UUID never appears in `payload`.

## Module map

| Path | Role |
|------|------|
| `infrastructure/telemetry.py` | Client, schema, queue, HTTP |
| `application/report_telemetry.py` | Sanitize untrusted service payload → `track` |
| `services.py` | Register `report_telemetry` |
| `config_flow.py` | `telemetry_enabled` toggle default on |
| `runtime/state.py` | Optional `telemetry: TelemetryClient \| None` on `AutomationPauseData` |
| `src/services/telemetry.ts` | `reportTelemetry` fire-and-forget |
| Feature hooks | card_viewed, selection, duration, confirmation |
| Application hooks | pause/adjust/resume/scheduled/notifications/timers/setup |
| `README.md` | Why + what data + example payload |
| `tests/test_telemetry_*.py` | Schema, client, options, service |
| `src/tests/telemetry-report.spec.ts` | Frontend helper |

## Synthesis decision

Thin single infrastructure module + small application handler for the card trust boundary. Hook backend outcomes at workflow exits (and timer paths). Default telemetry **on**. Namespace `com.mossyhome`.
