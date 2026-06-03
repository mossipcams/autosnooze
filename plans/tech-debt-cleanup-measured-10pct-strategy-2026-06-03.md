# Measured 10% Reduction Strategy - 2026-06-03

## Diagnosis: Why The Current Approach Stalls At ~4.6%

| Approach tried | Result | Why it plateaus |
|----------------|--------|-----------------|
| Coordinator/service micro-helpers | `coordinator.py` 546 → **509** (net −37) while adding `_handle_wake_failure`, `_clear_paused_after_wake`, etc. | Helpers **delete duplication but add function overhead**; backend is only **25%** of scoped lines. |
| `services.py` pause relocation | **362 → 136** (−226) | **Rare win**: moved code, did not duplicate it. This is the pattern that works. |
| Frontend style tweaks | ~238 TS lines removed | Spread thin; largest files barely moved (`autosnooze-card.ts` 989 → **941**, only −48). |
| `lint:duplicates` (jscpd) | **0 clones** | Obvious copy-paste is gone; remaining bulk is **structural repetition** (tabs, list rows, CSS variants) jscpd does not count. |

**Scoped inventory today** (merge-base `7a2d311`):

| Bucket | Lines | % of scope | Removed so far |
|--------|------:|----------:|---------------:|
| TypeScript (`src/components`, `features`, `styles`) | 4,685 | 50.6% | ~238 (4.8%) |
| Python (`custom_components/autosnooze`) | 2,321 | 25.0% | ~90 (3.7%) |
| Built bundle (`autosnooze-card.js`) | 2,260 | 24.4% | ~118 (build artifact) |
| **Total** | **9,266** | 100% | **~449 (4.6%)** |

**Gap to 10%:** ~520 more lines. Backend cannot supply that without risky behavior changes. **≥400 lines must come from frontend authoring source.**

## Strategy Shift: Deletion Budget, Not Abstraction Budget

### Principles

1. **Net lines removed is the acceptance criterion** — each task must show `git diff --shortstat` net negative on its target paths before merge. Reject tasks that only move code or add helpers.
2. **Pause backend micro-refactors** — no more coordinator wrapper/alias tasks unless a dry-run diff proves **≥30 net lines removed** in the same change.
3. **Split the scorecard** — track two KPIs so progress is visible:
   - **KPI A (primary):** `src/components` + `src/features` + `src/styles` + Python → target **≥10%** vs baseline **7,334** lines → **≤6,601** (need **~733** removed; **~495** to go).
   - **KPI B (secondary):** bundle line count — rebuild after frontend changes; informational only (not a refactor target itself).
4. **Frontend-first sequencing** — attack files that are large *and* structurally repetitive, not files already deduped by jscpd.
5. **Structural consolidation over helpers** — prefer data-driven render (`tabs[]`, `fields[]`, shared `css` fragments) that **eliminates repeated blocks**, not thin wrappers that preserve block count.
6. **Keep behavior contracts** — existing Vitest + HA tests remain the UX/functionality gate; add reduction guards only where they prevent regression of consolidation.

### ROI-Ranked Targets (estimated net removable)

| Priority | Target | Current lines | Mechanism | Est. net removal |
|----------|--------|--------------:|-----------|-----------------:|
| P0 | `src/styles/automation-list.styles.ts` + siblings | ~1,868 styles total | Extract `src/styles/shared/` primitives (buttons, list rows, focus/hover/mobile) imported by 4 style modules | **120–200** |
| P1 | `autosnooze-automation-list.ts` | 474 | Tab descriptor array + single tab renderer; shared empty/recent helpers (structural wave Tasks 13–14) | **80–120** |
| P2 | `autosnooze-card.ts` | 941 | Collapse repeated shell/toast/modal wiring; delegate more to `features/*` without adding new public surfaces | **60–100** |
| P3 | `autosnooze-duration-selector.ts` + styles | 310 + 452 | Schedule field metadata map (Task 5 from prior plan) | **40–70** |
| P4 | `active-pauses` component + styles | 183 + 233 | Shared list-row + group header fragments | **30–50** |
| — | Backend (`coordinator`, etc.) | — | **Frozen** unless relocation-style move with proven net negative | **0** (default) |

**P0+P1 alone can close the 10% gap** if executed with strict net-line gates.

## Execution Model: Measured Slices (not open-ended tech-debt waves)

Each slice is **one file cluster**, **one PR-sized change**, **one mandatory recount**:

```
1. Record baseline lines for target paths
2. Write failing reduction guard (structural, not jscpd)
3. Implement consolidation
4. Verify: npm test subset + build + shortstat shows net negative ≥ slice budget
5. Stop; user approves next slice
```

**Do not** stack multiple slices without recount — that hid the backend diminishing returns.

## Revised Task Queue (replaces Tasks 26–27 helper-chasing)

### Slice A: Shared style primitives (P0) — In progress

- Consolidated cross-component CSS into `src/styles/shared.styles.ts` (focus, touch targets, warning surfaces, chip active, buttons, mobile touch, field focus).
- `src/styles/**` git diff: **−30 net lines** on tracked files (structural dedup; shared module adds central definitions).
- Guards: `style-shared-reduction.spec.ts`; existing style reduction + UI tests green (262 tests in style/UI slice).
- **Note:** Line budget (≥120) needs Slice A2 (automation-list mobile trim) or Slice B to avoid shared-module overhead counting against KPI.

### Slice A (reference): Shared style primitives (P0)

- **Budget:** ≥120 net lines removed from `src/styles/**`
- **Test:** extend `card-style-reduction`, `automation-list-style-reduction`, `duration-selector-style-reduction` to assert shared import from `src/styles/shared/*.ts` and fail on re-expanded duplicate selector blocks
- **Implement:** `shared/buttons.ts`, `shared/list.ts`, `shared/surfaces.ts` (names TBD after reading files); migrate duplicated blocks
- **Verify:** `npm test -- src/tests/*style-reduction*` + visual-equivalent behavior tests + `npm run build` + shortstat

### Slice B: Automation list structure (P1)

- **Budget:** ≥80 net lines from `autosnooze-automation-list.ts`
- **Test:** `autosnooze-automation-list-reduction.spec.ts` — single tab render path, single empty helper
- **Implement:** Tasks 13–14 from structural wave plan
- **Verify:** automation list + card UI tests

### Slice C: Card shell slimming (P2)

- **Budget:** ≥60 net lines from `autosnooze-card.ts`
- **Test:** existing `card-shell-reduction` / `card-render-helper-reduction` guards
- **Implement:** remove duplicate modal/toast/list wiring already covered by features
- **Verify:** card UI + mutation tests + build

### Slice D: Recount & gate (mandatory)

- Recount KPI A; if **≥10%**, stop and document; else run Slice D2 (duration selector) or reassess scope with user

## What We Stop Doing

- Coordinator resume/adjust/cancel micro-helper extractions (low/negative ROI)
- Counting reduction guards as “production work” (they live in `src/tests`, good — but they don't remove lines)
- Treating bundle shrink as primary progress (symptom of source shrink)

## Success Criteria

- **KPI A ≥10%** (`≤6,601` authoring lines) with all existing gates green
- No change to HA service schemas, card UX flows, accessibility labels, or pause/resume semantics
- Each merged slice shows negative shortstat on its declared paths
