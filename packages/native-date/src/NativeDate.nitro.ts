import type { HybridObject } from 'react-native-nitro-modules';

/**
 * Time unit for date arithmetic and comparisons
 */
export type TimeUnit =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year';

/**
 * Date components returned by getComponents
 */
export type DateComponents = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  dayOfWeek: number;
};

/**
 * Locale information returned by getLocaleInfo and getAvailableLocalesInfo
 */
export type LocaleInfo = {
  /** Full locale code (e.g., "en_US") */
  code: string;
  /** Language code only (e.g., "en") */
  languageCode: string;
  /** Region/country code if present (e.g., "US"), empty string if none */
  regionCode: string;
  /** Display name in English (e.g., "English (United States)") */
  displayName: string;
  /** Display name in the locale's own language (e.g., "English" for en, "Español" for es) */
  nativeName: string;
};

/**
 * Native date operations implemented in C++
 * All timestamps are in milliseconds since Unix epoch (UTC)
 */
export interface NativeDate
  extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // Core
  now(): number;
  parse(dateString: string): number;
  parseFormat(dateString: string, pattern: string): number;
  tryParseFormat(dateString: string, pattern: string): number;
  format(timestamp: number, pattern: string): string;
  formatUTC(timestamp: number, pattern: string): string;
  // String input variants (single bridge crossing - parses internally)
  formatFromString(dateString: string, pattern: string): string;
  formatUTCFromString(dateString: string, pattern: string): string;

  // Getters
  getComponents(timestamp: number): DateComponents;
  getComponentsFromString(dateString: string): DateComponents;
  getYear(timestamp: number): number;
  getYearFromString(dateString: string): number;
  getMonth(timestamp: number): number;
  getMonthFromString(dateString: string): number;
  getDate(timestamp: number): number;
  getDateFromString(dateString: string): number;
  getDay(timestamp: number): number;
  getDayFromString(dateString: string): number;
  getHours(timestamp: number): number;
  getHoursFromString(dateString: string): number;
  getMinutes(timestamp: number): number;
  getMinutesFromString(dateString: string): number;
  getSeconds(timestamp: number): number;
  getSecondsFromString(dateString: string): number;
  getMilliseconds(timestamp: number): number;
  getMillisecondsFromString(dateString: string): number;

  // Date info
  getDaysInMonth(timestamp: number): number;
  isLeapYear(timestamp: number): boolean;
  isWeekend(timestamp: number): boolean;
  isValid(timestamp: number): boolean;

  // Arithmetic
  add(timestamp: number, amount: number, unit: TimeUnit): number;
  subtract(timestamp: number, amount: number, unit: TimeUnit): number;

  // Comparisons
  isBefore(timestamp1: number, timestamp2: number): boolean;
  isAfter(timestamp1: number, timestamp2: number): boolean;
  isSame(timestamp1: number, timestamp2: number, unit: TimeUnit): boolean;

  // Helpers
  startOf(timestamp: number, unit: TimeUnit): number;
  endOf(timestamp: number, unit: TimeUnit): number;
  diff(timestamp1: number, timestamp2: number, unit: TimeUnit): number;
  clamp(timestamp: number, min: number, max: number): number;
  min(timestamps: number[]): number;
  max(timestamps: number[]): number;

  // Relative time formatting
  formatDistance(
    timestamp: number,
    baseTimestamp: number,
    addSuffix: boolean
  ): string;
  formatDuration(milliseconds: number): string;

  // Timezone
  getTimezone(): string;
  getTimezoneOffset(): number;
  getTimezoneOffsetForTimestamp(timestamp: number): number;
  toTimezone(timestamp: number, timezone: string): number;
  formatInTimezone(
    timestamp: number,
    pattern: string,
    timezone: string
  ): string;
  getAvailableTimezones(): string[];
  isValidTimezone(timezone: string): boolean;

  // Locale
  getLocale(): string;
  setLocale(locale: string): boolean;
  getAvailableLocales(): string[];
  getLocaleDisplayName(localeCode: string): string;
  getLocaleInfo(localeCode: string): LocaleInfo;
  getAvailableLocalesInfo(): LocaleInfo[];

  // Async batch operations (run on background thread)
  parseManyAsync(dateStrings: string[]): Promise<number[]>;
  formatManyAsync(timestamps: number[], pattern: string): Promise<string[]>;
  getComponentsManyAsync(timestamps: number[]): Promise<DateComponents[]>;
}
