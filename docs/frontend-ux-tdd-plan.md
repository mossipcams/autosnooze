# Frontend UX Implementation Plan (TDD Start)

## Scope
- Sticky action bar for primary snooze action
- Stable list ordering while selecting (no jump-to-top reorder)
- Better schedule defaults and inline timeline summary
- Localized guardrail confirmation UI (replace hardcoded browser confirm)

## Delivery Strategy
1. Ship in small vertical slices.
2. For each slice: write failing UI tests first, implement minimum code, refactor styles/semantics, then verify.
3. Keep behavior behind existing component boundaries (`autosnooze-card`, `autosnooze-automation-list`, `autosnooze-duration-selector`).

## Slice 1 (Start Here): Stable List Ordering + Sticky Action Bar

### Red: tests to add first
- File: `tests/test_card_ui.spec.ts`
- Add test: selecting an item does not reorder visible list rows in `autosnooze-automation-list`.
- Add test: primary snooze action remains visible while list scrolls (assert sticky class/style and rendered action container presence).
- Add test: selection count in sticky action area updates live when selecting and clearing.

### Green: minimum implementation
- File: `src/components/autosnooze-automation-list.ts`
- Remove selected-first sorting from `_getFilteredAutomations()`.
- Preserve deterministic order from `filterAutomations(...)`.
- File: `src/components/autosnooze-card.ts`
- Move/duplicate action controls into a dedicated sticky action container after selector/list region.
- Keep existing disabled/aria logic for snooze button unchanged.
- File: `src/styles/card.styles.ts`
- Add sticky action bar styles (`position: sticky; bottom: 0;`) with card background and safe area inset.

### Refactor/Polish
- Ensure no duplicated action semantics in DOM.
- Keep tab order consistent: list -> duration/schedule controls -> sticky CTA.
- Maintain mobile/desktop layout parity.

### Verify
- Run: `npm test -- tests/test_card_ui.spec.ts`
- Run: `npm run build`

## Slice 2: Schedule Defaults + Timeline Summary

### Red
- Add test: entering schedule mode sets `disableAt=now` and `resumeAt=now+lastDuration` (fallback to default duration).
- Add test: timeline summary renders localized sentence when fields are valid.
- Add test: summary shows validation state when `disableAt >= resumeAt`.

### Green
- File: `src/components/autosnooze-card.ts`
- Update `_handleScheduleModeChange(...)` to compute `resumeAt` from last duration/default.
- File: `src/components/autosnooze-duration-selector.ts`
- Render computed timeline summary line under datetime fields.
- File: `src/localization/translations/en.json`
- Add keys for summary/validation text.

### Verify
- Run targeted tests and build.

## Slice 3: Localized Guardrail Confirmation

### Red
- Add test: `confirm_required` path opens in-card confirmation UI.
- Add test: cancel does not call snooze with `confirm=true`.
- Add test: confirm retries request with `confirm=true`.

### Green
- File: `src/components/autosnooze-card.ts`
- Replace `window.confirm(...)` path with component state + confirm UI action.
- File: `src/localization/translations/en.json`
- Add guardrail confirm title/body/actions.

### Verify
- Run targeted tests and build.

## Definition of Done
- All new tests pass.
- Existing `tests/test_card_ui.spec.ts` coverage remains green.
- No accessibility regressions for keyboard/focus/aria labels.
- Mobile layout verified for list scroll + sticky action visibility.
