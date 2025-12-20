# Reddit Announcement Draft

**Subreddit:** r/homeassistant

---

## Title Options (pick one):

1. "Built a card for temporarily pausing automations with auto-resume"
2. "AutoSnooze - snooze automations like you snooze alarms"
3. "Solved my 'forgot to re-enable that automation' problem"

---

## Post:

I kept running into the same annoying scenario: disable the motion lights for movie night, forget about it, then wonder three days later why the hallway has been dark.

So I built AutoSnooze. It's a dashboard card that lets you pause automations for a set duration - they automatically re-enable when the timer expires. Timers survive reboots too.

**What it does:**

- Filter automations by Area, Label, or search by name
- Pick a duration (30m, 1h, 4h, 1 day) or set a custom time
- Live countdown shows when each one wakes up
- "Wake All" button if you change your mind

**Some examples:**

- Dinner party → pause dining room motion sensors for 4 hours
- Maintenance → pause security automations for 1 hour while testing
- Vacation → pause morning routines for a week

The card groups snoozed automations by their resume time, so if you pause 5 things at once, you see one countdown instead of five.

Available via HACS as a custom repository. No external dependencies - everything's bundled.

GitHub: [link]

---

## Screenshot suggestion:

Include a screenshot showing:
- The card with a few automations snoozed
- Visible countdown timer
- The filter tabs (Area/Label)

---

## Notes for you:

**What NOT to include (keeps it from sounding desperate):**
- ❌ "Please try it out!"
- ❌ "Would love feedback!"
- ❌ "Star the repo if you like it!"
- ❌ "First integration, be gentle"
- ❌ Excessive feature lists
- ❌ Comparison to other solutions

**What makes this work:**
- ✅ Opens with a relatable problem
- ✅ States what it does matter-of-factly
- ✅ Concrete examples people can picture
- ✅ Brief - respects reader's time
- ✅ Ends with where to get it, not a call to action

**Optional additions if someone asks:**
- Mention the sensor entity (`sensor.autosnooze_snoozed_automations`) for tracking count
- Schedule mode for future-timed pauses
- Works fine with 100+ automations
- Services available for use in other automations
