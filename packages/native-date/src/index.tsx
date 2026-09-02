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
 * Convert any DateInput to a finite timestamp (milliseconds), or `null` when the
 * input is invalid. Never throws.
 *
 * Strings go through the same native ISO 8601 parser as `parse()` so that
 * date-only strings mean local midnight everywhere in the API. Numbers and
 * `Date` objects are accepted only when they are finite.
 */
function toTimestampOrNull(date: DateInput): number | null {
  let timestamp: number;
  if (typeof date === 'number') {
    timestamp = date;
  } else if (typeof date === 'string') {
    try {
      timestamp = NativeDateModule.parse(date);
    } catch {
      return null;
    }
  } else {
    timestamp = date.getTime();
  }
  return Number.isFinite(timestamp) ? timestamp : null;
}

/**
 * Convert any DateInput to a finite timestamp (milliseconds).
 *
 * Strings go through the same native ISO 8601 parser as `parse()` (date-only
 * strings are local midnight). Non-finite numbers, invalid `Date` objects and
 * unparseable strings throw, so no NaN ever reaches native code.
 *
 * @throws Error if the input is not a valid date
 */
function toTimestamp(date: DateInput): number {
  // typeof is ~10-20x faster than property lookup
  let timestamp: number;
  if (typeof date === 'number') {
    timestamp = date;
  } else if (typeof date === 'string') {
    timestamp = NativeDateModule.parse(date);
  } else {
    timestamp = date.getTime();
  }
  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid date input: ${String(date)}`);
  }
  return timestamp;
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
 * Parse an ISO 8601 date string into a timestamp (milliseconds since the Unix epoch).
 *
 * Parsing runs in native C++ (not `Date.parse()`), which gives the same result on
 * every platform and JS engine:
 * - `'2024-12-25'` (date-only) is **local midnight**, unlike `Date.parse()` which
 *   treats it as UTC midnight.
 * - `'2024-12-25T10:30:00'` (no offset) is local time.
 * - `'2024-12-25T10:30:00Z'` / `'2024-12-25T10:30:00+02:00'` are absolute instants.
 *
 * Every function that accepts a `DateInput` string uses this same parser, so
 * `startOfDay('2024-12-25')` equals `startOfDay(parse('2024-12-25'))`.
 *
 * For custom format parsing (e.g., 'MM/dd/yyyy'), use `parseFormat()`.
 *
 * @throws Error if the string is not a valid ISO 8601 date. Use `tryParse()` to
 * get `null` instead of an exception.
 *
 * @see tryParse - Non-throwing variant
 * @see parseFormat - For custom format patterns
 */
export function parse(dateString: string): number {
  return NativeDateModule.parse(dateString);
}

/**
 * Safely parse an ISO 8601 date string, returning `null` if it is invalid.
 *
 * Same parser and local-time semantics as `parse()`; the only difference is the
 * error policy: invalid input yields `null` instead of an exception.
 *
 * @see parse - Throwing variant
 * @see tryParseFormat - For custom format patterns
 */
export function tryParse(dateString: string): number | null {
  try {
    const timestamp = NativeDateModule.parse(dateString);
    return Number.isFinite(timestamp) ? timestamp : null;
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
  return Number.isFinite(result) ? result : null;
}

/**
 * `Date.UTC()` and `new Date(y, m, d)` map years 0-99 to 1900-1999. The
 * component constructors below take the year literally, so `{ year: 99 }` is
 * year 99, not 1999.
 */
const MAX_TWO_DIGIT_YEAR = 99;

/**
 * Create a timestamp from date components interpreted as UTC.
 *
 * Uses JS Date.UTC() instead of native C++ because:
 * - Avoids bridge crossing overhead for simple timestamp creation
 * - Date.UTC() is a single optimized call with no parsing complexity
 * - Native alternative would require serializing/deserializing the components object
 *
 * The year is taken literally: `{ year: 99 }` is the year 99, not 1999.
 *
 * @param components - Object with year, month, day, and optional time fields
 * @returns Timestamp in milliseconds (UTC)
 *
 * Note: month is 1-indexed (1-12), unlike JS Date which uses 0-indexed months
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
  const date = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  );
  if (year >= 0 && year <= MAX_TWO_DIGIT_YEAR) {
    date.setUTCFullYear(year, month - 1, day);
  }
  return date.getTime();
}

export function format(date: DateInput, pattern: string): string {
  // Optimized: strings go directly to C++ (single bridge crossing)
  if (typeof date === 'string')
    return NativeDateModule.formatFromString(date, pattern);
  return NativeDateModule.format(toTimestamp(date), pattern);
}

export function formatUTC(date: DateInput, pattern: string): string {
  // Optimized: strings go directly to C++ (single bridge crossing)
  if (typeof date === 'string')
    return NativeDateModule.formatUTCFromString(date, pattern);
  return NativeDateModule.formatUTC(toTimestamp(date), pattern);
}

// Getters - optimized for single bridge crossing with strings
export function getComponents(date: DateInput): DateComponents {
  if (typeof date === 'string')
    return NativeDateModule.getComponentsFromString(date);
  return NativeDateModule.getComponents(toTimestamp(date));
}

export function getYear(date: DateInput): number {
  if (typeof date === 'string') return NativeDateModule.getYearFromString(date);
  return NativeDateModule.getYear(toTimestamp(date));
}

export function getMonth(date: DateInput): number {
  if (typeof date === 'string')
    return NativeDateModule.getMonthFromString(date);
  return NativeDateModule.getMonth(toTimestamp(date));
}

export function getDate(date: DateInput): number {
  if (typeof date === 'string') return NativeDateModule.getDateFromString(date);
  return NativeDateModule.getDate(toTimestamp(date));
}

export function getDay(date: DateInput): number {
  if (typeof date === 'string') return NativeDateModule.getDayFromString(date);
  return NativeDateModule.getDay(toTimestamp(date));
}

export function getHours(date: DateInput): number {
  if (typeof date === 'string')
    return NativeDateModule.getHoursFromString(date);
  return NativeDateModule.getHours(toTimestamp(date));
}

export function getMinutes(date: DateInput): number {
  if (typeof date === 'string')
    return NativeDateModule.getMinutesFromString(date);
  return NativeDateModule.getMinutes(toTimestamp(date));
}

export function getSeconds(date: DateInput): number {
  if (typeof date === 'string')
    return NativeDateModule.getSecondsFromString(date);
  return NativeDateModule.getSeconds(toTimestamp(date));
}

export function getMilliseconds(date: DateInput): number {
  if (typeof date === 'string')
    return NativeDateModule.getMillisecondsFromString(date);
  return NativeDateModule.getMilliseconds(toTimestamp(date));
}

// Date info - use native C++ for performance
export function getDaysInMonth(date: DateInput): number {
  return NativeDateModule.getDaysInMonth(toTimestamp(date));
}

// Predicates never throw: invalid input is simply `false`.
export function isLeapYear(date: DateInput): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && NativeDateModule.isLeapYear(timestamp);
}

export function isWeekend(date: DateInput): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && NativeDateModule.isWeekend(timestamp);
}

export function isValid(date: DateInput): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && NativeDateModule.isValid(timestamp);
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

// Comparisons - use native C++ for consistency; invalid input yields `false`
export function isBefore(date1: DateInput, date2: DateInput): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return t1 !== null && t2 !== null && NativeDateModule.isBefore(t1, t2);
}

export function isAfter(date1: DateInput, date2: DateInput): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return t1 !== null && t2 !== null && NativeDateModule.isAfter(t1, t2);
}

export function isSame(
  date1: DateInput,
  date2: DateInput,
  unit: TimeUnit
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return t1 !== null && t2 !== null && NativeDateModule.isSame(t1, t2, unit);
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

/**
 * Return the earliest of the given dates as a timestamp.
 *
 * @throws Error if `dates` is empty or contains an invalid date
 */
export function min(dates: DateInput[]): number {
  if (dates.length === 0) {
    throw new Error('min() requires a non-empty array of dates');
  }
  return NativeDateModule.min(dates.map(toTimestamp));
}

/**
 * Return the latest of the given dates as a timestamp.
 *
 * @throws Error if `dates` is empty or contains an invalid date
 */
export function max(dates: DateInput[]): number {
  if (dates.length === 0) {
    throw new Error('max() requires a non-empty array of dates');
  }
  return NativeDateModule.max(dates.map(toTimestamp));
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
// These use getComponents() for fast local time comparison (native C++ call).
// Predicates never throw: invalid input is simply `false`.

/**
 * Local components of a DateInput, or `null` when the input is invalid.
 * Strings keep the single-crossing `getComponentsFromString` path.
 */
function componentsOrNull(date: DateInput): DateComponents | null {
  if (typeof date === 'string') {
    try {
      return NativeDateModule.getComponentsFromString(date);
    } catch {
      return null;
    }
  }
  const timestamp = typeof date === 'number' ? date : date.getTime();
  return Number.isFinite(timestamp)
    ? NativeDateModule.getComponents(timestamp)
    : null;
}

function isSameLocalDay(d: DateComponents, o: DateComponents): boolean {
  return d.year === o.year && d.month === o.month && d.day === o.day;
}

export function isToday(date: DateInput): boolean {
  const d = componentsOrNull(date);
  return d !== null && isSameLocalDay(d, NativeDateModule.getComponents(now()));
}

export function isTomorrow(date: DateInput): boolean {
  const d = componentsOrNull(date);
  return (
    d !== null &&
    isSameLocalDay(d, NativeDateModule.getComponents(addDays(now(), 1)))
  );
}

export function isYesterday(date: DateInput): boolean {
  const d = componentsOrNull(date);
  return (
    d !== null &&
    isSameLocalDay(d, NativeDateModule.getComponents(subDays(now(), 1)))
  );
}

export function isPast(date: DateInput): boolean {
  return isBefore(date, now());
}

export function isFuture(date: DateInput): boolean {
  return isAfter(date, now());
}

export function isSameDay(date1: DateInput, date2: DateInput): boolean {
  const d1 = componentsOrNull(date1);
  const d2 = componentsOrNull(date2);
  return d1 !== null && d2 !== null && isSameLocalDay(d1, d2);
}

export function isSameMonth(date1: DateInput, date2: DateInput): boolean {
  const d1 = componentsOrNull(date1);
  const d2 = componentsOrNull(date2);
  return (
    d1 !== null && d2 !== null && d1.year === d2.year && d1.month === d2.month
  );
}

export function isSameYear(date1: DateInput, date2: DateInput): boolean {
  const d1 = componentsOrNull(date1);
  const d2 = componentsOrNull(date2);
  return d1 !== null && d2 !== null && d1.year === d2.year;
}

// Timezone-aware predicates (InTz) - Native implementations.
// Invalid dates yield `false`; an invalid timezone name still throws (native).
export function isTodayInTz(date: DateInput, timezone: Timezone): boolean {
  const timestamp = toTimestampOrNull(date);
  return (
    timestamp !== null && NativeDateModule.isTodayInTz(timestamp, timezone)
  );
}

export function isTomorrowInTz(date: DateInput, timezone: Timezone): boolean {
  const timestamp = toTimestampOrNull(date);
  return (
    timestamp !== null && NativeDateModule.isTomorrowInTz(timestamp, timezone)
  );
}

export function isYesterdayInTz(date: DateInput, timezone: Timezone): boolean {
  const timestamp = toTimestampOrNull(date);
  return (
    timestamp !== null && NativeDateModule.isYesterdayInTz(timestamp, timezone)
  );
}

export function isSameDayInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return (
    t1 !== null &&
    t2 !== null &&
    NativeDateModule.isSameDayInTz(t1, t2, timezone)
  );
}

export function isSameMonthInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return (
    t1 !== null &&
    t2 !== null &&
    NativeDateModule.isSameMonthInTz(t1, t2, timezone)
  );
}

export function isSameYearInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return (
    t1 !== null &&
    t2 !== null &&
    NativeDateModule.isSameYearInTz(t1, t2, timezone)
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
  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond
  );
  if (year >= 0 && year <= MAX_TWO_DIGIT_YEAR) {
    // The constructor maps 0-99 to 1900-1999; setFullYear takes the year literally
    date.setFullYear(year, month - 1, day);
  }
  return date.getTime();
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
