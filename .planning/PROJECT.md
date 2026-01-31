# AutoSnooze

## What This Is

AutoSnooze is a Home Assistant custom integration that temporarily pauses automations with automatic re-enabling. It provides a Lit-based Lovelace card for browsing, filtering, and snoozing automations by duration or schedule, plus backend services for automation-triggered snoozing. Distributed via HACS.

## Core Value

Users can quickly pause any automation and trust it will re-enable itself automatically -- no forgotten disabled automations.

## Requirements

### Validated

- ✓ Snooze individual or multiple automations by duration (days/hours/minutes) -- existing
- ✓ Snooze automations by area or label in bulk -- existing
- ✓ Schedule future snoozes with disable_at and resume_at -- existing
- ✓ Cancel/wake snoozed automations individually or all at once -- existing
- ✓ Cancel scheduled snoozes before activation -- existing
- ✓ Real-time countdown timers on active pauses -- existing
- ✓ Filter automations by All, Area, Category, or Label tabs -- existing
- ✓ Search automations by name or entity_id -- existing
- ✓ Configurable quick-duration preset pills -- existing
- ✓ Include/exclude label-based automation filtering -- existing
- ✓ Toast notifications with undo on snooze/wake actions -- existing
- ✓ Haptic feedback for mobile (HA Companion app) -- existing
- ✓ Two-tap confirmation for Wake All -- existing
- ✓ State persistence across HA restarts -- existing
- ✓ Localization (EN, DE, ES, FR, IT) -- existing
- ✓ Sensor entity exposing snoozed count and attributes -- existing

### Active

- [ ] User can tap an active paused automation to open a modal and adjust remaining time
- [ ] Adjust modal shows current remaining time and allows adding or reducing duration
- [ ] Adjust modal uses smaller increment buttons (+15m, +30m, +1h, +2h / -15m, -30m, etc.)
- [ ] Reducing time below a minimum (e.g. 1 min) is blocked rather than auto-waking
- [ ] User can tap a group header to adjust all automations in that group at once
- [ ] Card component is refactored into smaller sub-components to support modal and future features

### Out of Scope

- Snooze history/audit log -- HA's built-in history and logbook already track automation state changes
- Compact card variant -- not needed this milestone
- Remember last duration -- deferred (in-progress on branch, not part of this milestone)
- Snooze groups/presets -- not needed this milestone
- Recurring snoozes -- high complexity, not core to the snooze use case

## Context

- Existing codebase: Python 3.12+ backend, TypeScript/Lit 3.3.2 frontend, Rollup bundler
- Card component (`autosnooze-card.ts`) is ~1,300 lines and needs to be broken up before adding the adjust modal
- 6 backend services already registered; adjust snooze will need a new service or modification to the existing pause service
- The coordinator manages timers via `async_track_point_in_time` -- adjusting a snooze means canceling the existing timer and scheduling a new one
- Frontend styles are in a separate 1,400-line `card.styles.ts` file
- CI enforces 85% test coverage on both Python and JavaScript
- Mutation testing (Stryker) enforces 70% kill threshold on JavaScript

## Constraints

- **Tech stack**: Must remain a HA custom integration (Python backend + Lit frontend) -- distributed via HACS
- **Compatibility**: Must work with Home Assistant 2024.x+
- **Test coverage**: 85% minimum enforced by CI on both stacks
- **Bundle**: Frontend must bundle to single ES module file via Rollup, no bare `lit` imports in output
- **Version sync**: package.json and manifest.json versions must match

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Modal for adjust UX (not inline edit) | Cleaner interaction, avoids cluttering the paused items list | -- Pending |
| Smaller increment buttons (+/-15m, 30m, 1h, 2h) | Adjusting is different from initial snooze -- users want quick tweaks, not full duration entry | -- Pending |
| Block reduce below minimum (not auto-wake) | Prevents accidental wake-up; explicit wake button already exists | -- Pending |
| Refactor card before adding modal | 1,300-line component is too large to add modal cleanly; refactor enables this and future features | -- Pending |

---
*Last updated: 2026-01-31 after initialization*
