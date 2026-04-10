import { describe, expect, test } from 'vitest';
import { automationListStyles } from '../styles/automation-list.styles.js';

describe('Search row polish', () => {
  test('search input focus state has a subtle primary-tinted focus ring', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.search-box input:focus\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toMatch(/box-shadow:[^;]*var\(--primary-color\)[^;]*/);
  });

  test('search input has a transition to smooth the focus ring animation', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.search-box input\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toMatch(/transition:[^;]+/);
  });

  test('selection-count uses tabular-nums so numbers do not jitter as counts change', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.selection-count\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toContain('font-variant-numeric: tabular-nums');
  });

  test('select-all-btn has a medium font weight for stronger button legibility', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.select-all-btn\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toMatch(/font-weight:\s*5\d\d/);
  });

  test('search-clear-btn has a transition so hover feels responsive', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.search-clear-btn\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    const block = match![0];
    expect(block).toMatch(/transition:[^;]+/);
  });
});
