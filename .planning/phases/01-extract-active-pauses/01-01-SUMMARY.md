---
phase: 01-extract-active-pauses
plan: 01
subsystem: ui
tags: [lit, web-components, css, active-pauses, countdown-timer]

# Dependency graph
requires:
  - phase: none
    provides: "First phase, no prior dependencies"
provides:
  - "AutoSnoozeActivePauses LitElement child component"
  - "Extracted active pauses CSS styles (activePausesStyles)"
  - "Barrel exports in src/components/index.ts and src/styles/index.ts"
affects: [01-02, 04-compose-refactored-card]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Child component fires custom events (wake-automation, wake-all) instead of calling services directly"
    - "Parent passes data via properties; child never reads hass state directly"
    - "Two-tap confirmation pattern delegated to child with event bubbling"
    - "Synchronized countdown timer owned by child component lifecycle"

key-files:
  created:
    - src/components/autosnooze-active-pauses.ts
    - src/styles/active-pauses.styles.ts
    - tests/test_active_pauses.spec.ts
  modified:
    - src/components/index.ts
    - src/styles/index.ts
    - vitest.config.mjs

key-decisions:
  - "CSS duplicated temporarily (not removed from card.styles.ts) to avoid breaking parent until Plan 02 rewires"
  - "Component does not register custom element -- registration deferred to Plan 02 via src/index.ts"
  - "_wakeAllPending uses plain boolean instead of @state() decorator for simplicity (no render trigger needed, button text uses ternary in template)"

patterns-established:
  - "Event-driven child components: child fires bubbling composed CustomEvents, parent listens and calls services"
  - "Property-driven rendering: parent passes grouped data via reactive properties, child renders without querying hass"
  - "TDD with vitest: incremental test-first development for Lit components using jsdom environment"

# Metrics
duration: ~45min
completed: 2026-01-31
---

# Phase 1 Plan 01: Create Active Pauses Component Summary

**Standalone AutoSnoozeActivePauses LitElement component with extracted CSS, countdown timer lifecycle, wake/wake-all event dispatching, and two-tap confirmation**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-01-31T16:36:00Z
- **Completed:** 2026-01-31T17:21:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created standalone active pauses child component with full render template matching parent's inline implementation
- Extracted all active pauses CSS (base + mobile media queries + pulse-orange keyframes) into dedicated styles file
- Implemented event-driven architecture: child fires custom events, parent will handle services
- Built 13 comprehensive tests covering styles, component class, properties, events, timer lifecycle, and DOM rendering

## Task Commits

Each task was committed atomically:

1. **Task 1: Create active pauses styles file** - `5f34238` (feat)
2. **Task 2: Create active pauses component** - `e277af2` (feat)

## Files Created/Modified
- `src/styles/active-pauses.styles.ts` - Extracted CSS for active pauses section (base + mobile + keyframes)
- `src/styles/index.ts` - Added barrel export for activePausesStyles
- `src/components/autosnooze-active-pauses.ts` - LitElement child component with properties, events, timers, render
- `src/components/index.ts` - Added barrel export for AutoSnoozeActivePauses
- `tests/test_active_pauses.spec.ts` - 13 tests for styles and component
- `vitest.config.mjs` - Fixed lit alias to use regex (prevents intercepting lit/* subpath imports)

## Decisions Made
- CSS is temporarily duplicated between `active-pauses.styles.ts` and `card.styles.ts` -- removal happens in Plan 02 when parent is rewired. This avoids breaking anything during extraction.
- Component does not register itself as a custom element. Registration will be handled in `src/index.ts` during Plan 02.
- Used plain boolean for `_wakeAllPending` instead of `@state()` decorator -- the template already references it via ternary expression, and `requestUpdate()` is triggered by other reactive property changes. This matches how the parent card handled it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed vitest alias intercepting lit subpath imports**
- **Found during:** Task 1 (styles file test execution)
- **Issue:** The vitest alias `{ find: 'lit', replacement: '/node_modules/lit/index.js' }` used exact string matching that intercepted all `lit/*` subpath imports (like `lit/decorators.js`), causing import resolution failures
- **Fix:** Changed alias to use regex pattern `{ find: /^lit$/, replacement: '/node_modules/lit/index.js' }` which only matches the bare `lit` import
- **Files modified:** `vitest.config.mjs`
- **Verification:** All 659 tests pass, lit/decorators.js resolves correctly
- **Committed in:** `e277af2` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for test infrastructure. No scope creep.

## Issues Encountered
- TDD guard (globally installed PreToolUse hook) enforced strict one-test-at-a-time development, requiring incremental stub-then-implement cycles for each method. This increased execution time but resulted in thorough test coverage.
- Custom element registration in jsdom required explicit `customElements.define()` guards in each test that instantiates the component.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Child component is complete and ready for Plan 02 to wire it into the parent card
- Plan 02 will: register the custom element in src/index.ts, replace _renderActivePauses() in parent with `<autosnooze-active-pauses>`, add event listeners for wake-automation/wake-all, remove duplicated CSS from card.styles.ts, and update tests
- No blockers or concerns

---
*Phase: 01-extract-active-pauses*
*Completed: 2026-01-31*
