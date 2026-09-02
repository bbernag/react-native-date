import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  // Core
  now,
  parse,
  tryParse,
  parseFormat,
  tryParseFormat,
  fromComponents,
  NativeDateModule,
  format,
  formatUTC,
  // Getters
  getComponents,
  getYear,
  getMonth,
  getDate,
  getDay,
  getHours,
  getMinutes,
  getSeconds,
  getMilliseconds,
  // Date Info
  getDaysInMonth,
  isLeapYear,
  isWeekend,
  isValid,
  // Arithmetic
  add,
  subtract,
  addDays,
  addMonths,
  addYears,
  addWeeks,
  addHours,
  addMinutes,
  addSeconds,
  subDays,
  subMonths,
  subYears,
  subWeeks,
  subHours,
  subMinutes,
  subSeconds,
  // Comparisons
  isBefore,
  isAfter,
  isSame,
  // Predicates
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  isSameDay,
  isSameMonth,
  isSameYear,
  // Helpers
  startOf,
  endOf,
  diff,
  clamp,
  min,
  max,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfWeek,
  endOfWeek,
  // Diffs
  diffInDays,
  diffInMonths,
  diffInYears,
  diffInWeeks,
  diffInHours,
  // Timezone
  getTimezone,
  getTimezoneOffset,
  getTimezoneOffsetForTimestamp,
  getOffsetInTimezone,
  formatInTimezone,
  getAvailableTimezones,
  isValidTimezone,
  // Timezone-aware predicates
  isTodayInTz,
  isTomorrowInTz,
  isYesterdayInTz,
  isSameDayInTz,
  isSameMonthInTz,
  isSameYearInTz,
  startOfDayInTz,
  endOfDayInTz,
  // Locale
  getLocale,
  setLocale,
  getAvailableLocales,
  getLocaleDisplayName,
  getLocaleInfo,
  // Setters
  setYear,
  setMonth,
  setDate,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  // Formatting
  toISOString,
  formatDate,
  formatDateTime,
  formatDateInTimezone,
  formatDateTimeInTimezone,
  // Relative
  formatDistance,
  formatDuration,
  // Async
  parseManyAsync,
  formatManyAsync,
  getComponentsManyAsync,
} from '@bernagl/react-native-date';

type TestResult = {
  name: string;
  passed: boolean | null;
  expected: string;
  actual: string;
  error?: string;
};

type TestCase = {
  name: string;
  test: () => boolean | Promise<boolean>;
  expected: string;
  getActual: () => string | Promise<string>;
};

type TestCategory = {
  name: string;
  tests: TestCase[];
};

const TABS = [
  'Core',
  'Getters',
  'Info',
  'Arithmetic',
  'Compare',
  'Predicates',
  'Helpers',
  'Timezone',
  'Setters',
  'Async',
] as const;

type TabName = (typeof TABS)[number];

// Local wall-clock fixtures are TZ-stable for getters/arithmetic. UTC instants
// are formatted with formatInTimezone(..., 'UTC') so the screen does not depend
// on the device zone (H-04).
const TEST_TS = parse('2024-06-15T14:30:45.123');
const UTC_TS = parse('2024-06-15T14:30:45.123Z');
const EARLIER_TS = parse('2024-06-10T10:00:00.000Z');
const LATER_TS = parse('2024-06-20T18:00:00.000Z');

const utcText = (ts: number, pattern: string) =>
  formatInTimezone(ts, pattern, 'UTC');

const didThrow = (fn: () => unknown): boolean => {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
};

const durationIncludesUnit = (value: string, amount: number, unit: 'd' | 'h') =>
  value.replace(/[,\s]/g, '').startsWith(`${amount}${unit}`);

function createTestCategories(): Record<TabName, TestCategory> {
  return {
    Core: {
      name: 'Core Functions',
      tests: [
        // now()
        {
          name: 'now() returns a finite timestamp',
          test: () => Number.isFinite(now()),
          expected: 'finite number',
          getActual: () => String(now()),
        },
        {
          name: 'now() returns recent timestamp',
          test: () => Math.abs(now() - Date.now()) < 1000,
          expected: 'within 1s of Date.now()',
          getActual: () => `diff: ${Math.abs(now() - Date.now())}ms`,
        },
        // parse()
        {
          name: 'parse() ISO string',
          test: () => parse('2024-06-15T12:00:00Z') === 1718452800000,
          expected: '1718452800000',
          getActual: () => String(parse('2024-06-15T12:00:00Z')),
        },
        {
          name: 'parse() date only is local midnight',
          test: () => {
            const ts = parse('2024-06-15');
            const c = getComponents(ts);
            return (
              c.year === 2024 &&
              c.month === 6 &&
              c.day === 15 &&
              c.hour === 0 &&
              c.minute === 0
            );
          },
          expected: '2024-06-15 00:00 local',
          getActual: () => format(parse('2024-06-15'), 'yyyy-MM-dd HH:mm'),
        },
        {
          name: "parse('not-a-date') throws",
          test: () => didThrow(() => parse('not-a-date')),
          expected: 'throws',
          getActual: () =>
            didThrow(() => parse('not-a-date')) ? 'throws' : 'did not throw',
        },
        {
          name: "parse('2024-01-15T14:30Z') is 14:30 UTC",
          test: () =>
            parse('2024-01-15T14:30Z') === Date.UTC(2024, 0, 15, 14, 30),
          expected: String(Date.UTC(2024, 0, 15, 14, 30)),
          getActual: () => String(parse('2024-01-15T14:30Z')),
        },
        {
          name: 'parse() with timezone offset',
          test: () => parse('2024-06-15T12:00:00+05:30') === 1718433000000,
          expected: '1718433000000',
          getActual: () => String(parse('2024-06-15T12:00:00+05:30')),
        },
        // tryParse()
        {
          name: 'tryParse() valid string',
          test: () => tryParse('2024-06-15T12:00:00Z') === 1718452800000,
          expected: '1718452800000',
          getActual: () => String(tryParse('2024-06-15T12:00:00Z')),
        },
        {
          name: 'tryParse() invalid returns null',
          test: () => tryParse('invalid-date') === null,
          expected: 'null',
          getActual: () => String(tryParse('invalid-date')),
        },
        // parseFormat()
        {
          name: 'parseFormat() MM/dd/yyyy',
          test: () => {
            const result = parseFormat('06/15/2024', 'MM/dd/yyyy');
            return getMonth(result) === 6 && getDate(result) === 15;
          },
          expected: 'month=6, day=15',
          getActual: () => {
            const r = parseFormat('06/15/2024', 'MM/dd/yyyy');
            return `month=${getMonth(r)}, day=${getDate(r)}`;
          },
        },
        {
          name: 'parseFormat() dd-MM-yyyy HH:mm',
          test: () => {
            const result = parseFormat('15-06-2024 14:30', 'dd-MM-yyyy HH:mm');
            return getHours(result) === 14 && getMinutes(result) === 30;
          },
          expected: 'hours=14, minutes=30',
          getActual: () => {
            const r = parseFormat('15-06-2024 14:30', 'dd-MM-yyyy HH:mm');
            return `hours=${getHours(r)}, minutes=${getMinutes(r)}`;
          },
        },
        // tryParseFormat()
        {
          name: 'tryParseFormat() valid',
          test: () => tryParseFormat('06/15/2024', 'MM/dd/yyyy') !== null,
          expected: 'not null',
          getActual: () =>
            tryParseFormat('06/15/2024', 'MM/dd/yyyy') !== null
              ? 'not null'
              : 'null',
        },
        {
          name: 'tryParseFormat() invalid returns null',
          test: () => tryParseFormat('invalid', 'MM/dd/yyyy') === null,
          expected: 'null',
          getActual: () => String(tryParseFormat('invalid', 'MM/dd/yyyy')),
        },
        {
          name: "tryParseFormat('12/25', 'MM/dd/yyyy') is null",
          test: () => tryParseFormat('12/25', 'MM/dd/yyyy') === null,
          expected: 'null',
          getActual: () => String(tryParseFormat('12/25', 'MM/dd/yyyy')),
        },
        {
          name: "parseFormat('2024', 'yyyy-MM-dd') throws",
          test: () => didThrow(() => parseFormat('2024', 'yyyy-MM-dd')),
          expected: 'throws',
          getActual: () =>
            didThrow(() => parseFormat('2024', 'yyyy-MM-dd'))
              ? 'throws'
              : 'did not throw',
        },
        // fromComponents()
        {
          name: 'fromComponents() basic',
          test: () => {
            const ts = fromComponents({
              year: 2024,
              month: 6,
              day: 15,
              hour: 12,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            return getYear(ts) === 2024 && getMonth(ts) === 6;
          },
          expected: 'year=2024, month=6',
          getActual: () => {
            const ts = fromComponents({
              year: 2024,
              month: 6,
              day: 15,
              hour: 12,
              minute: 0,
              second: 0,
              millisecond: 0,
            });
            return `year=${getYear(ts)}, month=${getMonth(ts)}`;
          },
        },
        // format()
        {
          name: 'format() yyyy-MM-dd',
          test: () => format(TEST_TS, 'yyyy-MM-dd') === '2024-06-15',
          expected: '2024-06-15',
          getActual: () => format(TEST_TS, 'yyyy-MM-dd'),
        },
        {
          name: 'format() HH:mm:ss',
          test: () => format(TEST_TS, 'HH:mm:ss') === '14:30:45',
          expected: '14:30:45',
          getActual: () => format(TEST_TS, 'HH:mm:ss'),
        },
        {
          name: 'format() full pattern',
          test: () =>
            format(TEST_TS, 'yyyy-MM-dd HH:mm:ss.SSS') ===
            '2024-06-15 14:30:45.123',
          expected: '2024-06-15 14:30:45.123',
          getActual: () => format(TEST_TS, 'yyyy-MM-dd HH:mm:ss.SSS'),
        },
        {
          name: 'formatUTC() of a UTC instant via formatInTimezone',
          test: () =>
            utcText(UTC_TS, 'yyyy-MM-dd HH:mm:ss') === '2024-06-15 14:30:45',
          expected: '2024-06-15 14:30:45',
          getActual: () => utcText(UTC_TS, 'yyyy-MM-dd HH:mm:ss'),
        },
        // formatUTC()
        {
          name: 'formatUTC() yyyy-MM-dd',
          test: () => formatUTC(UTC_TS, 'yyyy-MM-dd') === '2024-06-15',
          expected: '2024-06-15',
          getActual: () => formatUTC(UTC_TS, 'yyyy-MM-dd'),
        },
        {
          name: 'formatUTC() HH:mm:ss',
          test: () => formatUTC(UTC_TS, 'HH:mm:ss') === '14:30:45',
          expected: '14:30:45',
          getActual: () => formatUTC(UTC_TS, 'HH:mm:ss'),
        },
      ],
    },
    Getters: {
      name: 'Getter Functions',
      tests: [
        // getComponents()
        {
          name: 'getComponents() returns object',
          test: () => {
            const c = getComponents(TEST_TS);
            return c.year === 2024 && c.month === 6 && c.day === 15;
          },
          expected: 'year=2024, month=6, day=15',
          getActual: () => {
            const c = getComponents(TEST_TS);
            return `{year: ${c.year}, month: ${c.month}, day: ${c.day}}`;
          },
        },
        {
          name: 'getComponents() year correct',
          test: () => getComponents(TEST_TS).year === 2024,
          expected: '2024',
          getActual: () => String(getComponents(TEST_TS).year),
        },
        {
          name: 'getComponents() month correct (1-indexed)',
          test: () => getComponents(TEST_TS).month === 6,
          expected: '6',
          getActual: () => String(getComponents(TEST_TS).month),
        },
        {
          name: 'getComponents() dayOfWeek correct',
          test: () => getComponents(TEST_TS).dayOfWeek === 6, // Saturday
          expected: '6 (Saturday)',
          getActual: () => String(getComponents(TEST_TS).dayOfWeek),
        },
        // getYear()
        {
          name: 'getYear() returns 2024',
          test: () => getYear(TEST_TS) === 2024,
          expected: '2024',
          getActual: () => String(getYear(TEST_TS)),
        },
        {
          name: 'getYear() different year',
          test: () => getYear(parse('2023-01-01')) === 2023,
          expected: '2023',
          getActual: () => String(getYear(parse('2023-01-01'))),
        },
        // getMonth()
        {
          name: 'getMonth() returns 6 (June)',
          test: () => getMonth(TEST_TS) === 6,
          expected: '6',
          getActual: () => String(getMonth(TEST_TS)),
        },
        {
          name: 'getMonth() January = 1',
          test: () => getMonth(parse('2024-01-15')) === 1,
          expected: '1',
          getActual: () => String(getMonth(parse('2024-01-15'))),
        },
        {
          name: 'getMonth() December = 12',
          test: () => getMonth(parse('2024-12-15')) === 12,
          expected: '12',
          getActual: () => String(getMonth(parse('2024-12-15'))),
        },
        // getDate()
        {
          name: 'getDate() returns 15',
          test: () => getDate(TEST_TS) === 15,
          expected: '15',
          getActual: () => String(getDate(TEST_TS)),
        },
        {
          name: 'getDate() first of month',
          test: () => getDate(parse('2024-06-01')) === 1,
          expected: '1',
          getActual: () => String(getDate(parse('2024-06-01'))),
        },
        {
          name: 'getDate() last of month',
          test: () => getDate(parse('2024-06-30')) === 30,
          expected: '30',
          getActual: () => String(getDate(parse('2024-06-30'))),
        },
        // getDay()
        {
          name: 'getDay() Saturday = 6',
          test: () => getDay(TEST_TS) === 6,
          expected: '6',
          getActual: () => String(getDay(TEST_TS)),
        },
        {
          name: 'getDay() Sunday = 0',
          test: () => getDay(parse('2024-06-16')) === 0,
          expected: '0',
          getActual: () => String(getDay(parse('2024-06-16'))),
        },
        // getHours()
        {
          name: 'getHours() is 14',
          test: () => getHours(TEST_TS) === 14,
          expected: '14',
          getActual: () => String(getHours(TEST_TS)),
        },
        {
          name: 'getMinutes() is 30',
          test: () => getMinutes(TEST_TS) === 30,
          expected: '30',
          getActual: () => String(getMinutes(TEST_TS)),
        },
        {
          name: 'getSeconds() is 45',
          test: () => getSeconds(TEST_TS) === 45,
          expected: '45',
          getActual: () => String(getSeconds(TEST_TS)),
        },
        {
          name: 'getMilliseconds() is 123',
          test: () => getMilliseconds(TEST_TS) === 123,
          expected: '123',
          getActual: () => String(getMilliseconds(TEST_TS)),
        },
        {
          name: 'getMilliseconds(-1) is 999',
          test: () => getMilliseconds(-1) === 999,
          expected: '999',
          getActual: () => String(getMilliseconds(-1)),
        },
      ],
    },
    Info: {
      name: 'Date Info Functions',
      tests: [
        // getDaysInMonth()
        {
          name: 'getDaysInMonth() June = 30',
          test: () => getDaysInMonth(TEST_TS) === 30,
          expected: '30',
          getActual: () => String(getDaysInMonth(TEST_TS)),
        },
        {
          name: 'getDaysInMonth() January = 31',
          test: () => getDaysInMonth(parse('2024-01-15')) === 31,
          expected: '31',
          getActual: () => String(getDaysInMonth(parse('2024-01-15'))),
        },
        {
          name: 'getDaysInMonth() Feb leap year = 29',
          test: () => getDaysInMonth(parse('2024-02-15')) === 29,
          expected: '29',
          getActual: () => String(getDaysInMonth(parse('2024-02-15'))),
        },
        {
          name: 'getDaysInMonth() Feb non-leap = 28',
          test: () => getDaysInMonth(parse('2023-02-15')) === 28,
          expected: '28',
          getActual: () => String(getDaysInMonth(parse('2023-02-15'))),
        },
        // isLeapYear()
        {
          name: 'isLeapYear() 2024 = true',
          test: () => isLeapYear(parse('2024-01-01')) === true,
          expected: 'true',
          getActual: () => String(isLeapYear(parse('2024-01-01'))),
        },
        {
          name: 'isLeapYear() 2023 = false',
          test: () => isLeapYear(parse('2023-01-01')) === false,
          expected: 'false',
          getActual: () => String(isLeapYear(parse('2023-01-01'))),
        },
        {
          name: 'isLeapYear() 2000 = true',
          test: () => isLeapYear(parse('2000-01-01')) === true,
          expected: 'true',
          getActual: () => String(isLeapYear(parse('2000-01-01'))),
        },
        {
          name: 'isLeapYear() 1900 = false',
          test: () => isLeapYear(parse('1900-01-01')) === false,
          expected: 'false',
          getActual: () => String(isLeapYear(parse('1900-01-01'))),
        },
        // isWeekend()
        {
          name: 'isWeekend() Saturday = true',
          test: () => isWeekend(TEST_TS) === true, // June 15, 2024 is Saturday
          expected: 'true',
          getActual: () => String(isWeekend(TEST_TS)),
        },
        {
          name: 'isWeekend() Sunday = true',
          test: () => isWeekend(parse('2024-06-16')) === true,
          expected: 'true',
          getActual: () => String(isWeekend(parse('2024-06-16'))),
        },
        {
          name: 'isWeekend() Monday = false',
          test: () => isWeekend(parse('2024-06-17')) === false,
          expected: 'false',
          getActual: () => String(isWeekend(parse('2024-06-17'))),
        },
        {
          name: 'isWeekend() Friday = false',
          test: () => isWeekend(parse('2024-06-14')) === false,
          expected: 'false',
          getActual: () => String(isWeekend(parse('2024-06-14'))),
        },
        // isValid()
        {
          name: 'isValid() valid timestamp = true',
          test: () => isValid(TEST_TS) === true,
          expected: 'true',
          getActual: () => String(isValid(TEST_TS)),
        },
        {
          name: 'isValid() NaN = false',
          test: () => isValid(NaN) === false,
          expected: 'false',
          getActual: () => String(isValid(NaN)),
        },
        {
          name: 'isValid() Infinity = false',
          test: () => isValid(Infinity) === false,
          expected: 'false',
          getActual: () => String(isValid(Infinity)),
        },
        {
          name: 'isValid() out of range = false',
          test: () => isValid(8.64e15 + 1) === false,
          expected: 'false',
          getActual: () => String(isValid(8.64e15 + 1)),
        },
      ],
    },
    Arithmetic: {
      name: 'Arithmetic Functions',
      tests: [
        // add()
        {
          name: 'add() 1 day',
          test: () => {
            const result = add(TEST_TS, 1, 'day');
            return getDate(result) === 16;
          },
          expected: 'day = 16',
          getActual: () => String(getDate(add(TEST_TS, 1, 'day'))),
        },
        {
          name: 'add() 1 month',
          test: () => {
            const result = add(TEST_TS, 1, 'month');
            return getMonth(result) === 7;
          },
          expected: 'month = 7',
          getActual: () => String(getMonth(add(TEST_TS, 1, 'month'))),
        },
        {
          name: 'addMonths() Jan 31 clamps to Feb 29',
          test: () => {
            const result = addMonths(parse('2024-01-31T12:00:00'), 1);
            return getMonth(result) === 2 && getDate(result) === 29;
          },
          expected: '2024-02-29',
          getActual: () =>
            format(addMonths(parse('2024-01-31T12:00:00'), 1), 'yyyy-MM-dd'),
        },
        {
          name: 'addMonths(ts, 1.5) throws',
          test: () => didThrow(() => addMonths(TEST_TS, 1.5)),
          expected: 'throws',
          getActual: () =>
            didThrow(() => addMonths(TEST_TS, 1.5))
              ? 'throws'
              : 'did not throw',
        },
        {
          name: 'NY DST add day keeps midnight',
          test: () => {
            const start = parse('2024-03-10T00:00:00');
            const next = addDays(start, 1);
            return getDate(next) === 11 && getHours(next) === 0;
          },
          expected: '2024-03-11 00:00',
          getActual: () =>
            format(
              addDays(parse('2024-03-10T00:00:00'), 1),
              'yyyy-MM-dd HH:mm'
            ),
        },
        {
          name: 'add() 1 year',
          test: () => {
            const result = add(TEST_TS, 1, 'year');
            return getYear(result) === 2025;
          },
          expected: 'year = 2025',
          getActual: () => String(getYear(add(TEST_TS, 1, 'year'))),
        },
        {
          name: 'add() 1 hour',
          test: () => {
            const result = add(TEST_TS, 1, 'hour');
            return result - TEST_TS === 3600000;
          },
          expected: 'diff = 3600000ms',
          getActual: () => String(add(TEST_TS, 1, 'hour') - TEST_TS),
        },
        // subtract()
        {
          name: 'subtract() 1 day',
          test: () => {
            const result = subtract(TEST_TS, 1, 'day');
            return getDate(result) === 14;
          },
          expected: 'day = 14',
          getActual: () => String(getDate(subtract(TEST_TS, 1, 'day'))),
        },
        {
          name: 'subtract() 1 month',
          test: () => {
            const result = subtract(TEST_TS, 1, 'month');
            return getMonth(result) === 5;
          },
          expected: 'month = 5',
          getActual: () => String(getMonth(subtract(TEST_TS, 1, 'month'))),
        },
        // addDays/subDays
        {
          name: 'addDays() 5 days',
          test: () => getDate(addDays(TEST_TS, 5)) === 20,
          expected: 'day = 20',
          getActual: () => String(getDate(addDays(TEST_TS, 5))),
        },
        {
          name: 'subDays() 5 days',
          test: () => getDate(subDays(TEST_TS, 5)) === 10,
          expected: 'day = 10',
          getActual: () => String(getDate(subDays(TEST_TS, 5))),
        },
        // addMonths/subMonths
        {
          name: 'addMonths() 3 months',
          test: () => getMonth(addMonths(TEST_TS, 3)) === 9,
          expected: 'month = 9',
          getActual: () => String(getMonth(addMonths(TEST_TS, 3))),
        },
        {
          name: 'subMonths() 3 months',
          test: () => getMonth(subMonths(TEST_TS, 3)) === 3,
          expected: 'month = 3',
          getActual: () => String(getMonth(subMonths(TEST_TS, 3))),
        },
        // addYears/subYears
        {
          name: 'addYears() 2 years',
          test: () => getYear(addYears(TEST_TS, 2)) === 2026,
          expected: 'year = 2026',
          getActual: () => String(getYear(addYears(TEST_TS, 2))),
        },
        {
          name: 'subYears() 2 years',
          test: () => getYear(subYears(TEST_TS, 2)) === 2022,
          expected: 'year = 2022',
          getActual: () => String(getYear(subYears(TEST_TS, 2))),
        },
        // addWeeks/subWeeks
        {
          name: 'addWeeks() 1 week',
          test: () => getDate(addWeeks(TEST_TS, 1)) === 22,
          expected: 'day = 22',
          getActual: () => String(getDate(addWeeks(TEST_TS, 1))),
        },
        {
          name: 'subWeeks() 1 week',
          test: () => getDate(subWeeks(TEST_TS, 1)) === 8,
          expected: 'day = 8',
          getActual: () => String(getDate(subWeeks(TEST_TS, 1))),
        },
        // addHours/subHours
        {
          name: 'addHours() 2 hours',
          test: () => add(TEST_TS, 2, 'hour') - TEST_TS === 7200000,
          expected: 'diff = 7200000ms',
          getActual: () => String(addHours(TEST_TS, 2) - TEST_TS),
        },
        {
          name: 'subHours() 2 hours',
          test: () => TEST_TS - subHours(TEST_TS, 2) === 7200000,
          expected: 'diff = 7200000ms',
          getActual: () => String(TEST_TS - subHours(TEST_TS, 2)),
        },
        // addMinutes/subMinutes
        {
          name: 'addMinutes() 30 minutes',
          test: () => addMinutes(TEST_TS, 30) - TEST_TS === 1800000,
          expected: 'diff = 1800000ms',
          getActual: () => String(addMinutes(TEST_TS, 30) - TEST_TS),
        },
        {
          name: 'subMinutes() 30 minutes',
          test: () => TEST_TS - subMinutes(TEST_TS, 30) === 1800000,
          expected: 'diff = 1800000ms',
          getActual: () => String(TEST_TS - subMinutes(TEST_TS, 30)),
        },
        // addSeconds/subSeconds
        {
          name: 'addSeconds() 45 seconds',
          test: () => addSeconds(TEST_TS, 45) - TEST_TS === 45000,
          expected: 'diff = 45000ms',
          getActual: () => String(addSeconds(TEST_TS, 45) - TEST_TS),
        },
        {
          name: 'subSeconds() 45 seconds',
          test: () => TEST_TS - subSeconds(TEST_TS, 45) === 45000,
          expected: 'diff = 45000ms',
          getActual: () => String(TEST_TS - subSeconds(TEST_TS, 45)),
        },
      ],
    },
    Compare: {
      name: 'Comparison Functions',
      tests: [
        // isBefore()
        {
          name: 'isBefore() earlier < later = true',
          test: () => isBefore(EARLIER_TS, LATER_TS) === true,
          expected: 'true',
          getActual: () => String(isBefore(EARLIER_TS, LATER_TS)),
        },
        {
          name: 'isBefore() later < earlier = false',
          test: () => isBefore(LATER_TS, EARLIER_TS) === false,
          expected: 'false',
          getActual: () => String(isBefore(LATER_TS, EARLIER_TS)),
        },
        {
          name: 'isBefore() same = false',
          test: () => isBefore(TEST_TS, TEST_TS) === false,
          expected: 'false',
          getActual: () => String(isBefore(TEST_TS, TEST_TS)),
        },
        // isAfter()
        {
          name: 'isAfter() later > earlier = true',
          test: () => isAfter(LATER_TS, EARLIER_TS) === true,
          expected: 'true',
          getActual: () => String(isAfter(LATER_TS, EARLIER_TS)),
        },
        {
          name: 'isAfter() earlier > later = false',
          test: () => isAfter(EARLIER_TS, LATER_TS) === false,
          expected: 'false',
          getActual: () => String(isAfter(EARLIER_TS, LATER_TS)),
        },
        {
          name: 'isAfter() same = false',
          test: () => isAfter(TEST_TS, TEST_TS) === false,
          expected: 'false',
          getActual: () => String(isAfter(TEST_TS, TEST_TS)),
        },
        // isSame()
        {
          name: 'isSame() same timestamp day = true',
          test: () => isSame(TEST_TS, TEST_TS, 'day') === true,
          expected: 'true',
          getActual: () => String(isSame(TEST_TS, TEST_TS, 'day')),
        },
        {
          name: 'isSame() same day different time = true',
          test: () => {
            const d1 = parse('2024-06-15T10:00:00Z');
            const d2 = parse('2024-06-15T22:00:00Z');
            return isSame(d1, d2, 'day') === true;
          },
          expected: 'true',
          getActual: () => {
            const d1 = parse('2024-06-15T10:00:00Z');
            const d2 = parse('2024-06-15T22:00:00Z');
            return String(isSame(d1, d2, 'day'));
          },
        },
        {
          name: 'isSame() different days = false',
          test: () => isSame(EARLIER_TS, LATER_TS, 'day') === false,
          expected: 'false',
          getActual: () => String(isSame(EARLIER_TS, LATER_TS, 'day')),
        },
        {
          name: 'isSame() same month = true',
          test: () => isSame(EARLIER_TS, TEST_TS, 'month') === true,
          expected: 'true',
          getActual: () => String(isSame(EARLIER_TS, TEST_TS, 'month')),
        },
        {
          name: 'isSame() same year = true',
          test: () => isSame(EARLIER_TS, LATER_TS, 'year') === true,
          expected: 'true',
          getActual: () => String(isSame(EARLIER_TS, LATER_TS, 'year')),
        },
        {
          name: 'isSame() different years = false',
          test: () => {
            const d1 = parse('2024-06-15');
            const d2 = parse('2025-06-15');
            return isSame(d1, d2, 'year') === false;
          },
          expected: 'false',
          getActual: () => {
            const d1 = parse('2024-06-15');
            const d2 = parse('2025-06-15');
            return String(isSame(d1, d2, 'year'));
          },
        },
      ],
    },
    Predicates: {
      name: 'Predicate Functions',
      tests: [
        // isToday()
        {
          name: 'isToday() now = true',
          test: () => isToday(now()) === true,
          expected: 'true',
          getActual: () => String(isToday(now())),
        },
        {
          name: 'isToday() yesterday = false',
          test: () => isToday(subDays(now(), 1)) === false,
          expected: 'false',
          getActual: () => String(isToday(subDays(now(), 1))),
        },
        {
          name: 'isToday() tomorrow = false',
          test: () => isToday(addDays(now(), 1)) === false,
          expected: 'false',
          getActual: () => String(isToday(addDays(now(), 1))),
        },
        // isTomorrow()
        {
          name: 'isTomorrow() tomorrow = true',
          test: () => isTomorrow(addDays(now(), 1)) === true,
          expected: 'true',
          getActual: () => String(isTomorrow(addDays(now(), 1))),
        },
        {
          name: 'isTomorrow() today = false',
          test: () => isTomorrow(now()) === false,
          expected: 'false',
          getActual: () => String(isTomorrow(now())),
        },
        // isYesterday()
        {
          name: 'isYesterday() yesterday = true',
          test: () => isYesterday(subDays(now(), 1)) === true,
          expected: 'true',
          getActual: () => String(isYesterday(subDays(now(), 1))),
        },
        {
          name: 'isYesterday() today = false',
          test: () => isYesterday(now()) === false,
          expected: 'false',
          getActual: () => String(isYesterday(now())),
        },
        // isPast()
        {
          name: 'isPast() old date = true',
          test: () => isPast(TEST_TS) === true,
          expected: 'true',
          getActual: () => String(isPast(TEST_TS)),
        },
        {
          name: 'isPast() future date = false',
          test: () => isPast(addYears(now(), 1)) === false,
          expected: 'false',
          getActual: () => String(isPast(addYears(now(), 1))),
        },
        // isFuture()
        {
          name: 'isFuture() future date = true',
          test: () => isFuture(addYears(now(), 1)) === true,
          expected: 'true',
          getActual: () => String(isFuture(addYears(now(), 1))),
        },
        {
          name: 'isFuture() old date = false',
          test: () => isFuture(TEST_TS) === false,
          expected: 'false',
          getActual: () => String(isFuture(TEST_TS)),
        },
        // isSameDay()
        {
          name: 'isSameDay() same day = true',
          test: () => {
            const d1 = parse('2024-06-15T10:00:00Z');
            const d2 = parse('2024-06-15T22:00:00Z');
            return isSameDay(d1, d2) === true;
          },
          expected: 'true',
          getActual: () => {
            const d1 = parse('2024-06-15T10:00:00Z');
            const d2 = parse('2024-06-15T22:00:00Z');
            return String(isSameDay(d1, d2));
          },
        },
        {
          name: 'isSameDay() different days = false',
          test: () => isSameDay(EARLIER_TS, LATER_TS) === false,
          expected: 'false',
          getActual: () => String(isSameDay(EARLIER_TS, LATER_TS)),
        },
        // isSameMonth()
        {
          name: 'isSameMonth() same month = true',
          test: () => isSameMonth(EARLIER_TS, LATER_TS) === true,
          expected: 'true',
          getActual: () => String(isSameMonth(EARLIER_TS, LATER_TS)),
        },
        {
          name: 'isSameMonth() different months = false',
          test: () => {
            const d1 = parse('2024-06-15');
            const d2 = parse('2024-07-15');
            return isSameMonth(d1, d2) === false;
          },
          expected: 'false',
          getActual: () => {
            const d1 = parse('2024-06-15');
            const d2 = parse('2024-07-15');
            return String(isSameMonth(d1, d2));
          },
        },
        // isSameYear()
        {
          name: 'isSameYear() same year = true',
          test: () => isSameYear(EARLIER_TS, LATER_TS) === true,
          expected: 'true',
          getActual: () => String(isSameYear(EARLIER_TS, LATER_TS)),
        },
        {
          name: 'isSameYear() different years = false',
          test: () => {
            const d1 = parse('2024-06-15');
            const d2 = parse('2025-06-15');
            return isSameYear(d1, d2) === false;
          },
          expected: 'false',
          getActual: () => {
            const d1 = parse('2024-06-15');
            const d2 = parse('2025-06-15');
            return String(isSameYear(d1, d2));
          },
        },
      ],
    },
    Helpers: {
      name: 'Helper Functions',
      tests: [
        // startOf()
        {
          name: 'startOf() hour of 12:30 is 12:00 (local grid)',
          test: () => {
            const result = startOf(parse('2024-06-15T12:30:00'), 'hour');
            const c = getComponents(result);
            return c.hour === 12 && c.minute === 0;
          },
          expected: '12:00',
          getActual: () =>
            format(startOf(parse('2024-06-15T12:30:00'), 'hour'), 'HH:mm'),
        },
        {
          name: 'startOf() day',
          test: () => {
            const result = startOf(TEST_TS, 'day');
            const c = getComponents(result);
            return c.hour === 0 && c.minute === 0 && c.second === 0;
          },
          expected: '00:00:00',
          getActual: () => {
            const c = getComponents(startOf(TEST_TS, 'day'));
            return `${c.hour}:${c.minute}:${c.second}`;
          },
        },
        {
          name: 'startOf() month',
          test: () => getDate(startOf(TEST_TS, 'month')) === 1,
          expected: 'day = 1',
          getActual: () => String(getDate(startOf(TEST_TS, 'month'))),
        },
        {
          name: 'startOf() year',
          test: () => {
            const result = startOf(TEST_TS, 'year');
            return getMonth(result) === 1 && getDate(result) === 1;
          },
          expected: 'month=1, day=1',
          getActual: () => {
            const r = startOf(TEST_TS, 'year');
            return `month=${getMonth(r)}, day=${getDate(r)}`;
          },
        },
        // endOf()
        {
          name: 'endOf() day',
          test: () => {
            const result = endOf(TEST_TS, 'day');
            const c = getComponents(result);
            return c.hour === 23 && c.minute === 59 && c.second === 59;
          },
          expected: '23:59:59',
          getActual: () => {
            const c = getComponents(endOf(TEST_TS, 'day'));
            return `${c.hour}:${c.minute}:${c.second}`;
          },
        },
        {
          name: 'endOf() month June = 30',
          test: () => getDate(endOf(TEST_TS, 'month')) === 30,
          expected: 'day = 30',
          getActual: () => String(getDate(endOf(TEST_TS, 'month'))),
        },
        {
          name: 'endOf() year',
          test: () => {
            const result = endOf(TEST_TS, 'year');
            return getMonth(result) === 12 && getDate(result) === 31;
          },
          expected: 'month=12, day=31',
          getActual: () => {
            const r = endOf(TEST_TS, 'year');
            return `month=${getMonth(r)}, day=${getDate(r)}`;
          },
        },
        // startOfDay/endOfDay
        {
          name: 'startOfDay()',
          test: () => {
            const c = getComponents(startOfDay(TEST_TS));
            return c.hour === 0 && c.minute === 0;
          },
          expected: '00:00',
          getActual: () => {
            const c = getComponents(startOfDay(TEST_TS));
            return `${c.hour}:${c.minute}`;
          },
        },
        {
          name: 'endOfDay()',
          test: () => {
            const c = getComponents(endOfDay(TEST_TS));
            return c.hour === 23 && c.minute === 59;
          },
          expected: '23:59',
          getActual: () => {
            const c = getComponents(endOfDay(TEST_TS));
            return `${c.hour}:${c.minute}`;
          },
        },
        // startOfMonth/endOfMonth
        {
          name: 'startOfMonth() June',
          test: () => getDate(startOfMonth(TEST_TS)) === 1,
          expected: 'day = 1',
          getActual: () => String(getDate(startOfMonth(TEST_TS))),
        },
        {
          name: 'startOfMonth() preserves month',
          test: () => getMonth(startOfMonth(TEST_TS)) === 6,
          expected: 'month = 6',
          getActual: () => String(getMonth(startOfMonth(TEST_TS))),
        },
        {
          name: 'startOfMonth() January (edge case)',
          test: () => {
            const jan15 = parse('2026-01-15T12:00:00');
            const start = startOfMonth(jan15);
            return (
              getMonth(start) === 1 &&
              getDate(start) === 1 &&
              getYear(start) === 2026
            );
          },
          expected: 'Jan 1, 2026',
          getActual: () => {
            const jan15 = parse('2026-01-15T12:00:00');
            const s = startOfMonth(jan15);
            return `${getMonth(s)}/${getDate(s)}, ${getYear(s)}`;
          },
        },
        {
          name: 'startOfMonth() December',
          test: () => {
            const dec15 = parse('2025-12-15T12:00:00');
            const start = startOfMonth(dec15);
            return getMonth(start) === 12 && getDate(start) === 1;
          },
          expected: 'Dec 1',
          getActual: () => {
            const dec15 = parse('2025-12-15T12:00:00');
            const s = startOfMonth(dec15);
            return `${getMonth(s)}/${getDate(s)}`;
          },
        },
        {
          name: 'endOfMonth() June',
          test: () => getDate(endOfMonth(TEST_TS)) === 30,
          expected: 'day = 30',
          getActual: () => String(getDate(endOfMonth(TEST_TS))),
        },
        {
          name: 'endOfMonth() January = 31',
          test: () => {
            const jan15 = parse('2026-01-15T12:00:00');
            return getDate(endOfMonth(jan15)) === 31;
          },
          expected: 'day = 31',
          getActual: () => {
            const jan15 = parse('2026-01-15T12:00:00');
            return String(getDate(endOfMonth(jan15)));
          },
        },
        {
          name: 'endOfMonth() February leap year = 29',
          test: () => {
            const feb15 = parse('2024-02-15T12:00:00');
            return getDate(endOfMonth(feb15)) === 29;
          },
          expected: 'day = 29',
          getActual: () => {
            const feb15 = parse('2024-02-15T12:00:00');
            return String(getDate(endOfMonth(feb15)));
          },
        },
        {
          name: 'endOfMonth() February non-leap = 28',
          test: () => {
            const feb15 = parse('2023-02-15T12:00:00');
            return getDate(endOfMonth(feb15)) === 28;
          },
          expected: 'day = 28',
          getActual: () => {
            const feb15 = parse('2023-02-15T12:00:00');
            return String(getDate(endOfMonth(feb15)));
          },
        },
        // startOfYear/endOfYear
        {
          name: 'startOfYear()',
          test: () => {
            const r = startOfYear(TEST_TS);
            return getMonth(r) === 1 && getDate(r) === 1;
          },
          expected: 'Jan 1',
          getActual: () => {
            const r = startOfYear(TEST_TS);
            return `${getMonth(r)}/${getDate(r)}`;
          },
        },
        {
          name: 'startOfYear() preserves year',
          test: () => getYear(startOfYear(TEST_TS)) === 2024,
          expected: 'year = 2024',
          getActual: () => String(getYear(startOfYear(TEST_TS))),
        },
        {
          name: 'startOfYear() 2026 January (edge case)',
          test: () => {
            const jan15 = parse('2026-01-15T12:00:00');
            const start = startOfYear(jan15);
            return (
              getYear(start) === 2026 &&
              getMonth(start) === 1 &&
              getDate(start) === 1
            );
          },
          expected: 'Jan 1, 2026',
          getActual: () => {
            const jan15 = parse('2026-01-15T12:00:00');
            const s = startOfYear(jan15);
            return `${getMonth(s)}/${getDate(s)}, ${getYear(s)}`;
          },
        },
        {
          name: 'endOfYear()',
          test: () => {
            const r = endOfYear(TEST_TS);
            return getMonth(r) === 12 && getDate(r) === 31;
          },
          expected: 'Dec 31',
          getActual: () => {
            const r = endOfYear(TEST_TS);
            return `${getMonth(r)}/${getDate(r)}`;
          },
        },
        {
          name: 'endOfYear() preserves year',
          test: () => getYear(endOfYear(TEST_TS)) === 2024,
          expected: 'year = 2024',
          getActual: () => String(getYear(endOfYear(TEST_TS))),
        },
        {
          name: 'endOfYear() time = 23:59:59',
          test: () => {
            const c = getComponents(endOfYear(TEST_TS));
            return c.hour === 23 && c.minute === 59 && c.second === 59;
          },
          expected: '23:59:59',
          getActual: () => {
            const c = getComponents(endOfYear(TEST_TS));
            return `${c.hour}:${c.minute}:${c.second}`;
          },
        },
        // startOfWeek/endOfWeek
        {
          name: 'startOfWeek() returns Sunday',
          test: () => getDay(startOfWeek(TEST_TS)) === 0,
          expected: 'day = 0 (Sunday)',
          getActual: () => String(getDay(startOfWeek(TEST_TS))),
        },
        {
          name: 'endOfWeek() returns Saturday',
          test: () => getDay(endOfWeek(TEST_TS)) === 6,
          expected: 'day = 6 (Saturday)',
          getActual: () => String(getDay(endOfWeek(TEST_TS))),
        },
        // diff()
        {
          name: 'diff() 10 days',
          test: () => {
            const d = diff(LATER_TS, EARLIER_TS, 'day');
            return d === 10;
          },
          expected: '10',
          getActual: () => String(diff(LATER_TS, EARLIER_TS, 'day')),
        },
        // diffInDays/diffInMonths/etc
        {
          name: 'diffInDays()',
          test: () => diffInDays(LATER_TS, EARLIER_TS) === 10,
          expected: '10',
          getActual: () => String(diffInDays(LATER_TS, EARLIER_TS)),
        },
        {
          name: 'diffInMonths() same month',
          test: () => diffInMonths(LATER_TS, EARLIER_TS) === 0,
          expected: '0',
          getActual: () => String(diffInMonths(LATER_TS, EARLIER_TS)),
        },
        {
          name: 'diffInYears() same year',
          test: () => diffInYears(LATER_TS, EARLIER_TS) === 0,
          expected: '0',
          getActual: () => String(diffInYears(LATER_TS, EARLIER_TS)),
        },
        {
          name: 'diffInWeeks()',
          test: () => diffInWeeks(LATER_TS, EARLIER_TS) === 1,
          expected: '1',
          getActual: () => String(diffInWeeks(LATER_TS, EARLIER_TS)),
        },
        {
          name: 'diffInHours() 240 hours',
          test: () => diffInHours(LATER_TS, EARLIER_TS) === 248,
          expected: '248',
          getActual: () => String(diffInHours(LATER_TS, EARLIER_TS)),
        },
        // clamp()
        {
          name: 'clamp() within range',
          test: () => clamp(TEST_TS, EARLIER_TS, LATER_TS) === TEST_TS,
          expected: 'unchanged',
          getActual: () =>
            clamp(TEST_TS, EARLIER_TS, LATER_TS) === TEST_TS
              ? 'unchanged'
              : 'changed',
        },
        {
          name: 'clamp() below min',
          test: () => clamp(EARLIER_TS, TEST_TS, LATER_TS) === TEST_TS,
          expected: 'clamped to min',
          getActual: () =>
            clamp(EARLIER_TS, TEST_TS, LATER_TS) === TEST_TS
              ? 'clamped to min'
              : 'not clamped',
        },
        {
          name: 'clamp() above max',
          test: () => clamp(LATER_TS, EARLIER_TS, TEST_TS) === TEST_TS,
          expected: 'clamped to max',
          getActual: () =>
            clamp(LATER_TS, EARLIER_TS, TEST_TS) === TEST_TS
              ? 'clamped to max'
              : 'not clamped',
        },
        // min/max
        {
          name: 'min() returns earliest',
          test: () => min([TEST_TS, LATER_TS, EARLIER_TS]) === EARLIER_TS,
          expected: 'earliest date',
          getActual: () =>
            min([TEST_TS, LATER_TS, EARLIER_TS]) === EARLIER_TS
              ? 'earliest date'
              : 'wrong',
        },
        {
          name: 'max() returns latest',
          test: () => max([TEST_TS, LATER_TS, EARLIER_TS]) === LATER_TS,
          expected: 'latest date',
          getActual: () =>
            max([TEST_TS, LATER_TS, EARLIER_TS]) === LATER_TS
              ? 'latest date'
              : 'wrong',
        },
        // formatDistance
        {
          name: 'formatDistance() past',
          test: () =>
            formatDistance(EARLIER_TS, LATER_TS, true).endsWith('ago'),
          expected: 'ends with "ago"',
          getActual: () => formatDistance(EARLIER_TS, LATER_TS, true),
        },
        {
          name: 'formatDistance() future',
          test: () =>
            formatDistance(LATER_TS, EARLIER_TS, true).startsWith('in '),
          expected: 'starts with "in "',
          getActual: () => formatDistance(LATER_TS, EARLIER_TS, true),
        },
        {
          name: 'formatDistance(..., false) has no direction words',
          test: () => {
            const result = formatDistance(EARLIER_TS, LATER_TS, false);
            return !result.includes('ago') && !result.startsWith('in ');
          },
          expected: 'bare quantity',
          getActual: () => formatDistance(EARLIER_TS, LATER_TS, false),
        },
        // formatDuration
        {
          name: 'formatDuration() 1 hour',
          test: () => durationIncludesUnit(formatDuration(3600000), 1, 'h'),
          expected: 'starts with 1 hour unit',
          getActual: () => formatDuration(3600000),
        },
        {
          name: 'formatDuration() 1 day',
          test: () => durationIncludesUnit(formatDuration(86400000), 1, 'd'),
          expected: 'starts with 1 day unit',
          getActual: () => formatDuration(86400000),
        },
        // toISOString
        {
          name: 'toISOString() format',
          test: () => toISOString(UTC_TS) === '2024-06-15T14:30:45.123Z',
          expected: '2024-06-15T14:30:45.123Z',
          getActual: () => toISOString(UTC_TS),
        },
        // formatDate/formatDateTime
        {
          name: 'formatDate()',
          test: () => formatDate(TEST_TS) === '2024-06-15',
          expected: '2024-06-15',
          getActual: () => formatDate(TEST_TS),
        },
        {
          name: 'formatDateTime()',
          test: () => formatDateTime(TEST_TS) === '2024-06-15 14:30:45',
          expected: '2024-06-15 14:30:45',
          getActual: () => formatDateTime(TEST_TS),
        },
      ],
    },
    Timezone: {
      name: 'Timezone Functions',
      tests: [
        // getTimezone()
        {
          name: 'getTimezone() returns string',
          test: () => getTimezone().length > 0,
          expected: 'non-empty IANA id',
          getActual: () => getTimezone(),
        },
        {
          name: 'getTimezoneOffset() is east-positive minutes',
          test: () => {
            const offset = getTimezoneOffset();
            return offset >= -720 && offset <= 840;
          },
          expected: '-720..840',
          getActual: () => String(getTimezoneOffset()),
        },
        {
          name: 'getTimezoneOffsetForTimestamp()',
          test: () => {
            const offset = getTimezoneOffsetForTimestamp(UTC_TS);
            return offset >= -720 && offset <= 840;
          },
          expected: '-720..840',
          getActual: () => String(getTimezoneOffsetForTimestamp(UTC_TS)),
        },
        {
          name: 'getOffsetInTimezone() UTC = 0',
          test: () => getOffsetInTimezone(UTC_TS, 'UTC') === 0,
          expected: '0',
          getActual: () => String(getOffsetInTimezone(UTC_TS, 'UTC')),
        },
        {
          name: 'getOffsetInTimezone() Tokyo = 540',
          test: () => getOffsetInTimezone(UTC_TS, 'Asia/Tokyo') === 540,
          expected: '540',
          getActual: () => String(getOffsetInTimezone(UTC_TS, 'Asia/Tokyo')),
        },
        {
          name: 'getOffsetInTimezone() GMT in July = 0',
          test: () => getOffsetInTimezone(UTC_TS, 'GMT') === 0,
          expected: '0',
          getActual: () => String(getOffsetInTimezone(UTC_TS, 'GMT')),
        },
        {
          name: "formatInTimezone(..., 'America/NewYork') throws",
          test: () =>
            didThrow(() => formatInTimezone(UTC_TS, 'yyyy', 'America/NewYork')),
          expected: 'throws Invalid timezone',
          getActual: () =>
            didThrow(() => formatInTimezone(UTC_TS, 'yyyy', 'America/NewYork'))
              ? 'throws'
              : 'did not throw',
        },
        // isValidTimezone()
        {
          name: 'isValidTimezone() UTC = true',
          test: () => isValidTimezone('UTC') === true,
          expected: 'true',
          getActual: () => String(isValidTimezone('UTC')),
        },
        {
          name: 'isValidTimezone() America/New_York = true',
          test: () => isValidTimezone('America/New_York') === true,
          expected: 'true',
          getActual: () => String(isValidTimezone('America/New_York')),
        },
        {
          name: 'isValidTimezone() Invalid/Zone = false',
          test: () => isValidTimezone('Invalid/Zone') === false,
          expected: 'false',
          getActual: () => String(isValidTimezone('Invalid/Zone')),
        },
        // getAvailableTimezones()
        {
          name: 'getAvailableTimezones() returns array',
          test: () => Array.isArray(getAvailableTimezones()),
          expected: 'array',
          getActual: () => `array of ${getAvailableTimezones().length} items`,
        },
        // formatInTimezone()
        {
          name: 'formatInTimezone() UTC',
          test: () =>
            formatInTimezone(UTC_TS, 'yyyy-MM-dd HH:mm', 'UTC') ===
            '2024-06-15 14:30',
          expected: '2024-06-15 14:30',
          getActual: () => formatInTimezone(UTC_TS, 'yyyy-MM-dd HH:mm', 'UTC'),
        },
        {
          name: 'formatInTimezone() Tokyo (+9)',
          test: () =>
            formatInTimezone(UTC_TS, 'yyyy-MM-dd HH:mm', 'Asia/Tokyo') ===
            '2024-06-15 23:30',
          expected: '2024-06-15 23:30',
          getActual: () =>
            formatInTimezone(UTC_TS, 'yyyy-MM-dd HH:mm', 'Asia/Tokyo'),
        },
        // formatDateInTimezone/formatDateTimeInTimezone
        {
          name: 'formatDateInTimezone() UTC',
          test: () => formatDateInTimezone(UTC_TS, 'UTC') === '2024-06-15',
          expected: '2024-06-15',
          getActual: () => formatDateInTimezone(UTC_TS, 'UTC'),
        },
        {
          name: 'formatDateTimeInTimezone() UTC',
          test: () =>
            formatDateTimeInTimezone(UTC_TS, 'UTC') === '2024-06-15 14:30:45',
          expected: '2024-06-15 14:30:45',
          getActual: () => formatDateTimeInTimezone(UTC_TS, 'UTC'),
        },
        // isTodayInTz()
        {
          name: 'isTodayInTz() now = true',
          test: () => isTodayInTz(now(), 'UTC') === true,
          expected: 'true',
          getActual: () => String(isTodayInTz(now(), 'UTC')),
        },
        {
          name: 'isTodayInTz() yesterday = false',
          test: () => isTodayInTz(subDays(now(), 1), 'UTC') === false,
          expected: 'false',
          getActual: () => String(isTodayInTz(subDays(now(), 1), 'UTC')),
        },
        // isTomorrowInTz()
        {
          name: 'isTomorrowInTz() tomorrow = true',
          test: () => isTomorrowInTz(addDays(now(), 1), 'UTC') === true,
          expected: 'true',
          getActual: () => String(isTomorrowInTz(addDays(now(), 1), 'UTC')),
        },
        {
          name: 'isTomorrowInTz() today = false',
          test: () => isTomorrowInTz(now(), 'UTC') === false,
          expected: 'false',
          getActual: () => String(isTomorrowInTz(now(), 'UTC')),
        },
        // isYesterdayInTz()
        {
          name: 'isYesterdayInTz() yesterday = true',
          test: () => isYesterdayInTz(subDays(now(), 1), 'UTC') === true,
          expected: 'true',
          getActual: () => String(isYesterdayInTz(subDays(now(), 1), 'UTC')),
        },
        {
          name: 'isYesterdayInTz() today = false',
          test: () => isYesterdayInTz(now(), 'UTC') === false,
          expected: 'false',
          getActual: () => String(isYesterdayInTz(now(), 'UTC')),
        },
        // isSameDayInTz()
        {
          name: 'isSameDayInTz() same day UTC = true',
          test: () => {
            const d1 = parse('2024-06-15T10:00:00Z');
            const d2 = parse('2024-06-15T22:00:00Z');
            return isSameDayInTz(d1, d2, 'UTC') === true;
          },
          expected: 'true',
          getActual: () => {
            const d1 = parse('2024-06-15T10:00:00Z');
            const d2 = parse('2024-06-15T22:00:00Z');
            return String(isSameDayInTz(d1, d2, 'UTC'));
          },
        },
        {
          name: 'isSameDayInTz() cross-timezone boundary',
          test: () => {
            // 11pm UTC June 15 = 8am June 16 in Tokyo
            const d1 = parse('2024-06-15T23:00:00Z');
            const d2 = parse('2024-06-16T08:00:00Z');
            // In Tokyo both are June 16
            return isSameDayInTz(d1, d2, 'Asia/Tokyo') === true;
          },
          expected: 'true (both June 16 in Tokyo)',
          getActual: () => {
            const d1 = parse('2024-06-15T23:00:00Z');
            const d2 = parse('2024-06-16T08:00:00Z');
            return String(isSameDayInTz(d1, d2, 'Asia/Tokyo'));
          },
        },
        {
          name: 'isSameDayInTz() different in UTC',
          test: () => {
            const d1 = parse('2024-06-15T23:00:00Z');
            const d2 = parse('2024-06-16T08:00:00Z');
            return isSameDayInTz(d1, d2, 'UTC') === false;
          },
          expected: 'false (different days in UTC)',
          getActual: () => {
            const d1 = parse('2024-06-15T23:00:00Z');
            const d2 = parse('2024-06-16T08:00:00Z');
            return String(isSameDayInTz(d1, d2, 'UTC'));
          },
        },
        // isSameMonthInTz()
        {
          name: 'isSameMonthInTz() same month = true',
          test: () => {
            const d1 = parse('2024-06-01T12:00:00Z');
            const d2 = parse('2024-06-30T12:00:00Z');
            return isSameMonthInTz(d1, d2, 'UTC') === true;
          },
          expected: 'true',
          getActual: () => {
            const d1 = parse('2024-06-01T12:00:00Z');
            const d2 = parse('2024-06-30T12:00:00Z');
            return String(isSameMonthInTz(d1, d2, 'UTC'));
          },
        },
        // isSameYearInTz()
        {
          name: 'isSameYearInTz() same year = true',
          test: () => {
            const d1 = parse('2024-01-15T12:00:00Z');
            const d2 = parse('2024-12-15T12:00:00Z');
            return isSameYearInTz(d1, d2, 'UTC') === true;
          },
          expected: 'true',
          getActual: () => {
            const d1 = parse('2024-01-15T12:00:00Z');
            const d2 = parse('2024-12-15T12:00:00Z');
            return String(isSameYearInTz(d1, d2, 'UTC'));
          },
        },
        // startOfDayInTz()
        {
          name: 'startOfDayInTz() UTC midnight',
          test: () => {
            const start = startOfDayInTz(UTC_TS, 'UTC');
            const formatted = formatInTimezone(start, 'HH:mm:ss', 'UTC');
            return formatted === '00:00:00';
          },
          expected: '00:00:00',
          getActual: () => {
            const start = startOfDayInTz(UTC_TS, 'UTC');
            return formatInTimezone(start, 'HH:mm:ss', 'UTC');
          },
        },
        {
          name: 'startOfDayInTz() NY midnight = 04:00 UTC',
          test: () => {
            const start = startOfDayInTz(UTC_TS, 'America/New_York');
            const utcTime = formatInTimezone(start, 'HH:mm:ss', 'UTC');
            return utcTime === '04:00:00';
          },
          expected: '04:00:00 UTC',
          getActual: () => {
            const start = startOfDayInTz(UTC_TS, 'America/New_York');
            return formatInTimezone(start, 'HH:mm:ss', 'UTC');
          },
        },
        // endOfDayInTz()
        {
          name: 'endOfDayInTz() UTC',
          test: () => {
            const end = endOfDayInTz(UTC_TS, 'UTC');
            const formatted = formatInTimezone(end, 'HH:mm:ss', 'UTC');
            return formatted === '23:59:59';
          },
          expected: '23:59:59',
          getActual: () => {
            const end = endOfDayInTz(UTC_TS, 'UTC');
            return formatInTimezone(end, 'HH:mm:ss', 'UTC');
          },
        },
        {
          name: 'endOfDayInTz() 1ms before next start',
          test: () => {
            const end = endOfDayInTz(UTC_TS, 'UTC');
            const nextStart = startOfDayInTz(addDays(UTC_TS, 1), 'UTC');
            return nextStart - end === 1;
          },
          expected: 'diff = 1ms',
          getActual: () => {
            const end = endOfDayInTz(UTC_TS, 'UTC');
            const nextStart = startOfDayInTz(addDays(UTC_TS, 1), 'UTC');
            return `diff = ${nextStart - end}ms`;
          },
        },
        // Locale
        {
          name: 'getLocale() returns string',
          test: () => getLocale().length > 0,
          expected: 'non-empty locale tag',
          getActual: () => getLocale(),
        },
        {
          name: 'getAvailableLocales() returns object',
          test: () => Object.keys(getAvailableLocales()).length > 0,
          expected: 'non-empty locale map',
          getActual: () =>
            `${Object.keys(getAvailableLocales()).length} locales`,
        },
        {
          name: 'getLocaleDisplayName() en',
          test: () =>
            getLocaleDisplayName('en').toLowerCase().includes('english'),
          expected: 'contains "english"',
          getActual: () => getLocaleDisplayName('en'),
        },
        {
          name: "setLocale('ja') + MMMM",
          test: () => {
            const previous = getLocale();
            const ok = setLocale('ja');
            const name = format(TEST_TS, 'MMMM');
            setLocale(previous);
            return ok && name === '6月';
          },
          expected: '6月',
          getActual: () => {
            const previous = getLocale();
            setLocale('ja');
            const name = format(TEST_TS, 'MMMM');
            setLocale(previous);
            return name;
          },
        },
        {
          name: 'NativeDateModule.isToday(NaN) throws',
          test: () => didThrow(() => NativeDateModule.isToday(NaN)),
          expected: 'throws',
          getActual: () =>
            didThrow(() => NativeDateModule.isToday(NaN))
              ? 'throws'
              : 'did not throw',
        },
        {
          name: 'getLocaleInfo() returns object',
          test: () => {
            const info = getLocaleInfo('en');
            return 'code' in info && 'displayName' in info;
          },
          expected: 'object with code, displayName',
          getActual: () => {
            const info = getLocaleInfo('en');
            return `{code: ${info.code}, displayName: ${info.displayName}}`;
          },
        },
      ],
    },
    Setters: {
      name: 'Setter Functions',
      tests: [
        // setYear()
        {
          name: 'setYear() 2025',
          test: () => getYear(setYear(TEST_TS, 2025)) === 2025,
          expected: '2025',
          getActual: () => String(getYear(setYear(TEST_TS, 2025))),
        },
        {
          name: 'setYear() preserves month/day',
          test: () => {
            const result = setYear(TEST_TS, 2025);
            return getMonth(result) === 6 && getDate(result) === 15;
          },
          expected: 'month=6, day=15',
          getActual: () => {
            const r = setYear(TEST_TS, 2025);
            return `month=${getMonth(r)}, day=${getDate(r)}`;
          },
        },
        {
          name: 'setYear() Feb 29 to non-leap clamps to 28',
          test: () => {
            const feb29 = parse('2024-02-29T12:00:00');
            const result = setYear(feb29, 2023);
            return getDate(result) === 28;
          },
          expected: 'day = 28',
          getActual: () => {
            const feb29 = parse('2024-02-29T12:00:00');
            const result = setYear(feb29, 2023);
            return String(getDate(result));
          },
        },
        // setMonth()
        {
          name: 'setMonth() to December',
          test: () => getMonth(setMonth(TEST_TS, 12)) === 12,
          expected: '12',
          getActual: () => String(getMonth(setMonth(TEST_TS, 12))),
        },
        {
          name: 'setMonth() clamps day (Jan 31 -> Feb)',
          test: () => {
            const jan31 = parse('2024-01-31T12:00:00');
            const result = setMonth(jan31, 2);
            return getMonth(result) === 2 && getDate(result) === 29;
          },
          expected: 'Feb 29',
          getActual: () => {
            const jan31 = parse('2024-01-31T12:00:00');
            const r = setMonth(jan31, 2);
            return `${getMonth(r)}/${getDate(r)}`;
          },
        },
        // setDate()
        {
          name: 'setDate() to 25',
          test: () => getDate(setDate(TEST_TS, 25)) === 25,
          expected: '25',
          getActual: () => String(getDate(setDate(TEST_TS, 25))),
        },
        {
          name: 'setDate() to 1',
          test: () => getDate(setDate(TEST_TS, 1)) === 1,
          expected: '1',
          getActual: () => String(getDate(setDate(TEST_TS, 1))),
        },
        // setHours()
        {
          name: 'setHours() to 9',
          test: () => getHours(setHours(TEST_TS, 9)) === 9,
          expected: '9',
          getActual: () => String(getHours(setHours(TEST_TS, 9))),
        },
        {
          name: 'setHours() to 0 (midnight)',
          test: () => getHours(setHours(TEST_TS, 0)) === 0,
          expected: '0',
          getActual: () => String(getHours(setHours(TEST_TS, 0))),
        },
        {
          name: 'setHours() to 23',
          test: () => getHours(setHours(TEST_TS, 23)) === 23,
          expected: '23',
          getActual: () => String(getHours(setHours(TEST_TS, 23))),
        },
        // setMinutes()
        {
          name: 'setMinutes() to 45',
          test: () => getMinutes(setMinutes(TEST_TS, 45)) === 45,
          expected: '45',
          getActual: () => String(getMinutes(setMinutes(TEST_TS, 45))),
        },
        {
          name: 'setMinutes() to 0',
          test: () => getMinutes(setMinutes(TEST_TS, 0)) === 0,
          expected: '0',
          getActual: () => String(getMinutes(setMinutes(TEST_TS, 0))),
        },
        // setSeconds()
        {
          name: 'setSeconds() to 30',
          test: () => getSeconds(setSeconds(TEST_TS, 30)) === 30,
          expected: '30',
          getActual: () => String(getSeconds(setSeconds(TEST_TS, 30))),
        },
        {
          name: 'setSeconds() to 0',
          test: () => getSeconds(setSeconds(TEST_TS, 0)) === 0,
          expected: '0',
          getActual: () => String(getSeconds(setSeconds(TEST_TS, 0))),
        },
        // setMilliseconds()
        {
          name: 'setMilliseconds() to 500',
          test: () => getMilliseconds(setMilliseconds(TEST_TS, 500)) === 500,
          expected: '500',
          getActual: () =>
            String(getMilliseconds(setMilliseconds(TEST_TS, 500))),
        },
        {
          name: 'setMilliseconds() to 0',
          test: () => getMilliseconds(setMilliseconds(TEST_TS, 0)) === 0,
          expected: '0',
          getActual: () => String(getMilliseconds(setMilliseconds(TEST_TS, 0))),
        },
        {
          name: 'setMilliseconds() to 999',
          test: () => getMilliseconds(setMilliseconds(TEST_TS, 999)) === 999,
          expected: '999',
          getActual: () =>
            String(getMilliseconds(setMilliseconds(TEST_TS, 999))),
        },
        // Chaining
        {
          name: 'Chaining setters',
          test: () => {
            const result = setMinutes(setHours(setMonth(TEST_TS, 12), 9), 30);
            const c = getComponents(result);
            return c.month === 12 && c.hour === 9 && c.minute === 30;
          },
          expected: 'month=12, hour=9, min=30',
          getActual: () => {
            const r = setMinutes(setHours(setMonth(TEST_TS, 12), 9), 30);
            const c = getComponents(r);
            return `month=${c.month}, hour=${c.hour}, min=${c.minute}`;
          },
        },
      ],
    },
    Async: {
      name: 'Async Functions',
      tests: [
        // parseManyAsync
        {
          name: 'parseManyAsync() parses array',
          test: async () => {
            const results = await parseManyAsync([
              '2024-06-15',
              '2024-06-16',
              '2024-06-17',
            ]);
            return results.length === 3 && results.every((r) => !isNaN(r));
          },
          expected: '3 valid timestamps',
          getActual: async () => {
            const results = await parseManyAsync([
              '2024-06-15',
              '2024-06-16',
              '2024-06-17',
            ]);
            return `${results.length} results`;
          },
        },
        // formatManyAsync
        {
          name: 'formatManyAsync() formats array',
          test: async () => {
            const results = await formatManyAsync([TEST_TS], 'yyyy-MM-dd');
            return results.length === 1 && results[0] === '2024-06-15';
          },
          expected: '2024-06-15',
          getActual: async () => {
            const results = await formatManyAsync([TEST_TS], 'yyyy-MM-dd');
            return results.join(', ');
          },
        },
        {
          name: "formatManyAsync([ts], 'MMMM d') is June 15",
          test: async () => {
            const previous = getLocale();
            setLocale('en');
            const results = await formatManyAsync([TEST_TS], 'MMMM d');
            setLocale(previous);
            return results[0] === 'June 15';
          },
          expected: 'June 15',
          getActual: async () => {
            const previous = getLocale();
            setLocale('en');
            const results = await formatManyAsync([TEST_TS], 'MMMM d');
            setLocale(previous);
            return results[0] ?? '';
          },
        },
        {
          name: 'formatManyAsync NaN element is empty string',
          test: async () => {
            const results = await formatManyAsync(
              [TEST_TS, NaN, TEST_TS],
              'yyyy'
            );
            return (
              results[0] === '2024' &&
              results[1] === '' &&
              results[2] === '2024'
            );
          },
          expected: "['2024', '', '2024']",
          getActual: async () => {
            const results = await formatManyAsync(
              [TEST_TS, NaN, TEST_TS],
              'yyyy'
            );
            return JSON.stringify(results);
          },
        },
        // getComponentsManyAsync
        {
          name: 'getComponentsManyAsync() returns components',
          test: async () => {
            const results = await getComponentsManyAsync([TEST_TS, EARLIER_TS]);
            return results.length === 2 && 'year' in results[0]!;
          },
          expected: '2 component objects',
          getActual: async () => {
            const results = await getComponentsManyAsync([TEST_TS, EARLIER_TS]);
            return `${results.length} objects`;
          },
        },
      ],
    },
  };
}

export function NativeTestScreen() {
  const [activeTab, setActiveTab] = useState<TabName>('Core');
  const [results, setResults] = useState<Record<TabName, TestResult[]>>({
    Core: [],
    Getters: [],
    Info: [],
    Arithmetic: [],
    Compare: [],
    Predicates: [],
    Helpers: [],
    Timezone: [],
    Setters: [],
    Async: [],
  });
  const [isRunning, setIsRunning] = useState(false);

  const categories = createTestCategories();

  const runTests = useCallback(async (tab: TabName) => {
    setIsRunning(true);
    const category = createTestCategories()[tab];
    const testResults: TestResult[] = [];

    for (const testCase of category.tests) {
      try {
        const testFn = testCase.test as () => boolean | Promise<boolean>;
        const getActualFn = testCase.getActual as () =>
          | string
          | Promise<string>;

        const passed = await testFn();
        const actual = await getActualFn();

        testResults.push({
          name: testCase.name,
          passed,
          expected: testCase.expected,
          actual,
        });
      } catch (error) {
        testResults.push({
          name: testCase.name,
          passed: false,
          expected: testCase.expected,
          actual: 'ERROR',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setResults((prev) => ({ ...prev, [tab]: testResults }));
    setIsRunning(false);
  }, []);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    for (const tab of TABS) {
      await runTests(tab);
    }
    setIsRunning(false);
  }, [runTests]);

  const logResults = useCallback(() => {
    const timestamp = new Date().toISOString();
    const lines: string[] = [];

    lines.push('');
    lines.push(
      '═══════════════════════════════════════════════════════════════'
    );
    lines.push('  NATIVE DATE TEST RESULTS');
    lines.push(`  ${timestamp}`);
    lines.push(
      '═══════════════════════════════════════════════════════════════'
    );
    lines.push('');

    let totalPassed = 0;
    let totalFailed = 0;

    for (const tab of TABS) {
      const tabResults = results[tab];
      if (tabResults.length === 0) continue;

      const passed = tabResults.filter((r) => r.passed === true).length;
      const failed = tabResults.filter((r) => r.passed === false).length;
      totalPassed += passed;
      totalFailed += failed;

      lines.push(
        `┌─ ${tab.toUpperCase()} (${passed}/${tabResults.length} passed)`
      );
      lines.push('│');

      for (const result of tabResults) {
        const icon = result.passed ? '\u2705' : '\u274C';
        lines.push(`│  ${icon} ${result.name}`);
        if (!result.passed) {
          lines.push(`│     Expected: ${result.expected}`);
          lines.push(`│     Actual:   ${result.actual}`);
          if (result.error) {
            lines.push(`│     Error:    ${result.error}`);
          }
        }
      }
      lines.push('│');
      lines.push(
        '└───────────────────────────────────────────────────────────'
      );
      lines.push('');
    }

    lines.push(
      '═══════════════════════════════════════════════════════════════'
    );
    lines.push(`  SUMMARY: ${totalPassed} passed, ${totalFailed} failed`);
    lines.push(`  TOTAL:   ${totalPassed + totalFailed} tests`);
    lines.push(
      `  STATUS:  ${
        totalFailed === 0
          ? '\u2705 ALL TESTS PASSED'
          : '\u274C SOME TESTS FAILED'
      }`
    );
    lines.push(
      '═══════════════════════════════════════════════════════════════'
    );
    lines.push('');

    // Add failed tests summary at the end for easy copy/paste
    if (totalFailed > 0) {
      lines.push('');
      lines.push(
        '═══════════════════════════════════════════════════════════════'
      );
      lines.push('  FAILED TESTS (copy-friendly):');
      lines.push(
        '═══════════════════════════════════════════════════════════════'
      );
      lines.push('');
      for (const tab of TABS) {
        const tabResults = results[tab];
        const failedTests = tabResults.filter((r) => r.passed === false);
        if (failedTests.length > 0) {
          lines.push(`[${tab}]`);
          for (const result of failedTests) {
            lines.push(`- ${result.name}`);
            lines.push(`  Expected: ${result.expected}`);
            lines.push(`  Actual:   ${result.actual}`);
            if (result.error) {
              lines.push(`  Error:    ${result.error}`);
            }
          }
          lines.push('');
        }
      }
    }

    console.log(lines.join('\n'));
  }, [results]);

  const currentResults = results[activeTab];
  const passedCount = currentResults.filter((r) => r.passed === true).length;
  const failedCount = currentResults.filter((r) => r.passed === false).length;
  const totalTests = categories[activeTab].tests.length;

  const allResults = TABS.flatMap((tab) => results[tab]);
  const allPassed = allResults.filter((r) => r.passed === true).length;
  const allFailed = allResults.filter((r) => r.passed === false).length;
  const allTotal = TABS.reduce(
    (sum, tab) => sum + categories[tab].tests.length,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Native Tests</Text>
        <View style={styles.summary}>
          <Text testID="native-test-summary" style={styles.summaryText}>
            Total: {allPassed}/{allTotal} passed
            {allFailed > 0 && (
              <Text style={styles.failedText}> ({allFailed} failed)</Text>
            )}
          </Text>
        </View>
      </View>

      {/* Run Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={() => runTests(activeTab)}
          disabled={isRunning}
        >
          <Text style={styles.runButtonText}>
            {isRunning ? 'Running...' : `Run ${activeTab}`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.runAllButton, isRunning && styles.runButtonDisabled]}
          onPress={runAllTests}
          disabled={isRunning}
        >
          <Text style={styles.runButtonText}>
            {isRunning ? 'Running...' : 'Run All'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.logButton,
            allResults.length === 0 && styles.runButtonDisabled,
          ]}
          onPress={logResults}
          disabled={allResults.length === 0}
        >
          <Text style={styles.runButtonText}>Log</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        {TABS.map((tab) => {
          const tabResults = results[tab];
          const tabPassed = tabResults.filter((r) => r.passed === true).length;
          const tabFailed = tabResults.filter((r) => r.passed === false).length;
          const hasResults = tabResults.length > 0;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
              {hasResults && (
                <View
                  style={[
                    styles.tabBadge,
                    tabFailed > 0
                      ? styles.tabBadgeFailed
                      : styles.tabBadgePassed,
                  ]}
                >
                  <Text style={styles.tabBadgeText}>
                    {tabFailed > 0 ? tabFailed : tabPassed}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Category Header */}
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{categories[activeTab].name}</Text>
        {currentResults.length > 0 && (
          <Text style={styles.categoryStats}>
            {passedCount}/{totalTests} passed
            {failedCount > 0 && (
              <Text style={styles.failedText}> ({failedCount} failed)</Text>
            )}
          </Text>
        )}
      </View>

      {/* Test Results */}
      <ScrollView style={styles.resultsContainer}>
        {currentResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Press "Run {activeTab}" to execute tests
            </Text>
          </View>
        ) : (
          currentResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultItem,
                result.passed ? styles.resultPassed : styles.resultFailed,
              ]}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultIcon}>
                  {result.passed ? '\u2705' : '\u274C'}
                </Text>
                <Text style={styles.resultName} numberOfLines={2}>
                  {result.name}
                </Text>
              </View>
              <View style={styles.resultDetails}>
                <Text style={styles.resultLabel}>Expected:</Text>
                <Text style={styles.resultValue}>{result.expected}</Text>
              </View>
              <View style={styles.resultDetails}>
                <Text style={styles.resultLabel}>Actual:</Text>
                <Text
                  style={[
                    styles.resultValue,
                    !result.passed && styles.resultValueFailed,
                  ]}
                >
                  {result.actual}
                </Text>
              </View>
              {result.error && (
                <View style={styles.resultDetails}>
                  <Text style={styles.resultLabel}>Error:</Text>
                  <Text style={styles.resultError}>{result.error}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  summary: {
    marginTop: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#aaa',
  },
  failedText: {
    color: '#ff6b6b',
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  runButton: {
    flex: 1,
    backgroundColor: '#4ecdc4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  runAllButton: {
    flex: 1,
    backgroundColor: '#667eea',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButton: {
    paddingHorizontal: 20,
    backgroundColor: '#f39c12',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  runButtonDisabled: {
    opacity: 0.5,
  },
  runButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabsContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4ecdc4',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#4ecdc4',
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgePassed: {
    backgroundColor: '#2ecc71',
  },
  tabBadgeFailed: {
    backgroundColor: '#e74c3c',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryHeader: {
    padding: 12,
    backgroundColor: '#252542',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  categoryStats: {
    fontSize: 14,
    color: '#aaa',
  },
  resultsContainer: {
    flex: 1,
    padding: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  resultItem: {
    backgroundColor: '#252542',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  resultPassed: {
    borderLeftColor: '#2ecc71',
  },
  resultFailed: {
    borderLeftColor: '#e74c3c',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 16,
  },
  resultName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  resultDetails: {
    flexDirection: 'row',
    marginLeft: 24,
    marginTop: 2,
  },
  resultLabel: {
    fontSize: 12,
    color: '#888',
    width: 70,
  },
  resultValue: {
    flex: 1,
    fontSize: 12,
    color: '#aaa',
  },
  resultValueFailed: {
    color: '#ff6b6b',
  },
  resultError: {
    flex: 1,
    fontSize: 12,
    color: '#ff6b6b',
  },
});
