# Phase B: Hide-snoozed badge counts

Back: [overview.md](overview.md)

## Goal

Tab badges match the visible filtered list when hide-snoozed is on.

## Changes

- `src/features/automation-list/index.ts` view model counts from filtered set.
- `src/components/autosnooze-automation-list.ts` All-tab badge uses filtered length.
- `src/tests/automation-list-feature-mutation.spec.ts` failing-then-green coverage.

## Data structures

`AutomationListViewModel` counts mean “visible under current filters,” not “raw registry totals.”

## Verification

`npx vitest run src/tests/automation-list-feature-mutation.spec.ts src/tests/automation-list-mutation.spec.ts`
Runtime: card list UI with hide-snoozed on (manual or e2e if available).
