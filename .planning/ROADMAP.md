# Roadmap: AutoSnooze - Adjust Snooze Milestone

## Overview

This milestone adds the ability to adjust remaining snooze time on already-paused automations. Because the card component is too large (~1,300 lines) to add a modal cleanly, the work begins with a multi-phase refactoring that extracts sub-components one at a time, validates tests at each step, then recomposes the card. Once the card is modular, the backend adjust service is built, followed by the adjust modal UI, and finally group-level adjustment. Phases 8-17 address tech debt identified in PR #273 review. Every phase produces independently verifiable results.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Extract Active Pauses Component** - Pull the active pauses section into its own Lit component
- [x] **Phase 2: Extract Duration Selector Component** - Pull duration input and preset pills into their own Lit component
- [x] **Phase 3: Extract Filter/List Component** - Pull filter tabs and automation list into their own Lit component
- [x] **Phase 4: Compose Refactored Card** - Rewire main card to orchestrate sub-components, validate full test suite
- [x] **Phase 5: Adjust Snooze Backend Service** - Add backend service and coordinator support for modifying resume time
- [x] **Phase 6: Adjust Modal Component** - Build the adjust modal UI with increment/decrement controls
- [x] **Phase 7: Group Adjustment** - Extend adjust modal to work on groups via header tap
- [ ] **Phase 8: Python Dead Code & Constants** - Remove dead code, extract magic numbers, add type hints
- [ ] **Phase 9: Python Batch Adjust & Sensor** - Add batch adjust method, sensor type hints, options listener
- [ ] **Phase 10: Frontend Dead Code Removal** - Remove unused barrel files, exports, and functions
- [ ] **Phase 11: Frontend Constants & Shared Refs** - Export SENSOR_ENTITY_ID, replace magic milliseconds with TIME_MS
- [ ] **Phase 12: Frontend Hardcoded Strings** - Localize remaining English strings across all translation files
- [ ] **Phase 13: Frontend Component Improvements** - Modal accessibility, caching, preset extraction, countdown utility, type safety
- [ ] **Phase 14: Frontend CSS Deduplication** - Extract shared paused-item styles into shared.styles.ts
- [ ] **Phase 15: Test Infrastructure** - Shared test helpers, remove unused deps, add TS typecheck for tests in CI
- [ ] **Phase 16: JS to TS Test Migration** - Migrate all 14 .spec.js files to TypeScript
- [ ] **Phase 17: Final Validation** - Full suite verification across Python and Frontend stacks
- [ ] **Phase 18: Squash Commits** - Squash tech debt commits into clean atomic commit groups for PR

## Phase Details

### Phase 1: Extract Active Pauses Component
**Goal**: The active pauses section (countdown timers, paused automation rows) lives in its own Lit component that renders identically to the current inline implementation
**Depends on**: Nothing (first phase)
**Requirements**: REF-02
**Success Criteria** (what must be TRUE):
  1. A new `autosnooze-active-pauses` (or similarly named) Lit component exists in `src/components/`
  2. The main card imports and renders this component in place of the inline active pauses markup
  3. Active pauses display identically to before -- countdown timers tick, wake buttons work, toast notifications fire
  4. All existing tests pass (`npm test` and `pytest tests/`)
  5. CI coverage thresholds remain at 85% or above on both stacks
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Create active pauses child component and extracted styles
- [x] 01-02-PLAN.md -- Wire child into parent card, update tests, build and verify

### Phase 2: Extract Duration Selector Component
**Goal**: The duration input area (days/hours/minutes fields, quick-duration preset pills, custom duration mode) lives in its own Lit component
**Depends on**: Phase 1
**Requirements**: REF-03
**Success Criteria** (what must be TRUE):
  1. A new `autosnooze-duration-selector` (or similarly named) Lit component exists in `src/components/`
  2. The main card imports and renders this component in place of the inline duration selector markup
  3. Duration input works identically -- typing values, clicking preset pills, switching between duration and schedule modes all function
  4. All existing tests pass
  5. CI coverage thresholds remain met
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md -- Create duration selector component and extracted styles
- [x] 02-02-PLAN.md -- Wire child into parent card, update tests, build and verify

### Phase 3: Extract Filter/List Component
**Goal**: The filter tabs (All/Area/Category/Label) and the automation list with search live in their own Lit component
**Depends on**: Phase 2
**Requirements**: REF-04
**Success Criteria** (what must be TRUE):
  1. A new `autosnooze-automation-list` (or similarly named) Lit component exists in `src/components/`
  2. The main card imports and renders this component in place of the inline filter tabs and automation list markup
  3. Tab switching, search filtering, automation selection, and group headers all work identically
  4. All existing tests pass
  5. CI coverage thresholds remain met
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md -- Create automation list child component and extracted styles
- [x] 03-02-PLAN.md -- Wire child into parent card, update 12 test files, build and verify

### Phase 4: Compose Refactored Card
**Goal**: The main card component is now a thin orchestrator that composes sub-components, and the full test suite validates the refactored architecture
**Depends on**: Phase 3
**Requirements**: REF-01, REF-06, REF-07
**Success Criteria** (what must be TRUE):
  1. The main `autosnooze-card.ts` is significantly smaller (orchestration logic only, no large inline render blocks for pauses, duration, or filter/list)
  2. All three extracted components are imported and rendered by the main card
  3. Every existing test passes without modification (or with minimal import-path updates)
  4. `npm test` reports 85%+ coverage on branches, functions, lines, and statements
  5. `pytest tests/` reports 85%+ coverage
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md -- Audit dead code, remove pass-through methods, verify full pipeline

### Phase 5: Adjust Snooze Backend Service
**Goal**: A backend service exists that modifies the resume time of an already-paused automation by canceling the current timer and scheduling a new one
**Depends on**: Phase 4
**Requirements**: ADJ-07, ADJ-08
**Success Criteria** (what must be TRUE):
  1. An `autosnooze.adjust` service (or equivalent) is registered and callable from HA Developer Tools
  2. Calling the service with an entity_id and a time delta updates the `resume_at` in the coordinator's paused state
  3. The old `async_track_point_in_time` timer is canceled and a new one is scheduled for the updated resume time
  4. The sensor entity reflects the updated resume time in its attributes after adjustment
  5. Python tests cover the adjust service with 85%+ coverage maintained
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md -- Implement adjust service: schema, coordinator function, handler, YAML, unload, translations
- [x] 05-02-PLAN.md -- Write unit tests (coordinator) and integration tests (service) for adjust feature

### Phase 6: Adjust Modal Component
**Goal**: Users can tap any active paused automation to open a modal that shows remaining time and lets them add or reduce time with increment buttons
**Depends on**: Phase 5
**Requirements**: REF-05, ADJ-01, ADJ-02, ADJ-03, ADJ-04, ADJ-05
**Success Criteria** (what must be TRUE):
  1. Tapping a paused automation row opens a modal dialog (not inline editing)
  2. The modal displays the automation name and current remaining time (counting down)
  3. Increment buttons (+15m, +30m, +1h, +2h) add time and call the backend adjust service
  4. Decrement buttons (-15m, -30m) reduce time and call the backend adjust service
  5. Decrement buttons are disabled when remaining time would drop below 1 minute
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md -- Create adjust modal component, styles, service wrapper, and translations
- [x] 06-02-PLAN.md -- Wire modal into parent card, add row tap events, write tests, build and verify

### Phase 7: Group Adjustment
**Goal**: Users can tap a group header to open the adjust modal and modify snooze time for all automations in that group simultaneously
**Depends on**: Phase 6
**Requirements**: ADJ-06
**Success Criteria** (what must be TRUE):
  1. Tapping a group header (e.g., area name or label name) in the active pauses section opens the adjust modal
  2. The modal indicates it is adjusting multiple automations (shows count or list)
  3. Increment/decrement buttons apply the time delta to all automations in the group via the backend service
  4. The minimum-time guard applies per-automation (if any single automation would drop below 1 minute, that decrement button is disabled)
**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md -- Add group mode to modal, active-pauses header event, service wrapper, translations, and styles
- [x] 07-02-PLAN.md -- Wire group mode into parent card, write tests, build and verify

### Phase 8: Python Dead Code & Constants
**Goal**: Dead code removed from config_flow, magic numbers extracted to const.py, type hints added to config_flow and coordinator
**Depends on**: Phase 7 (independent of frontend track)
**Requirements**: Tech debt PR #273 — Group 1
**Success Criteria** (what must be TRUE):
  1. `parse_duration_presets()` and `format_presets()` deleted from config_flow.py along with their tests
  2. `MINUTES_PER_DAY`, `MINUTES_PER_YEAR`, `MIN_ADJUST_BUFFER`, `NUM_PRESET_FIELDS` defined in const.py
  3. config_flow.py and coordinator.py import and use new constants instead of magic numbers
  4. Type hints added: `config_entry: ConfigEntry`, return type `-> ConfigFlowResult`
  5. `pytest tests/ -v && ruff check && pyright` all pass
**Plans**: 0 plans

Plans:
(none yet)

### Phase 9: Python Batch Adjust & Sensor
**Goal**: Batch adjust method reduces lock contention, sensor has proper type hints, options update listener reloads entry on config change
**Depends on**: Phase 8
**Requirements**: Tech debt PR #273 — Group 2
**Success Criteria** (what must be TRUE):
  1. `async_adjust_snooze_batch()` exists in coordinator.py with single lock acquisition
  2. `handle_adjust` in services.py uses batch method instead of per-entity loop
  3. Sensor has typed `hass: HomeAssistant`, `async_add_entities: AddEntitiesCallback`, `dict[str, Any]` return
  4. Options update listener registered in `__init__.py` with proper unload
  5. `pytest tests/ -v && pyright` pass
**Plans**: 0 plans

Plans:
(none yet)

### Phase 10: Frontend Dead Code Removal
**Goal**: Unused barrel files, exports, and functions removed from frontend source
**Depends on**: Phase 7 (independent of Python track)
**Requirements**: Tech debt PR #273 — Group 3
**Success Criteria** (what must be TRUE):
  1. `src/styles/index.ts`, `src/types/index.ts`, `src/state/index.ts` deleted
  2. Test imports updated to point at specific module files
  3. Unused exports removed: `getPausedList`, `getScheduledList`, `getPausedCount`, `getScheduledCount`, `pauseByArea`, `pauseByLabel`, `isDateTimeInPast`, `ToastConfig`, `LovelaceCard`, `LovelaceCardEditor`, `ConfigChangedEvent`
  4. `supportedLocales`, `SupportedLocale`, `isLocaleSupported`, `getLocaleFromHass` un-exported (kept internal)
  5. `npm run build && npm test && npm run typecheck` pass
**Plans**: 0 plans

Plans:
(none yet)

### Phase 11: Frontend Constants & Shared Refs
**Goal**: Hardcoded sensor entity IDs and magic milliseconds replaced with shared constants
**Depends on**: Phase 10
**Requirements**: Tech debt PR #273 — Group 4
**Success Criteria** (what must be TRUE):
  1. `SENSOR_ENTITY_ID` exported from `src/state/paused.ts`
  2. All hardcoded `sensor.autosnooze_status` strings in card and duration-selector use imported constant
  3. `86400000`, `3600000`, `60000` replaced with `TIME_MS.DAY`, `TIME_MS.HOUR`, `TIME_MS.MINUTE`
  4. Adjust modal magic milliseconds replaced with `TIME_MS` expressions
  5. `npm run build && npm test` pass
**Plans**: 0 plans

Plans:
(none yet)

### Phase 12: Frontend Hardcoded Strings
**Goal**: Remaining hardcoded English strings localized through translation system
**Depends on**: Phase 11
**Requirements**: Tech debt PR #273 — Group 5
**Success Criteria** (what must be TRUE):
  1. `getAreaName` and `getCategoryName` accept optional fallback param
  2. `formatCountdown` accepts optional `fallbackExpired` param
  3. All 5 translation files have `status.resuming` and `duration.custom` keys
  4. Duration selector 'Custom' pill uses `localize(this.hass, 'duration.custom')`
  5. `npm run build && npm test` pass
**Plans**: 0 plans

Plans:
(none yet)

### Phase 13: Frontend Component Improvements
**Goal**: Accessibility attributes on modals, cached filtered automations, extracted duplicate logic, shared countdown utility, type safety fixes
**Depends on**: Phase 12
**Requirements**: Tech debt PR #273 — Group 6
**Success Criteria** (what must be TRUE):
  1. Adjust modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape key handler
  2. Active pauses items have `role="button"`, `tabindex="0"`, keyboard handlers
  3. Dead `_handleKeyDown` removed from automation-list; filtered automations computed once per render
  4. Shared `countdown-timer.ts` utility used by active-pauses and adjust-modal
  5. Type safety: `HapticFeedbackType` used instead of `string`, `PausedAutomationAttribute` return type
  6. `npm run build && npm test && npm run typecheck` pass
**Plans**: 0 plans

Plans:
(none yet)

### Phase 14: Frontend CSS Deduplication
**Goal**: Shared paused-item CSS extracted into shared.styles.ts, duplicates removed from card and active-pauses styles
**Depends on**: Phase 13
**Requirements**: Tech debt PR #273 — Group 7
**Success Criteria** (what must be TRUE):
  1. `src/styles/shared.styles.ts` exists with `.list-header`, `.paused-info`, `.paused-name`, `.paused-time` rules
  2. Card and active-pauses components use `[sharedPausedStyles, componentStyles]` pattern
  3. Duplicated rules removed from card.styles.ts and active-pauses.styles.ts
  4. `npm run build && npm test` pass
**Plans**: 0 plans

Plans:
(none yet)

### Phase 15: Test Infrastructure
**Goal**: Shared test helpers extracted, unused deps removed, TS typecheck for tests added to CI
**Depends on**: Phase 14
**Requirements**: Tech debt PR #273 — Group 8
**Success Criteria** (what must be TRUE):
  1. `tests/helpers/query-helpers.ts` has typed `computeAutomations`, `queryAutomationList`, etc.
  2. `@vitest/coverage-v8`, `@babel/core`, `@babel/preset-env` removed from package.json
  3. `babel.config.js` deleted, legacy coverage exclude removed from vitest config
  4. `typecheck:test` script added to package.json and `.github/workflows/build.yml`
  5. `npm test && npm run typecheck:test && npm run build` pass
**Plans**: 0 plans

Plans:
(none yet)

### Phase 16: JS to TS Test Migration
**Goal**: All 14 .spec.js files migrated to TypeScript with type annotations and shared helpers
**Depends on**: Phase 15
**Requirements**: Tech debt PR #273 — Group 9
**Success Criteria** (what must be TRUE):
  1. Core component tests migrated: `test_card_ui`, `test_adjust_modal`, `test_duration_selector`
  2. Category/layout/defect tests migrated: `test_automation_categories`, `test_layout_switching`, `test_defects`
  3. Mutation/boundary tests migrated: `test_mutation_operators`, `test_mutation_coverage`, `test_boundary_mutations`
  4. Infrastructure tests migrated: `test_cleanup`, `test_console_monitoring`, `test_card_compatibility`, `test_backend_schema`, `test_stress`
  5. No `.spec.js` files remain in tests/; `npm test && npm run typecheck:test` pass
**Plans**: 0 plans

Plans:
(none yet)

### Phase 17: Final Validation
**Goal**: Full-stack verification confirming all tech debt changes work together — no code changes, verification only
**Depends on**: Phase 16
**Requirements**: Tech debt PR #273 — Group 10
**Success Criteria** (what must be TRUE):
  1. `pytest tests/ -v --cov=custom_components/autosnooze --cov-fail-under=85` passes
  2. `ruff check && ruff format --check && pyright` pass
  3. `npm run build && npm test && npm run typecheck && npm run typecheck:test && npm run lint:fix` pass
  4. No `.spec.js` files remain in tests/
  5. All tech debt items from PR #273 review addressed (except deferred items)
**Plans**: 0 plans

Plans:
(none yet)

### Phase 18: Squash Commits
**Goal**: Squash tech debt commits into clean atomic commit groups matching the original 10-group plan structure for a clean PR
**Depends on**: Phase 17
**Requirements**: Tech debt PR #273
**Success Criteria** (what must be TRUE):
  1. Tech debt commits squashed into logical groups matching plan structure
  2. Each squashed commit has a clean conventional commit message
  3. All tests still pass after squash
  4. Git history is clean and reviewable
**Plans**: 0 plans

Plans:
(none yet)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7
Tech debt phases: 8 -> 9 (Python track) | 10 -> 11 -> 12 -> 13 -> 14 (Frontend track) | 15 -> 16 -> 17 -> 18 (Test/Final track)
Python and Frontend tracks are independent. Test track depends on Frontend completing (Phase 14).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Extract Active Pauses | 2/2 | Complete | 2026-01-31 |
| 2. Extract Duration Selector | 2/2 | Complete | 2026-01-31 |
| 3. Extract Filter/List | 2/2 | Complete | 2026-02-01 |
| 4. Compose Refactored Card | 1/1 | Complete | 2026-02-01 |
| 5. Adjust Snooze Backend | 2/2 | Complete | 2026-02-01 |
| 6. Adjust Modal Component | 2/2 | Complete | 2026-02-01 |
| 7. Group Adjustment | 2/2 | Complete | 2026-02-01 |
| 8. Python Dead Code & Constants | 0/0 | Not Started | - |
| 9. Python Batch Adjust & Sensor | 0/0 | Not Started | - |
| 10. Frontend Dead Code Removal | 0/0 | Not Started | - |
| 11. Frontend Constants & Shared Refs | 0/0 | Not Started | - |
| 12. Frontend Hardcoded Strings | 0/0 | Not Started | - |
| 13. Frontend Component Improvements | 0/0 | Not Started | - |
| 14. Frontend CSS Deduplication | 0/0 | Not Started | - |
| 15. Test Infrastructure | 0/0 | Not Started | - |
| 16. JS to TS Test Migration | 0/0 | Not Started | - |
| 17. Final Validation | 0/0 | Not Started | - |
| 18. Squash Commits | 0/0 | Not Started | - |
