# Service call reference

AutoSnooze services work with automations and, where stated below, Home Assistant `input_boolean.*` helpers. Input Booleans are available through service calls only; the dashboard cards remain automation-only. Other toggle-style domains such as `switch.*` are not supported.

## `autosnooze.pause`

Snooze one or more automations or input Booleans.

```yaml
action: autosnooze.pause
data:
  entity_id:
    - automation.motion_lights
    - automation.door_notify
  hours: 4
```

|Parameter                  |Required|Description                                       |
|---------------------------|--------|--------------------------------------------------|
|`entity_id`                |Yes     |Automation or input Boolean entity ID(s)          |
|`days`                     |No      |Duration in days (0-365)                          |
|`hours`                    |No      |Duration in hours (0-23)                          |
|`minutes`                  |No      |Duration in minutes (0-59)                        |
|`resume_at`                |No      |Datetime when to re-enable                        |
|`resume_at_time`           |No      |Local time of day when to re-enable (next occurrence)|
|`resume_preset`            |No      |Built-in resume time: `end_of_day`, `next_morning`, `next_sunrise`, `next_sunset`|
|`resume_state`             |No      |Input Boolean end state: `previous` (default), `on`, or `off`; automations always turn on|
|`disable_at`               |No      |Datetime when to start the snooze (for scheduling)|
|`notification_trigger`     |No      |`none` (default), `start`, `about_to_end`, or `end`|
|`notification_lead_minutes`|No      |How far ahead `about_to_end` fires: `30`, `60`, `120`, or `240`|
|`confirm`                  |No      |Set `true` to snooze critical/confirm-labeled automations|

Provide exactly one resume strategy per call: duration (`days`/`hours`/`minutes`), `resume_at`, `resume_at_time`, or `resume_preset`.

### Input Boolean resume state

Input Booleans restore the state they had when the snooze starts by default. Use `resume_state` to choose a fixed end state instead. Scheduled snoozes capture `previous` when they activate, not when they are created.

```yaml
action: autosnooze.pause
data:
  entity_id: input_boolean.away_mode
  hours: 4
  resume_state: "off"
```

### Resume strategies

**Preset.** Snooze until a well-known moment. `end_of_day` resumes at the next local midnight (start of tomorrow), `next_morning` at the next 08:00 local time, and `next_sunrise`/`next_sunset` at Home Assistant's next sun event:

```yaml
action: autosnooze.pause
target:
  entity_id: automation.motion_lights
data:
  resume_preset: end_of_day
```

**Time of day.** Resume at the next occurrence of a local time. If the time hasn't happened yet today, it resumes today; otherwise tomorrow:

```yaml
action: autosnooze.pause
target:
  entity_id: automation.motion_lights
data:
  resume_at_time: "06:25:00"
```

**Absolute datetime.** `resume_at` accepts a datetime or an ISO datetime string. Home Assistant renders Jinja templates before the service call reaches AutoSnooze, so templated values work as long as they render to a valid datetime string:

```yaml
action: autosnooze.pause
target:
  entity_id: automation.motion_lights
data:
  resume_at: "{{ (today_at('00:00') + timedelta(days=1)).isoformat() }}"
```

### Scheduled snoozes

`disable_at` starts the snooze later instead of right away. Pair it with `resume_at`, `resume_at_time`, or `resume_preset`, and set it earlier than the resume time:

```yaml
action: autosnooze.pause
target:
  entity_id: automation.motion_lights
data:
  disable_at: "2026-08-20 18:00:00"
  resume_at: "2026-08-21 09:00:00"
```

Pairing `disable_at` with a plain duration (`days`/`hours`/`minutes`) does not schedule anything. That call snoozes immediately for the duration and the `disable_at` is dropped. Use `autosnooze.cancel_scheduled` to call off a snooze that hasn't started yet.

### Notifications

Set `notification_trigger` to get a Home Assistant notification when the snooze starts (`start`), ends (`end`), or is about to end (`about_to_end`). `about_to_end` also needs `notification_lead_minutes`:

```yaml
action: autosnooze.pause
target:
  entity_id: automation.motion_lights
data:
  hours: 8
  notification_trigger: about_to_end
  notification_lead_minutes: 60
```

## `autosnooze.cancel`

End an active snooze early. Automations turn on; input Booleans apply their configured resume state.

```yaml
action: autosnooze.cancel
data:
  entity_id: automation.motion_lights
```

## `autosnooze.cancel_all`

End all active snoozes immediately and apply each entity's configured resume behavior.

```yaml
action: autosnooze.cancel_all
```

## `autosnooze.pause_by_area`

Snooze all automations in an area.

```yaml
action: autosnooze.pause_by_area
data:
  area_id:
    - living_room
    - kitchen
  hours: 2
```

## `autosnooze.pause_by_label`

Snooze all automations with a label.

```yaml
action: autosnooze.pause_by_label
data:
  label_id:
    - security
    - motion
  hours: 1
```

## `autosnooze.adjust`

Add or subtract time from an active automation or input Boolean snooze.

```yaml
action: autosnooze.adjust
data:
  entity_id: automation.motion_lights
  hours: 1
  minutes: 30
```

|Parameter   |Required|Description                                 |
|------------|--------|--------------------------------------------|
|`entity_id` |Yes     |Automation or input Boolean entity ID(s)    |
|`days`      |No      |Days to add (negative to subtract)          |
|`hours`     |No      |Hours to add (negative to subtract)         |
|`minutes`   |No      |Minutes to add (negative to subtract)       |

## `autosnooze.clear_notification`

Remove the notification settings from an active snooze without changing when it resumes.

```yaml
action: autosnooze.clear_notification
data:
  entity_id: automation.motion_lights
```

## `autosnooze.cancel_scheduled`

Cancel a scheduled snooze before it activates.

```yaml
action: autosnooze.cancel_scheduled
data:
  entity_id: automation.motion_lights
```

## Internal service

`autosnooze.report_telemetry` is reserved for sanitized product events from the bundled dashboard card. It is not intended for automations or manual service calls.
