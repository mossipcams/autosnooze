import { vi } from 'vitest';
import {
  registerAutoSnoozeCard,
  registerCustomCardMetadata,
  _resetWarnedKeys,
} from '../src/registration.js';

describe('Registration hardening', () => {
  beforeEach(() => {
    delete (globalThis as Record<PropertyKey, unknown>)[
      Symbol.for('autosnooze.registration.done.v1')
    ];
    window.customCards = [];
    _resetWarnedKeys();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (globalThis as Record<PropertyKey, unknown>)[
      Symbol.for('autosnooze.registration.done.v1')
    ];
  });

  test('registerCustomCardMetadata normalizes malformed customCards value', () => {
    (window as Window & { customCards?: unknown }).customCards = {
      broken: true,
    } as unknown as import('../src/types/card.js').CustomCardEntry[];

    registerCustomCardMetadata('9.9.9');

    expect(Array.isArray(window.customCards)).toBe(true);
    const entry = window.customCards?.find((card) => card.type === 'autosnooze-card');
    expect(entry).toBeDefined();
    expect(entry?.description).toContain('(v9.9.9)');
    expect(entry?.documentationURL).toBe('https://github.com/mossipcams/autosnooze#readme');
  });

  test('registerCustomCardMetadata upserts existing autosnooze entry', () => {
    window.customCards = [
      {
        type: 'autosnooze-card',
        name: 'Old Card',
        description: 'Old',
        preview: false,
      },
      {
        type: 'custom:other-card',
        name: 'Other',
        description: 'Other',
        preview: false,
      },
    ];

    registerCustomCardMetadata('1.2.3');

    const autosnoozeEntries = window.customCards.filter(
      (card) => card.type === 'autosnooze-card'
    );
    expect(autosnoozeEntries).toHaveLength(1);
    expect(autosnoozeEntries[0]?.name).toBe('AutoSnooze Card');
    expect(autosnoozeEntries[0]?.preview).toBe(true);
    expect(autosnoozeEntries[0]?.description).toContain('(v1.2.3)');
    expect(autosnoozeEntries[0]?.documentationURL).toBe(
      'https://github.com/mossipcams/autosnooze#readme'
    );

    expect(
      window.customCards.find((card) => card.type === 'custom:other-card')
    ).toBeDefined();
  });

  test('registerAutoSnoozeCard is idempotent', () => {
    registerAutoSnoozeCard();
    registerAutoSnoozeCard();

    const entries = window.customCards.filter(
      (card) => card.type === 'autosnooze-card'
    );
    expect(entries).toHaveLength(1);
    expect(customElements.get('autosnooze-card')).toBeDefined();
  });

  test('registerCustomCardMetadata warns when customCards is not an array', () => {
    (window as Window & { customCards?: unknown }).customCards = {
      broken: true,
    } as unknown as import('../src/types/card.js').CustomCardEntry[];

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerCustomCardMetadata('1.0.0');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('window.customCards was not an array')
    );
  });

});
