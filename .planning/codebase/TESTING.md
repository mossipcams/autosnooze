# Testing Patterns

**Analysis Date:** 2026-01-31

## Test Framework

**Runner:**
- Vitest 4.0.16 (JavaScript/TypeScript)
- pytest with pytest-homeassistant-custom-component (Python)
- Config: `vitest.config.mjs` and `pyproject.toml`

**Assertion Library:**
- Vitest: native expect API
- pytest: native assert statements or pytest.raises for exceptions

**Run Commands:**
```bash
npm test                    # Run all JavaScript tests once
npm run test:watch         # Watch mode for JavaScript
npm run test:coverage      # JavaScript coverage report
pytest tests/              # Run all Python tests
pytest tests/ -v           # Verbose Python test output
pytest tests/ --cov        # Python coverage report
```

## Test File Organization

**Location:**
- JavaScript: co-located with source in `tests/` directory (separate from src)
- Python: separate `tests/` directory matching root

**Naming:**
- JavaScript: `test_[feature].spec.ts` or `test_[feature].spec.js`
- Python: `test_[module].py`

**Structure:**
```
tests/
├── conftest.py            # Shared pytest fixtures
├── vitest.setup.ts        # Shared Vitest setup and globals
├── test_storage.spec.ts   # Feature tests
├── test_coordinator.py    # Module tests
└── test_card_ui.spec.js   # Component tests
```

## Test Structure

**Suite Organization (TypeScript/JavaScript):**
```typescript
describe('Feature Name', () => {
  describe('Specific functionality', () => {
    test('behavior description', () => {
      // Arrange
      const setup = createMockHass();

      // Act
      const result = await function(setup);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

**Suite Organization (Python):**
```python
class TestFunctionName:
    """Tests for specific function or class."""

    def test_basic_behavior(self) -> None:
        """Test expected behavior."""
        # Arrange
        data = {"key": "value"}

        # Act
        result = function(data)

        # Assert
        assert result == expected

    @pytest.mark.parametrize("input,expected", [
        (input1, expected1),
        (input2, expected2),
    ])
    def test_with_parameters(self, input, expected) -> None:
        """Test with multiple inputs."""
        assert function(input) == expected
```

**Patterns:**
- Setup: use `beforeEach` (JavaScript) or fixture setup (Python)
- Teardown: use `afterEach` (JavaScript) or fixture teardown (Python)
- Assertions: descriptive expect messages or assertion comments

## Mocking

**Framework:**
- JavaScript: vi (Vitest) built-in mocking
- Python: unittest.mock (MagicMock, AsyncMock, patch)

**Patterns (JavaScript):**
```javascript
// Mock a module function
const mockHass = createMockHass({
  states: {
    'automation.test': {
      entity_id: 'automation.test',
      state: 'on',
      attributes: { friendly_name: 'Test Automation' },
    },
  },
});

// Mock async calls
import { vi } from 'vitest';
const mockCall = vi.fn().mockResolvedValue({ result: 'success' });
```

**Patterns (Python):**
```python
from unittest.mock import AsyncMock, MagicMock, patch

# Mock a store
store = MagicMock()
store.async_load = AsyncMock(return_value=None)
store.async_save = AsyncMock(return_value=None)

# Mock with patch
with patch('module.function') as mock_func:
    mock_func.return_value = expected_value
```

**What to Mock:**
- External service calls (Home Assistant services, HTTP requests)
- Storage/persistence operations (async_load, async_save)
- Timer callbacks and event handlers
- Browser APIs (localStorage, customElements, ResizeObserver)

**What NOT to Mock:**
- Business logic functions under test
- Data validation functions
- Type conversions and parsing logic
- Error handling code paths

## Fixtures and Factories

**Test Data (JavaScript):**
```javascript
// Global helper defined in vitest.setup.ts
globalThis.createMockHass = (overrides = {}) => {
  return {
    states: {},
    entities: {},
    areas: {},
    connection: {
      sendMessagePromise: vi.fn().mockResolvedValue([]),
    },
    callService: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

// Usage in tests
const mockHass = createMockHass({
  states: { 'automation.test': { ... } },
});
```

**Test Data (Python):**
```python
# Fixtures defined in conftest.py
@pytest.fixture
def mock_store() -> MagicMock:
    """Create a mock Home Assistant Store for testing persistence."""
    store = MagicMock()
    store.async_load = AsyncMock(return_value=None)
    store.async_save = AsyncMock(return_value=None)
    return store

@pytest.fixture
def mock_hass_with_automations(hass):
    """Create a hass fixture with mock automation entities."""
    hass.states.async_set(
        "automation.test_automation_1",
        "on",
        {"friendly_name": "Test Automation 1"},
    )
    return hass
```

**Location:**
- JavaScript global helpers: `tests/vitest.setup.ts` (auto-registered as globals)
- Python fixtures: `tests/conftest.py` (auto-discovered by pytest)

## Coverage

**Requirements:**
- JavaScript: 85% threshold (branches, functions, lines, statements) enforced by Vitest
- Python: 85% threshold enforced by pytest-cov via `pyproject.toml`

**View Coverage:**
```bash
npm run test:coverage      # JavaScript coverage with HTML report
pytest tests/ --cov --cov-report=html  # Python coverage with HTML
```

**Mutation Testing (JavaScript):**
- Framework: Stryker 9.4.0
- Config: `stryker.config.mjs`
- Run: `npx stryker run`
- Break threshold: 70% (kills must not exceed 30% of generated mutations)

## Test Types

**Unit Tests:**
- Scope: Single function or class method
- Examples: `test_coordinator.py` validates individual coordinator functions, `test_storage.spec.ts` tests localStorage service
- Pattern: test inputs and outputs without side effects
- Location: primarily in `tests/test_*.py` and `tests/test_*.spec.ts`

**Integration Tests:**
- Scope: Multiple components working together
- Examples: `test_card_ui.spec.js` tests card configuration + UI rendering, `test_coordinator.py` tests pause/resume workflows
- Pattern: set up realistic state, perform actions, verify end-to-end results
- Mocking: only external systems, not internal integrations

**E2E Tests:**
- Framework: Playwright 1.40.0
- Config: `e2e/playwright.config.ts`
- Scope: Full user workflows in actual Home Assistant environment
- Location: `e2e/` directory
- Run: `npm run e2e` or `npm run e2e:headed` for browser view

## Common Patterns

**Async Testing (JavaScript):**
```typescript
test('waits for async operation', async () => {
  const element = document.createElement('autosnooze-card');
  element.hass = mockHass;
  document.body.appendChild(element);

  // Wait for Lit update
  await element.updateComplete;

  // Verify state after update
  expect(element.shadowRoot.querySelector('input')).toBeDefined();
});
```

**Async Testing (Python):**
```python
@pytest.mark.asyncio
async def test_async_operation(self, hass):
    """Test async function."""
    result = await async_function(hass)
    assert result is True
```

**Error Testing (JavaScript):**
```typescript
test('handles errors gracefully', () => {
  const mockLocalStorage = {
    setItem: () => { throw new Error('QuotaExceededError'); },
  };

  // Should not throw
  expect(() => {
    saveLastDuration(duration, 150);
  }).not.toThrow();
});
```

**Error Testing (Python):**
```python
def test_raises_on_invalid_input(self):
    """Test that function raises appropriate exception."""
    with pytest.raises(ValueError, match="Invalid datetime string"):
        parse_datetime_utc("not-a-datetime")
```

**Parametrized Testing (Python):**
```python
@pytest.mark.parametrize(
    "entity_id,data,entry_type,expected,description",
    [
        ("light.test", {...}, "paused", False, "rejects non-automation entity"),
        ("automation.test", {...}, "paused", True, "accepts valid automation"),
    ],
)
def test_with_parameters(self, entity_id, data, entry_type, expected, description):
    """Test with multiple parameter combinations."""
    result = validate_stored_entry(entity_id, data, entry_type)
    assert result == expected
```

**Fake Timers (JavaScript):**
```typescript
test('handles countdown timers', () => {
  vi.useFakeTimers();

  const card = new CardClass();
  card.setConfig({ title: 'Test' });
  card.hass = mockHass;
  document.body.appendChild(card);

  // Verify interval is created
  expect(card._interval).toBeDefined();

  card.remove();
  expect(card._interval).toBeNull();

  vi.useRealTimers();
});
```

**Setup/Teardown:**
```javascript
beforeEach(() => {
  localStorage.clear();
  vi.clearAllTimers();
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.clearAllMocks();
});
```

## Code Coverage Strategy

**High-Priority Areas:**
- Service handlers and action callbacks (`src/services/snooze.ts`, `custom_components/autosnooze/services.py`)
- Data validation and parsing (`custom_components/autosnooze/models.py`, `src/utils/duration-parsing.ts`)
- State management and timers (`custom_components/autosnooze/coordinator.py`, `src/state/`)
- Error handling in async operations

**Acceptable Gaps:**
- Browser compatibility shims in test setup (lines excluded with `pragma: no cover`)
- Repr/debug methods (`__repr__`)
- Unreachable defensive code (`raise NotImplementedError` in type guards)

**Coverage Enforcement:**
- PR checks fail if coverage drops below 85% (Vitest and pytest)
- Mutation testing validates test quality (Stryker)

---

*Testing analysis: 2026-01-31*
