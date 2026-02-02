# Coding Conventions

**Analysis Date:** 2026-01-31

## Naming Patterns

**Files:**
- TypeScript source files: kebab-case with `.ts` extension (e.g., `autosnooze-card.ts`, `duration-parsing.ts`)
- Python source files: snake_case with `.py` extension (e.g., `config_flow.py`, `coordinator.py`)
- Test files: descriptive names matching source files with `.spec.ts` or `.spec.js` suffix for JavaScript, `test_*.py` for Python
- Style files: kebab-case with `.styles.ts` (e.g., `card.styles.ts`, `editor.styles.ts`)

**Functions:**
- TypeScript: camelCase (e.g., `pauseAutomations`, `loadLastDuration`, `createMockHass`)
- Python: snake_case (e.g., `async_set_automation_state`, `get_friendly_name`, `validate_stored_entry`)
- Async functions: prefixed with `async` (Python) or `async` keyword (TypeScript)
- Private/internal functions: prefixed with underscore in both languages (e.g., `_cancel_timer_from_dict`, `_async_retry_or_fail`)

**Variables:**
- TypeScript: camelCase (e.g., `mockHass`, `automationItems`, `selectedDurations`)
- Python: snake_case (e.g., `resume_at`, `paused_at`, `entity_id`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_SNOOZE_MINUTES`, `LOVELACE_REGISTER_MAX_RETRIES`)
- Unused parameters: prefixed with underscore (e.g., `_now: datetime`, `_hass: HomeAssistant`)

**Types:**
- TypeScript: PascalCase interfaces and types (e.g., `HomeAssistant`, `PauseServiceParams`, `AutomationItem`)
- Python: PascalCase for classes (e.g., `PausedAutomation`, `AutomationPauseData`)
- Generic type parameters: single letter or descriptive (e.g., `T extends HTMLElement`, `K, V`)

## Code Style

**Formatting:**
- JavaScript/TypeScript: ESLint enforced via `.eslintrc.json`
- Python: Ruff formatter with 120-char line length (see `pyproject.toml`)
- Quote style: double quotes for Python, automatic in TypeScript via ESLint
- Indentation: 2 spaces for TypeScript/JavaScript, 4 spaces for Python (implicit via black-compatible formatter)

**Linting:**
- TypeScript/JavaScript: ESLint with TypeScript plugin
  - Rules enforced: `prefer-const`, `no-var`, `eqeqeq` (always), `no-multiple-empty-lines`
  - Unused variable rule: ignore parameters starting with underscore
- Python: Ruff linter with pycodestyle, Pyflakes, flake8-bugbear, flake8-comprehensions, flake8-simplify
  - Target: Python 3.12+
  - Ignored rules: E501 (line length handled by formatter), SIM102/105/108 (readability exceptions)
  - Future rules planned: isort (I), pyupgrade (UP)

## Import Organization

**Order (TypeScript):**
1. Third-party packages (e.g., `import { LitElement, html } from 'lit'`)
2. Relative imports from parent directories (e.g., `import type { HomeAssistant } from '../types/hass.js'`)
3. Relative imports from sibling directories (e.g., `import { localize } from '../localization/localize.js'`)
4. Relative imports from current directory (e.g., `import { cardStyles } from './card.styles.js'`)

**Order (Python):**
1. `from __future__ import annotations` (for type hints with forward references)
2. Standard library imports
3. Third-party imports (Home Assistant, etc.)
4. Relative imports from current integration (e.g., `from .coordinator import async_load_stored`)

**Path Aliases:**
- No path aliases configured in TypeScript (all imports use relative paths)
- Python first-party: `custom_components.autosnooze` (configured in `pyproject.toml` for ruff)

## Error Handling

**Patterns:**
- TypeScript: try-catch blocks with error logging and re-throw
  - Example: `try { await hass.callService(...) } catch (error) { console.error('[AutoSnooze] Failed...', error); throw error; }`
  - Always include context in error messages with `[AutoSnooze]` prefix
  - Log errors to console before rethrowing for debugging

- Python: Named exceptions with descriptive error messages
  - Use `_LOGGER.error()`, `_LOGGER.warning()`, `_LOGGER.debug()` for logging (logger initialized as `_LOGGER = logging.getLogger(__name__)`)
  - Example: `_LOGGER.error("Failed to %s %s: %s", "wake" if enabled else "snooze", entity_id, err)`
  - Raise `ValueError` for input validation failures with message details
  - Catch and handle `Exception` broadly in async operations, log details

- Validation errors: Return `None` or `False` rather than throwing in utility functions (e.g., `parse_datetime_utc`, `validate_stored_entry`)

## Logging

**Framework:**
- TypeScript: native `console.error()`, `console.warn()`, `console.info()`
- Python: `logging` module with `_LOGGER = logging.getLogger(__name__)` pattern

**Patterns:**
- TypeScript: Include `[AutoSnooze]` prefix in all error/warning messages for consistency
  - Error: `console.error('[AutoSnooze] Failed to pause automations:', error)`
  - Warning: `console.warn('[AutoSnooze] Failed to fetch label registry:', err)`

- Python: Use `%s` string formatting with positional arguments (not f-strings in log calls)
  - Example: `_LOGGER.debug("Retrying in %ds (attempt %d/%d)", delay, attempt, max_retries)`
  - Log at appropriate level: `debug` for detailed, `info` for general flow, `warning` for recoverable issues, `error` for failures

## Comments

**When to Comment:**
- Complex algorithms or non-obvious logic only
- Decision explanations (especially for workarounds or bug fixes)
- Reference issue numbers or defect tracking IDs (e.g., "DEF-013 FIX", "FR-06")
- Do not comment obvious code (variable assignments, simple conditionals)

**JSDoc/Docstring Pattern:**
- TypeScript: JSDoc-style comments for public functions
  ```typescript
  /**
   * Pause (snooze) one or more automations.
   */
  export async function pauseAutomations(
    hass: HomeAssistant,
    params: PauseServiceParams
  ): Promise<void>
  ```

- Python: Docstrings for modules, classes, and functions (Google style with summary + details)
  ```python
  def parse_datetime_utc(dt_str: str) -> datetime:
      """Parse a datetime string and ensure it is UTC-aware.

      Uses Home Assistant's dt_util.parse_datetime for robust parsing,
      then ensures the result is timezone-aware (UTC) to prevent
      comparison errors with dt_util.utcnow().

      Args:
          dt_str: ISO format datetime string

      Returns:
          UTC-aware datetime object

      Raises:
          ValueError: If the string cannot be parsed as a datetime
      """
  ```

## Function Design

**Size:**
- Keep functions focused on a single responsibility
- Prefer small, testable functions (typically < 50 lines)
- Break complex logic into helper functions with descriptive names

**Parameters:**
- TypeScript: Use type annotations for all parameters
- Python: Use type hints with `from __future__ import annotations` for forward references
- Keyword-only parameters: Python uses `*` separator (e.g., `entity_id: str, *, enabled: bool`)
- Optional parameters: always last, use `| None` or `Optional[T]` for type hints

**Return Values:**
- TypeScript: Always specify return type explicitly (no implicit `any`)
- Python: Always specify return type in function signature
- Boolean return values: use for success/failure in utility functions (e.g., `validate_stored_entry() -> bool`)
- None return values: use `-> None` explicitly, never bare `return`

## Module Design

**Exports:**
- TypeScript: Explicit named exports only (e.g., `export async function pauseAutomations(...)`)
- Python: List exports in `__all__` when re-exporting for backwards compatibility

**Barrel Files:**
- TypeScript: Use `index.ts` files for module re-exports (e.g., `src/components/index.ts`, `src/types/index.ts`)
  - Pattern: import specific items, then re-export
  - Example in `src/components/index.ts`: exports `AutomationPauseCard` and `AutomationPauseCardEditor`

**Directory Structure Conventions:**
- Group related functionality into subdirectories: `components/`, `services/`, `types/`, `styles/`, `utils/`, `state/`
- Python: Single flat directory `custom_components/autosnooze/` with descriptive module names

---

*Convention analysis: 2026-01-31*
