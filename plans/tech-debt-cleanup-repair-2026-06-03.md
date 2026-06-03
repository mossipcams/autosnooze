# Tech Debt Cleanup Repair Plan - 2026-06-03

## Goal

Restore the behavior and compatibility surface that broad validation showed was lost during the cleanup, while keeping the accumulated line-reduction work intact where tests and typecheck allow it.

## Current Red Evidence

- `rtk npm run typecheck` fails with `TS7053` in `src/components/autosnooze-card.ts` because `_handleScheduleFieldChange` indexes the card with a plain string.
- `rtk npm test` fails 12 tests because removed private-but-tested compatibility helpers are still part of the project contract:
  - `_hapticFeedback`
  - `_getAutomationStateFingerprint`
  - `_getAreaCount`
  - `_getLabelCount`
  - `_getCategoryCount`

## Task 1: Make Schedule Field Updates Type-Safe

- Test to write: no new test file; use the existing failing `rtk npm run typecheck` result as the red test because this is a static type regression already covered by the compiler.
- Code to implement: replace the dynamic `this[stateKey] = value` assignment in `src/components/autosnooze-card.ts` with a typed update map or equivalent explicit assignment structure.
- Verification:
  - `rtk npm run typecheck`
  - targeted schedule-field tests if available through the existing card UI suite

## Task 2: Restore Compatibility Helpers Without Reintroducing Old Orchestration

- Test to write: no new test file; use the existing failing top-level tests as the red tests because `AGENTS.md` forbids modifying `tests/`, and these tests already define the compatibility contract.
- Code to implement:
  - Restore `_hapticFeedback` as a tiny delegating wrapper around `hapticFeedback`.
  - Restore `_getAutomationStateFingerprint` as a small helper that returns the automation-state fingerprint expected by `shouldUpdate` tests, without reinstating the removed cache fields.
  - Restore `_getAreaCount`, `_getLabelCount`, and `_getCategoryCount` in `src/components/autosnooze-automation-list.ts` as small derived-count helpers over the current automation model.
- Verification:
  - `rtk npm test -- tests/test_active_pauses.spec.ts tests/test_automation_categories.spec.ts tests/test_mutation_coverage.spec.ts tests/test_card_ui.spec.ts`
  - `rtk npm run typecheck`

## Task 3: Rebuild And Re-run Gates

- Test to write: no new test file; this is verification of the repaired cleanup.
- Code to implement: run the build so `custom_components/autosnooze/www/autosnooze-card.js` and its source map reflect source changes.
- Verification:
  - `rtk npm run lint`
  - `rtk npm run typecheck`
  - `rtk npm test`
  - `rtk npm run build`
  - `rtk npm run lint:duplicates`
  - `rtk git diff --shortstat -- src/components src/features src/styles`
