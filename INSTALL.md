# AutoSnooze - Quick Installation

## Installation

### Option 1: Copy Everything
```bash
# Copy the entire custom_components folder
cp -r custom_components/autosnooze /path/to/homeassistant/config/custom_components/

# Copy the card
cp www/autosnooze-card.js /path/to/homeassistant/config/www/

# Restart Home Assistant
```

### Option 2: Manual
1. Copy `custom_components/autosnooze/` to your Home Assistant `config/custom_components/` folder
2. Copy `www/autosnooze-card.js` to your Home Assistant `config/www/` folder
3. Restart Home Assistant
4. Go to Settings → Devices & Services → Add Integration
5. Search for "AutoSnooze" and add it

### Add Dashboard Card

Visual Editor:
1. Edit Dashboard → Add Card
2. Search for "AutoSnooze"

Or YAML:
```yaml
type: custom:autosnooze-card
title: AutoSnooze
```

## Folder Structure

```
autosnooze/
├── custom_components/
│   └── autosnooze/              ← Copy this to config/custom_components/
│       ├── __init__.py
│       ├── sensor.py
│       ├── config_flow.py
│       ├── manifest.json
│       ├── services.yaml
│       └── translations/
│           └── en.json
├── www/
│   └── autosnooze-card.js       ← Copy this to config/www/
├── docs/
│   ├── MIGRATION.md             ← Upgrading from v1.x
│   ├── DOMAIN_RENAME.md         ← Domain change details
│   ├── INSTALLATION.md          ← Detailed instructions
│   └── REFACTOR_SUMMARY.md      ← PRD compliance
├── README.md                    ← Full documentation
└── hacs.json                    ← HACS metadata
```

## Services

```yaml
# Snooze automations
service: autosnooze.pause
data:
  entity_id: automation.motion_lights
  hours: 4

# Wake specific
service: autosnooze.cancel
data:
  entity_id: automation.motion_lights

# Wake all
service: autosnooze.cancel_all
```

## Features

✅ Filter by Area or Label
✅ Preset duration pills (30m/1h/4h/1day)
✅ Custom duration input
✅ Toast notifications
✅ Real-time countdowns
✅ Survives restarts
✅ Amber-bordered active state

## Requirements

- Home Assistant 2024.1+
- Areas and Labels configured (for filtering)

## Upgrading from v1.x?

See [docs/MIGRATION.md](docs/MIGRATION.md) - The domain changed from `automation_pause` to `autosnooze`.
