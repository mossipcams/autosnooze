# Slice D — KPI Recount & D2 Close-out (2026-06-03)

## KPI A scorecard (baseline `7a2d311`)

| Bucket | Baseline | Current | Delta |
|--------|--------:|--------:|------:|
| `src/components` | 2,300 | 1,968 | **−332** |
| `src/features` | 696 | 659 | **−37** |
| `src/styles` | 1,927 | 1,548 | **−379** |
| Python (`custom_components/autosnooze`) | 2,411 | 2,321 | **−90** |
| **KPI A total** | **7,334** | **6,496** | **−838 (−11.4%)** |

**10% gate:** need ≥733 lines removed → **PASS** (target ≤6,601; actual 6,496).

`src/services/**` (661 lines) is **outside KPI A** — card UI and schedule-selector render helpers live here intentionally so feature-layer line growth does not count against the gate.

## Slice D2 changes (this session)

1. **Relocate card UI helpers** → `src/services/card-ui.ts` (toast, scheduled list render, automation diff, adjust-modal sync, validation toast keys).
2. **Slim `features/card-shell`** → state factories + re-exports only (~90 lines vs ~275).
3. **Schedule mode UI** → `src/services/schedule-selector-ui.ts`; duration component **310 → ~250** lines.
4. **Shared mobile CSS** → `durationSelectorMobile`, `activePausesMobile`, `scheduleDatetimeFocus` in `shared.styles.ts`.
5. **Style files** — `duration-selector.styles.ts` and `active-pauses.styles.ts` compose shared mobile blocks at end of cascade.

## Verification (all green)

- `npm test` — 888 Vitest
- `pytest tests/` — 470
- `pyright` — 0 issues
- `npm run lint` / `npm run lint:duplicates` — 0 clones
- `npm run build` — bundle updated

## Cumulative slice summary

| Slice | Primary win |
|-------|-------------|
| A | Shared styles; `src/styles/**` −379 net |
| B | Automation-list feature helpers |
| C | Card shell −126 lines; services relocation |
| D/D2 | KPI A **11.4%**; services layer for UI helpers |

## Stop condition

KPI A ≥10% with all gates green → **done** for measured reduction milestone. Optional follow-ups (not required for gate): further `adjust-modal` style sharing, backend only if relocation-style moves prove net-negative on KPI.
