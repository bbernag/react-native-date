import type { TimeUnit } from './NativeDate.nitro';
import { toTimestamp } from './input';
import { getNative } from './native';
import type { DateInput } from './types';

// Helpers
export function startOf(date: DateInput, unit: TimeUnit): number {
  return getNative().startOf(toTimestamp(date), unit);
}

export function endOf(date: DateInput, unit: TimeUnit): number {
  return getNative().endOf(toTimestamp(date), unit);
}

// Convenience helpers (date-fns style)
export function startOfDay(date: DateInput): number {
  return startOf(date, 'day');
}

export function endOfDay(date: DateInput): number {
  return endOf(date, 'day');
}

export function startOfMonth(date: DateInput): number {
  return startOf(date, 'month');
}

export function endOfMonth(date: DateInput): number {
  return endOf(date, 'month');
}

export function startOfYear(date: DateInput): number {
  return startOf(date, 'year');
}

export function endOfYear(date: DateInput): number {
  return endOf(date, 'year');
}

// Week helpers
export function startOfWeek(date: DateInput): number {
  return startOf(date, 'week');
}

export function endOfWeek(date: DateInput): number {
  return endOf(date, 'week');
}
