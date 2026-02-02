# Architecture

**Analysis Date:** 2026-01-31

## Pattern Overview

**Overall:** Layered architecture with clear separation between frontend (Lit web component), backend (Home Assistant integration), and coordinating state management.

**Key Characteristics:**
- Event-driven with listener pattern for state updates
- Async/await throughout for non-blocking I/O
- Persistent state with retry logic for reliability
- Unidirectional data flow: services → coordinator → state → sensor/frontend
- Type-safe with TypeScript frontend and Python type hints

## Layers

**Backend Integration Layer (Python):**
- Purpose: Home Assistant integration entry point, lifecycle management, service registration
- Location: `custom_components/autosnooze/__init__.py`
- Contains: Integration setup/unload, Lovelace resource registration with retry logic, label creation
- Depends on: HomeAssistant core, coordinator, models, services
- Used by: Home Assistant plugin system

**Coordinator Layer (Python):**
- Purpose: Central state management, timer scheduling, persistence, automation state control
- Location: `custom_components/autosnooze/coordinator.py`
- Contains: Timer lifecycle (`schedule_resume`, `schedule_disable`), batch operations, storage validation, automation state toggling
- Depends on: Home Assistant utilities, models
- Used by: Service handlers, initialization, unload

**Service Layer (Python):**
- Purpose: Home Assistant service handlers that implement snooze/wake business logic
- Location: `custom_components/autosnooze/services.py`
- Contains: Service handlers for `pause`, `cancel`, `pause_by_area`, `pause_by_label`, `cancel_scheduled`
- Depends on: Coordinator, models, constants
- Used by: Home Assistant service dispatch

**Data Models Layer (Python):**
- Purpose: Data structures with serialization/deserialization for persistent storage
- Location: `custom_components/autosnooze/models.py`
- Contains: `PausedAutomation`, `ScheduledSnooze`, `AutomationPauseData`, datetime parsing/validation
- Depends on: Home Assistant config entries, storage API
- Used by: Coordinator, services, sensor

**Sensor Platform Layer (Python):**
- Purpose: Exposes integration state as Home Assistant sensor entity
- Location: `custom_components/autosnooze/sensor.py`
- Contains: `AutoSnoozeCountSensor` - count of snoozed automations + attributes with paused/scheduled details
- Depends on: Models, constants
- Used by: Home Assistant entity platform

**Frontend Card Layer (TypeScript/Lit):**
- Purpose: User interface for viewing and controlling snoozed automations
- Location: `src/components/autosnooze-card.ts`
- Contains: Main card component with duration input, automation filtering, scheduling, UI state management
- Depends on: Home Assistant WebSocket, services layer, state helpers, localization
- Used by: Lovelace dashboard

**Frontend Utilities Layer (TypeScript):**
- Purpose: Helper functions for formatting, parsing, state management, and WebSocket communication
- Location: `src/utils/`, `src/state/`, `src/services/`
- Contains: Duration parsing, datetime formatting, automation filtering, registry fetching, service calls
- Depends on: Home Assistant types
- Used by: Main card component

## Data Flow

**Snooze Automation Flow:**

1. User selects automation(s) and duration in card UI
2. `pauseAutomations()` service call via WebSocket → backend `autosnooze.pause` service
3. Service handler validates entity IDs, calculates resume time
4. Coordinator `async_pause_automations()` disables automation via `automation.turn_off` service
5. Coordinator stores `PausedAutomation` in memory + persists to disk via `Store.async_save()`
6. Sensor listener notified → `async_write_ha_state()` updates sensor
7. Frontend observes sensor state change → refreshes UI with paused automation list

**Auto-Resume Flow (Timer-Based):**

1. Coordinator calls `schedule_resume()` which registers timer via `async_track_point_in_time()`
2. When timer fires, `async_resume()` is called asynchronously
3. Automation re-enabled via `automation.turn_on` service
4. `PausedAutomation` removed from state, disk saved
5. Sensor notified of change
6. Frontend re-renders with updated list

**Scheduled Snooze Flow (Two-Stage):**

1. User sets future disable_at and resume_at times
2. Service stores `ScheduledSnooze` in `data.scheduled` dict
3. Coordinator calls `schedule_disable()` for disable_at time
4. When disable_at time arrives, `async_execute_scheduled_disable()` runs:
   - Disables automation
   - Moves entry from `scheduled` to `paused`
   - Schedules resume at resume_at time
5. Normal resume flow continues from there

**State Management:**

- Runtime state: `AutomationPauseData` dataclass holds `paused` and `scheduled` dicts + timer refs
- Persistent storage: Home Assistant `Store` API with exponential backoff retry
- Notifications: Observer pattern via `data.listeners` list for state changes
- Validation: `validate_stored_data()` sanitizes storage on load, drops invalid entries

## Key Abstractions

**AutomationPauseData (State Container):**
- Purpose: Central runtime state holder with async-safe access
- Location: `custom_components/autosnooze/models.py`
- Pattern: Dataclass with `asyncio.Lock` for concurrent access, listener list for notifications
- Example usage: Stored in `entry.runtime_data` across lifecycle

**PausedAutomation (Domain Model):**
- Purpose: Represents a snoozed automation with resume time and duration breakdown
- Location: `custom_components/autosnooze/models.py`
- Pattern: Dataclass with `to_dict()`/`from_dict()` for serialization
- Contains: entity_id, friendly_name, resume_at, paused_at, days/hours/minutes breakdown, optional disable_at

**ScheduledSnooze (Domain Model):**
- Purpose: Represents a future snooze not yet activated
- Location: `custom_components/autosnooze/models.py`
- Pattern: Dataclass with serialization for storage
- Contains: entity_id, friendly_name, disable_at, resume_at

**Store (Persistence Abstraction):**
- Purpose: Encapsulates Home Assistant storage with retry logic
- Location: `custom_components/autosnooze/coordinator.py` - `async_save()`
- Pattern: Exponential backoff on transient errors (IOError, OSError)
- Retries: Up to 3 attempts with delays [0.1s, 0.2s, 0.4s]

**AutomationPauseCard (Frontend State Machine):**
- Purpose: Main Lit component managing card UI state and interactions
- Location: `src/components/autosnooze-card.ts`
- Pattern: Reactive properties with `@state()` decorator trigger re-renders
- State: Selected automations, duration input, schedule mode, registries cache, loading flag

## Entry Points

**Backend Integration Setup:**
- Location: `custom_components/autosnooze/__init__.py` - `async_setup_entry()`
- Triggers: Home Assistant loads config entry for autosnooze domain
- Responsibilities: Create Store, register static path, register Lovelace resource with retry, load persisted state, register services, create sensor platform

**Service Handlers:**
- Location: `custom_components/autosnooze/services.py`
- Entry functions: `async_pause_automations()`, `async_cancel_resume()`, `async_pause_by_area()`, `async_pause_by_label()`, `async_cancel_scheduled()`
- Triggers: User calls service via frontend or automation
- Responsibilities: Validate inputs, coordinate state changes, batch operations for efficiency

**Frontend Card Render:**
- Location: `src/components/autosnooze-card.ts` - `render()`
- Triggers: Hass object property change, Lit lifecycle
- Responsibilities: Fetch registries on first connection, manage UI layout, handle user interactions

**Timer Callbacks:**
- Location: `custom_components/autosnooze/coordinator.py` - `schedule_resume()`, `schedule_disable()`
- Triggers: `async_track_point_in_time()` fires
- Responsibilities: Check unloaded flag, create async task for state change, handle failures gracefully

## Error Handling

**Strategy:** Layered validation with graceful degradation and persistence recovery

**Patterns:**

- **Service Validation:** `ServiceValidationError` raised before any state changes. Entity IDs validated atomically (all or nothing).
- **Storage Errors:** Transient errors (IOError, OSError) trigger exponential backoff retry. Non-transient errors logged and return False to caller.
- **Automation State Errors:** `async_set_automation_state()` returns bool. Failures logged but don't prevent cleanup (DEF-012 fix removes unfixable entries).
- **Lovelace Registration:** Retry logic with exponential backoff. Falls back to manual registration instructions if all retries exhaust.
- **Unload Safety:** All timer callbacks check `data.unloaded` flag before executing. Prevents post-unload operations.
- **Data Corruption:** `validate_stored_data()` sanitizes loaded state, drops invalid entries with logging, continues with valid subset.

## Cross-Cutting Concerns

**Logging:**
- Location: `_LOGGER` from `logging` module used throughout
- Pattern: Structured logging with context (entity_id, attempt count, error details)
- Levels: DEBUG (cache hits, retry attempts), INFO (successful operations), WARNING (validation failures, recoverable errors), ERROR (persistent failures)

**Validation:**
- Backend: Voluptuous schemas in `const.py` for service parameters. UTC datetime normalization via `ensure_utc_aware()`.
- Frontend: Input type checking, duration validation, date constraint validation (disable_at < resume_at).
- Storage: `validate_stored_entry()` and `validate_stored_data()` with field-level validation on load.

**Authentication:**
- Home Assistant built-in via config entries. Services restricted to Home Assistant service calls only. WebSocket communication authenticated via Home Assistant session.

**Concurrency:**
- Backend: `asyncio.Lock` in `AutomationPauseData` protects `paused` and `scheduled` dicts from race conditions
- Frontend: Timeouts on operations, debounced search input, single-threaded JavaScript event loop
- Batch operations: `async_resume_batch()` and `async_cancel_scheduled_batch()` reduce save I/O (DEF-011 fix)

---

*Architecture analysis: 2026-01-31*
