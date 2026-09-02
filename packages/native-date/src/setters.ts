import { fromComponentsLocal } from './components';
import { getComponents, getDaysInMonth } from './getters';
import { isLeapYear } from './predicates';
import type { DateInput } from './types';

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
