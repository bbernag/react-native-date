/**
 * `Date.UTC()` and `new Date(y, m, d)` map years 0-99 to 1900-1999. The
 * component constructors below take the year literally, so `{ year: 99 }` is
 * year 99, not 1999.
 */
const MAX_TWO_DIGIT_YEAR = 99;

/**
 * Create a timestamp from date components interpreted as UTC.
 *
 * Uses JS Date.UTC() instead of native C++ because:
 * - Avoids bridge crossing overhead for simple timestamp creation
 * - Date.UTC() is a single optimized call with no parsing complexity
 * - Native alternative would require serializing/deserializing the components object
 *
 * The year is taken literally: `{ year: 99 }` is the year 99, not 1999.
 *
 * @param components - Object with year, month, day, and optional time fields
 * @returns Timestamp in milliseconds (UTC)
 *
 * Note: month is 1-indexed (1-12), unlike JS Date which uses 0-indexed months
 */
export function fromComponents(components: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}): number {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = components;

  // Use Date.UTC to create timestamp (month is 0-indexed in Date)
  const date = new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  );
  if (year >= 0 && year <= MAX_TWO_DIGIT_YEAR) {
    date.setUTCFullYear(year, month - 1, day);
  }
  return date.getTime();
}

// Helper: create timestamp from local time components (unlike fromComponents which uses UTC)
export function fromComponentsLocal(components: {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}): number {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = components;
  // Use new Date() constructor which interprets as local time (month is 0-indexed)
  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond
  );
  if (year >= 0 && year <= MAX_TWO_DIGIT_YEAR) {
    // The constructor maps 0-99 to 1900-1999; setFullYear takes the year literally
    date.setFullYear(year, month - 1, day);
  }
  return date.getTime();
}
