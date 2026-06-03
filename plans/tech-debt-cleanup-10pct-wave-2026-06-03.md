# Tech Debt Cleanup 10% Wave Plan - 2026-06-03

## Goal

Reach at least **10%** scoped production code reduction (`9,712` → `≤8,741` lines) with zero behavior or UX regression.

## Current Evidence (post Tasks 21-22)

- Scoped production: **9,308** lines (**4.2%** removed, **404** lines net).
- Gap to 10%: **~567** more lines to remove.
- Backend wave deltas:
  - Task 21: `_handle_wake_failure` shared by `async_resume` / `async_resume_batch`.
  - Task 22: table-driven `register_services` via `_DIRECT_SERVICE_HANDLERS` + `_FILTER_PAUSE_SERVICES` (`services.py` **362 → 354** lines).
- Gates green: npm **878** tests, pytest **470**, pyright **0** errors, jscpd **0** clones.

## Task 24: Relocate Pause Orchestration Out Of `services.py` — Complete

- `async_pause_automations` + guardrails moved to `application/pause.py`; `services.py` **362 → 136** lines (re-exports only).
- Scoped Python: **2,411 → 2,318** (−93). Combined scoped reduction now **~4.9%** (post-recount below).

## Task 24 (reference): Relocate Pause Orchestration Out Of `services.py`

- Test to write:
  - Add `src/tests/backend-pause-reduction.spec.ts` guard that fails while `services.py` defines `async def async_pause_automations` and while `application/pause.py` lazy-imports pause impl from services.
- Code to implement:
  - Move `async_pause_automations` body into `application/pause.py`.
  - Move `_validate_guardrails` and guardrail helpers next to pause flow (or `application/guardrails.py` if needed for import cycles).
  - Keep `services.py` filter handlers delegating to application pause module only.
  - Preserve validation order, lock boundaries, HA calls outside lock, logging, and command metrics.
- Verification:
  - Red/green source guard.
  - `.venv/bin/pytest tests/test_services_coverage.py tests/test_application_pause.py tests/test_integration.py -k pause`
  - `.venv/bin/pyright custom_components tests`

## Task 25: Collapse Coordinator Successful-Wake Mutation — Complete

- `_clear_paused_after_wake` shared by success paths and give-up path; reduction guard green; 30 resume pytest passed.

## Task 25 (reference): Collapse Coordinator Successful-Wake Mutation

- Test to write:
  - Extend `src/tests/backend-coordinator-reduction.spec.ts` to fail while `async_resume` and `async_resume_batch` each inline `cancel_timer` + `data.paused.pop` on success.
- Code to implement:
  - Extract `_clear_paused_after_wake(data, entity_id, paused)` helper.
  - Reuse in single and batch paths; batch still collects `resumed_items` before pop.
- Verification:
  - Red/green guard.
  - `.venv/bin/pytest tests/test_coordinator.py -k resume`
  - `.venv/bin/pyright custom_components tests`

## Task 26: Frontend Style Consolidation (Measured Slice)

- Test to write:
  - Extend existing `src/tests/*style-reduction.spec.ts` for one high-duplication file (`active-pauses.styles.ts` or `duration-selector.styles.ts`) with a clone-count guard.
- Code to implement:
  - Consolidate repeated mobile/focus/hover blocks using shared CSS fragments already used elsewhere in the repo.
  - No selector or aria-visible behavior changes.
- Verification:
  - Red/green style guard.
  - `rtk npm test -- src/tests/*style-reduction.spec.ts tests/test_active_pauses.spec.ts tests/test_duration_selector.spec.ts`
  - `rtk npm run build`

## Task 27: Recount And Target Check

- Test to write:
  - None (audit).
- Code to implement:
  - Rebuild bundle if frontend touched.
  - Recount scoped production lines; stop only when ≥10% or draft next wave plan.
- Verification:
  - Full gate from Task 20 in `tech-debt-cleanup-backend-wave-2026-06-03.md`.
