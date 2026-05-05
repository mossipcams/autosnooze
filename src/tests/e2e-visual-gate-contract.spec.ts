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
  });
});
