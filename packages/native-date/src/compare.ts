import type { TimeUnit } from './NativeDate.nitro';
import { toTimestamp, toTimestampOrNull } from './input';
import { getNative } from './native';
import type { DateInput } from './types';

// Comparisons - use native C++ for consistency; invalid input yields `false`

/**
 * Whether `date1` is strictly before `date2`.
 * Returns `false` if either input is invalid.
 */
export function isBefore(date1: DateInput, date2: DateInput): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return t1 !== null && t2 !== null && getNative().isBefore(t1, t2);
}

/**
 * Whether `date1` is strictly after `date2`.
 * Returns `false` if either input is invalid.
 */
export function isAfter(date1: DateInput, date2: DateInput): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return t1 !== null && t2 !== null && getNative().isAfter(t1, t2);
}

/**
 * Whether both dates fall in the same local-time `unit`
 * (same day, same month, same hour, ...).
 * Returns `false` if either input is invalid.
 *
 * @example
 * ```typescript
 * isSame('2024-06-15T10:00:00', '2024-06-15T22:00:00', 'day'); // true
 * ```
 */
export function isSame(
  date1: DateInput,
  date2: DateInput,
  unit: TimeUnit
): boolean {
  const t1 = toTimestampOrNull(date1);
  const t2 = toTimestampOrNull(date2);
  return t1 !== null && t2 !== null && getNative().isSame(t1, t2, unit);
}

// Utility functions - use native C++ for consistency

/**
 * Clamp `date` into the inclusive range `[minVal, maxVal]`.
 *
 * @returns `date` as a timestamp, or the nearest bound when it falls outside
 * @throws Error if any argument is not a valid date
 */
export function clamp(
  date: DateInput,
  minVal: DateInput,
  maxVal: DateInput
): number {
  return getNative().clamp(
    toTimestamp(date),
    toTimestamp(minVal),
    toTimestamp(maxVal)
  );
}

/**
 * Return the earliest of the given dates as a timestamp.
 *
 * @throws Error if `dates` is empty or contains an invalid date
 */
export function min(dates: DateInput[]): number {
  if (dates.length === 0) {
    throw new Error('min() requires a non-empty array of dates');
  }
  return getNative().min(dates.map(toTimestamp));
}

/**
 * Return the latest of the given dates as a timestamp.
 *
 * @throws Error if `dates` is empty or contains an invalid date
 */
export function max(dates: DateInput[]): number {
  if (dates.length === 0) {
    throw new Error('max() requires a non-empty array of dates');
  }
  return getNative().max(dates.map(toTimestamp));
}
