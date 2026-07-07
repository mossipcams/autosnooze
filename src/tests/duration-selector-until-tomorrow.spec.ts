import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AutoSnoozeDurationSelector } from '../components/autosnooze-duration-selector.js';
import type { HomeAssistant } from '../types/hass.js';

if (!customElements.get('autosnooze-duration-selector-until-tomorrow')) {
  customElements.define('autosnooze-duration-selector-until-tomorrow', AutoSnoozeDurationSelector);
}

function createSelector(): AutoSnoozeDurationSelector {
  return document.createElement('autosnooze-duration-selector-until-tomorrow') as AutoSnoozeDurationSelector;
}

function createHass(): HomeAssistant {
  return {
    locale: { language: 'en' },
    states: {},
  } as unknown as HomeAssistant;
}

async function connectSelector(
  setup: (element: AutoSnoozeDurationSelector) => void = () => {}
): Promise<AutoSnoozeDurationSelector> {
  const element = createSelector();
  element.hass = createHass();
  setup(element);
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
}

function getText(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('duration selector until tomorrow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('Tomorrow pill renders after duration pills and before Custom', async () => {
    const element = await connectSelector();

    const pills = Array.from(element.shadowRoot?.querySelectorAll('.pill') ?? []) as HTMLButtonElement[];
    expect(pills.map((pill) => getText(pill))).toEqual(['30m', '1h', 'Tomorrow', 'Custom']);
  });

  test('clicking Tomorrow dispatches until-tomorrow-select', async () => {
    const element = await connectSelector();
    const events: CustomEvent[] = [];
    element.addEventListener('until-tomorrow-select', (event) => events.push(event as CustomEvent));

    const tomorrowPill = Array.from(element.shadowRoot?.querySelectorAll('.pill') ?? [])[2] as HTMLButtonElement;
    tomorrowPill.click();

    expect(events).toHaveLength(1);
    expect(events[0]?.detail).toBeNull();
    expect(events[0]?.bubbles).toBe(true);
    expect(events[0]?.composed).toBe(true);
  });

  test('aria-checked and active states reflect untilTomorrow and other pill selections', async () => {
    const activeTomorrow = await connectSelector((element) => {
      element.untilTomorrow = true;
    });
    const tomorrowPills = Array.from(activeTomorrow.shadowRoot?.querySelectorAll('.pill') ?? []) as HTMLButtonElement[];
    expect(tomorrowPills[2]?.classList.contains('active')).toBe(true);
    expect(tomorrowPills[2]?.getAttribute('aria-checked')).toBe('true');
    expect(tomorrowPills[0]?.classList.contains('active')).toBe(false);
    expect(tomorrowPills[3]?.classList.contains('active')).toBe(false);

    const customActive = await connectSelector((element) => {
      element.showCustomInput = true;
      element.customDuration = { days: 0, hours: 1, minutes: 0 };
    });
    const customPills = Array.from(customActive.shadowRoot?.querySelectorAll('.pill') ?? []) as HTMLButtonElement[];
    expect(customPills[0]?.classList.contains('active')).toBe(false);
    expect(customPills[1]?.classList.contains('active')).toBe(false);
    expect(customPills[2]?.classList.contains('active')).toBe(false);
    expect(customPills[3]?.classList.contains('active')).toBe(true);
    expect(customPills[3]?.getAttribute('aria-checked')).toBe('true');
  });

  test('preview line renders when untilTomorrow is true and not when false', async () => {
    const withPreview = await connectSelector((element) => {
      element.untilTomorrow = true;
    });
    const preview = withPreview.shadowRoot?.querySelector('.duration-preview');
    expect(preview?.getAttribute('role')).toBe('status');
    expect(preview?.getAttribute('aria-live')).toBe('polite');
    expect(getText(preview)).toContain('Resumes');
    expect(getText(preview)).toContain('Apr 30, 8:00 AM');

    const withoutPreview = await connectSelector();
    expect(withoutPreview.shadowRoot?.querySelector('.duration-preview')).toBeNull();
  });
});
