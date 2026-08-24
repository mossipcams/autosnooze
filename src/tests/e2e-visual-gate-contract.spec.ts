import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import packageJson from '../../package.json';

const repoRoot = path.resolve(__dirname, '../..');

describe('E2E visual gate contract', () => {
  test('exposes visual and critical Playwright scripts', () => {
    expect(packageJson.scripts).toMatchObject({
      'e2e:visual': 'playwright test --config=e2e/playwright.config.ts --grep @visual',
      'e2e:critical': 'playwright test --config=e2e/playwright.config.ts --grep @critical',
    });
  });

  test('runs the critical E2E path from Husky before PR creation', () => {
    const prePushHook = fs.readFileSync(path.join(repoRoot, '.husky', 'pre-push'), 'utf8');

    expect(prePushHook).toContain('npm run e2e:critical');
    expect(prePushHook).toMatch(/scripts\/ensure-ha-e2e\.sh/);
  });

  test('allows skipping the local HA gate only when ALLOW_SKIP_HA_E2E=1', () => {
    const prePushHook = fs.readFileSync(path.join(repoRoot, '.husky', 'pre-push'), 'utf8');

    expect(prePushHook).toContain('ALLOW_SKIP_HA_E2E');
    expect(prePushHook).toMatch(/ALLOW_SKIP_HA_E2E=1/);
    expect(prePushHook).toMatch(/Skipping.*HA E2E/i);
  });

  test('rejects non-local HA_URL unless ALLOW_REMOTE_HA=1', () => {
    const prePushHook = fs.readFileSync(path.join(repoRoot, '.husky', 'pre-push'), 'utf8');

    expect(prePushHook).toContain('ALLOW_REMOTE_HA');
    expect(prePushHook).toMatch(/localhost|127\.0\.0\.1/);
    expect(prePushHook).toMatch(/ALLOW_REMOTE_HA=1/);
  });

  test('starts host hass instead of docker exec into a sleep-loop container', () => {
    const ensureHa = fs.readFileSync(
      path.join(repoRoot, 'scripts', 'ensure-ha-e2e.sh'),
      'utf8',
    );

    expect(ensureHa).not.toContain('docker exec');
    expect(ensureHa).not.toMatch(/\bdocker start\b/);
    expect(ensureHa).toContain('docker stop');
    expect(ensureHa).toContain('nohup');
    expect(ensureHa).toContain('/tmp/autosnooze-e2e-ha-config');
  });
});
