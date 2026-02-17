# Architecture Remediation Plan

## Goal
Resolve the architectural and reliability issues identified in the full codebase review using small, TDD-first tasks.

## Tasks (5-15 min each)

1. CI e2e gate contract (10m)
- What test to write: Add a workflow contract test in `tests/test_card_bundle.py` asserting `.github/workflows/build.yml` includes an e2e step/job.
- What code to implement: Add the failing test only.
- How to verify: Run `pytest tests/test_card_bundle.py -k e2e`.

2. Add e2e smoke job to CI (15m)
- What test to write: Use Task 1 test (red first).
- What code to implement: Add an `e2e-smoke` job/step in `.github/workflows/build.yml` (single browser, minimal suite) and make it required on PRs.
- How to verify: Rerun `pytest tests/test_card_bundle.py -k e2e` and `actionlint`.

3. Artifact sync contract (10m)
- What test to write: Add a workflow contract test asserting CI runs build + checks no diff for `custom_components/autosnooze/www/autosnooze-card.js`.
- What code to implement: Add the failing test only.
- How to verify: `pytest tests/test_card_bundle.py -k artifact`.

4. Enforce generated artifact freshness (10m)
- What test to write: Task 3 test (red first).
- What code to implement: In `.github/workflows/build.yml`, add `npm run build` then `git diff --exit-code custom_components/autosnooze/www/autosnooze-card.js`.
- How to verify: Rerun `pytest tests/test_card_bundle.py -k artifact` and `actionlint`.

5. Mutation config validity tests (10m)
- What test to write: Add tests asserting `stryker.config.mjs` uses `vitest.config.mjs` and TS mutate globs; add test asserting all `tool.mutmut.tests_dir` paths exist.
- What code to implement: Tests only.
- How to verify: `pytest tests/test_card_bundle.py -k mutation`.

6. Fix mutation configs (10m)
- What test to write: Task 5 tests (red first).
- What code to implement: Update `stryker.config.mjs`, optionally remove/align `stryker.config.json`, and fix `pyproject.toml` `tool.mutmut.tests_dir`.
- How to verify: Rerun mutation config tests; run `npx stryker run --dry-run` (if installed).

7. Unload-race backend test (10m)
- What test to write: In `tests/test_services_coverage.py`, add failing tests that service handlers no-op when `data.unloaded=True`.
- What code to implement: Tests only.
- How to verify: `pytest tests/test_services_coverage.py -k unloaded`.

8. Unload guards implementation (10m)
- What test to write: Task 7 tests (red first).
- What code to implement: Add unloaded guards in pause/filter entrypoints in `custom_components/autosnooze/services.py` and shared paths.
- How to verify: Rerun targeted tests + `pytest tests/test_services_coverage.py`.

9. Restore-lock race test (15m)
- What test to write: In `tests/test_coordinator.py`, add failing test proving `async_load_stored` is lock-protected against concurrent mutation.
- What code to implement: Tests only.
- How to verify: `pytest tests/test_coordinator.py -k load_stored_lock`.

10. Restore-lock implementation (10m)
- What test to write: Task 9 test (red first).
- What code to implement: Wrap critical sections in `async_load_stored` with `async with data.lock:` in `custom_components/autosnooze/coordinator.py`.
- How to verify: Rerun targeted coordinator tests.

11. Save-failure propagation tests + implementation (15m)
- What test to write: Failing tests in `tests/test_services_coverage.py` and `tests/test_coordinator.py` asserting failed `async_save` surfaces as service error (no silent success).
- What code to implement: In `custom_components/autosnooze/services.py` and/or coordinator call sites, handle `async_save(...) is False` by raising `ServiceValidationError` with translation key.
- How to verify: Rerun targeted tests.

12. Frontend resilience + modular refactor slice (15m)
- What test to write:
  - Failing test for label-registry failure fallback (automations still visible + warning),
  - Failing test for missing sensor health banner,
  - Failing undo partial-failure behavior test (all-settled semantics),
  - Safety tests before extracting action handlers from `src/components/autosnooze-card.ts`.
- What code to implement: Update `src/state/automations.ts`, `src/components/autosnooze-card.ts`, and extract one controller module (actions/services glue) without behavior change.
- How to verify: `npm run test`, `npm run typecheck`, and focused spec runs for card UI.

13. Performance follow-up (10m)
- What test to write: Add targeted `shouldUpdate` regression test verifying no full automation scan when no relevant entity change.
- What code to implement: Introduce lightweight automation-state fingerprint/version tracking in `src/components/autosnooze-card.ts`.
- How to verify: `npm run test -- tests/test_card_ui.spec.ts` + full `npm run test`.

14. Final full validation (10m)
- What test to write: None (validation step).
- What code to implement: None.
- How to verify:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test:coverage`
  - `.venv/bin/pytest tests/ --cov=custom_components/autosnooze --cov-report=term-missing`
  - `actionlint`

