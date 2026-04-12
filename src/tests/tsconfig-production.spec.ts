import { describe, expect, test } from 'vitest';

import tsconfig from '../../tsconfig.json';

describe('Production tsconfig', () => {
  test('excludes src/tests from production typecheck', () => {
    expect(tsconfig.exclude).toContain('src/tests');
  });
});
