import { configureLocalization } from '@lit/localize';
import { sourceLocale, targetLocales } from './locale-codes.js';

// Re-export msg and str for convenience
export { msg, str } from '@lit/localize';

// Type for supported locales
export type SupportedLocale = typeof sourceLocale | (typeof targetLocales)[number];

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

// Configure localization with lazy loading
const { getLocale, setLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: (locale: string) => {
    switch (locale) {
      case 'es':
        return import('../generated/locales/es.js');
      case 'fr':
        return import('../generated/locales/fr.js');
      case 'de':
        return import('../generated/locales/de.js');
      case 'it':
        return import('../generated/locales/it.js');
      default:
        // Source locale (en) doesn't need loading
        return Promise.resolve({} as never);
    }
  },
});

export { getLocale, setLocale };

/**
 * Get the supported locale from a Home Assistant language code.
 * Falls back to 'en' if the language is not supported.
 */
export function getHomeAssistantLocale(hass: { language?: string }): SupportedLocale {
  if (!hass?.language) {
    return sourceLocale;
  }

  // Direct match
  if (HA_LOCALE_MAP[hass.language]) {
    return HA_LOCALE_MAP[hass.language];
  }

  // Try base language (e.g., 'en' from 'en-AU')
  const baseLanguage = hass.language.split('-')[0];
  if (HA_LOCALE_MAP[baseLanguage]) {
    return HA_LOCALE_MAP[baseLanguage];
  }

  // Fallback to source locale
  return sourceLocale;
}

/**
 * Initialize the locale based on Home Assistant's language setting.
 * Call this when the component is first loaded or when hass.language changes.
 */
export async function initializeLocaleFromHA(hass: { language?: string }): Promise<void> {
  const locale = getHomeAssistantLocale(hass);
  if (locale !== getLocale()) {
    await setLocale(locale);
  }
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(locale: string): locale is SupportedLocale {
  return locale === sourceLocale || (targetLocales as readonly string[]).includes(locale);
}
