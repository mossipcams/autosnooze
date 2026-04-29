import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AutoSnoozeDurationSelector } from '../components/autosnooze-duration-selector.js';
import type { HomeAssistant } from '../types/hass.js';

if (!customElements.get('autosnooze-duration-selector-mutation')) {
  customElements.define('autosnooze-duration-selector-mutation', AutoSnoozeDurationSelector);
}

const SENSOR_ENTITY_ID = 'sensor.autosnooze_snoozed_automations';

function createSelector(): AutoSnoozeDurationSelector {
  return document.createElement('autosnooze-duration-selector-mutation') as AutoSnoozeDurationSelector;
}

function createHass(durationPresets?: Array<{ label: string; minutes: number | null }>): HomeAssistant {
  return {
    locale: { language: 'en' },
    states: durationPresets
      ? {
          [SENSOR_ENTITY_ID]: {
            entity_id: SENSOR_ENTITY_ID,
            state: '0',
            attributes: { duration_presets: durationPresets },
          },
        }
      : {},
  } as unknown as HomeAssistant;
}

async function connectSelector(
  setup: (element: AutoSnoozeDurationSelector) => void = () => {}
): Promise<AutoSnoozeDurationSelector> {
  const element = createSelector();
  setup(element);
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
}

function getText(element: Element | null): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

describe('duration selector mutation boundaries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('uses configured duration presets, filters null preset entries, and appends Custom', () => {
    const element = createSelector();
    element.hass = createHass([
      { label: 'Five', minutes: 5 },
      { label: 'Heading', minutes: null },
      { label: 'Ninety', minutes: 90 },
    ]);

    expect(element._getDurationPills()).toEqual([
      { label: 'Five', minutes: 5 },
      { label: 'Ninety', minutes: 90 },
      { label: 'Custom', minutes: null },
    ]);
  });

  test('duration change events include converted duration, input text, bubbles, and composed flags', () => {
    const element = createSelector();
    const events: CustomEvent[] = [];
    element.addEventListener('duration-change', (event) => events.push(event as CustomEvent));

    element._fireDurationChange(1441, { showCustomInput: true });

    expect(events).toHaveLength(1);
    expect(events[0]?.detail).toEqual({
      minutes: 1441,
      duration: { days: 1, hours: 0, minutes: 1 },
      input: '1d 1m',
      showCustomInput: true,
    });
    expect(events[0]?.bubbles).toBe(true);
    expect(events[0]?.composed).toBe(true);
  });

  test('custom duration change events preserve invalid input with zero duration fallback', () => {
    const element = createSelector();
    const events: CustomEvent[] = [];
    element.addEventListener('duration-change', (event) => events.push(event as CustomEvent));

    element._fireCustomDurationChange('not a duration');

    expect(events[0]?.detail).toEqual({
      minutes: 0,
      duration: { days: 0, hours: 0, minutes: 0 },
      input: 'not a duration',
    });
    expect(events[0]?.bubbles).toBe(true);
    expect(events[0]?.composed).toBe(true);
  });

  test('last duration badge is hidden for preset matches and active for the current unique duration', async () => {
    const presetMatch = await connectSelector((element) => {
      element.lastDuration = {
        minutes: 30,
        duration: { days: 0, hours: 0, minutes: 30 },
        timestamp: Date.now(),
      };
    });
    expect(presetMatch.shadowRoot?.querySelector('.last-duration-badge')).toBeNull();

    const unique = await connectSelector((element) => {
      element.customDuration = { days: 0, hours: 0, minutes: 45 };
      element.lastDuration = {
        minutes: 45,
        duration: { days: 0, hours: 0, minutes: 45 },
        timestamp: Date.now(),
      };
    });
    const badge = unique.shadowRoot?.querySelector('.last-duration-badge') as HTMLButtonElement;
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('active')).toBe(true);
    expect(getText(badge)).toContain('45m');

    const events: CustomEvent[] = [];
    unique.addEventListener('duration-change', (event) => events.push(event as CustomEvent));
    badge.click();
    expect(events[0]?.detail.minutes).toBe(45);
  });

  test('last duration badge is inactive when custom input is visible or a different duration is selected', async () => {
    const customVisible = await connectSelector((element) => {
      element.showCustomInput = true;
      element.customDuration = { days: 0, hours: 0, minutes: 45 };
      element.lastDuration = {
        minutes: 45,
        duration: { days: 0, hours: 0, minutes: 45 },
        timestamp: Date.now(),
      };
    });
    const customVisibleBadge = customVisible.shadowRoot?.querySelector('.last-duration-badge');
    expect(customVisibleBadge?.classList.contains('active')).toBe(false);
    expect(customVisibleBadge?.className).not.toContain('Stryker');

    const differentDuration = await connectSelector((element) => {
      element.customDuration = { days: 0, hours: 0, minutes: 30 };
      element.lastDuration = {
        minutes: 45,
        duration: { days: 0, hours: 0, minutes: 45 },
        timestamp: Date.now(),
      };
    });
    const differentBadge = differentDuration.shadowRoot?.querySelector('.last-duration-badge');
    expect(differentBadge?.classList.contains('active')).toBe(false);
    expect(getText(differentBadge)).toContain('45m');
  });

  test('schedule summary covers empty, immediate, invalid order, and delayed schedule states', async () => {
    const empty = await connectSelector((element) => {
      element.scheduleMode = true;
    });
    expect(empty.shadowRoot?.querySelector('.schedule-summary')).toBeNull();

    const immediate = await connectSelector((element) => {
      element.scheduleMode = true;
      element.resumeAtDate = '2026-04-29';
      element.resumeAtTime = '13:00';
    });
    expect(getText(immediate.shadowRoot?.querySelector('.schedule-summary'))).toContain('resume');

    const invalid = await connectSelector((element) => {
      element.scheduleMode = true;
      element.disableAtDate = '2026-04-29';
      element.disableAtTime = '14:00';
      element.resumeAtDate = '2026-04-29';
      element.resumeAtTime = '13:00';
    });
    expect(invalid.shadowRoot?.querySelector('.schedule-summary')?.classList.contains('invalid')).toBe(true);
    expect(getText(invalid.shadowRoot?.querySelector('.schedule-summary'))).toContain('before resume');

    const delayed = await connectSelector((element) => {
      element.scheduleMode = true;
      element.disableAtDate = '2026-04-29';
      element.disableAtTime = '12:30';
      element.resumeAtDate = '2026-04-29';
      element.resumeAtTime = '13:00';
    });
    const delayedText = getText(delayed.shadowRoot?.querySelector('.schedule-summary'));
    expect(delayedText).toContain('pause');
    expect(delayedText).toContain('resume');
    expect(delayedText).toContain('Apr 29, 12:30 PM');
    expect(delayedText).toContain('Apr 29, 1:00 PM');
    expect(delayedText).not.toContain('2026');
    expect(delayedText).not.toContain(':00:00');
  });

  test('schedule summary handles partial and malformed schedule fields without stale summary text', async () => {
    const resumeDateOnly = await connectSelector((element) => {
      element.scheduleMode = true;
      element.resumeAtDate = '2026-04-29';
    });
    expect(resumeDateOnly.shadowRoot?.querySelector('.schedule-summary')).toBeNull();

    const resumeTimeOnly = await connectSelector((element) => {
      element.scheduleMode = true;
      element.resumeAtTime = '13:00';
    });
    expect(resumeTimeOnly.shadowRoot?.querySelector('.schedule-summary')).toBeNull();

    const partialDisable = await connectSelector((element) => {
      element.scheduleMode = true;
      element.disableAtDate = '2026-04-29';
      element.resumeAtDate = '2026-04-29';
      element.resumeAtTime = '13:00';
    });
    expect(getText(partialDisable.shadowRoot?.querySelector('.schedule-summary'))).toContain(
      'pause immediately'
    );

    const malformedDisable = await connectSelector((element) => {
      element.scheduleMode = true;
      element.disableAtDate = '2026-02-31';
      element.disableAtTime = '12:00';
      element.resumeAtDate = '2026-04-29';
      element.resumeAtTime = '13:00';
    });
    expect(malformedDisable.shadowRoot?.querySelector('.schedule-summary')).toBeNull();

    const equalTimes = await connectSelector((element) => {
      element.scheduleMode = true;
      element.disableAtDate = '2026-04-29';
      element.disableAtTime = '13:00';
      element.resumeAtDate = '2026-04-29';
      element.resumeAtTime = '13:00';
    });
    expect(equalTimes.shadowRoot?.querySelector('.schedule-summary')?.classList.contains('invalid')).toBe(true);
  });

  test('schedule input controls emit field changes and back-to-duration emits disabled schedule mode', async () => {
    const element = await connectSelector((selector) => {
      selector.scheduleMode = true;
    });
    const fieldEvents: CustomEvent[] = [];
    const modeEvents: CustomEvent[] = [];
    element.addEventListener('schedule-field-change', (event) => fieldEvents.push(event as CustomEvent));
    element.addEventListener('schedule-mode-change', (event) => modeEvents.push(event as CustomEvent));

    const selects = element.shadowRoot?.querySelectorAll('select') ?? [];
    const inputs = element.shadowRoot?.querySelectorAll('input[type="time"]') ?? [];

    (selects[0] as HTMLSelectElement).value = '2026-04-29';
    selects[0]?.dispatchEvent(new Event('change'));
    (inputs[0] as HTMLInputElement).value = '12:30';
    inputs[0]?.dispatchEvent(new Event('input'));
    (selects[1] as HTMLSelectElement).value = '2026-04-30';
    selects[1]?.dispatchEvent(new Event('change'));
    (inputs[1] as HTMLInputElement).value = '13:45';
    inputs[1]?.dispatchEvent(new Event('input'));

    (element.shadowRoot?.querySelector('.schedule-link') as HTMLButtonElement).click();

    expect(fieldEvents.map((event) => event.detail)).toEqual([
      { field: 'disableAtDate', value: '2026-04-29' },
      { field: 'disableAtTime', value: '12:30' },
      { field: 'resumeAtDate', value: '2026-04-30' },
      { field: 'resumeAtTime', value: '13:45' },
    ]);
    expect(modeEvents[0]?.detail).toEqual({ enabled: false });
    expect(fieldEvents.every((event) => event.bubbles && event.composed)).toBe(true);
    expect(modeEvents[0]?.bubbles).toBe(true);
    expect(modeEvents[0]?.composed).toBe(true);
    expect(getText(element.shadowRoot?.querySelector('#snooze-at-label'))).toBe('Snooze at:');
    expect(getText(element.shadowRoot?.querySelector('#resume-at-label'))).toBe('Resume at:');
    expect(getText(element.shadowRoot?.querySelector('.field-hint'))).toBe(
      'Leave empty to snooze immediately'
    );
    expect(getText(element.shadowRoot?.querySelector('.schedule-link'))).toBe(
      'Back to duration selection'
    );
    expect(getText(selects[0]?.querySelector('option[value=""]') ?? null)).toBe('Select date');
    expect(getText(selects[1]?.querySelector('option[value=""]') ?? null)).toBe('Select date');
  });

  test('duration pills mark only the active preset, toggle custom input, and emit preset changes', async () => {
    const element = await connectSelector((selector) => {
      selector.customDuration = { days: 0, hours: 1, minutes: 0 };
    });
    const customEvents: CustomEvent[] = [];
    const durationEvents: CustomEvent[] = [];
    element.addEventListener('custom-input-toggle', (event) => customEvents.push(event as CustomEvent));
    element.addEventListener('duration-change', (event) => durationEvents.push(event as CustomEvent));

    const pills = Array.from(element.shadowRoot?.querySelectorAll('.pill') ?? []) as HTMLButtonElement[];
    const activePills = pills.filter((pill) => pill.classList.contains('active'));
    expect(activePills).toHaveLength(1);
    expect(getText(activePills[0] ?? null)).toBe('1h');

    const customPill = pills[pills.length - 1];
    customPill?.click();
    expect(customEvents[0]?.detail).toEqual({ show: true });
    expect(customEvents[0]?.bubbles).toBe(true);
    expect(customEvents[0]?.composed).toBe(true);

    pills[0]?.click();
    expect(durationEvents[0]?.detail).toMatchObject({
      minutes: 30,
      duration: { days: 0, hours: 0, minutes: 30 },
      showCustomInput: false,
    });
    expect(durationEvents[0]?.bubbles).toBe(true);
    expect(durationEvents[0]?.composed).toBe(true);
    expect(pills.every((pill) => !pill.className.includes('Stryker'))).toBe(true);
  });

  test('custom pill is the only active pill while custom input is open', async () => {
    const element = await connectSelector((selector) => {
      selector.showCustomInput = true;
      selector.customDuration = { days: 0, hours: 1, minutes: 0 };
    });

    const pills = Array.from(element.shadowRoot?.querySelectorAll('.pill') ?? []) as HTMLButtonElement[];
    const activePills = pills.filter((pill) => pill.classList.contains('active'));

    expect(activePills).toHaveLength(1);
    expect(getText(activePills[0] ?? null)).toBe('Custom');
    expect(pills.slice(0, -1).every((pill) => !pill.classList.contains('active'))).toBe(true);
  });

  test('custom duration input renders preview for valid input and help for invalid input', async () => {
    const valid = await connectSelector((element) => {
      element.showCustomInput = true;
      element.customDurationInput = '2h30m';
    });
    const validInput = valid.shadowRoot?.querySelector('.duration-input') as HTMLInputElement;
    expect(validInput.classList.contains('invalid')).toBe(false);
    expect(validInput.getAttribute('aria-invalid')).toBe('false');
    expect(validInput.getAttribute('placeholder')).toBe('e.g. 2h30m, 1.5h, 1d, 45m');
    expect(validInput.getAttribute('aria-label')).toBe('Custom duration');
    expect(validInput.className).not.toContain('Stryker');
    expect(getText(valid.shadowRoot?.querySelector('.duration-preview'))).toBe(
      'Duration: 2 hours, 30 minutes'
    );
    expect(valid.shadowRoot?.querySelector('.duration-help')).toBeNull();

    const invalid = await connectSelector((element) => {
      element.showCustomInput = true;
      element.customDurationInput = 'nope';
    });
    const invalidInput = invalid.shadowRoot?.querySelector('.duration-input') as HTMLInputElement;
    expect(invalidInput.classList.contains('invalid')).toBe(true);
    expect(invalidInput.getAttribute('aria-invalid')).toBe('true');
    expect(invalid.shadowRoot?.querySelector('.duration-preview')).toBeNull();
    expect(getText(invalid.shadowRoot?.querySelector('.duration-help'))).toContain('Enter duration');
  });

  test('custom duration input event dispatches updated text from the input element', async () => {
    const element = await connectSelector((selector) => {
      selector.showCustomInput = true;
      selector.customDurationInput = '30m';
    });
    const events: CustomEvent[] = [];
    element.addEventListener('duration-change', (event) => events.push(event as CustomEvent));
    const input = element.shadowRoot?.querySelector('.duration-input') as HTMLInputElement;

    input.value = '3h15m';
    input.dispatchEvent(new Event('input'));

    expect(events[0]?.detail).toEqual({
      minutes: 195,
      duration: { days: 0, hours: 3, minutes: 15 },
      input: '3h15m',
    });
  });

  test('duration mode schedule link label and header remain localized', async () => {
    const element = await connectSelector();

    expect(getText(element.shadowRoot?.querySelector('.duration-section-header'))).toBe('Snooze Duration');
    expect(getText(element.shadowRoot?.querySelector('.schedule-link'))).toBe('Pick specific date/time instead');
  });
});
