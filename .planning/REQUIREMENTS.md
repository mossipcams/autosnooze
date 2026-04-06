# Requirements: AutoSnooze

**Defined:** 2026-01-31
**Core Value:** Users can quickly pause any automation and trust it will re-enable itself automatically

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Adjust Snooze

- [x] **ADJ-01**: User can tap an active paused automation to open an adjust modal
- [x] **ADJ-02**: Modal displays current remaining time for the paused automation
- [x] **ADJ-03**: Modal provides smaller increment buttons (+15m, +30m, +1h, +2h) to add time
- [x] **ADJ-04**: Modal provides decrement buttons (-15m, -30m) to reduce time
- [x] **ADJ-05**: Reducing time below minimum (1 min) is blocked (buttons disabled)
- [x] **ADJ-06**: User can tap a group header to adjust all automations in that group at once
- [x] **ADJ-07**: Backend service supports modifying resume time of an active snooze
- [x] **ADJ-08**: Existing timer is canceled and new timer scheduled on adjustment

### Card Refactoring

- [x] **REF-01**: Main card component broken into smaller sub-components
- [x] **REF-02**: Active pauses section extracted to its own component
- [x] **REF-03**: Duration selector extracted to its own component
- [x] **REF-04**: Filter tabs / automation list extracted to its own component
- [x] **REF-05**: Adjust modal implemented as a separate component
- [x] **REF-06**: All existing tests pass after refactoring
- [x] **REF-07**: CI coverage thresholds still met (85% both stacks)

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Convenience

- **CONV-01**: Remember last used duration and offer as preset pill
- **CONV-02**: Compact card variant for phone dashboards

### Power User

- **PWR-01**: Named snooze groups for one-tap bulk snoozing
- **PWR-02**: Recurring snooze schedules

## Out of Scope

| Feature | Reason |
|---------|--------|
| Snooze history/audit log | HA built-in history and logbook already track automation state changes |
| Notifications on resume | Can be built with HA automations watching the sensor entity |
| Auto-snooze triggers | Out of scope for the card integration; users can build with HA automations + services |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REF-02 | Phase 1 | Complete |
| REF-03 | Phase 2 | Complete |
| REF-04 | Phase 3 | Complete |
| REF-01 | Phase 4 | Complete |
| REF-06 | Phase 4 | Complete |
| REF-07 | Phase 4 | Complete |
| ADJ-07 | Phase 5 | Complete |
| ADJ-08 | Phase 5 | Complete |
| REF-05 | Phase 6 | Complete |
| ADJ-01 | Phase 6 | Complete |
| ADJ-02 | Phase 6 | Complete |
| ADJ-03 | Phase 6 | Complete |
| ADJ-04 | Phase 6 | Complete |
| ADJ-05 | Phase 6 | Complete |
| ADJ-06 | Phase 7 | Complete |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after roadmap creation*
