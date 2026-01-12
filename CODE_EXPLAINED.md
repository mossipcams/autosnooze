# AutoSnooze Code Explained for Product People

This document explains every file in the AutoSnooze codebase in plain English. Think of it as a "what does this actually do?" guide.

---

## Table of Contents

1. [The Big Picture](#the-big-picture)
2. [Backend (Python) Files](#backend-python-files)
3. [Frontend (TypeScript) Files](#frontend-typescript-files)
4. [How Data Flows Through the System](#how-data-flows-through-the-system)

---

## The Big Picture

AutoSnooze has two main parts:

| Part | Language | What It Does |
|------|----------|--------------|
| **Backend** | Python | The "brain" - actually pauses automations, manages timers, saves data |
| **Frontend** | TypeScript | The "face" - the visual card users see and interact with |

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S DASHBOARD                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           FRONTEND (TypeScript)                      │    │
│  │  - Shows list of automations                         │    │
│  │  - Lets user select and click "Snooze"              │    │
│  │  - Shows countdown timers                            │    │
│  └───────────────────────┬─────────────────────────────┘    │
│                          │                                   │
│                          │ "Hey backend, snooze these!"     │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            BACKEND (Python)                          │    │
│  │  - Disables the automation in Home Assistant         │    │
│  │  - Sets a timer to re-enable it later               │    │
│  │  - Saves everything to disk                         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend (Python) Files

These files run on the Home Assistant server and do the actual work.

---

### `__init__.py` - The Starting Point

**Purpose:** This is the "main entrance" to the integration. When Home Assistant loads AutoSnooze, this file runs first.

**What it does (in plain English):**

```
Lines 1-28: Import all the tools and other files we need

Lines 33-35: Set up retry settings for when Lovelace (the dashboard system)
             isn't ready yet. We'll try 3 times, waiting 2 seconds between attempts.

Lines 37-58: A helper function that handles retrying when something isn't ready.
             Think of it like: "Didn't work? Wait a bit and try again."

Lines 70-96: Create the special labels users can apply to automations:
             - "autosnooze_include" (green checkmark) = "Only show these in the card"
             - "autosnooze_exclude" (red X) = "Hide these from the card"
             If the label already exists, we skip creating it.

Lines 98-135: THE MAIN SETUP FUNCTION - Called when user enables AutoSnooze
             1. Create a place to store data
             2. Register the JavaScript file so browsers can load it
             3. Register the card with Lovelace (the dashboard system)
             4. Create the filter labels
             5. Load any previously saved snoozes from disk
             6. Set up all the services (pause, cancel, etc.)
             7. Create the sensor that tracks snooze count

Lines 138-148: Tell Home Assistant where to find our JavaScript file
               "cache_headers=False" prevents iPhones from caching too aggressively

Lines 151-249: Register our card with the Lovelace dashboard system
               This is complex because:
               - Lovelace might not be ready when we start
               - Different Home Assistant setups have different modes (YAML vs UI)
               - We need to update the URL with version numbers to bust browser cache

               The function:
               1. Checks if Lovelace is ready (retries if not)
               2. Looks for an existing AutoSnooze resource
               3. Updates it to the new version, OR creates it if missing

Lines 251-291: THE CLEANUP FUNCTION - Called when user disables AutoSnooze
               1. Mark as "unloaded" so timers know to stop
               2. Cancel any pending startup tasks
               3. Cancel ALL running timers (so automations wake up won't fire)
               4. Clear all listeners
               5. Remove our services from Home Assistant
```

---

### `models.py` - The Data Structures

**Purpose:** Defines what a "paused automation" and "scheduled snooze" look like. Think of these as templates.

**What it does:**

```
Lines 19-41: parse_datetime_utc() - Converts text like "2024-01-15T14:30:00" into
             an actual date/time that the code can work with. Always ensures
             the time is in UTC (universal time) to avoid timezone confusion.

Lines 44-69: ensure_utc_aware() - Makes sure any date/time has timezone info.
             If someone enters a time without a timezone, we assume they mean
             their local time and convert it to UTC for storage.

Lines 72-114: PausedAutomation class - A template for "currently snoozed automation"
             Contains:
             - entity_id: Which automation (e.g., "automation.motion_lights")
             - friendly_name: Human-readable name ("Motion Lights")
             - resume_at: When it should wake up
             - paused_at: When it was snoozed
             - days, hours, minutes: The duration it was snoozed for
             - disable_at: When it was scheduled to be disabled (for schedule mode)

             Also has to_dict() and from_dict() to convert to/from storable format.

Lines 117-142: ScheduledSnooze class - A template for "future scheduled snooze"
               For when user says "Disable this Friday at 6pm until Sunday at 8am"
               Contains:
               - entity_id: Which automation
               - friendly_name: Human-readable name
               - disable_at: When to turn it OFF
               - resume_at: When to turn it back ON

Lines 145-199: AutomationPauseData class - The main "state container"
               Holds EVERYTHING about what's currently happening:
               - paused: Dictionary of currently snoozed automations
               - scheduled: Dictionary of future scheduled snoozes
               - timers: The actual countdown timers that will fire later
               - scheduled_timers: Timers for scheduled future disables
               - listeners: Functions to call when state changes (for UI updates)
               - store: Where to save data to disk
               - lock: Prevents two operations from happening simultaneously
               - unloaded: Flag to know if we're shutting down

               Key methods:
               - add_listener(): Register a function to be called on changes
               - notify(): Tell all listeners "something changed!"
               - get_paused_dict(): Convert paused automations to saveable format
```

---

### `coordinator.py` - The Brain

**Purpose:** Contains all the logic for snoozing, waking, saving, and loading. This is the most important file.

**What it does:**

```
Lines 27-44: async_set_automation_state() - The function that actually disables/enables
             an automation. Calls Home Assistant's built-in automation service.
             Returns true if it worked, false if it failed.

Lines 47-51: get_friendly_name() - Gets the human-readable name of an automation
             Falls back to the entity ID if no name is set.

Lines 54-67: Helper functions to cancel timers safely

Lines 70-86: schedule_resume() - Sets up a timer to wake an automation
             "At 3:30pm tomorrow, run this function to wake up the automation"

             Key insight: Uses Home Assistant's built-in timer system which
             survives service restarts (unlike Python's built-in timers).

Lines 89-100: async_resume() - Wakes up a single snoozed automation
              1. Cancel the timer
              2. Remove from "paused" list
              3. Turn the automation back ON
              4. Save the updated state to disk
              5. Tell listeners "something changed" (so UI updates)

Lines 103-122: async_resume_batch() - Wake up MULTIPLE automations efficiently
               Instead of saving to disk after each one (slow), we:
               1. Process all of them
               2. Save ONCE at the end
               This is much faster for "Wake All" button.

Lines 125-141: schedule_disable() - For scheduled snoozes, sets up the future disable
               "At Friday 6pm, run this function to disable the automation"

Lines 144-185: async_execute_scheduled_disable() - When a scheduled disable time arrives
               1. Actually disable the automation
               2. Move it from "scheduled" to "paused" list
               3. Set up the resume timer
               4. Save state

Lines 188-220: Cancellation functions for scheduled snoozes (single and batch)

Lines 223-264: async_save() - Save everything to disk with retry logic
               Why retry? Because disk writes can fail temporarily (disk busy, etc.)

               Uses exponential backoff:
               - Try 1: immediate
               - Try 2: wait 0.1 seconds
               - Try 3: wait 0.2 seconds
               - Try 4: wait 0.4 seconds

               If all fail, log an error but don't crash.

Lines 267-351: validate_stored_entry() - Checks if saved data is valid
               Before loading saved data, we check:
               - Is the entity ID actually an automation?
               - Does the data have all required fields?
               - Are the dates valid?
               - Do the dates make sense (resume AFTER disable)?

               Invalid entries are logged and skipped.

Lines 354-404: validate_stored_data() - Validates the entire saved file
               Wraps validate_stored_entry() for all entries.

Lines 407-509: async_load_stored() - THE RESTORE FUNCTION
               Called on Home Assistant restart to restore previous state.

               For each saved paused automation:
               1. Check if automation still exists (might have been deleted)
               2. Check if the timer has already expired
               3. If still valid, disable it and set up new timer

               For each saved scheduled snooze:
               1. Check if automation still exists
               2. If disable time already passed, execute it now
               3. Otherwise, set up the scheduled timer

               Finally, re-enable any automations whose timers expired
               while HA was down.
```

---

### `services.py` - The API

**Purpose:** Defines the services (commands) that users and the frontend can call. Like an API.

**What it does:**

```
Lines 44-64: Helper functions to find automations by area or label
             Used for "snooze all automations in the Kitchen" feature.

Lines 67-180: async_pause_automations() - THE MAIN SNOOZE FUNCTION

              Validation (lines 78-91):
              - Make sure ALL selected items are actually automations
              - If ANY is invalid, reject the whole request (atomic behavior)

              Time handling (lines 93-129):
              - If user provided resume_at date: use that
              - Otherwise: calculate resume time from days/hours/minutes
              - Validate that resume time is in the future
              - Validate that disable time is before resume time

              Execution (lines 131-180):
              - Lock to prevent race conditions
              - For each automation:
                - If scheduling for future: add to "scheduled" list
                - If immediate: disable it now and add to "paused" list
              - Save everything to disk
              - Notify listeners (so UI updates)

Lines 183-275: Service registration - Connects service names to functions

               handle_pause (lines 186-196):
               "autosnooze.pause" - Snooze specific automations

               handle_cancel (lines 198-209):
               "autosnooze.cancel" - Wake up specific automations early

               handle_cancel_all (lines 211-216):
               "autosnooze.cancel_all" - Wake up ALL snoozed automations

               handle_pause_by_area (lines 240-247):
               "autosnooze.pause_by_area" - Snooze all automations in an area

               handle_pause_by_label (lines 249-256):
               "autosnooze.pause_by_label" - Snooze all automations with a label

               handle_cancel_scheduled (lines 258-268):
               "autosnooze.cancel_scheduled" - Cancel a future scheduled snooze
```

---

### `sensor.py` - The Status Tracker

**Purpose:** Creates a sensor entity that tracks how many automations are snoozed. This is what the frontend reads to know current state.

**What it does:**

```
Lines 15-21: Setup function - Creates the sensor when integration loads

Lines 24-70: AutoSnoozeCountSensor class

             Properties (lines 27-30):
             - Icon: mdi:sleep (sleep icon)
             - Should poll: No (updates via listener, not polling)

             Constructor (lines 32-42):
             - Sets unique ID
             - Creates device info for Home Assistant

             async_added_to_hass (lines 44-51):
             When sensor is added to HA, register a listener so we get
             notified whenever state changes. When notified, write new state.

             async_will_remove_from_hass (lines 53-57):
             When sensor is removed, unregister the listener.

             native_value (lines 59-62):
             The sensor's main value = count of paused automations
             This is what shows up as the sensor state (e.g., "3")

             extra_state_attributes (lines 64-70):
             Additional data attached to the sensor:
             - paused_automations: Full details of all snoozed automations
             - scheduled_snoozes: Full details of all scheduled future snoozes

             The frontend reads these attributes to get all the data it needs.
```

---

### `const.py` - The Configuration

**Purpose:** Stores all the constants and configuration values in one place.

**What it does:**

```
Lines 16-23: Basic identifiers
             - DOMAIN: "autosnooze" - the integration's unique name
             - PLATFORMS: ["sensor"] - we create sensor entities
             - STORAGE_VERSION: 2 - version of our save file format

Lines 25-27: Retry configuration for saving
             - MAX_SAVE_RETRIES: 3 times
             - SAVE_RETRY_DELAYS: [0.1, 0.2, 0.4] seconds

Lines 29-41: Version reading
             Reads version from manifest.json for cache-busting URLs

Lines 43-45: Card paths
             Where the JavaScript file lives and what URL it's served at

Lines 47-84: Service schemas using Voluptuous (validation library)
             Defines what parameters each service accepts:

             PAUSE_SCHEMA: entity_id (required) + duration fields
             CANCEL_SCHEMA: just entity_id
             PAUSE_BY_AREA_SCHEMA: area_id + duration fields
             PAUSE_BY_LABEL_SCHEMA: label_id + duration fields

Lines 87-104: Label configurations
              Defines the include/exclude labels with their colors and icons
```

---

### `config_flow.py` - The Setup Wizard

**Purpose:** Handles the initial setup when user adds the integration.

**What it does:**

```
Lines 12-25: A simple one-step setup wizard
             - User clicks "Add Integration"
             - Shows a simple confirmation form
             - Creates the integration entry

             The _abort_if_unique_id_configured() prevents duplicate setups.
```

---

## Frontend (TypeScript) Files

These files create the visual card that users see in their dashboard.

---

### `src/index.ts` - The Entry Point

**Purpose:** The starting point for the frontend code. Registers the card with the browser.

**What it does:**

```
Lines 6-9: Import our card components and version number

Lines 12-17: Register custom HTML elements
             - autosnooze-card-editor (the settings panel)
             - autosnooze-card (the main card)

             customElements.define() tells the browser "when you see
             <autosnooze-card> in HTML, use this class to render it"

Lines 20-28: Register with Home Assistant's card picker
             When user clicks "Add Card", AutoSnooze shows up in the list
             with name, description, and preview capability.
```

---

### `src/components/autosnooze-card.ts` - The Main Card

**Purpose:** THE main visual card. This is what users see and interact with. (~1200 lines)

**What it does:**

```
Lines 1-58: Imports - pulling in all the tools and helpers we need

Lines 60-61: Define the card class extending LitElement (a web component framework)

Lines 63-100: State variables (things that change)
              @property: Data passed in from outside (hass, config)
              @state: Internal state (selected items, duration, search text, etc.)

              Key ones:
              - _selected: Array of automation IDs user has checked
              - _duration: How long to snooze (in milliseconds)
              - _search: Current search text
              - _filterTab: Which tab is active (all/areas/categories/labels)
              - _scheduleMode: Is user in "pick date/time" mode?
              - _loading: Is a snooze operation in progress?

Lines 102-118: Card configuration methods
               - getConfigElement(): Returns the editor for card settings
               - getStubConfig(): Default config for new cards
               - setConfig(): Apply configuration
               - getCardSize(): How tall the card is (for dashboard layout)

Lines 120-164: shouldUpdate() - Performance optimization
               "Should we re-render the card?"
               Only re-renders if:
               - The sensor changed (snooze state changed)
               - Entity registry changed (automations added/removed)
               - Areas changed
               - An automation entity changed state

               This prevents unnecessary re-renders which would cause lag.

Lines 166-179: updated() - Called after each render
               Fetches label, category, and entity registries if not yet loaded.

Lines 181-247: Lifecycle methods
               - connectedCallback(): Card added to page - start countdown timer
               - disconnectedCallback(): Card removed - cleanup all timers
               - _startSynchronizedCountdown(): Start a 1-second interval for countdown
               - _updateCountdownIfNeeded(): Only update if there are active snoozes

Lines 249-364: Data fetching and processing methods
               - _fetchLabelRegistry(): Get all labels from Home Assistant
               - _fetchCategoryRegistry(): Get all categories
               - _fetchEntityRegistry(): Get entity details (area, labels, etc.)
               - _getAutomations(): Get list of all automations (with caching!)
               - _getFilteredAutomations(): Apply search and label filters
               - _getGroupedByArea/Label/Category(): Group automations for display

Lines 379-420: Selection handlers
               - _toggleSelection(): Check/uncheck an automation
               - _toggleGroupExpansion(): Expand/collapse a group
               - _selectGroup(): Select all automations in a group
               - _selectAllVisible(): Select all visible automations
               - _clearSelection(): Uncheck everything

Lines 422-501: Duration and scheduling handlers
               - _setDuration(): Set snooze duration from preset buttons
               - _handleDurationInput(): Parse custom duration like "2h30m"
               - _enterScheduleMode(): Switch to date/time picker mode

Lines 503-570: UI helpers
               - _handleSearchInput(): Debounced search (waits 300ms after typing)
               - _showToast(): Show notification popup with optional undo button

Lines 572-708: _snooze() - THE MAIN SNOOZE ACTION
               When user clicks the Snooze button:
               1. Validate selection and duration
               2. If schedule mode, validate dates
               3. Call the backend service
               4. Show success toast with Undo option
               5. Clear selection

               The Undo callback:
               - Stores which automations were snoozed
               - If user clicks Undo, wakes them all back up

Lines 711-773: Wake actions
               - _wake(): Wake a single automation
               - _handleWakeAll(): Wake all (requires double-click confirmation!)
               - _cancelScheduled(): Cancel a scheduled future snooze

Lines 776-885: _renderSelectionList() - Renders the automation list
               If "All" tab: Simple flat list
               If grouped tab: Collapsible groups with checkboxes

               Each automation shows:
               - Checkbox for selection
               - Name
               - Area (when viewing by labels)

Lines 887-1008: _renderDurationSelector() - The duration picker
                In normal mode:
                - Preset buttons (30m, 1h, 4h, 1 day, Custom)
                - Custom input field with validation
                - Link to switch to schedule mode

                In schedule mode:
                - Date picker for disable time
                - Date picker for resume time
                - Link to switch back to duration mode

Lines 1010-1095: Rendering snoozed and scheduled lists
                 - _renderActivePauses(): Shows currently snoozed automations
                   with countdown timers and Wake buttons
                 - _renderScheduledPauses(): Shows future scheduled snoozes
                   with Cancel buttons

Lines 1097-1243: render() - THE MAIN RENDER FUNCTION
                 Puts everything together:
                 1. Header with icon and title
                 2. Filter tabs (All/Areas/Categories/Labels)
                 3. Search box
                 4. Selection actions (Select All / Clear)
                 5. Automation list
                 6. Duration selector
                 7. Snooze button
                 8. Snoozed automations section
                 9. Scheduled snoozes section
```

---

### `src/components/autosnooze-card-editor.ts` - The Settings Panel

**Purpose:** The configuration editor shown when user edits the card.

**What it does:**

```
Lines 12-59: A simple editor with just one field: Title

             When user changes the title, dispatches a "config-changed" event
             that Home Assistant listens for to update the card config.
```

---

### `src/services/snooze.ts` - Backend Communication

**Purpose:** Functions that call the backend services.

**What it does:**

```
Lines 11-21: pauseAutomations() - Call autosnooze.pause service
             Sends: entity_id, days, hours, minutes, disable_at, resume_at

Lines 26-35: pauseByArea() - Call autosnooze.pause_by_area service

Lines 41-50: pauseByLabel() - Call autosnooze.pause_by_label service

Lines 56-68: wakeAutomation() - Call autosnooze.cancel service

Lines 73-80: wakeAll() - Call autosnooze.cancel_all service

Lines 85-97: cancelScheduled() - Call autosnooze.cancel_scheduled service

All these are thin wrappers that:
1. Call hass.callService() with the right parameters
2. Log errors to console if something fails
3. Re-throw the error so the UI can show a message
```

---

### `src/services/registry.ts` - Fetching Registries

**Purpose:** Functions to fetch labels, categories, and entity info from Home Assistant.

**What it does:**

```
Lines 10-29: fetchLabelRegistry() - Get all labels
             Calls HA's config/label_registry/list API
             Returns a map: { label_id: { name, color, icon, description } }

Lines 34-54: fetchCategoryRegistry() - Get all automation categories
             Calls HA's config/category_registry/list API
             Only fetches categories for scope "automation"

Lines 59-80: fetchEntityRegistry() - Get entity details
             Calls HA's config/entity_registry/list API
             Filters to only automation entities
             Returns: { entity_id: { area_id, labels, categories } }
```

---

### `src/state/automations.ts` - Automation Data

**Purpose:** Functions to get and filter automations.

**What it does:**

```
Lines 12-16: formatRegistryId() - Convert "living_room" to "Living Room"

Lines 21-24: getAreaName() - Get human-readable area name from ID

Lines 29-34: getLabelName() - Get human-readable label name from ID

Lines 39-45: getCategoryName() - Get human-readable category name from ID

Lines 50-82: getAutomations() - Get all automations from Home Assistant
             For each automation entity:
             - Get its state (on/off)
             - Get its friendly name
             - Get its area, category, and labels from registry
             - Sort alphabetically by name

Lines 87-97: hasLabel() - Check if automation has a specific label

Lines 102-131: filterAutomations() - Apply filters to automation list
               Two modes:
               1. If ANY automation has "autosnooze_include" label:
                  → Only show automations with that label (whitelist)
               2. Otherwise:
                  → Show all EXCEPT those with "autosnooze_exclude" label

               Then filter by search text (name or ID contains search string)

Lines 136-159: groupAutomationsBy() - Group automations by a key
               Generic function used for grouping by area, label, or category
               Items without the key go in a default group ("Unassigned", etc.)

Lines 164-176: getUniqueCount() - Count unique values
               Used to show badge counts on tabs (e.g., "Areas (5)")
```

---

### `src/state/paused.ts` - Paused State

**Purpose:** Functions to read the current snooze state from the sensor entity.

**What it does:**

```
Lines 8: The sensor entity ID we read from: sensor.autosnooze_snoozed_automations

Lines 13-16: getPaused() - Get all paused automations
             Reads sensor.autosnooze_snoozed_automations attributes.paused_automations

Lines 21-24: getScheduled() - Get all scheduled snoozes
             Reads sensor.autosnooze_snoozed_automations attributes.scheduled_snoozes

Lines 29-58: getPausedGroupedByResumeTime() - Group paused by wake time
             Multiple automations snoozed for same duration show together
             Sorted by resume time (soonest first)

Lines 63-75: getPausedList() - Convert to array format

Lines 80-88: getScheduledList() - Convert to array format

Lines 93-102: getPausedCount() / getScheduledCount() - Simple counts
```

---

### `src/utils/datetime.ts` - Date/Time Utilities

**Purpose:** Helper functions for working with dates and times.

**What it does:**

```
Lines 18-30: getCurrentDateTime() - Get current date and time as separate strings
             Returns { date: "2024-01-15", time: "14:30" }

Lines 36-46: combineDateTime() - Combine date and time into ISO string
             "2024-01-15" + "14:30" → "2024-01-15T14:30-05:00"
             Includes timezone offset so backend knows the exact time

Lines 51-79: generateDateOptions() - Generate options for date dropdown
             Creates array of { value: "2024-01-15", label: "Mon, Jan 15" }
             for the next 365 days

Lines 84-87: isDateTimeInPast() - Check if a date/time has passed
```

---

### `src/utils/time-formatting.ts` - Time Display

**Purpose:** Functions to format times for display.

**What it does:**

```
Lines 11-29: formatDateTime() - Format ISO string for display
             "2024-01-15T14:30:00" → "Mon, Jan 15, 2:30 PM"
             Only shows year if it's different from current year

Lines 35-47: formatCountdown() - Format remaining time
             If 2 days, 3 hours, 45 minutes left → "2d 3h 45m"
             If timer expired → "Resuming..."

Lines 53-59: formatDuration() - Human readable duration
             1, 2, 30 → "1 day, 2 hours, 30 minutes"

Lines 64-70: formatDurationShort() - Short duration format
             1, 2, 30 → "1d 2h 30m"
```

---

### `src/utils/duration-parsing.ts` - Duration Input

**Purpose:** Parse user's custom duration input.

**What it does:**

```
Lines 13-67: parseDurationInput() - Parse strings like "2h30m"
             Supports:
             - "30m" → 30 minutes
             - "2h" → 2 hours
             - "1.5h" → 1 hour 30 minutes (decimals!)
             - "1d 2h 30m" → 1 day, 2 hours, 30 minutes
             - "90" → 90 minutes (plain number)

             Returns { days: 0, hours: 2, minutes: 30 } or null if invalid

Lines 72-74: isDurationValid() - Check if input is valid

Lines 79-81: durationToMinutes() - Convert to total minutes

Lines 86-92: minutesToDuration() - Convert minutes to { days, hours, minutes }
```

---

### `src/utils/haptic.ts` - Touch Feedback

**Purpose:** Provides vibration feedback on mobile devices.

**What it does:**

```
Lines 12-19: hapticFeedback() - Trigger phone vibration
             Uses the browser's Vibration API
             Different patterns for different actions:
             - "light": 10ms (subtle tap)
             - "success": [10, 50, 10] (two taps)
             - "error": [20, 100, 20, 100, 20] (three long taps)
```

---

### `src/utils/errors.ts` - Error Messages

**Purpose:** Convert backend errors to user-friendly messages.

**What it does:**

```
Lines 18-37: getErrorMessage() - Translate error to friendly message

             Backend might return: { translation_key: "not_automation" }
             This converts it to: "One or more selected items are not automations"

             Falls back to default message if error not recognized.
```

---

### `src/constants/index.ts` - Frontend Constants

**Purpose:** All the constant values used by the frontend.

**What it does:**

```
Lines 17-22: TIME_MS - Milliseconds for time units
             SECOND: 1000, MINUTE: 60000, HOUR: 3600000, DAY: 86400000

Lines 27-30: MINUTES_PER - Minutes per time unit
             HOUR: 60, DAY: 1440

Lines 35-42: UI_TIMING - UI-related timing constants
             - SEARCH_DEBOUNCE_MS: 300 (wait 300ms after typing before searching)
             - TOAST_DURATION_MS: 5000 (toast shows for 5 seconds)
             - WAKE_ALL_CONFIRM_MS: 3000 (double-click timeout for Wake All)
             - COUNTDOWN_INTERVAL_MS: 1000 (update countdowns every second)

Lines 47-53: DEFAULT_DURATIONS - The preset duration buttons
             30m, 1h, 4h, 1 day, Custom

Lines 63-68: ERROR_MESSAGES - User-friendly error messages

Lines 73-78: EXCLUDE_LABEL / INCLUDE_LABEL - The filter label names

Lines 83-90: HAPTIC_PATTERNS - Vibration patterns for different feedback types
```

---

### `src/types/*.ts` - Type Definitions

**Purpose:** TypeScript type definitions (like templates for data shapes).

These files don't contain logic - they just define what data looks like:

- `automation.ts`: Types for PausedAutomation, ScheduledSnooze, AutomationItem
- `hass.ts`: Types for Home Assistant objects (entities, areas, labels)
- `card.ts`: Types for card configuration

---

## How Data Flows Through the System

### When User Clicks "Snooze":

```
1. User clicks Snooze button in frontend
   └── autosnooze-card.ts: _snooze() method

2. Frontend calls backend service
   └── snooze.ts: pauseAutomations()
   └── Calls: hass.callService('autosnooze', 'pause', {...})

3. Backend service handler receives call
   └── services.py: handle_pause()
   └── Calls: async_pause_automations()

4. Backend validates and processes
   └── services.py: async_pause_automations()
   └── Checks all entities are automations
   └── Calculates resume time
   └── For each automation:
       └── coordinator.py: async_set_automation_state(enabled=False)
       └── Creates PausedAutomation record
       └── coordinator.py: schedule_resume() - sets timer

5. Backend saves state
   └── coordinator.py: async_save()
   └── Writes to .storage/autosnooze.storage

6. Backend notifies listeners
   └── models.py: data.notify()

7. Sensor updates
   └── sensor.py: AutoSnoozeCountSensor writes new state

8. Frontend sees change
   └── autosnooze-card.ts: shouldUpdate() returns true
   └── Card re-renders with new state
```

### When Timer Expires (Automation Wakes Up):

```
1. Home Assistant timer fires
   └── coordinator.py: on_timer callback

2. Resume function runs
   └── coordinator.py: async_resume()
   └── Cancels timer
   └── Removes from paused dict
   └── coordinator.py: async_set_automation_state(enabled=True)
   └── coordinator.py: async_save()

3. Backend notifies listeners
   └── models.py: data.notify()

4. Sensor updates → Frontend re-renders
```

### When Home Assistant Restarts:

```
1. HA starts up, loads AutoSnooze
   └── __init__.py: async_setup_entry()

2. Wait for HA to fully start
   └── Listens for "homeassistant_started" event

3. Load saved state
   └── coordinator.py: async_load_stored()
   └── Reads from .storage/autosnooze.storage

4. For each saved automation:
   └── If timer expired: Re-enable automation
   └── If still valid: Re-disable and reschedule timer

5. Notify listeners → UI updates
```

---

## Summary

AutoSnooze is a well-architected application with clear separation of concerns:

- **Backend** handles all business logic, state management, and persistence
- **Frontend** handles user interaction and display
- **Sensor** bridges the two by exposing state that the frontend can read
- **Services** provide the API for frontend→backend communication

The code is defensive (validates everything), efficient (batches operations, caches data), and robust (retries on failure, survives restarts).
