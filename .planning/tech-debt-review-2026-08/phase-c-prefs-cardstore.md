# Phase C: Preferences and CardStore

Back: [overview.md](overview.md)

## Goal

One ownership model for local prefs; selection/duration not mirrored through a dead store.

## Changes

- Prefer: delete unused `CardStore` APIs and dual write path; keep Lit `@state` as source of truth (smallest reader-load win).
- Lift hide-snoozed load/save behind `card-shell` or keep list-local but stop raw storage re-exports from automation-list feature (pick smallest compliant shape).
- Update `src/tests` mocks only; avoid root `tests/` unless required.

## Data structures

Preferences: `{ hideSnoozed: boolean }` loaded once at connect. Selection/duration: Lit state only.

## Verification

Vitest card + storage + automation-list specs. `npm run lint:deps`.
