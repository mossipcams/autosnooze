import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

describe('Editor and picker visual spec contract', () => {
  test('covers view mode, edit mode, editor panes, invalid YAML, and picker preview', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'e2e', 'tests', 'editor-picker.visual.spec.ts'), 'utf8');

    [
      '@visual',
      'README',
      'view mode',
      'dashboard edit mode',
      'openCardEditor',
      'visual pane',
      'YAML pane',
      'invalid YAML',
      'validation error',
      'openAddCardPicker',
      'Custom element doesn',
      'toHaveScreenshot',
    ].forEach((requiredText) => {
      expect(source).toContain(requiredText);
    });
  });
});
