---
phase: 06-adjust-modal-component
plan: 02
subsystem: frontend-integration
tags: [lit, web-component, modal, events, service-integration, tests]
depends_on:
  requires: [06-01]
  provides: [Fully wired adjust modal with tap-to-open, service calls, tests, built bundle]
  affects: []
tech_stack:
  added: []
  patterns: [event-driven-parent-child, optimistic-ui-update, stop-propagation-on-nested-click]
key_files:
  created:
    - tests/test_adjust_modal.spec.js
  modified:
    - src/components/autosnooze-active-pauses.ts
    - src/styles/active-pauses.styles.ts
    - src/index.ts
    - src/components/autosnooze-card.ts
    - custom_components/autosnooze/www/autosnooze-card.js
decisions:
  - Tests call event handlers directly on parent card (jsdom Lit @event limitation across shadow DOM)
metrics:
  duration: ~4min
  completed: 2026-02-01
---

# Phase 6 Plan 02: Wire Adjust Modal Integration Summary

**One-liner:** Wired adjust modal into parent card with row tap events, stopPropagation on wake button, adjustSnooze service calls with optimistic UI, live hass sync, 20 new tests, and rebuilt bundle

## What Was Done

### Task 1: Wire active-pauses tap event, register component, and integrate modal into parent card
- Added `_fireAdjust(auto)` method to `AutoSnoozeActivePauses` that dispatches `adjust-automation` CustomEvent with entityId, friendlyName, resumeAt
- Made `.paused-item` rows tappable via `@click` binding to `_fireAdjust`
- Added `e.stopPropagation()` on wake button to prevent modal opening when clicking Resume
- Added `cursor: pointer` and hover/active states to `.paused-item` in active-pauses styles
- Registered `autosnooze-adjust-modal` custom element in `src/index.ts` before parent card
- Added 4 `@state()` modal properties to parent card: `_adjustModalOpen`, `_adjustModalEntityId`, `_adjustModalFriendlyName`, `_adjustModalResumeAt`
- Added `_handleAdjustAutomationEvent` handler that opens modal with automation details
- Added `_handleAdjustTimeEvent` handler that calls `adjustSnooze` service, performs optimistic resumeAt update, shows success/error toast with haptic feedback
- Added `_handleCloseModalEvent` handler that clears all modal state
- Added modal live sync in `updated()`: syncs resumeAt from hass data and auto-closes if automation is no longer paused
- Rendered `<autosnooze-adjust-modal>` in parent card template with full property and event bindings

### Task 2: Write tests, build, and verify
- Created `tests/test_adjust_modal.spec.js` with 20 tests covering:
  - Class importability and default property values
  - Rendering nothing when closed, full modal when open
  - Friendly name display (and fallback to entity_id)
  - Live countdown display with time format matching
  - 4 increment buttons (+15m, +30m, +1h, +2h) with correct labels
  - 2 decrement buttons (-15m, -30m) with correct labels
  - adjust-time event firing on increment/decrement clicks with correct params
  - close-modal event on close button and overlay click
  - Content click does NOT close modal (stopPropagation)
  - Decrement buttons disabled when remaining time too short (10min, 20min scenarios)
  - `_isDecrementDisabled` method unit tests
  - Timer cleanup on disconnect
- Built bundle successfully with `npm run build`
- All 703 JavaScript tests pass (668 existing + 20 new + 15 card compat)
- All 385 Python tests pass
- Bundle contains `autosnooze-adjust-modal` registration

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Tests use `createAndConnectElement` helper and direct event listeners | Consistent with established pattern from duration-selector tests; jsdom Lit @event limitation |

## Verification

- TypeScript compilation: PASS (zero errors via `npx tsc --noEmit`)
- Build: PASS (`npm run build` produces valid bundle)
- JavaScript tests: PASS (703/703, 17 test files, coverage thresholds met)
- Python tests: PASS (385/385)
- Bundle verification: `autosnooze-adjust-modal` appears in built output
- All existing tests unaffected (668 still pass)

## Next Phase Readiness

Phase 6 is complete. The adjust modal is fully integrated:
1. Users can tap any paused automation row to open the adjust modal
2. Modal shows automation name and live countdown timer
3. Increment buttons (+15m, +30m, +1h, +2h) call adjustSnooze service
4. Decrement buttons (-15m, -30m) call adjustSnooze with negative values
5. Decrement buttons are disabled when remaining time would drop below 1 minute
6. Optimistic UI updates keep countdown responsive during service calls
7. Modal syncs with live hass data and auto-closes if automation is no longer paused

Phase 7 (final cleanup/polish) can proceed.
