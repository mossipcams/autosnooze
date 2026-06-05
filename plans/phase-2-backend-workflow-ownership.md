# Phase 2: Consolidate Backend Workflow Ownership

## Goal

Remove split-brain backend behavior so pause, resume, adjust, schedule, and restore each have one production owner in `application/`, with runtime/infrastructure providing adapters only.

## Current State (baseline)

- `coordinator.py` (~740 lines) still duplicates resume, batch resume, adjust, scheduled disable, cancel, save, and load workflows.
- `services.py` and `__init__.py` import coordinator adapters and notification helpers.
- Timer/restore callbacks are module-global (`runtime/timers.py`, `runtime/restore.py`).
- `runtime/restore.py` owns reconciliation decisions (HA effects, timer creation, persistence cleanup).
- `runtime/ports.py` mixes HA state, timer scheduling, and persistence.
- Phase 1 transition/recovery models are in place; application resume is the correct owner for wake semantics.

## Architecture Constraints

- Dependency flow: `services -> application -> runtime/infrastructure/domain/models`
- Runtime receives callbacks from setup/application wiring; no upward imports.
- `__init__.py` stays lifecycle-only.
- Coordinator removal is the end state; temporary re-exports are allowed only during migration.

---

## Task 1: Entry-scoped runtime callbacks

**Test:** `test_runtime_callbacks_are_scoped_per_entry` in `tests/test_application_setup.py`

Assert two `AutomationPauseData` instances can hold distinct resume/disable/notification callbacks and timer expiry invokes the callback stored on that entry's runtime data, not a shared global.

**Implement:**
- Add callback fields to `AutomationPauseData` (resume, scheduled-disable, pre-resume notification, restore-started notification).
- Update `runtime/timers.py` and `runtime/restore.py` to read callbacks from `data` instead of module globals.
- Wire callbacks during `application/setup.py` (or a narrow `application/runtime_wiring.py` helper).

**Verify:**
```bash
pytest tests/test_application_setup.py::test_runtime_callbacks_are_scoped_per_entry -q
```

---

## Task 2: Unify resume entry points on application resume

**Test:** `test_all_resume_entry_points_delegate_to_application_resume_command` in `tests/test_application_commands.py`

Assert manual cancel, timer expiry, retry scheduling, and restore-expiry wake all invoke `application.resume.async_resume` / `async_resume_batch` (not coordinator duplicates).

**Implement:**
- Point entry-scoped timer resume callback at application resume wrapper.
- Ensure restore expiry wake path calls application resume (via restore command in Task 3).
- Keep notification side effects injected as callbacks from setup, not coordinator resume logic.

**Verify:**
```bash
pytest tests/test_application_commands.py::test_all_resume_entry_points_delegate_to_application_resume_command -q
```

---

## Task 3: Move restore reconciliation into application

**Test:** `test_restore_reconciliation_is_owned_by_application_layer` in `tests/test_application_setup.py`

Assert setup wires `load_stored` to an application restore command; runtime restore module only validates/parses storage and schedules timers via injected callbacks.

**Implement:**
- Add `application/restore.py` with `async_restore_stored(hass, data)` owning reconciliation decisions currently in `runtime/restore.py`.
- Reduce `runtime/restore.py` to validation/load helpers and timer scheduling hooks.
- Update `__init__.py` / setup to call application restore instead of coordinator `async_load_stored`.

**Verify:**
```bash
pytest tests/test_application_setup.py::test_restore_reconciliation_is_owned_by_application_layer -q
pytest tests/test_persistence_robustness.py tests/test_recovery_invariants.py -q
```

---

## Task 4: Remove production coordinator imports

**Test:** Extend `ci_contracts/test_python_architecture_contract.py` with `test_production_modules_do_not_import_coordinator_workflows`

Assert no production module under `custom_components/autosnooze/` (including `services.py`, `__init__.py`, sensor) imports `coordinator` workflow symbols.

**Implement:**
- Repoint `services.py` to `runtime/ports` (or split adapters from Task 6) and application notification helpers.
- Repoint `__init__.py` load path to application restore/setup wiring.
- Leave `coordinator.py` as thin re-exports for tests only if needed; no production imports.

**Verify:**
```bash
pytest ci_contracts/test_python_architecture_contract.py::test_production_modules_do_not_import_coordinator_workflows -q
```

---

## Task 5: Move pause-by-area/label orchestration into application

**Test:** Add `test_pause_by_area_and_label_delegate_to_application_pause` in `tests/test_application_commands.py`

Assert area/label service handlers delegate to one application command that resolves entity IDs, validates guardrails, and calls `async_pause_automations`.

**Implement:**
- Add `async_handle_pause_by_area_service` / `async_handle_pause_by_label_service` (or single filter command) in `application/pause.py`.
- Reduce `services.py` handlers to schema validation + single application delegate.

**Verify:**
```bash
pytest tests/test_application_commands.py -q
pytest ci_contracts/test_python_architecture_contract.py::test_service_registration_layer_does_not_own_pause_by_filter_workflow -q
```

---

## Task 6: Split runtime ports by adapter responsibility

**Test:** New `ci_contracts/test_backend_adapter_contract.py::test_runtime_ports_are_split_by_adapter_responsibility`

Assert HA state, timer scheduling, and persistence live in separate modules (e.g. `runtime/adapters/automation_state.py`, `runtime/adapters/timers.py`, `runtime/adapters/persistence.py`) and `runtime/ports.py` is removed or reduced to backward-compat re-exports with no mixed responsibilities.

**Implement:**
- Extract adapters from `runtime/ports.py`.
- Update application/runtime imports to use narrow adapter modules.

**Verify:**
```bash
pytest ci_contracts/test_backend_adapter_contract.py -q
pytest tests/test_runtime_modules.py -q
```

---

## Task 7: Workflow ownership contract + coordinator shrink/remove

**Test:** New `ci_contracts/test_workflow_ownership_contract.py::test_each_backend_workflow_has_one_production_definition`

Assert resume, adjust, scheduled-disable, restore, timer scheduling, persistence save, and HA state mutation each have exactly one non-test production definition (AST scan of `custom_components/autosnooze/` excluding `coordinator.py` once removed).

**Implement:**
- Delete duplicate workflow bodies from `coordinator.py` or remove file entirely.
- Migrate remaining test imports from coordinator to application/runtime/infrastructure public seams.
- Remove dead helpers and module-global callback configurators.

**Verify:**
```bash
pytest ci_contracts/test_workflow_ownership_contract.py -q
pytest tests/test_coordinator.py -q  # migrate or retire as needed
```

---

## Phase Gate

**Targeted verification:**
```bash
pytest tests/test_application_commands.py tests/test_application_setup.py ci_contracts/test_python_architecture_contract.py ci_contracts/test_workflow_ownership_contract.py ci_contracts/test_backend_adapter_contract.py -q
```

**Full gate:**
```bash
pytest tests/ -q
pytest ci_contracts -q
ruff check custom_components/ tests/
```

## Acceptance Criteria

- Manual, expiry, retry, and restore resume paths execute the same application command.
- Scheduled disable has one implementation (`application/scheduled.py`).
- No production module imports workflow functions from `coordinator.py`.
- CI contracts detect duplicate workflow ownership and mixed adapter modules.
- Runtime callbacks are scoped per config entry.

## Risks / Notes

- `tests/test_coordinator.py` is large and coordinator-coupled; Task 7 may migrate characterization tests to application/runtime owners rather than deleting coverage.
- Notification helpers currently live in coordinator; move to `application/notifications.py` or `infrastructure/notifications.py` during Task 4.
- Task 6 (ports split) can land after Tasks 1–4 if adapter moves would otherwise block callback wiring.

## Recommended Execution Order

1 → 2 → 3 → 4 → 5 → 6 → 7

Tasks 1–3 are prerequisites for safe coordinator removal. Tasks 5–6 can proceed in parallel once Task 4 lands.
