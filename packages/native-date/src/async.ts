import type { DateComponents } from './NativeDate.nitro';
import { getNative } from './native';

// Async batch operations (run on background thread)

/**
 * Parse multiple date strings asynchronously on a background thread
 * Returns NaN for invalid dates instead of throwing
 */
export function parseManyAsync(dateStrings: string[]): Promise<number[]> {
  return getNative().parseManyAsync(dateStrings);
}

/**
 * Format multiple timestamps asynchronously on a background thread
 */
export function formatManyAsync(
  timestamps: number[],
  pattern: string
): Promise<string[]> {
  return getNative().formatManyAsync(timestamps, pattern);
}

/**
 * Get components for multiple timestamps asynchronously on a background thread
 */
export function getComponentsManyAsync(
  timestamps: number[]
): Promise<DateComponents[]> {
  return getNative().getComponentsManyAsync(timestamps);
}
