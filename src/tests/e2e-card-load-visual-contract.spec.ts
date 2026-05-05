import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

describe('Card load visual spec contract', () => {
  test('covers registration, resource hygiene, layout integrity, and screenshot capture', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'e2e', 'tests', 'card-load.visual.spec.ts'), 'utf8');

    [
      '@visual',
      '@critical',
      'README',
      'verifyCardResource',
      'installCardErrorListeners',
      'customElements.get',
      'assertLayoutIntegrity',
      'toHaveScreenshot',
      'screenshotOptions',
      'volatileRegionMasks',
      'assertNoCardErrors',
    ].forEach((requiredText) => {
      expect(source).toContain(requiredText);
    });
  });
});
