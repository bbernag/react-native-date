/**
 * Chainable API for react-native-date
 *
 * This module provides a Day.js-style chainable interface.
 * Import from '@bernagl/react-native-date/chain' for tree-shaking benefits
 * if you only need the chainable API.
 *
 * @example
 * ```typescript
 * import { nativeDate } from '@bernagl/react-native-date/chain';
 *
 * nativeDate()
 *   .addDays(7)
 *   .startOfDay()
 *   .format('yyyy-MM-dd');
 * ```
 */

import type { DateComponents, TimeUnit } from './NativeDate.nitro';
import type { Timezone } from './timezone';
import type { DateInput } from './types';
import {
  add,
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addSeconds,
  addWeeks,
  addYears,
  diff,
  diffInDays,
  diffInHours,
  diffInMinutes,
  diffInMonths,
  diffInSeconds,
  diffInWeeks,
  diffInYears,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subSeconds,
  subtract,
  subWeeks,
  subYears,
} from './arithmetic';
import {
  endOf,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOf,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from './boundaries';
import { isAfter, isBefore, isSame } from './compare';
import {
  format,
  formatDate,
  formatDateTime,
  formatUTC,
  toISOString,
} from './format';
import {
  getComponents,
  getDate,
  getDay,
  getDaysInMonth,
  getHours,
  getMilliseconds,
  getMinutes,
  getMonth,
  getSeconds,
  getYear,
} from './getters';
import { now } from './now';
import { parse } from './parse';
import {
  isFuture,
  isLeapYear,
  isPast,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  isTomorrow,
  isValid,
  isWeekend,
  isYesterday,
} from './predicates';
import {
  setDate,
  setHours,
  setMilliseconds,
  setMinutes,
  setMonth,
  setSeconds,
  setYear,
} from './setters';
import { formatInTimezone, toTimezone, toUTC } from './zones';

/** Unwrap a chain to its timestamp; pass any other DateInput through. */
function toInput(other: DateInput | NativeDateChain): DateInput {
  return other instanceof NativeDateChain ? other.valueOf() : other;
}

/**
 * Immutable, Day.js-style wrapper around a timestamp.
 *
 * Every operation returns a new instance and leaves the original unchanged. All
 * methods delegate to the functional API, so results (parsing, clamping, error
 * policy) are identical to calling those functions directly. Create instances
 * with {@link nativeDate}.
 *
 * Coercion: `valueOf()`/`+chain` give the timestamp, `toString()` the local
 * `yyyy-MM-dd HH:mm:ss` text and `JSON.stringify` the ISO 8601 UTC string.
 *
 * @example
 * ```typescript
 * nativeDate('2024-12-25').addDays(7).startOfDay().format('yyyy-MM-dd');
 * JSON.stringify({ at: nativeDate(0) }); // {"at":"1970-01-01T00:00:00.000Z"}
 * ```
 */
export class NativeDateChain {
  readonly #ts: number;

  /**
   * Wrap a timestamp in milliseconds. Prefer {@link nativeDate} or
   * {@link NativeDateChain.from}, which also accept strings and `Date`s.
   */
  constructor(timestamp: number) {
    this.#ts = timestamp;
  }

  // Static factory methods

  /** Chain for the current instant ({@link now}). */
  static now(): NativeDateChain {
    return new NativeDateChain(now());
  }

  /**
   * Chain from an ISO 8601 string (see {@link parse}; date-only strings are
   * local midnight).
   * @throws Error if the string is not a valid date
   */
  static parse(dateString: string): NativeDateChain {
    return new NativeDateChain(parse(dateString));
  }

  /**
   * Chain from any {@link DateInput} or another chain.
   * @throws Error if the value is not a valid date
   */
  static from(value: DateInput | NativeDateChain): NativeDateChain {
    if (value instanceof NativeDateChain) {
      return new NativeDateChain(value.#ts);
    }
    if (typeof value === 'number') {
      return new NativeDateChain(value);
    }
    if (typeof value === 'string') {
      return NativeDateChain.parse(value);
    }
    return new NativeDateChain(value.getTime());
  }

  // Terminal methods (return values, not chain)
  valueOf(): number {
    return this.#ts;
  }

  toDate(): Date {
    return new Date(this.#ts);
  }

  /** ISO 8601 UTC string (`2024-12-25T10:30:00.000Z`); used by `JSON.stringify`. */
  toJSON(): string {
    return toISOString(this.#ts);
  }

  /** Local `yyyy-MM-dd HH:mm:ss` text; used by template literals and `String()`. */
  toString(): string {
    return formatDateTime(this.#ts);
  }

  /**
   * Primitive coercion: numbers (`+chain`, `<`, `-`) and the default hint give
   * the timestamp; the string hint gives {@link NativeDateChain.toString}.
   */
  [Symbol.toPrimitive](hint: 'number' | 'string' | 'default'): number | string {
    return hint === 'string' ? this.toString() : this.#ts;
  }

  format(pattern: string): string {
    return format(this.#ts, pattern);
  }

  formatUTC(pattern: string): string {
    return formatUTC(this.#ts, pattern);
  }

  formatInTimezone(pattern: string, tz: Timezone): string {
    return formatInTimezone(this.#ts, pattern, tz);
  }

  toISOString(): string {
    return toISOString(this.#ts);
  }

  formatDate(): string {
    return formatDate(this.#ts);
  }

  formatDateTime(): string {
    return formatDateTime(this.#ts);
  }

  // Getters (return values)
  get timestamp(): number {
    return this.#ts;
  }

  get year(): number {
    return getYear(this.#ts);
  }

  get month(): number {
    return getMonth(this.#ts);
  }

  get date(): number {
    return getDate(this.#ts);
  }

  get day(): number {
    return getDay(this.#ts);
  }

  get hours(): number {
    return getHours(this.#ts);
  }

  get minutes(): number {
    return getMinutes(this.#ts);
  }

  get seconds(): number {
    return getSeconds(this.#ts);
  }

  get milliseconds(): number {
    return getMilliseconds(this.#ts);
  }

  get daysInMonth(): number {
    return getDaysInMonth(this.#ts);
  }

  getComponents(): DateComponents {
    return getComponents(this.#ts);
  }

  // Arithmetic (return new chain)
  add(amount: number, unit: TimeUnit): NativeDateChain {
    return new NativeDateChain(add(this.#ts, amount, unit));
  }

  subtract(amount: number, unit: TimeUnit): NativeDateChain {
    return new NativeDateChain(subtract(this.#ts, amount, unit));
  }

  addYears(amount: number): NativeDateChain {
    return new NativeDateChain(addYears(this.#ts, amount));
  }

  addMonths(amount: number): NativeDateChain {
    return new NativeDateChain(addMonths(this.#ts, amount));
  }

  addWeeks(amount: number): NativeDateChain {
    return new NativeDateChain(addWeeks(this.#ts, amount));
  }

  addDays(amount: number): NativeDateChain {
    return new NativeDateChain(addDays(this.#ts, amount));
  }

  addHours(amount: number): NativeDateChain {
    return new NativeDateChain(addHours(this.#ts, amount));
  }

  addMinutes(amount: number): NativeDateChain {
    return new NativeDateChain(addMinutes(this.#ts, amount));
  }

  addSeconds(amount: number): NativeDateChain {
    return new NativeDateChain(addSeconds(this.#ts, amount));
  }

  subYears(amount: number): NativeDateChain {
    return new NativeDateChain(subYears(this.#ts, amount));
  }

  subMonths(amount: number): NativeDateChain {
    return new NativeDateChain(subMonths(this.#ts, amount));
  }

  subWeeks(amount: number): NativeDateChain {
    return new NativeDateChain(subWeeks(this.#ts, amount));
  }

  subDays(amount: number): NativeDateChain {
    return new NativeDateChain(subDays(this.#ts, amount));
  }

  subHours(amount: number): NativeDateChain {
    return new NativeDateChain(subHours(this.#ts, amount));
  }

  subMinutes(amount: number): NativeDateChain {
    return new NativeDateChain(subMinutes(this.#ts, amount));
  }

  subSeconds(amount: number): NativeDateChain {
    return new NativeDateChain(subSeconds(this.#ts, amount));
  }

  // Boundaries (return new chain)
  startOf(unit: TimeUnit): NativeDateChain {
    return new NativeDateChain(startOf(this.#ts, unit));
  }

  endOf(unit: TimeUnit): NativeDateChain {
    return new NativeDateChain(endOf(this.#ts, unit));
  }

  startOfDay(): NativeDateChain {
    return new NativeDateChain(startOfDay(this.#ts));
  }

  endOfDay(): NativeDateChain {
    return new NativeDateChain(endOfDay(this.#ts));
  }

  startOfWeek(): NativeDateChain {
    return new NativeDateChain(startOfWeek(this.#ts));
  }

  endOfWeek(): NativeDateChain {
    return new NativeDateChain(endOfWeek(this.#ts));
  }

  startOfMonth(): NativeDateChain {
    return new NativeDateChain(startOfMonth(this.#ts));
  }

  endOfMonth(): NativeDateChain {
    return new NativeDateChain(endOfMonth(this.#ts));
  }

  startOfYear(): NativeDateChain {
    return new NativeDateChain(startOfYear(this.#ts));
  }

  endOfYear(): NativeDateChain {
    return new NativeDateChain(endOfYear(this.#ts));
  }

  // Setters (return new chain with modified value)
  // Delegate to the functional setters so both APIs clamp the same way
  // (Feb 29 -> Feb 28 in a non-leap year, Jan 31 -> Feb 29/28, ...).
  setYear(year: number): NativeDateChain {
    return new NativeDateChain(setYear(this.#ts, year));
  }

  setMonth(month: number): NativeDateChain {
    return new NativeDateChain(setMonth(this.#ts, month));
  }

  setDate(date: number): NativeDateChain {
    return new NativeDateChain(setDate(this.#ts, date));
  }

  setHours(hours: number): NativeDateChain {
    return new NativeDateChain(setHours(this.#ts, hours));
  }

  setMinutes(minutes: number): NativeDateChain {
    return new NativeDateChain(setMinutes(this.#ts, minutes));
  }

  setSeconds(seconds: number): NativeDateChain {
    return new NativeDateChain(setSeconds(this.#ts, seconds));
  }

  setMilliseconds(milliseconds: number): NativeDateChain {
    return new NativeDateChain(setMilliseconds(this.#ts, milliseconds));
  }

  // Timezone (return new chain)
  toTimezone(tz: Timezone): NativeDateChain {
    return new NativeDateChain(toTimezone(this.#ts, tz));
  }

  toUTC(): NativeDateChain {
    return new NativeDateChain(toUTC(this.#ts));
  }

  // Comparisons (return boolean)
  isBefore(other: DateInput | NativeDateChain): boolean {
    const otherTs = toInput(other);
    return isBefore(this.#ts, otherTs);
  }

  isAfter(other: DateInput | NativeDateChain): boolean {
    const otherTs = toInput(other);
    return isAfter(this.#ts, otherTs);
  }

  isSame(other: DateInput | NativeDateChain, unit: TimeUnit): boolean {
    const otherTs = toInput(other);
    return isSame(this.#ts, otherTs, unit);
  }

  isSameDay(other: DateInput | NativeDateChain): boolean {
    const otherTs = toInput(other);
    return isSameDay(this.#ts, otherTs);
  }

  isSameMonth(other: DateInput | NativeDateChain): boolean {
    const otherTs = toInput(other);
    return isSameMonth(this.#ts, otherTs);
  }

  isSameYear(other: DateInput | NativeDateChain): boolean {
    const otherTs = toInput(other);
    return isSameYear(this.#ts, otherTs);
  }

  // Predicates (return boolean)
  isToday(): boolean {
    return isToday(this.#ts);
  }

  isTomorrow(): boolean {
    return isTomorrow(this.#ts);
  }

  isYesterday(): boolean {
    return isYesterday(this.#ts);
  }

  isPast(): boolean {
    return isPast(this.#ts);
  }

  isFuture(): boolean {
    return isFuture(this.#ts);
  }

  isWeekend(): boolean {
    return isWeekend(this.#ts);
  }

  isLeapYear(): boolean {
    return isLeapYear(this.#ts);
  }

  isValid(): boolean {
    return isValid(this.#ts);
  }

  // Diff (return number)
  diff(other: DateInput | NativeDateChain, unit: TimeUnit): number {
    const otherTs = toInput(other);
    return diff(this.#ts, otherTs, unit);
  }

  diffInYears(other: DateInput | NativeDateChain): number {
    const otherTs = toInput(other);
    return diffInYears(this.#ts, otherTs);
  }

  diffInMonths(other: DateInput | NativeDateChain): number {
    const otherTs = toInput(other);
    return diffInMonths(this.#ts, otherTs);
  }

  diffInWeeks(other: DateInput | NativeDateChain): number {
    const otherTs = toInput(other);
    return diffInWeeks(this.#ts, otherTs);
  }

  diffInDays(other: DateInput | NativeDateChain): number {
    const otherTs = toInput(other);
    return diffInDays(this.#ts, otherTs);
  }

  diffInHours(other: DateInput | NativeDateChain): number {
    const otherTs = toInput(other);
    return diffInHours(this.#ts, otherTs);
  }

  diffInMinutes(other: DateInput | NativeDateChain): number {
    const otherTs = toInput(other);
    return diffInMinutes(this.#ts, otherTs);
  }

  diffInSeconds(other: DateInput | NativeDateChain): number {
    const otherTs = toInput(other);
    return diffInSeconds(this.#ts, otherTs);
  }

  // Clone
  clone(): NativeDateChain {
    return new NativeDateChain(this.#ts);
  }
}

/**
 * Create a {@link NativeDateChain}.
 *
 * @param value - Timestamp (ms), ISO 8601 string, `Date`, another chain, or
 * `undefined` for the current instant
 * @throws Error if `value` is not a valid date
 *
 * @example
 * ```typescript
 * nativeDate().addDays(7).format('yyyy-MM-dd');
 * nativeDate('2024-12-25').isSameDay(new Date());
 * ```
 */
export function nativeDate(
  value?: DateInput | NativeDateChain
): NativeDateChain {
  if (value === undefined) {
    return NativeDateChain.now();
  }
  return NativeDateChain.from(value);
}
