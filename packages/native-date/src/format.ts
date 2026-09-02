import { toTimestamp } from './input';
import { getNative } from './native';
import { now } from './now';
import type { DateInput } from './types';

/**
 * Format a date in the device's local time zone using a pattern.
 *
 * Supported tokens include `yyyy`, `MM`, `MMM`, `MMMM`, `dd`, `d`, `ddd`, `dddd`,
 * `HH`, `hh`, `mm`, `ss`, `SSS`, `A`/`a`; literal text goes in single quotes or
 * square brackets (`"yyyy-MM-dd'T'HH:mm"`). Month and day names follow the
 * locale set with {@link setLocale}.
 *
 * @param date - Timestamp (ms), ISO 8601 string or `Date`
 * @param pattern - Format pattern
 * @returns The formatted string
 * @throws Error if `date` is not a valid date
 *
 * @example
 * ```typescript
 * format(parse('2024-12-25T10:30:00'), 'yyyy-MM-dd HH:mm'); // "2024-12-25 10:30"
 * format('2024-12-25', 'MMMM d, yyyy');                    // "December 25, 2024"
 * ```
 *
 * @see formatUTC - Same, in UTC
 * @see formatInTimezone - Same, in a named time zone
 */
export function format(date: DateInput, pattern: string): string {
  // Optimized: strings go directly to C++ (single bridge crossing)
  if (typeof date === 'string')
    return getNative().formatFromString(date, pattern);
  return getNative().format(toTimestamp(date), pattern);
}

/**
 * Format a date in UTC using a pattern. Same tokens as {@link format}.
 *
 * @throws Error if `date` is not a valid date
 * @see format - Local-time variant
 */
export function formatUTC(date: DateInput, pattern: string): string {
  // Optimized: strings go directly to C++ (single bridge crossing)
  if (typeof date === 'string')
    return getNative().formatUTCFromString(date, pattern);
  return getNative().formatUTC(toTimestamp(date), pattern);
}

/**
 * Options for {@link formatDistance}.
 */
export type FormatDistanceOptions = {
  /**
   * The date to compare against.
   * @default now()
   */
  base?: DateInput;
  /**
   * Whether to add an "ago" / "in" suffix.
   * @default true
   */
  addSuffix?: boolean;
};

/**
 * Format the distance between two dates in a human-readable way
 * ("2 hours ago", "in 3 days", "about 1 month").
 *
 * Two call shapes are supported: an options object (preferred) or the legacy
 * positional form `formatDistance(date, baseDate?, addSuffix?)`.
 *
 * @param date - The date to describe
 * @param options - `base` (defaults to now) and `addSuffix` (defaults to `true`)
 * @returns Human-readable distance string
 * @throws Error if `date` or `base` is not a valid date
 *
 * @example
 * ```typescript
 * formatDistance(subHours(now(), 2));                          // "about 2 hours ago"
 * formatDistance(addDays(now(), 1), { addSuffix: false });     // "1 day"
 * formatDistance(ts, { base: otherTs, addSuffix: true });      // "in 3 days"
 * formatDistance(ts, otherTs, false);                           // positional form
 * ```
 */
export function formatDistance(
  date: DateInput,
  options?: FormatDistanceOptions
): string;
export function formatDistance(
  date: DateInput,
  baseDate?: DateInput,
  addSuffix?: boolean
): string;
export function formatDistance(
  date: DateInput,
  baseOrOptions?: DateInput | FormatDistanceOptions,
  addSuffix: boolean = true
): string {
  let base: DateInput | undefined;
  let suffix = addSuffix;
  if (isFormatDistanceOptions(baseOrOptions)) {
    base = baseOrOptions.base;
    if (baseOrOptions.addSuffix !== undefined) suffix = baseOrOptions.addSuffix;
  } else {
    base = baseOrOptions;
  }
  return getNative().formatDistance(
    toTimestamp(date),
    base === undefined ? now() : toTimestamp(base),
    suffix
  );
}

function isFormatDistanceOptions(
  value: DateInput | FormatDistanceOptions | undefined
): value is FormatDistanceOptions {
  return (
    typeof value === 'object' && value !== null && !(value instanceof Date)
  );
}

/**
 * Format a duration in milliseconds as "2d 5h 30m 15s".
 *
 * Negative durations are formatted by their absolute value.
 *
 * @param milliseconds - Duration in milliseconds
 * @returns Duration string like "2d 5h 30m 15s"
 *
 * @example
 * ```typescript
 * formatDuration(1000 * 60 * 60 * 2);           // "2h 0m 0s"
 * formatDuration(1000 * 60 * 90 + 1000 * 30);   // "1h 30m 30s"
 * ```
 */
export function formatDuration(milliseconds: number): string {
  return getNative().formatDuration(milliseconds);
}

/**
 * Format a date as an ISO 8601 UTC string with millisecond precision
 * (`2024-12-25T10:30:00.000Z`), like `Date.prototype.toISOString()`.
 *
 * @throws Error if `date` is not a valid date
 */
export function toISOString(date: DateInput): string {
  return formatUTC(date, "yyyy-MM-dd'T'HH:mm:ss.SSS") + 'Z';
}

/**
 * Format a date as `yyyy-MM-dd` in local time.
 *
 * @throws Error if `date` is not a valid date
 */
export function formatDate(date: DateInput): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format a date as `yyyy-MM-dd HH:mm:ss` in local time.
 *
 * @throws Error if `date` is not a valid date
 */
export function formatDateTime(date: DateInput): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}
