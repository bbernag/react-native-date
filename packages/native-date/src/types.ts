/**
 * Accepted date input for every function in this library.
 * - `number`: Unix timestamp in milliseconds
 * - `string`: ISO 8601 date string parsed natively like `parse()`
 *   (`'2024-12-25'` is local midnight, `'2024-12-25T10:30:00Z'` is an instant)
 * - `Date`: JavaScript `Date` object
 *
 * Invalid input (`NaN`, an unparseable string, an invalid `Date`) makes
 * value-returning functions throw, `try*` functions return `null` and
 * predicates (`is*`) return `false`.
 */
export type DateInput = number | string | Date;
