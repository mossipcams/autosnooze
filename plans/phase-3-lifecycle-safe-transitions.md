# Phase 3: Lifecycle-Safe Transitions And Short Lock Holds

## Tasks

### Task 1: Runtime lifecycle and persistence commit helpers
- **Test**: `test_slow_persistence_does_not_hold_runtime_lock`, `test_unload_waits_for_or_invalidates_in_flight_commands`
- **Code**: Extend `AutomationPauseData` with lifecycle/entity generations and in-flight tracking; add `runtime/persistence_commit.py` and snapshot-based save
- **Verify**: Targeted pytest for lifecycle and persistence tests

### Task 2: Refactor application commands to persist outside lock
- **Test**: Existing coordinator/services lock-hold tests continue to pass
- **Code**: Update `pause.py`, `resume.py`, `scheduled.py`, `adjust.py` to commit under lock and persist outside
- **Verify**: `pytest tests/test_coordinator.py tests/test_services_coverage.py -q`

### Task 3: Persistence failure recovery and unload coordination
- **Test**: `test_persistence_failure_after_ha_effect_creates_recovery_state`
- **Code**: Mark `recovery_required` on save failure after HA effects; unload waits for in-flight commands
- **Verify**: Phase 3 targeted verification + phase gate
