# AutoSnooze

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=flat-square)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/release/mossipcams/autosnooze.svg?style=flat-square)](https://github.com/mossipcams/autosnooze/releases)
[![GitHub Stars](https://img.shields.io/github/stars/mossipcams/autosnooze?style=flat-square)](https://github.com/mossipcams/autosnooze/stargazers)
[![HA Analytics](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fanalytics.home-assistant.io%2Fcustom_integrations.json&query=%24.autosnooze.total&suffix=%20installs&label=Active%20Installs&style=flat-square&color=41BDF5)](https://analytics.home-assistant.io)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mossipcams/autosnooze/build.yml?branch=main&style=flat-square)](https://github.com/mossipcams/autosnooze/actions)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2026.6+-blue.svg?style=flat-square)](https://www.home-assistant.io/)

Pause Home Assistant automations on a timer. Snooze one and it re-enables itself, so you stop accumulating automations you disabled and forgot.

<img src="https://raw.githubusercontent.com/mossipcams/autosnooze/main/docs/images/autosnooze-v2.gif" alt="AutoSnooze Demo" width="380">

## Why?

Motion lights keep turning off during dinner. Wake-up routines fire while you're on vacation. You disable something for maintenance and forget about it for three months. AutoSnooze lets you pause automations with a timer so they always come back.

## What it does

- **Filter by Area, Label, or name** to find automations fast
- **Hide snoozed**: one toggle drops already-snoozed automations out of the picker
- **Preset durations**: 30m and 1h out of the box, or up to four you set yourself
- **Live countdown timers** on every snoozed automation
- **Survives restarts**: timers persist through reboots and power outages
- **Wake early**: cancel individual snoozes or wake everything at once
- **Schedule mode**: snooze until a specific date/time, or start the snooze later
- **Adjust on the fly**: extend or shorten active snoozes
- **Notifications**: get told when a snooze starts, ends, or is about to end
- **Critical guards**: auto-detects security/safety automations and asks for confirmation
- **Sensor entity**: `sensor.autosnooze_snoozed_automations` for use in other automations and dashboards

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Search for AutoSnooze
3. Click the download button
4. Restart Home Assistant

### HACS (Manual Install)

1. Open HACS in Home Assistant
2. Click the 3-dot menu → **Custom repositories**
3. Add `https://github.com/mossipcams/autosnooze` as type **Integration**
4. Search for "AutoSnooze" and click **Download**
5. Restart Home Assistant
6. Go to **Settings → Devices & Services → Add Integration → AutoSnooze**

The dashboard card registers itself when the integration loads, so all you need to do is add it to a dashboard.

## Dashboard Card

Add to any Lovelace dashboard:

```yaml
type: custom:autosnooze-card
title: AutoSnooze
```

The only option is `title` (string, defaults to `AutoSnooze`).

### Duration Presets

The card's preset pills default to **30m** and **1h**. Set your own (up to four) under **Settings → Devices & Services → AutoSnooze → Configure**. A custom duration field and schedule mode are always there regardless of which presets you pick.

### Snoozed-Only Card

A read-only companion card that lists only the automations currently snoozed and when they resume. It has no automation picker, no duration controls, and no resume or adjust buttons. Pair it with the full card, or put it on a dashboard where you only want to see what's paused:

```yaml
type: custom:autosnooze-snoozed-card
title: Snoozed Automations
```

The only option is `title` (string, defaults to `Snoozed Automations`). When nothing is snoozed, it shows a short empty-state message. Use the main AutoSnooze card to resume or adjust.

### Hide Snoozed

The eye icon in the card header hides automations that are already snoozed, so the picker only lists what you can still snooze. Click it again to bring them back. Your active snoozes keep showing in their own section either way, countdowns and all.

The toggle starts off and is saved in browser local storage, so it applies per browser rather than per Home Assistant user. Turning it on in the app on your phone won't turn it on in the browser on your laptop.

### Filtering with Labels

You can control which automations show up in the card using HA labels:

- **`autosnooze_include`**: whitelist mode. If any automation has this label, only those automations appear.
- **`autosnooze_exclude`**: blacklist mode. Hides automations with this label.
- **`autosnooze_confirm`**: requires confirmation before snoozing.

If no automations have `autosnooze_include`, the card shows everything except `autosnooze_exclude` ones.

To set up, go to **Settings → Labels**, create the label, then assign it to automations.

### Critical Automation Guardrails

AutoSnooze auto-detects critical automations based on keywords in their entity ID or name:

> alarm, security, siren, lock, smoke, carbon monoxide, co2, leak, flood, fire, gas

These require confirmation before snoozing. You can also manually flag any automation with the `autosnooze_confirm` label. For service calls, pass `confirm: true` to acknowledge.

### Languages

The card follows your Home Assistant language setting. English, Spanish, French, German, and Italian ship with it, along with regional variants like `de-AT`, `fr-CA`, and `es-419`. Any other language falls back to English.

Spanish, French, German, and Italian are each missing the same 11 strings, mostly from newer features such as the guardrail confirmation dialog and the schedule summary. Those fall back to the English text rather than showing a raw key, so a partly translated card still reads correctly.

Translations live in `src/localization/translations/`, one JSON file per language, with `en.json` as the reference.

## Product telemetry

I know how I use AutoSnooze, but not how others do. Product telemetry shows which features matter and where people get stuck, without collecting anything about how a home is configured.

### What is sent

AutoSnooze can send product usage events to [PostHog](https://posthog.com).

This is **not fully anonymous**. Events are not linked to your Home Assistant user, name, or instance URL, but a random per-install ID is hashed (SHA-256) and sent as `distinct_id` so events from the same install can be grouped. The raw install ID never leaves the instance. Event payloads contain only allowlisted enums, booleans, and bounded integers (versions, source, durations, counts, card actions). Like any HTTPS request, PostHog can see the source IP of your Home Assistant instance; AutoSnooze disables geo-IP enrichment and does not put IPs in the event payload.

Full event catalog and example payloads:

- [Event properties](docs/posthog-privacy.md#full-event-catalog)
- [Exact sanitized payloads](docs/posthog-payloads.json) (27 events, CI-verified)

### What is never sent

Never included in payloads: automation IDs/names, areas/labels, search text, URLs, user/instance IDs, YAML, logs, or location.

### Opt-out

**On by default.** Turn it off anytime: **Settings → Devices & Services → AutoSnooze → Configure → Send product usage data**.

Payloads are checked in public CI against private canaries. [PostHog privacy verification](docs/posthog-privacy.md)

## Usage

Pause your dining room motion lights during a dinner party:

**Areas** → Dining Room → Select automations → **4h** → **Snooze**

Pause a wake-up routine for vacation:

**Search** "wake up" → Select → **Custom** → 7 days → **Snooze**

Pause security automations while fixing sensors:

**Labels** → Security → Select all → **1h** → **Snooze**

## Service calls

AutoSnooze provides service calls for automations and service-only `input_boolean.*` helpers, including scheduled snoozes, resume-state control, notifications, and adjustments.

See the complete [Service call reference](docs/service-calls.md) for parameters and YAML examples.

## Sensor

The `sensor.autosnooze_snoozed_automations` state is the count of currently snoozed automations, and its attributes carry the details. The attributes also carry the configured `duration_presets`, which is where the card gets its preset pills.

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

## Troubleshooting

### Card not appearing

The card should register automatically. If it doesn't:

1. Clear browser cache and hard refresh (`Ctrl+Shift+R`)
2. Check **Settings → Dashboards → Resources** for the autosnooze entry
3. If missing, manually add `/autosnooze-card.js` as a **JavaScript module**

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
2. Verify Home Assistant hasn't restarted during the snooze
3. Check logs: **Settings → System → Logs**

### Card shows "Integration not found"

Make sure AutoSnooze is configured in **Settings → Devices & Services**.

## Requirements

- Home Assistant **2026.6** or newer
- Areas and Labels configured (optional, for filtering)

## Contributing

1. Fork the repo
2. Create a feature branch
3. Run tests (`npm test && pytest tests/`)
4. Open a Pull Request

## Support

- [Report a Bug](https://github.com/mossipcams/autosnooze/issues/new?template=bug_report.md)
- [Request a Feature](https://github.com/mossipcams/autosnooze/issues/new?template=feature_request.md)
- [Discussions](https://github.com/mossipcams/autosnooze/discussions)

## License

MIT. See [LICENSE](LICENSE).
