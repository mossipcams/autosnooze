# Phase 5 Plan 02: Adjust Snooze Backend Tests Summary

**One-liner:** Comprehensive unit and integration tests for async_adjust_snooze covering all branches at 91.9% overall coverage

## Metadata

- **Phase:** 05-adjust-snooze-backend
- **Plan:** 02
- **Subsystem:** testing
- **Tags:** pytest, coordinator, services, integration-tests, unit-tests
- **Duration:** ~11 minutes
- **Completed:** 2026-02-01

### Dependency Graph

- **Requires:** 05-01 (adjust snooze implementation)
- **Provides:** Full test coverage for adjust snooze feature
- **Affects:** None (pure test plan)

### Tech Stack

- **Patterns:** Mock-based unit testing, HA integration test fixtures, service call testing

### File Tracking

- **Modified:** tests/test_coordinator.py, tests/test_integration.py

## What Was Done

### Task 1: TestAsyncAdjustSnooze unit tests (cd022e2)

Added 9 unit tests to `tests/test_coordinator.py` covering all branches of `async_adjust_snooze`:

1. **test_skips_when_unloaded** -- Verifies early return when `data.unloaded = True`
2. **test_warns_when_not_paused** -- Verifies no crash when entity not in paused dict
3. **test_adjusts_resume_at_forward** -- Verifies resume_at moves forward by delta
4. **test_adjusts_resume_at_backward** -- Verifies resume_at moves backward by negative delta
5. **test_clears_stale_duration_fields** -- Verifies days/hours/minutes cleared to 0
6. **test_raises_when_adjusted_time_too_short** -- Verifies ServiceValidationError for time <= now+1min
7. **test_calls_schedule_resume** -- Verifies schedule_resume called with correct args
8. **test_saves_after_adjust** -- Verifies async_save called once
9. **test_notifies_listeners** -- Verifies listener notification after adjust

### Task 2: TestAdjustService integration tests (0991f00)

Added 7 integration tests to `tests/test_integration.py` covering end-to-end service behavior:

1. **test_adjust_service_is_registered** -- Service exists after setup
2. **test_adjust_extends_snooze** -- Pause 1h, adjust +30m, verify delta
3. **test_adjust_shortens_snooze** -- Pause 2h, adjust -30m, verify delta
4. **test_adjust_rejects_zero_delta** -- Zero adjustment raises ServiceValidationError
5. **test_adjust_skips_non_paused_automation** -- Non-paused entity handled gracefully
6. **test_adjust_multiple_entities** -- Both entities adjusted when given multiple IDs
7. **test_adjust_service_removed_on_unload** -- Service removed after config entry unload

Also updated `test_setup_entry_registers_services` to include "adjust" in the service list.

## Decisions Made

None -- plan executed exactly as written.

## Deviations from Plan

None -- plan executed exactly as written.

## Test Results

- **Total tests:** 385 (369 existing + 16 new)
- **All passing:** Yes
- **Coverage:** 91.90% overall (85% threshold met)
  - coordinator.py: 88%
  - services.py: 89%
  - __init__.py: 92%
  - config_flow.py: 99%
  - models.py: 99%
  - sensor.py: 100%

## Commits

| Hash | Message |
|------|---------|
| cd022e2 | test(05-02): add TestAsyncAdjustSnooze unit tests |
| 0991f00 | test(05-02): add TestAdjustService integration tests |

## Next Phase Readiness

Phase 5 (Adjust Snooze Backend) is now complete. Both implementation (05-01) and tests (05-02) are done. Ready for Phase 6 (Adjust Snooze Frontend).
