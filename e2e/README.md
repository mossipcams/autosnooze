# E2E Testing Guide

## Prerequisites

1. **Home Assistant Instance**: Must be running at `http://localhost:8124`
2. **AutoSnooze Integration**: Must be installed in the HA instance
3. **Test User**: Create a user with the following credentials:
   - Username: `test`
   - Password: `12345`

## Running Tests

### With Environment Variables

```bash
export HA_USERNAME=test
export HA_PASSWORD=12345
npm run e2e           # Run all tests (headless)
npm run e2e:ui        # Run with Playwright UI
npm run e2e:headed    # Run with visible browser
npm run e2e:debug     # Debug mode
npm run e2e:report    # View HTML report
```

### Inline Environment Variables

```bash
HA_USERNAME=test HA_PASSWORD=12345 npm run e2e
```

## Test Structure

- `e2e/tests/` - All test files
- `e2e/pages/` - Page object models
- `e2e/fixtures/` - Test fixtures and setup
- `e2e/.auth/` - Stored authentication state

## Authentication

Authentication is handled automatically:
1. The `auth.setup.ts` fixture runs once before all tests
2. Authentication state is saved to `.auth/user.json`
3. All subsequent tests reuse this authentication state

If authentication fails, delete `.auth/user.json` and rerun tests.

## Test Configuration

Tests run on 3 browsers:
- **Chromium** (Desktop Chrome)
- **Firefox** (Desktop Firefox)
- **Mobile** (iPhone 13)

All tests run sequentially (1 worker) to avoid race conditions.
