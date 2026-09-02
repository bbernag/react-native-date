import type { TimeUnit } from './NativeDate.nitro';
import { toTimestamp } from './input';
import { getNative } from './native';
import type { DateInput } from './types';

// Boundaries are computed in the device's local time zone and throw on invalid
// input (see the error policy on `parse`).

/**
 * Start of the local-time `unit` that contains `date`
 * (e.g. `'day'` gives local midnight; `'week'` starts on Sunday).
 *
 * @returns Timestamp of the boundary
 * @throws Error if `date` is not a valid date
 * @see startOfDayInTz - Day boundary in a named time zone
 */
export function startOf(date: DateInput, unit: TimeUnit): number {
  return getNative().startOf(toTimestamp(date), unit);
}

/**
 * End of the local-time `unit` that contains `date` (last millisecond,
 * e.g. `23:59:59.999` for `'day'`).
 *
 * @returns Timestamp of the boundary
 * @throws Error if `date` is not a valid date
 */
export function endOf(date: DateInput, unit: TimeUnit): number {
  return getNative().endOf(toTimestamp(date), unit);
}

// Convenience helpers (date-fns style)

/** Local midnight of the day containing `date`. @throws Error on invalid input */
export function startOfDay(date: DateInput): number {
  return startOf(date, 'day');
}

/** Last millisecond of the local day containing `date`. @throws Error on invalid input */
export function endOfDay(date: DateInput): number {
  return endOf(date, 'day');
}

/** Local midnight on the first day of the month containing `date`. @throws Error on invalid input */
export function startOfMonth(date: DateInput): number {
  return startOf(date, 'month');
}

/** Last millisecond of the local month containing `date`. @throws Error on invalid input */
export function endOfMonth(date: DateInput): number {
  return endOf(date, 'month');
}

/** Local midnight on January 1st of the year containing `date`. @throws Error on invalid input */
export function startOfYear(date: DateInput): number {
  return startOf(date, 'year');
}

/** Last millisecond of the local year containing `date`. @throws Error on invalid input */
export function endOfYear(date: DateInput): number {
  return endOf(date, 'year');
}

// Week helpers (weeks start on Sunday)

/** Local midnight on the Sunday that starts the week containing `date`. @throws Error on invalid input */
export function startOfWeek(date: DateInput): number {
  return startOf(date, 'week');
}

/** Last millisecond of the Saturday that ends the week containing `date`. @throws Error on invalid input */
export function endOfWeek(date: DateInput): number {
  return endOf(date, 'week');
}
