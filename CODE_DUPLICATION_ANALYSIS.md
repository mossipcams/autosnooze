# Code Duplication Analysis Report - AutoSnooze Integration

This analysis identifies code duplication patterns in the AutoSnooze codebase, organized by severity.

---

## HIGH SEVERITY DUPLICATIONS

### 1. Duplicate Lovelace Registration Retry Logic

**Files:** `custom_components/autosnooze/__init__.py` (lines 109-117 and 144-153)

**Description:** The retry logic for Lovelace initialization is duplicated in `_async_register_lovelace_resource()`:
- Lines 109-117: Check if `lovelace_data` is None and retry
- Lines 144-153: Check if resources is None and retry (nearly identical pattern)

**Impact:** If retry behavior needs to change, both locations must be updated.

**Refactoring Suggestion:** Extract a helper function `_async_retry_lovelace_operation()` that encapsulates the retry logic, or create a decorator pattern for retryable operations.

---

### 2. Duplicate Data Serialization Patterns

**Files:**
- `custom_components/autosnooze/models.py` (lines 195-199)
- `custom_components/autosnooze/coordinator.py` (lines 206-207)

**Description:** The same dict comprehension pattern is duplicated. The methods `get_paused_dict()` and `get_scheduled_dict()` exist in `models.py` but aren't being used in `coordinator.py`.

**Code - coordinator.py duplicates the pattern inline:**
```python
save_data = {
    "paused": {k: v.to_dict() for k, v in data.paused.items()},
    "scheduled": {k: v.to_dict() for k, v in data.scheduled.items()},
}
```

**Refactoring Suggestion:** Use `data.get_paused_dict()` and `data.get_scheduled_dict()` instead of inline dict comprehensions.

---

### 3. Duplicate Automation Entity Filtering Functions

**Files:** `custom_components/autosnooze/services.py` (lines 41-50 and 53-63)

**Description:** Two very similar functions with nearly identical structure:
- `get_automations_by_area()` - filters by area_id
- `get_automations_by_label()` - filters by label

Both iterate the entity registry and filter automations, differing only in their filter criteria.

**Refactoring Suggestion:** Create a single `get_automations_by_filter()` function:
```python
def get_automations_by_filter(
    hass: HomeAssistant,
    filter_fn: Callable[[Any], bool]
) -> list[str]:
    entity_reg = er.async_get(hass)
    return [
        entity.entity_id
        for entity in entity_reg.entities.values()
        if entity.domain == "automation" and filter_fn(entity)
    ]
```

---

## MEDIUM SEVERITY DUPLICATIONS

### 4. Duplicate Timer Cancellation Functions

**Files:** `custom_components/autosnooze/coordinator.py` (lines 53-62)

**Description:** Two nearly identical functions for canceling timers:
- `cancel_timer()` - operates on `data.timers`
- `cancel_scheduled_timer()` - operates on `data.scheduled_timers`

**Refactoring Suggestion:** Create a generic `_cancel_timer()` helper:
```python
def _cancel_timer(timers: dict[str, Callable[[], None]], entity_id: str) -> None:
    if unsub := timers.pop(entity_id, None):
        unsub()
```

---

### 5. Duplicate Data Loading Logic

**Files:** `custom_components/autosnooze/coordinator.py` (lines 400-428 and 431-472)

**Description:** Very similar patterns for loading paused and scheduled automations. Both loops follow similar patterns with duplication of:
- Deletion checks (`hass.states.get(entity_id) is None`)
- Error handling (`except (KeyError, ValueError)`)
- Expiration handling

**Refactoring Suggestion:** Extract a generic loading pattern that works with both data types using a protocol/interface approach.

---

### 6. Duplicate Schema Definitions

**Files:** `custom_components/autosnooze/const.py` (lines 46-88)

**Description:** Three schema definitions (`PAUSE_SCHEMA`, `PAUSE_BY_AREA_SCHEMA`, `PAUSE_BY_LABEL_SCHEMA`) with nearly identical duration and date parameters:
```python
vol.Optional("days", default=0): cv.positive_int,
vol.Optional("hours", default=0): cv.positive_int,
vol.Optional("minutes", default=0): cv.positive_int,
vol.Optional("disable_at"): cv.datetime,
vol.Optional("resume_at"): cv.datetime,
```

**Refactoring Suggestion:** Create a base schema dictionary and spread it:
```python
DURATION_AND_DATE_SCHEMA = {
    vol.Optional("days", default=0): cv.positive_int,
    vol.Optional("hours", default=0): cv.positive_int,
    vol.Optional("minutes", default=0): cv.positive_int,
    vol.Optional("disable_at"): cv.datetime,
    vol.Optional("resume_at"): cv.datetime,
}

PAUSE_SCHEMA = vol.Schema({
    vol.Required(ATTR_ENTITY_ID): cv.entity_ids,
    **DURATION_AND_DATE_SCHEMA,
})
```

---

## LOW SEVERITY DUPLICATIONS

### 7. Repeated Unloaded State Checks

**Files:** `custom_components/autosnooze/coordinator.py` (6 locations)

**Description:** The pattern `if data.unloaded: return` appears multiple times as a guard clause.

**Refactoring Suggestion:** Could use a decorator, but guard clauses are an acceptable pattern:
```python
def check_unloaded(async_func):
    async def wrapper(hass, data, *args, **kwargs):
        if data.unloaded:
            return
        return await async_func(hass, data, *args, **kwargs)
    return wrapper
```

---

### 8. Model Serialization Methods

**Files:** `custom_components/autosnooze/models.py` (lines 86-98 and 127-133)

**Description:** `PausedAutomation.to_dict()` and `ScheduledSnooze.to_dict()` follow similar patterns but have different fields, making consolidation impractical without losing clarity.

---

## Summary

| Duplication Type | Files | Severity |
|---|---|---|
| Lovelace retry logic | `__init__.py` | HIGH |
| Serialization patterns | `models.py`, `coordinator.py` | HIGH |
| Automation filtering | `services.py` | HIGH |
| Timer cancellation | `coordinator.py` | MEDIUM |
| Data loading logic | `coordinator.py` | MEDIUM |
| Schema definitions | `const.py` | MEDIUM |
| Unloaded checks | `coordinator.py` | LOW |
| Model serialization | `models.py` | LOW |

## Recommended Refactoring Priority

1. **Priority 1 (Immediate):** Fix HIGH severity issues - they create significant maintenance burden
2. **Priority 2 (Soon):** Address MEDIUM severity issues when making related changes
3. **Priority 3 (Optional):** LOW severity issues can be addressed if pursuing comprehensive refactoring
