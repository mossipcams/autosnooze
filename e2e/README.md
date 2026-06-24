# E2E Testing Guide

## Existing HA Dashboard

These tests target an existing Home Assistant instance and the existing dashboard at `/dashboard-testing/0`. The repo does not provision Docker, `configuration.yaml`, or dashboard YAML fixtures for this worktree.

Required setup:

- Home Assistant is reachable at `HA_URL` or `http://localhost:8124`.
- AutoSnooze is installed and exposes `/autosnooze-card.js`.
- The dashboard at `/dashboard-testing/0` contains `custom:autosnooze-card`.
- The HA user can view the dashboard; editor/picker specs also require dashboard edit permission.
- Existing test automations such as `Living Room Motion Lights` and `Kitchen Motion Lights` are available for the non-visual functional E2E specs.

## Authentication

`global-setup.ts` logs in through the HA login form with `HA_USERNAME` and `HA_PASSWORD`, then writes `e2e/storageState.json`. The storage state is reused by the Chromium project until it expires; delete `e2e/storageState.json` to force a fresh login.

```bash
export HA_URL=http://localhost:8124
export HA_USERNAME=test
export HA_PASSWORD=12345
```

## Running Tests

```bash
npm run e2e
npm run e2e:smoke
npm run e2e:visual
npm run e2e:critical
npm run e2e:ui
npm run e2e:headed
npm run e2e:debug
npm run e2e:report
```

`npm run e2e:critical` runs tests tagged `@critical`. `.husky/pre-push` runs this command before PR creation/push so the standard critical path catches card registration, resource loading, console/page errors, layout integrity, and the default loaded-card visual baseline.

`npm run e2e:smoke` runs the compact release-gate workflow tagged `@smoke`.
It covers card load, snooze, persisted rendering after reload, resume, and
invalid-input rejection. It is an optional browser regression check and is not
part of the deterministic CI smoke gate.

## Visual Snapshots

Visual specs are tagged `@visual` and live in `e2e/tests/*.visual.spec.ts`. Update snapshots only for intentional visual changes:

```bash
npm run e2e:visual -- --update-snapshots
```

Commit the generated `*-snapshots` directories. `test-results/` and `playwright-report/` are ignored; snapshot directories are not ignored.

The visual matrix uses built-in light/dark CSS custom-property fixtures and a community-style fixture. Set `HA_COMMUNITY_THEME` when the existing HA instance has a named community theme you want documented in local runs.

## Test Structure

- `e2e/tests/` - Playwright specs, including visual specs named `<area>.visual.spec.ts`
- `e2e/helpers/ha.ts` - HA shadow-DOM, resource, theme, and state helpers
- `e2e/helpers/visual.ts` - layout-integrity assertions, snapshot stabilization, masks
- `e2e/helpers/fixtures.ts` - viewport, theme, config variant, and authenticated-page fixtures
- `e2e/pages/` - Page object models for existing functional E2E tests

## Browser Project

The visual configuration runs Chromium only with `fullyParallel: true`, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, and `toHaveScreenshot.maxDiffPixelRatio: 0.01`.
