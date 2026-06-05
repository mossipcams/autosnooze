# AutoSnooze Phase 0 Baselines

Recorded on 2026-06-05 before the optimization phases.

## Backend Pause Batch

The characterization test covers batches of 1, 10, 50, and 100 entities.

| Entities | HA calls | Saves | Publications | Resume timers | Current execution |
| ---: | ---: | ---: | ---: | ---: | --- |
| 1 | 1 | 1 | 1 | 1 | Serial |
| 10 | 10 | 1 | 1 | 10 | Serial |
| 50 | 50 | 1 | 1 | 50 | Serial |
| 100 | 100 | 1 | 1 | 100 | Serial |

Pause command logs now include `entity_count`, `ha_call_count`, `save_count`,
`publication_count`, `timer_count`, and `max_lock_hold_ms`.

## Frontend

The 500-automation characterization fixture records:

- Unrelated Home Assistant state reference change: 2 automation-list view-model builds.
- One active-pause countdown tick: 1 broad active-pauses component update.
- Targeted Vitest file: 2 tests in 6 ms.

## Built Card

After `npm run build`:

- `custom_components/autosnooze/www/autosnooze-card.js`: 170,128 bytes.
- `custom_components/autosnooze/www/autosnooze-card.js.map`: 138,048 bytes.
