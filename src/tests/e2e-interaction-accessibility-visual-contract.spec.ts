import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import packageJson from '../../package.json';

const repoRoot = path.resolve(__dirname, '../..');

describe('Interaction and accessibility visual spec contract', () => {
  test('declares axe support for visual contrast checks', () => {
    expect(packageJson.devDependencies).toHaveProperty('@axe-core/playwright');
  });

  test('covers hover, focus, active, reduced motion, RTL, and contrast visuals', () => {
    const source = fs.readFileSync(
      path.join(repoRoot, 'e2e', 'tests', 'interaction-accessibility.visual.spec.ts'),
      'utf8',
    );

    [
      '@visual',
      'README',
      'hover',
      'keyboard focus',
      'active state',
      'tap_action',
      'hold_action',
      'double_tap_action',
      'prefers-reduced-motion',
      'getAnimations',
      'dir="rtl"',
      'AxeBuilder',
      'color-contrast',
      'assertLayoutIntegrity',
      'toHaveScreenshot',
    ].forEach((requiredText) => {
      expect(source).toContain(requiredText);
    });
  });
});
