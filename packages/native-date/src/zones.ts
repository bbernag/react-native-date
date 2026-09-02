import { toTimestamp, toTimestampOrNull } from './input';
import { getNative } from './native';
import type { Timezone } from './timezone';
import type { DateInput } from './types';

// Timezone
export function getTimezone(): Timezone {
  return getNative().getTimezone() as Timezone;
}

export function getTimezoneOffset(): number {
  return getNative().getTimezoneOffset();
}

export function getTimezoneOffsetForTimestamp(date: DateInput): number {
  return getNative().getTimezoneOffsetForTimestamp(toTimestamp(date));
}

export function getOffsetInTimezone(
  date: DateInput,
  timezone: Timezone
): number {
  return getNative().getOffsetInTimezone(toTimestamp(date), timezone);
}

export function toTimezone(date: DateInput, timezone: Timezone): number {
  return getNative().toTimezone(toTimestamp(date), timezone);
}

export function formatInTimezone(
  date: DateInput,
  pattern: string,
  timezone: Timezone
): string {
  return getNative().formatInTimezone(toTimestamp(date), pattern, timezone);
}

export function getAvailableTimezones(): Timezone[] {
  return getNative().getAvailableTimezones() as Timezone[];
}

// Timezone convenience helpers
export function formatDateInTimezone(
  date: DateInput,
  timezone: Timezone
): string {
  return formatInTimezone(date, 'yyyy-MM-dd', timezone);
}

export function formatDateTimeInTimezone(
  date: DateInput,
  timezone: Timezone
): string {
  return formatInTimezone(date, 'yyyy-MM-dd HH:mm:ss', timezone);
}

export function toUTC(date: DateInput): number {
  return toTimezone(date, 'UTC');
}

export function formatInUTC(date: DateInput, pattern: string): string {
  return formatInTimezone(date, pattern, 'UTC');
}

// Timezone-aware predicates (InTz) - Native implementations.
// Invalid dates yield `false`; an invalid timezone name still throws (native).
export function isTodayInTz(date: DateInput, timezone: Timezone): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isTodayInTz(timestamp, timezone);
}

export function isTomorrowInTz(date: DateInput, timezone: Timezone): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isTomorrowInTz(timestamp, timezone);
}

export function isYesterdayInTz(date: DateInput, timezone: Timezone): boolean {
  const timestamp = toTimestampOrNull(date);
  return timestamp !== null && getNative().isYesterdayInTz(timestamp, timezone);
}

export function isSameDayInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return (
    t1 !== null && t2 !== null && getNative().isSameDayInTz(t1, t2, timezone)
  );
}

export function isSameMonthInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return (
    t1 !== null && t2 !== null && getNative().isSameMonthInTz(t1, t2, timezone)
  );
}

export function isSameYearInTz(
  date1: DateInput,
  date2: DateInput,
  timezone: Timezone
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return (
    t1 !== null && t2 !== null && getNative().isSameYearInTz(t1, t2, timezone)
  );
}

export function startOfDayInTz(date: DateInput, timezone: Timezone): number {
  return getNative().startOfDayInTz(toTimestamp(date), timezone);
}

export function endOfDayInTz(date: DateInput, timezone: Timezone): number {
  return getNative().endOfDayInTz(toTimestamp(date), timezone);
}
