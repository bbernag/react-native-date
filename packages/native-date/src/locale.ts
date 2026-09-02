import type { LocaleInfo } from './NativeDate.nitro';
import { getNative } from './native';

// Locale

/**
 * Supported locale codes for date formatting
 * Uses OS-provided locale data, so all locales supported by iOS/Android are available
 * Common language codes listed for TypeScript autocomplete
 */
export type Locale =
  // Major world languages
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'nl' // Dutch
  | 'ru' // Russian
  | 'ja' // Japanese
  | 'zh' // Chinese
  | 'ko' // Korean
  | 'ar' // Arabic
  // European languages
  | 'pl' // Polish
  | 'tr' // Turkish
  | 'sv' // Swedish
  | 'no' // Norwegian
  | 'nb' // Norwegian Bokmål
  | 'nn' // Norwegian Nynorsk
  | 'da' // Danish
  | 'fi' // Finnish
  | 'el' // Greek
  | 'cs' // Czech
  | 'hu' // Hungarian
  | 'ro' // Romanian
  | 'uk' // Ukrainian
  | 'bg' // Bulgarian
  | 'hr' // Croatian
  | 'sk' // Slovak
  | 'sl' // Slovenian
  | 'sr' // Serbian
  | 'lt' // Lithuanian
  | 'lv' // Latvian
  | 'et' // Estonian
  | 'ca' // Catalan
  | 'eu' // Basque
  | 'gl' // Galician
  // Middle Eastern / South Asian
  | 'he' // Hebrew
  | 'fa' // Persian/Farsi
  | 'hi' // Hindi
  | 'bn' // Bengali
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'pa' // Punjabi
  | 'ur' // Urdu
  // Southeast Asian
  | 'th' // Thai
  | 'vi' // Vietnamese
  | 'id' // Indonesian
  | 'ms' // Malay
  | 'fil' // Filipino
  | 'km' // Khmer
  | 'lo' // Lao
  | 'my' // Burmese
  // East Asian
  | 'yue' // Cantonese
  // African
  | 'sw' // Swahili
  | 'am' // Amharic
  | 'zu' // Zulu
  | 'af' // Afrikaans
  // Other
  | 'is' // Icelandic
  | 'ga' // Irish
  | 'cy' // Welsh
  | 'mt' // Maltese
  // Allow any string for additional locales
  | (string & {});

/**
 * Get the current locale used for formatting month/day names.
 *
 * @returns The current locale code (e.g., 'en', 'es')
 *
 * @remarks
 * Returns the system default locale if no locale has been explicitly set.
 *
 * @see
 * - iOS: {@link https://developer.apple.com/documentation/foundation/nslocale NSLocale Documentation}
 * - Android: {@link https://developer.android.com/reference/java/util/Locale Java Locale Documentation}
 */
export function getLocale(): Locale {
  return getNative().getLocale() as Locale;
}

/**
 * Set the locale for formatting month/day names.
 *
 * @param locale - The locale code (e.g., 'en', 'es', 'fr', 'de', 'pt-BR', 'zh-Hans')
 * @returns `true` if the locale was set successfully, `false` if not supported
 *
 * @example
 * ```typescript
 * setLocale('es'); // Spanish
 * setLocale('pt-BR'); // Portuguese (Brazil)
 * ```
 */
export function setLocale(locale: Locale): boolean {
  return getNative().setLocale(locale);
}

/**
 * Object returned by {@link getAvailableLocales}: every available locale code
 * mapped to itself, so membership checks read naturally (`if (locales.es)`).
 * Under `noUncheckedIndexedAccess` a lookup is `Locale | undefined`, which is
 * exactly the "may not be available" semantics.
 */
export type AvailableLocalesMap = Readonly<Partial<Record<Locale, Locale>>>;

let availableLocalesCache: AvailableLocalesMap | undefined;

/**
 * Get all locales available for date formatting as a lookup object.
 *
 * The result is computed once and memoized (the set of installed locales does
 * not change while the app runs) and is frozen.
 *
 * @returns A frozen object mapping locale codes to themselves
 * (e.g. `{ en: 'en', es: 'es', ... }`)
 *
 * @remarks
 * The available locales are determined by the device's operating system:
 * - **iOS**: Uses `NSLocale.availableLocaleIdentifiers`
 * - **Android**: Uses `Locale.getAvailableLocales()`
 *
 * @example
 * ```typescript
 * import { getAvailableLocales, setLocale } from '@bernagl/react-native-date';
 *
 * const locales = getAvailableLocales();
 *
 * // Check if a locale is available before using
 * if (locales.es) {
 *   setLocale(locales.es);
 * }
 *
 * // List all available locales
 * console.log(Object.keys(locales));
 * ```
 *
 * @see getAvailableLocalesInfo - Same list with display names, for pickers
 */
export function getAvailableLocales(): AvailableLocalesMap {
  if (availableLocalesCache !== undefined) return availableLocalesCache;
  const localesMap: Partial<Record<Locale, Locale>> = {};
  for (const locale of getNative().getAvailableLocales()) {
    localesMap[locale as Locale] = locale as Locale;
  }
  availableLocalesCache = Object.freeze(localesMap);
  return availableLocalesCache;
}

/**
 * Get the display name for a locale code.
 *
 * @param localeCode - The locale code (e.g., 'en', 'es', 'pt_BR')
 * @returns The display name in English (e.g., 'English', 'Spanish', 'Portuguese (Brazil)')
 *
 * @example
 * ```typescript
 * getLocaleDisplayName('en')    // 'English'
 * getLocaleDisplayName('es')    // 'Spanish'
 * getLocaleDisplayName('pt_BR') // 'Portuguese (Brazil)'
 * ```
 */
export function getLocaleDisplayName(localeCode: Locale): string {
  return getNative().getLocaleDisplayName(localeCode);
}

/**
 * Get detailed information about a locale.
 *
 * @param localeCode - The locale code (e.g., 'en', 'es', 'pt_BR')
 * @returns LocaleInfo object with code, languageCode, regionCode, displayName, and nativeName
 *
 * @example
 * ```typescript
 * const info = getLocaleInfo('pt_BR');
 * // {
 * //   code: 'pt_BR',
 * //   languageCode: 'pt',
 * //   regionCode: 'BR',
 * //   displayName: 'Portuguese (Brazil)',
 * //   nativeName: 'Português (Brasil)'
 * // }
 * ```
 */
export function getLocaleInfo(localeCode: Locale): LocaleInfo {
  return getNative().getLocaleInfo(localeCode);
}

/**
 * Get detailed information for all available locales.
 *
 * @returns Array of LocaleInfo objects for all available locales
 *
 * @remarks
 * This provides full locale information including display names in English
 * and native names, useful for building locale pickers.
 *
 * @example
 * ```typescript
 * const locales = getAvailableLocalesInfo();
 * // [
 * //   { code: 'en', languageCode: 'en', regionCode: '', displayName: 'English', nativeName: 'English' },
 * //   { code: 'es', languageCode: 'es', regionCode: '', displayName: 'Spanish', nativeName: 'Español' },
 * //   ...
 * // ]
 * ```
 */
export function getAvailableLocalesInfo(): LocaleInfo[] {
  return getNative().getAvailableLocalesInfo();
}
