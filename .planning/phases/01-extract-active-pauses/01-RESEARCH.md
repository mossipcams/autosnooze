# Phase 1: Extract Active Pauses Component - Research

**Researched:** 2026-01-31
**Domain:** Lit web component refactoring / component extraction
**Confidence:** HIGH

## Summary

This phase extracts the "active pauses" section from the monolithic `AutomationPauseCard` (~1,340 lines) into a standalone Lit child component. The active pauses section is already cleanly isolated as `_renderActivePauses()` (lines 1105-1155 of `autosnooze-card.ts`) plus its supporting methods (`_wake`, `_handleWakeAll`, `_showToast`, `_formatCountdown`, `_formatDateTime`). The extraction boundary is well-defined.

The standard pattern is Lit's "properties down, events up" composition model. The parent card passes `hass` and paused data as reactive properties to the child; the child fires custom events for actions (wake, wake-all) back up to the parent. This is the exact same pattern used throughout the Home Assistant frontend and already partially visible in this codebase (the editor component follows a similar composition approach).

**Primary recommendation:** Create `src/components/autosnooze-active-pauses.ts` as a LitElement that receives `hass` and pause group data via properties, fires `wake` and `wake-all` custom events, and owns its own countdown timer lifecycle. Extract relevant CSS selectors into `src/styles/active-pauses.styles.ts`. Keep toast notifications in the parent (they use `position: fixed` and belong to the card-level UI).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | 3.3.2 | Web component framework | Already in use, sole dependency |
| lit/decorators.js | 3.3.2 | `@property`, `@state` decorators | TypeScript class field reactive properties |
| vitest | 4.0.x | Testing framework | Already in use with jsdom |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rollup | 4.55.x | Bundle builder | Already configured, no changes needed |
| typescript | 5.9.x | Type checking | Already configured with decorators |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate child component | Reactive controller | Controller can't own its own template/styles; component is better for a distinct UI section |
| Custom events for actions | Direct method calls | Events maintain encapsulation and are the Lit standard; methods create tight coupling |

**Installation:** No new packages needed. Everything is already in the project.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    autosnooze-card.ts             # Parent card (shrinks by ~100 lines)
    autosnooze-active-pauses.ts    # NEW: extracted active pauses component
    autosnooze-card-editor.ts      # Existing editor
    index.ts                       # Updated to export new component
  styles/
    card.styles.ts                 # Parent card styles (shrinks)
    active-pauses.styles.ts        # NEW: extracted styles
    editor.styles.ts               # Existing editor styles
    index.ts                       # Updated to export new styles
```

### Pattern 1: Properties Down, Events Up
**What:** Parent passes data as reactive properties; child fires CustomEvents for actions.
**When to use:** Always, for parent-child component communication in Lit.
**Example:**
```typescript
// Source: https://lit.dev/docs/composition/component-composition/
// Parent template
html`<autosnooze-active-pauses
  .hass=${this.hass}
  .pauseGroups=${this._getPausedGroupedByResumeTime()}
  .pausedCount=${pausedCount}
  .wakeAllPending=${this._wakeAllPending}
  @wake-automation=${this._handleWakeEvent}
  @wake-all=${this._handleWakeAllEvent}
></autosnooze-active-pauses>`

// Child fires event
this.dispatchEvent(new CustomEvent('wake-automation', {
  detail: { entityId },
  bubbles: true,
  composed: true,
}));
```

### Pattern 2: Child Owns Its Timer Lifecycle
**What:** The active pauses component manages its own countdown interval.
**When to use:** When the child has periodic update logic independent of the parent.
**Example:**
```typescript
// Source: codebase pattern from autosnooze-card.ts lines 242-262
connectedCallback(): void {
  super.connectedCallback();
  this._startSynchronizedCountdown();
}

disconnectedCallback(): void {
  super.disconnectedCallback();
  if (this._interval !== null) {
    clearInterval(this._interval);
    this._interval = null;
  }
  if (this._syncTimeout !== null) {
    clearTimeout(this._syncTimeout);
    this._syncTimeout = null;
  }
}
```

### Pattern 3: Toast Stays in Parent
**What:** Toast notifications remain in the parent card, not the child.
**When to use:** When a notification uses `position: fixed` and needs to escape shadow DOM stacking contexts.
**Example:**
```typescript
// Parent handles the event and shows toast
private async _handleWakeEvent(e: CustomEvent<{ entityId: string }>): Promise<void> {
  const { entityId } = e.detail;
  await this._wake(entityId);
  // _wake already handles toast + haptic feedback
}
```

### Pattern 4: Declare hass with attribute: false
**What:** The `hass` object is passed via property binding, not HTML attribute.
**When to use:** Always for complex object properties in Lit.
**Example:**
```typescript
// Source: https://lit.dev/docs/components/properties/
@property({ attribute: false })
hass?: HomeAssistant;
```
This prevents Lit from attempting to serialize the large `hass` object to an HTML attribute string.

### Anti-Patterns to Avoid
- **Accessing parent internals from child:** The child component must never reach up into the parent's shadow DOM or call parent methods directly. Use events.
- **Duplicating the _showToast method in the child:** Toast is a card-level concern. The child should fire events; the parent shows toasts.
- **Making hass a reflected attribute:** Always use `attribute: false` for the `hass` object. Serializing it would be catastrophic for performance.
- **Registering the child as a custom element in the child file:** Registration belongs in `src/index.ts` alongside the other element registrations, or in the parent component file. Follow the existing pattern.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Countdown timer synchronization | Custom setTimeout/RAF logic | Existing `_startSynchronizedCountdown` pattern | Already handles second-boundary sync; copy the pattern |
| State helpers for paused data | Manual sensor attribute parsing | `getPaused`, `getPausedGroupedByResumeTime` from `src/state/paused.ts` | Already tested and correct |
| Time formatting | Custom date formatting | `formatCountdown`, `formatDateTime` from `src/utils/index.ts` | Already handles locale |
| Localization | Hardcoded strings | `localize()` from `src/localization/localize.ts` | Already supports 5 languages |
| Service calls | Direct `hass.callService` | `wakeAutomation`, `wakeAll` from `src/services/snooze.ts` | Already handles error logging |
| Haptic feedback | Custom implementation | `hapticFeedback` from `src/utils/haptic.ts` | Already exists |

**Key insight:** Nearly every function the child component needs already exists as an imported utility. The extraction is about moving template/lifecycle code, not reimplementing logic.

## Common Pitfalls

### Pitfall 1: Shadow DOM Query Selectors Break in Tests
**What goes wrong:** Tests that use `card.shadowRoot.querySelector('.snooze-list')` will fail because the `.snooze-list` element now lives inside the child component's shadow DOM, which is nested inside the parent's shadow DOM.
**Why it happens:** Shadow DOM creates isolation boundaries. `card.shadowRoot.querySelector('.snooze-list')` only searches the parent's shadow root, not the child's.
**How to avoid:** Tests must either:
  1. Query for the child element first, then query its shadow root: `card.shadowRoot.querySelector('autosnooze-active-pauses')?.shadowRoot?.querySelector('.snooze-list')`
  2. Or write new tests that test the child component in isolation
**Warning signs:** Tests that previously passed now return `null` from querySelector.

### Pitfall 2: Countdown Timer Running in Both Parent and Child
**What goes wrong:** If the countdown timer logic is not fully moved out of the parent, both the parent and child run timers, causing double updates and potential flicker.
**Why it happens:** The parent's `_startSynchronizedCountdown` and `_updateCountdownIfNeeded` are left in place while the child also starts its own timer.
**How to avoid:** The countdown timer logic must be fully owned by one component. Since the child owns the countdown display, the child should own the timer. Remove `_startSynchronizedCountdown`, `_updateCountdownIfNeeded`, `_interval`, and `_syncTimeout` from the parent.
**Warning signs:** `requestUpdate()` being called from both parent and child simultaneously.

### Pitfall 3: Wake All State Synchronization
**What goes wrong:** The `_wakeAllPending` state (two-tap confirmation) gets out of sync between parent and child.
**Why it happens:** The state lives in one component but the button rendering and timeout management are in the other.
**How to avoid:** Keep `_wakeAllPending` state and its timeout (`_wakeAllTimeout`) in whichever component renders the "Wake All" button. The child component should own this state since it renders the button. On successful wake-all, fire an event so the parent can show the toast.
**Warning signs:** Double-clicking Wake All doesn't work, or the pending state doesn't reset after timeout.

### Pitfall 4: Custom Element Registration Order
**What goes wrong:** The child component is used in the parent's template before it's registered, causing the browser to render it as an unknown element.
**Why it happens:** JavaScript module execution order may not guarantee the child is registered first.
**How to avoid:** Register the child element in `src/index.ts` BEFORE registering the parent, or use the side-effect import pattern (import the child module in the parent file). The existing pattern in `src/index.ts` registers elements in order.
**Warning signs:** The child component renders as an empty block or the tag name appears literally in the DOM.

### Pitfall 5: Styles Not Inherited Across Shadow DOM Boundaries
**What goes wrong:** CSS custom properties from HA (like `--primary-color`, `--divider-color`) work fine, but the extracted component's styles appear broken or differently sized.
**Why it happens:** The child has its own shadow DOM, so the parent's CSS rules don't cascade into it. However, CSS custom properties DO pierce shadow boundaries.
**How to avoid:** Extract the relevant CSS rules (`.snooze-list`, `.pause-group`, `.paused-item`, `.wake-btn`, `.wake-all`, `.countdown`, etc.) into `active-pauses.styles.ts`. The HA CSS custom properties (`--primary-color`, `--card-background-color`, etc.) will continue to work because they pierce shadow boundaries.
**Warning signs:** Component renders but looks unstyled or has wrong colors/spacing.

### Pitfall 6: Existing Tests Import Built Bundle, Not Source
**What goes wrong:** Tests import `../custom_components/autosnooze/www/autosnooze-card.js` (the built bundle), so changes to TypeScript source files are invisible to tests until `npm run build` is run.
**Why it happens:** The test files import the Rollup output, not the TypeScript source directly. The vitest config aliases `lit` but doesn't transform `.ts` sources (however, the `vitest.config.mjs` does include `src/**/*.ts` for coverage, so the framework supports it).
**How to avoid:** Ensure `npm run build` is run before running tests, or update test imports to use source files (which vitest can handle natively with TypeScript transform). The current test pattern imports the built bundle -- follow this same pattern for consistency.
**Warning signs:** Tests pass but coverage doesn't reflect the new component.

## Code Examples

Verified patterns from the codebase and official Lit documentation:

### Child Component Declaration
```typescript
// Source: Lit docs + existing codebase patterns
import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import type { HomeAssistant } from '../types/hass.js';
import type { PauseGroup } from '../types/automation.js';
import { activePausesStyles } from '../styles/active-pauses.styles.js';
import { formatCountdown, formatDateTime } from '../utils/index.js';
import { UI_TIMING } from '../constants/index.js';

export class AutoSnoozeActivePauses extends LitElement {
  static styles = activePausesStyles;

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  pauseGroups: PauseGroup[] = [];

  @property({ type: Number })
  pausedCount: number = 0;

  // Internal state
  @state() private _wakeAllPending: boolean = false;
  private _wakeAllTimeout: number | null = null;
  private _interval: number | null = null;
  private _syncTimeout: number | null = null;
}
```

### Parent Template Usage
```typescript
// Source: existing _renderActivePauses pattern in autosnooze-card.ts line 1333
// Before (inline):
${this._renderActivePauses(pausedCount)}

// After (component):
${pausedCount > 0
  ? html`<autosnooze-active-pauses
      .hass=${this.hass}
      .pauseGroups=${this._getPausedGroupedByResumeTime()}
      .pausedCount=${pausedCount}
    ></autosnooze-active-pauses>`
  : ''}
```

### Event Dispatching from Child
```typescript
// Source: https://lit.dev/docs/composition/component-composition/
private _fireWake(entityId: string): void {
  this.dispatchEvent(new CustomEvent('wake-automation', {
    detail: { entityId },
    bubbles: true,
    composed: true,
  }));
}

private _fireWakeAll(): void {
  this.dispatchEvent(new CustomEvent('wake-all', {
    bubbles: true,
    composed: true,
  }));
}
```

### Custom Element Registration
```typescript
// Source: existing pattern in src/index.ts
if (!customElements.get('autosnooze-active-pauses')) {
  customElements.define('autosnooze-active-pauses', AutoSnoozeActivePauses);
}
```

### CSS Extraction Pattern (Active Pauses Styles)
```typescript
// The following CSS selectors from card.styles.ts belong to the child:
// .snooze-list, .list-header (in snooze-list context), .pause-group,
// .pause-group-header, .paused-item, .paused-icon, .paused-info,
// .paused-name, .paused-time, .countdown, .wake-btn, .wake-all
// Plus corresponding @media (max-width: 480px) overrides
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lit 2.x class field issues | Lit 3.x with `useDefineForClassFields: false` in tsconfig | Lit 3.0 (2023) | Project already configured correctly in tsconfig.json |
| `@property()` for hass | `@property({ attribute: false })` for hass | Lit community best practice | Prevents serialization of large objects |
| Monolithic card components | Composition via child elements | Standard Lit pattern | Reduces complexity, improves testability |

**Deprecated/outdated:**
- None relevant. Lit 3.3.2 is current. The project's tsconfig already has `useDefineForClassFields: false` and `experimentalDecorators: true`, which is correct.

## Open Questions

1. **Should the child component own the countdown timer or should the parent trigger re-renders?**
   - What we know: Currently the parent owns `_startSynchronizedCountdown` which calls `requestUpdate()` every second. The child only needs updates when there are active pauses.
   - What's unclear: Whether having the child own its own timer creates issues if the parent also needs to know about countdown state for other purposes (e.g., the status summary in the header).
   - Recommendation: Move the timer to the child. The parent's status summary uses `pausedCount` (from hass state), not countdown values. The countdown is purely a display concern of the active pauses section.

2. **Should Wake All two-tap confirmation state live in child or parent?**
   - What we know: `_wakeAllPending` controls the Wake All button's visual state and the confirmation timeout. The button is rendered in the active pauses section.
   - What's unclear: Whether future phases might need this state elsewhere.
   - Recommendation: Put it in the child. The button lives there, the state lives there. If a future phase needs it, it can be lifted up then (YAGNI).

3. **Should the child own its toast or delegate to parent?**
   - What we know: Toast uses `position: fixed` and is appended to shadowRoot. Shadow DOM creates stacking contexts. The current toast in the parent works because ha-card has the right stacking context.
   - Recommendation: Keep toast in parent. The child fires events; the parent's event handlers call `_showToast`. This avoids shadow DOM z-index issues and keeps toast as a card-level concern.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/components/autosnooze-card.ts` (1,338 lines) - full analysis of _renderActivePauses, _wake, _handleWakeAll, timer lifecycle
- Codebase inspection: `src/styles/card.styles.ts` (1,491 lines) - identified CSS selectors for extraction
- Codebase inspection: `src/state/paused.ts` - verified getPaused, getPausedGroupedByResumeTime APIs
- Codebase inspection: `tests/test_card_ui.spec.js` - identified tests touching active pauses DOM selectors
- Codebase inspection: `tests/test_backend_schema.spec.js` - identified tests touching wake/countdown
- [Lit Component Composition docs](https://lit.dev/docs/composition/component-composition/) - properties down, events up pattern
- [Lit Reactive Properties docs](https://lit.dev/docs/components/properties/) - @property vs @state, attribute: false

### Secondary (MEDIUM confidence)
- [Home Assistant custom card docs](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/) - hass property passing pattern
- WebSearch results confirming `.hass=${this.hass}` as standard HA pattern

### Tertiary (LOW confidence)
- None. All findings verified against codebase or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies (Lit 3.3.2), no new libraries
- Architecture: HIGH - Properties down/events up is the official Lit pattern, verified against docs
- Pitfalls: HIGH - Identified from direct codebase analysis (shadow DOM query selectors, timer duplication, test import patterns)

**Research date:** 2026-01-31
**Valid until:** 2026-03-31 (Lit 3.x is stable; project dependencies are pinned)
