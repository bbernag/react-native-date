import type { TimeUnit } from './NativeDate.nitro';
import { toTimestamp } from './input';
import { getNative } from './native';
import type { DateInput } from './types';

// Arithmetic
export function add(date: DateInput, amount: number, unit: TimeUnit): number {
  return getNative().add(toTimestamp(date), amount, unit);
}

export function subtract(
  date: DateInput,
  amount: number,
  unit: TimeUnit
): number {
  return getNative().subtract(toTimestamp(date), amount, unit);
}

export function diff(
  date1: DateInput,
  date2: DateInput,
  unit: TimeUnit
): number {
  return getNative().diff(toTimestamp(date1), toTimestamp(date2), unit);
}

export function addDays(date: DateInput, amount: number): number {
  return add(date, amount, 'day');
}

export function addMonths(date: DateInput, amount: number): number {
  return add(date, amount, 'month');
}

export function addYears(date: DateInput, amount: number): number {
  return add(date, amount, 'year');
}

export function subDays(date: DateInput, amount: number): number {
  return subtract(date, amount, 'day');
}

export function subMonths(date: DateInput, amount: number): number {
  return subtract(date, amount, 'month');
}

export function subYears(date: DateInput, amount: number): number {
  return subtract(date, amount, 'year');
}

export function diffInDays(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'day');
}

export function diffInMonths(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'month');
}

export function diffInYears(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'year');
}

export function addWeeks(date: DateInput, amount: number): number {
  return add(date, amount, 'week');
}

export function subWeeks(date: DateInput, amount: number): number {
  return subtract(date, amount, 'week');
}

export function diffInWeeks(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'week');
}

// Hour/minute/second helpers
export function addHours(date: DateInput, amount: number): number {
  return add(date, amount, 'hour');
}

export function addMinutes(date: DateInput, amount: number): number {
  return add(date, amount, 'minute');
}

export function addSeconds(date: DateInput, amount: number): number {
  return add(date, amount, 'second');
}

export function subHours(date: DateInput, amount: number): number {
  return subtract(date, amount, 'hour');
}

export function subMinutes(date: DateInput, amount: number): number {
  return subtract(date, amount, 'minute');
}

export function subSeconds(date: DateInput, amount: number): number {
  return subtract(date, amount, 'second');
}

export function diffInHours(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'hour');
}

export function diffInMinutes(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'minute');
}

export function diffInSeconds(date1: DateInput, date2: DateInput): number {
  return diff(date1, date2, 'second');
}
