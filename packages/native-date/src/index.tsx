/**
 * @bernagl/react-native-date
 *
 * Package entry point. This file is a pure barrel: every function lives in a
 * focused module and nothing native runs at import time (the HybridObject is
 * created lazily on first use, see `./native`).
 */

// Types
export type {
  DateComponents,
  LocaleInfo,
  NativeDate,
  TimeUnit,
} from './NativeDate.nitro';
export type { DateInput } from './types';
export type { Timezone } from './timezone';
export type { AvailableLocalesMap, Locale } from './locale';
export type { FormatDistanceOptions } from './format';

// Native binding (advanced / internal)
export { NativeDateModule } from './native';

// Clock
export { now } from './now';

// Parsing and construction
export { parse, parseFormat, tryParse, tryParseFormat } from './parse';
export { fromComponents } from './components';

// Formatting
export {
  format,
  formatDate,
  formatDateTime,
  formatDistance,
  formatDuration,
  formatUTC,
  toISOString,
} from './format';

// Getters
export {
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

// Predicates
export {
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

// Arithmetic
export {
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

// Comparisons
export { clamp, isAfter, isBefore, isSame, max, min } from './compare';

// Boundaries
export {
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

// Setters
export {
  setDate,
  setHours,
  setMilliseconds,
  setMinutes,
  setMonth,
  setSeconds,
  setYear,
} from './setters';

// Timezones
export { isValidTimezone } from './timezone';
export {
  endOfDayInTz,
  formatDateInTimezone,
  formatDateTimeInTimezone,
  formatInTimezone,
  formatInUTC,
  getAvailableTimezones,
  getOffsetInTimezone,
  getTimezone,
  getTimezoneOffset,
  getTimezoneOffsetForTimestamp,
  isSameDayInTz,
  isSameMonthInTz,
  isSameYearInTz,
  isTodayInTz,
  isTomorrowInTz,
  isYesterdayInTz,
  startOfDayInTz,
  toTimezone,
  toUTC,
} from './zones';

// Locale
export {
  getAvailableLocales,
  getAvailableLocalesInfo,
  getLocale,
  getLocaleDisplayName,
  getLocaleInfo,
  setLocale,
} from './locale';

// Async batch operations
export {
  formatManyAsync,
  getComponentsManyAsync,
  parseManyAsync,
} from './async';

// Chainable API (re-exported for backwards compatibility).
// Import from '@bernagl/react-native-date/chain' to skip the functional barrel.
export { NativeDateChain, nativeDate } from './chain';
