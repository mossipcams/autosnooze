# AutoSnooze

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/mossipcams/autosnooze.svg)](https://github.com/mossipcams/autosnooze/releases)
[![License](https://img.shields.io/github/license/mossipcams/autosnooze.svg)](LICENSE)

Temporarily disable Home Assistant automations and have them automatically re-enable later.

## The Problem

Your motion lights keep turning off during dinner. Your wake-up routine runs while you're on vacation. You can't remember which automations you disabled for maintenance.

## The Solution

Snooze automations for a set time. They'll wake up automatically when the timer expires.

## Features

- **Filter by Area or Label** - Select entire rooms or automation groups at once
- **Preset durations** - 30m, 1h, 4h, 1 day, or custom
- **Live countdown** - See exactly when each automation wakes up
- **Survives restarts** - Timers persist through reboots and power outages
- **Quick wake** - Re-enable individual automations or everything at once

## Installation

### HACS

1. HACS → Integrations → ⋮ → Custom repositories
2. Add: `https://github.com/mossipcams/autosnooze`
3. Install "AutoSnooze"
4. Restart Home Assistant
5. Settings → Devices & Services → Add "AutoSnooze"

### Manual

1. Copy `custom_components/autosnooze/` to `config/custom_components/`
2. Copy `www/autosnooze-card.js` to `config/www/`
3. Restart and add integration

## Dashboard Card

```yaml
type: custom:autosnooze-card
title: AutoSnooze
```

## Usage

**Having guests for dinner?**  
Areas → Dining Room → Select motion lights → 4h → Snooze

**Going on vacation?**  
Search "wake up" → Select → Custom → 7 days → Snooze

**Fixing sensors?**  
Labels → Security → Select all → 1h → Snooze

## Services

```yaml
# Snooze
service: autosnooze.pause
data:
  entity_id: automation.motion_lights
  hours: 4

# Wake
service: autosnooze.cancel
data:
  entity_id: automation.motion_lights

# Wake all
service: autosnooze.cancel_all
```

## Sensor

```yaml
sensor.autosnooze_snoozed_automations
```

State = count. Attributes = details.

Use in conditions:
```yaml
condition:
  - condition: numeric_state
    entity_id: sensor.autosnooze_snoozed_automations
    below: 1
```

## Requirements

- Home Assistant 2024.1+
- Areas/Labels configured (optional, enables filtering)

## Upgrading from v1.x

Domain changed: `automation_pause` → `autosnooze`

See [docs/MIGRATION.md](docs/MIGRATION.md) for instructions.

## Support

[Open an issue](https://github.com/mossipcams/autosnooze/issues)

## License

MIT
