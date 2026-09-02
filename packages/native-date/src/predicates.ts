import type { DateComponents } from './NativeDate.nitro';
import { addDays, subDays } from './arithmetic';
import { isAfter, isBefore } from './compare';
import { componentsOrNull, toTimestampOrNull } from './input';
import { getNative } from './native';
import { now } from './now';
import type { DateInput } from './types';

// Predicates never throw: invalid input is simply `false`.
export function isLeapYear(date: DateInput): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isLeapYear(timestamp);
}

export function isWeekend(date: DateInput): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isWeekend(timestamp);
}

export function isValid(date: DateInput): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isValid(timestamp);
}

// Additional date-fns-like predicates
// These use getComponents() for fast local time comparison (native C++ call).
// Predicates never throw: invalid input is simply `false`.

function isSameLocalDay(d: DateComponents, o: DateComponents): boolean {
  return d.year === o.year && d.month === o.month && d.day === o.day;
}

export function isToday(date: DateInput): boolean {
  const d = componentsOrNull(date);
  return d !== null && isSameLocalDay(d, getNative().getComponents(now()));
}

export function isTomorrow(date: DateInput): boolean {
  const d = componentsOrNull(date);
  return (
    d !== null &&
    isSameLocalDay(d, getNative().getComponents(addDays(now(), 1)))
  );
}

export function isYesterday(date: DateInput): boolean {
  const d = componentsOrNull(date);
  return (
    d !== null &&
    isSameLocalDay(d, getNative().getComponents(subDays(now(), 1)))
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
