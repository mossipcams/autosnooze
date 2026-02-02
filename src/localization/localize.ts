/**
 * Simple JSON-based localization for AutoSnooze card.
 * Follows Home Assistant custom card conventions.
 */

import en from './translations/en.json';
import es from './translations/es.json';
import fr from './translations/fr.json';
import de from './translations/de.json';
import it from './translations/it.json';

// Type for translation data (nested object structure)
type TranslationData = Record<string, string | Record<string, string | Record<string, string>>>;

// All available translations
const translations: Record<string, TranslationData> = {
  en,
  es,
  fr,
  de,
  it,
};

// Supported locales
type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'it';

// Map of Home Assistant language codes to our supported locales
const HA_LOCALE_MAP: Record<string, SupportedLocale> = {
  en: 'en',
  'en-GB': 'en',
  'en-US': 'en',
  es: 'es',
  'es-ES': 'es',
  'es-419': 'es',
  fr: 'fr',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  de: 'de',
  'de-DE': 'de',
  'de-AT': 'de',
  'de-CH': 'de',
  it: 'it',
  'it-IT': 'it',
};

// Type for Home Assistant object with language info
type HassWithLanguage = { language?: string; locale?: { language?: string } };

/**
 * Get the supported locale from a Home Assistant language code.
 * Falls back to 'en' if the language is not supported.
 */
function getLocaleFromHass(hass?: HassWithLanguage): SupportedLocale {
  if (!hass) return 'en';

  // Support both hass.language and hass.locale.language
  const language = hass.language ?? hass.locale?.language;
  if (!language) return 'en';

  // Direct match
  const directMatch = HA_LOCALE_MAP[language];
  if (directMatch) return directMatch;

  // Try base language (e.g., 'en' from 'en-AU')
  const baseLanguage = language.split('-')[0];
  if (baseLanguage) {
    const baseMatch = HA_LOCALE_MAP[baseLanguage];
    if (baseMatch) return baseMatch;
  }

  // Fallback to English
  return 'en';
}

// Track warned keys to avoid spamming the console
const warnedKeys = new Set<string>();

/**
 * Get a nested value from an object using dot notation.
 * Example: getNestedValue(obj, 'toast.error.resume_failed')
 */
function getNestedValue(obj: TranslationData, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Replace placeholders in a string with provided values.
 * Supports {key} syntax for placeholder substitution.
 */
function replacePlaceholders(str: string, args?: Record<string, string | number>): string {
  if (!args) return str;

  return str.replace(/\{(\w+)\}/g, (match, key) => {
    const value = args[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Localize a string key using the Home Assistant language setting.
 *
 * @param hass - Home Assistant object with language info
 * @param key - Translation key in dot notation (e.g., 'toast.error.resume_failed')
 * @param args - Optional placeholder values (e.g., { count: 5 })
 * @returns Localized string, or the key if not found
 *
 * @example
 * localize(this.hass, 'button.undo')
 * localize(this.hass, 'toast.success.snoozed_for_many', { count: 5, duration: '2 hours' })
 */
export function localize(
  hass: HassWithLanguage | undefined,
  key: string,
  args?: Record<string, string | number>
): string {
  const locale = getLocaleFromHass(hass);
  const langTranslations = translations[locale];

  // Try to get the translation for the current locale
  let value = langTranslations ? getNestedValue(langTranslations, key) : undefined;

  // Fallback to English if not found in current locale
  if (!value && locale !== 'en') {
    value = getNestedValue(translations.en as TranslationData, key);
  }

  // If still not found, return the key itself (warn once per key)
  if (!value) {
    if (!warnedKeys.has(key)) {
      warnedKeys.add(key);
      console.warn(`[AutoSnooze] Missing translation for key: ${key}`);
    }
    return key;
  }

  // Replace placeholders
  return replacePlaceholders(value, args);
}

