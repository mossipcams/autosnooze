# Phase 4: Compose Refactored Card - Research

**Researched:** 2026-01-31
**Domain:** Post-extraction validation, dead code cleanup, coverage verification
**Confidence:** HIGH

## Summary

Phase 4 is a validation and cleanup phase, not a creation phase. By the time Phase 3 is complete, all three component extractions will have been done (active pauses, duration selector, filter/automation list). The parent card should already be a thin orchestrator. Phase 4's job is to verify completeness, clean up residual artifacts from the three-phase extraction, run the full test suite, and confirm coverage thresholds.

After analyzing the current codebase (post Phase 2, pre Phase 3), the parent card is 1044 lines. Phase 3 will remove approximately 19 methods plus the filter/list template block, reducing it to an estimated ~760 lines. The remaining card will be primarily: lifecycle methods (shouldUpdate, updated, connectedCallback, disconnectedCallback), registry fetching, snooze/wake service call methods, event handlers for the three child components, the `_renderScheduledPauses` inline block, and several pass-through utility methods that exist solely for test backward compatibility.

The key cleanup opportunities for Phase 4 are: (1) removing 5 pass-through methods that tests call on the card but which are never used internally, updating those tests to import utility functions directly; (2) evaluating whether `_renderScheduledPauses` should stay inline or be considered for extraction (verdict: leave it -- it is small and Phase 4 should not expand scope); (3) verifying that CSS shared between parent and child components is properly handled; (4) running the complete test and build pipeline.

**Primary recommendation:** Phase 4 should be a single plan with 3 tasks: (1) audit and remove dead code/pass-through methods, updating affected tests; (2) verify all 3 child components are properly imported, registered, and rendered; (3) run full verification suite (tests, coverage, build, TypeScript, lint).

## Standard Stack

No new libraries or tools needed. Phase 4 uses the same stack as Phases 1-3:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | 3.3.2 | Web component framework | Sole dependency, already in use |
| vitest | 4.0.x | Testing framework | Already in use with jsdom environment |
| rollup | (project version) | Bundle build | Already configured in rollup.config.mjs |

**Installation:** No new packages needed.

## Architecture Patterns

### Expected Post-Phase 3 Parent Card Structure

After Phase 3, the parent card (`autosnooze-card.ts`) should contain approximately these sections:

```
autosnooze-card.ts (~760 lines estimated)
├── Imports (~60 lines)
├── Class declaration + static config methods (~20 lines)
├── Reactive state declarations (~20 lines)
│   - _selected, _duration, _customDuration, _customDurationInput
│   - _loading, _scheduleMode, _disableAt*, _resumeAt*
│   - _labelRegistry, _categoryRegistry, _entityRegistry
│   - _showCustomInput, _automationsCache, _lastDuration
├── Lifecycle methods (~80 lines)
│   - shouldUpdate, updated, connectedCallback, disconnectedCallback
├── Registry fetching (~30 lines)
│   - _fetchLabelRegistry, _fetchCategoryRegistry, _fetchEntityRegistry
├── Automation data methods (~20 lines)
│   - _getAutomations (with caching)
├── Pass-through utility methods (~30 lines) ← CLEANUP TARGET
│   - _parseDurationInput, _formatDuration, _combineDateTime
│   - _getErrorMessage, _formatRegistryId
├── Utility/helper methods (~20 lines)
│   - _hapticFeedback, _hasResumeAt, _hasDisableAt
│   - _formatDateTime, _getLocale
├── Event handlers for child components (~50 lines)
│   - _handleDurationChange, _handleScheduleModeChange
│   - _handleScheduleFieldChange, _handleCustomInputToggle
│   - _handleSelectionChange (from Phase 3)
│   - _handleWakeEvent, _handleWakeAllEvent
├── Service call methods (~180 lines)
│   - _snooze (largest method ~150 lines)
│   - _wake, _cancelScheduled
├── Toast management (~60 lines)
│   - _showToast
├── _renderScheduledPauses (~30 lines)
├── render() method (~70 lines)
│   - Header, <autosnooze-automation-list>, <autosnooze-duration-selector>,
│     snooze button, <autosnooze-active-pauses>, scheduled pauses
```

### Pattern: Thin Orchestrator Card

The parent card should follow the "thin orchestrator" pattern:

**What:** The parent card composes child components, manages shared state, and handles service calls. It does not contain large render blocks for UI sections.

**Verification criteria:**
1. No render method exceeds ~80 lines (the main `render()` should be a composition of child tags)
2. No inline template blocks for pauses, duration, or filter/list (these are in child components)
3. All presentation logic lives in child components
4. Parent handles: config, lifecycle, data fetching, service calls, toasts, and event routing

**What is acceptable to remain inline:**
- `_renderScheduledPauses` (~30 lines) -- This is the scheduled snooze section. It is small enough to remain inline and does not warrant its own component at this stage. It will likely be extracted in a future phase (Phase 6 or 7) when the adjust modal needs to interact with it.
- Toast rendering via `_showToast` -- Toasts are created programmatically, not through Lit templates. This is fine in the parent.
- Header rendering in `render()` -- The header is 5 lines, not worth extracting.

### Anti-Patterns to Avoid
- **Over-extracting in Phase 4:** Do not create new components. Phase 4 is validation and cleanup, not further extraction.
- **Removing pass-through methods without updating tests:** Tests depend on `card._parseDurationInput()` etc. Either keep the pass-throughs or update the tests. Do not silently break them.
- **Trying to reach 100% coverage:** The goal is 85%. Some code paths (error handlers, edge cases in rarely-hit methods) may not be fully covered. Focus on meeting the threshold, not perfection.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test utility function testing | New test infrastructure | Import from `src/utils/index.js` directly in tests | Tests currently use `card._formatDuration()` but can import `formatDuration()` directly |
| Coverage gap identification | Manual line counting | `npm run test:coverage` | Istanbul provider generates accurate reports |
| Dead code detection | Manual inspection | TypeScript compiler (`npx tsc --noEmit`) | Unused imports and unreachable code flagged as errors |
| CSS audit | Manual reading | Compare `card.styles.ts` selectors against `render()` template class names | Systematic check |

## Common Pitfalls

### Pitfall 1: Pass-Through Methods Entangle Test Coverage

**What goes wrong:** Removing pass-through methods from the parent card (e.g., `_parseDurationInput`, `_formatDuration`) drops coverage because the tests that exercised those code paths via `card._method()` no longer run through the parent.

**Why it happens:** The pass-through methods existed for backward compatibility. Tests call `card._parseDurationInput('30m')` which calls `parseDurationInput('30m')` from the utils module. The parent method is a thin wrapper. Removing the wrapper doesn't affect the underlying function coverage, but it changes which source file the coverage is attributed to.

**How to avoid:** Two approaches:
1. **Keep pass-throughs (simpler, recommended if coverage is already met):** If 85% coverage is already met after Phase 3, leave the pass-throughs and their tests. They are harmless.
2. **Remove and update tests (cleaner, recommended if time allows):** Remove the 5 pass-through methods from the parent. Update tests to import the utility functions directly: `import { formatDuration } from '../src/utils/index.js'`. This is cleaner and reduces parent card size by ~20 lines.

**Warning signs:** Coverage drops below 85% after removing pass-throughs.

**Affected pass-through methods (5 total, ~20 lines):**
| Method | Delegates to | Tests that call it |
|--------|-------------|-------------------|
| `_parseDurationInput(input)` | `parseDurationInput()` from utils | test_card_ui (6), test_mutation_operators (9), test_mutation_coverage (8) |
| `_formatDuration(d, h, m)` | `formatDuration()` from utils | test_card_ui (5), test_mutation_operators (7), test_mutation_coverage (6) |
| `_combineDateTime(date, time)` | `combineDateTime()` from utils | test_card_ui (5), test_mutation_coverage (5) |
| `_getErrorMessage(error, default)` | `getErrorMessage()` from utils | test_card_ui (5), test_backend_schema (10), test_mutation_coverage (5) |
| `_formatRegistryId(id)` | `formatRegistryId()` from state | test_mutation_operators (2), test_boundary_mutations (2), test_mutation_coverage (4) |

**Total test assertions affected:** ~74 across 6 test files.

### Pitfall 2: Shared CSS Still Needed in Parent

**What goes wrong:** After CSS extraction in phases 1-3, some selectors were intentionally kept in `card.styles.ts` because they are shared between child components and the parent's inline `_renderScheduledPauses`. Removing them breaks the scheduled section styling.

**Why it happens:** The `.list-header`, `.paused-info`, `.paused-name`, `.paused-time` selectors are used by both the active pauses child component (in its own `active-pauses.styles.ts`) AND the parent's `_renderScheduledPauses` template. Phase 1 decision (01-02-SUMMARY.md) explicitly kept them in `card.styles.ts`.

**How to avoid:** Do NOT remove these from `card.styles.ts`:
- `.list-header` and `.list-header ha-icon` -- used in `_renderScheduledPauses`
- `.paused-info` -- used in `_renderScheduledPauses`
- `.paused-name` -- used in `_renderScheduledPauses`
- `.paused-time` -- used in `_renderScheduledPauses`
- `.scheduled-*` selectors -- obviously used in `_renderScheduledPauses`
- `.toast`, `.toast-undo-btn` -- used by `_showToast`
- `.header`, `.status-summary` -- used in `render()`
- `.snooze-btn` -- used in `render()`
- `.snooze-setup` -- wraps the composition of child components
- `.empty` -- may be used (verify)

**Warning signs:** Scheduled pauses section has no styling; toast notifications look broken.

### Pitfall 3: Coverage Threshold May Be Hard to Meet With Thin Orchestrator

**What goes wrong:** After extraction, the parent card has large methods like `_snooze()` (~150 lines) with many branches (schedule mode, disable-at, error handling, undo). If tests don't exercise all these paths, coverage drops below 85%.

**Why it happens:** The extraction phases focused on moving UI code to children. The business logic (`_snooze`, `_wake`, `_cancelScheduled`, `_showToast`) stayed in the parent. These methods have complex branching that may not have been fully tested before.

**How to avoid:** After Phase 3, run `npm run test:coverage` and check the parent card's per-file coverage. If it's below 85%, identify which lines in `_snooze()` and other service methods lack coverage. Write targeted tests for those paths.

**Warning signs:** `autosnooze-card.ts` shows <85% on any coverage metric; specific methods like `_snooze` show large ranges of uncovered lines.

### Pitfall 4: TypeScript Compilation Errors After Phase 3 Cleanup

**What goes wrong:** After Phase 3 removes methods and imports from the parent, some type imports may become unused, or some types may be missing.

**Why it happens:** Phase 3 removes ~19 methods and their associated type dependencies. If the cleanup was not thorough (e.g., `FilterTab` type was imported but only used by `_filterTab` which moved to child), TypeScript will complain about unused imports.

**How to avoid:** Run `npx tsc --noEmit` after Phase 3 and before starting Phase 4 cleanup. Fix any TypeScript errors first.

**Warning signs:** TypeScript errors about unused imports, missing type references, or implicit 'any' types.

### Pitfall 5: ESLint Failures on Unused Imports After Cleanup

**What goes wrong:** After removing pass-through methods or other dead code, some imports in the parent may become unused, triggering ESLint errors.

**Why it happens:** Methods like `_formatRegistryId` import `formatRegistryId` from `../state/automations.js`. When the method is removed, the import becomes unused.

**How to avoid:** After any code removal, run `npx eslint src/components/autosnooze-card.ts` to catch unused import errors. Fix before committing.

**Warning signs:** ESLint reports unused imports.

### Pitfall 6: Python Tests Regress Unexpectedly

**What goes wrong:** Python tests fail even though no Python code was modified.

**Why it happens:** This has not occurred in Phases 1-2 (Python tests were unaffected). However, Phase 4 should still verify as a gate condition.

**How to avoid:** Run `pytest tests/` as part of the final verification. It should pass without modification.

**Warning signs:** `pytest tests/` fails with import errors or test failures. This would indicate a systemic issue unrelated to Phase 4.

## Code Examples

### Verifying Component Registration (Phase 4 Check)

After Phase 3, `src/index.ts` should register all 4 components in dependency order:

```typescript
// Expected state of src/index.ts after Phase 3
import {
  AutomationPauseCard,
  AutomationPauseCardEditor,
  AutoSnoozeActivePauses,
  AutoSnoozeDurationSelector,
  AutoSnoozeAutomationList,  // Added in Phase 3
} from './components/index.js';

// Child elements registered BEFORE parent (dependency ordering)
if (!customElements.get('autosnooze-card-editor')) {
  customElements.define('autosnooze-card-editor', AutomationPauseCardEditor);
}
if (!customElements.get('autosnooze-active-pauses')) {
  customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
}
if (!customElements.get('autosnooze-duration-selector')) {
  customElements.define('autosnooze-duration-selector', AutoSnoozeDurationSelector);
}
if (!customElements.get('autosnooze-automation-list')) {
  customElements.define('autosnooze-automation-list', AutoSnoozeAutomationList);
}
if (!customElements.get('autosnooze-card')) {
  customElements.define('autosnooze-card', AutomationPauseCard);
}
```

### Expected Parent render() After Phase 3

```typescript
render(): TemplateResult {
  if (!this.hass || !this.config) {
    return html``;
  }

  const paused = this._getPaused();
  const pausedCount = Object.keys(paused).length;
  const scheduled = this._getScheduled();
  const scheduledCount = Object.keys(scheduled).length;

  return html`
    <ha-card>
      <div class="header">
        <ha-icon icon="mdi:sleep"></ha-icon>
        ${this.config?.title || localize(this.hass, 'card.default_title')}
        ${pausedCount > 0 || scheduledCount > 0
          ? html`<span class="status-summary">...</span>`
          : ''}
      </div>

      <div class="snooze-setup">
        <autosnooze-automation-list
          .hass=${this.hass}
          .automations=${this._getAutomations()}
          .selected=${this._selected}
          .labelRegistry=${this._labelRegistry}
          .categoryRegistry=${this._categoryRegistry}
          @selection-change=${this._handleSelectionChange}
        ></autosnooze-automation-list>

        <autosnooze-duration-selector
          .hass=${this.hass}
          .scheduleMode=${this._scheduleMode}
          .customDuration=${this._customDuration}
          .customDurationInput=${this._customDurationInput}
          .showCustomInput=${this._showCustomInput}
          .lastDuration=${this._lastDuration}
          .disableAtDate=${this._disableAtDate}
          .disableAtTime=${this._disableAtTime}
          .resumeAtDate=${this._resumeAtDate}
          .resumeAtTime=${this._resumeAtTime}
          @duration-change=${this._handleDurationChange}
          @schedule-mode-change=${this._handleScheduleModeChange}
          @schedule-field-change=${this._handleScheduleFieldChange}
          @custom-input-toggle=${this._handleCustomInputToggle}
        ></autosnooze-duration-selector>

        <button type="button" class="snooze-btn" ...>...</button>
      </div>

      ${pausedCount > 0
        ? html`<autosnooze-active-pauses
            .hass=${this.hass}
            .pauseGroups=${this._getPausedGroupedByResumeTime()}
            .pausedCount=${pausedCount}
            @wake-automation=${this._handleWakeEvent}
            @wake-all=${this._handleWakeAllEvent}
          ></autosnooze-active-pauses>`
        : ''}
      ${this._renderScheduledPauses(scheduledCount, scheduled)}
    </ha-card>
  `;
}
```

### Removing Pass-Through Methods (If Chosen)

Before (in parent):
```typescript
// These are pure pass-throughs for backward test compatibility
private _parseDurationInput(input: string): ParsedDuration | null {
  return parseDurationInput(input);
}
private _formatDuration(days: number, hours: number, minutes: number): string {
  return formatDuration(days, hours, minutes);
}
// ... etc
```

After (in tests):
```javascript
// Instead of: card._parseDurationInput('30m')
import { parseDurationInput } from '../src/utils/index.js';
const result = parseDurationInput('30m');
```

### CSS Audit Pattern

To verify no dead CSS remains in `card.styles.ts`, check each selector against usage:

```bash
# For each CSS class in card.styles.ts, verify it appears in:
# 1. The parent render() method
# 2. The _renderScheduledPauses() method
# 3. The _showToast() method (programmatic DOM creation)
```

Selectors that MUST remain in `card.styles.ts` after all extractions:
- `:host`, `ha-card` -- host element styling
- `.header`, `.header ha-icon`, `.status-summary` -- header section
- `.snooze-setup` -- wrapper for child components + snooze button
- `.snooze-btn` and variants -- the snooze action button
- `.list-header`, `.list-header ha-icon` -- used by `_renderScheduledPauses`
- `.paused-info`, `.paused-name`, `.paused-time` -- used by `_renderScheduledPauses`
- `.scheduled-list`, `.scheduled-item`, `.scheduled-icon`, `.scheduled-time`, `.cancel-scheduled-btn` -- scheduled section
- `.toast`, `.toast-undo-btn`, `@keyframes slideUp` -- toast notifications
- `.empty` -- may or may not be used (verify against render method)
- All corresponding `@media (max-width: 480px)` mobile overrides for the above

Selectors that should have been removed by Phase 3 (verify):
- `.filter-tabs`, `.tab`, `.tab-count` -- moved to automation-list.styles.ts
- `.search-box` -- moved to automation-list.styles.ts
- `.selection-list`, `.list-item`, `.list-item-*` -- moved to automation-list.styles.ts
- `.group-header`, `.group-badge` -- moved to automation-list.styles.ts
- `.selection-actions`, `.select-all-btn` -- moved to automation-list.styles.ts
- `.list-empty` -- moved to automation-list.styles.ts

## Phase 4 Scope Definition

### In Scope
1. **Audit parent card for remaining inline render blocks** -- Verify filter/list/duration/pauses are in child components
2. **Remove dead pass-through methods** (optional, based on coverage impact) -- `_parseDurationInput`, `_formatDuration`, `_combineDateTime`, `_getErrorMessage`, `_formatRegistryId`
3. **Update tests** that called pass-through methods to call utility functions directly
4. **Verify CSS cleanup** -- Confirm no dead selectors in `card.styles.ts`
5. **Verify component registration** -- All 4 custom elements registered in correct order
6. **Verify barrel exports** -- `components/index.ts` and `styles/index.ts` export all components and styles
7. **Run full verification** -- `npm test`, coverage check, `npm run build`, `npx tsc --noEmit`, `pytest tests/`
8. **Clean up any unused imports** in parent card

### Out of Scope
- Creating new components (no `_renderScheduledPauses` extraction)
- Refactoring service call methods (`_snooze`, `_wake`, etc.)
- Performance optimization
- Adding new features
- Modifying Python backend code

## Estimated Parent Card Size After Phase 4

| Section | Lines (est.) | Notes |
|---------|-------------|-------|
| Imports | 50 | Reduced after removing pass-through deps |
| Class + static methods | 20 | getConfigElement, getStubConfig, setConfig, getCardSize |
| State declarations | 20 | Reduced (no _search, _filterTab, _expandedGroups) |
| shouldUpdate | 50 | Complex hass diffing logic |
| updated + connectedCallback + disconnectedCallback | 30 | Lifecycle + registry fetching triggers + cleanup |
| Registry fetching | 20 | 3 methods |
| _getAutomations + caching | 20 | Still needed, passed to child |
| _getPaused, _getScheduled, etc. | 15 | Paused state helpers |
| _formatDateTime, _getLocale | 10 | Used by _snooze and _renderScheduledPauses |
| _hasResumeAt, _hasDisableAt | 5 | Used by snooze button disabled logic |
| _hapticFeedback | 5 | Used by service call methods |
| Event handlers (5 child events) | 40 | Duration, schedule, selection, wake, wake-all |
| _snooze | 150 | Largest method, complex branching |
| _wake, _cancelScheduled | 30 | Service call wrappers |
| _showToast | 50 | Programmatic toast DOM creation |
| _renderScheduledPauses | 30 | Only remaining inline render block |
| render() | 50 | Composition of child tags |
| **Total** | **~595** | Down from 1044 pre-Phase 3, ~1300+ originally |

If pass-through methods are kept: add ~30 lines (total ~625).
If pass-through methods are removed: ~595 lines.

This represents a 54% reduction from the original ~1300 lines. The card is now clearly an orchestrator.

## Verification Checklist

The planner should create verification tasks that check each of these:

### Structural Verification
- [ ] Parent card renders `<autosnooze-active-pauses>` (Phase 1 extraction)
- [ ] Parent card renders `<autosnooze-duration-selector>` (Phase 2 extraction)
- [ ] Parent card renders `<autosnooze-automation-list>` (Phase 3 extraction)
- [ ] Parent card has NO inline render blocks for pauses, duration, or filter/list
- [ ] `_renderScheduledPauses` is the only remaining inline render helper (and it is small)
- [ ] `src/index.ts` registers all 5 custom elements (editor, active-pauses, duration-selector, automation-list, card)
- [ ] `src/components/index.ts` exports all 5 component classes
- [ ] `src/styles/index.ts` exports all 5 style objects (editor, card, active-pauses, duration-selector, automation-list)

### Code Quality Verification
- [ ] No unused imports in `src/components/autosnooze-card.ts`
- [ ] No unused state declarations in the parent
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx eslint src/` passes
- [ ] No dead CSS selectors in `card.styles.ts` (all selectors used by render or _showToast)

### Test & Build Verification
- [ ] `npm test` passes all tests (expect ~683+ tests)
- [ ] Coverage meets 85% threshold on branches, functions, lines, statements
- [ ] `npm run build` succeeds
- [ ] Built bundle contains all 5 custom element registrations
- [ ] No bare `lit` imports in built bundle
- [ ] `pytest tests/` passes all Python tests
- [ ] Python coverage meets 85% threshold

## Open Questions

1. **Should pass-through methods be removed or kept?**
   - What we know: 5 pass-through methods exist solely for test backward compatibility. They add ~20 lines to the parent. About 74 test assertions use them across 6 files.
   - What's unclear: Whether removing them improves or hurts coverage (depends on how istanbul counts utility function coverage vs. pass-through coverage).
   - Recommendation: Remove them if time allows, as it makes the parent genuinely thin. But ONLY if coverage stays above 85% after updating tests. If removing them risks coverage, keep them.

2. **Will the `.empty` CSS class be dead after all extractions?**
   - What we know: `.empty` is used in the combined mobile rule `.list-empty, .empty`. Phase 3 plan says to change it to just `.empty`.
   - What's unclear: Whether `.empty` is actually used anywhere in the post-extraction parent template.
   - Recommendation: Search for class="empty" in the parent card render method. If not used, remove it from card.styles.ts.

3. **Is the current test:coverage threshold actually enforced locally?**
   - What we know: Current global coverage is 47.5% which is well below 85%. But `npm test` passes. The CI runs `npm run test:coverage` which may enforce thresholds differently.
   - What's unclear: Whether vitest coverage thresholds in `vitest.config.mjs` are actually checked during `npm test` vs `npm run test:coverage`.
   - Recommendation: Use `npm run test:coverage` for Phase 4 verification, not just `npm test`. The CI workflow uses `test:coverage`.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/components/autosnooze-card.ts` (1044 lines) -- full method-by-method analysis
- Codebase inspection: `src/styles/card.styles.ts` (852 lines) -- CSS selector audit
- Codebase inspection: All 16 test files -- grep for pass-through method usage (74 assertions identified)
- Phase 3 plans: `03-01-PLAN.md`, `03-02-PLAN.md` -- detailed extraction plan
- Phase 3 research: `03-RESEARCH.md` -- method movement analysis, state ownership
- Phase 1 summary: `01-02-SUMMARY.md` -- shared CSS decision (.list-header, .paused-info, .paused-name, .paused-time)
- Phase 2 summary: `02-02-SUMMARY.md` -- jsdom event workaround pattern, card line count tracking
- CI configuration: `.github/workflows/build.yml` -- coverage enforcement via `npm run test:coverage`
- Vitest config: `vitest.config.mjs` -- 85% threshold configuration
- Python config: `pyproject.toml` -- `fail_under = 85` coverage threshold

### Secondary (MEDIUM confidence)
- Line count estimates for post-Phase 3 card are projections based on Phase 3 plan analysis

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries, using existing project dependencies
- Architecture: HIGH -- Post-extraction structure is well-defined by Phases 1-3 plans
- Pitfalls: HIGH -- Identified from Phase 1/2 experience and detailed code analysis
- Scope definition: HIGH -- Clear boundaries (cleanup/verify, not create)

**Research date:** 2026-01-31
**Valid until:** 2026-03-31 (stable project dependencies, no external factors)
