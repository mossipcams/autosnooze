import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

describe('Rendering matrix visual spec contract', () => {
  test('parametrizes screenshots by config variant, viewport, and theme', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'e2e', 'tests', 'rendering-matrix.visual.spec.ts'), 'utf8');

    [
      '@visual',
      'README',
      'CARD_CONFIG_VARIANTS',
      'VISUAL_VIEWPORTS',
      'VISUAL_THEMES',
      'for (const variant',
      'for (const viewport',
      'for (const theme',
      'setViewportSize',
      'setConfig',
      'assertLayoutIntegrity',
      'toHaveScreenshot',
      'computed styles differ between themes',
    ].forEach((requiredText) => {
      expect(source).toContain(requiredText);
    });
  });
});
