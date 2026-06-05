# Phase 5: Coalesce Timers, Persistence, And Sensor Publication

## Status

**Complete.** Resume timers group by deadline, expiry runs one batch resume, snapshot-versioned notify skips duplicate publications, and coalesced saves preserve the latest snapshot.

## Tasks

### Task 1: Deadline-grouped resume timers
- **Test:** `test_same_deadline_pauses_create_one_runtime_deadline_callback`, `test_distinct_deadlines_schedule_only_distinct_deadline_count` in `tests/test_runtime_modules.py`
- **Implement:** Group `schedule_resume` by `resume_at`; one HA timer per distinct deadline
- **Verify:** targeted runtime module tests

### Task 2: Batch expiry on deadline fire
- **Test:** `test_deadline_callback_resumes_all_due_entities_in_one_batch` in `tests/test_runtime_modules.py`
- **Implement:** Deadline callback invokes `async_resume_batch`; wire in `runtime_wiring.py`
- **Verify:** runtime + transition performance tests

### Task 3: Single save/publication on same-deadline expiry
- **Test:** `test_same_deadline_expiry_saves_and_notifies_once` in `tests/test_transition_performance.py`
- **Implement:** Batch expiry path already commits once; ensure timer wiring uses batch callback
- **Verify:** transition performance test

### Task 4: Snapshot-versioned sensor publication
- **Test:** `test_sensor_does_not_publish_when_snapshot_version_is_unchanged` in `tests/test_dispatcher_updates.py`
- **Implement:** Bump snapshot version on state mutation; skip dispatcher when unchanged
- **Verify:** dispatcher test

### Task 5: Coalesced persistence writer
- **Test:** `test_coalesced_writer_preserves_latest_snapshot_and_safety_writes` in `tests/test_persistence_robustness.py`
- **Implement:** Coalesce rapid non-critical saves; immediate flush for safety-critical boundaries
- **Verify:** persistence robustness test

## Phase gate

```bash
pytest tests/test_runtime_modules.py tests/test_transition_performance.py tests/test_persistence_robustness.py tests/test_dispatcher_updates.py -q
pytest tests/ -q
```
