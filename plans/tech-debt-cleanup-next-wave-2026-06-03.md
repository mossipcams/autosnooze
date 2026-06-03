# Tech Debt Cleanup Next Wave Plan - 2026-06-03

## Goal

Continue from the verified 5.1% frontend production reduction toward the requested 10-20% code reduction target, without losing behavior or UX.

## Current Evidence

- Production frontend paths audited: `src/components`, `src/features`, `src/styles`.
- Current production line count in those paths: `4,672`.
- Current diff in those paths: `439 insertions`, `690 deletions`, net `251` lines removed.
- Estimated baseline for those paths: `4,923`.
- Verified reduction so far: about `5.1%`.
- Generated bundle plus source changes: `595 insertions`, `911 deletions`, net `316` lines removed.
- Full verification is green:
  - `rtk npm run lint`
  - `rtk npm run typecheck`
  - `rtk npm run build`
  - `rtk npm test` passed: 58 files, 866 tests.
  - `rtk npm run lint:duplicates`
  - `rtk npm run lint:unused:prod`
  - `rtk npm run lint:deps`

## Task 9: Consolidate Repeated Button CSS

- Test to write:
  - Add targeted `src/tests/*style-reduction.spec.ts` guards that require shared selectors for repeated button primitives in `card.styles.ts`, `automation-list.styles.ts`, and `duration-selector.styles.ts`.
  - Keep guards narrow: shared focus, min-height, box-sizing, cursor, and border primitives only.
- Code to implement:
  - Merge repeated button declarations where selectors already share behavior.
  - Preserve distinct colors, hover transforms, spacing, and mobile-specific UX.
- Verification:
  - Run the new/updated style guard and expect it to fail first.
  - Run related component behavior tests: `tests/test_card_ui.spec.ts`, `tests/test_duration_selector.spec.ts`, and list tests.
  - Run `rtk npm run lint`.

## Task 10: Share Warning/Banner Styling

- Test to write:
  - Add a style reduction guard that verifies orange warning/banner styling is centralized instead of repeated between card health banners, registry warnings, and guardrail confirmation blocks where properties are identical.
- Code to implement:
  - Combine selectors for common warning border/background/color/radius declarations.
  - Preserve unique spacing, layout, and copy-specific font sizes.
- Verification:
  - Red/green style guard.
  - `rtk npm test -- tests/test_card_ui.spec.ts src/tests/automation-list-style-reduction.spec.ts src/tests/card-style-reduction.spec.ts`
  - `rtk npm run lint`

## Task 11: Collapse Card Modal Sync Branch Duplication

- Test to write:
  - Add a `src/tests/card-render-helper-reduction.spec.ts` or focused card reduction guard that captures the remaining duplicated resume-at sync logic in `AutomationPauseCard.updated()`.
- Code to implement:
  - Extract one small local/private helper for syncing modal resume time from paused data.
  - Keep group auto-close behavior and single-entity modal behavior exactly as tested.
- Verification:
  - Red/green guard.
  - `rtk npm test -- tests/test_active_pauses.spec.ts tests/test_card_ui.spec.ts`
  - `rtk npm run typecheck`

## Task 12: Recount And Decide If A Larger Structural Plan Is Needed

- Test to write:
  - No new test; this is an audit task.
- Code to implement:
  - Rebuild generated bundle.
  - Recount reduction against the frontend production baseline.
  - If still below 10%, save a larger structural plan before editing, likely targeting component/style extraction or broader scope beyond frontend-only files.
- Verification:
  - `rtk npm run lint`
  - `rtk npm run typecheck`
  - `rtk npm test`
  - `rtk npm run build`
  - `rtk npm run lint:duplicates`
  - `rtk npm run lint:unused:prod`
  - `rtk npm run lint:deps`
  - `rtk git diff --shortstat -- src/components src/features src/styles`
