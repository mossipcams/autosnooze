# Phase 6: Adjust Modal Component - Research

**Researched:** 2026-02-01
**Domain:** Lit web component modal dialog with countdown timer and service integration
**Confidence:** HIGH

## Summary

Phase 6 adds an adjust modal that opens when users tap a paused automation row. The modal shows the automation name, a live countdown, and increment/decrement buttons that call `autosnooze.adjust` on the backend. The research focuses on how to build this as a new Lit component (`autosnooze-adjust-modal`) following the exact patterns established in Phases 1-5.

The codebase already has all the building blocks: the `formatCountdown` utility for live countdowns, the synchronized countdown timer pattern in `autosnooze-active-pauses`, the `hass.callService('autosnooze', 'adjust', ...)` backend contract, the event-based parent-child communication pattern, and the component registration pattern in `src/index.ts`. No new libraries are needed.

**Primary recommendation:** Build a standalone `AutoSnoozeAdjustModal` Lit component with its own styles file, following the same extraction pattern used for active-pauses and duration-selector. The modal is a simple overlay (CSS-based, not ha-dialog) since this runs inside a Lovelace card's shadow DOM where HA dialog APIs are unreliable. The parent card opens/closes the modal via a reactive property, and the active-pauses component fires an event when a row is tapped.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lit | (bundled) | Web component framework | Already used by all components |
| lit/decorators.js | (bundled) | @property, @state decorators | Already used by all components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | All utilities exist in src/utils/ |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS overlay modal | ha-dialog | ha-dialog requires HA frontend globals; unreliable inside card shadow DOM; CSS overlay is simpler and fully controlled |
| Inline editing | Modal dialog | Requirements explicitly specify modal (ADJ-01); modal provides focused interaction without cluttering the list |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    autosnooze-adjust-modal.ts    # NEW - modal component
  styles/
    adjust-modal.styles.ts        # NEW - modal styles
```

### Pattern 1: Event-Driven Parent-Child Communication (Established)

**What:** Child components fire CustomEvents with `bubbles: true, composed: true`; the parent card listens and handles service calls.
**When to use:** All inter-component communication in this codebase.
**Example (from active-pauses.ts):**
```typescript
// Child fires event
_fireWake(entityId: string): void {
  this.dispatchEvent(new CustomEvent('wake-automation', {
    detail: { entityId },
    bubbles: true,
    composed: true,
  }));
}

// Parent listens in template
html`<autosnooze-active-pauses
  @wake-automation=${this._handleWakeEvent}
></autosnooze-active-pauses>`
```

**For the adjust modal, the event chain is:**
1. `autosnooze-active-pauses` fires `adjust-automation` event with `{ entityId, friendlyName, resumeAt }`
2. Parent card receives event, sets modal state properties
3. `autosnooze-adjust-modal` renders based on properties from parent
4. Modal fires `adjust-time` event with `{ entityId, days, hours, minutes }`
5. Parent card calls `hass.callService('autosnooze', 'adjust', ...)`
6. Modal fires `close-modal` event; parent clears modal state

### Pattern 2: Synchronized Countdown Timer (Established)

**What:** Timer aligns to second boundaries for smooth countdown display.
**When to use:** Any component that displays live remaining time.
**Example (from active-pauses.ts):**
```typescript
_startSynchronizedCountdown(): void {
  const now = Date.now();
  const msUntilNextSecond = 1000 - (now % 1000);
  this._syncTimeout = window.setTimeout(() => {
    this._syncTimeout = null;
    this._updateCountdownIfNeeded();
    this._interval = window.setInterval(() => {
      this._updateCountdownIfNeeded();
    }, UI_TIMING.COUNTDOWN_INTERVAL_MS);
  }, msUntilNextSecond);
}
```

**The modal will reuse this exact pattern** to display a live countdown of the remaining time. Import `formatCountdown` from `src/utils/index.js` and `UI_TIMING` from `src/constants/index.js`.

### Pattern 3: Component Registration (Established)

**What:** Each component is registered in `src/index.ts` with a guard check.
**When to use:** Every new custom element.
**Example:**
```typescript
if (!customElements.get('autosnooze-adjust-modal')) {
  customElements.define('autosnooze-adjust-modal', AutoSnoozeAdjustModal);
}
```

### Pattern 4: CSS Overlay Modal (New for This Project)

**What:** A fullscreen overlay rendered inside the card's shadow DOM using CSS positioning.
**When to use:** Modal dialogs within Lovelace cards that cannot access HA's dialog system.
**Example:**
```typescript
render() {
  if (!this.open) return html``;
  return html`
    <div class="modal-overlay" @click=${this._handleOverlayClick}>
      <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
        <div class="modal-header">
          <span class="modal-title">${this.friendlyName}</span>
          <button class="modal-close" @click=${this._close}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="modal-body">
          <div class="remaining-time">${formatCountdown(this.resumeAt)}</div>
          <div class="adjust-buttons">
            ${this._renderIncrementButtons()}
            ${this._renderDecrementButtons()}
          </div>
        </div>
      </div>
    </div>
  `;
}
```

### Anti-Patterns to Avoid
- **Using ha-dialog:** HA's dialog component requires being at the document level and relies on HA frontend internals. Inside a card's shadow DOM, it will not render or position correctly. Use a CSS overlay instead.
- **Calling services directly from the modal:** Services should be called by the parent card to maintain the single-responsibility pattern. The modal fires events; the parent handles the service call and toast notifications.
- **Storing modal open/close state in the modal component:** The parent should own the open state and pass it as a property. This allows the parent to close the modal after a successful service call or on errors.
- **Running two countdown timers:** When the modal is open, the active-pauses component still has its countdown running. The modal runs its own independent countdown. This is fine -- they both read the same `resumeAt` value and compute the display independently. Do NOT try to share a single timer.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Countdown formatting | Custom time diff logic | `formatCountdown(resumeAt)` from `src/utils/time-formatting.ts` | Already handles days/hours/minutes/seconds formatting and "Resuming..." edge case |
| Haptic feedback | Direct vibration API | `hapticFeedback('light')` from `src/utils/haptic.ts` | Uses HA's native haptic system that works on iOS and Android companion apps |
| Localization | Hardcoded strings | `localize(this.hass, 'key')` from `src/localization/localize.ts` | Supports en/es/fr/de/it with fallback |
| Remaining time calculation | Manual Date math | `new Date(resumeAt).getTime() - Date.now()` | Standard pattern used in formatCountdown |
| Timer synchronization | Naive setInterval | Synchronized countdown pattern from active-pauses | Aligns to second boundaries for smooth updates |

**Key insight:** Every utility needed for the modal already exists in the codebase. The modal component is purely composition of existing patterns.

## Common Pitfalls

### Pitfall 1: Forgetting `composed: true` on CustomEvents
**What goes wrong:** Events don't cross shadow DOM boundaries, parent never receives them.
**Why it happens:** Default `composed` is `false`; easy to forget.
**How to avoid:** Always include `bubbles: true, composed: true` on every CustomEvent. Copy from existing event patterns.
**Warning signs:** Parent event handler never fires; no errors in console.

### Pitfall 2: Decrement Button Disabling Calculation
**What goes wrong:** Buttons should be disabled when remaining time would drop below 1 minute after decrement. Incorrect calculation allows time to go negative.
**Why it happens:** Comparing against wrong threshold or not accounting for the decrement amount.
**How to avoid:** Calculate: `remainingMs = new Date(resumeAt).getTime() - Date.now()`. Button disabled when `remainingMs - decrementMs < 60000` (60 seconds = 1 minute). Use constants: `15 * 60000`, `30 * 60000`.
**Warning signs:** User can tap decrement and get a backend error ("Adjusted time must be at least 1 minute in the future").

### Pitfall 3: Modal Click-Through on Overlay
**What goes wrong:** Clicking the overlay background closes the modal, but clicks on the modal content also close it.
**Why it happens:** Event bubbling -- click on content bubbles up to overlay.
**How to avoid:** `e.stopPropagation()` on the modal content container. See Pattern 4 example.
**Warning signs:** Modal closes when clicking buttons inside it.

### Pitfall 4: Timer Cleanup on Disconnect
**What goes wrong:** Interval keeps running after modal is closed or component disconnected.
**Why it happens:** Missing cleanup in `disconnectedCallback`.
**How to avoid:** Clear interval and timeout in `disconnectedCallback()`, matching the pattern in active-pauses.
**Warning signs:** Memory leaks, console errors about accessing properties of disconnected elements.

### Pitfall 5: Stale resumeAt After Adjust
**What goes wrong:** After calling adjust service, the modal still shows old countdown because the parent hasn't received updated sensor data yet.
**Why it happens:** Backend updates sensor asynchronously; HA pushes new state to card via hass property update.
**How to avoid:** Two approaches: (1) optimistically update the displayed resumeAt locally after service call, or (2) close the modal after each adjust call and let the user re-open to see updated time. Option (2) is simpler but worse UX. Option (1) is recommended: fire `adjust-time` event with the increment, parent calls service, on success fires back an event or updates the resumeAt property on the modal.
**Warning signs:** Countdown doesn't change after tapping an increment button.

### Pitfall 6: z-index Stacking Context in Shadow DOM
**What goes wrong:** Modal overlay doesn't cover sibling elements or appears behind them.
**Why it happens:** Lovelace cards have specific stacking contexts; `position: fixed` inside shadow DOM doesn't always work as expected.
**How to avoid:** Use `position: fixed` with a high z-index for the overlay. Since the modal is inside the card's shadow DOM, it will overlay the card's contents. Test on both desktop and mobile.
**Warning signs:** Modal appears behind other elements or doesn't cover the card.

## Code Examples

Verified patterns from the existing codebase:

### Calling the Adjust Service (Backend Contract)
```typescript
// From services.yaml: adjust accepts entity_id + days/hours/minutes (negative allowed)
// Frontend call pattern:
await hass.callService('autosnooze', 'adjust', {
  entity_id: 'automation.my_automation',
  minutes: 15,  // positive to add time
});

await hass.callService('autosnooze', 'adjust', {
  entity_id: 'automation.my_automation',
  minutes: -15,  // negative to subtract time
});

// For hours:
await hass.callService('autosnooze', 'adjust', {
  entity_id: 'automation.my_automation',
  hours: 1,
});

// For 2 hours:
await hass.callService('autosnooze', 'adjust', {
  entity_id: 'automation.my_automation',
  hours: 2,
});
```

### Frontend Service Wrapper (To Be Created)
```typescript
// Add to src/services/snooze.ts:
export async function adjustSnooze(
  hass: HomeAssistant,
  entityId: string,
  params: { days?: number; hours?: number; minutes?: number }
): Promise<void> {
  try {
    await hass.callService('autosnooze', 'adjust', {
      entity_id: entityId,
      ...params,
    });
  } catch (error) {
    console.error('[AutoSnooze] Failed to adjust snooze:', error);
    throw error;
  }
}
```

### Active Pauses Row Tap Event (To Be Added)
```typescript
// In autosnooze-active-pauses.ts, make the paused-item row tappable:
${group.automations.map((auto) => html`
  <div class="paused-item" @click=${() => this._fireAdjust(auto)}>
    <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
    <div class="paused-info">
      <div class="paused-name">${auto.friendly_name || auto.entity_id}</div>
    </div>
    <button type="button" class="wake-btn"
      @click=${(e: Event) => { e.stopPropagation(); this._fireWake(auto.entity_id); }}>
      ${localize(this.hass, 'button.resume')}
    </button>
  </div>
`)}

_fireAdjust(auto: PausedAutomation): void {
  this.dispatchEvent(new CustomEvent('adjust-automation', {
    detail: {
      entityId: auto.entity_id,
      friendlyName: auto.friendly_name,
      resumeAt: auto.resume_at,
    },
    bubbles: true,
    composed: true,
  }));
}
```

### Increment/Decrement Button Configuration
```typescript
// Constants for the adjust modal buttons
const ADJUST_INCREMENTS = [
  { label: '+15m', minutes: 15 },
  { label: '+30m', minutes: 30 },
  { label: '+1h', hours: 1 },
  { label: '+2h', hours: 2 },
];

const ADJUST_DECREMENTS = [
  { label: '-15m', minutes: -15, thresholdMs: 15 * 60 * 1000 },
  { label: '-30m', minutes: -30, thresholdMs: 30 * 60 * 1000 },
];
```

### Decrement Button Disabled Logic
```typescript
_isDecrementDisabled(thresholdMs: number): boolean {
  const remainingMs = new Date(this.resumeAt).getTime() - Date.now();
  // Disable if remaining time minus the decrement would be less than 1 minute
  return (remainingMs - thresholdMs) < 60000;
}
```

### Modal Component Skeleton
```typescript
export class AutoSnoozeAdjustModal extends LitElement {
  static styles = adjustModalStyles;

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ type: Boolean })
  open: boolean = false;

  @property({ type: String })
  entityId: string = '';

  @property({ type: String })
  friendlyName: string = '';

  @property({ type: String })
  resumeAt: string = '';

  _interval: number | null = null;
  _syncTimeout: number | null = null;

  // Lifecycle: start/stop countdown when open changes
  updated(changedProps: PropertyValues): void {
    if (changedProps.has('open')) {
      if (this.open) {
        this._startSynchronizedCountdown();
      } else {
        this._stopCountdown();
      }
    }
  }
  // ... countdown and event methods
}
```

### Test Pattern (Following Duration Selector Test Style)
```typescript
import { describe, it, expect, vi } from 'vitest';
import { AutoSnoozeAdjustModal } from '../src/components/index.js';

if (!customElements.get('autosnooze-adjust-modal')) {
  customElements.define('autosnooze-adjust-modal', AutoSnoozeAdjustModal);
}

describe('AutoSnoozeAdjustModal', () => {
  it('should be importable as a class', () => {
    expect(AutoSnoozeAdjustModal).toBeDefined();
  });

  it('should have open property defaulting to false', () => {
    const el = new AutoSnoozeAdjustModal();
    expect(el.open).toBe(false);
  });

  it('should render nothing when closed', async () => {
    const el = await createAndConnectElement('autosnooze-adjust-modal');
    expect(el.shadowRoot.querySelector('.modal-overlay')).toBeNull();
  });

  it('should fire adjust-time event on increment click', async () => {
    const el = new AutoSnoozeAdjustModal();
    el.open = true;
    el.entityId = 'automation.test';
    el.resumeAt = new Date(Date.now() + 3600000).toISOString();
    let firedDetail = null;
    el.addEventListener('adjust-time', (e) => { firedDetail = e.detail; });
    // ... trigger button click
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ha-dialog for modals | CSS overlay inside shadow DOM | N/A (project convention) | Full control, no HA dependency for dialog rendering |
| Inline editing in list | Modal dialog | Phase 6 design decision | Cleaner UX, dedicated focus for adjustment |

**Deprecated/outdated:**
- None relevant. The project is internally consistent with its own patterns.

## Open Questions

Things that couldn't be fully resolved:

1. **Optimistic UI Update vs. Re-open Pattern**
   - What we know: After calling adjust, the backend updates the sensor. The new state flows to the card via HA's reactive system (hass property update). There will be a brief delay (typically <500ms).
   - What's unclear: Whether to optimistically update the modal's `resumeAt` locally (better UX, more complex) or simply wait for the next hass update to propagate.
   - Recommendation: Optimistic update. After a successful adjust call, compute the new resumeAt locally: `newResumeAt = new Date(new Date(this.resumeAt).getTime() + deltaMs).toISOString()` and update the property. If the parent also updates via hass, the property will be overwritten with the authoritative value.

2. **Modal Position: Fixed vs. Absolute**
   - What we know: `position: fixed` overlays the entire viewport. `position: absolute` is relative to the card's positioned ancestor.
   - What's unclear: Whether `position: fixed` behaves correctly inside all Lovelace layouts (panel mode, masonry, etc.).
   - Recommendation: Use `position: fixed` with `z-index: 999`. This is the standard approach for overlays inside web components and works in all tested HA layouts. If issues arise, fall back to absolute positioning with a scroll-lock.

3. **Translation Keys for Modal**
   - What we know: All strings need translation keys in en.json (and other language files).
   - What's unclear: Exact wording for modal title, button labels, and ARIA labels.
   - Recommendation: Add an `adjust` section to the translation files: `adjust.title`, `adjust.remaining`, `adjust.add_time`, `adjust.reduce_time`, etc. Follow the established pattern of descriptive keys.

## Sources

### Primary (HIGH confidence)
- `src/components/autosnooze-active-pauses.ts` - Active pauses rendering, countdown timer, event patterns
- `src/components/autosnooze-card.ts` - Parent orchestrator, event handling, service call patterns
- `src/components/autosnooze-duration-selector.ts` - Child component event pattern reference
- `src/services/snooze.ts` - Service wrapper patterns
- `src/utils/time-formatting.ts` - formatCountdown implementation
- `src/constants/index.ts` - UI_TIMING constants
- `src/localization/localize.ts` - Localization pattern
- `custom_components/autosnooze/services.yaml` - Adjust service definition (days/hours/minutes, negative allowed)
- `custom_components/autosnooze/services.py` - handle_adjust implementation (zero-delta validation)
- `custom_components/autosnooze/coordinator.py` - async_adjust_snooze (1-minute minimum validation)
- `tests/test_duration_selector.spec.js` - Test pattern for extracted components
- `tests/vitest.setup.ts` - Test infrastructure (createMockHass, waitForLitUpdate, createAndConnectElement)

### Secondary (MEDIUM confidence)
- Home Assistant Lovelace card development conventions for shadow DOM isolation

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed; everything exists in codebase
- Architecture: HIGH - Follows exact patterns from Phases 1-5
- Pitfalls: HIGH - Identified from direct code analysis of existing components
- Code examples: HIGH - Derived from actual codebase patterns

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable codebase, no external dependency changes expected)
