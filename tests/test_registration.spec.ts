import { vi } from 'vitest';
import {
  registerAutoSnoozeCard,
  registerCustomCardMetadata,
  safeDefine,
  _resetWarnedKeys,
} from '../src/registration.js';

function uniqueTag(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

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

  test('safeDefine registers unregistered elements', () => {
    class TestElement extends HTMLElement {}

    const tag = uniqueTag('autosnooze-reg-safe');
    safeDefine(tag, TestElement);

    expect(customElements.get(tag)).toBe(TestElement);
  });

  test('safeDefine does not warn for same constructor', () => {
    class TestElement extends HTMLElement {}

    const tag = uniqueTag('autosnooze-reg-same');
    safeDefine(tag, TestElement);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    safeDefine(tag, TestElement);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('safeDefine warns when a different constructor is already registered', () => {
    class FirstElement extends HTMLElement {}
    class SecondElement extends HTMLElement {}

    const tag = uniqueTag('autosnooze-reg-conflict');
    safeDefine(tag, FirstElement);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    safeDefine(tag, SecondElement);

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  test('safeDefine tolerates define race failures when tag becomes available', () => {
    class TestElement extends HTMLElement {}

    let storedCtor: CustomElementConstructor | undefined;
    const fakeRegistry = {
      get: vi.fn().mockImplementation(() => storedCtor),
      define: vi.fn().mockImplementation(() => {
        storedCtor = TestElement;
        throw new Error('already defined');
      }),
    } as unknown as CustomElementRegistry;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    safeDefine(uniqueTag('autosnooze-reg-race'), TestElement, fakeRegistry);

    expect(warnSpy).not.toHaveBeenCalled();
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

  test('safeDefine re-throws when define fails and tag remains unregistered', () => {
    class TestElement extends HTMLElement {}

    const defineError = new Error('Invalid constructor');
    const fakeRegistry = {
      get: vi.fn().mockReturnValue(undefined),
      define: vi.fn().mockImplementation(() => {
        throw defineError;
      }),
    } as unknown as CustomElementRegistry;

    expect(() =>
      safeDefine(uniqueTag('autosnooze-reg-real-error'), TestElement, fakeRegistry)
    ).toThrow(defineError);
  });

  test('safeDefine conflict warning fires again after _resetWarnedKeys', () => {
    class FirstElement extends HTMLElement {}
    class SecondElement extends HTMLElement {}

    const tag = uniqueTag('autosnooze-reg-reset');
    safeDefine(tag, FirstElement);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    safeDefine(tag, SecondElement);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    _resetWarnedKeys();
    safeDefine(tag, SecondElement);
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});
