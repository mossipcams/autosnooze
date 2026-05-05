import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

describe('Layout grid visual spec contract', () => {
  test('covers Lovelace layout sizing, grid spans, card size, and stacked spacing', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'e2e', 'tests', 'layout-grid.visual.spec.ts'), 'utf8');

    [
      '@visual',
      'README',
      'LAYOUT_VARIANTS',
      'GRID_SPANS',
      'span-1',
      'span-2',
      'span-4',
      'full-width',
      'getCardSize',
      'height roughly matches',
      'stock card',
      'stacked-card spacing',
      'assertNoHorizontalOverflow',
      'toHaveScreenshot',
    ].forEach((requiredText) => {
      expect(source).toContain(requiredText);
    });
  });
});
