# Major Architectural Improvements Plan

## Goal
Implement major architectural improvements with no intended user-facing behavior changes first, then modularize frontend internals.

## Assumption
The scope covers backend architecture (`domain`, `orchestrator`, `repository`, `scheduler`), backend-frontend contract hardening, and frontend decomposition of the main card component.

## Tasks (5-15 min each)

1. Baseline current service behavior contracts (10m)
- What test to write: Add or extend `tests/test_services_coverage.py` for `pause`, `cancel`, `cancel_all`, `adjust`, and `cancel_scheduled` inputs, outputs, and side effects.
- What code to implement: Add test fixtures/helpers only to express existing behavior precisely.
- How to verify it works: Run `pytest tests/test_services_coverage.py -q`.

2. Lock sensor payload contract (10m)
- What test to write: Add `tests/test_sensor_contract.py` asserting exact shape for `sensor.autosnooze_snoozed_automations` attributes (`paused`, `scheduled`, and datetime formats).
- What code to implement: None unless tests reveal inconsistencies.
- How to verify it works: Run `pytest tests/test_sensor_contract.py -q`.

3. Add frontend contract parser tests (10m)
- What test to write: Add `tests/test_paused_contract.spec.ts` covering valid payloads, missing fields, unknown versions, and backward-compatible parsing.
- What code to implement: None initially (tests should fail first).
- How to verify it works: Run `npm run test -- tests/test_paused_contract.spec.ts`.

4. Introduce pure domain state + transitions (15m)
- What test to write: Add `tests/test_domain_state.py` for pure transition functions: pause, schedule, adjust, cancel, and resume-readiness checks.
- What code to implement: Create `custom_components/autosnooze/domain/state.py` with minimal pure logic to satisfy tests.
- How to verify it works: Run `pytest tests/test_domain_state.py -q`.

5. Introduce domain event envelope (10m)
- What test to write: Add `tests/test_domain_events.py` for event serialization/roundtrip and `operation_id` uniqueness/idempotency keys.
- What code to implement: Create `custom_components/autosnooze/domain/events.py`.
- How to verify it works: Run `pytest tests/test_domain_events.py -q`.

6. Add repository interface + store adapter (15m)
- What test to write: Add `tests/test_repository_adapter.py` for load/save roundtrip, empty store bootstrap, and legacy version migration behavior.
- What code to implement: Create `custom_components/autosnooze/repository.py` adapter over existing `Store`.
- How to verify it works: Run `pytest tests/test_repository_adapter.py -q`.

7. Add scheduler port with idempotent semantics (10m)
- What test to write: Add `tests/test_scheduler_port.py` for duplicate schedule suppression, cancel-unknown safety, and replay behavior.
- What code to implement: Create `custom_components/autosnooze/scheduler.py` interface plus minimal HA adapter wrapper.
- How to verify it works: Run `pytest tests/test_scheduler_port.py -q`.

8. Build pause orchestrator path (15m)
- What test to write: Add `tests/test_orchestrator_pause.py` asserting sequence: validate -> transition -> persist -> schedule -> notify.
- What code to implement: Create `custom_components/autosnooze/orchestrator.py` pause handler using repository/scheduler ports.
- How to verify it works: Run `pytest tests/test_orchestrator_pause.py -q`.

9. Wire `autosnooze.pause` service to orchestrator (10m)
- What test to write: Extend `tests/test_services_coverage.py` to ensure API signature and behavior remain unchanged after wiring.
- What code to implement: Minimal change in `custom_components/autosnooze/services.py` for pause path only.
- How to verify it works: Run `pytest tests/test_services_coverage.py -q`.

10. Migrate `cancel`/`cancel_all`/`adjust`/`cancel_scheduled` paths (15m)
- What test to write: Add `tests/test_orchestrator_commands.py` for each command's transitions and side effects.
- What code to implement: Extend orchestrator handlers and wire remaining services.
- How to verify it works: Run `pytest tests/test_orchestrator_commands.py tests/test_services_coverage.py -q`.

11. Startup recovery replay hardening (15m)
- What test to write: Add `tests/test_startup_recovery.py` for restart with expired/future entries and idempotent scheduler re-registration.
- What code to implement: Update recovery flow in `custom_components/autosnooze/__init__.py` and coordinator integration points.
- How to verify it works: Run `pytest tests/test_startup_recovery.py -q`.

12. Replace custom listener fanout with dispatcher signal (10m)
- What test to write: Add `tests/test_dispatcher_updates.py` ensuring sensor updates exactly once per state change and unload cleanup works.
- What code to implement: Add dispatcher emit/subscribe behavior in backend modules and `custom_components/autosnooze/sensor.py`.
- How to verify it works: Run `pytest tests/test_dispatcher_updates.py -q`.

13. Add shared schema version contract (15m)
- What test to write: Backend and TS tests asserting matching schema version and required fields across backend/frontend boundary.
- What code to implement: Define version constants in `custom_components/autosnooze/const.py` and consume in `src/types/automation.ts`.
- How to verify it works: Run `pytest tests/test_sensor_contract.py -q` and `npm run test -- tests/test_paused_contract.spec.ts`.

14. Extract card store (phase 1) from `autosnooze-card` (15m)
- What test to write: Add `tests/test_card_store.spec.ts` for store state transitions (selection, filters, duration source-of-truth).
- What code to implement: Create `src/state/card-store.ts` and minimally integrate into `src/components/autosnooze-card.ts`.
- How to verify it works: Run `npm run test -- tests/test_card_store.spec.ts tests/test_card_ui.spec.ts`.

15. Extract actions controller (phase 2) from card component (10m)
- What test to write: Add `tests/test_actions_controller.spec.ts` for pause/wake/adjust payload mapping and error handling.
- What code to implement: Move action orchestration into `src/components/autosnooze-actions-controller.ts` (or equivalent service module) without behavior changes.
- How to verify it works: Run `npm run test -- tests/test_actions_controller.spec.ts`.

16. Extract countdown sync service (10m)
- What test to write: Add fake-timer tests for synchronized ticks, drift correction, and unsubscribe cleanup.
- What code to implement: Create or refine `src/services/countdown-sync.ts` and wire components to it.
- How to verify it works: Run `npm run test -- tests/test_countdown_timer.spec.ts tests/test_card_ui.spec.ts`.

17. Add observability hooks (10m)
- What test to write: Add `tests/test_logging_metrics.py` asserting structured log fields (`operation_id`, command, outcome, latency bucket).
- What code to implement: Instrument orchestrator/scheduler/repository paths with structured logging.
- How to verify it works: Run `pytest tests/test_logging_metrics.py -q`.

18. Add CI architecture invariants (10m)
- What test to write: Add workflow/contract tests to fail on stale `custom_components/autosnooze/www/autosnooze-card.js` and missing schema-contract checks.
- What code to implement: Update workflow/scripts to run build + artifact diff + contract checks.
- How to verify it works: Run local workflow-targeted checks plus `pytest -q` and `npm run test`.

Plan ready. Approve to proceed.
