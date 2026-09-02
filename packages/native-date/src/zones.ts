import { toTimestamp, toTimestampOrNull } from './input';
import { getNative } from './native';
import type { Timezone } from './timezone';
import type { DateInput } from './types';

// Time zone functions. Offsets are expressed in minutes EAST of UTC
// (Tokyo = +540, New York in winter = -300), which is the opposite sign of
// `Date.prototype.getTimezoneOffset()`. Invalid zone names throw; invalid dates
// throw in value-returning functions and yield `false` in predicates.

/**
 * The device's current IANA time zone identifier (e.g. `'America/New_York'`).
 */
export function getTimezone(): Timezone {
  return getNative().getTimezone() as Timezone;
}

/**
 * The device's current UTC offset in minutes, **east-positive**
 * (`+540` for Tokyo, `-300` for New York in winter, `+60` for Paris in winter).
 *
 * Note the sign: `Date.prototype.getTimezoneOffset()` returns the opposite
 * (`-540` for Tokyo).
 *
 * @see getTimezoneOffsetForTimestamp - Offset at a specific instant (DST-aware)
 */
export function getTimezoneOffset(): number {
  return getNative().getTimezoneOffset();
}

/**
 * The device time zone's UTC offset in minutes at the given instant,
 * **east-positive** (accounts for DST at that date).
 *
 * @throws Error if `date` is not a valid date
 * @see getTimezoneOffset - Sign convention
 */
export function getTimezoneOffsetForTimestamp(date: DateInput): number {
  return getNative().getTimezoneOffsetForTimestamp(toTimestamp(date));
}

/**
 * UTC offset of `timezone` in minutes at the given instant, **east-positive**
 * (`getOffsetInTimezone(ts, 'Asia/Tokyo')` is `540`).
 *
 * @throws Error if `date` is not a valid date or `timezone` is not recognized
 * @see getTimezoneOffset - Sign convention
 */
export function getOffsetInTimezone(
  date: DateInput,
  timezone: Timezone
): number {
  return getNative().getOffsetInTimezone(toTimestamp(date), timezone);
}

/**
 * Shift an instant by the offset of `timezone`, producing a **display epoch**:
 * a timestamp whose UTC fields equal the wall-clock time in `timezone`.
 *
 * The result is NOT the same instant. It is only meaningful when read with the
 * UTC helpers (`formatUTC`, `getComponents`-style UTC reads). Feeding it back
 * into local-time functions (`format`, `isToday`, `addDays`, ...) applies the
 * device zone a second time. Prefer {@link formatInTimezone} for display.
 *
 * @returns `date + offset(timezone)` in milliseconds; unchanged for `'UTC'`
 * @throws Error if `date` is not a valid date or `timezone` is not recognized
 *
 * @example
 * ```typescript
 * const ts = parse('2024-06-15T12:00:00Z');
 * formatUTC(toTimezone(ts, 'Asia/Tokyo'), 'HH:mm'); // "21:00"
 * // Equivalent and clearer:
 * formatInTimezone(ts, 'HH:mm', 'Asia/Tokyo');      // "21:00"
 * ```
 */
export function toTimezone(date: DateInput, timezone: Timezone): number {
  return getNative().toTimezone(toTimestamp(date), timezone);
}

/**
 * Format an instant as wall-clock time in `timezone`. Same tokens as
 * {@link format}.
 *
 * @throws Error if `date` is not a valid date or `timezone` is not recognized
 *
 * @example
 * ```typescript
 * formatInTimezone(ts, 'yyyy-MM-dd HH:mm', 'Europe/Paris');
 * ```
 */
export function formatInTimezone(
  date: DateInput,
  pattern: string,
  timezone: Timezone
): string {
  return getNative().formatInTimezone(toTimestamp(date), pattern, timezone);
}

/**
 * All IANA time zone identifiers known to the device.
 */
export function getAvailableTimezones(): Timezone[] {
  return getNative().getAvailableTimezones() as Timezone[];
}

// Timezone convenience helpers

/**
 * Format an instant as `yyyy-MM-dd` in `timezone`.
 * @throws Error if `date` is not a valid date or `timezone` is not recognized
 */
export function formatDateInTimezone(
  date: DateInput,
  timezone: Timezone
): string {
  return formatInTimezone(date, 'yyyy-MM-dd', timezone);
}

/**
 * Format an instant as `yyyy-MM-dd HH:mm:ss` in `timezone`.
 * @throws Error if `date` is not a valid date or `timezone` is not recognized
 */
export function formatDateTimeInTimezone(
  date: DateInput,
  timezone: Timezone
): string {
  return formatInTimezone(date, 'yyyy-MM-dd HH:mm:ss', timezone);
}

/**
 * Identity: returns `date` as a timestamp.
 *
 * A Unix timestamp is already an absolute (UTC) instant, so there is nothing to
 * convert. Use {@link formatUTC} to display an instant in UTC.
 *
 * @deprecated A timestamp is already a UTC instant: drop the call, or use
 * `formatUTC()` for display. This identity function will be removed in the next
 * major version.
 * @throws Error if `date` is not a valid date
 */
export function toUTC(date: DateInput): number {
  return toTimezone(date, 'UTC');
}

/**
 * Format an instant as wall-clock time in UTC. Equivalent to {@link formatUTC}.
 * @throws Error if `date` is not a valid date
 */
export function formatInUTC(date: DateInput, pattern: string): string {
  return formatInTimezone(date, pattern, 'UTC');
}

// Timezone-aware predicates (InTz) - Native implementations.
// Invalid dates yield `false`; an invalid timezone name still throws (native).

/**
 * Whether `date` falls on today's calendar day in `timezone`.
 * Returns `false` for an invalid date.
 * @throws Error if `timezone` is not recognized
 */
export function isTodayInTz(date: DateInput, timezone: Timezone): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isTodayInTz(timestamp, timezone);
}

/**
 * Whether `date` falls on tomorrow's calendar day in `timezone`.
 * Returns `false` for an invalid date.
 * @throws Error if `timezone` is not recognized
 */
export function isTomorrowInTz(date: DateInput, timezone: Timezone): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isTomorrowInTz(timestamp, timezone);
}

/**
 * Whether `date` falls on yesterday's calendar day in `timezone`.
 * Returns `false` for an invalid date.
 * @throws Error if `timezone` is not recognized
 */
export function isYesterdayInTz(date: DateInput, timezone: Timezone): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isYesterdayInTz(timestamp, timezone);
}

/**
 * Whether both instants fall on the same calendar day in `timezone`.
 * Returns `false` if either date is invalid.
 * @throws Error if `timezone` is not recognized
 */
export function isSameDayInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return (
    t1 !== null && t2 !== null && getNative().isSameDayInTz(t1, t2, timezone)
  );
}

/**
 * Whether both instants fall in the same calendar month in `timezone`.
 * Returns `false` if either date is invalid.
 * @throws Error if `timezone` is not recognized
 */
export function isSameMonthInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return (
    t1 !== null && t2 !== null && getNative().isSameMonthInTz(t1, t2, timezone)
  );
}

/**
 * Whether both instants fall in the same calendar year in `timezone`.
 * Returns `false` if either date is invalid.
 * @throws Error if `timezone` is not recognized
 */
export function isSameYearInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return (
    t1 !== null && t2 !== null && getNative().isSameYearInTz(t1, t2, timezone)
  );
}

/**
 * The instant at which the calendar day containing `date` starts in `timezone`
 * (midnight in that zone), as a real timestamp.
 *
 * @throws Error if `date` is not a valid date or `timezone` is not recognized
 */
export function startOfDayInTz(date: DateInput, timezone: Timezone): number {
  return getNative().startOfDayInTz(toTimestamp(date), timezone);
}

/**
 * The last millisecond of the calendar day containing `date` in `timezone`,
 * as a real timestamp.
 *
 * @throws Error if `date` is not a valid date or `timezone` is not recognized
 */
export function endOfDayInTz(date: DateInput, timezone: Timezone): number {
  return getNative().endOfDayInTz(toTimestamp(date), timezone);
}
