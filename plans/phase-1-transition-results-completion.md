# Phase 1 Completion Tasks

## Remaining work

1. **Tests** — Add `test_restore_only_removes_record_after_confirmed_enabled_state` and `test_storage_version_failure_surfaces_actionable_recovery_result`; update coordinator retry-exhaustion test for recovery retention.
2. **Pause/scheduled** — Capture `originally_enabled` before disable; skip HA disable when already off.
3. **Restore** — Retain records on failed re-disable; propagate unsupported storage version errors.
4. **Coordinator** — Align timer resume path with application recovery semantics.

## Verification

```bash
pytest tests/test_transition_results.py tests/test_models_coverage.py tests/test_recovery_invariants.py tests/test_persistence_robustness.py tests/test_schema_version_contract.py -q
pytest tests/ -q --cov=custom_components/autosnooze --cov-report=term-missing
npm run mutation:backend
```
