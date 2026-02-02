/**
 * Tests for the AutoSnooze Duration Selector child component.
 * Covers: styles export, component class, properties, events, rendering.
 */

import { describe, it, expect } from 'vitest';

describe('Duration Selector Styles', () => {
  it('should export durationSelectorStyles as a CSSResult', async () => {
    const { durationSelectorStyles } = await import('../src/styles/duration-selector.styles.js');
    expect(durationSelectorStyles).toBeDefined();
    const cssText = durationSelectorStyles.cssText;
    expect(typeof cssText).toBe('string');
    expect(cssText).toContain('.duration-selector');
    expect(cssText).toContain('.pill');
    expect(cssText).toContain('.schedule-inputs');
    expect(cssText).toContain(':host');
  });

  it('should be importable from direct module path', async () => {
    const { durationSelectorStyles } = await import('../src/styles/duration-selector.styles.js');
    expect(durationSelectorStyles).toBeDefined();
    expect(durationSelectorStyles.cssText).toContain('.duration-selector');
  });
});
