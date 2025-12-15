# AutoSnooze

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/mossipcams/autosnooze.svg)](https://github.com/mossipcams/autosnooze/releases)
[![License](https://img.shields.io/github/license/mossipcams/autosnooze.svg)](LICENSE)


Temporarily pause Home Assistant automations for a set duration. Perfect for guests, parties, vacations, or maintenance.

## Features

All features from the Product Requirements Document (PRD) have been implemented:

### Selection Capabilities (Section 3.1)

- **FR-01: Individual Multi-Select** ✓ - Tap automations to select/deselect
- **FR-02: Selection by Area** ✓ - Filter and bulk-select by room/area
- **FR-03: Selection by Label** ✓ - Filter and bulk-select by tags
- **FR-04: Search/Filter** ✓ - Search automations by name

### Snooze Actions (Section 3.2)

- **FR-05: Duration Input** ✓ - Preset pills (30m, 1h, 4h, 1 day) + Custom
- **FR-06: Auto-Re-enable** ✓ - Automations automatically wake when timer expires
- **FR-07: Persistence** ✓ - Survives system restarts

### Active Snooze Management (Section 3.3)

- **FR-08: Status Visibility** ✓ - Displays all snoozed automations
- **FR-09: Countdown Timer** ✓ - Real-time countdown for each snoozed item
- **FR-10: Early Wake Up** ✓ - "Wake Now" and "Wake All" buttons

### User Experience (Section 4)

**Section A: Snooze Setup**
- Three filter tabs: All / Areas / Labels
- Collapsible groups with bulk select
- Search bar for quick filtering
- Duration preset pills with custom option
- Prominent Snooze button (disabled until selection made)

**Section B: Active Snoozes**
- Amber border indicating overridden state
- Sleep icons on snoozed items
- Countdown timers showing time remaining
- Individual "Wake Now" buttons
- "Wake All" button for bulk operations

**Additional UX Features**
- Toast notifications confirming actions
- Real-time countdown updates
- Theme-compatible (light/dark mode)
- Mobile-responsive design

## Installation

### HACS (Recommended)

1. Add as custom repository
2. Install "AutoSnooze"
3. Restart Home Assistant

### Manual

1. Copy `custom_components/autosnooze` to your `config/custom_components/`
2. Copy `www/autosnooze-card.js` to your `config/www/`
3. Restart Home Assistant

## Configuration

### Add Integration

1. Settings → Devices & Services → Add Integration
2. Search for "AutoSnooze"
3. Click to add

### Add Dashboard Card

```yaml
type: custom:autosnooze-card
title: AutoSnooze
```

Or use the visual editor:
1. Edit Dashboard → Add Card
2. Search for "AutoSnooze Card"

## Usage Examples

### The Host
*"I'm having guests for dinner. Pause dining room motion lights for 4 hours."*
1. Open AutoSnooze card
2. Switch to "Areas" tab
3. Expand "Dining Room"
4. Select motion light automations
5. Click "4h" preset
6. Click "Snooze"

### The Traveler
*"Going on vacation for a week. Pause my daily wake-up routine."*
1. Open AutoSnooze card
2. Search for "wake up"
3. Select the automation
4. Click "Custom"
5. Set 7 days
6. Click "Snooze"

### The Power User
*"Pause all Security automations while I fix sensors."*
1. Open AutoSnooze card
2. Switch to "Labels" tab
3. Expand "Security" group
4. Click checkbox on group header (selects all)
5. Click "1h" preset
6. Click "Snooze"

## Services

### `autosnooze.pause`
Snooze automation(s) for a duration.

```yaml
service: autosnooze.pause
data:
  entity_id: 
    - automation.motion_lights
    - automation.door_notify
  hours: 4
```

### `autosnooze.cancel`
Wake specific automation(s) immediately.

```yaml
service: autosnooze.cancel
data:
  entity_id: automation.motion_lights
```

### `autosnooze.cancel_all`
Wake all snoozed automations.

```yaml
service: autosnooze.cancel_all
```

## Sensor Entity

The integration creates a sensor:
- `sensor.autosnooze_snoozed_automations` - Count of currently snoozed automations
- Attributes contain full details of all snoozed automations

Use in conditions:
```yaml
condition:
  - condition: state
    entity_id: sensor.autosnooze_snoozed_automations
    state: '0'
```

## Requirements

- Home Assistant 2024.1 or newer
- Areas and Labels configured in Home Assistant (for filtering)

## Support

Report issues on GitHub
