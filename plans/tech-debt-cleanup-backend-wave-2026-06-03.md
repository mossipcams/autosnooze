# Tech Debt Cleanup Backend Wave Plan - 2026-06-03

## Goal

Continue toward the requested 10-20% code reduction target without losing functionality or sacrificing UX.

## Current Evidence

- Frontend source plus generated bundle gate is green, but the requested reduction target is not met.
- Current frontend production source diff: `538 insertions`, `776 deletions`, net `238` lines removed.
- Current frontend source line count: `4,685`; estimated baseline: `4,923`; verified frontend source reduction: about `4.8%`.
- Current source plus generated bundle diff: `696 insertions`, `1,052 deletions`, net `356` lines removed.
- Full verification is green:
  - `rtk npm run lint`
  - `rtk npm run typecheck`
  - `rtk npm run build`
  - `rtk npm test` passed: 58 files, 873 tests.
  - `rtk npm run lint:duplicates`
  - `rtk npm run lint:unused:prod`
  - `rtk npm run lint:deps`
- Backend code has a larger cleanup seam:
  - `custom_components/autosnooze/coordinator.py` is `546` lines.
  - Newer delegated modules exist under `custom_components/autosnooze/runtime/` and `custom_components/autosnooze/application/`.
  - `coordinator.py` already delegates restore/timer/storage helpers to those modules through thin wrappers.
  - Imports from `coordinator.py` are still part of the public/test compatibility surface, so reductions must preserve exported names.

## Task 17: Collapse Coordinator Timer And Restore Wrappers To Direct Aliases

- Test to write:
  - Add a source-level reduction guard under `src/tests/backend-coordinator-reduction.spec.ts`.
  - The guard should fail while `coordinator.py` keeps wrapper function bodies for `cancel_timer`, `cancel_scheduled_timer`, `schedule_disable`, `async_save`, `validate_stored_entry`, `validate_stored_data`, and `async_load_stored`.
  - The guard should also assert the exported names remain present in `coordinator.py`.
- Code to implement:
  - Replace wrapper function bodies with direct import aliases where behavior is already delegated.
  - Preserve `schedule_resume` as a wrapper if needed because it injects Home Assistant's `async_track_point_in_time` for existing monkeypatch/test compatibility.
  - Preserve public names imported by `services.py`, `__init__.py`, and existing backend tests.
- Verification:
  - Run the new guard and show it fail before implementation.
  - Run `rtk npm test -- src/tests/backend-coordinator-reduction.spec.ts`.
  - Run backend-focused pytest: `rtk pytest tests/test_coordinator.py tests/test_persistence_robustness.py tests/test_startup_recovery.py`.
  - Run `rtk pyright custom_components tests`.

## Task 18: Collapse Coordinator Scheduled Cancel Duplication

- Test to write:
  - Extend `src/tests/backend-coordinator-reduction.spec.ts` with a guard that fails while single and batch scheduled-cancel paths duplicate timer cancellation, scheduled-pop, save, notify, and logging setup.
  - Keep this source guard narrow: it should prove a shared helper is used without changing service behavior assertions.
- Code to implement:
  - Extract a small helper for removing scheduled snoozes under the lock.
  - Reuse it from `async_cancel_scheduled` and `async_cancel_scheduled_batch`.
  - Preserve save failure behavior, listener notifications, and command logging.
- Verification:
  - Red/green source guard.
  - `rtk pytest tests/test_coordinator.py tests/test_services_coverage.py`.
  - `rtk pyright custom_components tests`.

## Task 19: Collapse Coordinator Adjust Snooze Mutation Duplication

- Test to write:
  - Extend `src/tests/backend-coordinator-reduction.spec.ts` with a guard that fails while `async_adjust_snooze` and `async_adjust_snooze_batch` each directly zero `days`, `hours`, and `minutes`.
  - Preserve existing behavior coverage from coordinator tests.
- Code to implement:
  - Extract one helper that applies the adjusted resume time and clears stale duration fields.
  - Reuse it from single and batch adjust paths.
  - Keep validation, atomic batch behavior, timer rescheduling, save behavior, notifications, and logging unchanged.
- Verification:
  - Red/green source guard.
  - `rtk pytest tests/test_coordinator.py -k adjust`.
  - `rtk pytest tests/test_coordinator.py tests/test_services_coverage.py`.
  - `rtk pyright custom_components tests`.

## Task 20: Recount Full Production Code And Gate

- Test to write:
  - No new test; this is an audit checkpoint.
- Code to implement:
  - Rebuild generated frontend bundle if frontend files changed.
  - Recount production code across `custom_components/autosnooze`, `src/components`, `src/features`, and `src/styles`.
  - If still below 10%, save the next plan before further edits, likely targeting `services.py` filter/service-handler duplication or `coordinator.py` resume batch helpers.
- Verification:
  - `rtk npm run lint`
  - `rtk npm run typecheck`
  - `rtk npm run build`
  - `rtk npm test`
  - `rtk npm run lint:duplicates`
  - `rtk npm run lint:unused:prod`
  - `rtk npm run lint:deps`
  - `rtk pytest`
  - `rtk pyright custom_components tests`
  - `rtk git diff --shortstat -- custom_components/autosnooze src/components src/features src/styles custom_components/autosnooze/www/autosnooze-card.js`

## Task 20 Status: Complete (2026-06-03)

- Scoped production reduction: **4.1%** (`9,712` → `9,312` lines); frontend TS **4.8%**; backend Python **1.8%**.
- Below 10% target — follow-up plan: `plans/tech-debt-cleanup-followup-wave-2026-06-03.md` (Tasks 21-23).
