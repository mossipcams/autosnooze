# AutoSnooze Release-Gate Smoke Suite

The deterministic CI release gate is:

```bash
npm run smoke
```

The pytest suite blocks release unless these critical behaviors work:

1. The integration imports and a minimal config entry loads.
2. The core sensor and public services register.
3. A basic snooze records state, updates the sensor, and schedules resume.
4. Invalid input fails without partial runtime state.
5. A paused automation can be resumed cleanly.
6. A future snooze can be scheduled and canceled.
7. Stored active snoozes and schedules recover without duplicates.
8. Unload/reload cleans callbacks and restores one non-duplicated core surface.

## Assertion Standard

Each mutating smoke path verifies all applicable observable outcomes:

- The exact Home Assistant service call and resulting automation state.
- Exact runtime paused, scheduled, and timer membership.
- The public sensor state and attributes.
- Independently decoded storage payload fields, without reusing production serializers for expected values.
- Cleanup of callbacks, services, entities, and stale runtime data.

`tests/test_smoke.py` is included in the backend mutation-test configuration so
critical-path assertion strength is continuously exercised against production mutations.

## CI

`.github/workflows/build.yml` always runs `smoke-backend`. Playwright is not
part of the CI smoke gate because it depends on an external Home Assistant
dashboard. Browser E2E remains available separately with `npm run e2e:smoke`.

## Existing Test Classification

Tests in `tests/test_integration.py` remain broader integration/regression coverage:

- **Move:** config-flow form, duplicate-flow, cancel, adjust, area, label, and detailed validation cases.
- **Replace:** setup, registration, basic pause, invalid duration, and cleanup checks are replaced as release gates by `tests/test_smoke.py`.
- **Keep:** feature-specific integration cases remain outside the smoke command.

Existing Playwright tests remain optional browser regression and visual coverage.

Mock-heavy setup and unload tests in `tests/test_init.py` remain unit tests. They are not release-gate smoke tests because they primarily verify collaborator calls and internal cleanup branches.
