# AutoSnooze

Temporarily pause Home Assistant automations with a beautiful, intuitive interface.

![AutoSnooze Card](https://via.placeholder.com/800x400?text=AutoSnooze+Screenshot)

## ✨ Features

### Smart Filtering
- **All Automations** - Complete list view
- **By Area** - Group by room (Living Room, Kitchen, etc.)
- **By Label** - Group by tags (Security, Lighting, etc.)
- **Search** - Quick filtering by name

### Duration Presets
Quick-tap presets plus custom input:
- 30 minutes
- 1 hour
- 4 hours
- 1 day
- Custom (days/hours/minutes)

### Visual Excellence
- 🎨 Theme-aware (auto light/dark mode)
- 📱 Mobile-responsive design
- 🔔 Toast notifications on actions
- ⚡ Real-time countdown timers
- 🟠 Amber-bordered active state section
- 💤 Sleep icons on snoozed items

### Reliability
- ✅ Survives system restarts (FR-07)
- ✅ Auto-re-enables when timer expires (FR-06)
- ✅ Persistent storage
- ✅ Early wake-up option (FR-10)

## 📦 Installation

### Via HACS (Recommended)

1. Add this repository as a custom repository in HACS
2. Search for "AutoSnooze" in HACS → Integrations
3. Click "Download"
4. Restart Home Assistant
5. Add the integration: Settings → Devices & Services → Add Integration → "AutoSnooze"

### Manual Installation

1. Copy `custom_components/autosnooze` to your `config/custom_components/` folder
2. Copy `www/autosnooze-card.js` to your `config/www/` folder
3. Restart Home Assistant
4. Add the integration via the UI

## 🎯 Dashboard Card

Add to your Lovelace dashboard:

```yaml
type: custom:autosnooze-card
title: AutoSnooze
```

## 🚀 Usage Examples

### The Host
*"I'm having guests for dinner. Pause dining room motion lights for 4 hours."*

1. Switch to **Areas** tab
2. Expand **Dining Room**
3. Select motion automations
4. Click **4h** preset
5. Click **Snooze**

### The Traveler
*"Going on vacation. Pause my daily wake-up routine for a week."*

1. Search for "wake up"
2. Select the automation
3. Click **Custom**
4. Set **7 days**
5. Click **Snooze**

### The Power User
*"Pause all Security automations while I fix sensors."*

1. Switch to **Labels** tab
2. Expand **Security**
3. Click checkbox on group header (selects all)
4. Click **1h** preset
5. Click **Snooze**

## 🛠️ Services

### Snooze Automations
```yaml
service: autosnooze.pause
data:
  entity_id: 
    - automation.motion_lights
    - automation.door_notify
  hours: 4
```

### Wake Specific Automation
```yaml
service: autosnooze.cancel
data:
  entity_id: automation.motion_lights
```

### Wake All Snoozed
```yaml
service: autosnooze.cancel_all
```

## 📊 Sensor

Track snoozed automations:
- Entity: `sensor.autosnooze_snoozed_automations`
- State: Count of currently snoozed automations
- Attributes: Full details of each snoozed automation

Use in conditions:
```yaml
condition:
  - condition: state
    entity_id: sensor.autosnooze_snoozed_automations
    state: '0'
```

## 🔄 Upgrading from v1.x

If you're upgrading from the old `automation_pause` integration, see [MIGRATION.md](docs/MIGRATION.md) for breaking changes:

- Domain: `automation_pause` → `autosnooze`
- Services: `automation_pause.*` → `autosnooze.*`
- Sensor: `sensor.paused_automations` → `sensor.autosnooze_snoozed_automations`

## 📋 Requirements

- Home Assistant 2024.1 or newer
- Areas and Labels configured for filtering (optional but recommended)

## 🐛 Issues & Feature Requests

Found a bug or have an idea? [Open an issue](https://github.com/mossipcams/autosnooze/issues)

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 💝 Support

If you find AutoSnooze useful, consider:
- ⭐ Starring the repo
- 🐛 Reporting bugs
- 💡 Suggesting features
- 📢 Sharing with others

---

Made with ❤️ for the Home Assistant community
