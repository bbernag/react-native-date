import type { DateComponents } from './NativeDate.nitro';
import { toTimestamp } from './input';
import { getNative } from './native';
import type { DateInput } from './types';

// Getters - optimized for single bridge crossing with strings
export function getComponents(date: DateInput): DateComponents {
  if (typeof date === 'string')
    return getNative().getComponentsFromString(date);
  return getNative().getComponents(toTimestamp(date));
}

export function getYear(date: DateInput): number {
  if (typeof date === 'string') return getNative().getYearFromString(date);
  return getNative().getYear(toTimestamp(date));
}

export function getMonth(date: DateInput): number {
  if (typeof date === 'string') return getNative().getMonthFromString(date);
  return getNative().getMonth(toTimestamp(date));
}

export function getDate(date: DateInput): number {
  if (typeof date === 'string') return getNative().getDateFromString(date);
  return getNative().getDate(toTimestamp(date));
}

export function getDay(date: DateInput): number {
  if (typeof date === 'string') return getNative().getDayFromString(date);
  return getNative().getDay(toTimestamp(date));
}

export function getHours(date: DateInput): number {
  if (typeof date === 'string') return getNative().getHoursFromString(date);
  return getNative().getHours(toTimestamp(date));
}

export function getMinutes(date: DateInput): number {
  if (typeof date === 'string') return getNative().getMinutesFromString(date);
  return getNative().getMinutes(toTimestamp(date));
}

export function getSeconds(date: DateInput): number {
  if (typeof date === 'string') return getNative().getSecondsFromString(date);
  return getNative().getSeconds(toTimestamp(date));
}

export function getMilliseconds(date: DateInput): number {
  if (typeof date === 'string')
    return getNative().getMillisecondsFromString(date);
  return getNative().getMilliseconds(toTimestamp(date));
}

// Date info - use native C++ for performance
export function getDaysInMonth(date: DateInput): number {
  return getNative().getDaysInMonth(toTimestamp(date));
}
