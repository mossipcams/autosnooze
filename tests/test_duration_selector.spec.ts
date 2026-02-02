/**
 * Tests for the AutoSnooze Duration Selector child component.
 * Covers: styles export, component class, properties, events, rendering.
 */

import { describe, it, expect } from 'vitest';
import { AutoSnoozeDurationSelector } from '../src/components/index.js';

// Register custom element for jsdom instantiation
if (!customElements.get('autosnooze-duration-selector')) {
  customElements.define('autosnooze-duration-selector', AutoSnoozeDurationSelector);
}

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

describe('AutoSnoozeDurationSelector', () => {
  it('should be importable as a class', () => {
    expect(AutoSnoozeDurationSelector).toBeDefined();
    expect(typeof AutoSnoozeDurationSelector).toBe('function');
  });

  it('should have scheduleMode property defaulting to false', () => {
    const el = new AutoSnoozeDurationSelector();
    expect(el.scheduleMode).toBe(false);
  });

  it('should have all remaining reactive properties with correct defaults', () => {
    const el = new AutoSnoozeDurationSelector();
    expect(el.customDuration).toEqual({ days: 0, hours: 0, minutes: 30 });
    expect(el.customDurationInput).toBe('30m');
    expect(el.showCustomInput).toBe(false);
    expect(el.lastDuration).toBe(null);
    expect(el.disableAtDate).toBe('');
    expect(el.disableAtTime).toBe('');
    expect(el.resumeAtDate).toBe('');
    expect(el.resumeAtTime).toBe('');
  });

  it('should return default duration pills with Custom at end', () => {
    const el = new AutoSnoozeDurationSelector();
    const pills = el._getDurationPills();
    expect(pills.length).toBeGreaterThan(0);
    expect(pills[pills.length - 1]).toEqual({ label: 'Custom', minutes: null });
  });

  it('should validate duration input and compute preview', () => {
    const el = new AutoSnoozeDurationSelector();
    expect(el._isDurationValid()).toBe(true); // default '30m' is valid
    expect(el._getDurationPreview()).toBe('30 minutes');
    el.customDurationInput = '2h30m';
    expect(el._isDurationValid()).toBe(true);
    expect(el._getDurationPreview()).toBe('2 hours, 30 minutes');
    el.customDurationInput = 'invalid';
    expect(el._isDurationValid()).toBe(false);
    expect(el._getDurationPreview()).toBe('');
  });

  it('should fire duration-change event with correct detail', () => {
    const el = new AutoSnoozeDurationSelector();
    let firedDetail = null;
    el.addEventListener('duration-change', (e: Event) => { firedDetail = (e as CustomEvent).detail; });
    el._fireDurationChange(60);
    expect(firedDetail).toBeTruthy();
    expect(firedDetail.minutes).toBe(60);
    expect(firedDetail.duration).toEqual({ days: 0, hours: 1, minutes: 0 });
    expect(firedDetail.input).toBe('1h');
    expect(firedDetail.showCustomInput).toBe(false);
  });

  it('should fire schedule-mode-change and schedule-field-change events', () => {
    const el = new AutoSnoozeDurationSelector();
    let modeDetail = null;
    let fieldDetail = null;
    el.addEventListener('schedule-mode-change', (e: Event) => { modeDetail = (e as CustomEvent).detail; });
    el.addEventListener('schedule-field-change', (e: Event) => { fieldDetail = (e as CustomEvent).detail; });
    el._fireScheduleModeChange(true);
    expect(modeDetail).toEqual({ enabled: true });
    el._fireScheduleFieldChange('disableAtDate', '2026-02-01');
    expect(fieldDetail).toEqual({ field: 'disableAtDate', value: '2026-02-01' });
  });

  it('should render duration pills in default mode', async () => {
    const el = new AutoSnoozeDurationSelector();
    document.body.appendChild(el);
    await el.updateComplete;
    const pills = el.shadowRoot.querySelectorAll('.pill');
    expect(pills.length).toBeGreaterThan(0);
    const selector = el.shadowRoot.querySelector('.duration-selector');
    expect(selector).toBeTruthy();
    document.body.removeChild(el);
  });

  it('should render custom duration input when showCustomInput is true', async () => {
    const el = new AutoSnoozeDurationSelector();
    el.showCustomInput = true;
    document.body.appendChild(el);
    await el.updateComplete;
    const input = el.shadowRoot.querySelector('.duration-input');
    expect(input).toBeTruthy();
    const customDiv = el.shadowRoot.querySelector('.custom-duration-input');
    expect(customDiv).toBeTruthy();
    document.body.removeChild(el);
  });

  it('should render last duration badge when lastDuration is unique from presets', async () => {
    const el = new AutoSnoozeDurationSelector();
    el.lastDuration = { minutes: 45, duration: { days: 0, hours: 0, minutes: 45 }, timestamp: Date.now() };
    document.body.appendChild(el);
    await el.updateComplete;
    const badge = el.shadowRoot.querySelector('.last-duration-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toContain('45m');
    document.body.removeChild(el);
  });

  it('should render duration header row with section header', async () => {
    const el = new AutoSnoozeDurationSelector();
    document.body.appendChild(el);
    await el.updateComplete;
    const headerRow = el.shadowRoot.querySelector('.duration-header-row');
    expect(headerRow).toBeTruthy();
    const header = el.shadowRoot.querySelector('.duration-section-header');
    expect(header).toBeTruthy();
    document.body.removeChild(el);
  });

  it('should render schedule link in duration mode', async () => {
    const el = new AutoSnoozeDurationSelector();
    document.body.appendChild(el);
    await el.updateComplete;
    const link = el.shadowRoot.querySelector('.schedule-link');
    expect(link).toBeTruthy();
    let detail = null;
    el.addEventListener('schedule-mode-change', (e: Event) => { detail = (e as CustomEvent).detail; });
    (link as HTMLElement).click();
    expect(detail).toEqual({ enabled: true });
    document.body.removeChild(el);
  });

  it('should render aria labels on duration pills', async () => {
    const el = new AutoSnoozeDurationSelector();
    document.body.appendChild(el);
    await el.updateComplete;
    const pills = el.shadowRoot.querySelectorAll('.pill');
    pills.forEach((pill) => {
      expect(pill.getAttribute('role')).toBe('radio');
      expect(pill.hasAttribute('aria-checked')).toBe(true);
    });
    document.body.removeChild(el);
  });

  it('should render schedule inputs when scheduleMode is true', async () => {
    const el = new AutoSnoozeDurationSelector();
    el.scheduleMode = true;
    document.body.appendChild(el);
    await el.updateComplete;
    const scheduleInputs = el.shadowRoot.querySelector('.schedule-inputs');
    expect(scheduleInputs).toBeTruthy();
    const selector = el.shadowRoot.querySelector('.duration-selector');
    expect(selector).toBeFalsy();
    document.body.removeChild(el);
  });
});

