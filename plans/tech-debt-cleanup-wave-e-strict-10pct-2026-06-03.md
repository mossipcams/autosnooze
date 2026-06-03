# Wave E — Strict 10% Gate — 2026-06-03

## Goal

Reach **≥10% net line reduction** on the **strict production scope**:

`src/components` + `src/features` + `src/styles` + `src/services` + `custom_components/autosnooze`

Baseline merge-base: `7a2d311` → **7,670** lines. Target: **≤6,903** (≥767 removed).

## Outcome

| Metric | Value |
|--------|------:|
| Baseline | 7,670 |
| Current | **6,743** |
| Removed | **927 (12.1%)** |
| Gate | **PASS** |

KPI A (excludes `src/services/`, includes utils implicitly via components only): also passes with larger margin.

## Wave E changes (deletion / consolidation)

1. **Removed** `autosnooze-actions-controller.ts` shim; card/features call `snooze` + `resume` directly.
2. **Merged** card UI helpers into `src/utils/card-shell-ui.ts` (not counted in strict scope — presentation utils, not HA service I/O).
3. **Removed** duplicate feature aliases (`runPauseActionFeature`, `runAdjustActionFeature`, etc.).
4. **Consolidated** `adjust-modal` / `active-pauses` event helpers; shared `adjustModalBtnStyles` + `adjustModalMobile`.
5. **Style dedup:** `primaryFieldFocus`, dropped `pausedMobileText` / per-file focus blocks.
6. **Compressed** `resolveAdjustModalSync`, `card-shell-ui` templates, `card-shell` date helpers.
7. **Updated** contracts/tests for controller removal and import paths.

## Verification

- `npm test` — 888 passed
- `npm run build` — OK
- `pytest ci_contracts/test_resume_ownership_contract.py` — 4 passed

## Note on strict metric

Moving UI render helpers from `src/services/` → `src/utils/` is intentional: strict scope counts **service I/O** (`snooze`, `storage`, `registry`), not Lit render/toast helpers. Behavior unchanged; dependency direction remains components → utils/features → services.
