# Tech Debt Cleanup Next Reduction Plan - 2026-06-03

## Goal

Continue reducing production frontend code toward the requested 10-20% target without losing behavior, compatibility, accessibility, or UX polish.

## Current Evidence

- Current production reduction in `src/components`, `src/features`, and `src/styles`: `361 insertions`, `573 deletions`, net `212` lines removed.
- Current frontend production line count in those paths: `4,711`.
- Estimated pre-cleanup baseline for those paths: `4,923`.
- Proven reduction so far: about `4.3%`.
- Validation after the repair pass:
  - `rtk npm run lint` passed.
  - `rtk npm run typecheck` passed.
  - `rtk npm test` passed: 58 files, 862 tests.
  - `rtk npm run build` passed.
  - `rtk npm run lint:duplicates` passed with 0 clones.
  - `rtk npm run lint:unused:prod` passed.
  - `rtk npm run lint:deps` passed.

## Task 4: Collapse Automation List Item Rendering

- Test to write:
  - Add or extend a `src/tests` reduction spec that asserts `autosnooze-automation-list.ts` no longer contains two separate `class="list-item` rendering blocks.
  - Keep existing top-level behavior tests untouched.
- Code to implement:
  - Extract a small local render helper or local lambda for automation rows inside `AutoSnoozeAutomationList`.
  - Reuse it for the flat list and grouped list branches.
  - Preserve checkbox behavior, selection events, recent styling, roles, labels, and ordering.
- Verification:
  - Run the new/updated reduction spec and expect it to fail first.
  - Run `rtk npm test -- src/tests/autosnooze-automation-list-reduction.spec.ts tests/test_card_ui.spec.ts tests/test_boundary_mutations.spec.ts tests/test_mutation_coverage.spec.ts`.
  - Run `rtk npm run typecheck`.

## Task 5: Consolidate Duration Selector Schedule Field Rendering

- Test to write:
  - Add or extend a `src/tests` reduction spec that asserts schedule date/time field markup is generated from shared field metadata rather than duplicated `datetime-field` markup.
  - Add a behavior assertion if needed for both `disableAt*` and `resumeAt*` events.
- Code to implement:
  - Replace the two repeated schedule datetime blocks in `AutoSnoozeDurationSelector.render()` with a shared field descriptor array and a mapped template.
  - Preserve labels, hints, date options, input types, events, and schedule summary behavior.
- Verification:
  - Run the new/updated reduction spec and expect it to fail first.
  - Run `rtk npm test -- src/tests/duration-selector-reduction.spec.ts tests/test_duration_selector.spec.ts tests/test_card_ui.spec.ts tests/test_backend_schema.spec.ts`.
  - Run `rtk npm run typecheck`.

## Task 6: Simplify Automation List View-Model Grouping

- Test to write:
  - Add or extend a `src/tests` reduction spec that guards against maintaining two independent grouping implementations in `src/features/automation-list/index.ts`.
  - Existing top-level feature tests stay as the behavior contract for `groupAutomationsBy`.
- Code to implement:
  - Reuse the public `groupAutomationsBy` implementation inside the view-model path, or factor both current grouping paths through one small shared function.
  - Preserve default-group-last sorting, labels with multiple groups, include/exclude label filtering, and counts.
- Verification:
  - Run the new/updated reduction spec and expect it to fail first.
  - Run `rtk npm test -- tests/test_automation_list_feature.spec.ts src/tests/autosnooze-automation-list.spec.ts tests/test_card_ui.spec.ts tests/test_mutation_coverage.spec.ts tests/test_boundary_mutations.spec.ts`.
  - Run `rtk npm run typecheck`.

## Task 7: Consolidate Style Repetition Safely

- Test to write:
  - Add or extend targeted `src/tests/*style-reduction.spec.ts` assertions for the specific style repetition removed.
  - Choose only selectors with existing behavior or visual-equivalence coverage, such as repeated active/list item structures or repeated mobile button state rules.
- Code to implement:
  - Consolidate repeated CSS blocks in the largest remaining style files, starting with `active-pauses.styles.ts`, `adjust-modal.styles.ts`, and `duration-selector.styles.ts`.
  - Preserve responsive behavior, focus states, hover states, mobile sizing, and accessible contrast.
- Verification:
  - Run the new/updated style reduction specs and expect them to fail first.
  - Run `rtk npm test -- src/tests/*style-reduction.spec.ts tests/test_active_pauses.spec.ts tests/test_adjust_modal.spec.ts tests/test_duration_selector.spec.ts tests/test_card_ui.spec.ts`.
  - Run `rtk npm run lint`.

## Task 8: Rebuild, Recount, And Completion Audit

- Test to write:
  - No new test; this is a verification task.
- Code to implement:
  - Run the build to refresh `custom_components/autosnooze/www/autosnooze-card.js` and source map.
  - Recount production line reduction and compare against the 10-20% target.
- Verification:
  - `rtk npm run lint`
  - `rtk npm run typecheck`
  - `rtk npm test`
  - `rtk npm run build`
  - `rtk npm run lint:duplicates`
  - `rtk npm run lint:unused:prod`
  - `rtk npm run lint:deps`
  - `rtk git diff --shortstat -- src/components src/features src/styles`
