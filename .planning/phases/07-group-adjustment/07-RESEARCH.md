# Phase 7: Group Adjustment - Research

**Researched:** 2026-02-01
**Domain:** Lit web component extension, multi-entity adjust modal, event-driven parent-child communication
**Confidence:** HIGH

## Summary

Phase 7 extends the existing adjust modal (created in Phase 6) to support group-level adjustment. When a user taps a group header in the active pauses section, the adjust modal opens in "group mode" showing the count of automations being adjusted. Increment/decrement buttons apply the same time delta to all automations in that group via the existing backend `autosnooze.adjust` service, which already supports multiple entity_ids by looping through them.

The implementation touches three components (active-pauses, adjust-modal, parent card) with well-bounded changes: a new event from active-pauses, new properties on the modal for group mode, and updated event handling on the parent card. No new components or backend changes are needed.

**Primary recommendation:** Extend the existing modal with an optional `entityIds` array property (group mode) while keeping the existing single-entity `entityId` property for backward compatibility. The modal switches display and behavior based on which property is populated.

## Standard Stack

No new libraries needed. This phase uses only existing project infrastructure.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Lit | 3.x | Web component framework | Already in use for all components |
| Vitest | existing | Test framework | Already configured with jsdom |

### Supporting
No new supporting libraries required.

## Architecture Patterns

### Component Communication Flow (Group Adjust)

```
User taps group header
       |
       v
[autosnooze-active-pauses]
  fires 'adjust-group' event with:
    { entityIds: string[], resumeAt: string, groupLabel: string }
       |
       v
[autosnooze-card] (parent)
  _handleAdjustGroupEvent() sets:
    _adjustModalOpen = true
    _adjustModalEntityIds = [...entityIds]  (NEW state)
    _adjustModalFriendlyName = groupLabel   (reuse existing)
    _adjustModalResumeAt = resumeAt         (reuse existing)
       |
       v
[autosnooze-adjust-modal]
  receives entityIds array (NEW property)
  renders group indicator (e.g., "3 automations")
  _isDecrementDisabled checks MIN across all automations (NEW logic)
  fires 'adjust-time' with { entityIds: string[], ...params }
       |
       v
[autosnooze-card] (parent)
  _handleAdjustTimeEvent() loops adjustSnooze for each entity
  OR calls adjustSnooze once passing all entity_ids (backend loops)
```

### Key Design Decision: Single Event vs. Separate Group Event

**Recommendation: Separate `adjust-group` event from active-pauses.**

Rationale:
- The existing `adjust-automation` event fires from individual paused-item rows with `{ entityId, friendlyName, resumeAt }` (single entity).
- The group header needs to fire with `{ entityIds: string[], resumeAt, groupLabel }` (multiple entities).
- Using a separate event name makes the parent handler cleaner and avoids overloading the single-entity event.
- The parent card already distinguishes between `_handleAdjustAutomationEvent` and the new `_handleAdjustGroupEvent`.

### Key Design Decision: Modal Property Shape for Group Mode

**Recommendation: Add `entityIds: string[]` property alongside existing `entityId: string`.**

The modal detects group mode via: `this.entityIds.length > 1` (or `this.entityIds.length > 0` if `entityId` is cleared).

Pattern:
- `entityIds = []` and `entityId = 'automation.foo'` => single mode (backward compatible)
- `entityIds = ['automation.a', 'automation.b']` and `entityId = ''` => group mode

The `adjust-time` event detail changes shape based on mode:
- Single: `{ entityId: 'automation.foo', minutes: 15 }` (unchanged)
- Group: `{ entityIds: ['automation.a', 'automation.b'], minutes: 15 }`

### Key Design Decision: Decrement Disable Logic for Groups

**Requirement:** "The minimum-time guard applies per-automation (if any single automation would drop below 1 minute, that decrement button is disabled)"

Current single-entity logic in `_isDecrementDisabled`:
```typescript
_isDecrementDisabled(thresholdMs: number): boolean {
  if (!this.resumeAt) return true;
  const remainingMs = new Date(this.resumeAt).getTime() - Date.now();
  return (remainingMs - thresholdMs) < MIN_REMAINING_MS;
}
```

For groups, ALL automations share the same `resumeAt` (they are grouped by resume time), so the existing single-resumeAt check is sufficient. The `PauseGroup` type groups automations by identical `resumeAt`, meaning every automation in the group has the same remaining time. No per-entity minimum calculation is needed beyond what already exists.

**Confidence: HIGH** - Verified by reading `getPausedGroupedByResumeTime()` in `src/state/paused.ts` which groups by exact `resumeAt` match.

### Key Design Decision: Backend Service Call Pattern

The backend `handle_adjust` (in `services.py` line 272-288) already loops through multiple `entity_ids`:

```python
async def handle_adjust(call: ServiceCall) -> None:
    entity_ids = call.data[ATTR_ENTITY_ID]
    # ...
    for entity_id in entity_ids:
        await async_adjust_snooze(hass, data, entity_id, delta)
```

And the `ADJUST_SCHEMA` uses `cv.entity_ids` (plural), accepting arrays.

**Recommendation:** The frontend `adjustSnooze` service wrapper currently accepts a single `entityId: string`. Either:
1. Change its signature to accept `string | string[]` (preferred, matches `wakeAutomation` pattern).
2. Loop on the frontend side calling `adjustSnooze` once per entity.

Option 1 is cleaner and matches the existing pattern in `wakeAutomation` which already accepts `string | string[]`.

### Recommended File Changes

```
src/components/autosnooze-active-pauses.ts  # Add group header click + adjust-group event
src/components/autosnooze-adjust-modal.ts   # Add entityIds property, group mode rendering
src/components/autosnooze-card.ts           # Add _adjustModalEntityIds state, group event handler
src/services/snooze.ts                      # Update adjustSnooze signature to accept string[]
src/styles/active-pauses.styles.ts          # Add cursor/hover for group headers
src/localization/translations/en.json       # Add group adjust translation keys
src/localization/translations/es.json       # Add group adjust translation keys
src/localization/translations/fr.json       # Add group adjust translation keys
src/localization/translations/de.json       # Add group adjust translation keys
src/localization/translations/it.json       # Add group adjust translation keys
tests/test_adjust_modal.spec.js             # Add group mode tests
tests/test_active_pauses.spec.ts            # Add group header click tests
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-entity service call | Custom batch loop | Backend `autosnooze.adjust` with array `entity_id` | Backend already loops and handles errors per-entity |
| Group detection in modal | Custom group detection logic | `entityIds.length > 0` check on new property | Simple boolean toggle based on array length |
| Min-remaining-time for groups | Per-entity minimum scan | Existing `_isDecrementDisabled` with single `resumeAt` | Groups share identical `resumeAt` by definition |

**Key insight:** Because `PauseGroup` groups automations by identical `resumeAt`, the decrement disable logic does not need to change at all. A group's `resumeAt` IS the minimum (and maximum) remaining time for all members.

## Common Pitfalls

### Pitfall 1: Forgetting to Update resumeAt for ALL Group Members After Adjust
**What goes wrong:** After the user adjusts a group, the optimistic UI update in the parent card only updates `_adjustModalResumeAt` for display, but the actual sensor data updates asynchronously via hass state change. If the modal stays open, it should reflect the new time.
**Why it happens:** The parent card currently does optimistic update for single entity (line 550-555 of card.ts). This same pattern works for groups since they share a single resumeAt.
**How to avoid:** The optimistic update in `_handleAdjustTimeEvent` already computes `new Date(currentResumeAt + deltaMs).toISOString()` and sets `_adjustModalResumeAt`. This works unchanged for group mode because the resumeAt is the same for all entities in the group.
**Warning signs:** Countdown in modal not updating after button press.

### Pitfall 2: Modal Not Closing When One Group Member Gets Woken Externally
**What goes wrong:** If another user or automation wakes one member of the group while the modal is open, the modal should remain open (other members are still paused) OR close if ALL members are woken.
**Why it happens:** The current `updated()` logic in the parent card checks if `pausedData` is missing for `_adjustModalEntityId` and closes. For group mode, you need to check if ANY entity in `_adjustModalEntityIds` is still paused.
**How to avoid:** In the parent card `updated()` method, add group-aware closure logic: close modal only when ALL entities in `_adjustModalEntityIds` are no longer paused.
**Warning signs:** Modal closing unexpectedly when only some group members are woken.

### Pitfall 3: Event Propagation from Group Header Click
**What goes wrong:** The group header is a parent of the individual paused-item rows. If the click handler isn't carefully placed, clicking on the group header might also trigger individual item events.
**Why it happens:** Looking at the template structure, `.pause-group-header` is a sibling of the `.paused-item` divs (both children of `.pause-group`), NOT a parent. So event propagation is not an issue.
**How to avoid:** The group header div (`div.pause-group-header`) is a separate sibling element from the automation item divs. Just add `@click` handler directly on the header div.
**Warning signs:** Multiple events firing on a single click.

### Pitfall 4: Stale Group After Adjustment
**What goes wrong:** After adjusting a group, the automations in that group may no longer share the same `resumeAt` if the backend processes them non-atomically (e.g., one fails). The group could split.
**Why it happens:** The backend `handle_adjust` loops sequentially and each `async_adjust_snooze` call individually updates the paused entry. If one raises `ServiceValidationError`, subsequent ones may or may not process.
**How to avoid:** The backend already handles this (errors are raised, which stops processing). After a successful adjustment, the hass state update triggers a re-render that will regroup by the new `resumeAt`. The modal can close on error or stay open. Keep it simple: on error, show toast and close modal.
**Warning signs:** After adjustment, some automations appear in a different group.

### Pitfall 5: jsdom Lit Event Limitation in Tests
**What goes wrong:** Tests cannot use `@event` template syntax to capture events across shadow DOM boundaries in jsdom.
**Why it happens:** Known jsdom limitation documented in Phase 1 and Phase 6 decisions.
**How to avoid:** Use `element.addEventListener('event-name', handler)` directly in tests, or call the internal `_fireAdjustGroup` method directly. Follow the pattern established in `test_adjust_modal.spec.js`.
**Warning signs:** Tests not receiving events.

## Code Examples

### 1. Group Header Click Handler in Active Pauses

```typescript
// In autosnooze-active-pauses.ts

_fireAdjustGroup(group: PauseGroup): void {
  this.dispatchEvent(new CustomEvent('adjust-group', {
    detail: {
      entityIds: group.automations.map(a => a.entity_id),
      friendlyNames: group.automations.map(a => a.friendly_name || a.entity_id),
      resumeAt: group.resumeAt,
    },
    bubbles: true,
    composed: true,
  }));
}
```

Template update in render():
```typescript
<div class="pause-group-header" @click=${() => this._fireAdjustGroup(group)}>
  <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
  ${group.disableAt
    ? html`${localize(this.hass, 'status.resumes')} ${formatDateTime(group.resumeAt, locale)}`
    : html`<span class="countdown">${formatCountdown(group.resumeAt)}</span>`}
</div>
```

### 2. Modal Group Mode Properties

```typescript
// In autosnooze-adjust-modal.ts

@property({ attribute: false })
entityIds: string[] = [];

@property({ attribute: false })
friendlyNames: string[] = [];

get _isGroupMode(): boolean {
  return this.entityIds.length > 1;
}
```

### 3. Modal Group Title Rendering

```typescript
// In the render() method of adjust-modal
<div class="modal-header">
  <span class="modal-title">
    ${this._isGroupMode
      ? localize(this.hass, 'adjust.group_title', { count: this.entityIds.length })
      : (this.friendlyName || this.entityId)}
  </span>
  <button class="modal-close" @click=${this._close}
    aria-label="${localize(this.hass, 'a11y.close_adjust_modal')}">
    <ha-icon icon="mdi:close"></ha-icon>
  </button>
</div>
```

### 4. Modal Group Mode Event Firing

```typescript
// In adjust-modal, the _fireAdjustTime method changes to:
_fireAdjustTime(params: { days?: number; hours?: number; minutes?: number }): void {
  if (this._isGroupMode) {
    this.dispatchEvent(new CustomEvent('adjust-time', {
      detail: { entityIds: this.entityIds, ...params },
      bubbles: true,
      composed: true,
    }));
  } else {
    this.dispatchEvent(new CustomEvent('adjust-time', {
      detail: { entityId: this.entityId, ...params },
      bubbles: true,
      composed: true,
    }));
  }
}
```

### 5. Parent Card Group Event Handler

```typescript
// In autosnooze-card.ts

@state() private _adjustModalEntityIds: string[] = [];
@state() private _adjustModalFriendlyNames: string[] = [];

private _handleAdjustGroupEvent(
  e: CustomEvent<{ entityIds: string[]; friendlyNames: string[]; resumeAt: string }>
): void {
  this._adjustModalOpen = true;
  this._adjustModalEntityIds = e.detail.entityIds;
  this._adjustModalFriendlyNames = e.detail.friendlyNames;
  this._adjustModalEntityId = '';  // Clear single mode
  this._adjustModalFriendlyName = '';
  this._adjustModalResumeAt = e.detail.resumeAt;
}
```

### 6. Updated adjustSnooze Service Wrapper

```typescript
// In src/services/snooze.ts
export async function adjustSnooze(
  hass: HomeAssistant,
  entityId: string | string[],
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

### 7. Parent Card _handleAdjustTimeEvent Update

```typescript
// Updated to handle both single and group modes
private async _handleAdjustTimeEvent(
  e: CustomEvent<{ entityId?: string; entityIds?: string[]; days?: number; hours?: number; minutes?: number }>
): Promise<void> {
  if (!this.hass) return;
  const { entityId, entityIds, ...params } = e.detail;
  const target = entityIds || entityId || '';
  try {
    await adjustSnooze(this.hass, target, params);
    this._hapticFeedback('success');

    // Optimistic UI update for countdown
    const deltaMs =
      ((params.days || 0) * 86400000) +
      ((params.hours || 0) * 3600000) +
      ((params.minutes || 0) * 60000);
    const currentResumeAt = new Date(this._adjustModalResumeAt).getTime();
    this._adjustModalResumeAt = new Date(currentResumeAt + deltaMs).toISOString();

    if (this.isConnected && this.shadowRoot) {
      this._showToast(localize(this.hass, 'toast.success.adjusted'));
    }
  } catch (e) {
    console.error('Adjust failed:', e);
    this._hapticFeedback('failure');
    if (this.isConnected && this.shadowRoot) {
      this._showToast(getErrorMessage(e as Error, localize(this.hass, 'toast.error.adjust_failed')));
    }
  }
}
```

### 8. Parent Card updated() - Group-Aware Modal Closure

```typescript
// In updated(), replace existing adjust-modal entity check:
if (changedProps.has('hass') && this._adjustModalOpen) {
  const paused = this._getPaused();

  if (this._adjustModalEntityIds.length > 0) {
    // Group mode: check if ANY entity is still paused
    const anyStillPaused = this._adjustModalEntityIds.some(id => paused[id]);
    if (!anyStillPaused) {
      this._handleCloseModalEvent();
    }
    // Update resumeAt from first still-paused entity (they share the same resumeAt)
    const firstPaused = this._adjustModalEntityIds.find(id => paused[id]);
    if (firstPaused) {
      const pausedData = paused[firstPaused] as { resume_at?: string } | undefined;
      if (pausedData?.resume_at && pausedData.resume_at !== this._adjustModalResumeAt) {
        this._adjustModalResumeAt = pausedData.resume_at;
      }
    }
  } else if (this._adjustModalEntityId) {
    // Single mode: existing logic
    const pausedData = paused[this._adjustModalEntityId] as { resume_at?: string } | undefined;
    if (pausedData?.resume_at && pausedData.resume_at !== this._adjustModalResumeAt) {
      this._adjustModalResumeAt = pausedData.resume_at;
    }
    if (!pausedData) {
      this._handleCloseModalEvent();
    }
  }
}
```

### 9. Group Header Styles

```css
/* Add to active-pauses.styles.ts */
.pause-group-header {
  cursor: pointer;
}
.pause-group-header:hover {
  background: var(--secondary-background-color, rgba(0, 0, 0, 0.03));
}
```

### 10. Translation Keys

```json
{
  "adjust": {
    "remaining": "Time remaining",
    "add_time": "Add time",
    "reduce_time": "Reduce time",
    "group_title": "Adjust {count} automations",
    "group_subtitle": "All automations in this group"
  },
  "a11y": {
    "adjust_group": "Adjust snooze time for {count} automations in this group"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-entity adjust only | Group + single adjust | Phase 7 (now) | Users can bulk-adjust via group headers |

**No deprecated patterns** -- this is a net-new feature extension.

## Open Questions

### 1. Group header visual affordance
- **What we know:** The group header currently shows a timer icon + countdown/datetime. Adding click handling is sufficient.
- **What's unclear:** Should there be an explicit visual indicator (like a "tap to adjust" hint, or an edit icon) on the group header to signal it's tappable?
- **Recommendation:** Add `cursor: pointer` and subtle hover effect. No additional icon needed -- the same pattern used for individual paused-item rows (which are also tappable without an explicit indicator). The mobile `:active` pseudo-class provides feedback on touch.

### 2. Group label display in modal
- **What we know:** Groups are formed by `resumeAt` time, not by area/label. The "group" concept in active pauses is purely time-based.
- **What's unclear:** What should the modal title show? Options: (a) "Adjust 3 automations", (b) list all names, (c) the shared countdown time.
- **Recommendation:** Option (a) with the count, plus optionally showing the list of friendly names in the modal body. Keep it simple for v1 -- just the count in the title.

### 3. Should the modal show individual automation names?
- **What we know:** The modal body currently shows "Time remaining" + countdown + buttons. For group mode, it could additionally list the automation names.
- **What's unclear:** Whether a name list is valuable enough to justify the UI complexity.
- **Recommendation:** Show a compact list of names (comma-separated or bulleted) below the title in group mode. This helps the user confirm they're adjusting the right set. The `friendlyNames` array is already available from the event detail.

## Sources

### Primary (HIGH confidence)
- Direct codebase reading of all relevant source files
- `src/components/autosnooze-active-pauses.ts` - Group header template, PauseGroup rendering
- `src/components/autosnooze-adjust-modal.ts` - Current modal structure, decrement logic
- `src/components/autosnooze-card.ts` - Parent event handling, state management
- `src/types/automation.ts` - PauseGroup interface definition
- `src/services/snooze.ts` - adjustSnooze service wrapper signature
- `src/state/paused.ts` - getPausedGroupedByResumeTime grouping logic
- `custom_components/autosnooze/services.py` - handle_adjust backend (line 272-288)
- `custom_components/autosnooze/const.py` - ADJUST_SCHEMA (cv.entity_ids, accepts arrays)
- `custom_components/autosnooze/coordinator.py` - async_adjust_snooze implementation

### Secondary (MEDIUM confidence)
- Previous phase patterns (Phase 6 PLAN and implementation) for modal and event patterns
- Existing test patterns in `tests/test_adjust_modal.spec.js` and `tests/test_active_pauses.spec.ts`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, pure extension of existing code
- Architecture: HIGH - All patterns verified by reading actual source code
- Pitfalls: HIGH - Based on actual code structure and prior phase decisions
- Decrement logic: HIGH - Verified that PauseGroup groups by identical resumeAt (state/paused.ts line 35)
- Backend compatibility: HIGH - Verified ADJUST_SCHEMA uses cv.entity_ids and handle_adjust loops

**Research date:** 2026-02-01
**Valid until:** 2026-03-01 (stable codebase, internal project)
