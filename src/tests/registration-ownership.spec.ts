import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('registration ownership', () => {
  test('registration module does not own shipped component element definitions', () => {
    const source = readFileSync(resolve('src/registration.ts'), 'utf-8');

    expect(source).not.toContain("from './components/index.js'");
    expect(source).not.toContain('const ELEMENTS');
    expect(source).not.toContain('ELEMENTS.forEach');
  });
});
