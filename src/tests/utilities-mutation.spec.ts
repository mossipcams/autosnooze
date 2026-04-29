import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { hapticFeedback } from '../utils/haptic.js';
import {
  formatDateTime,
  formatDuration,
  formatDurationShort,
} from '../utils/time-formatting.js';
import { combineDateTime, generateDateOptions } from '../utils/datetime.js';
import {
  _resetWarnedKeys,
  registerAutoSnoozeCard,
  registerCustomCardMetadata,
  safeDefine,
} from '../registration.js';
import {
  AutomationPauseCard,
  AutomationPauseCardEditor,
  AutoSnoozeActivePauses,
  AutoSnoozeAdjustModal,
  AutoSnoozeAutomationList,
  AutoSnoozeDurationSelector,
} from '../components/index.js';

function uniqueTag(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

describe('haptic feedback utility', () => {
  test('dispatches the Home Assistant haptic event with default light feedback', () => {
    const events: CustomEvent[] = [];
    const listener = (event: Event): void => {
      events.push(event as CustomEvent);
    };

    window.addEventListener('hass-haptic', listener);
    hapticFeedback();
    window.removeEventListener('hass-haptic', listener);

    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('hass-haptic');
    expect(events[0]?.detail).toBe('light');
    expect(events[0]?.bubbles).toBe(true);
    expect(events[0]?.composed).toBe(true);
  });

  test('preserves the requested feedback intensity in the event detail', () => {
    const events: CustomEvent[] = [];
    const listener = (event: Event): void => {
      events.push(event as CustomEvent);
    };

    window.addEventListener('hass-haptic', listener);
    hapticFeedback('medium');
    window.removeEventListener('hass-haptic', listener);

    expect(events).toHaveLength(1);
    expect(events[0]?.detail).toBe('medium');
  });
});

describe('time formatting utility mutation boundaries', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('formatDateTime includes the year only for dates after the current year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0));

    const sameYear = formatDateTime(new Date(2026, 6, 20, 13, 30, 0).toISOString(), 'en-US');
    const nextYear = formatDateTime(new Date(2027, 0, 5, 8, 15, 0).toISOString(), 'en-US');

    expect(sameYear).toContain('Jul');
    expect(sameYear).toContain('20');
    expect(sameYear).not.toContain('2026');
    expect(nextYear).toContain('Jan');
    expect(nextYear).toContain('5');
    expect(nextYear).toContain('2027');
  });

  test('formatDurationShort keeps zero values out while preserving separators and fallback', () => {
    expect(formatDurationShort(1, 2, 3)).toBe('1d 2h 3m');
    expect(formatDurationShort(0, 2, 0)).toBe('2h');
    expect(formatDurationShort(0, 0, 5)).toBe('5m');
    expect(formatDurationShort(0, 0, 0)).toBe('0m');
  });

  test('formatDuration handles singular, plural, and empty durations explicitly', () => {
    expect(formatDuration(1, 1, 1)).toBe('1 day, 1 hour, 1 minute');
    expect(formatDuration(2, 3, 4)).toBe('2 days, 3 hours, 4 minutes');
    expect(formatDuration(0, 0, 0)).toBe('');
  });
});

describe('datetime utility mutation boundaries', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('combineDateTime rejects empty, malformed, and normalized date/time inputs', () => {
    expect(combineDateTime('', '12:00')).toBeNull();
    expect(combineDateTime('2026-02-31', '12:00')).toBeNull();
    expect(combineDateTime('2026-04-06', '24:61')).toBeNull();
    expect(combineDateTime('2026-04-06', '09:05')).toMatch(
      /^2026-04-06T09:05[+-]\d{2}:\d{2}$/
    );
  });

  test('generateDateOptions emits padded ISO values and year-aware labels', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 12, 0, 0));

    const options = generateDateOptions(3, 'en-US');

    expect(options).toEqual([
      { value: '2026-12-31', label: 'Thu, Dec 31' },
      { value: '2027-01-01', label: 'Fri, Jan 1, 2027' },
      { value: '2027-01-02', label: 'Sat, Jan 2, 2027' },
    ]);
  });

  test('generateDateOptions returns no options when no days are requested', () => {
    expect(generateDateOptions(0, 'en-US')).toEqual([]);
  });
});

describe('registration utility mutation boundaries', () => {
  beforeEach(() => {
    delete (globalThis as Record<PropertyKey, unknown>)[
      Symbol.for('autosnooze.registration.done.v1')
    ];
    _resetWarnedKeys();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (globalThis as Record<PropertyKey, unknown>)[
      Symbol.for('autosnooze.registration.done.v1')
    ];
  });

  test('safeDefine warns once with tag-specific conflict details', () => {
    class FirstElement extends HTMLElement {}
    class SecondElement extends HTMLElement {}

    const tag = uniqueTag('autosnooze-reg-conflict-once');
    safeDefine(tag, FirstElement);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    safeDefine(tag, SecondElement);
    safeDefine(tag, SecondElement);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Element tag "${tag}" is already registered`)
    );
  });

  test('safeDefine warns and returns when a define race claims the tag with another constructor', () => {
    class ExpectedElement extends HTMLElement {}
    class OtherElement extends HTMLElement {}

    const tag = uniqueTag('autosnooze-reg-claimed');
    let getCount = 0;
    const fakeRegistry = {
      get: vi.fn().mockImplementation(() => {
        getCount += 1;
        return getCount === 1 ? undefined : OtherElement;
      }),
      define: vi.fn().mockImplementation(() => {
        throw new Error('already defined elsewhere');
      }),
    } as unknown as CustomElementRegistry;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => safeDefine(tag, ExpectedElement, fakeRegistry)).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Element tag "${tag}" was claimed by a different constructor`)
    );
  });

  test('registerCustomCardMetadata does not warn for missing customCards and preserves other entries', () => {
    delete (window as Window & { customCards?: unknown }).customCards;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    registerCustomCardMetadata('2.0.0');

    expect(warnSpy).not.toHaveBeenCalled();
    expect(window.customCards).toEqual([
      {
        type: 'autosnooze-card',
        name: 'AutoSnooze Card',
        description: 'Temporarily pause automations with area and label filtering (v2.0.0)',
        preview: true,
        documentationURL: 'https://github.com/mossipcams/autosnooze#readme',
      },
    ]);
  });

  test('registerCustomCardMetadata ignores nullish non-card entries while upserting autosnooze metadata', () => {
    window.customCards = [
      null,
      {
        type: 'custom:other-card',
        name: 'Other',
        description: 'Other',
        preview: false,
      },
      {
        type: 'autosnooze-card',
        name: 'Old AutoSnooze',
        description: 'Old',
        preview: false,
      },
    ] as unknown as typeof window.customCards;

    registerCustomCardMetadata('3.0.0');

    expect(window.customCards).toHaveLength(3);
    expect(window.customCards?.[0]).toBeNull();
    expect(window.customCards?.filter((card) => card?.type === 'autosnooze-card')).toHaveLength(1);
    expect(window.customCards?.[2]).toMatchObject({
      type: 'autosnooze-card',
      name: 'AutoSnooze Card',
      description: expect.stringContaining('(v3.0.0)'),
      preview: true,
      documentationURL: 'https://github.com/mossipcams/autosnooze#readme',
    });
  });

  test('registerAutoSnoozeCard registers every shipped custom element and marks the runtime', () => {
    registerAutoSnoozeCard();

    expect(customElements.get('autosnooze-card-editor')).toBe(AutomationPauseCardEditor);
    expect(customElements.get('autosnooze-active-pauses')).toBe(AutoSnoozeActivePauses);
    expect(customElements.get('autosnooze-duration-selector')).toBe(AutoSnoozeDurationSelector);
    expect(customElements.get('autosnooze-automation-list')).toBe(AutoSnoozeAutomationList);
    expect(customElements.get('autosnooze-adjust-modal')).toBe(AutoSnoozeAdjustModal);
    expect(customElements.get('autosnooze-card')).toBe(AutomationPauseCard);
    expect(
      (globalThis as Record<PropertyKey, unknown>)[Symbol.for('autosnooze.registration.done.v1')]
    ).toBe(true);
  });
});
