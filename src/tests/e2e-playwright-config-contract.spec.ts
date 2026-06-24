import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

describe('Playwright visual configuration contract', () => {
  test('configures visual screenshots, serial project execution, and persisted auth state', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'e2e', 'playwright.config.ts'), 'utf8');

    [
      "const authFile = path.join(__dirname, 'storageState.json')",
      'fullyParallel: false',
      'workers: 1',
      'maxDiffPixelRatio: 0.01',
      "trace: 'on-first-retry'",
      "screenshot: 'only-on-failure'",
      "video: 'retain-on-failure'",
      "'chromium'",
      "'chromium-headed'",
      'PLAYWRIGHT_HEADED_SNAPSHOTS',
      'storageState: authFile',
    ].forEach((requiredText) => {
      expect(source).toContain(requiredText);
    });

    expect(source).not.toContain("name: 'firefox'");
    expect(source).not.toContain("name: 'webkit'");
  });

  test('global setup logs in with HA credentials and writes storageState.json', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'e2e', 'global-setup.ts'), 'utf8');

    [
      'HA_USERNAME',
      'HA_PASSWORD',
      'storageState.json',
      'storageState({ path: authFile })',
      'home-assistant',
      'hass.connection',
    ].forEach((requiredText) => {
      expect(source).toContain(requiredText);
    });
  });

  test('ignores Playwright reports/results but keeps snapshot directories commit-ready', () => {
    const source = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8');

    expect(source).toContain('test-results/');
    expect(source).toContain('playwright-report/');
    expect(source).not.toContain('*-snapshots/');
  });
});
