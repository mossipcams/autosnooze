# Reddit Announcement Draft

**Subreddit:** r/homeassistant

---

## Title Options (pick one):

1. "AutoSnooze: Pause automations that automatically wake themselves back up"
2. "Stop disabling automations. Start snoozing them."
3. "AutoSnooze: Because 'I'll turn it back on later' is a lie we tell ourselves"

---

## Post:

A week ago my girlfriend threw a birthday party at my place. Mid-party, someone sits on the bed and triggers my pressure sensor — lights go out, the whole "goodnight" automation kicks off. Very romantic. Very awkward.

I didn't have time to build a proper toggle, so I just disabled the automation and went back to the party. The next night I'm lying in bed wondering why my lights won't turn off. Took me way too long to realize I'd never re-enabled it.

So I built **AutoSnooze** — a dashboard card that lets you snooze automations instead of disabling them. Set a duration, they wake themselves back up. Like an alarm clock for your automations.

[SCREENSHOT]

**How it works:**

1. Filter by Area, Label, or search
2. Select the automations you want to pause
3. Pick a duration (or set a specific date/time)
4. Done. They'll re-enable automatically.

Live countdowns show exactly when each automation wakes up. Timers persist through reboots. And if you change your mind, one tap wakes everything instantly.

---

**Real scenarios:**

| Situation | What you'd do |
|-----------|---------------|
| Hosting dinner | Snooze dining room motion lights for 4 hours |
| Testing sensors | Snooze security alerts for 1 hour |
| Going on vacation | Snooze morning routines for a week |
| Kids sleeping in | Snooze weekend wake-up automation until noon |

---

Available through HACS (custom repository). Self-contained, no external dependencies.

**GitHub:** [link]

---

## Screenshot suggestion:

Show the card with:
- 2-3 active snoozes with visible countdowns
- The Area/Label/Search filter tabs visible
- Maybe one grouped countdown (multiple automations resuming together)

---

## Notes for you:

**What this version does better:**
- ✅ Punchy title options that hint at the value prop
- ✅ "We've all been there" creates instant connection
- ✅ Bold product name establishes it as a *thing*
- ✅ "Treats automations like alarm clocks" - instant mental model
- ✅ Table format for scenarios is scannable and visual
- ✅ Numbered steps feel polished and easy
- ✅ Screenshot placement is explicit (put it after the hook)
- ✅ Still ends matter-of-factly, no begging

**Lines doing subtle marketing work:**
- "No more forgotten automations" - states the outcome, not just the feature
- "They wake themselves back up" - active voice, sounds smart
- "Timers persist through reboots" - signals quality/reliability
- "One tap wakes everything instantly" - sounds satisfying

**Hold for comments (don't front-load):**
- Sensor entity for automations/dashboards
- Schedule mode for future-timed pauses
- Performance with 100+ automations
- Services for scripting
