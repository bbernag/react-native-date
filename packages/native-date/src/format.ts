import { toTimestamp } from './input';
import { getNative } from './native';
import { now } from './now';
import type { DateInput } from './types';

export function format(date: DateInput, pattern: string): string {
  // Optimized: strings go directly to C++ (single bridge crossing)
  if (typeof date === 'string')
    return getNative().formatFromString(date, pattern);
  return getNative().format(toTimestamp(date), pattern);
}

export function formatUTC(date: DateInput, pattern: string): string {
  // Optimized: strings go directly to C++ (single bridge crossing)
  if (typeof date === 'string')
    return getNative().formatUTCFromString(date, pattern);
  return getNative().formatUTC(toTimestamp(date), pattern);
}

// Relative time formatting

/**
 * Format the distance between two dates in human-readable format
 *
 * @param date - The date to compare
 * @param baseDate - The date to compare against (defaults to now)
 * @param addSuffix - Whether to add "ago" or "in" suffix
 * @returns Human-readable distance string like "2 hours ago" or "in 3 days"
 *
 * @example
 * ```typescript
 * formatDistance(Date.now() - 1000 * 60 * 60 * 2, Date.now(), true)  // "2 hours ago"
 * formatDistance(Date.now() + 1000 * 60 * 60 * 24, Date.now(), true) // "in 1 day"
 * formatDistance(Date.now() - 1000 * 60 * 5, Date.now(), false)      // "5 minutes"
 * ```
 */
export function formatDistance(
  date: DateInput,
  baseDate: DateInput = now(),
  addSuffix: boolean = true
): string {
  return getNative().formatDistance(
    toTimestamp(date),
    toTimestamp(baseDate),
    addSuffix
  );
}

/**
 * Format a duration in milliseconds to human-readable format
 *
 * @param milliseconds - Duration in milliseconds
 * @returns Duration string like "2d 5h 30m 15s"
 *
 * @example
 * ```typescript
 * formatDuration(1000 * 60 * 60 * 2)           // "2h 0m 0s"
 * formatDuration(1000 * 60 * 90 + 1000 * 30)   // "1h 30m 30s"
 * formatDuration(1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 5) // "2d 5h 0m 0s"
 * ```
 */
export function formatDuration(milliseconds: number): string {
  return getNative().formatDuration(milliseconds);
}

// ISO format helper
export function toISOString(date: DateInput): string {
  return formatUTC(date, "yyyy-MM-dd'T'HH:mm:ss.SSS") + 'Z';
}

export function formatDate(date: DateInput): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDateTime(date: DateInput): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}
