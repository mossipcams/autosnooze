# AutoSnooze

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/mossipcams/autosnooze.svg)](https://github.com/mossipcams/autosnooze/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mossipcams/autosnooze/build.yml?branch=main)](https://github.com/mossipcams/autosnooze/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.1+-blue.svg)](https://www.home-assistant.io/)

**Temporarily pause Home Assistant automations with automatic re-enabling.**

![AutoSnooze Card](https://raw.githubusercontent.com/mossipcams/autosnooze/main/docs/images/card-main.jpg)
![Snoozed Automations](https://raw.githubusercontent.com/mossipcams/autosnooze/main/docs/images/card-snoozed.jpeg)

-----

## The Problem

Your motion lights keep turning off during dinner. Your wake-up routine fires while you’re on vacation. You disable automations for maintenance and forget which ones.

## The Solution

Snooze automations for a set duration. They re-enable automatically when the timer expires. No more forgotten disabled automations.

-----

## Features

|Feature             |Description                                        |
|--------------------|---------------------------------------------------|
|**Smart Filtering** |Filter by Area, Label, or search by name           |
|**Preset Durations**|Quick-tap 30m, 1h, 4h, 1 day, or custom            |
|**Live Countdown**  |Real-time timers show exactly when automations wake|
|**Restart Survival**|Timers persist through reboots and power outages   |
|**Quick Wake**      |Cancel individual snoozes or wake all at once      |
|**Schedule Mode**   |Snooze until a specific date/time                  |
|**Status Sensor**   |Track snoozed count in automations and dashboards  |

-----

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
1. Click the 3-dot menu → **Custom repositories**
1. Add `https://github.com/mossipcams/autosnooze` as type **Integration**
1. Search for “AutoSnooze” and click **Download**
1. Restart Home Assistant
1. Go to **Settings → Devices & Services → Add Integration → AutoSnooze**

The dashboard card is automatically registered when the integration loads. Just add the card to your dashboard and you’re ready to go.

### Manual Installation

1. Copy `custom_components/autosnooze` to your `config/custom_components/` folder
1. Restart Home Assistant
1. Go to **Settings → Devices & Services → Add Integration → AutoSnooze**

-----

## Dashboard Card

Add to any Lovelace dashboard:

```yaml
type: custom:autosnooze-card
title: AutoSnooze
```

### Card Options

|Option |Type  |Default     |Description      |
|-------|------|------------|-----------------|
|`title`|string|`AutoSnooze`|Card header title|

-----

## Usage Examples

### Dinner Party

> “Pause dining room motion lights for 4 hours”

**Areas** → Dining Room → Select automations → **4h** → **Snooze**

### Vacation Mode

> “Pause wake-up routine for a week”

**Search** “wake up” → Select → **Custom** → 7 days → **Snooze**

### Sensor Maintenance

> “Pause all security automations while fixing sensors”

**Labels** → Security → Select all → **1h** → **Snooze**

-----

## Services

### `autosnooze.pause`

Snooze one or more automations.

```yaml
service: autosnooze.pause
data:
  entity_id:
    - automation.motion_lights
    - automation.door_notify
  hours: 4
```

|Parameter   |Required|Description                                       |
|------------|--------|--------------------------------------------------|
|`entity_id` |Yes     |Automation entity ID(s)                           |
|`days`      |No      |Duration in days                                  |
|`hours`     |No      |Duration in hours                                 |
|`minutes`   |No      |Duration in minutes                               |
|`resume_at` |No      |Datetime when to re-enable (overrides duration)   |
|`disable_at`|No      |Datetime when to start the snooze (for scheduling)|

### `autosnooze.cancel`

Wake a specific snoozed automation.

```yaml
service: autosnooze.cancel
data:
  entity_id: automation.motion_lights
```

### `autosnooze.cancel_all`

Wake all snoozed automations immediately.

```yaml
service: autosnooze.cancel_all
```

### `autosnooze.pause_by_area`

Snooze all automations in specified areas.

```yaml
service: autosnooze.pause_by_area
data:
  area_id:
    - living_room
    - kitchen
  hours: 2
```

### `autosnooze.pause_by_label`

Snooze all automations with specified labels.

```yaml
service: autosnooze.pause_by_label
data:
  label_id:
    - security
    - motion
  hours: 1
```

### `autosnooze.cancel_scheduled`

Cancel a scheduled snooze before it activates.

```yaml
service: autosnooze.cancel_scheduled
data:
  entity_id: automation.motion_lights
```

-----

## Sensor

Track snoozed automations programmatically:

```yaml
sensor.autosnooze_snoozed_automations
```

- **State**: Count of currently snoozed automations
- **Attributes**: Details of each snoozed automation

### Example: Conditional Automation

```yaml
condition:
  - condition: numeric_state
    entity_id: sensor.autosnooze_snoozed_automations
    below: 1
```

### Example: Dashboard Badge

```yaml
type: entity
entity: sensor.autosnooze_snoozed_automations
name: Snoozed
icon: mdi:sleep
```

-----

## Performance

AutoSnooze is optimized for large Home Assistant installations:

- **Efficient data loading**: Uses a single API request regardless of automation count
- **Smart re-rendering**: Only updates the UI when countdowns are active
- **Cached computations**: Automation lists are cached and only recomputed when state changes
- **Debounced search**: Search input waits 300ms before filtering to prevent lag

Tested with 40+ automations without performance degradation.

-----

## Troubleshooting

### Card not appearing

The card should register automatically. If it doesn’t:

1. Clear browser cache and hard refresh (`Ctrl+Shift+R`)
1. Check **Settings → Dashboards → Resources** for the autosnooze entry
1. If missing, manually add the resource:
- URL: `/autosnooze-card.js`
- Type: **JavaScript module**

**For YAML mode dashboards:** The automatic registration only works with storage mode (UI-managed) dashboards. If you use YAML mode for Lovelace, add the resource manually to your `configuration.yaml`:

```yaml
lovelace:
  mode: yaml
  resources:
    - url: /autosnooze-card.js
      type: module
```

Or add it directly to your dashboard YAML file under `resources:`.

### Automations not re-enabling

1. Check **Developer Tools → States** for the sensor state
1. Verify Home Assistant hasn’t restarted during the snooze
1. Check logs for errors: **Settings → System → Logs**

### Card shows “Integration not found”

Ensure the AutoSnooze integration is configured in **Settings → Devices & Services**.

-----

## Requirements

- Home Assistant **2024.1** or newer
- Areas and Labels configured (optional, enables filtering features)

-----

## Contributing

Contributions are welcome! Please:

1. Fork the repository
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
1. Run tests (`npm test && pytest tests/`)
1. Commit changes (`git commit -m 'Add amazing feature'`)
1. Push to branch (`git push origin feature/amazing-feature`)
1. Open a Pull Request

-----

## Support

- [Report a Bug](https://github.com/mossipcams/autosnooze/issues/new?template=bug_report.md)
- [Request a Feature](https://github.com/mossipcams/autosnooze/issues/new?template=feature_request.md)
- [Discussions](https://github.com/mossipcams/autosnooze/discussions)

-----

## License

MIT License - see <LICENSE> for details.