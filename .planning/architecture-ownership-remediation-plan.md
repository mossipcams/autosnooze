# Architecture Ownership Remediation Plan

## Goal

Replace cosmetic dependency boundaries with explicit workflow ownership while preserving:

- The public Home Assistant service names, schemas, and behavior.
- The sensor entity ID, state, and attribute contract.
- The persisted `paused` and `scheduled` payload shape.
- Timer, retry, stale-operation, notification, unload, and startup-recovery behavior.
- Existing card behavior, accessibility, localization, and visual output.

## Holes Found In The Previous Plan

1. **No replacement composition model was defined.**
   Deleting `coordinator.py` and its global callback wiring without first defining where callbacks are composed would merely move the same hidden coupling elsewhere.

2. **The tasks were too large for 10-15 minute execution units.**
   "Unify resume ownership" and "reduce card state ownership" each span many behavior branches and test files. They must be split into independently verifiable migrations.

3. **Architecture enforcement was scheduled too late.**
   Ownership contracts must be introduced before each migration so every implementation task begins with a failing test.

4. **Several proposed tests would not fail first.**
   Characterization tests may already pass. They are useful baseline verification, but they do not satisfy the repository's strict red-green TDD rule. Each code-changing task below starts with a new failing ownership or behavior test.

5. **The plan did not account for test coupling to legacy modules.**
   Many tests import or patch `coordinator.py` and `services.py` internals. Those tests must be migrated without deleting or weakening their assertions.

6. **The frontend target conflicted with `architecture.md`.**
   Toast rendering and local UI state belong in components, not feature modules. The corrected plan extracts focused UI components/controllers while feature modules own use-case decisions and outcomes.

7. **"Reject one-line facades" was too broad and brittle.**
   A small feature facade can be valid. The real issue is duplicate aliases and features that expose multiple names for the same operation without owning a distinct use case.

8. **The plan omitted migration and rollback gates.**
   Backend and frontend work now have explicit checkpoint gates before legacy modules or exports are deleted.

## Target Architecture

### Backend

Dependency direction remains:

`services -> application -> runtime/infrastructure/domain/models`

Ownership rules:

- `__init__.py` is the Home Assistant lifecycle composition root.
- `services.py` owns service registration and unregistration only. Handlers delegate to public application handlers.
- `application/pause.py`, `application/resume.py`, `application/scheduled.py`, `application/adjust.py`, and `application/notifications.py` each own exactly one workflow family.
- `runtime/timers.py` schedules and cancels callbacks. Every higher-layer callback is supplied explicitly per scheduling call.
- `runtime/restore.py` restores state using an explicit immutable callback bundle supplied by the composition root.
- `runtime/ports.py` contains Home Assistant and persistence adapters only. It does not duplicate application workflows.
- No module-level mutable callback registries exist.
- No workflow implementation exists in more than one production module.
- `coordinator.py` is deleted after all production and test callers migrate.

### Frontend

Dependency direction remains:

`components -> features -> services/state -> utils/constants/types`

Ownership rules:

- `autosnooze-card.ts` owns top-level rendering, event routing, and local composition state.
- A card-shell controller owns registry loading, retry scheduling, cache invalidation, and teardown.
- Feature modules own use-case validation, service invocation, and typed outcomes.
- Focused components own toast rendering/lifecycle and scheduled-list rendering.
- A feature must not expose multiple aliases that perform the same operation.
- Simple feature facades may remain when they provide the intentional component-to-service boundary, but their public API must represent a distinct use case.

## Execution Prerequisite

The repository instructions prohibit modifying files in `tests/` without explicit permission.
Before executing Phase A, obtain explicit approval to modify the named backend test files.
The current user request authorizes editing this planning document only.

## Global TDD Rules

For every code-changing task:

1. Add the named failing test or contract.
2. Run only that test and record the expected failure.
3. Implement the minimum production change.
4. Run the targeted test and record the pass.
5. Run the task verification commands.
6. Stop and ask: `Task N done. Continue?`

Existing assertions may be moved to a new module target, but they may never be deleted or weakened.
Every code-changing task must meaningfully decrease net production LOC; moving production code without a net reduction does not satisfy the task.
If any task exceeds 15 minutes before reaching green, stop, preserve the failing-test state,
and split the remaining implementation into a newly approved sub-task.

## Phase A: Backend Explicit Composition

### Tasks 1-2: Remove The Mutable Default Resume Callback

Execute Tasks 1 and 2 as one approval-gated TDD unit. Do not stop while the new contract remains red.

- **Estimate:** 10 minutes
- **Failing test file:** `ci_contracts/test_python_architecture_contract.py`
- **Test name:** `test_runtime_timers_do_not_store_default_resume_callback`
- **Initial assertions:**
  - Parse `runtime/timers.py` with `ast`.
  - Fail when `_default_resume_callback`, `DefaultResumeCallback`, or the fallback
    `async_resume` function exists.
  - Report exact offending symbol names.
- **Behavior test file:** `tests/test_runtime_modules.py`
- **Behavior test name:** `test_schedule_resume_requires_and_invokes_explicit_callback`
- **Behavior assertions:**
  - Calling `schedule_resume(..., resume_callback=callback)` stores exactly one timer unsubscribe callback.
  - Invoking the captured HA timer creates exactly one task for `callback(hass, data, entity_id, reason="expired")`.
  - No `runtime.timers.async_resume` fallback is called or available.
- **Expected initial failure:** Current callback type does not accept `reason`, and the timer retains a global fallback path.
- **Implementation:**
  - Make `resume_callback` required in `runtime/timers.schedule_resume`.
  - Remove `DefaultResumeCallback`, `_default_resume_callback`, and `runtime.timers.async_resume`.
  - Thread `reason` into the supplied callback.
- **Verification:**
  - `pytest tests/test_runtime_modules.py -q`
  - `pytest ci_contracts/test_python_architecture_contract.py -q`

### Task 3: Require Explicit Notification And Disable Callbacks In Runtime Timers

- **Estimate:** 15 minutes
- **Failing test file:** `tests/test_runtime_modules.py`
- **Test names:**
  - `test_schedule_pre_resume_notification_requires_explicit_callback`
  - `test_schedule_disable_requires_explicit_callback`
- **Assertions:**
  - Scheduled and immediate pre-resume notifications invoke exactly the supplied callback.
  - Scheduled disable invokes exactly the supplied callback with the current `resume_at`.
  - Neither path can fall back to a module-level higher-layer workflow.
  - Missing callbacks raise `TypeError` at the call boundary rather than a later runtime `RuntimeError`.
- **Expected initial failure:** Both functions currently support global fallback callbacks.
- **Implementation:**
  - Make both callbacks required.
  - Remove `_default_notification_callback`, `_default_disable_callback`,
    `async_send_pre_resume_notification`, `async_execute_scheduled_disable`, and
    any remaining `configure_default_timer_callbacks` support from `runtime/timers.py`.
- **Verification:**
  - `pytest tests/test_runtime_modules.py -q`
  - Add and pass `test_runtime_timers_do_not_store_default_notification_or_disable_callbacks`
    in `ci_contracts/test_python_architecture_contract.py`.

### Task 4: Give Restore An Explicit Callback Bundle

- **Estimate:** 15 minutes
- **Failing test file:** `tests/test_startup_recovery.py`
- **Test name:** `test_startup_recovery_uses_only_supplied_callbacks`
- **Assertions:**
  - Build a `RestoreCallbacks` bundle containing `set_automation_state`, `schedule_resume`,
    `schedule_disable`, `schedule_pre_resume_notification`, and `notify_started`.
  - `async_load_stored` invokes the supplied callbacks with exact entity IDs and model instances.
  - Replacing one callback in a second bundle affects only that invocation.
  - No callback state leaks between two restore calls.
- **Expected initial failure:** Restore reads a module-global started-notification callback and imports ports internally.
- **Implementation:**
  - Add an immutable `RestoreCallbacks` dataclass or protocol bundle in `runtime/restore.py`.
  - Make `async_load_stored(hass, data, callbacks)` require it.
  - Remove `configure_default_restore_callbacks`, `_default_started_notification_callback`,
    `_notify_started_automations_on_restore`, and the local `.ports` import.
- **Verification:**
  - `pytest tests/test_startup_recovery.py tests/test_persistence_robustness.py -q`
  - `pytest ci_contracts/test_python_architecture_contract.py -q` passes the callback-global contract.

### Task 5: Create Application Notification Ownership

- **Estimate:** 15 minutes
- **Failing test file:** `tests/test_application_notifications.py` (new)
- **Test names and assertions:**
  - `test_notify_resumed_sends_one_end_notification_after_successful_expiry`
    - Dismiss then create are called in that exact order.
    - Notification ID remains `autosnooze_resume_finished`.
    - Manual resume, failed persistence, and non-`end` triggers make no notification calls.
  - `test_notify_started_batches_start_notifications`
    - One eligible item uses singular copy.
    - Multiple eligible items use count and names.
    - Non-`start` triggers are excluded.
  - `test_send_pre_resume_notification_reads_current_pause`
    - Missing, changed, and non-`about_to_end` pauses make no notification calls.
    - Eligible pauses send the expected lead-minute message.
  - `test_notification_transport_failures_do_not_break_workflow`
    - Dismiss and create failures are logged and do not raise.
- **Expected initial failure:** `application/notifications.py` does not exist.
- **Implementation:**
  - Create `application/notifications.py`.
  - Move notification copy construction and transport behavior from `coordinator.py`.
  - Keep functions public only when another application workflow calls them.
- **Verification:**
  - `pytest tests/test_application_notifications.py tests/test_notify_on_resume_notifications.py -q`
  - `pyright custom_components/autosnooze/`

### Task 6: Unify Single Resume In `application/resume.py`

- **Estimate:** 15 minutes
- **Failing test file:** `tests/test_application_resume_batch_coverage.py`
- **Test name:** `test_single_resume_notifies_only_after_successful_expired_resume_and_save`
- **Assertions:**
  - Successful expired resume removes paused state, cancels both timers, persists once, notifies state once,
    and calls `notify_resumed` once with the removed `PausedAutomation`.
  - Manual resume performs identical state changes but does not emit an end notification.
  - Save failure raises and does not emit a notification.
  - Failed wake retains or retries state and does not emit a notification.
- **Expected initial failure:** Application resume currently discards `reason` and has no notification behavior.
- **Implementation:**
  - Make `application.resume.async_resume` own both manual and expired behavior.
  - Inject or import the application notification function.
  - Preserve stale-resume re-disable behavior.
- **Verification:**
  - `pytest tests/test_application_resume_batch_coverage.py tests/test_pr329_runtime_regressions.py tests/test_notify_on_resume_notifications.py -q`

### Task 7: Unify Batch Resume In `application/resume.py`

- **Estimate:** 15 minutes
- **Failing test file:** `tests/test_application_resume_batch_coverage.py`
- **Test name:** `test_batch_expired_resume_notifies_only_successfully_removed_entries`
- **Assertions:**
  - Only successfully resumed, still-current entries are included in the notification batch.
  - Retried, exhausted, missing, and stale entries are excluded.
  - Persistence occurs once.
  - Notification occurs only after successful persistence.
- **Expected initial failure:** Application batch resume discards `reason` and never notifies.
- **Implementation:** Add expired-resume notification behavior to `application.resume.async_resume_batch`.
- **Verification:** `pytest tests/test_application_resume_batch_coverage.py tests/test_notify_on_resume_notifications.py -q`

### Task 8: Route Every Resume Timer To Application Resume

- **Estimate:** 15 minutes
- **Failing test file:** `ci_contracts/test_python_architecture_contract.py`
- **Test name:** `test_production_resume_schedulers_supply_application_resume_callback`
- **Assertions:**
  - AST/import inspection reports every production `schedule_resume` call missing `resume_callback`.
  - No production call relies on a default callback.
  - Runtime and application modules do not import `coordinator.py`.
- **Expected initial failure:** Multiple production scheduling calls omit explicit callbacks.
- **Implementation:**
  - Thread `application.resume.async_resume` through pause, scheduled, adjust, restore, and retry scheduling calls.
  - Use small locally named callback adapters only where signatures differ.
- **Verification:**
  - `pytest tests/test_runtime_modules.py tests/test_application_pause.py tests/test_application_resume_batch_coverage.py tests/test_startup_recovery.py -q`
  - `pytest ci_contracts/test_python_architecture_contract.py -q`

### Task 9: Unify Scheduled Disable In `application/scheduled.py`

- **Estimate:** 15 minutes
- **Failing test file:** `tests/test_application_scheduled.py` (new)
- **Test names and assertions:**
  - `test_execute_scheduled_disable_promotes_schedule_to_pause`
    - Cancels scheduled timer, disables automation, removes scheduled entry, creates paused entry,
      schedules resume and pre-resume notification with explicit callbacks, saves once, and notifies once.
  - `test_execute_scheduled_disable_retries_before_resume_boundary`
    - Failed disable updates `disable_at`, schedules exactly one retry, and persists once.
  - `test_execute_scheduled_disable_drops_retry_at_or_after_resume`
    - Removes schedule, does not schedule retry, and persists cleanup.
  - `test_execute_scheduled_disable_undoes_stale_success`
    - A newer runtime state causes the stale disable to be undone and not persisted over.
  - `test_execute_scheduled_disable_emits_start_notification_after_save`
    - Start notification receives the promoted pause only after successful persistence.
- **Expected initial failure:** Application scheduled workflow lacks pre-resume and notification parity with coordinator.
- **Implementation:** Make `application/scheduled.py` the complete owner of scheduled-disable execution.
- **Verification:**
  - `pytest tests/test_application_scheduled.py tests/test_notify_on_resume_flow.py tests/test_notify_on_resume_notifications.py -q`

### Task 10: Route Every Disable Timer To Application Scheduled

- **Estimate:** 10 minutes
- **Failing test file:** `ci_contracts/test_python_architecture_contract.py`
- **Test name:** `test_production_disable_schedulers_supply_application_callback`
- **Assertions:**
  - Every production `schedule_disable` call supplies `disable_callback`.
  - No production call relies on runtime fallback behavior.
- **Expected initial failure:** Existing scheduling calls omit the callback.
- **Implementation:** Thread `application.scheduled.async_execute_scheduled_disable` through pause and restore scheduling.
- **Verification:**
  - `pytest tests/test_runtime_modules.py tests/test_application_scheduled.py tests/test_startup_recovery.py -q`

### Task 11: Compose Restore Explicitly At Setup

- **Estimate:** 15 minutes
- **Failing test file:** `tests/test_application_setup.py`
- **Test name:** `test_application_setup_receives_complete_restore_callback_bundle`
- **Assertions:**
  - Startup and already-running setup paths call restore with the same complete callback bundle.
  - The bundle points to application resume, scheduled-disable, and notification workflows.
  - Unloaded startup callbacks perform no restore work.
- **Expected initial failure:** Setup currently receives a simple `load_stored(hass, data)` callable.
- **Implementation:**
  - Update setup composition to create and pass `RestoreCallbacks`.
  - Update `__init__.py` to import restore directly from `runtime.restore`, not `coordinator.py`.
- **Verification:** `pytest tests/test_application_setup.py tests/test_startup_recovery.py tests/test_smoke.py -q`

## Phase B: Thin Backend Adapters And Coordinator Removal

### Tasks 12-13: Make Pause Registration A Thin Adapter

Execute Tasks 12 and 13 as one approval-gated TDD unit. Do not stop while the new contract remains red.

- **Estimate:** 10 minutes
- **Failing test file:** `ci_contracts/test_python_architecture_contract.py`
- **Test name:** `test_services_adapter_imports_only_public_application_handlers_and_schemas`
- **Assertions:**
  - `services.py` imports no symbol from `coordinator.py`.
  - `services.py` defines no workflow functions named `async_pause_automations`,
    `async_clear_notification_config`, `_contains_guardrail_term`, or `_is_critical_automation`.
  - Registered handlers delegate to public `async_handle_*_service` application functions.
- **Expected initial failure:** Current compatibility wrappers, duplicate helpers, and coordinator imports are reported.
- **Behavior test file:** `tests/test_services_coverage.py`
- **Behavior test name:** `test_pause_handler_delegates_call_unchanged_to_application_handler`
- **Behavior assertions:**
  - Calling the registered pause handler invokes
    `application.pause.async_handle_pause_service(hass, data, call)` exactly once.
  - The service adapter does not separately validate guardrails, build dates, schedule timers, save, or notify.
- **Expected initial failure:** Current handler performs orchestration inline.
- **Implementation:**
  - Delegate pause directly to the public application handler.
  - Remove pause compatibility wrappers and duplicate guardrail helpers from `services.py`.
- **Verification:** `pytest tests/test_services_coverage.py tests/test_application_pause.py tests/test_smoke.py -q`

### Task 14: Centralize Service Registration And Unregistration

- **Estimate:** 15 minutes
- **Failing test files:**
  - `tests/test_init.py`
  - `ci_contracts/test_python_architecture_contract.py`
- **Test names and assertions:**
  - `test_registered_and_unregistered_service_sets_are_identical`
    - Register services on a fake HA registry.
    - Unregister services.
    - Assert the exact same service-name set was registered and removed.
  - `test_service_lifecycle_is_owned_by_services_module`
    - `__init__.py` contains no literal service-name tuple.
- **Expected initial failure:** Unregistration list is duplicated in `__init__.py`.
- **Implementation:**
  - Add a single immutable `SERVICE_NAMES` definition and `unregister_services(hass)` in `services.py`.
  - Make `async_unload_entry` delegate service teardown.
- **Verification:** `pytest tests/test_init.py tests/test_smoke.py ci_contracts/test_python_architecture_contract.py -q`

### Task 15: Verify Production Coordinator Imports Are Gone

- **Estimate:** 15 minutes
- **Test to write:** None. Tasks 11 and 12-13 perform the production import migration.
- **Verification assertions:**
  - AST-scan every production Python file except `coordinator.py`.
  - Report all imports of `custom_components.autosnooze.coordinator` or relative coordinator imports.
- **Implementation:** None unless the scan finds a remaining production import; if it does, create a failing
  contract for that exact offender and handle it as a newly approved red-green sub-task.
- **Verification:** Run the existing coordinator-import contracts in
  `pytest ci_contracts/test_python_architecture_contract.py -q`.

### Task 16: Migrate Legacy Coordinator Tests Without Weakening Assertions

- **Estimate:** 15 minutes per test group; execute as separate approval-gated sub-tasks.
- **No production implementation is allowed in this task.**
- **Failing contract file:** `ci_contracts/test_python_architecture_contract.py`
- **Failing contract name:** `test_no_test_module_imports_or_patches_coordinator_facade`
- **Contract assertions:**
  - Scan Python test imports and patch-target strings.
  - Report every remaining `custom_components.autosnooze.coordinator` reference.
  - Exclude no behavioral test files.
- **Expected initial failure:** Existing coordinator-focused tests and notification tests are reported.
- **Test migration groups:**
  1. Timer tests from `tests/test_coordinator.py` patch/import `runtime.timers`.
  2. Restore and validation tests patch/import `runtime.restore`.
  3. Save and HA-port tests patch/import `runtime.ports` or `infrastructure.storage`.
  4. Resume tests patch/import `application.resume`.
  5. Scheduled-disable tests patch/import `application.scheduled`.
  6. Notification tests patch/import `application.notifications`.
- **Required assertions:**
  - Preserve every existing assertion and branch case.
  - Change only imports, patch targets, fixture names, and class/module organization.
  - The total number of behavioral test cases may not decrease.
- **Verification after each group:** Run the migrated file/class plus
  `pytest ci_contracts/test_test_quality_contract.py ci_contracts/test_python_architecture_contract.py -q`.

### Task 17: Delete `coordinator.py`

- **Estimate:** 10 minutes
- **Failing test file:** `ci_contracts/test_python_architecture_contract.py`
- **Test name:** `test_coordinator_facade_is_removed`
- **Assertion:** `custom_components/autosnooze/coordinator.py` does not exist.
- **Expected initial failure:** File exists.
- **Implementation:** Delete `coordinator.py` after Tasks 1-16 pass.
- **Verification:**
  - `pytest tests/ -q`
  - `pytest ci_contracts -q`
  - `ruff check custom_components/ tests/`
  - `ruff format --check custom_components/ tests/`
  - `pyright custom_components/autosnooze/`
  - `npm run smoke`

### Backend Checkpoint

Do not begin frontend work unless:

- No production or test file imports `coordinator.py`.
- No mutable callback registry exists.
- Manual and timer-driven resume share one application implementation.
- Scheduled disable has one application implementation.
- Service registration and teardown use one service-name source.
- Full backend suite and smoke suite pass.

## Phase C: Frontend Ownership

### Task 18: Define A Card-Shell Controller Contract

- **Estimate:** 10 minutes
- **Failing test file:** `src/tests/card-shell-controller.spec.ts` (new)
- **Test name:** `creates an isolated controller with explicit lifecycle state`
- **Assertions:**
  - Two controller instances do not share registry data, in-flight promises, retry timers, or cache versions.
  - `connect(hass)` starts required registry loads.
  - `disconnect()` cancels pending retry work.
  - A controller snapshot exposes registry data, availability, and cache version without exposing mutable internals.
- **Expected initial failure:** Controller does not exist.
- **Implementation:** Add `src/features/card-shell/controller.ts` with explicit injected registry loaders and timer functions.
- **Verification:** `npm run test -- src/tests/card-shell-controller.spec.ts && npm run typecheck`

### Task 19: Move Label Registry Retry Lifecycle Out Of The Card

- **Estimate:** 15 minutes
- **Failing test file:** `src/tests/card-shell-controller.spec.ts`
- **Test name:** `retries label registry with bounded backoff and resets after success`
- **Assertions:**
  - First failure marks labels unavailable and schedules one retry at `REGISTRY_RETRY_MIN_MS`.
  - Repeated failures double delay up to `REGISTRY_RETRY_MAX_MS`.
  - Concurrent loads share one in-flight request.
  - Success clears the timer, resets delay, updates registry, and increments cache version once.
- **Expected initial failure:** Logic still lives in `autosnooze-card.ts`.
- **Implementation:** Move label loading/retry behavior into the controller and delegate from card lifecycle hooks.
- **Verification:**
  - `npm run test -- src/tests/card-shell-controller.spec.ts src/tests/autosnooze-card-mutation.spec.ts`
  - `npm run typecheck`

### Task 20: Move Category, Entity Registry, And Automation Cache Ownership

- **Estimate:** 15 minutes
- **Failing test file:** `src/tests/card-shell-controller.spec.ts`
- **Test name:** `loads registries once and invalidates automation cache only when dependencies change`
- **Assertions:**
  - Category and entity requests deduplicate in-flight calls.
  - Entity registry success increments cache version once.
  - Stable HA state and registry references return the same automation-array reference.
  - Changed automation states or entity registry return a newly computed array.
- **Expected initial failure:** Cache and fetch state remain in the card.
- **Implementation:** Move registry fetch state and automation cache computation into the controller.
- **Verification:**
  - `npm run test -- src/tests/card-shell-controller.spec.ts src/tests/automation-list-feature-mutation.spec.ts src/tests/autosnooze-card-mutation.spec.ts`

### Task 21: Extract Toast Rendering And Lifecycle Component

- **Estimate:** 15 minutes
- **Failing test file:** `src/tests/autosnooze-toast.spec.ts` (new)
- **Test names and assertions:**
  - `renders accessible message and optional undo action`
    - Uses `role="alert"`, `aria-live="polite"`, and `aria-atomic="true"`.
    - Undo dispatches one composed bubbling event and dismisses the toast.
  - `replaces timeout and removes after fade`
    - Updating the message clears prior duration/fade timers.
    - Disconnect clears all pending timers.
  - `renders text without undo controls when no undo action exists`
- **Expected initial failure:** Component does not exist.
- **Implementation:** Add `autosnooze-toast.ts`; move DOM construction and timer lifecycle from the card.
- **Verification:** `npm run test -- src/tests/autosnooze-toast.spec.ts src/tests/autosnooze-card-toast-behavior.spec.ts`

### Task 22: Extract Scheduled Pauses Component

- **Estimate:** 15 minutes
- **Failing test file:** `src/tests/autosnooze-scheduled-pauses.spec.ts` (new)
- **Test names and assertions:**
  - `renders nothing for an empty schedule`
  - `renders exact names, disable times, resume times, and accessible region labels`
  - `dispatches one cancel-scheduled event with the selected entity id`
- **Expected initial failure:** Component does not exist.
- **Implementation:** Add `autosnooze-scheduled-pauses.ts` and move `_renderScheduledPauses()` from the card.
- **Verification:**
  - `npm run test -- src/tests/autosnooze-scheduled-pauses.spec.ts src/tests/autosnooze-card-mutation.spec.ts`
  - `npm run typecheck`

### Task 23: Give Pause Feature A Typed Interaction Outcome

- **Estimate:** 15 minutes
- **Failing test file:** `src/tests/pause-scheduled-feature-mutation.spec.ts`
- **Test name:** `runPauseInteraction returns all state effects required by the card`
- **Assertions:**
  - Successful pause returns selected IDs for undo, toast message, optional last duration, and reset-state instructions.
  - Confirm-required returns a typed confirmation outcome with no reset effects.
  - Aborted and validation-error outcomes make no service call.
  - Service failures are rethrown and produce no success effects.
- **Expected initial failure:** Existing `runPauseFeature` does not own validation or describe all post-success effects.
- **Implementation:**
  - Introduce one meaningful pause interaction API; keep request construction and persistence inside the feature.
  - Move `validateScheduledPauseInput` into the pause feature because scheduled pause submission is part of the pause use case.
  - Keep adjust and cancel-scheduled behavior in the scheduled-snooze feature.
  - Do not introduce a cross-feature import.
- **Verification:** `npm run test -- src/tests/pause-scheduled-feature-mutation.spec.ts src/tests/notification-trigger-pause.spec.ts`

### Task 24: Reduce Card Action Handling To Typed Outcomes

- **Estimate:** 15 minutes
- **Failing test file:** `src/tests/autosnooze-card-mutation.spec.ts`
- **Test name:** `card_applies_pause_interaction_outcomes_without_reimplementing_workflow_rules`
- **Assertions:**
  - Card calls one pause-interaction API.
  - Card applies returned UI effects and does not call pause services, storage services, or schedule validation helpers directly.
  - Card retains event routing, haptics, and rendering decisions.
- **Expected initial failure:** Card still performs validation, confirmation precheck, reset logic, and undo setup inline.
- **Implementation:** Replace `_snooze` workflow branches with typed outcome handling.
- **Verification:**
  - `npm run test -- src/tests/autosnooze-card-mutation.spec.ts src/tests/autosnooze-card-guardrail.spec.ts src/tests/card-passes-recents.spec.ts`

### Task 25: Remove Duplicate Feature Aliases

- **Estimate:** 10 minutes
- **Failing test file:** `ci_contracts/test_resume_ownership_contract.py`
- **Test name:** `test_frontend_features_do_not_export_duplicate_action_aliases`
- **Assertions:**
  - Feature modules export no function whose name ends in `ActionFeature`.
  - `scheduled-snooze/index.ts` exports one cancel use-case function and one adjust use-case function.
  - `pause/index.ts` exports one pause-submission use-case function.
  - `resume/index.ts` exports one function per distinct wake, wake-all, clear-notification, and undo use case.
- **Expected initial failure:** Duplicate action aliases exist.
- **Implementation:**
  - Keep one intentional public API per use case.
  - Update callers to the owning API.
  - Do not remove small feature boundaries solely because their implementation is short.
- **Verification:**
  - `pytest ci_contracts/test_resume_ownership_contract.py -q`
  - `npm run test`
  - `npm run lint:unused:prod`

### Task 26: Add A Card Ownership Budget

- **Estimate:** 10 minutes
- **Failing test file:** `ci_contracts/test_frontend_resource_boundary_contract.py`
- **Test name:** `test_main_card_does_not_reclaim_extracted_workflow_ownership`
- **Assertions:**
  - Card source does not contain registry retry delay mutation or direct registry service imports.
  - Card source does not construct toast DOM nodes or own toast timers.
  - Card source does not contain scheduled-list item markup.
  - Card source does not directly import `services/` or `state/`.
  - Card remains below an initial ceiling of 750 lines, with a documented follow-up target of 600.
- **Expected initial failure:** Current card owns all listed responsibilities and is 1,084 lines.
- **Implementation:** Complete remaining extraction cleanup; remove dead fields and methods.
- **Verification:**
  - `pytest ci_contracts/test_frontend_resource_boundary_contract.py -q`
  - `npm run lint:deps`
  - `npm run typecheck`

### Frontend Checkpoint

Do not begin final enforcement cleanup unless:

- Registry lifecycle and automation caching are outside the card.
- Toast and scheduled-list rendering are focused components.
- Pause interaction rules have one feature owner.
- Duplicate action aliases are removed.
- Card passes the ownership budget and all frontend tests.

## Phase D: Enforcement And Full Validation

### Task 27: Enforce Unique Backend Workflow Ownership

- **Estimate:** 15 minutes
- **Failing test file:** `ci_contracts/test_python_architecture_contract.py`
- **Test name:** `test_backend_workflow_entrypoints_have_one_owner`
- **Assertions:**
  - Approved owner map:
    - pause -> `application/pause.py`
    - resume/cancel/clear-notification -> `application/resume.py`
    - scheduled disable/cancel -> `application/scheduled.py`
    - adjust -> `application/adjust.py`
    - notifications -> `application/notifications.py`
    - restore -> `runtime/restore.py`
    - scheduling/cancellation -> `runtime/timers.py`
  - Fail when named workflow entrypoints are defined outside their approved owner.
- **Expected initial failure:** Any remaining compatibility definitions are reported.
- **Implementation:** Remove remaining duplicate production wrappers. If the ownership scan finds no remaining
  offender, treat this as a verification-only task and do not add a contract that passes without first going red.
- **Verification:** `pytest ci_contracts/test_python_architecture_contract.py -q`

### Task 28: Update Architecture Documentation To Match Reality

- **Estimate:** 10 minutes
- **Failing test file:** `ci_contracts/test_architecture_document_contract.py`
- **Test name:** `test_architecture_document_names_composition_and_ownership_rules`
- **Assertions:** `architecture.md` explicitly documents:
  - `__init__.py` as lifecycle composition root.
  - Explicit runtime callbacks and prohibition of mutable callback registries.
  - One workflow owner per application family.
  - Feature facades representing use cases rather than aliases.
  - UI-specific lifecycle behavior remaining in focused components.
- **Expected initial failure:** Current architecture document lacks these rules.
- **Implementation:** Update `architecture.md`.
- **Verification:** `pytest ci_contracts/test_architecture_document_contract.py -q`

### Task 29: Full Backend Regression Validation

- **Estimate:** 15 minutes
- **Test to write:** None. This is a verification-only task.
- **Implementation:** Fix implementation regressions only; do not weaken tests or contracts.
- **Verification commands:**
  - `python3 -m pytest tests/ -q --cov=custom_components/autosnooze --cov-fail-under=85`
  - `python3 -m pytest ci_contracts -q`
  - `ruff check custom_components/ tests/`
  - `ruff format --check custom_components/ tests/`
  - `pyright custom_components/autosnooze/`
  - `npm run smoke`

### Task 30: Full Frontend Regression Validation

- **Estimate:** 15 minutes
- **Test to write:** None. This is a verification-only task.
- **Implementation:** Fix implementation regressions only; do not weaken tests or contracts.
- **Verification commands:**
  - `npm run test:coverage`
  - `npm run typecheck`
  - `npm run typecheck:test`
  - `npm run lint`
  - `npm run lint:deps`
  - `npm run lint:duplicates`
  - `npm run lint:unused:prod`

### Task 31: Build And Artifact Validation

- **Estimate:** 10 minutes
- **Test to write:** None. This is a verification-only task.
- **Implementation:** Rebuild generated artifacts only; fix source regressions rather than editing generated output manually.
- **Verification commands:**
  - `npm run build`
  - `git diff --exit-code custom_components/autosnooze/www/autosnooze-card.js custom_components/autosnooze/www/autosnooze-card.js.map`

## Final Acceptance Assertions

- `custom_components/autosnooze/coordinator.py` does not exist.
- No production or test file imports or patches `coordinator.py`.
- No runtime module stores higher-layer callbacks in module-global mutable state.
- Every timer and restore workflow receives explicit callbacks.
- Resume and scheduled-disable workflows each have one application owner.
- `services.py` owns one service-name definition used by registration and teardown.
- `services.py` defines no application workflow or compatibility wrapper.
- `autosnooze-card.ts` contains no registry retry algorithm, toast DOM lifecycle, or scheduled-list markup.
- Frontend features expose one intentional API per use case.
- All existing behavioral assertions remain present.
- All backend, frontend, architecture, coverage, build, and artifact gates pass.
