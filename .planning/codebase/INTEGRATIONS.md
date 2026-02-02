# External Integrations

**Analysis Date:** 2026-01-31

## APIs & External Services

**Home Assistant WebSocket API:**
- Service: Home Assistant internal WebSocket connection
- What it's used for: Registry queries (labels, categories, entities), service calls (pause/cancel)
- SDK/Client: `hass.connection.sendMessagePromise()` in `src/services/registry.ts`
- Auth: Handled by Home Assistant session (no separate token)
- Implementation:
  - Label registry fetch via `config/label_registry/list` message type
  - Category registry fetch via `config/category_registry/list` message type with scope=automation
  - Entity registry fetch via `config/entity_registry/list` message type
  - All implemented in `src/services/registry.ts`

**Home Assistant REST Service Calls:**
- Service: Home Assistant service call API
- What it's used for: Triggering pause/cancel/cancel_all services
- Implementation: `hass.callService("autosnooze", service_name, {entity_id, days, hours, minutes, disable_at, resume_at})`
- Auth: Handled by Home Assistant session
- Service schemas defined in `custom_components/autosnooze/services.py` and `const.py`

## Data Storage

**Databases:**
- Home Assistant Store API - JSON persistence
  - Connection: Via `homeassistant.helpers.storage.Store`
  - Client: Custom wrapper in `coordinator.py` with exponential backoff retry logic
  - Storage key: `{DOMAIN}.storage` (autosnooze.storage)
  - Storage version: 2 (from `const.py`)
  - Retry strategy: 3 max attempts with delays [0.1s, 0.2s, 0.4s] exponential backoff
  - Stored data: Serialized `AutomationPauseData` containing paused automations and scheduled snoozes
  - See `async_load_stored()` and `async_save()` in `coordinator.py`

**File Storage:**
- Local filesystem only
- Frontend card bundle: `custom_components/autosnooze/www/autosnooze-card.js` (static asset)
- Card registered via `homeassistant.components.http.StaticPathConfig` in `__init__.py`

**Caching:**
- Browser localStorage (optional, degraded without it)
  - Used in `src/services/storage.ts` for caching last-used duration
  - Graceful degradation: "localStorage may be unavailable (private browsing, quota exceeded, etc.)"
- In-memory registry caches: `_labelRegistry`, `_categoryRegistry`, `_entityRegistry` in `autosnooze-card.ts`
  - Validity tracked with `_registryValidityKey` to detect HA restarts
  - Refetched on connection/mount/validity change

## Authentication & Identity

**Auth Provider:**
- Home Assistant built-in session authentication
- Custom integration leverages existing HA session (no separate auth layer)
- No API keys, OAuth, or external identity provider
- Access controlled via HA user permissions

## Monitoring & Observability

**Error Tracking:**
- None detected - integration does not report errors to external services

**Logs:**
- Home Assistant native logging
  - Python backend: `logging.getLogger(__name__)` in all Python modules
  - Frontend: `console.warn()` and `console.log()` for debugging
  - Example: "[AutoSnooze] Failed to fetch label registry:" warnings in `registry.ts`

**Debugging:**
- Local Home Assistant instance in devcontainer (port 8124)
- Playwright E2E tests capture screenshots and videos on failure

## CI/CD & Deployment

**Hosting:**
- Home Assistant Community Store (HACS) - distribution channel
  - Manifest: `custom_components/autosnooze/manifest.json`
  - HACS config: `hacs.json` (content_in_root: false, render_readme: true)
  - Documentation: GitHub repository (https://github.com/mossipcams/autosnooze)

**CI Pipeline:**
- GitHub Actions (`.github/workflows/build.yml`)
  - Python linting: ruff check + format validation
  - JavaScript linting: ESLint + npm audit (high severity)
  - Type checking: Pyright (Python), TypeScript tsc (JavaScript)
  - Version validation: Ensures package.json and manifest.json match
  - Tests: Vitest (JavaScript) with 85% coverage threshold, pytest (Python) with 85% threshold
  - Build: Rollup bundling + verification of no bare `lit` imports
  - Runs on: ubuntu-latest
  - Caching: ruff cache for faster linting

**Release Management:**
- release-please (`.github/workflows/release-please.yml`)
  - Automated releases based on conventional commits
  - Version synchronization across package.json and manifest.json
  - Git tag and GitHub Release creation

**Additional Validations:**
- Hassfest validation (`.github/workflows/validate.yml`) - Home Assistant integration manifest validation
- Semgrep static analysis (`.github/workflows/semgrep.yml`) - Code quality scanning

## Environment Configuration

**Required env vars:**
- HA_URL - Home Assistant base URL for E2E tests (defaults to http://localhost:8124)
  - Set in playwright.config.ts
  - Used by Playwright E2E tests

**Secrets location:**
- No external secrets required
- E2E test auth stored in `.auth/user.json` (Playwright's built-in storage)

**Home Assistant dependencies:**
- Listed in `manifest.json` as: frontend, http, lovelace
- No external Python packages required (empty "requirements" array)
- Uses Home Assistant's built-in APIs and helpers

## Webhooks & Callbacks

**Incoming:**
- None - integration does not expose webhooks

**Outgoing:**
- None - integration does not call external webhooks

**Events:**
- Home Assistant state change listeners: `coordinator.async_add_listener()`
- Automation state updates propagate via Home Assistant event bus
- Frontend updates via WebSocket when coordinator data changes

## Integration Type

**Classification:** local_push service integration
- Runs locally within Home Assistant
- No cloud connectivity required
- Configuration via Home Assistant UI (OptionsFlow in `config_flow.py`)

---

*Integration audit: 2026-01-31*
