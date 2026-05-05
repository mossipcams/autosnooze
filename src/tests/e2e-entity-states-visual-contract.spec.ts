import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

describe('Entity states visual spec contract', () => {
  test('covers degraded and extreme entity state rendering visually', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'e2e', 'tests', 'entity-states.visual.spec.ts'), 'utf8');

    [
      '@visual',
      'README',
      'unavailable',
      'unknown',
      'normal-on',
      'normal-off',
      'long-state',
      'long-friendly-name',
      'missing-attributes',
      'stale-last-updated',
      'configured-entity-missing',
      'permission-denied-like-missing-state',
      'setState',
      'assertLayoutIntegrity',
      'toHaveScreenshot',
    ].forEach((requiredText) => {
      expect(source).toContain(requiredText);
    });
  });
});
