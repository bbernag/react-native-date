import type { TimeUnit } from './NativeDate.nitro';
import { toTimestamp } from './input';
import { getNative } from './native';
import type { DateInput } from './types';

// Arithmetic throws on invalid input (see the error policy on `parse`).
// Month/year steps clamp to the last valid day (Jan 31 + 1 month = Feb 29/28);
// day/week steps are calendar math in local time (same wall clock across DST).

/**
 * Add `amount` units to `date`.
 *
 * - `'month'` / `'year'`: the day of month is clamped to the target month
 *   (Jan 31 + 1 month = Feb 29 or Feb 28).
 * - `'day'` / `'week'`: calendar math in local time, so the wall-clock time is
 *   preserved across DST transitions.
 * - Smaller units are exact elapsed time.
 *
 * @param date - Starting date
 * @param amount - Number of units to add (negative to subtract)
 * @param unit - Unit of `amount`
 * @returns The resulting timestamp
 * @throws Error if `date` is not a valid date
 *
 * @example
 * ```typescript
 * add('2024-01-31', 1, 'month'); // 2024-02-29 (clamped)
 * add(ts, 90, 'minute');
 * ```
 */
export function add(date: DateInput, amount: number, unit: TimeUnit): number {
  return getNative().add(toTimestamp(date), amount, unit);
}

/**
 * Subtract `amount` units from `date`. Same semantics as {@link add} with a
 * negated amount.
 *
 * @throws Error if `date` is not a valid date
 */
export function subtract(
  date: DateInput,
  amount: number,
  unit: TimeUnit
): number {
  return getNative().subtract(toTimestamp(date), amount, unit);
}

/**
 * Difference `date1 - date2` expressed in whole `unit`s, truncated toward zero.
 * Positive when `date1` is later than `date2`.
 *
 * `'day'` and `'week'` count local calendar days; `'month'` and `'year'` count
 * whole calendar months/years in local time.
 *
 * @throws Error if either date is not a valid date
 *
 * @example
 * ```typescript
 * diff('2024-12-25', '2024-12-01', 'day'); // 24
 * ```
 */
export function diff(
  date1: DateInput,
  date2: DateInput,
  unit: TimeUnit
): number {
  return getNative().diff(toTimestamp(date1), toTimestamp(date2), unit);
}

// Convenience helpers (date-fns style). All throw on invalid input.

/** `add(date, amount, 'day')`. Calendar days in local time. */
export function addDays(date: DateInput, amount: number): number {
  return add(date, amount, 'day');
}

/** `add(date, amount, 'month')`. Day of month is clamped. */
export function addMonths(date: DateInput, amount: number): number {
  return add(date, amount, 'month');
}

/** `add(date, amount, 'year')`. Feb 29 is clamped to Feb 28 in non-leap years. */
export function addYears(date: DateInput, amount: number): number {
  return add(date, amount, 'year');
}

/** `subtract(date, amount, 'day')`. Calendar days in local time. */
export function subDays(date: DateInput, amount: number): number {
  return subtract(date, amount, 'day');
}

/** `subtract(date, amount, 'month')`. Day of month is clamped. */
export function subMonths(date: DateInput, amount: number): number {
  return subtract(date, amount, 'month');
}

/** `subtract(date, amount, 'year')`. Feb 29 is clamped to Feb 28 in non-leap years. */
export function subYears(date: DateInput, amount: number): number {
  return subtract(date, amount, 'year');
}

/** `diff(date1, date2, 'day')`: whole local calendar days, `date1 - date2`. */
export function diffInDays(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'day');
}

/** `diff(date1, date2, 'month')`: whole calendar months, `date1 - date2`. */
export function diffInMonths(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'month');
}

/** `diff(date1, date2, 'year')`: whole calendar years, `date1 - date2`. */
export function diffInYears(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'year');
}

// Week helpers

/** `add(date, amount, 'week')`. Calendar weeks in local time. */
export function addWeeks(date: DateInput, amount: number): number {
  return add(date, amount, 'week');
}

/** `subtract(date, amount, 'week')`. Calendar weeks in local time. */
export function subWeeks(date: DateInput, amount: number): number {
  return subtract(date, amount, 'week');
}

/** `diff(date1, date2, 'week')`: whole weeks, `date1 - date2`. */
export function diffInWeeks(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'week');
}

// Hour/minute/second helpers (exact elapsed time)

/** `add(date, amount, 'hour')`. */
export function addHours(date: DateInput, amount: number): number {
  return add(date, amount, 'hour');
}

/** `add(date, amount, 'minute')`. */
export function addMinutes(date: DateInput, amount: number): number {
  return add(date, amount, 'minute');
}

/** `add(date, amount, 'second')`. */
export function addSeconds(date: DateInput, amount: number): number {
  return add(date, amount, 'second');
}

/** `subtract(date, amount, 'hour')`. */
export function subHours(date: DateInput, amount: number): number {
  return subtract(date, amount, 'hour');
}

/** `subtract(date, amount, 'minute')`. */
export function subMinutes(date: DateInput, amount: number): number {
  return subtract(date, amount, 'minute');
}

/** `subtract(date, amount, 'second')`. */
export function subSeconds(date: DateInput, amount: number): number {
  return subtract(date, amount, 'second');
}

/** `diff(date1, date2, 'hour')`: whole hours, `date1 - date2`. */
export function diffInHours(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'hour');
}

/** `diff(date1, date2, 'minute')`: whole minutes, `date1 - date2`. */
export function diffInMinutes(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'minute');
}

/** `diff(date1, date2, 'second')`: whole seconds, `date1 - date2`. */
export function diffInSeconds(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'second');
}
