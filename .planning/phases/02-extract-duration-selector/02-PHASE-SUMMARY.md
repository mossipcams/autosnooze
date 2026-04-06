# Phase 2: Extract Duration Selector Component - Summary

**Status:** Planned (ready for execution)
**Created:** 2026-01-31
**Wave Structure:** 2 plans in 2 waves

## Overview

This phase extracts the duration selector UI (duration pills, custom input, schedule mode) from the parent `AutomationPauseCard` into a standalone Lit child component `AutoSnoozeDurationSelector`. This follows the exact same pattern established in Phase 1 (properties down, events up).

## Plans

| Plan | Wave | Type | Objective | Files Modified |
|------|------|------|-----------|----------------|
| 02-01 | 1 | execute | Create child component + styles | 4 new files |
| 02-02 | 2 | execute | Wire into parent, update tests | 8 modified files |

## Wave Structure

**Wave 1 (Plan 01):** Create new files only, no parent modifications
- Create `src/components/autosnooze-duration-selector.ts`
- Create `src/styles/duration-selector.styles.ts`
- Update barrel exports

**Wave 2 (Plan 02):** Wire into parent, remove extracted code, update tests
- Register component in `src/index.ts`
- Replace `_renderDurationSelector()` with `<autosnooze-duration-selector>` in parent
- Add event handlers to parent for duration changes and mode switches
- Remove extracted methods from parent
- Remove extracted CSS from `card.styles.ts`
- Update tests for nested shadow DOM
- Build and verify

## Extraction Boundary

### Moves to Child Component

**Template:**
- `_renderDurationSelector()` (lines 915-1040) - entire template

**Methods:**
- `_getDurationPills()` (lines 764-782)
- `_renderLastDurationBadge()` (lines 784-819)
- `_renderDateOptions()` (lines 757-762)
- `_getDurationPreview()` (lines 419-423)
- `_isDurationValid()` (lines 425-427)
- `_setDuration()` (lines 398-403) - replaced by event
- `_updateCustomDuration()` (lines 405-408) - replaced by event
- `_handleDurationInput()` (lines 410-417) - replaced by event
- `_enterScheduleMode()` (lines 429-436) - logic moved to event handler

**State:**
- All schedule mode fields passed as properties
- All duration fields passed as properties

**CSS:**
- `.duration-selector`, `.duration-pills`, `.pill` and variants
- `.last-duration-badge` and all variants + keyframes
- `.custom-duration-input`, `.duration-input` and variants
- `.duration-help`, `.duration-preview`
- `.schedule-link` and variants
- `.schedule-inputs`, `.datetime-field`, `.datetime-row` and variants
- `.field-hint`
- All corresponding mobile media query overrides

### Stays in Parent

**Methods:**
- `_hasResumeAt()` - used in `_snooze()` validation
- `_hasDisableAt()` - used in `_snooze()` validation
- `_snooze()` - actual service call

**State:**
- All state fields remain (passed as properties to child)

**CSS:**
- `.snooze-btn` and variants (button rendered by parent)

## Events

The child component fires these custom events:

1. **duration-change** - When a duration is selected
   ```typescript
   detail: {
     minutes: number;
     duration: ParsedDuration;
     input: string;
     showCustomInput?: boolean;
   }
   ```

2. **schedule-mode-change** - When schedule mode is toggled
   ```typescript
   detail: {
     enabled: boolean;
   }
   ```

3. **schedule-field-change** - When schedule date/time fields change
   ```typescript
   detail: {
     field: 'disableAtDate' | 'disableAtTime' | 'resumeAtDate' | 'resumeAtTime';
     value: string;
   }
   ```

4. **custom-input-toggle** - When "Custom" pill is clicked
   ```typescript
   detail: {
     show: boolean;
   }
   ```

## Impact

**Lines removed from parent:** ~150 lines (template + methods)
**New component size:** ~250 lines (component + styles)
**Test updates:** ~20 test files need shadow DOM query updates

## Success Criteria

- [ ] Duration selector displays identically to before
- [ ] Pill clicks update parent state correctly
- [ ] Custom input works (typing, validation, preview)
- [ ] Schedule mode toggles correctly
- [ ] Last duration badge appears when appropriate
- [ ] All tests pass (85%+ coverage)
- [ ] Build succeeds

## Next Steps

Execute: `/gsd:execute-phase 2`

<sub>`/clear` first - fresh context window recommended</sub>
