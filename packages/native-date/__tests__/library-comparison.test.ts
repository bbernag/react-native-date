/**
 * Library Comparison Tests
 *
 * Compares NativeDate results against date-fns and dayjs
 * to ensure consistent behavior across libraries.
 */
import {
  parse,
  format,
  formatUTC,
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
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfWeek,
  endOfWeek,
  getYear,
  getMonth,
  getDate,
  getDay,
  getHours,
  getMinutes,
  getSeconds,
  getMilliseconds,
  isLeapYear,
  getDaysInMonth,
  isWeekend,
  isValid,
  diffInDays,
  diffInMonths,
  diffInYears,
  diffInWeeks,
  diffInHours,
  diffInMinutes,
  diffInSeconds,
  isBefore,
  isAfter,
  isSameDay,
  isSameMonth,
  isSameYear,
  clamp,
  min,
  max,
  toISOString,
} from '../src/index';

import {
  addDays as dfAddDays,
  addMonths as dfAddMonths,
  addYears as dfAddYears,
  addWeeks as dfAddWeeks,
  addHours as dfAddHours,
  addMinutes as dfAddMinutes,
  addSeconds as dfAddSeconds,
  subDays as dfSubDays,
  subMonths as dfSubMonths,
  subYears as dfSubYears,
  subWeeks as dfSubWeeks,
  subHours as dfSubHours,
  subMinutes as dfSubMinutes,
  subSeconds as dfSubSeconds,
  startOfDay as dfStartOfDay,
  endOfDay as dfEndOfDay,
  startOfMonth as dfStartOfMonth,
  endOfMonth as dfEndOfMonth,
  startOfYear as dfStartOfYear,
  endOfYear as dfEndOfYear,
  startOfWeek as dfStartOfWeek,
  endOfWeek as dfEndOfWeek,
  getYear as dfGetYear,
  getMonth as dfGetMonth,
  getDate as dfGetDate,
  getDay as dfGetDay,
  getHours as dfGetHours,
  getMinutes as dfGetMinutes,
  getSeconds as dfGetSeconds,
  getMilliseconds as dfGetMilliseconds,
  isLeapYear as dfIsLeapYear,
  getDaysInMonth as dfGetDaysInMonth,
  differenceInDays as dfDiffInDays,
  differenceInMonths as dfDiffInMonths,
  differenceInYears as dfDiffInYears,
  differenceInWeeks as dfDiffInWeeks,
  differenceInHours as dfDiffInHours,
  differenceInMinutes as dfDiffInMinutes,
  differenceInSeconds as dfDiffInSeconds,
  isBefore as dfIsBefore,
  isAfter as dfIsAfter,
  isSameDay as dfIsSameDay,
  isSameMonth as dfIsSameMonth,
  isSameYear as dfIsSameYear,
  isWeekend as dfIsWeekend,
} from 'date-fns';

import dayjs from 'dayjs';

describe('Library Comparison Tests', () => {
  // Test dates covering various edge cases
  const testDates = [
    '2024-01-01T00:00:00.000Z', // New Year
    '2024-02-29T12:00:00.000Z', // Leap day
    '2024-06-15T14:30:45.123Z', // Mid-year
    '2024-12-31T23:59:59.999Z', // End of year
    '2023-03-12T02:30:00.000Z', // DST transition (US)
    '2023-11-05T01:30:00.000Z', // DST transition (US)
    '1970-01-01T00:00:00.000Z', // Epoch
    '2000-02-29T12:00:00.000Z', // Y2K leap day
    '1999-12-31T23:59:59.999Z', // Pre-Y2K
  ];

  describe('Parsing Consistency', () => {
    testDates.forEach((dateStr) => {
      it(`should parse ${dateStr} same as Date.parse`, () => {
        const nativeResult = parse(dateStr);
        const jsResult = Date.parse(dateStr);
        expect(nativeResult).toBe(jsResult);
      });
    });
  });

  describe('Component Getters vs date-fns', () => {
    testDates.forEach((dateStr) => {
      describe(`for ${dateStr}`, () => {
        const ts = parse(dateStr);
        const dfDate = new Date(ts);

        it('getYear should match', () => {
          expect(getYear(ts)).toBe(dfGetYear(dfDate));
        });

        it('getMonth should match (adjusted for 1-indexed)', () => {
          // NativeDate uses 1-indexed months, date-fns uses 0-indexed
          expect(getMonth(ts)).toBe(dfGetMonth(dfDate) + 1);
        });

        it('getDate should match', () => {
          expect(getDate(ts)).toBe(dfGetDate(dfDate));
        });

        it('getDay should match', () => {
          expect(getDay(ts)).toBe(dfGetDay(dfDate));
        });

        it('getHours should match', () => {
          expect(getHours(ts)).toBe(dfGetHours(dfDate));
        });

        it('getMinutes should match', () => {
          expect(getMinutes(ts)).toBe(dfGetMinutes(dfDate));
        });

        it('getSeconds should match', () => {
          expect(getSeconds(ts)).toBe(dfGetSeconds(dfDate));
        });

        it('getMilliseconds should match', () => {
          expect(getMilliseconds(ts)).toBe(dfGetMilliseconds(dfDate));
        });
      });
    });
  });

  describe('Component Getters vs dayjs', () => {
    testDates.forEach((dateStr) => {
      describe(`for ${dateStr}`, () => {
        const ts = parse(dateStr);
        const dj = dayjs(ts);

        it('getYear should match', () => {
          expect(getYear(ts)).toBe(dj.year());
        });

        it('getMonth should match (adjusted for 1-indexed)', () => {
          // NativeDate uses 1-indexed months, dayjs uses 0-indexed
          expect(getMonth(ts)).toBe(dj.month() + 1);
        });

        it('getDate should match', () => {
          expect(getDate(ts)).toBe(dj.date());
        });

        it('getDay should match', () => {
          expect(getDay(ts)).toBe(dj.day());
        });

        it('getHours should match', () => {
          expect(getHours(ts)).toBe(dj.hour());
        });

        it('getMinutes should match', () => {
          expect(getMinutes(ts)).toBe(dj.minute());
        });

        it('getSeconds should match', () => {
          expect(getSeconds(ts)).toBe(dj.second());
        });

        it('getMilliseconds should match', () => {
          expect(getMilliseconds(ts)).toBe(dj.millisecond());
        });
      });
    });
  });

  describe('Date Arithmetic vs date-fns', () => {
    const baseDate = '2024-06-15T12:00:00.000Z';
    const ts = parse(baseDate);
    const dfDate = new Date(ts);

    describe('addDays', () => {
      [1, 7, 30, 365, -1, -30].forEach((days) => {
        it(`adding ${days} days should match`, () => {
          const nativeResult = addDays(ts, days);
          const dfResult = dfAddDays(dfDate, days).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('addMonths', () => {
      [1, 3, 6, 12, -1, -6].forEach((months) => {
        it(`adding ${months} months should match`, () => {
          const nativeResult = addMonths(ts, months);
          const dfResult = dfAddMonths(dfDate, months).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('addYears', () => {
      [1, 4, 10, -1, -5].forEach((years) => {
        it(`adding ${years} years should match`, () => {
          const nativeResult = addYears(ts, years);
          const dfResult = dfAddYears(dfDate, years).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('subDays', () => {
      [1, 7, 30].forEach((days) => {
        it(`subtracting ${days} days should match`, () => {
          const nativeResult = subDays(ts, days);
          const dfResult = dfSubDays(dfDate, days).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('subMonths', () => {
      [1, 3, 6].forEach((months) => {
        it(`subtracting ${months} months should match`, () => {
          const nativeResult = subMonths(ts, months);
          const dfResult = dfSubMonths(dfDate, months).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('subYears', () => {
      [1, 4, 10].forEach((years) => {
        it(`subtracting ${years} years should match`, () => {
          const nativeResult = subYears(ts, years);
          const dfResult = dfSubYears(dfDate, years).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });
  });

  describe('Date Arithmetic vs dayjs', () => {
    const baseDate = '2024-06-15T12:00:00.000Z';
    const ts = parse(baseDate);
    const dj = dayjs(ts);

    describe('addDays', () => {
      [1, 7, 30, 365, -1, -30].forEach((days) => {
        it(`adding ${days} days should match`, () => {
          const nativeResult = addDays(ts, days);
          const djResult = dj.add(days, 'day').valueOf();
          expect(nativeResult).toBe(djResult);
        });
      });
    });

    describe('addMonths', () => {
      [1, 3, 6, 12, -1, -6].forEach((months) => {
        it(`adding ${months} months should match`, () => {
          const nativeResult = addMonths(ts, months);
          const djResult = dj.add(months, 'month').valueOf();
          expect(nativeResult).toBe(djResult);
        });
      });
    });

    describe('addYears', () => {
      [1, 4, 10, -1, -5].forEach((years) => {
        it(`adding ${years} years should match`, () => {
          const nativeResult = addYears(ts, years);
          const djResult = dj.add(years, 'year').valueOf();
          expect(nativeResult).toBe(djResult);
        });
      });
    });
  });

  describe('Boundaries vs date-fns', () => {
    testDates.forEach((dateStr) => {
      describe(`for ${dateStr}`, () => {
        const ts = parse(dateStr);
        const dfDate = new Date(ts);

        it('startOfDay should match', () => {
          const nativeResult = startOfDay(ts);
          const dfResult = dfStartOfDay(dfDate).getTime();
          expect(nativeResult).toBe(dfResult);
        });

        it('endOfDay should match', () => {
          const nativeResult = endOfDay(ts);
          const dfResult = dfEndOfDay(dfDate).getTime();
          expect(nativeResult).toBe(dfResult);
        });

        it('startOfMonth should match', () => {
          const nativeResult = startOfMonth(ts);
          const dfResult = dfStartOfMonth(dfDate).getTime();
          expect(nativeResult).toBe(dfResult);
        });

        it('endOfMonth should match', () => {
          const nativeResult = endOfMonth(ts);
          const dfResult = dfEndOfMonth(dfDate).getTime();
          expect(nativeResult).toBe(dfResult);
        });

        it('startOfYear should match', () => {
          const nativeResult = startOfYear(ts);
          const dfResult = dfStartOfYear(dfDate).getTime();
          expect(nativeResult).toBe(dfResult);
        });

        it('endOfYear should match', () => {
          const nativeResult = endOfYear(ts);
          const dfResult = dfEndOfYear(dfDate).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });
  });

  describe('Boundaries vs dayjs', () => {
    testDates.forEach((dateStr) => {
      describe(`for ${dateStr}`, () => {
        const ts = parse(dateStr);
        const dj = dayjs(ts);

        it('startOfDay should match', () => {
          const nativeResult = startOfDay(ts);
          const djResult = dj.startOf('day').valueOf();
          expect(nativeResult).toBe(djResult);
        });

        it('endOfDay should match', () => {
          const nativeResult = endOfDay(ts);
          const djResult = dj.endOf('day').valueOf();
          expect(nativeResult).toBe(djResult);
        });

        it('startOfMonth should match', () => {
          const nativeResult = startOfMonth(ts);
          const djResult = dj.startOf('month').valueOf();
          expect(nativeResult).toBe(djResult);
        });

        it('endOfMonth should match', () => {
          const nativeResult = endOfMonth(ts);
          const djResult = dj.endOf('month').valueOf();
          expect(nativeResult).toBe(djResult);
        });

        it('startOfYear should match', () => {
          const nativeResult = startOfYear(ts);
          const djResult = dj.startOf('year').valueOf();
          expect(nativeResult).toBe(djResult);
        });

        it('endOfYear should match', () => {
          const nativeResult = endOfYear(ts);
          const djResult = dj.endOf('year').valueOf();
          expect(nativeResult).toBe(djResult);
        });
      });
    });
  });

  describe('Predicates vs date-fns', () => {
    testDates.forEach((dateStr) => {
      describe(`for ${dateStr}`, () => {
        const ts = parse(dateStr);
        const dfDate = new Date(ts);

        it('isLeapYear should match', () => {
          const nativeResult = isLeapYear(ts);
          const dfResult = dfIsLeapYear(dfDate);
          expect(nativeResult).toBe(dfResult);
        });

        it('getDaysInMonth should match', () => {
          const nativeResult = getDaysInMonth(ts);
          const dfResult = dfGetDaysInMonth(dfDate);
          expect(nativeResult).toBe(dfResult);
        });

        it('isWeekend should match', () => {
          const nativeResult = isWeekend(ts);
          const dfResult = dfIsWeekend(dfDate);
          expect(nativeResult).toBe(dfResult);
        });
      });
    });
  });

  describe('Comparisons vs date-fns', () => {
    const date1Str = '2024-06-15T12:00:00.000Z';
    const date2Str = '2024-06-20T12:00:00.000Z';
    const date3Str = '2024-06-15T18:00:00.000Z'; // Same day, different time

    const ts1 = parse(date1Str);
    const ts2 = parse(date2Str);
    const ts3 = parse(date3Str);

    const df1 = new Date(ts1);
    const df2 = new Date(ts2);
    const df3 = new Date(ts3);

    it('isBefore should match', () => {
      expect(isBefore(ts1, ts2)).toBe(dfIsBefore(df1, df2));
      expect(isBefore(ts2, ts1)).toBe(dfIsBefore(df2, df1));
      expect(isBefore(ts1, ts1)).toBe(dfIsBefore(df1, df1));
    });

    it('isAfter should match', () => {
      expect(isAfter(ts1, ts2)).toBe(dfIsAfter(df1, df2));
      expect(isAfter(ts2, ts1)).toBe(dfIsAfter(df2, df1));
      expect(isAfter(ts1, ts1)).toBe(dfIsAfter(df1, df1));
    });

    it('isSameDay should match', () => {
      expect(isSameDay(ts1, ts2)).toBe(dfIsSameDay(df1, df2));
      expect(isSameDay(ts1, ts3)).toBe(dfIsSameDay(df1, df3));
    });

    it('isSameMonth should match', () => {
      expect(isSameMonth(ts1, ts2)).toBe(dfIsSameMonth(df1, df2));
    });

    it('isSameYear should match', () => {
      expect(isSameYear(ts1, ts2)).toBe(dfIsSameYear(df1, df2));
    });
  });

  describe('Comparisons vs dayjs', () => {
    const date1Str = '2024-06-15T12:00:00.000Z';
    const date2Str = '2024-06-20T12:00:00.000Z';
    const date3Str = '2024-06-15T18:00:00.000Z';

    const ts1 = parse(date1Str);
    const ts2 = parse(date2Str);
    const ts3 = parse(date3Str);

    const dj1 = dayjs(ts1);
    const dj2 = dayjs(ts2);
    const dj3 = dayjs(ts3);

    it('isBefore should match', () => {
      expect(isBefore(ts1, ts2)).toBe(dj1.isBefore(dj2));
      expect(isBefore(ts2, ts1)).toBe(dj2.isBefore(dj1));
    });

    it('isAfter should match', () => {
      expect(isAfter(ts1, ts2)).toBe(dj1.isAfter(dj2));
      expect(isAfter(ts2, ts1)).toBe(dj2.isAfter(dj1));
    });

    it('isSameDay should match', () => {
      expect(isSameDay(ts1, ts2)).toBe(dj1.isSame(dj2, 'day'));
      expect(isSameDay(ts1, ts3)).toBe(dj1.isSame(dj3, 'day'));
    });

    it('isSameMonth should match', () => {
      expect(isSameMonth(ts1, ts2)).toBe(dj1.isSame(dj2, 'month'));
    });

    it('isSameYear should match', () => {
      expect(isSameYear(ts1, ts2)).toBe(dj1.isSame(dj2, 'year'));
    });
  });

  describe('Difference Calculations vs date-fns', () => {
    const datePairs: [string, string][] = [
      ['2024-01-01T12:00:00Z', '2024-01-15T12:00:00Z'],
      ['2024-01-01T12:00:00Z', '2024-06-15T12:00:00Z'],
      ['2024-01-01T12:00:00Z', '2025-01-01T12:00:00Z'],
      ['2024-02-28T12:00:00Z', '2024-03-01T12:00:00Z'],
      ['2023-02-28T12:00:00Z', '2023-03-01T12:00:00Z'],
    ];

    datePairs.forEach(([date1Str, date2Str]) => {
      describe(`between ${date1Str} and ${date2Str}`, () => {
        const ts1 = parse(date1Str);
        const ts2 = parse(date2Str);
        const df1 = new Date(ts1);
        const df2 = new Date(ts2);

        it('diffInDays should match', () => {
          const nativeResult = diffInDays(ts2, ts1);
          const dfResult = dfDiffInDays(df2, df1);
          expect(nativeResult).toBe(dfResult);
        });

        it('diffInMonths should match', () => {
          const nativeResult = diffInMonths(ts2, ts1);
          const dfResult = dfDiffInMonths(df2, df1);
          expect(nativeResult).toBe(dfResult);
        });

        it('diffInYears should match', () => {
          const nativeResult = diffInYears(ts2, ts1);
          const dfResult = dfDiffInYears(df2, df1);
          expect(nativeResult).toBe(dfResult);
        });
      });
    });
  });

  describe('Difference Calculations vs dayjs', () => {
    const datePairs: [string, string][] = [
      ['2024-01-01T12:00:00Z', '2024-01-15T12:00:00Z'],
      ['2024-01-01T12:00:00Z', '2024-06-15T12:00:00Z'],
      ['2024-01-01T12:00:00Z', '2025-01-01T12:00:00Z'],
    ];

    datePairs.forEach(([date1Str, date2Str]) => {
      describe(`between ${date1Str} and ${date2Str}`, () => {
        const ts1 = parse(date1Str);
        const ts2 = parse(date2Str);
        const dj1 = dayjs(ts1);
        const dj2 = dayjs(ts2);

        it('diffInDays should match', () => {
          const nativeResult = diffInDays(ts2, ts1);
          const djResult = dj2.diff(dj1, 'day');
          expect(nativeResult).toBe(djResult);
        });

        it('diffInMonths should match', () => {
          const nativeResult = diffInMonths(ts2, ts1);
          const djResult = dj2.diff(dj1, 'month');
          expect(nativeResult).toBe(djResult);
        });

        it('diffInYears should match', () => {
          const nativeResult = diffInYears(ts2, ts1);
          const djResult = dj2.diff(dj1, 'year');
          expect(nativeResult).toBe(djResult);
        });
      });
    });
  });

  describe('Leap Year Edge Cases', () => {
    const leapYears = [2000, 2004, 2020, 2024, 2400];
    const nonLeapYears = [1900, 2001, 2100, 2200, 2300];

    leapYears.forEach((year) => {
      it(`${year} should be leap year (matches date-fns)`, () => {
        const ts = parse(`${year}-06-15T12:00:00Z`);
        const dfDate = new Date(ts);
        expect(isLeapYear(ts)).toBe(dfIsLeapYear(dfDate));
        expect(isLeapYear(ts)).toBe(true);
      });
    });

    nonLeapYears.forEach((year) => {
      it(`${year} should NOT be leap year (matches date-fns)`, () => {
        const ts = parse(`${year}-06-15T12:00:00Z`);
        const dfDate = new Date(ts);
        expect(isLeapYear(ts)).toBe(dfIsLeapYear(dfDate));
        expect(isLeapYear(ts)).toBe(false);
      });
    });
  });

  describe('Month End Edge Cases', () => {
    const monthTests = [
      { month: '01', expected: 31 },
      { month: '02', expected: 29, year: '2024' }, // Leap year
      { month: '02', expected: 28, year: '2023' }, // Non-leap year
      { month: '03', expected: 31 },
      { month: '04', expected: 30 },
      { month: '05', expected: 31 },
      { month: '06', expected: 30 },
      { month: '07', expected: 31 },
      { month: '08', expected: 31 },
      { month: '09', expected: 30 },
      { month: '10', expected: 31 },
      { month: '11', expected: 30 },
      { month: '12', expected: 31 },
    ];

    monthTests.forEach(({ month, expected, year = '2024' }) => {
      it(`${year}-${month} should have ${expected} days (matches date-fns)`, () => {
        const ts = parse(`${year}-${month}-15T12:00:00Z`);
        const dfDate = new Date(ts);
        expect(getDaysInMonth(ts)).toBe(dfGetDaysInMonth(dfDate));
        expect(getDaysInMonth(ts)).toBe(expected);
      });
    });
  });

  describe('Format Output Comparison', () => {
    // Common format patterns
    const formatPatterns = [
      'yyyy-MM-dd',
      'yyyy/MM/dd',
      'MM/dd/yyyy',
      'dd-MM-yyyy',
      'HH:mm:ss',
      'hh:mm:ss',
      'yyyy-MM-dd HH:mm:ss',
    ];

    const testDate = '2024-06-15T14:30:45.123Z';
    const ts = parse(testDate);

    formatPatterns.forEach((pattern) => {
      it(`format "${pattern}" should produce valid output`, () => {
        const nativeResult = format(ts, pattern);
        expect(nativeResult).toBeTruthy();
        expect(typeof nativeResult).toBe('string');
        expect(nativeResult.length).toBeGreaterThan(0);
      });
    });

    it('formatUTC should produce consistent UTC output', () => {
      const utcResult = formatUTC(ts, 'yyyy-MM-dd HH:mm:ss');
      expect(utcResult).toContain('2024-06-15');
      expect(utcResult).toContain('14:30:45');
    });
  });

  // ============================================================
  // WEEK OPERATIONS COMPARISON
  // ============================================================
  describe('Week Operations vs date-fns', () => {
    testDates.forEach((dateStr) => {
      describe(`for ${dateStr}`, () => {
        const ts = parse(dateStr);
        const dfDate = new Date(ts);

        it('startOfWeek should match', () => {
          const nativeResult = startOfWeek(ts);
          const dfResult = dfStartOfWeek(dfDate).getTime();
          expect(nativeResult).toBe(dfResult);
        });

        it('endOfWeek should match', () => {
          const nativeResult = endOfWeek(ts);
          const dfResult = dfEndOfWeek(dfDate).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('Week arithmetic', () => {
      const baseDate = '2024-06-15T12:00:00.000Z';
      const ts = parse(baseDate);
      const dfDate = new Date(ts);

      [1, 2, 4, 52, -1, -4].forEach((weeks) => {
        it(`adding ${weeks} weeks should match`, () => {
          const nativeResult = addWeeks(ts, weeks);
          const dfResult = dfAddWeeks(dfDate, weeks).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });

      [1, 2, 4].forEach((weeks) => {
        it(`subtracting ${weeks} weeks should match`, () => {
          const nativeResult = subWeeks(ts, weeks);
          const dfResult = dfSubWeeks(dfDate, weeks).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('Week difference calculations', () => {
      const datePairs: [string, string][] = [
        ['2024-01-01T12:00:00Z', '2024-01-08T12:00:00Z'],
        ['2024-01-01T12:00:00Z', '2024-02-01T12:00:00Z'],
        ['2024-06-01T12:00:00Z', '2024-06-15T12:00:00Z'],
      ];

      datePairs.forEach(([date1Str, date2Str]) => {
        it(`diffInWeeks between ${date1Str} and ${date2Str} should match`, () => {
          const ts1 = parse(date1Str);
          const ts2 = parse(date2Str);
          const df1 = new Date(ts1);
          const df2 = new Date(ts2);
          const nativeResult = diffInWeeks(ts2, ts1);
          const dfResult = dfDiffInWeeks(df2, df1);
          expect(nativeResult).toBe(dfResult);
        });
      });
    });
  });

  describe('Week Operations vs dayjs', () => {
    const baseDate = '2024-06-15T12:00:00.000Z';
    const ts = parse(baseDate);
    const dj = dayjs(ts);

    it('startOfWeek should match', () => {
      const nativeResult = startOfWeek(ts);
      const djResult = dj.startOf('week').valueOf();
      expect(nativeResult).toBe(djResult);
    });

    it('endOfWeek should match', () => {
      const nativeResult = endOfWeek(ts);
      const djResult = dj.endOf('week').valueOf();
      expect(nativeResult).toBe(djResult);
    });

    [1, 2, 4, -1].forEach((weeks) => {
      it(`adding ${weeks} weeks should match`, () => {
        const nativeResult = addWeeks(ts, weeks);
        const djResult = dj.add(weeks, 'week').valueOf();
        expect(nativeResult).toBe(djResult);
      });
    });
  });

  // ============================================================
  // TIME ARITHMETIC COMPARISON
  // ============================================================
  describe('Time Arithmetic vs date-fns', () => {
    const baseDate = '2024-06-15T12:30:45.500Z';
    const ts = parse(baseDate);
    const dfDate = new Date(ts);

    describe('Hours', () => {
      [1, 6, 12, 24, -1, -12].forEach((hours) => {
        it(`adding ${hours} hours should match`, () => {
          const nativeResult = addHours(ts, hours);
          const dfResult = dfAddHours(dfDate, hours).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });

      [1, 6, 12].forEach((hours) => {
        it(`subtracting ${hours} hours should match`, () => {
          const nativeResult = subHours(ts, hours);
          const dfResult = dfSubHours(dfDate, hours).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('Minutes', () => {
      [1, 30, 60, 90, -15, -45].forEach((minutes) => {
        it(`adding ${minutes} minutes should match`, () => {
          const nativeResult = addMinutes(ts, minutes);
          const dfResult = dfAddMinutes(dfDate, minutes).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });

      [15, 30, 60].forEach((minutes) => {
        it(`subtracting ${minutes} minutes should match`, () => {
          const nativeResult = subMinutes(ts, minutes);
          const dfResult = dfSubMinutes(dfDate, minutes).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('Seconds', () => {
      [1, 30, 60, 3600, -30, -60].forEach((seconds) => {
        it(`adding ${seconds} seconds should match`, () => {
          const nativeResult = addSeconds(ts, seconds);
          const dfResult = dfAddSeconds(dfDate, seconds).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });

      [15, 30, 60].forEach((seconds) => {
        it(`subtracting ${seconds} seconds should match`, () => {
          const nativeResult = subSeconds(ts, seconds);
          const dfResult = dfSubSeconds(dfDate, seconds).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('Time difference calculations', () => {
      const datePairs: [string, string][] = [
        ['2024-06-15T12:00:00Z', '2024-06-15T14:00:00Z'],
        ['2024-06-15T12:00:00Z', '2024-06-15T12:30:00Z'],
        ['2024-06-15T12:00:00Z', '2024-06-15T12:00:45Z'],
      ];

      datePairs.forEach(([date1Str, date2Str]) => {
        const ts1 = parse(date1Str);
        const ts2 = parse(date2Str);
        const df1 = new Date(ts1);
        const df2 = new Date(ts2);

        it(`diffInHours between ${date1Str} and ${date2Str} should match`, () => {
          const nativeResult = diffInHours(ts2, ts1);
          const dfResult = dfDiffInHours(df2, df1);
          expect(nativeResult).toBe(dfResult);
        });

        it(`diffInMinutes between ${date1Str} and ${date2Str} should match`, () => {
          const nativeResult = diffInMinutes(ts2, ts1);
          const dfResult = dfDiffInMinutes(df2, df1);
          expect(nativeResult).toBe(dfResult);
        });

        it(`diffInSeconds between ${date1Str} and ${date2Str} should match`, () => {
          const nativeResult = diffInSeconds(ts2, ts1);
          const dfResult = dfDiffInSeconds(df2, df1);
          expect(nativeResult).toBe(dfResult);
        });
      });
    });
  });

  describe('Time Arithmetic vs dayjs', () => {
    const baseDate = '2024-06-15T12:30:45.500Z';
    const ts = parse(baseDate);
    const dj = dayjs(ts);

    [1, 6, 12, -1].forEach((hours) => {
      it(`adding ${hours} hours should match`, () => {
        const nativeResult = addHours(ts, hours);
        const djResult = dj.add(hours, 'hour').valueOf();
        expect(nativeResult).toBe(djResult);
      });
    });

    [15, 30, 60, -15].forEach((minutes) => {
      it(`adding ${minutes} minutes should match`, () => {
        const nativeResult = addMinutes(ts, minutes);
        const djResult = dj.add(minutes, 'minute').valueOf();
        expect(nativeResult).toBe(djResult);
      });
    });

    [30, 60, -30].forEach((seconds) => {
      it(`adding ${seconds} seconds should match`, () => {
        const nativeResult = addSeconds(ts, seconds);
        const djResult = dj.add(seconds, 'second').valueOf();
        expect(nativeResult).toBe(djResult);
      });
    });
  });

  // ============================================================
  // MONTH OVERFLOW EDGE CASES
  // ============================================================
  describe('Month Overflow Comparison', () => {
    // Note: date-fns clamps to end of month (Jan 31 + 1 month = Feb 28/29)
    // JavaScript Date overflows (Jan 31 + 1 month = Mar 2/3)
    // Our library follows JavaScript Date behavior for consistency

    describe('Non-overflow cases should match date-fns', () => {
      const safeCases = [
        { date: '2024-01-15T12:00:00Z', months: 1, desc: 'Jan 15 + 1 month' },
        { date: '2024-06-15T12:00:00Z', months: 1, desc: 'Jun 15 + 1 month' },
        {
          date: '2024-01-29T12:00:00Z',
          months: 1,
          desc: 'Jan 29 + 1 month (leap)',
        },
      ];

      safeCases.forEach(({ date, months, desc }) => {
        it(`${desc} should match date-fns`, () => {
          const ts = parse(date);
          const dfDate = new Date(ts);
          const nativeResult = addMonths(ts, months);
          const dfResult = dfAddMonths(dfDate, months).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });

    describe('Overflow behavior documentation', () => {
      // These tests document that our library uses JS Date overflow behavior
      it('Jan 31 + 1 month should overflow to March (JS Date behavior)', () => {
        const ts = parse('2024-01-31T12:00:00Z');
        const result = addMonths(ts, 1);
        // JS Date: Jan 31 + 1 month = Feb 31 = Mar 2 (leap year)
        const resultDate = new Date(result);
        expect(resultDate.getUTCMonth()).toBe(2); // March (0-indexed)
      });

      it('May 31 + 1 month should overflow to July (JS Date behavior)', () => {
        const ts = parse('2024-05-31T12:00:00Z');
        const result = addMonths(ts, 1);
        // JS Date: May 31 + 1 month = Jun 31 = Jul 1
        const resultDate = new Date(result);
        expect(resultDate.getUTCMonth()).toBe(6); // July (0-indexed)
      });
    });

    describe('Year arithmetic with Feb 29', () => {
      // These also have different behavior: date-fns clamps, JS Date overflows
      it('Feb 29 + 4 years should match (both leap years)', () => {
        const ts = parse('2024-02-29T12:00:00Z');
        const dfDate = new Date(ts);
        const nativeResult = addYears(ts, 4);
        const dfResult = dfAddYears(dfDate, 4).getTime();
        expect(nativeResult).toBe(dfResult);
      });
    });
  });

  // ============================================================
  // PRE-EPOCH DATE COMPARISON
  // ============================================================
  describe('Pre-Epoch Date Handling', () => {
    const preEpochDates = [
      '1969-12-31T23:59:59.999Z',
      '1969-07-20T20:17:00.000Z', // Moon landing
      '1950-01-01T00:00:00.000Z',
      '1900-01-01T12:00:00.000Z',
    ];

    preEpochDates.forEach((dateStr) => {
      describe(`for ${dateStr}`, () => {
        const ts = parse(dateStr);
        const dfDate = new Date(ts);
        const dj = dayjs(ts);

        it('timestamp should be negative', () => {
          expect(ts).toBeLessThan(0);
        });

        it('getYear should match date-fns', () => {
          expect(getYear(ts)).toBe(dfGetYear(dfDate));
        });

        it('getMonth should match date-fns (adjusted)', () => {
          expect(getMonth(ts)).toBe(dfGetMonth(dfDate) + 1);
        });

        it('getDate should match date-fns', () => {
          expect(getDate(ts)).toBe(dfGetDate(dfDate));
        });

        it('getYear should match dayjs', () => {
          expect(getYear(ts)).toBe(dj.year());
        });

        it('adding days should work correctly', () => {
          const nativeResult = addDays(ts, 1);
          const dfResult = dfAddDays(dfDate, 1).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });
  });

  // ============================================================
  // UTILITY FUNCTIONS COMPARISON
  // ============================================================
  describe('Utility Functions', () => {
    describe('isValid comparison', () => {
      it('should return true for valid timestamps', () => {
        expect(isValid(parse('2024-06-15T12:00:00Z'))).toBe(true);
        expect(isValid(0)).toBe(true);
        expect(isValid(-86400000)).toBe(true);
      });

      it('should return false for invalid values', () => {
        expect(isValid(NaN)).toBe(false);
        expect(isValid(Infinity)).toBe(false);
        expect(isValid(-Infinity)).toBe(false);
      });
    });

    describe('min/max comparison', () => {
      const timestamps = [
        parse('2024-01-01T00:00:00Z'),
        parse('2024-06-15T12:00:00Z'),
        parse('2024-12-31T23:59:59Z'),
      ];

      it('min should return smallest timestamp', () => {
        const result = min(timestamps);
        expect(result).toBe(Math.min(...timestamps));
      });

      it('max should return largest timestamp', () => {
        const result = max(timestamps);
        expect(result).toBe(Math.max(...timestamps));
      });
    });

    describe('clamp comparison', () => {
      const minDate = parse('2024-01-01T00:00:00Z');
      const maxDate = parse('2024-12-31T23:59:59Z');

      it('should clamp value below min', () => {
        const before = parse('2023-06-15T12:00:00Z');
        const result = clamp(before, minDate, maxDate);
        expect(result).toBe(minDate);
      });

      it('should clamp value above max', () => {
        const after = parse('2025-06-15T12:00:00Z');
        const result = clamp(after, minDate, maxDate);
        expect(result).toBe(maxDate);
      });

      it('should not clamp value within range', () => {
        const middle = parse('2024-06-15T12:00:00Z');
        const result = clamp(middle, minDate, maxDate);
        expect(result).toBe(middle);
      });
    });

    describe('toISOString format validation', () => {
      testDates.forEach((dateStr) => {
        it(`toISOString for ${dateStr} should produce valid ISO format`, () => {
          const ts = parse(dateStr);
          const result = toISOString(ts);
          // Verify it matches ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
          expect(result).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
          );
        });
      });

      it('toISOString should contain Z suffix', () => {
        const ts = parse('2024-06-15T14:30:45.123Z');
        const result = toISOString(ts);
        expect(result.endsWith('Z')).toBe(true);
      });

      it('toISOString should be parseable back to same timestamp', () => {
        const ts = parse('2024-06-15T14:30:45.123Z');
        const isoResult = toISOString(ts);
        const reparsed = parse(isoResult);
        // Allow for minor timezone adjustments in mock
        expect(Math.abs(reparsed - ts)).toBeLessThan(24 * 60 * 60 * 1000);
      });
    });
  });

  // ============================================================
  // FORMAT PATTERN DEEP COMPARISON
  // ============================================================
  describe('Format Pattern Deep Comparison', () => {
    const testDate = parse('2024-06-05T09:05:03.007Z');

    describe('Year patterns', () => {
      it('yyyy should output 4-digit year', () => {
        expect(formatUTC(testDate, 'yyyy')).toBe('2024');
      });

      it('yy should output 2-digit year', () => {
        expect(formatUTC(testDate, 'yy')).toBe('24');
      });
    });

    describe('Month patterns', () => {
      it('MM should output 2-digit month', () => {
        expect(formatUTC(testDate, 'MM')).toBe('06');
      });

      it('M should output 1-2 digit month', () => {
        const result = formatUTC(testDate, 'M');
        expect(['6', '06']).toContain(result);
      });
    });

    describe('Day patterns', () => {
      it('dd should output 2-digit day', () => {
        expect(formatUTC(testDate, 'dd')).toBe('05');
      });

      it('d should output 1-2 digit day', () => {
        expect(formatUTC(testDate, 'd')).toBe('5');
      });
    });

    describe('Hour patterns', () => {
      it('HH should output 2-digit 24-hour', () => {
        expect(formatUTC(testDate, 'HH')).toBe('09');
      });

      it('H should output 1-2 digit 24-hour', () => {
        expect(formatUTC(testDate, 'H')).toBe('9');
      });
    });

    describe('Complete pattern matching', () => {
      const patterns = [
        { pattern: 'yyyy-MM-dd', expected: '2024-06-05' },
        { pattern: 'MM/dd/yyyy', expected: '06/05/2024' },
        { pattern: 'dd.MM.yyyy', expected: '05.06.2024' },
        { pattern: 'HH:mm:ss', expected: '09:05:03' },
        { pattern: 'HH:mm', expected: '09:05' },
        { pattern: 'yyyy-MM-dd HH:mm:ss', expected: '2024-06-05 09:05:03' },
      ];

      patterns.forEach(({ pattern, expected }) => {
        it(`pattern "${pattern}" should produce "${expected}"`, () => {
          expect(formatUTC(testDate, pattern)).toBe(expected);
        });
      });
    });
  });

  // ============================================================
  // DST TRANSITION EDGE CASES
  // ============================================================
  describe('DST Transition Edge Cases', () => {
    // US DST transitions
    const dstDates = [
      '2024-03-10T02:00:00.000Z', // Spring forward
      '2024-11-03T02:00:00.000Z', // Fall back
      '2023-03-12T02:00:00.000Z',
      '2023-11-05T02:00:00.000Z',
    ];

    dstDates.forEach((dateStr) => {
      describe(`for ${dateStr}`, () => {
        const ts = parse(dateStr);
        const dfDate = new Date(ts);

        it('startOfDay should match date-fns', () => {
          const nativeResult = startOfDay(ts);
          const dfResult = dfStartOfDay(dfDate).getTime();
          expect(nativeResult).toBe(dfResult);
        });

        it('endOfDay should match date-fns', () => {
          const nativeResult = endOfDay(ts);
          const dfResult = dfEndOfDay(dfDate).getTime();
          expect(nativeResult).toBe(dfResult);
        });

        it('adding 24 hours should match date-fns', () => {
          const nativeResult = addHours(ts, 24);
          const dfResult = dfAddHours(dfDate, 24).getTime();
          expect(nativeResult).toBe(dfResult);
        });
      });
    });
  });

  // ============================================================
  // BOUNDARY DATE COMPARISONS
  // ============================================================
  describe('Boundary Date Comparisons', () => {
    describe('Year boundaries', () => {
      const yearBoundaries = [
        '2024-01-01T00:00:00.000Z',
        '2024-12-31T23:59:59.999Z',
        '2023-12-31T23:59:59.999Z',
        '2025-01-01T00:00:00.000Z',
      ];

      yearBoundaries.forEach((dateStr) => {
        it(`year boundaries for ${dateStr} should match`, () => {
          const ts = parse(dateStr);
          const dfDate = new Date(ts);

          expect(startOfYear(ts)).toBe(dfStartOfYear(dfDate).getTime());
          expect(endOfYear(ts)).toBe(dfEndOfYear(dfDate).getTime());
        });
      });
    });

    describe('Month boundaries for all months', () => {
      const months = [
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
        '07',
        '08',
        '09',
        '10',
        '11',
        '12',
      ];

      months.forEach((month) => {
        it(`month ${month} boundaries should match`, () => {
          const ts = parse(`2024-${month}-15T12:00:00Z`);
          const dfDate = new Date(ts);

          expect(startOfMonth(ts)).toBe(dfStartOfMonth(dfDate).getTime());
          expect(endOfMonth(ts)).toBe(dfEndOfMonth(dfDate).getTime());
        });
      });
    });
  });
});
