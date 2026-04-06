# Phase 5 Plan 1: Adjust Snooze Backend Service Summary

**One-liner:** `autosnooze.adjust` backend service with negative-capable schema, lock/mutate/save/notify coordinator, zero-delta and min-time validation, unload cleanup, and full i18n

## Changes Made

### Task 1: Add ADJUST_SCHEMA and async_adjust_snooze coordinator function
**Commit:** `18b3023`

- Added `ADJUST_SCHEMA` to `const.py` with `int` validators (not `cv.positive_int`) allowing negative values for days (-365..365), hours (-23..23), minutes (-59..59)
- Added `async_adjust_snooze` to `coordinator.py` following the established lock -> mutate -> save -> notify pattern
- Function validates adjusted time is at least 1 minute in the future via `ServiceValidationError`
- Clears stale `days`/`hours`/`minutes` fields after adjustment since `resume_at` becomes source of truth
- Cancels old timer and schedules new one via existing `schedule_resume` function
- Added `timedelta` import, `ServiceValidationError` import, and `DOMAIN` const import to coordinator

### Task 2: Add handle_adjust service handler, YAML definition, unload cleanup, and translations
**Commit:** `433630b`

- Added `handle_adjust` service handler in `services.py` with zero-delta validation (`timedelta() == timedelta()` check)
- Registered `adjust` service with `ADJUST_SCHEMA` in `register_services()`
- Added `adjust` service definition to `services.yaml` with `min: -365`/`-23`/`-59` number selectors
- Added `"adjust"` to unload service removal tuple in `__init__.py`
- Added adjust service strings to `translations/en.json` under `services`
- Added `invalid_adjustment` and `adjust_time_too_short` exception translation keys to `translations/en.json`

## Files Modified

| File | Change |
|------|--------|
| `custom_components/autosnooze/const.py` | Added `ADJUST_SCHEMA` with negative-capable int validators |
| `custom_components/autosnooze/coordinator.py` | Added `async_adjust_snooze` function + required imports |
| `custom_components/autosnooze/services.py` | Added `handle_adjust` handler + `adjust` service registration |
| `custom_components/autosnooze/services.yaml` | Added `adjust` service definition |
| `custom_components/autosnooze/__init__.py` | Added `"adjust"` to unload service tuple |
| `custom_components/autosnooze/translations/en.json` | Added adjust service strings + 2 exception translation keys |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use `int` not `cv.positive_int` in ADJUST_SCHEMA | Negative values needed for decrementing snooze time |
| Clear days/hours/minutes to 0 after adjust | resume_at is source of truth post-adjustment; stale duration fields would be misleading |
| Minimum 1 minute in future validation | Prevents accidental wake-up from over-reducing; matches design decision "block reduce below minimum" |
| ServiceValidationError raised inside lock | Exception propagates up, async context manager releases lock automatically |
| Zero-delta validation in handle_adjust (not coordinator) | Service-level concern; coordinator doesn't need to know about zero-delta edge case |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- ruff check: All checks passed
- ruff format: 7 files already formatted
- pyright: 0 errors, 0 warnings, 0 informations
- pytest: 369 passed in 6.46s (zero regressions)
- AST verification: ADJUST_SCHEMA, async_adjust_snooze, handle_adjust all present

## Metrics

- **Duration:** ~3 minutes
- **Completed:** 2026-02-01
- **Tasks:** 2/2
- **Test regressions:** 0
