import type { DateComponents } from './NativeDate.nitro';
import { getNative } from './native';

// Async batch operations (run on background thread)

/**
 * Parse many ISO 8601 strings on a background thread (same semantics as
 * {@link parse}, date-only strings are local midnight).
 *
 * Batch APIs never reject for bad input: each invalid string yields `NaN` at its
 * position in the result. Batches larger than 100 000 elements throw
 * synchronously.
 */
export function parseManyAsync(dateStrings: string[]): Promise<number[]> {
  return getNative().parseManyAsync(dateStrings);
}

/**
 * Format many timestamps with one pattern on a background thread (same tokens,
 * locale names and local-time semantics as {@link format}).
 *
 * Invalid timestamps yield `""` at their position instead of rejecting.
 * Batches larger than 100 000 elements or patterns longer than 128 characters
 * throw synchronously.
 */
export function formatManyAsync(
  timestamps: number[],
  pattern: string
): Promise<string[]> {
  return getNative().formatManyAsync(timestamps, pattern);
}

/**
 * Local-time components for many timestamps on a background thread (same result
 * shape as {@link getComponents}).
 *
 * Invalid timestamps yield components whose fields are all `NaN` instead of
 * rejecting. Batches larger than 100 000 elements throw synchronously.
 */
export function getComponentsManyAsync(
  timestamps: number[]
): Promise<DateComponents[]> {
  return getNative().getComponentsManyAsync(timestamps);
}
