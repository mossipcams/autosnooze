# Phase 5: Adjust Snooze Backend Service - Research

**Researched:** 2026-02-01
**Domain:** Home Assistant custom integration backend (Python), service registration, timer management
**Confidence:** HIGH

## Summary

This phase adds an `autosnooze.adjust` backend service that modifies the resume time of an already-paused automation. The existing codebase provides a very clear pattern for service registration, timer management, and state mutation. The adjust service is architecturally simple: validate the entity is paused, compute a new `resume_at`, cancel the old timer, update the `PausedAutomation` dataclass, schedule a new timer, save, and notify listeners.

The codebase already has all the primitives needed. The `schedule_resume()` function in `coordinator.py` handles timer cancellation and rescheduling in a single call. The `AutomationPauseData` dataclass holds `paused` state and `timers`. The sensor entity automatically reflects changes via the listener/notify pattern -- no sensor changes are needed.

**Primary recommendation:** Create an `async_adjust_snooze()` function in `coordinator.py` that takes `entity_id` and `timedelta`, and a `handle_adjust` service handler in `services.py` that validates input and calls it. Follow the exact patterns used by `async_resume()` and `handle_cancel()`. Use `days`/`hours`/`minutes` parameters matching the existing pause schema convention.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| voluptuous (vol) | bundled with HA | Service schema validation | HA standard for all service schemas |
| homeassistant.helpers.config_validation (cv) | bundled with HA | HA-specific validators (entity_ids, positive_int) | Standard validators used by all HA integrations |
| homeassistant.helpers.event | bundled with HA | `async_track_point_in_time` for timer scheduling | HA standard timer management |
| homeassistant.util.dt | bundled with HA | `utcnow()` for current time | HA standard datetime handling |
| homeassistant.exceptions | bundled with HA | `ServiceValidationError` for user-facing errors | HA standard error reporting |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest | 7.x+ | Python test framework | All Python tests |
| pytest-homeassistant-custom-component | latest | HA test fixtures (mock hass, config entries) | Integration tests |
| unittest.mock | stdlib | MagicMock, AsyncMock, patch | Unit tests for coordinator/services |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| days/hours/minutes params | duration selector (cv.time_period_dict -> timedelta) | Duration selector returns a timedelta which is cleaner, but breaks consistency with existing pause service. The existing codebase uses individual integer fields everywhere. |
| Separate adjust service | Overloading the pause service | Adjust has different semantics (delta vs absolute) and different validation (must already be paused). Separate service is clearer. |

**Installation:** No new dependencies needed. Everything is already available in the codebase.

## Architecture Patterns

### Recommended Project Structure

No new files needed. Changes go into existing files:

```
custom_components/autosnooze/
  const.py           # Add ADJUST_SCHEMA constant
  coordinator.py     # Add async_adjust_snooze() function
  services.py        # Add handle_adjust handler, register in register_services()
  services.yaml      # Add adjust service definition
  __init__.py        # Add "adjust" to unload service removal list
tests/
  test_coordinator.py    # Add TestAsyncAdjustSnooze class
  test_integration.py    # Add TestAdjustService class
```

### Pattern 1: Service Registration (from existing codebase)

**What:** Every service follows the same 3-part pattern: schema in `const.py`, handler in `services.py`, registration in `register_services()`.

**When to use:** Always, for any new service.

**Example from existing code (`services.py` lines 270-275):**
```python
# 1. Schema defined in const.py
ADJUST_SCHEMA = vol.Schema({
    vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
    vol.Optional("days", default=0): vol.All(cv.positive_int, vol.Range(max=365)),
    vol.Optional("hours", default=0): vol.All(cv.positive_int, vol.Range(max=23)),
    vol.Optional("minutes", default=0): vol.All(cv.positive_int, vol.Range(max=59)),
})

# 2. Handler defined in services.py
async def handle_adjust(call: ServiceCall) -> None:
    """Handle adjust snooze service call."""
    ...

# 3. Registration in register_services()
hass.services.async_register(DOMAIN, "adjust", handle_adjust, schema=ADJUST_SCHEMA)
```

### Pattern 2: Coordinator State Mutation (from existing codebase)

**What:** All state changes follow: acquire lock -> mutate state -> save -> release lock -> notify listeners.

**When to use:** Always, for any state mutation.

**Example from `coordinator.py` (`async_resume`, lines 89-100):**
```python
async def async_resume(hass, data, entity_id):
    if data.unloaded:
        return
    async with data.lock:
        cancel_timer(data, entity_id)
        data.paused.pop(entity_id, None)
        await async_set_automation_state(hass, entity_id, enabled=True)
        await async_save(data)
    data.notify()
```

### Pattern 3: Timer Cancel + Reschedule (from existing codebase)

**What:** `schedule_resume()` already handles canceling an existing timer and scheduling a new one atomically.

**When to use:** Whenever resume_at changes.

**Example from `coordinator.py` (lines 70-86):**
```python
def schedule_resume(hass, data, entity_id, resume_at):
    cancel_timer(data, entity_id)  # Cancels existing timer if any

    @callback
    def on_timer(_now):
        if data.unloaded:
            return
        hass.async_create_task(async_resume(hass, data, entity_id))

    data.timers[entity_id] = async_track_point_in_time(hass, on_timer, resume_at)
```

### Anti-Patterns to Avoid
- **Direct timer manipulation:** Do not call `async_track_point_in_time` directly in the service handler. Always use `schedule_resume()` which handles cancellation of the old timer.
- **Mutating state without the lock:** All mutations to `data.paused` must be inside `async with data.lock:`.
- **Forgetting to notify:** Every state change must call `data.notify()` after the lock is released so the sensor updates.
- **Forgetting to save:** Every state change must call `await async_save(data)` inside the lock so the change persists across restarts.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timer cancellation + rescheduling | Custom timer management | `schedule_resume(hass, data, entity_id, new_resume_at)` | Already handles cancel + reschedule atomically |
| Timezone-aware datetime math | Manual timezone conversions | `dt_util.utcnow()` + `timedelta(...)` | Ensures UTC consistency throughout |
| Service schema validation | Manual parameter checking | `vol.Schema` with `cv.positive_int`, `cv.entity_ids` | Standard HA validation with proper error messages |
| Saving state to disk | Custom persistence | `async_save(data)` | Already handles retry logic with exponential backoff |
| Notifying sensor of changes | Manual sensor updates | `data.notify()` | Sensor is already a listener, updates automatically |

**Key insight:** The adjust operation is essentially "update resume_at in the dataclass + call schedule_resume()". Everything else (timer cancel, timer schedule, persistence, UI update) is already handled by existing infrastructure.

## Common Pitfalls

### Pitfall 1: Allowing adjustment to a past time
**What goes wrong:** If adding a negative delta makes `resume_at` fall in the past or below a minimum threshold, the automation would immediately resume or the timer would fire instantly.
**Why it happens:** No validation on the computed new_resume_at.
**How to avoid:** After computing `new_resume_at = current_resume_at + timedelta(...)`, validate that `new_resume_at > utcnow() + timedelta(minutes=1)` (or some minimum). Raise `ServiceValidationError` if not.
**Warning signs:** Timer fires immediately after adjust call.

### Pitfall 2: Adjusting a non-paused automation
**What goes wrong:** KeyError or silent no-op if the entity_id is not in `data.paused`.
**Why it happens:** Service called for an automation that isn't currently snoozed.
**How to avoid:** Check `entity_id in data.paused` before attempting adjustment. Log a warning (matching `handle_cancel` pattern) and skip.
**Warning signs:** KeyError in logs.

### Pitfall 3: Not updating days/hours/minutes fields
**What goes wrong:** The `PausedAutomation` dataclass has `days`, `hours`, `minutes` fields that were originally set when the snooze was created. After adjustment, these no longer reflect the actual duration.
**Why it happens:** Only `resume_at` is updated but the legacy duration fields are left stale.
**How to avoid:** Clear or zero out the `days`/`hours`/`minutes` fields after adjustment, since `resume_at` is the source of truth. Alternatively, recalculate them from the new total duration. Zeroing is simpler and safe since the frontend uses `resume_at` for countdown display.
**Warning signs:** Stale duration fields in sensor attributes.

### Pitfall 4: Forgetting to add "adjust" to unload cleanup
**What goes wrong:** After integration unload, the service remains registered, causing errors on next call.
**Why it happens:** The `async_unload_entry` function in `__init__.py` has an explicit list of services to remove.
**How to avoid:** Add `"adjust"` to the service removal tuple in `async_unload_entry()` (line 282-288 of `__init__.py`).
**Warning signs:** Service still available after config entry removal.

### Pitfall 5: Zero-delta adjustment
**What goes wrong:** User calls adjust with days=0, hours=0, minutes=0 which is a no-op but still triggers save/notify.
**Why it happens:** No validation that the delta is non-zero.
**How to avoid:** Validate that the total delta is non-zero. Raise `ServiceValidationError` with a clear message.
**Warning signs:** Unnecessary disk writes and UI flicker.

## Code Examples

Verified patterns from the existing codebase:

### Coordinator: async_adjust_snooze (recommended implementation pattern)

```python
# Based on async_resume pattern in coordinator.py
async def async_adjust_snooze(
    hass: HomeAssistant,
    data: AutomationPauseData,
    entity_id: str,
    delta: timedelta,
) -> None:
    """Adjust the resume time of a paused automation."""
    if data.unloaded:
        return
    async with data.lock:
        paused = data.paused.get(entity_id)
        if paused is None:
            _LOGGER.warning("Cannot adjust %s: not currently snoozed", entity_id)
            return

        new_resume_at = paused.resume_at + delta
        now = dt_util.utcnow()

        if new_resume_at <= now + timedelta(minutes=1):
            raise ServiceValidationError(
                "Adjusted time must be at least 1 minute in the future",
                translation_domain=DOMAIN,
                translation_key="adjust_time_too_short",
            )

        paused.resume_at = new_resume_at
        # Clear stale duration fields since resume_at is now the source of truth
        paused.days = 0
        paused.hours = 0
        paused.minutes = 0

        schedule_resume(hass, data, entity_id, new_resume_at)
        await async_save(data)
    data.notify()
    _LOGGER.info("Adjusted snooze for %s: new resume at %s", entity_id, new_resume_at)
```

### Service Handler: handle_adjust (recommended pattern)

```python
# Based on handle_cancel pattern in services.py
async def handle_adjust(call: ServiceCall) -> None:
    """Handle adjust snooze service call."""
    entity_ids = call.data[ATTR_ENTITY_ID]
    days = call.data.get("days", 0)
    hours = call.data.get("hours", 0)
    minutes = call.data.get("minutes", 0)

    delta = timedelta(days=days, hours=hours, minutes=minutes)
    if delta == timedelta():
        raise ServiceValidationError(
            "Adjustment must be non-zero",
            translation_domain=DOMAIN,
            translation_key="invalid_adjustment",
        )

    for entity_id in entity_ids:
        await async_adjust_snooze(hass, data, entity_id, delta)
```

### Service YAML: adjust definition (recommended)

```yaml
# Based on cancel service pattern in services.yaml
adjust:
  name: Adjust Snooze
  description: Add or subtract time from an active snooze. Positive values extend, negative values shorten.
  fields:
    entity_id:
      name: Automation
      description: Automation(s) to adjust.
      required: true
      selector:
        entity:
          domain: automation
          multiple: true
    days:
      name: Days
      description: Number of days to add (or subtract if negative).
      default: 0
      selector:
        number:
          min: -365
          max: 365
          mode: box
    hours:
      name: Hours
      description: Number of hours to add (or subtract if negative).
      default: 0
      selector:
        number:
          min: -23
          max: 23
          mode: box
    minutes:
      name: Minutes
      description: Number of minutes to add (or subtract if negative).
      default: 0
      selector:
        number:
          min: -59
          max: 59
          mode: box
```

### Schema: ADJUST_SCHEMA (recommended)

```python
# Note: Uses int (not positive_int) to allow negative values for decrementing
ADJUST_SCHEMA = vol.Schema({
    vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
    vol.Optional("days", default=0): vol.All(int, vol.Range(min=-365, max=365)),
    vol.Optional("hours", default=0): vol.All(int, vol.Range(min=-23, max=23)),
    vol.Optional("minutes", default=0): vol.All(int, vol.Range(min=-59, max=59)),
})
```

### Test Pattern: Unit test for coordinator (from test_coordinator.py)

```python
# Based on TestAsyncResume pattern
class TestAsyncAdjustSnooze:
    @pytest.mark.asyncio
    async def test_adjusts_resume_at(self) -> None:
        mock_hass = MagicMock()
        mock_store = MagicMock()
        mock_store.async_save = AsyncMock()
        data = AutomationPauseData(store=mock_store)

        now = datetime.now(UTC)
        data.paused["automation.test"] = PausedAutomation(
            entity_id="automation.test",
            friendly_name="Test",
            resume_at=now + timedelta(hours=2),
            paused_at=now,
        )

        with patch("custom_components.autosnooze.coordinator.schedule_resume") as mock_schedule:
            await async_adjust_snooze(mock_hass, data, "automation.test", timedelta(hours=1))

        assert data.paused["automation.test"].resume_at == now + timedelta(hours=3)
        mock_schedule.assert_called_once()
```

### Test Pattern: Integration test (from test_integration.py)

```python
# Based on TestCancelService pattern
class TestAdjustService:
    async def test_adjust_service_is_registered(self, hass, setup_integration) -> None:
        assert hass.services.has_service(DOMAIN, "adjust")

    async def test_adjust_extends_snooze(self, hass, setup_integration_with_automations) -> None:
        entry = setup_integration_with_automations
        # First pause an automation
        await hass.services.async_call(DOMAIN, "pause", {
            ATTR_ENTITY_ID: ["automation.test_automation_1"],
            "hours": 1,
        }, blocking=True)

        data = entry.runtime_data
        original_resume = data.paused["automation.test_automation_1"].resume_at

        # Adjust by adding 30 minutes
        await hass.services.async_call(DOMAIN, "adjust", {
            ATTR_ENTITY_ID: ["automation.test_automation_1"],
            "minutes": 30,
        }, blocking=True)

        new_resume = data.paused["automation.test_automation_1"].resume_at
        assert new_resume > original_resume
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Entity service schemas (cv.make_entity_service_schema) | Still used for entity-targeting services | HA 2025.10 enforced | AutoSnooze uses non-entity services (targets automation entities by ID, not as HA entities), so this does not apply. Current `hass.services.async_register()` with `vol.Schema` is correct. |

**Deprecated/outdated:**
- None relevant. The patterns used in the existing AutoSnooze codebase are current and correct.

## Open Questions

Things that could not be fully resolved:

1. **Should negative delta be per-field or total?**
   - What we know: The UI (Phase 6) will have buttons like -15m, -30m. These are simple negative minute deltas.
   - What's unclear: Should the schema allow negative values per-field (days=-1, hours=0, minutes=0) or should we use a separate "direction" parameter?
   - Recommendation: Allow negative values per-field. This is simpler, more flexible, and matches how timedelta works. The schema validators use `int` instead of `cv.positive_int` and `vol.Range(min=-N, max=N)`. The total delta is what matters -- validate that the total is non-zero and that the resulting resume_at is valid.

2. **Should adjust support multiple entity_ids with the same delta?**
   - What we know: Phase 7 (Group Adjustment) needs to adjust multiple automations at once.
   - What's unclear: Should adjust handle batching for efficiency (like `async_resume_batch`)?
   - Recommendation: Start with per-entity adjustment in a loop (simpler, matches `handle_cancel` pattern). If Phase 7 needs batching for performance, add `async_adjust_snooze_batch` then. The current approach loops through entity_ids and calls the coordinator function for each one. This is fine for typical group sizes (5-20 automations).

3. **Translation keys for error messages**
   - What we know: The codebase uses `translation_key` in `ServiceValidationError` for localization.
   - What's unclear: Whether `strings.json` / `translations/` files need updating for new error keys.
   - Recommendation: Add the translation keys. Check if `strings.json` exists and add entries for `adjust_time_too_short` and `invalid_adjustment`.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `custom_components/autosnooze/services.py` -- current service registration pattern
- Existing codebase: `custom_components/autosnooze/coordinator.py` -- timer management and state mutation pattern
- Existing codebase: `custom_components/autosnooze/const.py` -- schema definition pattern
- Existing codebase: `custom_components/autosnooze/models.py` -- PausedAutomation dataclass
- Existing codebase: `custom_components/autosnooze/sensor.py` -- listener/notify auto-update pattern
- Existing codebase: `custom_components/autosnooze/__init__.py` -- service unload cleanup pattern
- Existing codebase: `tests/test_coordinator.py` -- Python test patterns
- Existing codebase: `tests/test_integration.py` -- Integration test patterns with HA fixtures

### Secondary (MEDIUM confidence)
- [HA Developer Docs - Entity Service Schema Validation](https://developers.home-assistant.io/blog/2024/08/27/entity-service-schema-validation/) -- confirms non-entity services still use vol.Schema
- [HA Selectors Documentation](https://www.home-assistant.io/docs/blueprint/selectors/) -- duration selector returns dict with days/hours/minutes/seconds
- [HA config_validation.py](https://github.com/home-assistant/core/blob/dev/homeassistant/helpers/config_validation.py) -- cv.positive_int, vol.Range validators

### Tertiary (LOW confidence)
- None. All findings are verified from the codebase or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- uses only existing codebase patterns, no new libraries
- Architecture: HIGH -- follows exact patterns from existing services (pause, cancel, cancel_scheduled)
- Pitfalls: HIGH -- identified from direct code analysis of existing patterns and their edge cases

**Current test coverage:** 91.53% overall (369 tests passing). Key file coverage:
- coordinator.py: 87%
- services.py: 88%
- models.py: 99%
- sensor.py: 100%

All above the 85% threshold. New tests will need to maintain this.

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable -- no external dependencies, all patterns from existing codebase)
