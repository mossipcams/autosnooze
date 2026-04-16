# AutoSnooze

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=flat-square)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/mossipcams/autosnooze.svg?style=flat-square)](https://github.com/mossipcams/autosnooze/releases)
[![GitHub Stars](https://img.shields.io/github/stars/mossipcams/autosnooze?style=flat-square)](https://github.com/mossipcams/autosnooze/stargazers)
[![HA Analytics](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fanalytics.home-assistant.io%2Fcustom_integrations.json&query=%24.autosnooze.total&suffix=%20installs&label=Active%20Installs&style=flat-square&color=41BDF5)](https://analytics.home-assistant.io)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mossipcams/autosnooze/build.yml?branch=main&style=flat-square)](https://github.com/mossipcams/autosnooze/actions)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.1+-blue.svg?style=flat-square)](https://www.home-assistant.io/)

Temporarily pause Home Assistant automations with automatic re-enabling. Snooze an automation, it comes back on its own. No more forgotten disabled automations cluttering your setup.

![AutoSnooze Demo](https://raw.githubusercontent.com/mossipcams/autosnooze/main/docs/images/autosnooze.gif)

-----

## Why?

Motion lights keep turning off during dinner. Wake-up routines fire while you're on vacation. You disable something for maintenance and forget about it for three months. AutoSnooze lets you pause automations with a timer so they always come back.

-----

## What it does

- **Filter by Area, Label, or name** to find automations fast
- **Preset durations** — 30m, 1h, 4h, 1 day, or custom
- **Live countdown timers** on every snoozed automation
- **Survives restarts** — timers persist through reboots and power outages
- **Wake early** — cancel individual snoozes or wake everything at once
- **Schedule mode** — snooze until a specific date/time
- **Adjust on the fly** — extend or shorten active snoozes
- **Critical guards** — auto-detects security/safety automations and asks for confirmation
- **Sensor entity** — `sensor.autosnooze_snoozed_automations` for use in other automations and dashboards

-----

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Search for AutoSnooze
3. Click the download button
4. Restart Home Assistant

### HACS (Manual Install)

1. Open HACS in Home Assistant
1. Click the 3-dot menu → **Custom repositories**
1. Add `https://github.com/mossipcams/autosnooze` as type **Integration**
1. Search for "AutoSnooze" and click **Download**
1. Restart Home Assistant
1. Go to **Settings → Devices & Services → Add Integration → AutoSnooze**

The dashboard card registers itself when the integration loads — just add it to your dashboard.

-----

## Dashboard Card

Add to any Lovelace dashboard:

```yaml
type: custom:autosnooze-card
title: AutoSnooze
```

The only option is `title` (string, defaults to `AutoSnooze`).

### Filtering with Labels

You can control which automations show up in the card using HA labels:

- **`autosnooze_include`** — Whitelist mode. If any automation has this label, only those automations appear.
- **`autosnooze_exclude`** — Blacklist mode. Hides automations with this label.
- **`autosnooze_confirm`** — Requires confirmation before snoozing.

If no automations have `autosnooze_include`, the card shows everything except `autosnooze_exclude` ones.

To set up, go to **Settings → Labels**, create the label, then assign it to automations.

### Critical Automation Guardrails

AutoSnooze auto-detects critical automations based on keywords in their entity ID or name:

> alarm, security, siren, lock, smoke, carbon monoxide, co2, leak, flood, fire, gas

These require confirmation before snoozing. You can also manually flag any automation with the `autosnooze_confirm` label. For service calls, pass `confirm: true` to acknowledge.

-----

## Usage

Pause your dining room motion lights during a dinner party:

**Areas** → Dining Room → Select automations → **4h** → **Snooze**

Pause a wake-up routine for vacation:

**Search** "wake up" → Select → **Custom** → 7 days → **Snooze**

Pause security automations while fixing sensors:

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
|`confirm`   |No      |Set `true` to snooze critical/confirm-labeled automations|

### `autosnooze.cancel`

Wake a snoozed automation early.

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

Snooze all automations in an area.

```yaml
service: autosnooze.pause_by_area
data:
  area_id:
    - living_room
    - kitchen
  hours: 2
```

### `autosnooze.pause_by_label`

Snooze all automations with a label.

```yaml
service: autosnooze.pause_by_label
data:
  label_id:
    - security
    - motion
  hours: 1
```

### `autosnooze.adjust`

Add or subtract time from an active snooze.

```yaml
service: autosnooze.adjust
data:
  entity_id: automation.motion_lights
  hours: 1
  minutes: 30
```

|Parameter   |Required|Description                                 |
|------------|--------|--------------------------------------------|
|`entity_id` |Yes     |Automation entity ID(s)                     |
|`days`      |No      |Days to add (negative to subtract)          |
|`hours`     |No      |Hours to add (negative to subtract)         |
|`minutes`   |No      |Minutes to add (negative to subtract)       |

### `autosnooze.cancel_scheduled`

Cancel a scheduled snooze before it activates.

```yaml
service: autosnooze.cancel_scheduled
data:
  entity_id: automation.motion_lights
```

-----

## Sensor

`sensor.autosnooze_snoozed_automations` — state is the count of currently snoozed automations, attributes have the details.

Use it in conditions:

```yaml
condition:
  - condition: numeric_state
    entity_id: sensor.autosnooze_snoozed_automations
    below: 1
```

Or as a dashboard badge:

```yaml
type: entity
entity: sensor.autosnooze_snoozed_automations
name: Snoozed
icon: mdi:sleep
```

-----

## Troubleshooting

### Card not appearing

The card should register automatically. If it doesn't:

1. Clear browser cache and hard refresh (`Ctrl+Shift+R`)
1. Check **Settings → Dashboards → Resources** for the autosnooze entry
1. If missing, manually add `/autosnooze-card.js` as a **JavaScript module**

**YAML mode dashboards** need the resource added manually:

```yaml
lovelace:
  mode: yaml
  resources:
    - url: /autosnooze-card.js
      type: module
```

### Automations not re-enabling

1. Check **Developer Tools → States** for the sensor state
1. Verify Home Assistant hasn't restarted during the snooze
1. Check logs: **Settings → System → Logs**

### Card shows "Integration not found"

Make sure AutoSnooze is configured in **Settings → Devices & Services**.

-----

## Requirements

- Home Assistant **2024.1** or newer
- Areas and Labels configured (optional, for filtering)

-----

## Contributing

1. Fork the repo
1. Create a feature branch
1. Run tests (`npm test && pytest tests/`)
1. Open a Pull Request

-----

## Support

- [Report a Bug](https://github.com/mossipcams/autosnooze/issues/new?template=bug_report.md)
- [Request a Feature](https://github.com/mossipcams/autosnooze/issues/new?template=feature_request.md)
- [Discussions](https://github.com/mossipcams/autosnooze/discussions)

-----

## License

MIT License - see <LICENSE> for details.
