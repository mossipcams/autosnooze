# Codebase Structure

**Analysis Date:** 2026-01-31

## Directory Layout

```
/Users/matt/Desktop/Projects/autosnooze/
├── custom_components/
│   └── autosnooze/              # Home Assistant integration package
│       ├── __init__.py          # Entry point, integration lifecycle
│       ├── coordinator.py       # State management, timers, persistence
│       ├── services.py          # Service handlers
│       ├── models.py            # Data structures
│       ├── sensor.py            # Sensor entity platform
│       ├── config_flow.py       # Integration setup UI
│       ├── const.py             # Constants and schemas
│       ├── services.yaml        # Service definitions for HA
│       ├── manifest.json        # Integration metadata
│       ├── www/                 # Compiled frontend card
│       │   └── autosnooze-card.js
│       └── translations/        # i18n files
│
├── src/                         # TypeScript frontend source
│   ├── index.ts                 # Entry point, custom element registration
│   ├── components/
│   │   ├── autosnooze-card.ts   # Main card component (~3000 lines)
│   │   └── autosnooze-card-editor.ts  # Card config editor
│   ├── services/                # WebSocket API wrappers
│   │   ├── registry.ts          # Fetch areas, labels, entities
│   │   ├── snooze.ts            # Pause/wake service calls
│   │   └── storage.ts           # LocalStorage for duration persistence
│   ├── state/                   # Data selection/filtering
│   │   ├── automations.ts       # Filter, group, search automations
│   │   └── paused.ts            # Pause state selectors
│   ├── utils/                   # Helper functions
│   │   ├── duration-parsing.ts  # Parse duration input
│   │   ├── datetime.ts          # Format/combine dates
│   │   ├── time-formatting.ts   # Format countdown timers
│   │   ├── errors.ts            # Error message extraction
│   │   └── haptic.ts            # Haptic feedback
│   ├── styles/                  # CSS modules
│   │   └── card.styles.ts       # Main card styles
│   ├── constants/               # Constants
│   │   └── index.ts             # Durations, time constants
│   ├── localization/            # i18n
│   │   └── localize.ts          # Translation function
│   └── types/                   # TypeScript interfaces
│       ├── hass.ts              # Home Assistant types
│       ├── card.ts              # Card config types
│       └── automation.ts        # Automation domain types
│
├── tests/                       # Test files
│   ├── conftest.py              # pytest fixtures
│   ├── test_*.py                # Python backend tests
│   └── test_*.spec.ts           # TypeScript frontend tests
│
├── e2e/                         # Playwright E2E tests
│   ├── global-setup.ts          # Authentication setup
│   ├── playwright.config.ts     # Test configuration
│   ├── tests/                   # Feature test files
│   ├── fixtures/                # Test data
│   ├── pages/                   # Page objects
│   └── helpers/                 # Test utilities
│
├── config/                      # Local Home Assistant instance for dev (not committed)
├── package.json                 # Node/npm dependencies, scripts, version
├── pyproject.toml               # Python project config
├── rollup.config.mjs            # Frontend bundler config
├── vitest.config.mjs            # JavaScript test runner config
├── pyrightconfig.json           # Python type checker config
├── stryker.config.mjs           # Mutation testing config
├── manifest.json                # DEPRECATED: Use custom_components/autosnooze/manifest.json
├── README.md                    # User documentation
├── CHANGELOG.md                 # Release notes
└── KNOWN_DEFECTS.md             # Known issues with fixes applied
```

## Directory Purposes

**custom_components/autosnooze/:**
- Purpose: Home Assistant integration package
- Contains: Python backend code, service definitions, compiled frontend
- Key files: `__init__.py` (setup), `coordinator.py` (state), `services.py` (handlers)

**src/components/:**
- Purpose: Lit web components
- Contains: Main card component, config editor
- Key files: `autosnooze-card.ts` (3000+ lines, all UI logic)

**src/services/:**
- Purpose: WebSocket API clients
- Contains: Home Assistant service call wrappers, registry fetchers, storage helpers
- Pattern: Each service has its own file (`registry.ts`, `snooze.ts`, `storage.ts`)

**src/state/:**
- Purpose: State selectors and data transformers
- Contains: Automation filtering/grouping, paused state helpers
- Pattern: Pure functions that transform Hass data for UI consumption

**src/utils/:**
- Purpose: Reusable utility functions
- Contains: Duration parsing, datetime formatting, error handling, haptic feedback
- Pattern: Organized by concern (duration-parsing.ts, time-formatting.ts, etc.)

**src/styles/:**
- Purpose: CSS styling
- Contains: Lit CSS module exports
- Pattern: CSS-in-JS via `css` tagged template literals

**src/types/:**
- Purpose: TypeScript type definitions
- Contains: Home Assistant interfaces, card config schema, automation types
- Pattern: Organized by domain (hass.ts, card.ts, automation.ts)

**src/localization/:**
- Purpose: Internationalization
- Contains: Translation function that loads JSON language files
- Pattern: Namespace-based key lookup

**src/constants/:**
- Purpose: Constants used by frontend
- Contains: Time multipliers (TIME_MS), default durations, label constants
- Key exports: `CARD_VERSION` (injected from package.json at build time)

**tests/:**
- Purpose: pytest (Python) and Vitest (TypeScript) tests
- Structure: `conftest.py` provides fixtures, test files follow `test_*.py` or `test_*.spec.ts` pattern
- Naming: Test files are co-located with source where practical, or grouped by feature

**e2e/:**
- Purpose: Playwright end-to-end tests
- Structure: Page object model (pages/), test helpers (helpers/), feature tests (tests/)
- Setup: `global-setup.ts` handles authentication against local Home Assistant

## Key File Locations

**Entry Points:**

- `custom_components/autosnooze/__init__.py` - Backend integration setup, lifecycle hooks
- `src/index.ts` - Frontend custom element registration
- `tests/conftest.py` - pytest fixture setup for all tests
- `e2e/global-setup.ts` - E2E test authentication

**Configuration:**

- `custom_components/autosnooze/manifest.json` - Integration metadata (version, requirements)
- `custom_components/autosnooze/const.py` - Backend constants and service schemas
- `src/constants/index.ts` - Frontend constants
- `package.json` - NPM version (must match manifest.json)
- `pyproject.toml` - Python dependencies and test config

**Core Logic:**

- `custom_components/autosnooze/coordinator.py` - Timer management, state persistence, automation control
- `custom_components/autosnooze/services.py` - Service handler implementations
- `src/components/autosnooze-card.ts` - Main UI component

**State Management:**

- `custom_components/autosnooze/models.py` - Data structures (PausedAutomation, ScheduledSnooze)
- `src/state/automations.ts` - Automation filtering and grouping
- `src/state/paused.ts` - Paused automation selectors

**Services/API:**

- `custom_components/autosnooze/services.py` - Backend service handlers
- `src/services/snooze.ts` - WebSocket pause/wake calls
- `src/services/registry.ts` - WebSocket registry fetches
- `src/services/storage.ts` - LocalStorage for duration persistence

**Testing:**

- `tests/test_integration.py` - Full integration tests
- `tests/test_coordinator.py` - Timer and state management tests
- `tests/test_storage.spec.ts` - Frontend storage tests
- `e2e/tests/` - Playwright feature tests

## Naming Conventions

**Files:**

- Backend: `snake_case.py` for modules, classes use PascalCase (`AutoSnoozeCountSensor`)
- Frontend TypeScript: `kebab-case.ts` for components (`autosnooze-card.ts`), utilities can be kebab or snake case
- Test files: `test_*.py` (pytest) or `test_*.spec.ts` (Vitest) or `*.spec.ts` (Vitest)
- Constants: `UPPER_SNAKE_CASE` in both languages

**Directories:**

- Backend: `snake_case` (e.g., `custom_components`)
- Frontend: `kebab-case` or `snake_case` (e.g., `src/components`, `src/utils`)
- Test suites: `tests/`, `e2e/` (lowercase plural)

## Where to Add New Code

**New Feature (Backend):**

1. **Service handler:** Add method in `custom_components/autosnooze/services.py`
   - Template: `async def async_handle_new_service(hass, data, **kwargs): ...`
   - Schema: Add voluptuous schema to `const.py`
   - Registration: Add to `register_services()` call in `__init__.py`
   - Service definition: Add YAML entry to `services.yaml`

2. **Coordinator support:** Add helper in `custom_components/autosnooze/coordinator.py`
   - Template: Async function with `hass: HomeAssistant, data: AutomationPauseData` parameters
   - Use `data.lock` for concurrent access protection

3. **Data model:** Update `custom_components/autosnooze/models.py`
   - Add fields to dataclass, implement `to_dict()`/`from_dict()` for serialization
   - Update storage validation in `coordinator.py` - `validate_stored_entry()`

4. **Tests:** Create `tests/test_new_feature.py`
   - Use fixtures from `conftest.py`: `mock_hass_with_automations`, `mock_store`

**New Feature (Frontend):**

1. **UI Component:** Modify `src/components/autosnooze-card.ts`
   - Use Lit `@state()` decorator for reactive properties
   - Use Lit `@property()` for external inputs
   - Register event listeners in `connectedCallback()`
   - Clean up in `disconnectedCallback()`

2. **Service call:** Add wrapper in `src/services/snooze.ts` or create new file
   - Template: `async function callNewService(hass, params): Promise<Response> { ... }`

3. **State helper:** Add selector in `src/state/automations.ts` or `src/state/paused.ts`
   - Template: Pure function that filters/transforms Hass data

4. **Utility:** Create new file in `src/utils/`
   - Organize by concern (e.g., `src/utils/new-feature.ts`)

5. **Type:** Add interface to `src/types/` appropriate file
   - Usually in `src/types/automation.ts` or `src/types/hass.ts`

6. **Tests:** Create `tests/test_new_feature.spec.ts`
   - Use Vitest with jsdom environment
   - Mock Home Assistant via fixtures

**New Component/Module:**

Backend:
- Create `custom_components/autosnooze/new_module.py`
- Import in `__init__.py`
- Update tests if new public API

Frontend:
- Create `src/new_directory/` if grouping multiple files
- Use barrel file pattern: `src/new_directory/index.ts` exports main symbols

**Utilities:**

- Shared helpers: `src/utils/helper-name.ts` (frontend) or `custom_components/autosnooze/helpers.py` (backend) - NOT YET USED
- Constants: Add to existing `constants/` files, not scattered
- Types: Keep in `src/types/` organized by domain

## Special Directories

**www/ (Compiled Frontend):**
- Purpose: Holds compiled JavaScript card after `npm run build`
- Generated: Yes (from `src/` via Rollup)
- Committed: Yes (essential for distribution via HACS)
- File: `custom_components/autosnooze/www/autosnooze-card.js`

**config/ (Local Dev Instance):**
- Purpose: Local Home Assistant for manual testing
- Generated: Yes (created by devcontainer setup)
- Committed: No (listed in .gitignore)

**coverage/ (Test Coverage Reports):**
- Purpose: HTML coverage reports from pytest-cov and Vitest
- Generated: Yes (from `npm test` and `pytest tests/`)
- Committed: No (listed in .gitignore)

**e2e/.auth/ (E2E Authentication):**
- Purpose: Playwright authentication state cache
- Generated: Yes (from `global-setup.ts`)
- Committed: No (listed in .gitignore)

**translations/ (i18n):**
- Purpose: Localization files for Home Assistant UI
- Generated: No (maintained by project)
- Committed: Yes
- Structure: `translations/{lang}.json` (e.g., `en.json`, `de.json`)

---

*Structure analysis: 2026-01-31*
