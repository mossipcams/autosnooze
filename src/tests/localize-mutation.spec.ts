import { afterEach, describe, expect, test, vi } from 'vitest';
import { localize } from '../localization/localize.js';

describe('localization mutation boundaries', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('resolves direct, locale-object, mapped, base-language, and fallback English locales', () => {
    expect(localize(undefined, 'button.undo')).toBe('Undo');
    expect(localize({ language: 'es' }, 'button.undo')).toBe('Deshacer');
    expect(localize({ locale: { language: 'fr-FR' } }, 'button.cancel')).toBe('Annuler');
    expect(localize({ language: 'de-CH' }, 'button.resume')).toBe('Fortsetzen');
    expect(localize({ language: 'it' }, 'button.clear')).toBe('Cancella');
    expect(localize({ language: 'it-IT' }, 'button.clear')).toBe('Cancella');
    expect(localize({ language: 'en-AU' }, 'button.select_all')).toBe('Select All');
    expect(localize({ language: 'fr-BE' }, 'button.resume_all')).toBe('Tout reprendre');
    expect(localize({ language: 'pt-BR' }, 'button.clear')).toBe('Clear');
    expect(localize({ language: '' }, 'button.clear')).toBe('Clear');
  });

  test('falls back to English for missing translated keys and only returns strings from nested paths', () => {
    expect(localize({ language: 'es' }, 'group.recent')).toBe('Recent');
    expect(localize({ language: 'es' }, 'toast')).toBe('toast');
    expect(localize({ language: 'es' }, 'toast.success')).toBe('toast.success');
    expect(localize({ language: 'es' }, 'toast.success.snoozed_for_many.extra')).toBe(
      'toast.success.snoozed_for_many.extra'
    );
  });

  test('replaces string and numeric placeholders while preserving unknown placeholders', () => {
    expect(localize({ language: 'en-US' }, 'toast.success.snoozed_for_many', {
      count: 3,
      duration: '45 minutes',
    })).toBe('Snoozed 3 automations for 45 minutes');
    expect(localize({ language: 'en-US' }, 'toast.success.snoozed_for_many', {
      count: 2,
    })).toBe('Snoozed 2 automations for {duration}');
    expect(localize({ language: 'en-US' }, 'button.undo')).toBe('Undo');
  });

  test('warns once per missing translation key and includes the missing key in the warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const missingKey = 'missing.mutation.boundary';

    expect(localize({ language: 'en' }, missingKey)).toBe(missingKey);
    expect(localize({ language: 'fr' }, missingKey)).toBe(missingKey);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(`[AutoSnooze] Missing translation for key: ${missingKey}`);
  });
});
