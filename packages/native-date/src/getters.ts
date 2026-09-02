import type { DateComponents } from './NativeDate.nitro';
import { toTimestamp } from './input';
import { getNative } from './native';
import type { DateInput } from './types';

// Getters - optimized for single bridge crossing with strings.
// All getters read the date in the device's local time zone and throw on
// invalid input (see the error policy on `parse`).

/**
 * All local-time components of a date in one native call.
 *
 * @returns Year, 1-based month, day, hour, minute, second, millisecond and
 * `dayOfWeek` (0 = Sunday)
 * @throws Error if `date` is not a valid date
 */
export function getComponents(date: DateInput): DateComponents {
  if (typeof date === 'string')
    return getNative().getComponentsFromString(date);
  return getNative().getComponents(toTimestamp(date));
}

/**
 * Local calendar year (e.g. `2024`).
 * @throws Error if `date` is not a valid date
 */
export function getYear(date: DateInput): number {
  if (typeof date === 'string') return getNative().getYearFromString(date);
  return getNative().getYear(toTimestamp(date));
}

/**
 * Local month, **1-based** (`1` = January, `12` = December).
 * @throws Error if `date` is not a valid date
 */
export function getMonth(date: DateInput): number {
  if (typeof date === 'string') return getNative().getMonthFromString(date);
  return getNative().getMonth(toTimestamp(date));
}

/**
 * Local day of the month (`1`-`31`).
 * @throws Error if `date` is not a valid date
 */
export function getDate(date: DateInput): number {
  if (typeof date === 'string') return getNative().getDateFromString(date);
  return getNative().getDate(toTimestamp(date));
}

/**
 * Local day of the week (`0` = Sunday ... `6` = Saturday).
 * @throws Error if `date` is not a valid date
 */
export function getDay(date: DateInput): number {
  if (typeof date === 'string') return getNative().getDayFromString(date);
  return getNative().getDay(toTimestamp(date));
}

/**
 * Local hour of the day (`0`-`23`).
 * @throws Error if `date` is not a valid date
 */
export function getHours(date: DateInput): number {
  if (typeof date === 'string') return getNative().getHoursFromString(date);
  return getNative().getHours(toTimestamp(date));
}

/**
 * Minute of the hour (`0`-`59`).
 * @throws Error if `date` is not a valid date
 */
export function getMinutes(date: DateInput): number {
  if (typeof date === 'string') return getNative().getMinutesFromString(date);
  return getNative().getMinutes(toTimestamp(date));
}

/**
 * Second of the minute (`0`-`59`).
 * @throws Error if `date` is not a valid date
 */
export function getSeconds(date: DateInput): number {
  if (typeof date === 'string') return getNative().getSecondsFromString(date);
  return getNative().getSeconds(toTimestamp(date));
}

/**
 * Millisecond of the second (`0`-`999`).
 * @throws Error if `date` is not a valid date
 */
export function getMilliseconds(date: DateInput): number {
  if (typeof date === 'string')
    return getNative().getMillisecondsFromString(date);
  return getNative().getMilliseconds(toTimestamp(date));
}

/**
 * Number of days in the local calendar month that contains `date` (`28`-`31`).
 * @throws Error if `date` is not a valid date
 */
export function getDaysInMonth(date: DateInput): number {
  return getNative().getDaysInMonth(toTimestamp(date));
}
