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
import type { Timezone } from './index';
import {
  // Core
  now,
  parse,
  format,
  formatUTC,
  formatInTimezone,
  toISOString,
  formatDate,
  formatDateTime,
  // Getters
  getYear,
  getMonth,
  getDate,
  getDay,
  getHours,
  getMinutes,
  getSeconds,
  getMilliseconds,
  getDaysInMonth,
  getComponents,
  // Arithmetic
  add,
  subtract,
  addYears,
  addMonths,
  addWeeks,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
  subYears,
  subMonths,
  subWeeks,
  subDays,
  subHours,
  subMinutes,
  subSeconds,
  // Boundaries
  startOf,
  endOf,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  // Timezone
  toTimezone,
  toUTC,
  // Comparisons
  isBefore,
  isAfter,
  isSame,
  isSameDay,
  isSameMonth,
  isSameYear,
  // Predicates
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  isWeekend,
  isLeapYear,
  isValid,
  // Diff
  diff,
  diffInYears,
  diffInMonths,
  diffInWeeks,
  diffInDays,
  diffInHours,
  diffInMinutes,
  diffInSeconds,
} from './index';

/**
 * Immutable chainable date wrapper
 * Each method returns a new instance, leaving the original unchanged
 */
export class NativeDateChain {
  private readonly ts: number;

  constructor(timestamp: number) {
    this.ts = timestamp;
  }

  // Static factory methods
  static now(): NativeDateChain {
    return new NativeDateChain(now());
  }

  static parse(dateString: string): NativeDateChain {
    return new NativeDateChain(parse(dateString));
  }

  static from(value: number | string | Date): NativeDateChain {
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
    return this.ts;
  }

  toDate(): Date {
    return new Date(this.ts);
  }

  format(pattern: string): string {
    return format(this.ts, pattern);
  }

  formatUTC(pattern: string): string {
    return formatUTC(this.ts, pattern);
  }

  formatInTimezone(pattern: string, tz: Timezone): string {
    return formatInTimezone(this.ts, pattern, tz);
  }

  toISOString(): string {
    return toISOString(this.ts);
  }

  formatDate(): string {
    return formatDate(this.ts);
  }

  formatDateTime(): string {
    return formatDateTime(this.ts);
  }

  // Getters (return values)
  get timestamp(): number {
    return this.ts;
  }

  get year(): number {
    return getYear(this.ts);
  }

  get month(): number {
    return getMonth(this.ts);
  }

  get date(): number {
    return getDate(this.ts);
  }

  get day(): number {
    return getDay(this.ts);
  }

  get hours(): number {
    return getHours(this.ts);
  }

  get minutes(): number {
    return getMinutes(this.ts);
  }

  get seconds(): number {
    return getSeconds(this.ts);
  }

  get milliseconds(): number {
    return getMilliseconds(this.ts);
  }

  get daysInMonth(): number {
    return getDaysInMonth(this.ts);
  }

  getComponents(): DateComponents {
    return getComponents(this.ts);
  }

  // Arithmetic (return new chain)
  add(amount: number, unit: TimeUnit): NativeDateChain {
    return new NativeDateChain(add(this.ts, amount, unit));
  }

  subtract(amount: number, unit: TimeUnit): NativeDateChain {
    return new NativeDateChain(subtract(this.ts, amount, unit));
  }

  addYears(amount: number): NativeDateChain {
    return new NativeDateChain(addYears(this.ts, amount));
  }

  addMonths(amount: number): NativeDateChain {
    return new NativeDateChain(addMonths(this.ts, amount));
  }

  addWeeks(amount: number): NativeDateChain {
    return new NativeDateChain(addWeeks(this.ts, amount));
  }

  addDays(amount: number): NativeDateChain {
    return new NativeDateChain(addDays(this.ts, amount));
  }

  addHours(amount: number): NativeDateChain {
    return new NativeDateChain(addHours(this.ts, amount));
  }

  addMinutes(amount: number): NativeDateChain {
    return new NativeDateChain(addMinutes(this.ts, amount));
  }

  addSeconds(amount: number): NativeDateChain {
    return new NativeDateChain(addSeconds(this.ts, amount));
  }

  subYears(amount: number): NativeDateChain {
    return new NativeDateChain(subYears(this.ts, amount));
  }

  subMonths(amount: number): NativeDateChain {
    return new NativeDateChain(subMonths(this.ts, amount));
  }

  subWeeks(amount: number): NativeDateChain {
    return new NativeDateChain(subWeeks(this.ts, amount));
  }

  subDays(amount: number): NativeDateChain {
    return new NativeDateChain(subDays(this.ts, amount));
  }

  subHours(amount: number): NativeDateChain {
    return new NativeDateChain(subHours(this.ts, amount));
  }

  subMinutes(amount: number): NativeDateChain {
    return new NativeDateChain(subMinutes(this.ts, amount));
  }

  subSeconds(amount: number): NativeDateChain {
    return new NativeDateChain(subSeconds(this.ts, amount));
  }

  // Boundaries (return new chain)
  startOf(unit: TimeUnit): NativeDateChain {
    return new NativeDateChain(startOf(this.ts, unit));
  }

  endOf(unit: TimeUnit): NativeDateChain {
    return new NativeDateChain(endOf(this.ts, unit));
  }

  startOfDay(): NativeDateChain {
    return new NativeDateChain(startOfDay(this.ts));
  }

  endOfDay(): NativeDateChain {
    return new NativeDateChain(endOfDay(this.ts));
  }

  startOfWeek(): NativeDateChain {
    return new NativeDateChain(startOfWeek(this.ts));
  }

  endOfWeek(): NativeDateChain {
    return new NativeDateChain(endOfWeek(this.ts));
  }

  startOfMonth(): NativeDateChain {
    return new NativeDateChain(startOfMonth(this.ts));
  }

  endOfMonth(): NativeDateChain {
    return new NativeDateChain(endOfMonth(this.ts));
  }

  startOfYear(): NativeDateChain {
    return new NativeDateChain(startOfYear(this.ts));
  }

  endOfYear(): NativeDateChain {
    return new NativeDateChain(endOfYear(this.ts));
  }

  // Setters (return new chain with modified value)
  setYear(year: number): NativeDateChain {
    const d = new Date(this.ts);
    d.setFullYear(year);
    return new NativeDateChain(d.getTime());
  }

  setMonth(month: number): NativeDateChain {
    const d = new Date(this.ts);
    d.setMonth(month - 1); // Convert 1-indexed to 0-indexed
    return new NativeDateChain(d.getTime());
  }

  setDate(date: number): NativeDateChain {
    const d = new Date(this.ts);
    d.setDate(date);
    return new NativeDateChain(d.getTime());
  }

  setHours(hours: number): NativeDateChain {
    const d = new Date(this.ts);
    d.setHours(hours);
    return new NativeDateChain(d.getTime());
  }

  setMinutes(minutes: number): NativeDateChain {
    const d = new Date(this.ts);
    d.setMinutes(minutes);
    return new NativeDateChain(d.getTime());
  }

  setSeconds(seconds: number): NativeDateChain {
    const d = new Date(this.ts);
    d.setSeconds(seconds);
    return new NativeDateChain(d.getTime());
  }

  setMilliseconds(milliseconds: number): NativeDateChain {
    const d = new Date(this.ts);
    d.setMilliseconds(milliseconds);
    return new NativeDateChain(d.getTime());
  }

  // Timezone (return new chain)
  toTimezone(tz: Timezone): NativeDateChain {
    return new NativeDateChain(toTimezone(this.ts, tz));
  }

  toUTC(): NativeDateChain {
    return new NativeDateChain(toUTC(this.ts));
  }

  // Comparisons (return boolean)
  isBefore(other: NativeDateChain | number): boolean {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return isBefore(this.ts, otherTs);
  }

  isAfter(other: NativeDateChain | number): boolean {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return isAfter(this.ts, otherTs);
  }

  isSame(other: NativeDateChain | number, unit: TimeUnit): boolean {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return isSame(this.ts, otherTs, unit);
  }

  isSameDay(other: NativeDateChain | number): boolean {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return isSameDay(this.ts, otherTs);
  }

  isSameMonth(other: NativeDateChain | number): boolean {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return isSameMonth(this.ts, otherTs);
  }

  isSameYear(other: NativeDateChain | number): boolean {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return isSameYear(this.ts, otherTs);
  }

  // Predicates (return boolean)
  isToday(): boolean {
    return isToday(this.ts);
  }

  isTomorrow(): boolean {
    return isTomorrow(this.ts);
  }

  isYesterday(): boolean {
    return isYesterday(this.ts);
  }

  isPast(): boolean {
    return isPast(this.ts);
  }

  isFuture(): boolean {
    return isFuture(this.ts);
  }

  isWeekend(): boolean {
    return isWeekend(this.ts);
  }

  isLeapYear(): boolean {
    return isLeapYear(this.ts);
  }

  isValid(): boolean {
    return isValid(this.ts);
  }

  // Diff (return number)
  diff(other: NativeDateChain | number, unit: TimeUnit): number {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return diff(this.ts, otherTs, unit);
  }

  diffInYears(other: NativeDateChain | number): number {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return diffInYears(this.ts, otherTs);
  }

  diffInMonths(other: NativeDateChain | number): number {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return diffInMonths(this.ts, otherTs);
  }

  diffInWeeks(other: NativeDateChain | number): number {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return diffInWeeks(this.ts, otherTs);
  }

  diffInDays(other: NativeDateChain | number): number {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return diffInDays(this.ts, otherTs);
  }

  diffInHours(other: NativeDateChain | number): number {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return diffInHours(this.ts, otherTs);
  }

  diffInMinutes(other: NativeDateChain | number): number {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return diffInMinutes(this.ts, otherTs);
  }

  diffInSeconds(other: NativeDateChain | number): number {
    const otherTs = typeof other === 'number' ? other : other.ts;
    return diffInSeconds(this.ts, otherTs);
  }

  // Clone
  clone(): NativeDateChain {
    return new NativeDateChain(this.ts);
  }
}

/**
 * Factory function for creating NativeDateChain instances
 * @param value - timestamp, date string, Date object, or undefined for now()
 */
export function nativeDate(value?: number | string | Date): NativeDateChain {
  if (value === undefined) {
    return NativeDateChain.now();
  }
  return NativeDateChain.from(value);
}
