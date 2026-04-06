---
phase: 06-adjust-modal-component
plan: 01
subsystem: frontend-modal
tags: [lit, web-component, modal, css, translations, service-wrapper]
depends_on:
  requires: [05-01, 05-02]
  provides: [AutoSnoozeAdjustModal component, adjustModalStyles, adjustSnooze service wrapper, translation keys]
  affects: [06-02]
tech_stack:
  added: []
  patterns: [css-overlay-modal, event-driven-child-component, synchronized-countdown]
key_files:
  created:
    - src/components/autosnooze-adjust-modal.ts
    - src/styles/adjust-modal.styles.ts
  modified:
    - src/components/index.ts
    - src/styles/index.ts
    - src/services/snooze.ts
    - src/constants/index.ts
    - src/localization/translations/en.json
    - src/localization/translations/es.json
    - src/localization/translations/fr.json
    - src/localization/translations/de.json
    - src/localization/translations/it.json
    - tests/fixtures/backend-errors.json
    - tests/fixtures/backend-responses.json
    - tests/fixtures/services-schema.json
decisions:
  - Used typed interfaces (AdjustIncrement/AdjustDecrement) instead of as-const for increment/decrement arrays to avoid narrow union type errors in template expressions
metrics:
  duration: ~8min
  completed: 2026-02-01
---

# Phase 6 Plan 01: Adjust Modal Component, Styles, Service Wrapper, and Translations Summary

**One-liner:** Standalone adjust modal Lit component with CSS overlay, live countdown, increment/decrement buttons, adjustSnooze service wrapper, and 5-language translations

## What Was Done

### Task 1: Create adjust modal styles, service wrapper, and translations
- Created `src/styles/adjust-modal.styles.ts` with full modal CSS: overlay (fixed positioning, z-index 999), modal content (card background, rounded corners, shadow), header with title and close button, live countdown display (tabular-nums), increment button grid (4-column), decrement button grid (2-column), disabled states, hover/active/focus-visible states, and mobile responsive overrides at 480px breakpoint
- Updated `src/styles/index.ts` barrel export with `adjustModalStyles`
- Added `adjustSnooze` function to `src/services/snooze.ts` following the established service wrapper pattern
- Added translation keys to all 5 languages (en, es, fr, de, it): `adjust.remaining`, `adjust.add_time`, `adjust.reduce_time`, `toast.success.adjusted`, `toast.error.adjust_failed`, `a11y.close_adjust_modal`, `a11y.adjust_automation`, `a11y.add_minutes`, `a11y.reduce_minutes`

### Task 2: Create adjust modal component
- Created `src/components/autosnooze-adjust-modal.ts` as `AutoSnoozeAdjustModal extends LitElement`
- Reactive properties: `hass` (attribute: false), `open` (Boolean), `entityId` (String), `friendlyName` (String), `resumeAt` (String)
- Timer lifecycle: starts synchronized countdown when `open` transitions to true, stops on close or disconnect (same pattern as active-pauses)
- Render: modal overlay with click-to-close, header with friendly name and close button, live countdown via `formatCountdown`, 4 increment buttons (+15m, +30m, +1h, +2h), 2 decrement buttons (-15m, -30m) with disabled logic (remaining - threshold < 1 minute)
- Events: fires `adjust-time` (with entityId + params) and `close-modal` -- does NOT call services directly
- Updated `src/components/index.ts` barrel export

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing ERROR_MESSAGES entries for adjust error keys**
- **Found during:** Task 1 (pre-commit test failure)
- **Issue:** Phase 5 added backend exceptions `invalid_adjustment` and `adjust_time_too_short` but the frontend `ERROR_MESSAGES` constant in `src/constants/index.ts` was not updated, causing `test_backend_schema.spec.js` to fail
- **Fix:** Added both error message entries to `ERROR_MESSAGES`
- **Files modified:** `src/constants/index.ts`
- **Commit:** e3fccb3

**2. [Rule 1 - Bug] Missing test fixtures for adjust service errors**
- **Found during:** Task 1 (cascading test failure from above)
- **Issue:** `tests/fixtures/backend-errors.json`, `backend-responses.json`, and `services-schema.json` were missing the adjust service and its error types
- **Fix:** Added `invalid_adjustment` and `adjust_time_too_short` to all three fixture files, plus the adjust service definition to `services-schema.json`
- **Files modified:** `tests/fixtures/backend-errors.json`, `tests/fixtures/backend-responses.json`, `tests/fixtures/services-schema.json`
- **Commit:** e3fccb3

**3. [Rule 3 - Blocking] TypeScript type narrowing with as-const arrays**
- **Found during:** Task 2 (TypeScript compilation error)
- **Issue:** Using `as const` on `ADJUST_INCREMENTS` created a discriminated union where some members lacked `hours` and others lacked `minutes`, causing TS2339 errors when accessing these properties in the template
- **Fix:** Replaced `as const` with explicit `AdjustIncrement[]` and `AdjustDecrement[]` interface types with optional fields
- **Files modified:** `src/components/autosnooze-adjust-modal.ts`
- **Commit:** 173ee5e

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Used typed interfaces instead of `as const` | Avoids narrow union type errors in Lit template expressions where we conditionally access `hours` or `minutes` |

## Verification

- TypeScript compilation: PASS (zero errors)
- All 5 JSON translation files: valid and contain all required keys
- Barrel exports updated: both `src/components/index.ts` and `src/styles/index.ts`
- All 668 existing tests pass
- No existing functionality changed (no custom element registration, no parent modifications)

## Next Phase Readiness

Plan 06-02 can proceed immediately. It needs to:
1. Register `autosnooze-adjust-modal` custom element in `src/index.ts`
2. Wire the parent card to open the modal
3. Wire active-pauses to fire tap events
4. Handle `adjust-time` events in the parent (call `adjustSnooze` service)
