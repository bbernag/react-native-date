import type { DateComponents } from './NativeDate.nitro';
import { getNative } from './native';
import type { DateInput } from './types';

/**
 * Convert any DateInput to a finite timestamp (milliseconds), or `null` when the
 * input is invalid. Never throws.
 *
 * Strings go through the same native ISO 8601 parser as `parse()` so that
 * date-only strings mean local midnight everywhere in the API. Numbers and
 * `Date` objects are accepted only when they are finite.
 */
export function toTimestampOrNull(date: DateInput): number | null {
  let timestamp: number;
  if (typeof date === 'number') {
    timestamp = date;
  } else if (typeof date === 'string') {
    // Resolve the binding outside the try: a missing native module must surface
    // its setup error, not masquerade as invalid input.
    const native = getNative();
    try {
      timestamp = native.parse(date);
    } catch {
      return null;
    }
  } else {
    timestamp = date.getTime();
  }
  return Number.isFinite(timestamp) ? timestamp : null;
}

/**
 * Convert any DateInput to a finite timestamp (milliseconds).
 *
 * Strings go through the same native ISO 8601 parser as `parse()` (date-only
 * strings are local midnight). Non-finite numbers, invalid `Date` objects and
 * unparseable strings throw, so no NaN ever reaches native code.
 *
 * @throws Error if the input is not a valid date
 */
export function toTimestamp(date: DateInput): number {
  // typeof is ~10-20x faster than property lookup
  let timestamp: number;
  if (typeof date === 'number') {
    timestamp = date;
  } else if (typeof date === 'string') {
    timestamp = getNative().parse(date);
  } else {
    timestamp = date.getTime();
  }
  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid date input: ${String(date)}`);
  }
  return timestamp;
}

/**
 * Local components of a DateInput, or `null` when the input is invalid.
 * Strings keep the single-crossing `getComponentsFromString` path.
 */
export function componentsOrNull(date: DateInput): DateComponents | null {
  if (typeof date === 'string') {
    const native = getNative();
    try {
      return native.getComponentsFromString(date);
    } catch {
      return null;
    }
  }
  const timestamp = typeof date === 'number' ? date : date.getTime();
  return Number.isFinite(timestamp)
    ? getNative().getComponents(timestamp)
    : null;
}
