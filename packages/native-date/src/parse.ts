import { getNative } from './native';

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
  return getNative().parse(dateString);
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
    const timestamp = getNative().parse(dateString);
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
  return getNative().parseFormat(dateString, pattern);
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
  const result = getNative().tryParseFormat(dateString, pattern);
  return Number.isFinite(result) ? result : null;
}
