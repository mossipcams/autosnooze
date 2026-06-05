# Phase 4: Optimize Backend Batch Execution

## Status

**Complete.** Pause and resume batch commands share bounded concurrency via `application/batching.py`. All Phase 4 tests pass.

## Tasks

### Task 1: Shared batch concurrency helper

- **Test:** `test_pause_batch_never_exceeds_configured_concurrency` in `tests/test_application_batching.py`
- **Implement:** Extract `BATCH_CONCURRENCY` and `_set_state_bounded` to `application/batching.py`; use in pause disable/replacement paths
- **Verify:** `pytest tests/test_application_batching.py::test_pause_batch_never_exceeds_configured_concurrency -q`

### Task 2: Ordered partial batch outcomes

- **Test:** `test_batch_returns_ordered_per_entity_partial_results` in `tests/test_application_batching.py`
- **Implement:** Return `TransitionResult` from `async_pause_automations` with per-entity outcomes (success/rejected for HA failures)
- **Verify:** `pytest tests/test_application_batching.py::test_batch_returns_ordered_per_entity_partial_results -q`

### Task 3: Stale concurrent batch compensation

- **Test:** `test_stale_result_during_concurrent_batch_is_compensated` in `tests/test_application_batching.py`
- **Implement:** Ensure pause batch respects entity generation after concurrent HA calls (mirror resume batch)
- **Verify:** `pytest tests/test_application_batching.py::test_stale_result_during_concurrent_batch_is_compensated -q`

### Task 4: Single save/publication for 50-entity batch

- **Test:** `test_fifty_entity_batch_saves_and_publishes_once` in `tests/test_transition_performance.py`
- **Implement:** Confirm pause batch still commits once and publishes once (adjust if regression)
- **Verify:** `pytest tests/test_transition_performance.py::test_fifty_entity_batch_saves_and_publishes_once -q`

### Task 5: Bounded latency characterization

- **Test:** `test_batch_latency_is_bounded_by_concurrency_not_entity_count` in `tests/test_transition_performance.py`
- **Implement:** Deterministic blocked-call probe proving concurrency-bound timing for pause/resume
- **Verify:** `pytest tests/test_transition_performance.py::test_batch_latency_is_bounded_by_concurrency_not_entity_count -q`

## Phase gate

```bash
pytest tests/test_application_batching.py tests/test_transition_performance.py -q
pytest tests/ -q
npm run mutation:backend
```
