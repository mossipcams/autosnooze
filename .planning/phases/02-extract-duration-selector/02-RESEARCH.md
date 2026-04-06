# Phase 2: Extract Duration Selector Component - Research

**Researched:** 2026-01-31
**Domain:** Lit web component refactoring / component extraction
**Confidence:** HIGH

## Summary

This phase extracts the duration selector UI (days/hours/minutes fields, quick-duration preset pills, custom duration mode, schedule mode toggle) from the parent `AutomationPauseCard` (~1,232 lines) into a standalone Lit child component. The duration selector is cleanly isolated in `_renderDurationSelector()` (lines 915-1040 of `autosnooze-card.ts`) plus its supporting state and methods.

Following the established pattern from Phase 1, the child component will receive configuration data via properties and fire custom events for state changes. The parent owns the "snooze" action and schedule mode state, while the child owns duration selection UI state.

**Primary recommendation:** Create `src/components/autosnooze-duration-selector.ts` as a LitElement that receives configuration (presets, last duration, schedule mode) via properties, manages local UI state (custom input visibility, custom duration input), and fires events for duration changes and mode switches. Extract relevant CSS selectors into `src/styles/duration-selector.styles.ts`.

## Standard Stack

The established libraries/tools for this domain (same as Phase 1):

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
    autosnooze-card.ts                    # Parent card (shrinks by ~150 lines)
    autosnooze-active-pauses.ts           # Phase 1: active pauses child
    autosnooze-duration-selector.ts       # NEW: duration selector child
    autosnooze-card-editor.ts             # Existing editor
    index.ts                              # Updated to export new component
  styles/
    card.styles.ts                        # Parent card styles (shrinks)
    active-pauses.styles.ts               # Phase 1: active pauses styles
    duration-selector.styles.ts           # NEW: extracted styles
    editor.styles.ts                      # Existing editor styles
    index.ts                              # Updated to export new styles
```

### Pattern 1: Properties Down, Events Up (Same as Phase 1)
**What:** Parent passes data as reactive properties; child fires CustomEvents for state changes.
**When to use:** Always, for parent-child component communication in Lit.
**Example:**
```typescript
// Parent template
html`<autosnooze-duration-selector
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
></autosnooze-duration-selector>`

// Child fires event
this.dispatchEvent(new CustomEvent('duration-change', {
  detail: { minutes: totalMinutes, duration: parsed },
  bubbles: true,
  composed: true,
}));
```

### Pattern 2: Child Owns UI-Only State
**What:** The child owns state that only affects its own rendering (e.g., `_showCustomInput`).
**When to use:** When state doesn't need to persist or be shared with parent.
**Example:**
```typescript
// Child component internal state
@state() private _showCustomInput: boolean = false;

// Toggle handled locally
private _toggleCustomInput(): void {
  this._showCustomInput = !this._showCustomInput;
}
```

### Pattern 3: Parent Owns Business Logic State
**What:** The parent owns state that affects application logic (e.g., `_scheduleMode`, `_customDuration`).
**When to use:** When state needs to persist or be used in service calls.
**Example:**
```typescript
// Parent keeps these states
@state() private _scheduleMode: boolean = false;
@state() private _customDuration: ParsedDuration = { days: 0, hours: 0, minutes: 30 };

// Parent handles event from child
private _handleScheduleModeChange(e: CustomEvent<{ enabled: boolean }>): void {
  this._scheduleMode = e.detail.enabled;
  if (e.detail.enabled) {
    this._enterScheduleMode();
  }
}
```

### Anti-Patterns to Avoid
- **Duplicating duration calculation logic:** Use existing utility functions (`parseDurationInput`, `durationToMinutes`, `minutesToDuration`, `formatDurationShort`) from `src/utils/index.js`.
- **Making every state field a property:** Only pass down state that the child needs for rendering or validation. UI-only toggles can be internal state.
- **Over-eventing:** Don't fire events for every keystroke -- debounce or only fire on valid state changes.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Duration parsing | Custom regex/split logic | `parseDurationInput` from `src/utils/duration.ts` | Already handles "30m", "2h30m", "1d2h", complex formats |
| Duration formatting | String concatenation | `formatDuration`, `formatDurationShort` from `src/utils/duration.ts` | Already handles pluralization, localization |
| Duration validation | Custom validation | `isDurationValid` from `src/utils/duration.ts` | Already validates input format |
| Duration conversion | Math calculations | `durationToMinutes`, `minutesToDuration` from `src/utils/duration.ts` | Already handles day/hour/minute conversion |
| Date options generation | Manual date array building | `generateDateOptions` from `src/utils/datetime.ts` | Already generates localized date options |
| Current date/time | `new Date()` | `getCurrentDateTime` from `src/utils/datetime.ts` | Already returns formatted date/time strings |
| DateTime combination | String manipulation | `combineDateTime` from `src/utils/datetime.ts` | Already handles date + time -> ISO string |
| Localization | Hardcoded strings | `localize()` from `src/localization/localize.ts` | Already supports 5 languages |

**Key insight:** All duration and datetime logic already exists as tested utilities. The extraction is about moving template/state code, not reimplementing logic.

## Common Pitfalls

### Pitfall 1: Shadow DOM Query Selectors Break in Tests (Same as Phase 1)
**What goes wrong:** Tests that use `card.shadowRoot.querySelector('.duration-selector')` will fail because the element now lives inside the child component's shadow DOM.
**Why it happens:** Shadow DOM creates isolation boundaries.
**How to avoid:** Tests must query through the child component:
```javascript
const durationSelector = card.shadowRoot.querySelector('autosnooze-duration-selector');
const customInput = durationSelector?.shadowRoot?.querySelector('.duration-input');
```
**Warning signs:** Tests that previously passed now return `null` from querySelector.

### Pitfall 2: Event Timing and State Synchronization
**What goes wrong:** User types in custom duration input, but the parent's `_customDuration` state doesn't update, causing the snooze button to use stale data.
**Why it happens:** Events aren't fired on every input change, or parent doesn't handle the event correctly.
**How to avoid:** Fire `duration-change` event on every valid input change. Parent updates `_customDuration` in the event handler. Child receives updated `_customDuration` as a property on next render.
**Warning signs:** Snooze button uses old duration value; input shows one thing, service call sends another.

### Pitfall 3: Schedule Mode Toggle State Confusion
**What goes wrong:** User clicks "Pick date/time", but UI doesn't switch to schedule mode inputs.
**Why it happens:** The `_scheduleMode` state lives in the parent, but the child renders conditionally based on it. If the child toggles its own local state instead of firing an event, parent and child get out of sync.
**How to avoid:** `_scheduleMode` must live in the parent. Child fires `schedule-mode-change` event. Parent updates `_scheduleMode`. Child receives updated `scheduleMode` property and re-renders.
**Warning signs:** Click "Pick date/time" but nothing happens; click again and it works.

### Pitfall 4: Custom Duration Input Lifecycle
**What goes wrong:** User selects "Custom" pill, types a duration, then selects a preset pill. Custom input field is still visible and contains stale text.
**Why it happens:** `_showCustomInput` state isn't reset when a preset is selected.
**How to avoid:** When a preset pill is clicked, fire event with `showCustomInput: false` flag, or have parent pass down `showCustomInput` property and child updates based on that.
**Warning signs:** Custom input doesn't hide when preset is selected.

### Pitfall 5: Last Duration Badge Logic
**What goes wrong:** "Last" duration badge appears when it shouldn't, or doesn't appear when it should.
**Why it happens:** The logic for showing the badge depends on comparing `_lastDuration.minutes` against the preset minutes. This logic is currently in `_renderLastDurationBadge()` (lines 784-819).
**How to avoid:** Keep the comparison logic in the parent and pass a computed property like `showLastDurationBadge: boolean` to the child. Or move the entire logic into the child if it has access to all needed data (presets, last duration, current duration).
**Warning signs:** Badge visibility doesn't match expected behavior.

### Pitfall 6: Preset Pills Configuration
**What goes wrong:** Custom configured presets from sensor attributes aren't displayed.
**Why it happens:** The `_getDurationPills()` method (lines 764-782) reads from `hass.states['sensor.autosnooze_snoozed_automations'].attributes.duration_presets`. This logic needs to move to the child or be computed in the parent and passed down.
**How to avoid:** Compute the pill list in the parent and pass as a property: `durationPills: { label: string; minutes: number | null }[]`. Or pass `hass` to the child and let it read the sensor (child would need access to `hass` anyway for localization).
**Warning signs:** Custom presets don't appear in the UI.

## Code Examples

Verified patterns from the codebase and official Lit documentation:

### Child Component Declaration
```typescript
import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import type { HomeAssistant } from '../types/hass.js';
import type { ParsedDuration, LastDurationData } from '../types/automation.js';
import { durationSelectorStyles } from '../styles/duration-selector.styles.js';
import {
  formatDurationShort,
  parseDurationInput,
  isDurationValid,
  durationToMinutes,
  formatDuration,
  getCurrentDateTime,
  generateDateOptions,
} from '../utils/index.js';

export class AutoSnoozeDurationSelector extends LitElement {
  static styles = durationSelectorStyles;

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ type: Boolean })
  scheduleMode: boolean = false;

  @property({ attribute: false })
  customDuration: ParsedDuration = { days: 0, hours: 0, minutes: 30 };

  @property({ type: String })
  customDurationInput: string = '30m';

  @property({ type: Boolean })
  showCustomInput: boolean = false;

  @property({ attribute: false })
  lastDuration: LastDurationData | null = null;

  // Schedule mode fields
  @property({ type: String })
  disableAtDate: string = '';

  @property({ type: String })
  disableAtTime: string = '';

  @property({ type: String })
  resumeAtDate: string = '';

  @property({ type: String })
  resumeAtTime: string = '';
}
```

### Parent Template Usage
```typescript
// Parent render() method
${this._renderDurationSelector(selectedDuration, durationPreview, durationValid)}

// Replaced with:
html`<autosnooze-duration-selector
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
></autosnooze-duration-selector>`
```

### Event Dispatching from Child
```typescript
// When preset pill clicked
private _fireDurationChange(minutes: number): void {
  const duration = minutesToDuration(minutes);
  this.dispatchEvent(new CustomEvent('duration-change', {
    detail: { minutes, duration, showCustomInput: false },
    bubbles: true,
    composed: true,
  }));
}

// When custom input changes
private _handleCustomDurationInput(value: string): void {
  const parsed = parseDurationInput(value);
  if (parsed) {
    const totalMinutes = durationToMinutes(parsed);
    this.dispatchEvent(new CustomEvent('duration-change', {
      detail: { minutes: totalMinutes, duration: parsed, input: value },
      bubbles: true,
      composed: true,
    }));
  }
}

// When schedule mode toggle clicked
private _toggleScheduleMode(): void {
  this.dispatchEvent(new CustomEvent('schedule-mode-change', {
    detail: { enabled: !this.scheduleMode },
    bubbles: true,
    composed: true,
  }));
}

// When schedule date/time fields change
private _handleScheduleFieldChange(field: string, value: string): void {
  this.dispatchEvent(new CustomEvent('schedule-field-change', {
    detail: { field, value },
    bubbles: true,
    composed: true,
  }));
}
```

### CSS Extraction Pattern (Duration Selector Styles)
```typescript
// The following CSS selectors from card.styles.ts belong to the child:
// .duration-selector, .duration-header-row, .duration-section-header,
// .last-duration-badge and variants, .duration-pills, .pill and variants,
// .custom-duration-input, .duration-input and variants, .duration-help,
// .duration-preview, .schedule-link, .schedule-inputs, .datetime-field,
// .datetime-row, .datetime-row select, .datetime-row input[type="time"],
// .field-hint
// Plus corresponding @media (max-width: 480px) overrides
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic duration UI in main card | Extracted duration selector component | Phase 2 (this phase) | Reduces main card complexity, improves testability |
| Duration state scattered across methods | Centralized in child component | Phase 2 (this phase) | Clearer data flow via events |

**Deprecated/outdated:**
- None. Following established Phase 1 pattern.

## Open Questions

1. **Should the child compute duration pills from sensor attributes or receive them as a property?**
   - What we know: `_getDurationPills()` reads `hass.states['sensor.autosnooze_snoozed_automations'].attributes.duration_presets`.
   - What's unclear: Whether the child should have access to `hass` states or only receive computed props.
   - Recommendation: Pass `hass` to the child (needed for localization anyway) and let the child compute the pills. This is simpler than pre-computing in the parent.

2. **Should the last duration badge logic live in child or parent?**
   - What we know: `_renderLastDurationBadge()` compares last duration against presets to decide visibility.
   - What's unclear: Whether this is a presentation concern (child) or business logic (parent).
   - Recommendation: Move to the child. It's presentation logic -- showing/hiding a badge based on current UI state. The child has all data it needs (presets, last duration, current duration).

3. **Should `_showCustomInput` be internal state or a property?**
   - What we know: It only affects whether the custom input field is visible.
   - What's unclear: Whether the parent needs to know about this state.
   - Recommendation: Make it internal `@state()` in the child. The parent doesn't need to know. When a preset is clicked, the child sets `_showCustomInput = false` locally.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/components/autosnooze-card.ts` (1,232 lines) - full analysis of `_renderDurationSelector`, duration state fields, duration methods
- Codebase inspection: `src/styles/card.styles.ts` - identified CSS selectors for extraction
- Codebase inspection: `src/utils/duration.ts` - verified utility functions for duration parsing/formatting
- Codebase inspection: `src/utils/datetime.ts` - verified utility functions for date/time handling
- Codebase inspection: `.planning/phases/01-extract-active-pauses/01-RESEARCH.md` - established extraction pattern
- [Lit Component Composition docs](https://lit.dev/docs/composition/component-composition/) - properties down, events up pattern
- [Lit Reactive Properties docs](https://lit.dev/docs/components/properties/) - @property vs @state, attribute: false

### Secondary (MEDIUM confidence)
- Codebase inspection: `tests/test_card_ui.spec.js`, `tests/test_backend_schema.spec.js` - identified tests touching duration UI

### Tertiary (LOW confidence)
- None. All findings verified against codebase or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project dependencies (Lit 3.3.2), no new libraries
- Architecture: HIGH - Following established Phase 1 pattern (properties down/events up)
- Pitfalls: HIGH - Identified from Phase 1 experience and direct codebase analysis

**Research date:** 2026-01-31
**Valid until:** 2026-03-31 (Lit 3.x is stable; project dependencies are pinned)
