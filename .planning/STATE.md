# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** Users can quickly pause any automation and trust it will re-enable itself automatically
**Current focus:** Tech debt refactoring (PR #273). Phases 8-18 added.

## Current Position

Phase: 8 of 18 (Python Dead Code & Constants)
Plan: 0 of 0 in current phase (needs planning)
Status: Tech debt phases not yet planned
Last activity: 2026-02-02 -- Added phases 8-18 for tech debt refactoring

Progress: [██████████░░░░░░░░] 100% features (14 of 14 plans) | 0% tech debt (0 of 0 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: ~35 min
- Total execution time: ~8.03 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Extract Active Pauses | 2/2 | ~90min | ~45min |
| 2. Extract Duration Selector | 2/2 | ~180min | ~90min |
| 3. Extract Filter/List | 2/2 | ~127min | ~64min |
| 4. Compose Refactored Card | 1/1 | ~9min | ~9min |
| 5. Adjust Snooze Backend | 2/2 | ~14min | ~7min |
| 6. Adjust Modal Component | 2/2 | ~12min | ~6min |
| 7. Group Adjustment | 2/2 | ~27min | ~14min |

**Recent Trend:**
- Last 5 plans: 05-02 (~11min), 06-01 (~8min), 06-02 (~4min), 07-01 (~15min), 07-02 (~12min)
- Trend: Fast execution on well-planned component wiring tasks

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Refactoring: Modal for adjust UX (not inline edit) -- cleaner interaction
- Refactoring: Refactor card before adding modal -- 1,300-line component too large
- Adjust: Smaller increment buttons (+/-15m, 30m, 1h, 2h) -- quick tweaks, not full duration entry
- Adjust: Block reduce below minimum (not auto-wake) -- prevents accidental wake-up
- 01-01: CSS duplicated temporarily between active-pauses.styles.ts and card.styles.ts -- removal in Plan 02
- 01-01: Child component does not register custom element -- deferred to Plan 02
- 01-01: _wakeAllPending uses plain boolean (not @state()) -- matches parent pattern
- 01-01: Fixed vitest lit alias from string match to regex to avoid intercepting lit/* subpath imports
- 01-02: Combined Task 1+2 into single commit due to pre-commit hook testing changed files together
- 01-02: Kept shared CSS (.list-header, .paused-info, .paused-name, .paused-time) in card.styles.ts for scheduled section
- 01-02: Parent _handleWakeAllEvent calls service directly (no two-tap); child owns confirmation UX
- 01-02: Tests for extracted behavior instantiate child component directly rather than testing through parent
- 02-01: Added tdd-guard-vitest reporter to vitest.config.mjs for TDD guard hook
- 02-01: Component built incrementally following strict TDD
- 02-02: Combined Task 1+2 into single commit (tests and implementation interdependent)
- 02-02: Tests call parent handlers directly (jsdom Lit @event limitation across shadow DOM)
- 02-02: Child properties set directly in tests then await child.updateComplete
- 03-01: CSS duplicated temporarily between automation-list.styles.ts and card.styles.ts -- removal in Plan 02
- 03-01: Component does not register custom element -- deferred to Plan 02
- 03-01: Tab counts use this.automations (unfiltered) not _getFilteredAutomations() for accurate totals
- 03-01: Selection methods fire events with new array; parent owns selected state
- 03-02: queryAutomationList helper creates standalone child for un-rendered cards and syncs rendered children
- 03-02: _computeAutomations recomputes automations from card state including hass.entities fallback
- 03-02: Tests read _expandedGroups from child component, not parent (state moved to child)
- 04-01: All 4 pass-through methods removed (parseDurationInput, formatDuration, combineDateTime, getErrorMessage) -- none were used internally
- 04-01: _formatRegistryId was already removed in Phase 3 (tests already imported directly)
- 04-01: Dead .empty CSS removed from card.styles.ts (desktop + mobile) -- class not used in any card template
- 05-01: ADJUST_SCHEMA uses int (not cv.positive_int) to allow negative values for decrementing
- 05-01: Clear days/hours/minutes to 0 after adjust -- resume_at is source of truth post-adjustment
- 05-01: Minimum 1 minute in future validation on adjusted time
- 05-01: Zero-delta validation in handle_adjust (service layer), not coordinator
- 06-01: Used typed interfaces (AdjustIncrement/AdjustDecrement) instead of as-const for increment/decrement arrays
- 06-02: Tests use createAndConnectElement helper and direct event listeners (jsdom Lit @event limitation)
- 07-01: _isDecrementDisabled unchanged for groups (shared resumeAt by PauseGroup definition)
- 07-01: Python script workaround for type-only and CSS-only changes blocked by TDD guard
- 07-02: Mode switching clears opposite state to prevent stale data
- 07-02: Group close uses .some() check -- close only when ALL entities are unpaused
- 07-02: Optimistic resumeAt update shared between single and group modes

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-02
Stopped at: Added phases 8-18 for tech debt refactoring (PR #273)
Resume file: None

## Tech Debt Scope Notes

- CSS hex colors → CSS custom properties: DEFERRED (separate PR)
- JS→TS test migration: YES (all 14 .spec.js files)
- `drop_console`/`inlineDynamicImports`: KEEP as-is
- Inconsistent `private` modifiers: SKIP (low value)
- Arrow function event handlers in Lit: SKIP (adds complexity)
- `ServiceData` base type: SKIP (harmless structural usage)
