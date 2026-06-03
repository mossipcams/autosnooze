# Tech Debt Cleanup Structural Wave Plan - 2026-06-03

## Goal

Continue from the verified frontend cleanup toward the requested 10-20% code reduction target without losing functionality or sacrificing UX.

## Current Evidence

- Production frontend paths audited: `src/components`, `src/features`, `src/styles`.
- Current production line count in those paths: `4,674`.
- Current diff in those paths: `462 insertions`, `711 deletions`, net `249` lines removed.
- Estimated baseline for those paths: `4,923`.
- Verified production source reduction so far: about `5.1%`.
- Generated bundle plus source changes: `591 insertions`, `918 deletions`, net `327` lines removed.
- Largest remaining production files:
  - `src/components/autosnooze-card.ts`: `941` lines.
  - `src/styles/automation-list.styles.ts`: `510` lines.
  - `src/components/autosnooze-automation-list.ts`: `454` lines.
  - `src/styles/card.styles.ts`: `423` lines.
- Full verification is green:
  - `rtk npm run lint`
  - `rtk npm run typecheck`
  - `rtk npm run build`
  - `rtk npm test` passed: 58 files, 870 tests.
  - `rtk npm run lint:duplicates`
  - `rtk npm run lint:unused:prod`
  - `rtk npm run lint:deps`

## Task 13: Collapse Automation List Tab Rendering

- Test to write:
  - Add or extend a focused `src/tests/autosnooze-automation-list-reduction.spec.ts` guard that fails while the tab markup is manually repeated for `all`, `areas`, `labels`, and `categories`.
  - Assert the component uses one tab descriptor path and one tab render helper while preserving ARIA labels and counts.
- Code to implement:
  - Introduce a small tab descriptor array or helper in `AutoSnoozeAutomationList`.
  - Render all filter tabs from that shared descriptor path.
  - Keep existing tab order, labels, counts, active state, `aria-selected`, and `aria-controls`.
- Verification:
  - Run the new guard and show it fail before implementation.
  - Run `rtk npm test -- src/tests/autosnooze-automation-list-reduction.spec.ts tests/test_automation_categories.spec.ts tests/test_automation_list_feature.spec.ts tests/test_card_ui.spec.ts`.
  - Run `rtk npm run typecheck`.

## Task 14: Share Automation List Empty/Recent Rendering Paths

- Test to write:
  - Add a focused reduction guard that fails while selection-list empty state and recent grouping logic are duplicated inline.
  - Preserve behavior assertions for search results, recent ordering, grouped selection, and empty state copy.
- Code to implement:
  - Extract one `_renderEmptyList()` helper for list empty states.
  - Extract one small `_partitionRecentItems()` helper for recent-vs-other ordering in the `all` tab.
  - Keep the recent header, row class, keyboard behavior, and selection behavior unchanged.
- Verification:
  - Run the new guard and show it fail before implementation.
  - Run `rtk npm test -- src/tests/autosnooze-automation-list-reduction.spec.ts src/tests/recent-group-polish.spec.ts src/tests/recent-snoozes-ui.spec.ts tests/test_card_ui.spec.ts`.
  - Run `rtk npm run lint`.

## Task 15: Consolidate Common Card/List Surface CSS

- Test to write:
  - Add style reduction guards that fail while common surface primitives are repeated across card/list styles.
  - Focus only on identical primitives: border radius, divider border, focus outline, checkbox sizing, and small action button cursor/min-height/box-sizing.
- Code to implement:
  - Merge selectors inside existing style modules where declarations are identical.
  - Preserve unique colors, hover states, mobile refinements, spacing, and visual hierarchy.
  - Avoid introducing a new shared CSS module unless the net reduction is clearly better after accounting for imports.
- Verification:
  - Run the style guard and show it fail before implementation.
  - Run `rtk npm test -- src/tests/card-style-reduction.spec.ts src/tests/automation-list-style-reduction.spec.ts tests/test_card_ui.spec.ts tests/test_automation_categories.spec.ts`.
  - Run `rtk npm run lint`.

## Task 16: Recount And Gate

- Test to write:
  - No new test; this is the next audit checkpoint.
- Code to implement:
  - Rebuild generated bundle.
  - Recount production frontend source reduction against the current baseline estimate.
  - If still below 10%, decide whether the next reduction wave should include backend Python/source files or a larger architectural extraction.
- Verification:
  - `rtk npm run lint`
  - `rtk npm run typecheck`
  - `rtk npm run build`
  - `rtk npm test`
  - `rtk npm run lint:duplicates`
  - `rtk npm run lint:unused:prod`
  - `rtk npm run lint:deps`
  - `rtk git diff --shortstat -- src/components src/features src/styles custom_components/autosnooze/www/autosnooze-card.js`
