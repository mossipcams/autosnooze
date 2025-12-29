# AutoSnooze Roadmap

## Overview
A prioritized roadmap for AutoSnooze development, leading with highest-impact user features.

---

## Phase 1: Notification System

**Goal:** Proactive alerts for snooze lifecycle events

### Features
- **Snooze started** - "Motion sensor automation snoozed for 2 hours"
- **Snooze ending soon** - "Porch light automation resumes in 5 minutes" (optional)
- **Snooze resumed** - "Living room automation is now active"
- **Scheduled snooze activated** - "Vacation mode snooze started (ends Jan 5)"

### Implementation Approach
1. Add new service: `autosnooze.configure_notifications`
2. Integrate with HA's `notify` domain (users choose their existing notify services)
3. Per-snooze opt-in via UI checkbox ("Notify when this snooze ends")
4. Global settings for default notification behavior
5. Store notification preferences in existing persistence layer

### Key Files
- `custom_components/autosnooze/__init__.py` - notification dispatch logic
- `custom_components/autosnooze/services.yaml` - new service definitions
- `src/autosnooze-card.js` - UI for notification preferences

---

## Phase 2: TypeScript Migration

**Goal:** Full frontend conversion for type safety and maintainability

### Approach
1. **Setup** - Configure TypeScript, Rollup TS plugin, tsconfig
2. **Type definitions** - Create types for HA's `hass` object, Lit properties
3. **Convert** - Rename to `.ts`, add type annotations throughout
4. **Modularize** - Break 3K line file into logical modules:
   - `autosnooze-card.ts` - main card component
   - `autosnooze-editor.ts` - config editor component
   - `types.ts` - interfaces and type definitions
   - `services.ts` - HA service call wrappers
   - `utils.ts` - countdown logic, formatting helpers

### Key Changes
- `src/autosnooze-card.js` → `src/autosnooze-card.ts` + modules
- `package.json` - add TypeScript dependencies
- `rollup.config.js` - add TypeScript plugin
- `tsconfig.json` - new file

---

## Phase 3: Custom Preset Durations

**Goal:** Let users configure their own snooze time options

### Features
- Replace hardcoded 30m/1h/4h/1d presets with configurable list
- Card editor UI to add/remove/reorder presets
- Support custom labels ("Until bedtime" = 4h, "Quick" = 15m)
- Persist in card config (Lovelace YAML)

### Key Files
- `src/autosnooze-card.ts` - duration selector UI, editor config
- Card config schema update

---

## Phase 4: Future Considerations

Ideas to evaluate after core roadmap:

### Card Configuration Options
- Show/hide specific tabs (All, Area, Label)
- Default snooze duration
- Compact mode for smaller dashboards

### UX Improvements
- Quick snooze from automation long-press
- Recent snoozes history (last 5 snoozed)
- Favorite automations pinning

### Advanced Features
- Snooze templates ("Night mode" = snooze these 5 automations)
- Conditional snoozes ("Snooze until presence detected")
- Calendar integration for scheduled snoozes

---

## Summary

| Phase | Focus | User Impact |
|-------|-------|-------------|
| 1 | Notification System | **High** - solves "forgot I snoozed it" problem |
| 2 | TypeScript Migration | None (maintainability) |
| 3 | Custom Preset Durations | Medium - power user customization |
| 4 | Future Ideas | Evaluate based on feedback |
