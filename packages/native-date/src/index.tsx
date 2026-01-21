import { NitroModules } from 'react-native-nitro-modules';

import type {
  DateComponents,
  LocaleInfo,
  NativeDate,
  TimeUnit,
} from './NativeDate.nitro';

// types
export type {
  DateComponents,
  LocaleInfo,
  NativeDate,
  TimeUnit,
} from './NativeDate.nitro';

/**
 * Accepted date input types for all functions
 * - number: Unix timestamp in milliseconds
 * - string: ISO 8601 date string (e.g., '2024-12-25', '2024-12-25T10:30:00Z')
 * - Date: JavaScript Date object
 */
export type DateInput = number | string | Date;

/**
 * Convert any DateInput to a timestamp (milliseconds)
 *
 * Uses JS Date.parse() for strings instead of native C++ parse because:
 * - Avoids bridge crossing overhead for simple ISO 8601 parsing
 * - JS Date.parse() is faster for this use case since it doesn't need to cross the JS-to-native bridge
 *
 * For custom format parsing, use `parseFormat()` which leverages native C++ for complex patterns.
 *
 * @see NativeDateModule.parse - Native C++ alternative (available via NativeDateModule directly)
 */
function toTimestamp(date: DateInput): number {
  // typeof is ~10-20x faster than property lookup
  if (typeof date === 'number') return date;
  if (typeof date === 'string') return Date.parse(date);
  return date.getTime();
}

/**
 * IANA Timezone identifiers
 * Complete list of canonical timezones supported by iOS and Android
 */
export type Timezone =
  // UTC
  | 'UTC'
  // Africa
  | 'Africa/Abidjan'
  | 'Africa/Algiers'
  | 'Africa/Bissau'
  | 'Africa/Cairo'
  | 'Africa/Casablanca'
  | 'Africa/Ceuta'
  | 'Africa/El_Aaiun'
  | 'Africa/Johannesburg'
  | 'Africa/Juba'
  | 'Africa/Khartoum'
  | 'Africa/Lagos'
  | 'Africa/Maputo'
  | 'Africa/Monrovia'
  | 'Africa/Nairobi'
  | 'Africa/Ndjamena'
  | 'Africa/Sao_Tome'
  | 'Africa/Tripoli'
  | 'Africa/Tunis'
  | 'Africa/Windhoek'
  // America
  | 'America/Adak'
  | 'America/Anchorage'
  | 'America/Araguaina'
  | 'America/Argentina/Buenos_Aires'
  | 'America/Argentina/Catamarca'
  | 'America/Argentina/Cordoba'
  | 'America/Argentina/Jujuy'
  | 'America/Argentina/La_Rioja'
  | 'America/Argentina/Mendoza'
  | 'America/Argentina/Rio_Gallegos'
  | 'America/Argentina/Salta'
  | 'America/Argentina/San_Juan'
  | 'America/Argentina/San_Luis'
  | 'America/Argentina/Tucuman'
  | 'America/Argentina/Ushuaia'
  | 'America/Asuncion'
  | 'America/Bahia'
  | 'America/Bahia_Banderas'
  | 'America/Barbados'
  | 'America/Belem'
  | 'America/Belize'
  | 'America/Boa_Vista'
  | 'America/Bogota'
  | 'America/Boise'
  | 'America/Cambridge_Bay'
  | 'America/Campo_Grande'
  | 'America/Cancun'
  | 'America/Caracas'
  | 'America/Cayenne'
  | 'America/Chicago'
  | 'America/Chihuahua'
  | 'America/Ciudad_Juarez'
  | 'America/Costa_Rica'
  | 'America/Cuiaba'
  | 'America/Danmarkshavn'
  | 'America/Dawson'
  | 'America/Dawson_Creek'
  | 'America/Denver'
  | 'America/Detroit'
  | 'America/Edmonton'
  | 'America/Eirunepe'
  | 'America/El_Salvador'
  | 'America/Fort_Nelson'
  | 'America/Fortaleza'
  | 'America/Glace_Bay'
  | 'America/Goose_Bay'
  | 'America/Grand_Turk'
  | 'America/Guatemala'
  | 'America/Guayaquil'
  | 'America/Guyana'
  | 'America/Halifax'
  | 'America/Havana'
  | 'America/Hermosillo'
  | 'America/Indiana/Indianapolis'
  | 'America/Indiana/Knox'
  | 'America/Indiana/Marengo'
  | 'America/Indiana/Petersburg'
  | 'America/Indiana/Tell_City'
  | 'America/Indiana/Vevay'
  | 'America/Indiana/Vincennes'
  | 'America/Indiana/Winamac'
  | 'America/Inuvik'
  | 'America/Iqaluit'
  | 'America/Jamaica'
  | 'America/Juneau'
  | 'America/Kentucky/Louisville'
  | 'America/Kentucky/Monticello'
  | 'America/La_Paz'
  | 'America/Lima'
  | 'America/Los_Angeles'
  | 'America/Maceio'
  | 'America/Managua'
  | 'America/Manaus'
  | 'America/Martinique'
  | 'America/Matamoros'
  | 'America/Mazatlan'
  | 'America/Menominee'
  | 'America/Merida'
  | 'America/Metlakatla'
  | 'America/Mexico_City'
  | 'America/Miquelon'
  | 'America/Moncton'
  | 'America/Monterrey'
  | 'America/Montevideo'
  | 'America/New_York'
  | 'America/Nome'
  | 'America/Noronha'
  | 'America/North_Dakota/Beulah'
  | 'America/North_Dakota/Center'
  | 'America/North_Dakota/New_Salem'
  | 'America/Nuuk'
  | 'America/Ojinaga'
  | 'America/Panama'
  | 'America/Paramaribo'
  | 'America/Phoenix'
  | 'America/Port-au-Prince'
  | 'America/Porto_Velho'
  | 'America/Puerto_Rico'
  | 'America/Punta_Arenas'
  | 'America/Rankin_Inlet'
  | 'America/Recife'
  | 'America/Regina'
  | 'America/Resolute'
  | 'America/Rio_Branco'
  | 'America/Santarem'
  | 'America/Santiago'
  | 'America/Santo_Domingo'
  | 'America/Sao_Paulo'
  | 'America/Scoresbysund'
  | 'America/Sitka'
  | 'America/St_Johns'
  | 'America/Swift_Current'
  | 'America/Tegucigalpa'
  | 'America/Thule'
  | 'America/Tijuana'
  | 'America/Toronto'
  | 'America/Vancouver'
  | 'America/Whitehorse'
  | 'America/Winnipeg'
  | 'America/Yakutat'
  // Antarctica
  | 'Antarctica/Casey'
  | 'Antarctica/Davis'
  | 'Antarctica/Macquarie'
  | 'Antarctica/Mawson'
  | 'Antarctica/Palmer'
  | 'Antarctica/Rothera'
  | 'Antarctica/Troll'
  | 'Antarctica/Vostok'
  // Asia
  | 'Asia/Almaty'
  | 'Asia/Amman'
  | 'Asia/Anadyr'
  | 'Asia/Aqtau'
  | 'Asia/Aqtobe'
  | 'Asia/Ashgabat'
  | 'Asia/Atyrau'
  | 'Asia/Baghdad'
  | 'Asia/Baku'
  | 'Asia/Bangkok'
  | 'Asia/Barnaul'
  | 'Asia/Beirut'
  | 'Asia/Bishkek'
  | 'Asia/Chita'
  | 'Asia/Colombo'
  | 'Asia/Damascus'
  | 'Asia/Dhaka'
  | 'Asia/Dili'
  | 'Asia/Dubai'
  | 'Asia/Dushanbe'
  | 'Asia/Famagusta'
  | 'Asia/Gaza'
  | 'Asia/Hebron'
  | 'Asia/Ho_Chi_Minh'
  | 'Asia/Hong_Kong'
  | 'Asia/Hovd'
  | 'Asia/Irkutsk'
  | 'Asia/Jakarta'
  | 'Asia/Jayapura'
  | 'Asia/Jerusalem'
  | 'Asia/Kabul'
  | 'Asia/Kamchatka'
  | 'Asia/Karachi'
  | 'Asia/Kathmandu'
  | 'Asia/Khandyga'
  | 'Asia/Kolkata'
  | 'Asia/Krasnoyarsk'
  | 'Asia/Kuching'
  | 'Asia/Macau'
  | 'Asia/Magadan'
  | 'Asia/Makassar'
  | 'Asia/Manila'
  | 'Asia/Nicosia'
  | 'Asia/Novokuznetsk'
  | 'Asia/Novosibirsk'
  | 'Asia/Omsk'
  | 'Asia/Oral'
  | 'Asia/Pontianak'
  | 'Asia/Pyongyang'
  | 'Asia/Qatar'
  | 'Asia/Qostanay'
  | 'Asia/Qyzylorda'
  | 'Asia/Riyadh'
  | 'Asia/Sakhalin'
  | 'Asia/Samarkand'
  | 'Asia/Seoul'
  | 'Asia/Shanghai'
  | 'Asia/Singapore'
  | 'Asia/Srednekolymsk'
  | 'Asia/Taipei'
  | 'Asia/Tashkent'
  | 'Asia/Tbilisi'
  | 'Asia/Tehran'
  | 'Asia/Thimphu'
  | 'Asia/Tokyo'
  | 'Asia/Tomsk'
  | 'Asia/Ulaanbaatar'
  | 'Asia/Urumqi'
  | 'Asia/Ust-Nera'
  | 'Asia/Vladivostok'
  | 'Asia/Yakutsk'
  | 'Asia/Yangon'
  | 'Asia/Yekaterinburg'
  | 'Asia/Yerevan'
  // Atlantic
  | 'Atlantic/Azores'
  | 'Atlantic/Bermuda'
  | 'Atlantic/Canary'
  | 'Atlantic/Cape_Verde'
  | 'Atlantic/Faroe'
  | 'Atlantic/Madeira'
  | 'Atlantic/South_Georgia'
  | 'Atlantic/Stanley'
  // Australia
  | 'Australia/Adelaide'
  | 'Australia/Brisbane'
  | 'Australia/Broken_Hill'
  | 'Australia/Darwin'
  | 'Australia/Eucla'
  | 'Australia/Hobart'
  | 'Australia/Lindeman'
  | 'Australia/Lord_Howe'
  | 'Australia/Melbourne'
  | 'Australia/Perth'
  | 'Australia/Sydney'
  // Europe
  | 'Europe/Andorra'
  | 'Europe/Astrakhan'
  | 'Europe/Athens'
  | 'Europe/Belgrade'
  | 'Europe/Berlin'
  | 'Europe/Brussels'
  | 'Europe/Bucharest'
  | 'Europe/Budapest'
  | 'Europe/Chisinau'
  | 'Europe/Dublin'
  | 'Europe/Gibraltar'
  | 'Europe/Helsinki'
  | 'Europe/Istanbul'
  | 'Europe/Kaliningrad'
  | 'Europe/Kirov'
  | 'Europe/Kyiv'
  | 'Europe/Lisbon'
  | 'Europe/London'
  | 'Europe/Madrid'
  | 'Europe/Malta'
  | 'Europe/Minsk'
  | 'Europe/Moscow'
  | 'Europe/Paris'
  | 'Europe/Prague'
  | 'Europe/Riga'
  | 'Europe/Rome'
  | 'Europe/Samara'
  | 'Europe/Saratov'
  | 'Europe/Simferopol'
  | 'Europe/Sofia'
  | 'Europe/Tallinn'
  | 'Europe/Tirane'
  | 'Europe/Ulyanovsk'
  | 'Europe/Vienna'
  | 'Europe/Vilnius'
  | 'Europe/Volgograd'
  | 'Europe/Warsaw'
  | 'Europe/Zurich'
  // Indian
  | 'Indian/Chagos'
  | 'Indian/Maldives'
  | 'Indian/Mauritius'
  // Pacific
  | 'Pacific/Apia'
  | 'Pacific/Auckland'
  | 'Pacific/Bougainville'
  | 'Pacific/Chatham'
  | 'Pacific/Easter'
  | 'Pacific/Efate'
  | 'Pacific/Fakaofo'
  | 'Pacific/Fiji'
  | 'Pacific/Galapagos'
  | 'Pacific/Gambier'
  | 'Pacific/Guadalcanal'
  | 'Pacific/Guam'
  | 'Pacific/Honolulu'
  | 'Pacific/Kanton'
  | 'Pacific/Kiritimati'
  | 'Pacific/Kosrae'
  | 'Pacific/Kwajalein'
  | 'Pacific/Marquesas'
  | 'Pacific/Nauru'
  | 'Pacific/Niue'
  | 'Pacific/Norfolk'
  | 'Pacific/Noumea'
  | 'Pacific/Pago_Pago'
  | 'Pacific/Palau'
  | 'Pacific/Pitcairn'
  | 'Pacific/Port_Moresby'
  | 'Pacific/Rarotonga'
  | 'Pacific/Tahiti'
  | 'Pacific/Tarawa'
  | 'Pacific/Tongatapu'
  // Etc (fixed offsets)
  | 'Etc/GMT'
  | 'Etc/UTC'
  // Allow any string for edge cases
  | (string & {});

/**
 * Direct access to the native C++ module
 *
 * Use this when you need to bypass the JS wrapper optimizations and call native functions directly.
 * Most users should use the exported functions (parse, format, etc.) which are optimized for performance.
 *
 * @example
 * ```typescript
 * import { NativeDateModule } from '@bernagl/react-native-date';
 *
 * // Call native parse directly (crosses JS-to-native bridge)
 * const timestamp = NativeDateModule.parse('2024-12-25');
 *
 * // Call native format directly
 * const formatted = NativeDateModule.format(timestamp, 'yyyy-MM-dd');
 * ```
 */
export const NativeDateModule =
  NitroModules.createHybridObject<NativeDate>('NativeDate');

/**
 * Returns the current timestamp in milliseconds since Unix epoch (UTC)
 * Uses native C++ std::chrono::system_clock
 */
export function now(): number {
  return NativeDateModule.now();
}

/**
 * Parse an ISO 8601 date string into a timestamp
 *
 * Uses JS Date.parse() instead of native C++ because:
 * - Avoids bridge crossing overhead for simple ISO 8601 parsing
 * - JS engine's built-in parser is highly optimized for standard formats
 * - No performance benefit from native for this simple operation
 *
 * For custom format parsing (e.g., 'MM/dd/yyyy'), use `parseFormat()` which uses native C++.
 *
 * @see NativeDateModule.parse - Native C++ alternative (use directly if needed)
 * @see parseFormat - For custom format patterns (uses native C++)
 *
 * @throws Error if the date string is invalid
 */
export function parse(dateString: string): number {
  // Use native C++ parse for consistent local time handling
  // (JS Date.parse treats date-only strings as UTC, native treats them as local)
  return NativeDateModule.parse(dateString);
}

/**
 * Safely parse a date string, returning null if invalid
 *
 * Uses native C++ parse for consistent local time handling
 * (JS Date.parse treats date-only strings as UTC, native treats them as local)
 *
 * @see parseFormat - For custom format patterns (uses native C++)
 */
export function tryParse(dateString: string): number | null {
  // Basic format validation - must start with YYYY-MM-DD pattern
  if (!/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return null;
  }
  try {
    return NativeDateModule.parse(dateString);
  } catch {
    return null;
  }
}

/**
 * Parse a date string using a custom format pattern
 * Uses native C++ implementation for performance
 *
 * Supported tokens:
 * - yyyy: 4-digit year
 * - yy: 2-digit year (70-99 = 1970-1999, 00-69 = 2000-2069)
 * - MM: 2-digit month (01-12)
 * - M: 1-2 digit month
 * - dd: 2-digit day (01-31)
 * - d: 1-2 digit day
 * - HH: 2-digit hour 24h (00-23)
 * - H: 1-2 digit hour 24h
 * - hh: 2-digit hour 12h (01-12)
 * - h: 1-2 digit hour 12h
 * - mm: 2-digit minute (00-59)
 * - m: 1-2 digit minute
 * - ss: 2-digit second (00-59)
 * - s: 1-2 digit second
 * - SSS: 3-digit millisecond (000-999)
 * - a/A: AM/PM marker
 *
 * @example
 * ```typescript
 * parseFormat('12/25/2024', 'MM/dd/yyyy')  // → timestamp
 * parseFormat('25-12-2024', 'dd-MM-yyyy')  // → timestamp
 * parseFormat('2024.12.25 14:30', 'yyyy.MM.dd HH:mm')  // → timestamp
 * parseFormat('12/25/2024 02:30 PM', 'MM/dd/yyyy hh:mm A')  // → timestamp
 * ```
 *
 * @throws Error if the date string doesn't match the pattern
 */
export function parseFormat(dateString: string, pattern: string): number {
  return NativeDateModule.parseFormat(dateString, pattern);
}

/**
 * Safely parse a date string using a custom format pattern
 * Returns null if parsing fails
 *
 * @example
 * ```typescript
 * tryParseFormat('12/25/2024', 'MM/dd/yyyy')  // → timestamp
 * tryParseFormat('invalid', 'MM/dd/yyyy')    // → null
 * ```
 */
export function tryParseFormat(
  dateString: string,
  pattern: string
): number | null {
  const result = NativeDateModule.tryParseFormat(dateString, pattern);
  return isNaN(result) ? null : result;
}

/**
 * Create a timestamp from date components
 *
 * Uses JS Date.UTC() instead of native C++ because:
 * - Avoids bridge crossing overhead for simple timestamp creation
 * - Date.UTC() is a single optimized call with no parsing complexity
 * - Native alternative would require serializing/deserializing the components object
 *
 * @param components - Object with year, month, day, and optional time fields
 * @returns Timestamp in milliseconds (UTC)
 *
 * Note: month is 1-indexed (1-12), unlike JS Date which uses 0-indexed months
 *
 * @see NativeDateModule - Native module available for direct access if needed
 */
export function fromComponents(components: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}): number {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = components;

  // Use Date.UTC to create timestamp (month is 0-indexed in Date)
  return Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
}

export function format(date: DateInput, pattern: string): string {
  // Optimized: strings go directly to C++ (single bridge crossing)
  if (typeof date === 'string')
    return NativeDateModule.formatFromString(date, pattern);
  if (typeof date === 'number') return NativeDateModule.format(date, pattern);
  return NativeDateModule.format(date.getTime(), pattern);
}

export function formatUTC(date: DateInput, pattern: string): string {
  // Optimized: strings go directly to C++ (single bridge crossing)
  if (typeof date === 'string')
    return NativeDateModule.formatUTCFromString(date, pattern);
  if (typeof date === 'number')
    return NativeDateModule.formatUTC(date, pattern);
  return NativeDateModule.formatUTC(date.getTime(), pattern);
}

// Getters - optimized for single bridge crossing with strings
export function getComponents(date: DateInput): DateComponents {
  if (typeof date === 'string')
    return NativeDateModule.getComponentsFromString(date);
  if (typeof date === 'number') return NativeDateModule.getComponents(date);
  return NativeDateModule.getComponents(date.getTime());
}

export function getYear(date: DateInput): number {
  if (typeof date === 'string') return NativeDateModule.getYearFromString(date);
  if (typeof date === 'number') return NativeDateModule.getYear(date);
  return NativeDateModule.getYear(date.getTime());
}

export function getMonth(date: DateInput): number {
  if (typeof date === 'string')
    return NativeDateModule.getMonthFromString(date);
  if (typeof date === 'number') return NativeDateModule.getMonth(date);
  return NativeDateModule.getMonth(date.getTime());
}

export function getDate(date: DateInput): number {
  if (typeof date === 'string') return NativeDateModule.getDateFromString(date);
  if (typeof date === 'number') return NativeDateModule.getDate(date);
  return NativeDateModule.getDate(date.getTime());
}

export function getDay(date: DateInput): number {
  if (typeof date === 'string') return NativeDateModule.getDayFromString(date);
  if (typeof date === 'number') return NativeDateModule.getDay(date);
  return NativeDateModule.getDay(date.getTime());
}

export function getHours(date: DateInput): number {
  if (typeof date === 'string')
    return NativeDateModule.getHoursFromString(date);
  if (typeof date === 'number') return NativeDateModule.getHours(date);
  return NativeDateModule.getHours(date.getTime());
}

export function getMinutes(date: DateInput): number {
  if (typeof date === 'string')
    return NativeDateModule.getMinutesFromString(date);
  if (typeof date === 'number') return NativeDateModule.getMinutes(date);
  return NativeDateModule.getMinutes(date.getTime());
}

export function getSeconds(date: DateInput): number {
  if (typeof date === 'string')
    return NativeDateModule.getSecondsFromString(date);
  if (typeof date === 'number') return NativeDateModule.getSeconds(date);
  return NativeDateModule.getSeconds(date.getTime());
}

export function getMilliseconds(date: DateInput): number {
  if (typeof date === 'string')
    return NativeDateModule.getMillisecondsFromString(date);
  if (typeof date === 'number') return NativeDateModule.getMilliseconds(date);
  return NativeDateModule.getMilliseconds(date.getTime());
}

// Date info - use native C++ for performance
export function getDaysInMonth(date: DateInput): number {
  return NativeDateModule.getDaysInMonth(toTimestamp(date));
}

export function isLeapYear(date: DateInput): boolean {
  return NativeDateModule.isLeapYear(toTimestamp(date));
}

export function isWeekend(date: DateInput): boolean {
  return NativeDateModule.isWeekend(toTimestamp(date));
}

export function isValid(date: DateInput): boolean {
  return NativeDateModule.isValid(toTimestamp(date));
}

// Arithmetic
export function add(date: DateInput, amount: number, unit: TimeUnit): number {
  return NativeDateModule.add(toTimestamp(date), amount, unit);
}

export function subtract(
  date: DateInput,
  amount: number,
  unit: TimeUnit
): number {
  return NativeDateModule.subtract(toTimestamp(date), amount, unit);
}

// Comparisons - use native C++ for consistency
export function isBefore(date1: DateInput, date2: DateInput): boolean {
  return NativeDateModule.isBefore(toTimestamp(date1), toTimestamp(date2));
}

export function isAfter(date1: DateInput, date2: DateInput): boolean {
  return NativeDateModule.isAfter(toTimestamp(date1), toTimestamp(date2));
}

export function isSame(
  date1: DateInput,
  date2: DateInput,
  unit: TimeUnit
): boolean {
  return NativeDateModule.isSame(toTimestamp(date1), toTimestamp(date2), unit);
}

// Helpers
export function startOf(date: DateInput, unit: TimeUnit): number {
  return NativeDateModule.startOf(toTimestamp(date), unit);
}

export function endOf(date: DateInput, unit: TimeUnit): number {
  return NativeDateModule.endOf(toTimestamp(date), unit);
}

export function diff(
  date1: DateInput,
  date2: DateInput,
  unit: TimeUnit
): number {
  return NativeDateModule.diff(toTimestamp(date1), toTimestamp(date2), unit);
}

// Utility functions - use native C++ for consistency
export function clamp(
  date: DateInput,
  minVal: DateInput,
  maxVal: DateInput
): number {
  return NativeDateModule.clamp(
    toTimestamp(date),
    toTimestamp(minVal),
    toTimestamp(maxVal)
  );
}

export function min(timestamps: number[]): number {
  return NativeDateModule.min(timestamps);
}

export function max(timestamps: number[]): number {
  return NativeDateModule.max(timestamps);
}

// Relative time formatting

/**
 * Format the distance between two dates in human-readable format
 *
 * @param date - The date to compare
 * @param baseDate - The date to compare against (defaults to now)
 * @param addSuffix - Whether to add "ago" or "in" suffix
 * @returns Human-readable distance string like "2 hours ago" or "in 3 days"
 *
 * @example
 * ```typescript
 * formatDistance(Date.now() - 1000 * 60 * 60 * 2, Date.now(), true)  // "2 hours ago"
 * formatDistance(Date.now() + 1000 * 60 * 60 * 24, Date.now(), true) // "in 1 day"
 * formatDistance(Date.now() - 1000 * 60 * 5, Date.now(), false)      // "5 minutes"
 * ```
 */
export function formatDistance(
  date: DateInput,
  baseDate: DateInput = now(),
  addSuffix: boolean = true
): string {
  return NativeDateModule.formatDistance(
    toTimestamp(date),
    toTimestamp(baseDate),
    addSuffix
  );
}

/**
 * Format a duration in milliseconds to human-readable format
 *
 * @param milliseconds - Duration in milliseconds
 * @returns Duration string like "2d 5h 30m 15s"
 *
 * @example
 * ```typescript
 * formatDuration(1000 * 60 * 60 * 2)           // "2h 0m 0s"
 * formatDuration(1000 * 60 * 90 + 1000 * 30)   // "1h 30m 30s"
 * formatDuration(1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 5) // "2d 5h 0m 0s"
 * ```
 */
export function formatDuration(milliseconds: number): string {
  return NativeDateModule.formatDuration(milliseconds);
}

// Timezone
export function getTimezone(): Timezone {
  return NativeDateModule.getTimezone() as Timezone;
}

export function getTimezoneOffset(): number {
  return NativeDateModule.getTimezoneOffset();
}

export function getTimezoneOffsetForTimestamp(date: DateInput): number {
  return NativeDateModule.getTimezoneOffsetForTimestamp(toTimestamp(date));
}

export function getOffsetInTimezone(
  date: DateInput,
  timezone: Timezone
): number {
  return NativeDateModule.getOffsetInTimezone(toTimestamp(date), timezone);
}

export function toTimezone(date: DateInput, timezone: Timezone): number {
  return NativeDateModule.toTimezone(toTimestamp(date), timezone);
}

export function formatInTimezone(
  date: DateInput,
  pattern: string,
  timezone: Timezone
): string {
  return NativeDateModule.formatInTimezone(
    toTimestamp(date),
    pattern,
    timezone
  );
}

export function getAvailableTimezones(): Timezone[] {
  return NativeDateModule.getAvailableTimezones() as Timezone[];
}

export function isValidTimezone(timezone: Timezone): boolean {
  return NativeDateModule.isValidTimezone(timezone);
}

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
  return NativeDateModule.getLocale() as Locale;
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
  return NativeDateModule.setLocale(locale);
}

/**
 * Type for the object returned by getAvailableLocales().
 * Maps locale codes to themselves for easy access.
 */
export type AvailableLocalesMap = {
  [key: string]: Locale;
};

/**
 * Get all available locales for date formatting as an object.
 *
 * @returns An object mapping locale codes to themselves (e.g., `{ en: 'en', es: 'es', ... }`)
 *
 * @remarks
 * The available locales are determined by the device's operating system:
 * - **iOS**: Uses `NSLocale.availableLocaleIdentifiers`
 * - **Android**: Uses `Locale.getAvailableLocales()`
 *
 * Returns an object instead of an array for convenient access:
 * ```typescript
 * const locales = getAvailableLocales();
 * if (locales.es) setLocale(locales.es); // Type-safe!
 * ```
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
 * @see
 * - iOS: {@link https://developer.apple.com/documentation/foundation/nslocale NSLocale Documentation}
 * - Android: {@link https://developer.android.com/reference/java/util/Locale Java Locale Documentation}
 */
export function getAvailableLocales(): AvailableLocalesMap {
  const localesArray = NativeDateModule.getAvailableLocales();
  const localesMap: AvailableLocalesMap = {};
  for (const locale of localesArray) {
    localesMap[locale] = locale as Locale;
  }
  return localesMap;
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
  return NativeDateModule.getLocaleDisplayName(localeCode);
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
  return NativeDateModule.getLocaleInfo(localeCode);
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
  return NativeDateModule.getAvailableLocalesInfo();
}

// Async batch operations (run on background thread)

/**
 * Parse multiple date strings asynchronously on a background thread
 * Returns NaN for invalid dates instead of throwing
 */
export function parseManyAsync(dateStrings: string[]): Promise<number[]> {
  return NativeDateModule.parseManyAsync(dateStrings);
}

/**
 * Format multiple timestamps asynchronously on a background thread
 */
export function formatManyAsync(
  timestamps: number[],
  pattern: string
): Promise<string[]> {
  return NativeDateModule.formatManyAsync(timestamps, pattern);
}

/**
 * Get components for multiple timestamps asynchronously on a background thread
 */
export function getComponentsManyAsync(
  timestamps: number[]
): Promise<DateComponents[]> {
  return NativeDateModule.getComponentsManyAsync(timestamps);
}

// Convenience helpers (date-fns style)
export function startOfDay(date: DateInput): number {
  return startOf(date, 'day');
}

export function endOfDay(date: DateInput): number {
  return endOf(date, 'day');
}

export function startOfMonth(date: DateInput): number {
  return startOf(date, 'month');
}

export function endOfMonth(date: DateInput): number {
  return endOf(date, 'month');
}

export function startOfYear(date: DateInput): number {
  return startOf(date, 'year');
}

export function endOfYear(date: DateInput): number {
  return endOf(date, 'year');
}

export function addDays(date: DateInput, amount: number): number {
  return add(date, amount, 'day');
}

export function addMonths(date: DateInput, amount: number): number {
  return add(date, amount, 'month');
}

export function addYears(date: DateInput, amount: number): number {
  return add(date, amount, 'year');
}

export function subDays(date: DateInput, amount: number): number {
  return subtract(date, amount, 'day');
}

export function subMonths(date: DateInput, amount: number): number {
  return subtract(date, amount, 'month');
}

export function subYears(date: DateInput, amount: number): number {
  return subtract(date, amount, 'year');
}

export function diffInDays(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'day');
}

export function diffInMonths(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'month');
}

export function diffInYears(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'year');
}

// ISO format helper
export function toISOString(date: DateInput): string {
  return formatUTC(date, "yyyy-MM-dd'T'HH:mm:ss.SSS") + 'Z';
}

export function formatDate(date: DateInput): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDateTime(date: DateInput): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

// Timezone convenience helpers
export function formatDateInTimezone(
  date: DateInput,
  timezone: Timezone
): string {
  return formatInTimezone(date, 'yyyy-MM-dd', timezone);
}

export function formatDateTimeInTimezone(
  date: DateInput,
  timezone: Timezone
): string {
  return formatInTimezone(date, 'yyyy-MM-dd HH:mm:ss', timezone);
}

export function toUTC(date: DateInput): number {
  return toTimezone(date, 'UTC');
}

export function formatInUTC(date: DateInput, pattern: string): string {
  return formatInTimezone(date, pattern, 'UTC');
}

// Additional date-fns-like predicates
// These use getComponents() for fast local time comparison (native C++ call)
export function isToday(date: DateInput): boolean {
  const d = getComponents(date);
  const n = getComponents(now());
  return d.year === n.year && d.month === n.month && d.day === n.day;
}

export function isTomorrow(date: DateInput): boolean {
  const d = getComponents(date);
  const tomorrow = getComponents(addDays(now(), 1));
  return (
    d.year === tomorrow.year &&
    d.month === tomorrow.month &&
    d.day === tomorrow.day
  );
}

export function isYesterday(date: DateInput): boolean {
  const d = getComponents(date);
  const yesterday = getComponents(subDays(now(), 1));
  return (
    d.year === yesterday.year &&
    d.month === yesterday.month &&
    d.day === yesterday.day
  );
}

export function isPast(date: DateInput): boolean {
  return isBefore(date, now());
}

export function isFuture(date: DateInput): boolean {
  return isAfter(date, now());
}

// These use getComponents() for fast local time comparison (native C++ call)
export function isSameDay(date1: DateInput, date2: DateInput): boolean {
  const d1 = getComponents(date1);
  const d2 = getComponents(date2);
  return d1.year === d2.year && d1.month === d2.month && d1.day === d2.day;
}

export function isSameMonth(date1: DateInput, date2: DateInput): boolean {
  const d1 = getComponents(date1);
  const d2 = getComponents(date2);
  return d1.year === d2.year && d1.month === d2.month;
}

export function isSameYear(date1: DateInput, date2: DateInput): boolean {
  const d1 = getComponents(date1);
  const d2 = getComponents(date2);
  return d1.year === d2.year;
}

// Timezone-aware predicates (InTz) - Native implementations
export function isTodayInTz(date: DateInput, timezone: Timezone): boolean {
  return NativeDateModule.isTodayInTz(toTimestamp(date), timezone);
}

export function isTomorrowInTz(date: DateInput, timezone: Timezone): boolean {
  return NativeDateModule.isTomorrowInTz(toTimestamp(date), timezone);
}

export function isYesterdayInTz(date: DateInput, timezone: Timezone): boolean {
  return NativeDateModule.isYesterdayInTz(toTimestamp(date), timezone);
}

export function isSameDayInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  return NativeDateModule.isSameDayInTz(
    toTimestamp(date1),
    toTimestamp(date2),
    timezone
  );
}

export function isSameMonthInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  return NativeDateModule.isSameMonthInTz(
    toTimestamp(date1),
    toTimestamp(date2),
    timezone
  );
}

export function isSameYearInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  return NativeDateModule.isSameYearInTz(
    toTimestamp(date1),
    toTimestamp(date2),
    timezone
  );
}

export function startOfDayInTz(date: DateInput, timezone: Timezone): number {
  return NativeDateModule.startOfDayInTz(toTimestamp(date), timezone);
}

export function endOfDayInTz(date: DateInput, timezone: Timezone): number {
  return NativeDateModule.endOfDayInTz(toTimestamp(date), timezone);
}

// Week helpers
export function startOfWeek(date: DateInput): number {
  return startOf(date, 'week');
}

export function endOfWeek(date: DateInput): number {
  return endOf(date, 'week');
}

export function addWeeks(date: DateInput, amount: number): number {
  return add(date, amount, 'week');
}

export function subWeeks(date: DateInput, amount: number): number {
  return subtract(date, amount, 'week');
}

export function diffInWeeks(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'week');
}

// Hour/minute/second helpers
export function addHours(date: DateInput, amount: number): number {
  return add(date, amount, 'hour');
}

export function addMinutes(date: DateInput, amount: number): number {
  return add(date, amount, 'minute');
}

export function addSeconds(date: DateInput, amount: number): number {
  return add(date, amount, 'second');
}

export function subHours(date: DateInput, amount: number): number {
  return subtract(date, amount, 'hour');
}

export function subMinutes(date: DateInput, amount: number): number {
  return subtract(date, amount, 'minute');
}

export function subSeconds(date: DateInput, amount: number): number {
  return subtract(date, amount, 'second');
}

export function diffInHours(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'hour');
}

export function diffInMinutes(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'minute');
}

export function diffInSeconds(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'second');
}

// Helper: create timestamp from local time components (unlike fromComponents which uses UTC)
function fromComponentsLocal(components: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}): number {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = components;
  // Use new Date() constructor which interprets as local time (month is 0-indexed)
  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond
  ).getTime();
}

// Setters (immutable - return new timestamp)
// These use local time: getComponents returns local, setters preserve local time
export function setYear(date: DateInput, year: number): number {
  const c = getComponents(date);
  // Handle Feb 29 -> non-leap year
  let day = c.day;
  if (c.month === 2 && c.day === 29) {
    const targetYear = fromComponentsLocal({ ...c, year, day: 1 });
    if (!isLeapYear(targetYear)) {
      day = 28;
    }
  }
  return fromComponentsLocal({ ...c, year, day });
}

export function setMonth(date: DateInput, month: number): number {
  const c = getComponents(date);
  const tempDate = fromComponentsLocal({ ...c, month, day: 1 });
  const maxDay = getDaysInMonth(tempDate);
  const day = Math.min(c.day, maxDay);
  return fromComponentsLocal({ ...c, month, day });
}

export function setDate(date: DateInput, day: number): number {
  const c = getComponents(date);
  return fromComponentsLocal({ ...c, day });
}

export function setHours(date: DateInput, hours: number): number {
  const c = getComponents(date);
  return fromComponentsLocal({ ...c, hour: hours });
}

export function setMinutes(date: DateInput, minutes: number): number {
  const c = getComponents(date);
  return fromComponentsLocal({ ...c, minute: minutes });
}

export function setSeconds(date: DateInput, seconds: number): number {
  const c = getComponents(date);
  return fromComponentsLocal({ ...c, second: seconds });
}

export function setMilliseconds(date: DateInput, milliseconds: number): number {
  const c = getComponents(date);
  return fromComponentsLocal({ ...c, millisecond: milliseconds });
}

// =============================================================================
// CHAINABLE API (re-exported from chain.tsx for backwards compatibility)
// =============================================================================
// For better tree-shaking, import directly from '@bernagl/react-native-date/chain'

export { NativeDateChain, nativeDate } from './chain';
