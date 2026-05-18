import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const PACKAGE_PATH = join(process.cwd(), 'package.json');

function packageJson(): { scripts?: Record<string, string> } {
  return JSON.parse(readFileSync(PACKAGE_PATH, 'utf8')) as { scripts?: Record<string, string> };
}

describe('Husky install contract', () => {
  test('prepare keeps Husky local-only instead of installing hooks in CI', () => {
    const prepare = packageJson().scripts?.prepare ?? '';

    expect(prepare).toContain('install-husky-if-local');
    expect(prepare).not.toMatch(/^husky\b/);
  });
});
