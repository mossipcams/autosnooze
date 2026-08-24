# Tech debt cleanup (post four-agent review)

## Context

Four review agents ranked reliability and UX debt after the Hide snoozed work. This plan ships the highest-ROI slice only.

## Scope

Included:

1. Release `data.lock` before `await async_save` / nested notification tasks (deadlock + latency).
2. Make automation-list tab badge counts respect hide-snoozed filtering.
3. Unify local preference ownership and resolve CardStore dual state.

Excluded:

- Full root `tests/` migration off component test APIs.
- `pause.py` god-module split.
- Countdown render memoization.
- Roadmap phases 8–17 from the adjust milestone (separate track).

## Constraints

- `architecture.md` layering.
- Repo AGENTS.md TDD (failing test first).
- Do not weaken assertions in `tests/`.
- Prefer deletion and small diffs.

## Alternatives

1. Big-bang facade rewrite then lock fix. Rejected: reliability waits behind polish.
2. Prefs-first then badges. Rejected: badges are user-visible now.
3. Lock + badges + prefs in that order. Chosen: risk, then UX, then structure.

## Phases

1. [phase-a-lock-scope.md](phase-a-lock-scope.md)
2. [phase-b-badge-counts.md](phase-b-badge-counts.md)
3. [phase-c-prefs-cardstore.md](phase-c-prefs-cardstore.md)

HA-aligned execution: [implementation.md](implementation.md)

## Verification

- Python: targeted pytest modules for lock/adjust/pause/resume/restore.
- Frontend: `npx vitest run` on automation-list and card storage specs.
- `npm run lint:deps` after preference ownership moves.

## Implementation guidance

- how over unfamiliar subsystems before edits.
- `/deslop` before commit.
- unslop on PR prose.
- show-me-your-work trail in this directory.
