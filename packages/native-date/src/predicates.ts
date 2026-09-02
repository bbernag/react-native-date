import type { DateComponents } from './NativeDate.nitro';
import { addDays, subDays } from './arithmetic';
import { isAfter, isBefore } from './compare';
import { componentsOrNull, toTimestampOrNull } from './input';
import { getNative } from './native';
import { now } from './now';
import type { DateInput } from './types';

// Predicates never throw: invalid input (NaN, an unparseable string, an invalid
// Date) is simply `false`.

/**
 * Whether the local calendar year of `date` is a leap year.
 * Returns `false` for invalid input.
 */
export function isLeapYear(date: DateInput): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isLeapYear(timestamp);
}

/**
 * Whether `date` falls on a Saturday or Sunday in local time.
 * Returns `false` for invalid input.
 */
export function isWeekend(date: DateInput): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isWeekend(timestamp);
}

/**
 * Whether `date` is a valid, finite date: a finite timestamp, a parseable ISO
 * 8601 string, or a `Date` whose time is not `NaN`.
 *
 * @example
 * ```typescript
 * isValid(parse('2024-06-15')); // true
 * isValid('2024-06-15');        // true
 * isValid('not a date');        // false
 * isValid(NaN);                 // false
 * ```
 */
export function isValid(date: DateInput): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isValid(timestamp);
}

// These use getComponents() for fast local time comparison (native C++ call).

function isSameLocalDay(d: DateComponents, o: DateComponents): boolean {
  return d.year === o.year && d.month === o.month && d.day === o.day;
}

/**
 * Whether `date` is on today's local calendar day.
 * Returns `false` for invalid input.
 * @see isTodayInTz - Same check in a named time zone
 */
export function isToday(date: DateInput): boolean {
  const d = componentsOrNull(date);
  return d !== null && isSameLocalDay(d, getNative().getComponents(now()));
}

/**
 * Whether `date` is on tomorrow's local calendar day.
 * Returns `false` for invalid input.
 */
export function isTomorrow(date: DateInput): boolean {
  const d = componentsOrNull(date);
  return (
    d !== null &&
    isSameLocalDay(d, getNative().getComponents(addDays(now(), 1)))
  );
}

/**
 * Whether `date` is on yesterday's local calendar day.
 * Returns `false` for invalid input.
 */
export function isYesterday(date: DateInput): boolean {
  const d = componentsOrNull(date);
  return (
    d !== null &&
    isSameLocalDay(d, getNative().getComponents(subDays(now(), 1)))
  );
}

/**
 * Whether `date` is strictly before {@link now}.
 * Returns `false` for invalid input.
 */
export function isPast(date: DateInput): boolean {
  return isBefore(date, now());
}

/**
 * Whether `date` is strictly after {@link now}.
 * Returns `false` for invalid input.
 */
export function isFuture(date: DateInput): boolean {
  return isAfter(date, now());
}

/**
 * Whether both dates fall on the same local calendar day.
 * Returns `false` if either input is invalid.
 * @see isSameDayInTz - Same check in a named time zone
 */
export function isSameDay(date1: DateInput, date2: DateInput): boolean {
  const d1 = componentsOrNull(date1);
  const d2 = componentsOrNull(date2);
  return d1 !== null && d2 !== null && isSameLocalDay(d1, d2);
}

/**
 * Whether both dates fall in the same local calendar month (and year).
 * Returns `false` if either input is invalid.
 */
export function isSameMonth(date1: DateInput, date2: DateInput): boolean {
  const d1 = componentsOrNull(date1);
  const d2 = componentsOrNull(date2);
  return (
    d1 !== null && d2 !== null && d1.year === d2.year && d1.month === d2.month
  );
}

/**
 * Whether both dates fall in the same local calendar year.
 * Returns `false` if either input is invalid.
 */
export function isSameYear(date1: DateInput, date2: DateInput): boolean {
  const d1 = componentsOrNull(date1);
  const d2 = componentsOrNull(date2);
  return d1 !== null && d2 !== null && d1.year === d2.year;
}
