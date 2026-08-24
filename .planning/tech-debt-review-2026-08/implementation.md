# Implementation plan (HA-aligned)

Back: [overview.md](overview.md)

Status: implementing (user: reliability and no errors or defects displayed to the user)

## Product goal

Prevent deadlocks, mismatched UI, and configuration-error cards. Keep Home Assistant’s default `callService` error toasts for pause/wake/adjust/cancel (user: keep those toasts). Telemetry still uses `notifyOnError=false`.

## Why the previous pass was insufficient

- Phases A and B were already correct in production. Adding green characterization tests did not change behavior.
- Phase C added one-line `loadCard*` / `saveCard*` wrappers. Those match the existing card-shell facade (`loadCardLastDuration`), but they did not finish ownership: the card still imports hide-snoozed telemetry from the automation-list feature.
- `infrastructure/storage.async_save` still copies `paused` / `scheduled` **without** `data.lock`, then awaits `Store.async_save`. Callers release the mutation lock first (good), but the snapshot itself can tear while another coroutine mutates the dicts.

## Home Assistant practices this plan follows

Backend (custom integration):

- Do not hold `asyncio.Lock` across I/O. `homeassistant.helpers.storage.Store.async_save` is I/O.
- Snapshot a JSON-serializable payload under the mutation lock with **no await**, then persist that copy. HA Store already coalesces writes; we keep `save_lock` so retries cannot interleave two payloads.
- `async_track_point_in_time` registration is synchronous/`@callback`. Scheduling timers under `data.lock` is acceptable; awaiting notifications or Store I/O under it is not.

Frontend (Lovelace custom card):

- Persist only UI chrome (hide-snoozed, last duration, recents) in `localStorage`. Do not persist in-progress selection or duration picker state — those stay Lit `@state`.
- The Lit card must not import `services/storage` directly (`architecture.md`: `components -> features -> services`).
- Hide-snoozed is card-shell owned, including its telemetry. Automation-list owns filtering/view-model only.
- Lovelace YAML `config` is for dashboard-author settings, not per-browser chrome. Keep hide-snoozed in localStorage.

## Non-goals (unchanged)

- Root `tests/` API migration, `pause.py` split, countdown memoization, adjust roadmap 8–17.
- Syncing hide-snoozed across devices via `Store` / a sensor (would be a new feature).
- Per-user localStorage keys (`hass.user` is not on our `HomeAssistant` type yet).

## Tasks

Each code-changing task is red-green TDD. Do not weaken assertions.

### Task 1 — Store snapshot under `data.lock` (backend)

**Test:** extend `tests/test_lock_release_before_save.py` (or persistence tests) so a slow `Store.async_save` proves:

1. `data.lock` is acquirable during the await.
2. The payload passed to `Store.async_save` was copied before the await (mutations after snapshot do not change that payload).

**Code:** `custom_components/autosnooze/infrastructure/storage.py` — copy `get_paused_dict()` / `get_scheduled_dict()` under `data.lock`, release, then `async with data.save_lock: await store.async_save(payload)`.

**Verify:** `pytest tests/test_lock_release_before_save.py tests/test_persistence_robustness.py tests/test_runtime_modules.py tests/test_coordinator.py -q`

### Task 2 — Badge counts (frontend, already done)

No production change. Keep the UI assertion in `src/tests/automation-list-mutation.spec.ts`.

**Verify:** `npx vitest run src/tests/automation-list-feature-mutation.spec.ts src/tests/automation-list-mutation.spec.ts`

### Task 3 — Hide-snoozed ownership in card-shell (frontend)

**Test:** card-shell exports hide-snoozed load/save **and** `trackHideSnoozedToggled`. Automation-list does not export storage helpers or hide-snoozed telemetry. Card imports those only from card-shell.

**Code:**

- Move `trackHideSnoozedToggled` from `src/features/automation-list/index.ts` to `src/features/card-shell/index.ts`.
- Keep card-shell facades (same pattern as last-duration). Card stops importing automation-list for this pref.
- Selection/duration remain Lit `@state` only.

### Task 5 — Pause must not succeed when nothing was snoozed

If every `turn_off` fails, the service still returns OK and the card shows a success toast. Raise a translated `ServiceValidationError` so Home Assistant’s error toast appears (keep those toasts) and the card fail-closed path runs.

- [x] Task 5 failing test in `tests/test_application_pause.py`
- [x] Task 5 implementation + `pause_failed` exception translation
- [x] Task 5 pytest green

Verify: `pytest tests/test_application_pause.py tests/test_logging_utils.py -q`

### Task 6 — Registry fetch failures retry

Label registry already retries on `null`. Category/entity fetches return `{}` on error and never retry, so grouping stays empty until remount.

- [x] Task 6 failing test in `src/tests/card-shell-controller.spec.ts`
- [x] Task 6: return `null` on fetch failure; retry like labels
- [x] Task 6 vitest green

Verify: `npx vitest run src/tests/card-shell-controller.spec.ts`

## Checklist

- [x] Task 1 failing test (snapshot + lock released during Store I/O)
- [x] Task 1 implementation in `infrastructure/storage.py`
- [x] Task 1 pytest green
- [x] Task 2 badge UI assertion (already in working tree)
- [x] Task 3 failing test (card-shell owns hide-snoozed telemetry)
- [x] Task 3 implementation
- [x] Task 3 vitest + lint:deps green
- [x] Task 4 reverted: keep HA Lovelace error toasts on snooze service failures
- [x] Task 5 pause fails the service when nothing was applied
- [x] Task 6 registry fetch failures retry (shared timer retries all unloaded registries)
