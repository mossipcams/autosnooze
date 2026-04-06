# Phase 3: Extract Filter/List Component - Research

**Researched:** 2026-01-31
**Domain:** Lit web component refactoring / component extraction (filter tabs + automation list)
**Confidence:** HIGH

## Summary

This phase extracts the filter tabs (All/Area/Category/Label), search input with debounce, selection actions bar, and automation selection list from the parent `AutomationPauseCard` into a standalone `autosnooze-automation-list` Lit child component. This is the third and most complex extraction in the refactoring sequence.

The filter/list code spans approximately 200 lines of template (lines 907-989 in the render method plus the `_renderSelectionList()` helper at lines 755-847) and approximately 200 lines of state/methods (`_search`, `_filterTab`, `_expandedGroups`, `_selected`, automation caching, registry lookups, grouping helpers, search debounce). Unlike the prior extractions, this component has significant state interactions with the parent: the `_selected` array drives the snooze button's disabled state and the snooze action. The parent also owns registry data (labels, categories, entity registry) that the child needs for grouping.

Following the established pattern from Phases 1 and 2, the child component receives data via reactive properties and fires CustomEvents for state changes. The key design decision is where selection state lives: the parent must own `_selected` because it uses it for the snooze service call, but the child manages the selection UI (checkboxes, select all, clear, group select).

**Primary recommendation:** Create `src/components/autosnooze-automation-list.ts` as a LitElement that receives `hass`, `automations` (pre-fetched and cached list), `selected` (current selection), registry data (`labelRegistry`, `categoryRegistry`), and owns its own `_filterTab`, `_search`, `_expandedGroups` state internally. Fire events for selection changes (`selection-change` with the updated selection array) and let the parent update `_selected`.

## Standard Stack

The established libraries/tools for this domain (same as Phases 1 and 2):

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | 3.3.2 | Web component framework | Already in use, sole dependency |
| lit/decorators.js | 3.3.2 | `@property`, `@state` decorators | TypeScript class field reactive properties |
| vitest | 4.0.x | Testing framework | Already in use with jsdom |

**Installation:** No new packages needed. Everything is already in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    autosnooze-card.ts                    # Parent card (shrinks significantly)
    autosnooze-active-pauses.ts           # Phase 1: active pauses child
    autosnooze-duration-selector.ts       # Phase 2: duration selector child
    autosnooze-automation-list.ts         # NEW: filter/list child
    autosnooze-card-editor.ts             # Existing editor
    index.ts                              # Updated to export new component
  styles/
    card.styles.ts                        # Parent card styles (shrinks significantly)
    active-pauses.styles.ts              # Phase 1 styles
    duration-selector.styles.ts          # Phase 2 styles
    automation-list.styles.ts            # NEW: extracted styles
    editor.styles.ts                     # Existing editor styles
    index.ts                             # Updated to export new styles
```

### Pattern 1: Properties Down, Events Up (Established)
**What:** Parent passes data as reactive properties; child fires CustomEvents for state changes.
**When to use:** Always, for parent-child component communication in Lit.
**Example:**
```typescript
// Parent template
html`<autosnooze-automation-list
  .hass=${this.hass}
  .automations=${this._getAutomations()}
  .selected=${this._selected}
  .labelRegistry=${this._labelRegistry}
  .categoryRegistry=${this._categoryRegistry}
  @selection-change=${this._handleSelectionChange}
></autosnooze-automation-list>`

// Child fires event
this.dispatchEvent(new CustomEvent('selection-change', {
  detail: { selected: newSelectedArray },
  bubbles: true,
  composed: true,
}));
```

### Pattern 2: Child Owns UI-Only State (Established)
**What:** The child owns state that only affects its own rendering.
**When to use:** When state doesn't need to persist or be shared with parent.

For this component, the following are UI-only state and should live in the child as `@state()`:
- `_filterTab: FilterTab` -- which tab is active (all/areas/categories/labels)
- `_search: string` -- current search text
- `_expandedGroups: Record<string, boolean>` -- which groups are collapsed/expanded
- `_searchTimeout: number | null` -- debounce timer reference

**Why child-owned:** The parent does not use `_filterTab`, `_search`, or `_expandedGroups` for any logic outside the list rendering. These are purely presentation concerns. This is a key simplification versus the prior extractions where some state (e.g., `_scheduleMode`, `_customDuration`) was needed by the parent for the snooze action.

### Pattern 3: Parent Owns Business Logic State (Established)
**What:** The parent owns state that affects application logic.
**When to use:** When state needs to persist or be used in service calls.

For this component:
- `_selected: string[]` -- PARENT OWNED. Used by `_snooze()` to determine which automations to pause.
- `_automationsCache` / `_getAutomations()` -- PARENT OWNED. The automation list depends on `hass.states`, `hass.entities`, and `_entityRegistry`, all of which live in the parent. The parent computes the list and passes it down.
- `_labelRegistry`, `_categoryRegistry` -- PARENT OWNED. Fetched in parent's `updated()` and `connectedCallback()`. Passed down as properties.

### Pattern 4: Computed Data Passed Down as Property
**What:** Parent computes derived data and passes it as a property rather than having the child recompute.
**When to use:** When the child doesn't have access to (or shouldn't depend on) the raw data sources.

For this component, `automations` should be passed as a pre-computed array rather than having the child call `getAutomations(hass, entityRegistry)`. Reasons:
1. The parent already has the caching logic (`_automationsCache`, `_lastHassStates`, `_lastCacheVersion`)
2. The `_entityRegistry` is fetched and managed by the parent
3. Keeps the child focused on display, not data fetching

### Anti-Patterns to Avoid
- **Moving registry fetching to the child:** The parent fetches label/category/entity registries once on mount. These are shared across the card (scheduled section also uses them). Keep fetching in the parent.
- **Moving automation caching to the child:** The caching logic depends on `_entityRegistry` and `_automationsCacheVersion` which are parent concerns.
- **Making `_selected` child-owned:** The parent needs `_selected` for the snooze button's disabled state and the `_snooze()` method. Selection must flow up via events.
- **Duplicating `_selected` in both parent and child:** This creates sync bugs. Parent is the single source of truth; child receives it as a property.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Automation filtering | Custom filter logic | `filterAutomations()` from `src/state/automations.ts` | Already handles include/exclude labels and search |
| Grouping by area/label/category | Custom grouping | `groupAutomationsBy()` from `src/state/automations.ts` | Already handles multi-key grouping and sorting |
| Unique count (tab badges) | Custom counting | `getUniqueCount()` from `src/state/automations.ts` | Already handles set-based counting |
| Area/label/category name resolution | Custom lookups | `getAreaName()`, `getLabelName()`, `getCategoryName()` from `src/state/automations.ts` | Already handles fallback formatting |
| Search debounce | Custom setTimeout | Copy existing `_handleSearchInput()` pattern | Already tested with 300ms debounce |
| Localization | Hardcoded strings | `localize()` from `src/localization/localize.ts` | Already supports 5 languages |

**Key insight:** All filtering, grouping, and counting logic already exists as tested pure functions in `src/state/automations.ts`. The child component imports and calls them directly -- no logic needs to be rewritten.

## Common Pitfalls

### Pitfall 1: Shadow DOM Query Selectors Break in Tests (Established)
**What goes wrong:** Tests that use `card.shadowRoot.querySelector('.tab')` or `card.shadowRoot.querySelector('.group-header')` return `null` because these elements now live inside the child component's shadow DOM.
**Why it happens:** Shadow DOM creates isolation boundaries.
**How to avoid:** Create query helpers (same pattern as Phase 1 and 2):
```javascript
function queryAutomationList(card) {
  return card.shadowRoot?.querySelector('autosnooze-automation-list');
}
function queryInAutomationList(card, selector) {
  const al = queryAutomationList(card);
  return al?.shadowRoot?.querySelector(selector);
}
function queryAllInAutomationList(card, selector) {
  const al = queryAutomationList(card);
  return al?.shadowRoot?.querySelectorAll(selector) || [];
}
```
**Warning signs:** Tests that previously passed now return `null` from querySelector.
**Test files affected (at least 10):**
- `test_card_ui.spec.js` -- filter tabs, search box, group headers, selection actions, list items
- `test_automation_categories.spec.js` -- category grouping, filter tab switching, group headers
- `test_layout_switching.spec.js` -- tab switching, search preservation, group expansion
- `test_boundary_mutations.spec.js` -- search filtering, filter tab defaults
- `test_backend_schema.spec.js` -- search debounce
- `test_mutation_coverage.spec.js` -- toggleSelection, search debounce
- `test_mutation_operators.spec.js` -- toggleSelection, search, selection
- `test_stress.spec.js` -- search filtering 100 automations
- `test_console_monitoring.spec.js` -- filter tab switching, search
- `test_card_compatibility.spec.js` -- filter tab isolation
- `test_cleanup.spec.js` -- search timeout cleanup, selection
- `test_defects.spec.js` -- filter tab, group headers

### Pitfall 2: Selection State Synchronization
**What goes wrong:** User clicks an automation checkbox in the child, but the snooze button in the parent doesn't update (or vice versa).
**Why it happens:** `_selected` must flow from child (user clicks) to parent (owns state) and back to child (render). If the child mutates its own copy instead of firing an event, parent and child get out of sync.
**How to avoid:** Child NEVER directly modifies `selected`. Instead:
1. User clicks checkbox -> child computes new `selected` array -> fires `selection-change` event
2. Parent receives event -> updates `this._selected = e.detail.selected`
3. Parent re-renders -> passes updated `selected` property to child
4. Child re-renders with new `selected`
**Warning signs:** Snooze button count doesn't match visible checkboxes; selecting automation doesn't highlight it.

### Pitfall 3: Search Debounce Timeout Cleanup
**What goes wrong:** Memory leak or stale timeout fires after component disconnect.
**Why it happens:** The search debounce creates a `setTimeout`. If the child is disconnected (parent re-renders without it) before the timeout fires, it writes to stale state.
**How to avoid:** Child must implement `disconnectedCallback()` to clear `_searchTimeout`:
```typescript
disconnectedCallback(): void {
  super.disconnectedCallback();
  if (this._searchTimeout !== null) {
    clearTimeout(this._searchTimeout);
    this._searchTimeout = null;
  }
}
```
**Warning signs:** Console errors about setting properties on disconnected elements.

### Pitfall 4: Tab Counts Using Unfiltered Automations
**What goes wrong:** Tab badges show wrong counts after filtering by search.
**Why it happens:** In the current code, tab counts use `_getAutomations()` (unfiltered) for total count but `_getFilteredAutomations()` for the list. If the child computes counts from the filtered list instead of the full list, counts change when searching.
**How to avoid:** Tab counts MUST use the unfiltered `automations` property (the full list), not the search-filtered subset. The child should:
- Use `automations` (property) for tab badge counts
- Use its own filtered version for the list display
**Warning signs:** Tab counts change when user types in search box.

### Pitfall 5: Tests That Directly Access Card Internal State
**What goes wrong:** Tests like `card._filterTab = 'areas'` or `card._search = 'living'` still work on the parent but the parent no longer has these properties (they moved to the child).
**Why it happens:** After extraction, `_filterTab`, `_search`, and `_expandedGroups` live on the child, not the parent.
**How to avoid:** Tests must be updated to either:
1. Access the child component directly: `queryAutomationList(card)._filterTab = 'areas'`
2. Or interact through the DOM: click the tab button element
**Warning signs:** `card._filterTab` is `undefined`; tests that set it have no effect on rendering.

### Pitfall 6: The `_getFilteredAutomations()` and Grouping Methods Move to Child
**What goes wrong:** Tests calling `card._getFilteredAutomations()`, `card._getGroupedByArea()`, `card._getGroupedByLabel()`, `card._getGroupedByCategory()` get `undefined is not a function`.
**Why it happens:** These methods move from the parent to the child because they depend on `_filterTab` and `_search` which are child-owned.
**How to avoid:** Tests must call these on the child component, or better yet, test through the rendered DOM. For unit-level tests, create a dedicated child component test file (like `test_duration_selector.spec.js`).
**Warning signs:** TypeError in tests calling grouping methods on the parent card.

### Pitfall 7: The `_selectAllVisible()` Method Depends on Filtered List
**What goes wrong:** "Select All" selects wrong automations or doesn't work.
**Why it happens:** `_selectAllVisible()` uses `_getFilteredAutomations()` to know which automations are currently visible. After extraction, the child owns the filter state AND the select-all logic.
**How to avoid:** The child computes the visible automations internally (it has `_search`, `_filterTab`, and the `automations` property) and fires a `selection-change` event with the complete new selection array.
**Warning signs:** Select All selects automations not in the current tab/search results.

## Code Examples

Verified patterns from the codebase (adapted from the established Phase 1/2 pattern):

### Child Component Declaration
```typescript
import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import { hapticFeedback } from '../utils/index.js';
import { UI_TIMING, EXCLUDE_LABEL, INCLUDE_LABEL } from '../constants/index.js';
import { automationListStyles } from '../styles/automation-list.styles.js';
import {
  filterAutomations,
  groupAutomationsBy,
  getUniqueCount,
  getAreaName,
  getLabelName,
  getCategoryName,
} from '../state/automations.js';
import type { HomeAssistant, HassLabel, HassCategory } from '../types/hass.js';
import type { AutomationItem } from '../types/automation.js';
import type { FilterTab } from '../types/card.js';

export class AutoSnoozeAutomationList extends LitElement {
  static styles = automationListStyles;

  // Properties (passed by parent)
  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  automations: AutomationItem[] = [];

  @property({ attribute: false })
  selected: string[] = [];

  @property({ attribute: false })
  labelRegistry: Record<string, HassLabel> = {};

  @property({ attribute: false })
  categoryRegistry: Record<string, HassCategory> = {};

  // Internal state (child-owned)
  @state() private _filterTab: FilterTab = 'all';
  @state() private _search: string = '';
  @state() private _expandedGroups: Record<string, boolean> = {};

  private _searchTimeout: number | null = null;
}
```

### Parent Template Usage
```typescript
// In parent render(), replace the filter tabs + search + selection actions + selection list block
html`<autosnooze-automation-list
  .hass=${this.hass}
  .automations=${this._getAutomations()}
  .selected=${this._selected}
  .labelRegistry=${this._labelRegistry}
  .categoryRegistry=${this._categoryRegistry}
  @selection-change=${this._handleSelectionChange}
></autosnooze-automation-list>`
```

### Parent Event Handler
```typescript
private _handleSelectionChange(e: CustomEvent<{ selected: string[] }>): void {
  this._selected = e.detail.selected;
}
```

### Child Selection Event Dispatching
```typescript
private _fireSelectionChange(newSelected: string[]): void {
  this.dispatchEvent(new CustomEvent('selection-change', {
    detail: { selected: newSelected },
    bubbles: true,
    composed: true,
  }));
}

private _toggleSelection(id: string): void {
  hapticFeedback('selection');
  const newSelected = this.selected.includes(id)
    ? this.selected.filter((s) => s !== id)
    : [...this.selected, id];
  this._fireSelectionChange(newSelected);
}

private _selectAllVisible(): void {
  const filtered = this._getFilteredAutomations();
  const allIds = filtered.map((a) => a.id);
  const allSelected = allIds.every((id) => this.selected.includes(id));
  const newSelected = allSelected
    ? this.selected.filter((id) => !allIds.includes(id))
    : [...new Set([...this.selected, ...allIds])];
  this._fireSelectionChange(newSelected);
}

private _clearSelection(): void {
  this._fireSelectionChange([]);
}

private _selectGroup(items: AutomationItem[]): void {
  const ids = items.map((i) => i.id);
  const allSelected = ids.every((id) => this.selected.includes(id));
  const newSelected = allSelected
    ? this.selected.filter((id) => !ids.includes(id))
    : [...new Set([...this.selected, ...ids])];
  this._fireSelectionChange(newSelected);
}
```

### Child Filtering and Grouping Methods
```typescript
private _getFilteredAutomations(): AutomationItem[] {
  return filterAutomations(this.automations, this._search, this.labelRegistry);
}

private _getGroupedByArea(): [string, AutomationItem[]][] {
  const automations = this._getFilteredAutomations();
  return groupAutomationsBy(
    automations,
    (auto) => auto.area_id ? [getAreaName(auto.area_id, this.hass!)] : null,
    localize(this.hass, 'group.unassigned')
  );
}

// Similar for _getGroupedByLabel() and _getGroupedByCategory()
```

### CSS Extraction Pattern (Automation List Styles)
The following CSS selectors from `card.styles.ts` belong to the child and must be extracted:

**Base selectors:**
- `.filter-tabs` (lines 40-47)
- `.tab` and variants: `.tab:hover`, `.tab:focus-visible`, `.tab.active` (lines 48-85)
- `.tab-count`, `.tab.active .tab-count` (lines 77-85)
- `.search-box`, `.search-box input`, `.search-box input:focus` (lines 87-105)
- `.selection-list` (lines 107-114)
- `.list-empty` (lines 115-120)
- `.list-item` and variants: `.list-item:last-child`, `.list-item:hover`, `.list-item:focus-visible`, `.list-item.selected`, `.list-item ha-icon`, `.list-item input[type="checkbox"]` (lines 121-162)
- `.group-header input[type="checkbox"]` (lines 163-168)
- `.list-item-content`, `.list-item-name`, `.list-item-meta`, `.list-item-meta ha-icon` (lines 169-191)
- `.group-header` and variants: `.group-header:hover`, `.group-header:focus-visible`, `.group-header ha-icon`, `.group-header.expanded ha-icon` (lines 194-224)
- `.group-badge` (lines 225-232)
- `.selection-actions`, `.selection-actions span`, `.select-all-btn`, `.select-all-btn:hover`, `.select-all-btn:focus-visible` (lines 234-269)

**Mobile `@media (max-width: 480px)` overrides:**
- `.filter-tabs` (lines 471-479)
- `.tab` and variants (lines 481-521)
- `.tab-count` and variants (lines 508-521)
- `.search-box`, `.search-box input`, related pseudo-classes (lines 523-547)
- `.selection-actions` and children (lines 549-584)
- `.selection-list` (lines 586-596)
- `.list-item` and variants (lines 598-641)
- `.group-header` and variants (lines 643-671)
- `.group-badge` (lines 666-671)
- `.list-empty` (lines 843-850, inside the combined `.list-empty, .empty` rule -- extract only `.list-empty` or keep both if `.empty` is also used)

## State Ownership Decision Matrix

This table clarifies where each piece of state lives after extraction:

| State | Owner | How Child Gets It | How Parent Gets Updates |
|-------|-------|-------------------|------------------------|
| `_selected` | Parent | `selected` property | `selection-change` event |
| `_filterTab` | Child | N/A (internal `@state()`) | Not needed by parent |
| `_search` | Child | N/A (internal `@state()`) | Not needed by parent |
| `_expandedGroups` | Child | N/A (internal `@state()`) | Not needed by parent |
| `_searchTimeout` | Child | N/A (private field) | Not needed by parent |
| `_automationsCache` | Parent | `automations` property | N/A (parent computes) |
| `_labelRegistry` | Parent | `labelRegistry` property | N/A (parent fetches) |
| `_categoryRegistry` | Parent | `categoryRegistry` property | N/A (parent fetches) |
| `_entityRegistry` | Parent | Not passed (used for `_getAutomations()` only) | N/A |

## Methods That Move to Child

These methods currently on `AutomationPauseCard` should move to `AutoSnoozeAutomationList`:

| Method | Reason |
|--------|--------|
| `_getFilteredAutomations()` | Depends on `_search` which moves to child |
| `_getGroupedByArea()` | Depends on filtered automations |
| `_getGroupedByLabel()` | Depends on filtered automations |
| `_getGroupedByCategory()` | Depends on filtered automations |
| `_getAreaCount()` | Tab badge count computation |
| `_getLabelCount()` | Tab badge count computation |
| `_getCategoryCount()` | Tab badge count computation |
| `_getAreaName()` | Used by grouping methods |
| `_getLabelName()` | Used by grouping and label count |
| `_getCategoryName()` | Used by grouping methods |
| `_toggleSelection()` | Selection UI logic |
| `_toggleGroupExpansion()` | Group UI logic |
| `_selectGroup()` | Selection UI logic |
| `_selectAllVisible()` | Selection UI logic |
| `_clearSelection()` | Selection UI logic |
| `_handleSearchInput()` | Search debounce logic |
| `_renderSelectionList()` | Render helper for the list |
| `_handleKeyDown()` | Keyboard handler (used in list items) |

## Methods That Stay on Parent

| Method | Reason |
|--------|--------|
| `_getAutomations()` | Depends on `_entityRegistry`, `_automationsCache`, caching logic |
| `_fetchLabelRegistry()` | Registry management stays in parent |
| `_fetchCategoryRegistry()` | Registry management stays in parent |
| `_fetchEntityRegistry()` | Registry management stays in parent |
| `_snooze()` | Service call that uses `_selected` |
| `_wake()`, `_handleWakeEvent()`, etc. | Service calls |
| `_showToast()` | Toast is rendered in parent's shadow DOM |
| `_getPaused()`, `_getScheduled()`, etc. | Active pauses data |

## Test Impact Analysis

Summary of tests affected and the nature of changes needed:

| Test File | What Changes | Scope |
|-----------|-------------|-------|
| `test_card_ui.spec.js` | Filter tabs, search, selection, grouping -- heavy changes | ~50 assertions |
| `test_automation_categories.spec.js` | Category count, grouping, filter tab switching | ~10 assertions |
| `test_layout_switching.spec.js` | Tab switching, search preservation, group expansion | ~15 assertions |
| `test_boundary_mutations.spec.js` | Search filtering, filterTab defaults | ~10 assertions |
| `test_backend_schema.spec.js` | Search debounce | ~5 assertions |
| `test_mutation_coverage.spec.js` | toggleSelection, search debounce | ~10 assertions |
| `test_mutation_operators.spec.js` | toggleSelection, search, selection | ~10 assertions |
| `test_stress.spec.js` | Search filtering 100 automations | ~2 assertions |
| `test_console_monitoring.spec.js` | Filter tab switching, search | ~5 assertions |
| `test_card_compatibility.spec.js` | Filter tab isolation | ~2 assertions |
| `test_cleanup.spec.js` | Search timeout cleanup, selection | ~5 assertions |
| `test_defects.spec.js` | Filter tab, group headers | ~5 assertions |

**Test update categories:**

1. **DOM selector updates**: `card.shadowRoot.querySelector('.tab')` becomes `queryInAutomationList(card, '.tab')` -- mechanical, same as Phase 1/2 pattern.

2. **Internal state access updates**: `card._filterTab = 'areas'` becomes accessing the child component: `queryAutomationList(card)._filterTab = 'areas'` + `await queryAutomationList(card).updateComplete`.

3. **Method call updates**: `card._getGroupedByArea()` becomes `queryAutomationList(card)._getGroupedByArea()` (if testing through parent) or tested directly on child instance.

4. **New child component tests**: Create `tests/test_automation_list.spec.js` following the pattern of `test_duration_selector.spec.js` for direct child component testing.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic filter/list UI in main card | Extracted automation list component | Phase 3 (this phase) | Reduces main card to thin orchestrator |
| All state in parent | UI state in child, business state in parent | Phase 3 | Clearer separation of concerns |
| Registry lookups tightly coupled to parent | Registry data passed as props | Phase 3 | Child is a pure display component |

## Open Questions

1. **Should `_handleKeyDown` move to the child or stay shared?**
   - What we know: `_handleKeyDown` is a generic keyboard handler for Enter/Space. Currently on the parent.
   - What's unclear: Whether it's used in places other than the filter/list.
   - Recommendation: Move to child. It's only used in the list rendering context. If needed elsewhere later, it can be extracted to a utility.

2. **Should `_formatRegistryId` move to the child?**
   - What we know: It's currently a pass-through on the parent that calls `formatRegistryId()` from `src/state/automations.ts`.
   - What's unclear: Whether any code outside the filter/list uses the parent's `_formatRegistryId()`.
   - Recommendation: The child should import `formatRegistryId` directly from `src/state/automations.ts`. No need for a pass-through method.

3. **Should the `.list-empty` and `.empty` styles be split?**
   - What we know: In the mobile media query, `.list-empty` and `.empty` share a combined rule. `.list-empty` is used in the automation list; `.empty` may be used elsewhere.
   - Recommendation: Extract `.list-empty` to the child styles. Keep `.empty` in card.styles.ts if used elsewhere, or check usage first.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/components/autosnooze-card.ts` (1,044 lines) -- full analysis of render method, filter/list state, selection methods, grouping methods
- Codebase inspection: `src/styles/card.styles.ts` -- identified all CSS selectors for extraction (filter tabs, search, list, groups, selection actions)
- Codebase inspection: `src/state/automations.ts` -- verified pure utility functions (filterAutomations, groupAutomationsBy, getUniqueCount, name resolution)
- Codebase inspection: `src/components/autosnooze-duration-selector.ts` -- verified established extraction pattern
- Codebase inspection: `src/components/autosnooze-active-pauses.ts` -- verified established extraction pattern
- Codebase inspection: `tests/test_duration_selector.spec.js` -- verified child component test pattern
- Codebase inspection: 12 test files -- identified all filter/list/selection test touchpoints
- `.planning/phases/02-extract-duration-selector/02-RESEARCH.md` -- established extraction research pattern
- `.planning/phases/02-extract-duration-selector/02-01-PLAN.md` -- established Plan 01 (create component) structure
- `.planning/phases/02-extract-duration-selector/02-02-PLAN.md` -- established Plan 02 (wire + tests) structure

### Secondary (MEDIUM confidence)
- None needed. All patterns are established from prior phases.

### Tertiary (LOW confidence)
- None. All findings verified against codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Using existing project dependencies (Lit 3.3.2), no new libraries
- Architecture: HIGH -- Following established Phase 1/2 pattern (properties down/events up), with well-understood state ownership decisions
- Pitfalls: HIGH -- Identified from Phase 1/2 experience and comprehensive test file analysis

**Research date:** 2026-01-31
**Valid until:** 2026-03-31 (Lit 3.x is stable; project dependencies are pinned)
