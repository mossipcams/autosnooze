# Phase A: Lock scope

Back: [overview.md](overview.md)

## Goal

`await async_save` and nested notification tasks never run while `data.lock` is held.

## Changes

- `custom_components/autosnooze/application/adjust.py`
- `custom_components/autosnooze/application/pause.py`
- `custom_components/autosnooze/application/resume.py`
- `custom_components/autosnooze/application/scheduled.py`
- `custom_components/autosnooze/runtime/restore.py`
- New or extended tests under `tests/` proving lock is acquirable during save.

## Data structures

No new types. Same `AutomationPauseData.lock` semantics: protect dict mutations; release before I/O awaits.

## Verification

Static: pytest on services coverage, coordinator, runtime, persistence modules.
Runtime: no HA UI surface for this path; unit test with slow save is the proof.
