# Tech Debt Cleanup Followup Wave Plan - 2026-06-03

## Goal

Close the gap to the requested 10-20% production code reduction without losing behavior, compatibility, or UX.

## Audit Checkpoint (Task 20 Complete)

- Rebuilt bundle: `rtk npm run build` (rollup refreshed `autosnooze-card.js` + source map).
- Production scope: `custom_components/autosnooze` (Python), `src/components`, `src/features`, `src/styles` (TypeScript), and `custom_components/autosnooze/www/autosnooze-card.js`.
- Line counts vs merge-base `7a2d311`:
  - Baseline: Python `2,411`, TypeScript `4,923`, bundle `2,378`, total `9,712`.
  - Current: Python `2,367`, TypeScript `4,685`, bundle `2,260`, total `9,312`.
  - Net removed: `400` lines (**4.1%** of scoped production code).
  - Frontend TypeScript alone: `4,923` → `4,685` (**4.8%**).
  - Backend Python alone: `2,411` → `2,367` (**1.8%**); `coordinator.py` now `502` lines (was `546` at wave start).
- Diff shortstat (scoped paths): `18 files changed, 728 insertions(+), 1128 deletions(-)` (net `-400`).
- Target status: **below 10%** — continue with backend-heavy seams before more frontend churn.
- Full gate (2026-06-03):
  - `rtk npm run lint` — pass
  - `rtk npm run typecheck` — pass
  - `rtk npm run build` — pass
  - `rtk npm test` — pass: 59 files, 876 tests
  - `rtk npm run lint:duplicates` — 0 clones
  - `rtk npm run lint:unused:prod` — pass
  - `rtk npm run lint:deps` — pass
  - `.venv/bin/pytest tests/` — pass: 470 tests
  - `.venv/bin/pyright custom_components tests` — 0 errors
- Gate repair: `TestAsyncSave` patches now target `infrastructure.storage.asyncio.sleep` after Task 17 delegated `async_save` (stale `coordinator.asyncio` monkeypatch).

## Task 21: Collapse Coordinator Resume Retry Mutation Duplication — Complete

- `_handle_wake_failure` extracted; reduction guard green; resume pytest green.

## Task 22: Thin `services.py` Registration Boilerplate — Complete

- Table-driven `_DIRECT_SERVICE_HANDLERS` / `_FILTER_PAUSE_SERVICES`; `services.py` 362 → 354 lines; services coverage pytest green.

## Task 23: Recount Full Production Code And Gate — Complete

- Scoped reduction **4.2%** (`9,712` → `9,308`); below 10% → continue in `plans/tech-debt-cleanup-10pct-wave-2026-06-03.md`.
