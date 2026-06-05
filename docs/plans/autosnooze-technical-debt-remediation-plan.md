# AutoSnooze Technical-Debt Remediation Plan

## Purpose

This plan addresses the highest-impact reliability, backend performance, frontend responsiveness, and maintainability debt found during the AutoSnooze audit.

The goal is not a rewrite. The goal is a sequence of small, behavior-preserving refactors that:

- prevent automations from being stranded disabled,
- make pause/resume outcomes explicit and recoverable,
- make batch operations faster without introducing new races,
- reduce timer, persistence, and sensor-update storms,
- keep the card responsive as Home Assistant installations grow,
- and restore one obvious owner for each workflow.

## Architecture Source Of Truth

All remediation work must follow `architecture.md`.

Frontend dependency direction:

`components -> features -> services/state -> utils/constants/types`

Backend dependency direction:

`services -> application -> runtime/infrastructure/domain/models`

### Architecture Constraints

- Components render state, hold local view state, and emit or handle UI events. They must not own Home Assistant API orchestration, registry lifecycle, backend contract interpretation, or workflow decisions.
- Feature slices own user-facing workflows and expose narrow facades to components.
- Frontend services own Home Assistant calls, registry reads, browser storage, and countdown infrastructure.
- Frontend state modules own framework-agnostic snapshots and derived state.
- Backend service handlers validate Home Assistant service input and delegate to application commands.
- Application modules are the sole owners of pause, resume, adjust, schedule, restore-orchestration, and recovery workflows.
- Runtime modules own timers and in-memory runtime mechanisms. They invoke application behavior only through callbacks supplied during entry setup.
- Infrastructure modules own persistence and Home Assistant adapters. They must not decide domain transitions.
- Models and domain modules remain serializable, explicit, and independent of Home Assistant lifecycle glue.
- No new broad `manager`, `coordinator`, `facade`, `ports`, or `utils` module should be introduced unless it replaces a broader existing module and has one clearly documented responsibility.

## Safety Rule For Optimization

Do not parallelize existing state-changing Home Assistant calls until transition ownership, stale-operation detection, and compensation behavior are centralized.

Parallelizing the current workflows first would make existing unload, restore, persistence, and stale-state races occur faster and less predictably.

## Confirmed Major Debt

### Reliability And Correctness

1. Failed resume and restore paths can delete the only recovery record while an automation remains disabled.
2. Pause and scheduled-disable operations can finish after integration unload and create inert timers.
3. Restore can perform a stale `turn_off` side effect and leave an automation disabled despite a newer future schedule.
4. Runtime mutation, timer scheduling, Home Assistant service calls, persistence, and sensor publication are not treated as one recoverable transition.
5. `resume_retries` is not persisted.
6. Storage load and migration failures are logged and treated like empty storage.
7. Unload cancels timers without defining a safe permanent-disable/removal policy.
8. Already-disabled automations are later turned on because original state is not modeled.

### Backend Performance And Scalability

1. Batch pause, resume, replacement, and restore Home Assistant calls run serially.
2. Most workflows await persistence while holding the single global `data.lock`.
3. One resume timer is created per paused automation, even when many share the same deadline.
4. Same-deadline timers independently run single-entity resume workflows, contend on the global lock, serialize the full dataset, save, notify, and update sensor state.
5. Every save serializes every paused and scheduled record.
6. Every notification publishes a sensor state whose attributes serialize every paused and scheduled record.
7. Current latency logging records only broad buckets and does not include entity count, phase timing, retry count, or partial outcomes.

### Frontend Performance And UX

1. `src/components/autosnooze-card.ts` is a 1,084-line orchestration and rendering choke point.
2. The card scans automation state references whenever the Home Assistant state object changes.
3. Each card instance independently fetches label, category, and entity registries.
4. Schedule mode generates and localizes 365 date options twice during render.
5. Active-pause countdowns request a full component rerender every second.
6. Multiple countdown-bearing components create independent synchronized timers.
7. Service calls provide no partial-success contract, so the UI can display success for failed entities.
8. Failed commands generally provide haptic feedback and console output but no durable, actionable in-card status.
9. The frontend shallow-casts backend sensor records instead of validating each record.

### Spaghetti And Ownership Debt

1. `custom_components/autosnooze/coordinator.py` remains a 741-line second application layer.
2. Twenty backend function names are duplicated across coordinator, application, runtime, and ports modules.
3. Manual resume and natural-expiry resume use different implementations.
4. `custom_components/autosnooze/runtime/ports.py` mixes Home Assistant state mutation, timer adapters, friendly-name lookup, and persistence.
5. Runtime timer callbacks are configured through module-global mutable callbacks.
6. `services.py` still imports coordinator internals and owns pause-by-area/label adapter orchestration.
7. `custom_components/autosnooze/runtime/restore.py` performs validation, reconciliation decisions, Home Assistant mutations, timer creation, persistence cleanup, and notifications.
8. `src/features/card-shell/index.ts` is a broad forwarding facade over unrelated state, registry, storage, countdown, and modal concerns.
9. The main card owns registry retry state, cache invalidation, command orchestration, modal state, toast lifecycle, confirmation, validation, and rendering.
10. Frontend tests contain more than 1,100 references to private component fields and methods, making safe internal refactoring expensive.

## Confirmed Evidence Index

These are code-backed findings, not speculative cleanup targets.

| Impact | Concrete Evidence | Why It Compounds |
| --- | --- | --- |
| Recovery record can be lost after a failed wake | `custom_components/autosnooze/application/resume.py:57-60` and `:126-129` cancel the timer and remove `data.paused` after retry exhaustion; the duplicated path remains in `custom_components/autosnooze/coordinator.py:310-313` and `:395-398`. | The integration can stop tracking an automation that is still disabled, removing its automatic recovery path. |
| Restore can discard recovery state | `custom_components/autosnooze/runtime/restore.py:193-211` removes failed restore entries and attempts expired wakes without confirming success; `:131-135` logs storage-load failure and returns as though no durable state exists. | Restart, storage, and entity-availability failures can become silent permanent state divergence. |
| Retry state is not durable | `custom_components/autosnooze/models.py:85` defines `resume_retries`, but `PausedAutomation.to_dict()` and `from_dict()` at `:87-125` omit it. | Restart resets retry history and makes recovery behavior inconsistent with runtime behavior. |
| Unload does not coordinate in-flight transitions | `custom_components/autosnooze/__init__.py:105-126` marks unloaded and cancels current timers, while `custom_components/autosnooze/application/pause.py:169-323` only checks unload before external awaits and can schedule timers afterward. | A pause crossing unload can disable an automation and create a callback that will never safely run. |
| Batch HA effects are serial | `custom_components/autosnooze/application/pause.py:228-246` and `:274-275`, `custom_components/autosnooze/application/resume.py:103-105`, and `custom_components/autosnooze/runtime/restore.py:193-211` await entity operations one by one. | Latency grows approximately linearly with selection or restore size. |
| Persistence occurs under the global lock | `custom_components/autosnooze/application/pause.py:283-317` and `custom_components/autosnooze/application/resume.py:110-137` await `async_save()` while holding `data.lock`. | Slow storage and retries block unrelated entity transitions and increase race windows. |
| Saves and sensor reads rebuild the complete state | `custom_components/autosnooze/infrastructure/storage.py:25-28` serializes both full maps for every save; `custom_components/autosnooze/sensor.py:79-86` rebuilds both maps for sensor attributes. | Large installations pay full-state costs on every mutation and publication. |
| Main card is an orchestration hotspot | `src/components/autosnooze-card.ts:57-111` holds workflow, registry, cache, modal, retry, and toast state; `:132-176` scans automation state changes; `:911-1080` owns the main composition render. | New behavior and performance work repeatedly touch the same high-risk component. |
| Frontend contract parsing trusts nested values | `src/state/paused.ts:37-45` casts arbitrary records to paused/scheduled maps without validating each entry before `buildPauseGroups()` consumes their fields at `:95-118`. | Malformed or drifted backend attributes can flow into rendering as if they were valid. |
| Render-time schedule options are expensive | `src/components/autosnooze-duration-selector.ts:88` calls `generateDateOptions(365, ...)` from render-preparation code. | Schedule-mode rerenders repeatedly allocate and localize hundreds of options. |
| Active countdown drives broad periodic updates | `src/components/autosnooze-active-pauses.ts:70` calls `requestUpdate()` from its countdown tick. | Every tick rerenders the active-pauses component instead of updating a focused display model. |

The duplicate-workflow count is reproducible by listing repeated function definitions across `custom_components/autosnooze/coordinator.py`, `custom_components/autosnooze/application/`, and `custom_components/autosnooze/runtime/`. It includes resume, adjust, scheduled-disable, restore validation, timers, persistence, state mutation, and notification workflows.

## Target Architecture

### Backend

```text
services.py
  -> application commands
       -> domain transition decisions and result models
       -> runtime timer scheduler
       -> infrastructure Home Assistant automation adapter
       -> infrastructure durable store

application/setup.py
  -> application restore/reconcile command
  -> runtime callback wiring scoped to the config entry
```

Each entity transition should have one application owner and one explicit result:

```text
requested
  -> prepared
  -> HA effect attempted
  -> runtime state committed
  -> persistence confirmed
  -> timers reconciled
  -> published
  -> succeeded | retrying | recovery_required | rejected
```

### Frontend

```text
components
  -> feature commands and view models
       -> services for HA calls, registries, storage, and countdown ticks
       -> state for parsed server snapshots and local UI snapshots
```

The main card should compose child views and bind named feature actions. It should not implement registry retry loops, cache invalidation, service-result interpretation, or multi-step workflow decisions.

## Public Repo Pattern Comparison

### Reliable Runtime Transitions

- Similar clean pattern seen in: Home Assistant Core integration structure and Adaptive Lighting.
- Pattern: lifecycle glue stays narrow, while complex runtime behavior is represented by explicit, testable state transitions with predictable service effects.
- AutoSnooze deviation: resume, restore, retry, unload, timer, and persistence outcomes are split across `custom_components/autosnooze/coordinator.py`, `custom_components/autosnooze/application/resume.py`, `custom_components/autosnooze/runtime/restore.py`, `custom_components/autosnooze/runtime/ports.py`, and `custom_components/autosnooze/__init__.py`.
- Why AutoSnooze is riskier: a failed transition can remove recovery state or cross unload without one owner deciding compensation.
- Refactor direction: centralize each transition in an application command with durable per-entity outcomes and entry-scoped runtime callbacks.

### Thin Home Assistant Adapters

- Similar clean pattern seen in: Home Assistant Core and the Home Assistant Integration Quality Scale.
- Pattern: service and entity/platform files validate, delegate, and expose state; they do not own the core workflow.
- AutoSnooze deviation: `custom_components/autosnooze/services.py` still participates in filter orchestration and coordinator wiring, while `custom_components/autosnooze/runtime/restore.py` performs application decisions and Home Assistant mutations.
- Why AutoSnooze is riskier: service and restore behavior require broad Home Assistant setup to understand and test, and workflow fixes must be coordinated across layers.
- Refactor direction: keep `services.py` as command/result translation and move restore reconciliation into one application command.

### Explicit Models And Narrow Ownership

- Similar clean pattern seen in: HACS.
- Pattern: explicit contracts and named workflows separate Home Assistant glue, internal data, and user-facing operations.
- AutoSnooze deviation: retry/recovery semantics are not fully serialized, twenty workflow/helper names are duplicated across backend layers, and `custom_components/autosnooze/runtime/ports.py` groups unrelated adapters.
- Why AutoSnooze is riskier: internal concepts can drift between runtime, persistence, services, and tests.
- Refactor direction: add explicit transition/recovery result models, then remove duplicate owners and split adapters by responsibility.

### Lit Components As Views

- Similar clean pattern seen in: Home Assistant Frontend and custom-cards/boilerplate-card.
- Pattern: Lit components compose prepared state and delegate API/state orchestration to feature modules or narrow services.
- AutoSnooze deviation: `src/components/autosnooze-card.ts` owns registry fetching/retry, caches, command orchestration, confirmation, modal state, validation, toast lifecycle, and rendering.
- Why AutoSnooze is riskier: UI changes, performance optimization, and backend-contract changes converge on one component and are difficult to test independently.
- Refactor direction: introduce a feature-owned controller/read model while keeping the component focused on rendering and event binding.

## Ranked Remediation Phases

### Test Specification Rules

Every phase below is a separate approval boundary under `AGENTS.md`.

- Write the named test first and confirm it fails for the intended behavioral reason.
- Prefer public application commands, service responses, rendered output, and observable runtime state over private helper assertions.
- New test files named below are proposed locations, not files created by this audit.
- Do not move to implementation until the targeted failing test has been shown.
- Run the targeted command after each small implementation task.
- Run the phase gate before declaring the phase complete.
- Obtain explicit approval before modifying `tests/` or `src/tests/`, as required by `AGENTS.md`.

## Phase 0: Establish Behavioral And Performance Baselines

**Priority:** Immediate
**Risk:** Low
**Purpose:** Prevent optimization work from hiding correctness regressions.

### Work

- Add deterministic behavioral tests for:
  - failed wake after retry exhaustion,
  - failed expired-record wake during restore,
  - failed re-disable during restore,
  - unload interleaving with pause and scheduled disable,
  - stale restore side effects,
  - partial pause and resume outcomes,
  - storage load/version failure,
  - same-deadline batch expiry.
- Add benchmark-style tests or instrumentation for:
  - pause/resume of 1, 10, 50, and 100 entities,
  - number of Home Assistant calls,
  - number of saves,
  - number of sensor publications,
  - number of timers created,
  - maximum lock hold duration,
  - frontend render count during countdown and unrelated HA state churn.
- Record current card bundle size and initial-render timing.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `test_failed_resume_after_retry_limit_retains_recovery_record` | New: `tests/test_recovery_invariants.py` | A failed final `turn_on` leaves a durable paused/recovery record and reports `recovery_required`. |
| `test_failed_expired_restore_retains_recovery_record` | New: `tests/test_recovery_invariants.py` | An expired stored snooze is not deleted unless the automation is confirmed enabled. |
| `test_restore_load_error_is_not_treated_as_empty_storage` | `tests/test_persistence_robustness.py` | A store load exception produces an observable setup/recovery failure. |
| `test_pause_crossing_unload_does_not_create_inert_timer` | New: `tests/test_lifecycle_transitions.py` | An externally blocked pause resumed after unload cannot commit an active pause with an unusable timer. |
| `test_batch_baseline_records_calls_saves_publications_and_timers` | New: `tests/test_transition_performance.py` | Characterization output records counts for 1, 10, 50, and 100 entities without yet enforcing optimized thresholds. |
| `automation list baseline records unrelated-state render count` | New: `tests/test_frontend_performance.spec.ts` | A 500-automation fixture records list rebuild and render counts after unrelated HA state churn. |

**Targeted verification**

```bash
pytest tests/test_recovery_invariants.py tests/test_lifecycle_transitions.py tests/test_persistence_robustness.py tests/test_transition_performance.py -q
npm run test -- tests/test_frontend_performance.spec.ts
```

**Phase gate**

```bash
pytest tests/ -q
npm run test
npm run build
```

### Architecture Alignment

- Behavioral tests target public application commands and user-visible state.
- Avoid adding tests that require importing new private coordinator internals.

### Acceptance Criteria

- Every known stranded-disabled failure mode has a deterministic regression test.
- Performance measurements can distinguish HA-call time, lock time, save time, and publish time.
- Baselines are documented before optimization begins.

## Phase 1: Introduce Explicit Transition Results And Durable Recovery

**Priority:** Critical
**Risk:** High
**Purpose:** Make every later optimization safe.

### Work

- Add low-level domain result models such as:
  - `TransitionResult`
  - `EntityTransitionResult`
  - `RecoveryStatus`
- Model outcomes explicitly:
  - `succeeded`
  - `rejected`
  - `retrying`
  - `recovery_required`
  - `stale_compensated`
- Persist retry and recovery state.
- Never delete a paused record solely because `turn_on` failed.
- Never delete a restore record until the desired enabled state is confirmed.
- Surface storage load and version failures as setup/recovery failures instead of empty state.
- Decide and encode original-off automation behavior:
  - recommended default: do not re-enable an automation AutoSnooze did not disable.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `test_transition_result_models_represent_all_terminal_and_recovery_outcomes` | New: `tests/test_transition_results.py` | Result models represent success, rejection, retry, recovery-required, and stale compensation without raw dictionaries. |
| `test_resume_retry_and_recovery_state_round_trips_storage` | `tests/test_models_coverage.py` | `resume_retries`, recovery status, and original enabled state survive `to_dict()` and `from_dict()`. |
| `test_failed_resume_returns_recovery_required_without_removing_pause` | New: `tests/test_transition_results.py` | Retry exhaustion returns a per-entity recovery result and retains durable state. |
| `test_restore_only_removes_record_after_confirmed_enabled_state` | `tests/test_persistence_robustness.py` | Failed restore wake does not delete the stored record. |
| `test_originally_off_automation_is_not_enabled_on_resume` | New: `tests/test_recovery_invariants.py` | AutoSnooze does not turn on an automation it did not turn off. |
| `test_storage_version_failure_surfaces_actionable_recovery_result` | `tests/test_schema_version_contract.py` | Unsupported or corrupt storage cannot silently become empty state. |

**Targeted verification**

```bash
pytest tests/test_transition_results.py tests/test_models_coverage.py tests/test_recovery_invariants.py tests/test_persistence_robustness.py tests/test_schema_version_contract.py -q
```

**Phase gate**

```bash
pytest tests/ -q --cov=custom_components/autosnooze --cov-report=term-missing
npm run mutation:backend
```

### Architecture Alignment

- Result and recovery models belong in `domain/` or `models.py`.
- Transition decisions belong in `application/`.
- Home Assistant calls remain infrastructure/runtime adapters.
- Services only translate command results into Home Assistant service responses or errors.

### Acceptance Criteria

- No failed wake path removes the only recovery record.
- Retry state survives restart.
- Storage load/version failure is visible and actionable.
- Application commands return explicit per-entity outcomes.

## Phase 2: Consolidate Backend Workflow Ownership

**Priority:** Critical
**Risk:** Medium-High
**Purpose:** Remove split-brain behavior and make performance work local.

### Work

- Make `custom_components/autosnooze/application/resume.py`, `custom_components/autosnooze/application/pause.py`, `custom_components/autosnooze/application/adjust.py`, and `custom_components/autosnooze/application/scheduled.py` the sole workflow owners.
- Move restore reconciliation decisions into an application restore command.
- Reduce `coordinator.py` to temporary compatibility exports, then remove it.
- Replace module-global runtime callback configuration with entry-scoped callbacks stored in runtime data.
- Split `custom_components/autosnooze/runtime/ports.py` by responsibility:
  - Home Assistant automation state adapter,
  - timer scheduling adapter,
  - persistence adapter.
- Move pause-by-area and pause-by-label workflow orchestration fully into application commands.
- Remove dead and test-only duplicate helpers after callers migrate.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `test_all_resume_entry_points_delegate_to_application_resume_command` | `tests/test_application_commands.py` | Manual, expiry, retry, and restore paths invoke the same public application command. |
| `test_restore_reconciliation_is_owned_by_application_layer` | `tests/test_application_setup.py` | Setup delegates restore decisions to application code; runtime only loads/schedules. |
| `test_runtime_callbacks_are_scoped_per_entry` | `tests/test_application_setup.py` | Two entries cannot overwrite each other's timer callbacks. |
| `test_production_modules_do_not_import_coordinator_workflows` | `ci_contracts/test_python_architecture_contract.py` | No production application, runtime, service, or lifecycle module imports coordinator workflow functions. |
| `test_each_backend_workflow_has_one_production_definition` | New: `ci_contracts/test_workflow_ownership_contract.py` | Resume, adjust, scheduled-disable, restore, timer, persistence, and HA-state workflows each have one production owner. |
| `test_runtime_ports_are_split_by_adapter_responsibility` | New: `ci_contracts/test_backend_adapter_contract.py` | Runtime timer, persistence, and HA state adapters cannot collapse back into a broad mixed port module. |

**Targeted verification**

```bash
pytest tests/test_application_commands.py tests/test_application_setup.py ci_contracts/test_python_architecture_contract.py ci_contracts/test_workflow_ownership_contract.py ci_contracts/test_backend_adapter_contract.py -q
```

**Phase gate**

```bash
pytest tests/ -q
pytest ci_contracts -q
ruff check custom_components/ tests/
```

### Architecture Alignment

- Enforce `services -> application -> runtime/infrastructure/domain/models`.
- Runtime receives callbacks from setup/application wiring and never imports upward.
- `__init__.py` remains lifecycle-only.

### Acceptance Criteria

- Manual resume, expiry resume, retry resume, and restore resume execute the same application command.
- Scheduled disable has one implementation.
- No production module imports workflow functions from `coordinator.py`.
- Backend architecture contracts detect duplicate workflow ownership, not only upward imports.

## Phase 3: Make Transitions Lifecycle-Safe And Shorten Lock Holds

**Priority:** Critical
**Risk:** High
**Purpose:** Eliminate unload/stale races and unblock unrelated entities.

### Work

- Add an entry lifecycle generation or operation epoch.
- Add per-entity transition generations.
- Recheck lifecycle and entity generation after every external await.
- Compensate stale Home Assistant side effects when safe.
- Track in-flight commands during unload.
- Define unload policies:
  - reload preserves durable state and guarantees restore,
  - permanent disable/removal resumes active automations or creates an explicit recovery action.
- Stop awaiting disk persistence while holding the global runtime state lock.
- Under lock:
  - verify generation,
  - commit an immutable state snapshot,
  - capture the persistence payload/version.
- Outside lock:
  - persist,
  - publish,
  - compensate or mark recovery-required on failure.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `test_pause_crossing_unload_is_compensated_or_recovery_required` | `tests/test_lifecycle_transitions.py` | An in-flight pause crossing unload cannot silently leave an untracked disabled automation. |
| `test_scheduled_disable_crossing_unload_is_compensated_or_recovery_required` | `tests/test_lifecycle_transitions.py` | The scheduled equivalent has the same lifecycle guarantee. |
| `test_stale_resume_generation_cannot_remove_newer_pause` | `tests/test_coordinator.py` during migration, then application-owner test | A stale wake result cannot remove or override a newer transition. |
| `test_slow_persistence_does_not_hold_runtime_lock` | `tests/test_persistence_robustness.py` | A second unrelated transition acquires the lock while the first save is blocked. |
| `test_unload_waits_for_or_invalidates_in_flight_commands` | `tests/test_init.py` | Unload finishes only after each in-flight command is resolved or invalidated. |
| `test_persistence_failure_after_ha_effect_creates_recovery_state` | `tests/test_persistence_robustness.py` | A post-effect save failure is represented durably/actionably rather than only raised or logged. |

**Targeted verification**

```bash
pytest tests/test_lifecycle_transitions.py tests/test_persistence_robustness.py tests/test_init.py tests/test_coordinator.py -q
```

**Phase gate**

```bash
pytest tests/ -q
pytest ci_contracts -q
npm run mutation:backend
```

### Architecture Alignment

- Lifecycle coordination belongs in application setup/runtime state.
- Persistence mechanics remain in infrastructure.
- Domain transition rules remain independent of Home Assistant lifecycle APIs.

### Acceptance Criteria

- A command that crosses unload cannot leave a newly disabled automation with an inert timer.
- Slow persistence does not block unrelated entity transitions.
- Stale operations are either compensated or represented as recovery-required.
- Lock-hold measurements exclude Home Assistant service calls and disk writes.

## Phase 4: Optimize Backend Batch Execution

**Priority:** High
**Risk:** Medium, after Phases 1-3
**Purpose:** Reduce latency for large selections without sacrificing correctness.

### Work

- Replace serial per-entity HA calls with bounded concurrency after transition generations exist.
- Use a conservative concurrency limit and preserve per-entity results.
- Prefer a single Home Assistant service call with multiple entity IDs where behavior and result visibility remain acceptable.
- Keep compensation bounded and explicit.
- Batch friendly-name and state lookups where practical.
- Return one command result containing all entity outcomes.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `test_pause_batch_never_exceeds_configured_concurrency` | New: `tests/test_application_batching.py` | Blocking HA-call probes observe concurrency greater than one and no greater than the configured bound. |
| `test_resume_batch_never_exceeds_configured_concurrency` | New: `tests/test_application_batching.py` | Resume uses the same bounded policy. |
| `test_batch_returns_ordered_per_entity_partial_results` | New: `tests/test_application_batching.py` | Mixed success/failure returns explicit outcomes for every requested entity in deterministic order. |
| `test_stale_result_during_concurrent_batch_is_compensated` | New: `tests/test_application_batching.py` | A newer transition created while calls are in flight is not overwritten. |
| `test_fifty_entity_batch_saves_and_publishes_once` | `tests/test_transition_performance.py` | A 50-entity successful command performs one durable commit and one publication. |
| `test_batch_latency_is_bounded_by_concurrency_not_entity_count` | `tests/test_transition_performance.py` | Deterministic blocked-call timing proves the batch is no longer serial without relying on wall-clock flakiness. |

**Targeted verification**

```bash
pytest tests/test_application_batching.py tests/test_transition_performance.py -q
```

**Phase gate**

```bash
pytest tests/ -q
npm run mutation:backend
```

### Architecture Alignment

- Concurrency policy belongs in the application command or a narrow infrastructure adapter.
- Services do not implement batching loops.
- Components do not infer batch outcomes.

### Acceptance Criteria

- Batch latency no longer grows approximately linearly with entity count.
- Partial failures are returned explicitly.
- Concurrency does not increase stale-transition or unload-race failures.
- A 50-entity command performs one persistence commit and one state publication.

## Phase 5: Coalesce Timers, Persistence, And Sensor Publication

**Priority:** High
**Risk:** Medium-High
**Purpose:** Eliminate same-deadline timer/save/update storms.

### Work

- Replace one independent resume callback per entity with deadline-grouped scheduling or a single next-deadline scheduler.
- When a deadline fires:
  - collect all due entities,
  - run one batch resume command,
  - persist once,
  - publish once,
  - schedule the next deadline.
- Apply the same grouping where appropriate for scheduled disables and pre-resume notifications.
- Introduce a persistence queue or coalescing writer using Home Assistant storage helpers where durability requirements permit.
- Keep immediate durable writes for safety-critical transition boundaries.
- Cache or version serialized sensor attributes so unchanged data is not rebuilt unnecessarily.
- Publish only after meaningful state changes.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `test_same_deadline_pauses_create_one_runtime_deadline_callback` | `tests/test_runtime_modules.py` | N pauses sharing a deadline create one grouped callback or one next-deadline scheduler entry. |
| `test_deadline_callback_resumes_all_due_entities_in_one_batch` | `tests/test_runtime_modules.py` | Firing one deadline invokes one application batch with every due entity. |
| `test_same_deadline_expiry_saves_and_notifies_once` | `tests/test_transition_performance.py` | N due entities produce one save and one sensor publication. |
| `test_distinct_deadlines_schedule_only_distinct_deadline_count` | `tests/test_runtime_modules.py` | Timer count equals distinct deadlines, not entity count. |
| `test_coalesced_writer_preserves_latest_snapshot_and_safety_writes` | `tests/test_persistence_robustness.py` | Coalescing drops no latest state and immediate safety-critical writes remain durable. |
| `test_sensor_does_not_publish_when_snapshot_version_is_unchanged` | `tests/test_dispatcher_updates.py` | Repeated equivalent notifications do not rebuild/publish sensor state. |

**Targeted verification**

```bash
pytest tests/test_runtime_modules.py tests/test_transition_performance.py tests/test_persistence_robustness.py tests/test_dispatcher_updates.py tests/test_sensor_coverage.py -q
```

**Phase gate**

```bash
pytest tests/ -q
npm run mutation:backend
```

### Architecture Alignment

- Timer data structures and deadline scheduling belong in `runtime/`.
- Due-item reconciliation belongs in `application/`.
- Storage coalescing belongs in `infrastructure/`.
- Sensor remains a read-only projection.

### Acceptance Criteria

- N entities sharing a deadline trigger one application batch, one durable commit, and one sensor publication.
- Timer count scales with distinct deadlines rather than entity count where feasible.
- No timer callback owns business workflow decisions.

## Phase 6: Create Explicit Backend Service Contracts

**Priority:** High
**Risk:** Medium
**Purpose:** Improve reliability and enable smooth frontend UX.

### Work

- Add service response support for commands that can partially succeed.
- Return per-entity outcomes and recovery status.
- Treat stale/nontracked entity requests explicitly instead of silently skipping them.
- Keep service handlers thin:
  - validate schema,
  - invoke one application command,
  - translate command result.
- Add actionable translated errors for recovery-required and persistence failures.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `test_pause_service_returns_per_entity_outcomes` | `tests/test_services_coverage.py` | Service response includes every requested entity and its explicit result. |
| `test_partial_resume_service_response_is_not_complete_success` | `tests/test_services_coverage.py` | Mixed resume results are represented as partial success. |
| `test_unknown_entity_service_request_is_explicitly_rejected` | `tests/test_application_commands.py` | Unknown/nontracked entities are returned as rejected rather than silently filtered. |
| `test_recovery_required_service_error_is_actionable_and_translated` | `tests/test_services_coverage.py` | Recovery-required failures expose a stable translation key and entity context. |
| `backend response fixture matches service response schema` | `tests/test_backend_schema.spec.ts` and `tests/fixtures/backend-responses.json` | Frontend-facing fixtures enforce the exact versioned response contract. |
| `pause and resume features preserve partial outcomes` | `tests/test_pause_feature.spec.ts` and `tests/test_resume_feature.spec.ts` | Feature facades do not collapse partial results into boolean success. |

**Targeted verification**

```bash
pytest tests/test_services_coverage.py tests/test_application_commands.py -q
npm run test -- tests/test_backend_schema.spec.ts tests/test_pause_feature.spec.ts tests/test_resume_feature.spec.ts
```

**Phase gate**

```bash
pytest tests/ -q
npm run test
pytest ci_contracts -q
```

### Architecture Alignment

- Service response formatting belongs in `services.py`.
- Result meaning belongs in application/domain models.

### Acceptance Criteria

- The frontend can distinguish complete success, partial success, retrying, and recovery-required.
- No service reports complete success when requested entities failed.

## Phase 7: Extract Frontend Card Controller And View Models

**Priority:** High
**Risk:** Medium
**Purpose:** Improve responsiveness and remove the main frontend spaghetti hotspot.

### Work

- Extract a feature-owned card controller or feature composition module that owns:
  - registry loading state,
  - parsed server snapshot,
  - derived automation list data,
  - command pending/results,
  - confirmation workflow,
  - modal workflow,
  - toast/status messages.
- Keep `autosnooze-card.ts` focused on:
  - rendering,
  - local presentation state,
  - event binding.
- Split large rendering sections into focused components or pure view helpers.
- Replace imperative DOM toast construction with declarative Lit state.
- Remove duplicated modal field assignments through one typed modal-state update.
- Replace message-string comparisons in schedule validation with typed error codes.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `card controller exposes one immutable view model from server and local state` | New: `tests/test_card_controller.spec.ts` | Controller output distinguishes server snapshot, local UI state, derived list state, and command status. |
| `card controller owns registry retry and command result interpretation` | New: `tests/test_card_controller.spec.ts` | Controller performs those workflows without rendering a Lit component. |
| `card renders controller view model and delegates named actions` | `tests/test_card_ui.spec.ts` | The card renders prepared values and emits/delegates actions without direct service orchestration. |
| `typed schedule validation errors drive localized UI` | `tests/test_scheduled_snooze_feature.spec.ts` | Validation returns stable error codes; components localize them without comparing messages. |
| `components cannot import services or state directly` | `ci_contracts/test_dependency_cruiser_contract.py` | Dependency rules reject controller responsibilities in components. |
| `controller behavior tests do not access private card members` | `ci_contracts/test_test_quality_contract.py` | New controller tests use public feature contracts and rendered behavior. |

**Targeted verification**

```bash
npm run test -- tests/test_card_controller.spec.ts tests/test_card_ui.spec.ts tests/test_scheduled_snooze_feature.spec.ts
pytest ci_contracts/test_dependency_cruiser_contract.py ci_contracts/test_test_quality_contract.py -q
npm run lint:deps
```

**Phase gate**

```bash
npm run lint
npm run lint:deps
npm run typecheck
npm run typecheck:test
npm run test:coverage
pytest ci_contracts -q
```

### Architecture Alignment

- The controller belongs in a feature slice, not `components/`, `services/`, or `state/`.
- Home Assistant calls remain in `services/`.
- Parsed snapshots remain in `state/`.
- Components import only feature facades and low-level static types/constants where allowed.

### Acceptance Criteria

- `autosnooze-card.ts` no longer owns registry retries, service-result interpretation, or multi-step workflow decisions.
- Main render and snooze-handler complexity are substantially reduced.
- Architecture checks forbid components from recreating controller responsibilities.

## Phase 8: Optimize Frontend Rendering And Registry Access

**Priority:** Medium-High
**Risk:** Medium
**Purpose:** Improve speed and smoothness on large Home Assistant installations.

### Work

- Replace full automation-state scans with a feature-owned automation read model updated only when relevant entity references change.
- Share registry fetch promises and cached registry snapshots across card instances.
- Add refresh/invalidation behavior for registry changes.
- Generate schedule date options once per locale/day rather than twice per render.
- Consider native date input behavior where Home Assistant compatibility permits.
- Memoize parsed duration and schedule summaries by input values.
- Validate backend sensor records once when the sensor snapshot changes.
- Avoid making large derived collections Lit reactive state when they can remain controller caches.
- Add list windowing only if measurements show large installations still render poorly after read-model improvements.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `unrelated_hass_state_change_reuses_automation_read_model` | `tests/test_pr329_automation_list_cache.spec.ts` | Unrelated entity churn does not rebuild/filter/sort the automation list. |
| `multiple_cards_share_one_registry_request` | New: `tests/test_registry_service.spec.ts` | Concurrent card/controller instances receive one shared registry fetch promise. |
| `registry_cache_invalidates_and_retries_after_failure` | New: `tests/test_registry_service.spec.ts` | Failure is retryable and explicit invalidation refreshes shared data. |
| `schedule_date_options_generate_once_per_locale_and_day` | `tests/test_duration_selector.spec.ts` | Two selects and repeated renders reuse one generated option set. |
| `paused_contract_rejects_invalid_nested_records` | `tests/test_paused_contract.spec.ts` | Invalid `resume_at`, entity records, or schedule fields cannot enter the parsed snapshot. |
| `five_hundred_automation_fixture_has_bounded_rebuild_count` | `tests/test_stress.spec.ts` and `tests/test_frontend_performance.spec.ts` | Search/filter/render operations stay within count-based budgets without wall-clock-only assertions. |

**Targeted verification**

```bash
npm run test -- tests/test_pr329_automation_list_cache.spec.ts tests/test_registry_service.spec.ts tests/test_duration_selector.spec.ts tests/test_paused_contract.spec.ts tests/test_stress.spec.ts tests/test_frontend_performance.spec.ts
```

**Phase gate**

```bash
npm run lint
npm run lint:deps
npm run typecheck
npm run test:coverage
npm run build
```

### Architecture Alignment

- Shared registry cache belongs in `src/services/registry.ts`.
- Automation read models belong in `features/automation-list/` or `state/`.
- Components consume prepared view models.

### Acceptance Criteria

- Unrelated HA state changes do not rebuild the automation list.
- Multiple card instances share registry requests.
- Schedule-mode rerenders do not regenerate hundreds of localized date options.
- Measured initial render and search/filter latency improve for 500+ automations.

## Phase 9: Centralize Countdown Updates And Improve Interaction Feedback

**Priority:** Medium-High
**Risk:** Low-Medium
**Purpose:** Reduce periodic work and make commands feel reliable.

### Work

- Use one shared countdown clock service per page/module instead of independent intervals per component.
- Update countdown-specific display state rather than forcing broad component rerenders.
- Pause or reduce countdown work when the document/card is not visible.
- Add per-action pending state:
  - pause,
  - resume entity,
  - resume all,
  - adjust,
  - cancel scheduled.
- Disable or label only the affected controls while commands run.
- Display partial-success and retrying results.
- Keep recovery-required status visible until resolved.
- Preserve selection for failed entities to make retries easy.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `shared countdown clock uses one interval for multiple subscribers` | `tests/test_countdown_timer.spec.ts` | Multiple countdown consumers share one ticking source and unsubscribe cleanly. |
| `hidden_document_pauses_or_reduces_countdown_ticks` | `tests/test_countdown_timer.spec.ts` | Visibility changes reduce periodic work and resume without drift. |
| `countdown_tick_does_not_rerender_unrelated_card_sections` | `tests/test_frontend_performance.spec.ts` | Tick updates are confined to countdown display state. |
| `duplicate_command_submission_is_blocked_per_action` | New: `tests/test_command_feedback.spec.ts` | Repeated pause/resume/adjust/cancel input while pending invokes the backend once. |
| `partial_failure_preserves_failed_selection_and_displays_status` | New: `tests/test_command_feedback.spec.ts` | Failed entities remain selected and receive actionable status while successes clear. |
| `recovery_required_status_remains_until_resolved` | New: `tests/test_command_feedback.spec.ts` | Persistent recovery state is not replaced by a transient success toast. |
| `critical flow displays backend-confirmed partial outcome` | New: `e2e/tests/command-results.spec.ts` | User-visible status matches the backend response after a mixed-result command. |

**Targeted verification**

```bash
npm run test -- tests/test_countdown_timer.spec.ts tests/test_frontend_performance.spec.ts tests/test_command_feedback.spec.ts
npm run e2e:critical
```

**Phase gate**

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run e2e:critical
```

### Architecture Alignment

- Countdown clock belongs in `services/`.
- Command/pending/result orchestration belongs in feature slices.
- Components render the supplied status and emit actions.

### Acceptance Criteria

- Countdown updates do not rerender unrelated card sections.
- Commands cannot be accidentally double-submitted.
- Failure and retry states are visible and actionable.
- UI success messages reflect backend-confirmed outcomes.

## Phase 10: Strengthen Maintainability And Performance Gates

**Priority:** Medium
**Risk:** Low
**Purpose:** Prevent the same debt from returning.

### Work

- Enable selected Ruff complexity rules for production backend code.
- Add frontend complexity and file-size budgets for production code.
- Add a contract that prevents duplicate application workflow implementations.
- Add a contract that prevents `services.py` and `__init__.py` from importing coordinator workflow internals.
- Expand duplicate-code checks to backend Python.
- Add benchmark/regression thresholds for:
  - batch service-call count,
  - save count,
  - publication count,
  - timer count,
  - frontend rerender count,
  - bundle size.
- Migrate tests away from private component fields toward feature and user-visible behavior.
- Expand backend mutation scope to the new application transition owner.

### Explicit Tests

| Test First | Target Test File | Required Assertion |
| --- | --- | --- |
| `test_ci_enforces_backend_complexity_budget` | New: `ci_contracts/test_quality_budget_contract.py` | CI runs the selected Ruff complexity rules against production backend code. |
| `test_ci_enforces_frontend_complexity_and_file_size_budgets` | New: `ci_contracts/test_quality_budget_contract.py` | CI fails when production frontend complexity or agreed file-size budgets regress. |
| `test_jscpd_scans_backend_production_python` | `ci_contracts/test_jscpd_contract.py` | Duplication tooling covers backend Python with an intentional threshold. |
| `test_ci_runs_workflow_ownership_contract` | `ci_contracts/test_workflow_ownership_contract.py` | Duplicate workflow owners fail CI. |
| `test_ci_runs_performance_count_regressions` | New: `ci_contracts/test_performance_gate_contract.py` | CI invokes backend/frontend count-based performance tests. |
| `test_mutation_runner_targets_application_transition_owner` | `ci_contracts/test_backend_mutation_runner_contract.py` | Mutation configuration includes the consolidated application owner and its behavioral tests. |
| `test_new_frontend_behavior_tests_avoid_private_component_access` | `ci_contracts/test_test_quality_contract.py` | New feature/controller tests cannot reintroduce private-field coupling. |

**Targeted verification**

```bash
pytest ci_contracts/test_quality_budget_contract.py ci_contracts/test_jscpd_contract.py ci_contracts/test_workflow_ownership_contract.py ci_contracts/test_performance_gate_contract.py ci_contracts/test_backend_mutation_runner_contract.py ci_contracts/test_test_quality_contract.py -q
```

**Phase gate**

```bash
npm run lint
npm run lint:deps
npm run lint:duplicates
npm run lint:unused
npm run lint:unused:prod
npm run typecheck
npm run typecheck:test
npm run test:coverage
pytest tests/ -q --cov=custom_components/autosnooze --cov-report=term-missing
pytest ci_contracts -q
npm run mutation:backend
```

### Current Blind Spots To Close

- Ruff currently does not enable `C901`; an audit-only run found:
  - `async_pause_automations`: complexity 27,
  - `async_load_stored`: complexity 26,
  - duplicated resume/scheduled workflows above complexity 10.
- ESLint currently has no complexity or file-size budgets; an audit-only run found:
  - card `render()`: complexity 25,
  - card `_snooze()`: complexity 21,
  - card `shouldUpdate()`: complexity 17,
  - card file: 1,084 lines.
- `jscpd` checks TypeScript only.
- Existing architecture checks enforce import direction but allow duplicate workflow ownership.
- Existing structured logging does not produce actionable performance measurements.

### Acceptance Criteria

- CI blocks new duplicate workflow owners.
- CI blocks major complexity regressions in production code.
- Performance-sensitive behavior has count-based regression tests.
- Tests primarily assert feature behavior and public contracts.

## High-Leverage Optimization Targets

| Rank | Target | Current Cost | Direction | Prerequisite |
| --- | --- | --- | --- | --- |
| 1 | Same-deadline resume timers | N timers, N commands, N saves, N publications | Group due items into one batch transition | Phases 1-3 |
| 2 | Persistence under global lock | Slow disk/retries block unrelated operations | Commit snapshot under lock; persist outside lock | Phase 1 |
| 3 | Serial HA batch calls | Latency grows with entity count | Bounded concurrency or safe multi-target call | Phases 1-3 |
| 4 | Duplicate backend workflows | Every fix and optimization must be applied twice | One application owner per command | Phase 2 |
| 5 | Card orchestration | Large rerenders and risky feature changes | Feature-owned controller and prepared view model | Phase 7 |
| 6 | Automation list rebuilds | Large installations repeatedly scan/sort all automations | Relevant-state read model and stable cache keys | Phase 7 |
| 7 | Registry fetches per card | Duplicate websocket calls and retry loops | Shared service cache and invalidation | Phase 7 |
| 8 | Date option generation | 730 localized options generated per schedule render | Cache by locale/day or simplify input | None |
| 9 | Independent countdown intervals | Repeated periodic rerenders | Shared clock with focused updates | Phase 7 |
| 10 | Full-state serialization | Every save/sensor update rebuilds all records | Versioned snapshots and coalesced publication | Phases 1-3 |

## Spaghetti-Code Removal Map

### Backend

| Current Module | Problem | Intended Owner |
| --- | --- | --- |
| `custom_components/autosnooze/coordinator.py` | Duplicates application workflows and configures global callbacks | Remove after migration to application commands |
| `custom_components/autosnooze/application/pause.py` | Validation, HA effects, replacement logic, timers, persistence, notifications | Split into explicit application steps while retaining one command owner |
| `custom_components/autosnooze/runtime/restore.py` | Validation, reconciliation, HA calls, timers, persistence, notifications | Runtime load adapter plus application restore/reconcile command |
| `custom_components/autosnooze/runtime/ports.py` | Mixed adapter responsibilities | Narrow infrastructure/runtime adapters |
| `custom_components/autosnooze/services.py` | Registration plus filter orchestration and coordinator wiring | Thin service registration and response translation |
| `custom_components/autosnooze/runtime/state.py` | Global lock, mutable state, lifecycle, listeners, timer maps | Explicit runtime state plus lifecycle/transition generations |

### Frontend

| Current Module | Problem | Intended Owner |
| --- | --- | --- |
| `src/components/autosnooze-card.ts` | Rendering, registries, cache, commands, confirmation, modal, toast, validation | Thin composition component plus feature controller |
| `src/features/card-shell/index.ts` | Broad facade over unrelated responsibilities | Focused feature/controller APIs |
| `src/components/autosnooze-automation-list.ts` | Rendering plus repeated derived-view helpers | Component consumes prepared automation-list view model |
| `src/features/automation-list/index.ts` | Several overlapping filter/group APIs | One read-model builder with narrow exported contract |
| `src/components/autosnooze-duration-selector.ts` | Recomputes expensive date options and parsing during render | Cached feature/view-model data |
| `src/state/paused.ts` | Shallow casts backend data as trusted contracts | Strict parser producing validated snapshot |

## Recommended Implementation Order

1. Baseline and characterize failures.
2. Introduce explicit transition and recovery results.
3. Consolidate backend workflow ownership.
4. Add lifecycle generations and remove persistence from lock holds.
5. Add backend service response contracts.
6. Coalesce timers, persistence, and sensor publication.
7. Add bounded backend batch concurrency.
8. Extract the frontend controller.
9. Optimize frontend read models, registries, date options, and countdowns.
10. Tighten quality and performance gates.

Do not start with frontend micro-optimizations or backend parallelism. The largest performance gains depend on first making transitions explicit, durable, and single-owned.

## Implementation Workflow

Each implementation task must follow the repository's `AGENTS.md` workflow:

1. Present a small task plan with the failing test, implementation, and verification.
2. Stop for approval.
3. Write and run the failing test first.
4. Implement the smallest passing change.
5. Run targeted verification.
6. Stop and request approval before the next task.

Never weaken existing assertions. Obtain explicit approval before modifying files under `tests/` or `src/tests/`.

## Definition Of Done

The remediation is complete when:

- no known path can silently strand an automation disabled,
- every command reports explicit per-entity outcomes,
- all pause/resume/schedule/restore behavior has one application owner,
- unload and restart behavior are deterministic and tested,
- persistence and external HA calls do not occur under the global state lock,
- same-deadline transitions batch their work,
- large selections do not incur linear serial latency,
- components no longer own runtime orchestration,
- unrelated HA changes do not rebuild the full automation list,
- countdown work is shared and focused,
- and CI prevents duplicate workflow ownership, major complexity regression, and performance-count regression.
