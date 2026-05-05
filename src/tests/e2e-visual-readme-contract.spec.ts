import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../..');

describe('E2E visual README contract', () => {
  test('documents the existing-HA visual workflow and critical gate', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'e2e', 'README.md'), 'utf8');

    [
      'Existing HA Dashboard',
      '/dashboard-testing/0',
      'storageState.json',
      'npm run e2e:visual',
      'npm run e2e:critical',
      '--update-snapshots',
      '*-snapshots',
      'HA_COMMUNITY_THEME',
      '@critical',
      '.husky/pre-push',
    ].forEach((requiredText) => {
      expect(source).toContain(requiredText);
    });
  });
});
