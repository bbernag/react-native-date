import { fromComponentsLocal } from './components';
import { getComponents, getDaysInMonth } from './getters';
import { isLeapYear } from './predicates';
import type { DateInput } from './types';

// Setters (immutable - return new timestamp)
// These use local time: getComponents returns local, setters preserve local time.
// All setters throw on invalid input (see the error policy on `parse`).

/**
 * Return a copy of `date` with the local calendar year replaced.
 *
 * Feb 29 is clamped to Feb 28 when the target year is not a leap year. The year
 * is taken literally (`99` is the year 99, not 1999).
 *
 * @throws Error if `date` is not a valid date
 */
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

/**
 * Return a copy of `date` with the local month replaced (**1-based**, `1` = January).
 *
 * The day of month is clamped to the length of the target month
 * (Jan 31 -> Feb gives Feb 29/28).
 *
 * @throws Error if `date` is not a valid date
 */
export function setMonth(date: DateInput, month: number): number {
  const c = getComponents(date);
  const tempDate = fromComponentsLocal({ ...c, month, day: 1 });
  const maxDay = getDaysInMonth(tempDate);
  const day = Math.min(c.day, maxDay);
  return fromComponentsLocal({ ...c, month, day });
}

/**
 * Return a copy of `date` with the local day of month replaced.
 * Values outside the month overflow into adjacent months (`0` is the last day of
 * the previous month), like `Date.prototype.setDate`.
 *
 * @throws Error if `date` is not a valid date
 */
export function setDate(date: DateInput, day: number): number {
  const c = getComponents(date);
  return fromComponentsLocal({ ...c, day });
}

/**
 * Return a copy of `date` with the local hour replaced (`0`-`23`; other values overflow).
 * @throws Error if `date` is not a valid date
 */
export function setHours(date: DateInput, hours: number): number {
  const c = getComponents(date);
  return fromComponentsLocal({ ...c, hour: hours });
}

/**
 * Return a copy of `date` with the minute replaced (`0`-`59`; other values overflow).
 * @throws Error if `date` is not a valid date
 */
export function setMinutes(date: DateInput, minutes: number): number {
  const c = getComponents(date);
  return fromComponentsLocal({ ...c, minute: minutes });
}

/**
 * Return a copy of `date` with the second replaced (`0`-`59`; other values overflow).
 * @throws Error if `date` is not a valid date
 */
export function setSeconds(date: DateInput, seconds: number): number {
  const c = getComponents(date);
  return fromComponentsLocal({ ...c, second: seconds });
}

/**
 * Return a copy of `date` with the millisecond replaced (`0`-`999`; other values overflow).
 * @throws Error if `date` is not a valid date
 */
export function setMilliseconds(date: DateInput, milliseconds: number): number {
  const c = getComponents(date);
  return fromComponentsLocal({ ...c, millisecond: milliseconds });
}
