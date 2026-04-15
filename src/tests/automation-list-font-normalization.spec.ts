import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const cssText = readFileSync(resolve(process.cwd(), 'src/styles/automation-list.styles.ts'), 'utf8');

describe('Automation list font normalization', () => {
  test('desktop search row typography stays at 0.9em across peer controls', () => {
    const searchInput = cssText.match(/\.search-box input\s*\{[^}]*\}/);
    const selectionCount = cssText.match(/\.selection-count\s*\{[^}]*\}/);
    const selectAllButton = cssText.match(/\.select-all-btn\s*\{[^}]*\}/);

    expect(searchInput).not.toBeNull();
    expect(selectionCount).not.toBeNull();
    expect(selectAllButton).not.toBeNull();

    expect(searchInput![0]).toContain('font-size: 0.9em');
    expect(selectionCount![0]).toContain('font-size: 0.9em');
    expect(selectAllButton![0]).toContain('font-size: 0.9em');
  });

  test('mobile toolbar typography stays at 0.85em across tabs and search row controls', () => {
    const mobileCss = cssText.split('@media (max-width: 480px) {')[1];

    expect(mobileCss).toBeTruthy();

    const mobileTab = mobileCss.match(/\.tab\s*\{[^}]*\}/);
    const mobileSearchInput = mobileCss.match(/\.search-box input\s*\{[^}]*\}/);
    const mobileSelectionCount = mobileCss.match(/\.selection-count\s*\{[^}]*\}/);
    const mobileSelectAllButton = mobileCss.match(/\.select-all-btn\s*\{[^}]*\}/);

    expect(mobileTab).not.toBeNull();
    expect(mobileSearchInput).not.toBeNull();
    expect(mobileSelectionCount).not.toBeNull();
    expect(mobileSelectAllButton).not.toBeNull();

    expect(mobileTab![0]).toContain('font-size: 0.85em');
    expect(mobileSearchInput![0]).toContain('font-size: 0.85em');
    expect(mobileSelectionCount![0]).toContain('font-size: 0.85em');
    expect(mobileSelectAllButton![0]).toContain('font-size: 0.85em');
  });
});
