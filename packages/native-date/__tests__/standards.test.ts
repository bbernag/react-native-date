/**
 * Comprehensive Date Standards Test Suite
 *
 * Tests for ISO 8601 compliance, leap years, month overflow,
 * edge cases, and date/time standards validation.
 */
import {
  parse,
  tryParse,
  formatUTC,
  addMonths,
  addYears,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  getYear,
  getMonth,
  getDate,
  getDay,
  getHours,
  getMinutes,
  getSeconds,
  getMilliseconds,
  getComponents,
  isLeapYear,
  getDaysInMonth,
  diffInDays,
  diffInMonths,
  diffInYears,
  isBefore,
  isAfter,
  isSameDay,
  isSameMonth,
  isSameYear,
} from '../src/index';

describe('Date Standards Compliance', () => {
  // ============================================================
  // ISO 8601 PARSING TESTS
  // ============================================================
  describe('ISO 8601 Parsing', () => {
    describe('Date-only formats', () => {
      it('should parse YYYY-MM-DD as local midnight', () => {
        const result = parse('2024-12-25');
        expect(result).toBeValidTimestamp();
        expect(getYear(result)).toBe(2024);
        expect(getMonth(result)).toBe(12);
        expect(getDate(result)).toBe(25);
        expect(getHours(result)).toBe(0);
        expect(getMinutes(result)).toBe(0);
      });

      it('should parse dates at year boundaries', () => {
        expect(getMonth(parse('2024-01-01'))).toBe(1);
        expect(getDate(parse('2024-01-01'))).toBe(1);
        expect(getMonth(parse('2024-12-31'))).toBe(12);
        expect(getDate(parse('2024-12-31'))).toBe(31);
      });

      it('should parse dates with minimum and maximum days', () => {
        expect(getDate(parse('2024-01-01'))).toBe(1);
        expect(getDate(parse('2024-01-31'))).toBe(31);
        expect(getDate(parse('2024-06-30'))).toBe(30);
      });
    });

    describe('DateTime formats', () => {
      it('should parse YYYY-MM-DDTHH:mm:ss format', () => {
        const result = parse('2024-12-25T10:30:45');
        expect(result).toBeValidTimestamp();
      });

      it('should parse with milliseconds (.SSS)', () => {
        const result = parse('2024-12-25T10:30:45.123Z');
        expect(result).toBeValidTimestamp();
        // Verify milliseconds are preserved
        const ms = getMilliseconds(result);
        expect(ms).toBe(123);
      });

      it('should parse with single-digit milliseconds', () => {
        const result = parse('2024-12-25T10:30:45.1Z');
        expect(result).toBeValidTimestamp();
        expect(getMilliseconds(result)).toBe(100);
      });

      it('should parse with two-digit milliseconds', () => {
        const result = parse('2024-12-25T10:30:45.12Z');
        expect(result).toBeValidTimestamp();
        expect(getMilliseconds(result)).toBe(120);
      });
    });

    describe('Timezone offset formats', () => {
      it('should parse with Z (UTC) indicator', () => {
        const result = parse('2024-12-25T10:30:45Z');
        expect(result).toBeValidTimestamp();
      });

      it('should parse with positive offset (+HH:mm)', () => {
        const result = parse('2024-12-25T10:30:45+05:30');
        expect(result).toBeValidTimestamp();
        // +05:30 means 5 hours 30 minutes ahead of UTC
        // So 10:30:45+05:30 = 05:00:45 UTC
        expect(formatUTC(result, 'HH:mm:ss')).toBe('05:00:45');
      });

      it('should parse with negative offset (-HH:mm)', () => {
        const result = parse('2024-12-25T10:30:45-08:00');
        expect(result).toBeValidTimestamp();
        // -08:00 means 8 hours behind UTC
        // So 10:30:45-08:00 = 18:30:45 UTC
        expect(formatUTC(result, 'HH:mm:ss')).toBe('18:30:45');
      });

      it('should parse offset without colon (+HHmm)', () => {
        const result = parse('2024-12-25T10:30:45+0530');
        expect(result).toBeValidTimestamp();
        expect(formatUTC(result, 'HH:mm:ss')).toBe('05:00:45');
      });

      it('should handle UTC+14 (Line Islands - furthest ahead)', () => {
        const result = parse('2024-12-25T10:30:45+14:00');
        expect(result).toBeValidTimestamp();
        // 10:30+14:00 = 20:30 previous day UTC
        expect(formatUTC(result, 'HH:mm')).toBe('20:30');
        expect(formatUTC(result, 'dd')).toBe('24'); // Previous day
      });

      it('should handle UTC-12 (Baker Island - furthest behind)', () => {
        const result = parse('2024-12-25T10:30:45-12:00');
        expect(result).toBeValidTimestamp();
        // 10:30-12:00 = 22:30 UTC
        expect(formatUTC(result, 'HH:mm')).toBe('22:30');
      });

      it('should handle half-hour offsets (India +5:30)', () => {
        const result = parse('2024-12-25T12:00:00+05:30');
        expect(result).toBeValidTimestamp();
        expect(formatUTC(result, 'HH:mm')).toBe('06:30');
      });

      it('should handle 45-minute offsets (Nepal +5:45)', () => {
        const result = parse('2024-12-25T12:00:00+05:45');
        expect(result).toBeValidTimestamp();
        expect(formatUTC(result, 'HH:mm')).toBe('06:15');
      });
    });

    describe('Edge time values', () => {
      it('should parse midnight (00:00:00)', () => {
        const result = parse('2024-12-25T00:00:00Z');
        // Verify using UTC format
        expect(formatUTC(result, 'HH:mm:ss')).toBe('00:00:00');
      });

      it('should parse end of day (23:59:59)', () => {
        const result = parse('2024-12-25T23:59:59Z');
        // Verify using UTC format
        expect(formatUTC(result, 'HH:mm:ss')).toBe('23:59:59');
      });

      it('should parse maximum milliseconds (999)', () => {
        const result = parse('2024-12-25T23:59:59.999Z');
        expect(getMilliseconds(result)).toBe(999);
      });
    });
  });

  // ============================================================
  // LEAP YEAR TESTS
  // ============================================================
  describe('Leap Year Calculations', () => {
    describe('Gregorian calendar rules', () => {
      it('should identify regular leap years (divisible by 4)', () => {
        expect(isLeapYear(parse('2024-06-15'))).toBe(true);
        expect(isLeapYear(parse('2020-06-15'))).toBe(true);
        expect(isLeapYear(parse('2016-06-15'))).toBe(true);
      });

      it('should identify non-leap years (not divisible by 4)', () => {
        expect(isLeapYear(parse('2023-06-15'))).toBe(false);
        expect(isLeapYear(parse('2022-06-15'))).toBe(false);
        expect(isLeapYear(parse('2021-06-15'))).toBe(false);
      });

      it('should identify century years NOT divisible by 400 as non-leap', () => {
        // 1900, 2100, 2200, 2300 are NOT leap years
        expect(isLeapYear(parse('1900-06-15'))).toBe(false);
        expect(isLeapYear(parse('2100-06-15'))).toBe(false);
        expect(isLeapYear(parse('2200-06-15'))).toBe(false);
        expect(isLeapYear(parse('2300-06-15'))).toBe(false);
      });

      it('should identify century years divisible by 400 as leap', () => {
        // 2000, 2400 are leap years
        expect(isLeapYear(parse('2000-06-15'))).toBe(true);
        expect(isLeapYear(parse('2400-06-15'))).toBe(true);
      });
    });

    describe('February days in leap/non-leap years', () => {
      it('should have 29 days in February for leap years', () => {
        expect(getDaysInMonth(parse('2024-02-15'))).toBe(29);
        expect(getDaysInMonth(parse('2000-02-15'))).toBe(29);
      });

      it('should have 28 days in February for non-leap years', () => {
        expect(getDaysInMonth(parse('2023-02-15'))).toBe(28);
        expect(getDaysInMonth(parse('1900-02-15'))).toBe(28);
        expect(getDaysInMonth(parse('2100-02-15'))).toBe(28);
      });

      it('should correctly parse Feb 29 in leap year', () => {
        const result = parse('2024-02-29T12:00:00Z');
        expect(result).toBeValidTimestamp();
        // Use UTC format to verify
        expect(formatUTC(result, 'MM')).toBe('02');
        expect(formatUTC(result, 'dd')).toBe('29');
      });
    });
  });

  // ============================================================
  // MONTH OVERFLOW TESTS
  // ============================================================
  describe('Month Overflow Handling', () => {
    describe('Adding months with day overflow', () => {
      // Month/year arithmetic clamps to the last valid day (Q1).

      it('should clamp Jan 31 + 1 month to Feb 29 in a leap year', () => {
        const jan31 = parse('2024-01-31T12:00:00Z');
        const result = addMonths(jan31, 1);
        expect(formatUTC(result, 'yyyy-MM-dd')).toBe('2024-02-29');
      });

      it('should handle Jan 15 + 1 month (no overflow)', () => {
        const jan15 = parse('2024-01-15T12:00:00Z');
        const result = addMonths(jan15, 1);
        expect(formatUTC(result, 'MM')).toBe('02');
        expect(formatUTC(result, 'dd')).toBe('15');
      });

      it('should handle adding months without day overflow', () => {
        const jun15 = parse('2024-06-15T12:00:00Z');
        const result = addMonths(jun15, 1);
        expect(formatUTC(result, 'yyyy-MM-dd')).toBe('2024-07-15');
      });

      it('should correctly add 12 months (1 year)', () => {
        const date = parse('2024-06-15T12:00:00Z');
        const result = addMonths(date, 12);
        expect(formatUTC(result, 'yyyy-MM-dd')).toBe('2025-06-15');
      });

      it('should handle subtracting months', () => {
        const mar15 = parse('2024-03-15T12:00:00Z');
        const result = subMonths(mar15, 1);
        expect(formatUTC(result, 'yyyy-MM-dd')).toBe('2024-02-15');
      });
    });

    describe('Year boundary crossing', () => {
      it('should handle Dec + 1 month = Jan next year', () => {
        const dec15 = parse('2024-12-15T12:00:00Z');
        const result = addMonths(dec15, 1);
        expect(formatUTC(result, 'yyyy')).toBe('2025');
        expect(formatUTC(result, 'MM')).toBe('01');
      });

      it('should handle Jan - 1 month = Dec previous year', () => {
        const jan15 = parse('2024-01-15T12:00:00Z');
        const result = subMonths(jan15, 1);
        expect(formatUTC(result, 'yyyy')).toBe('2023');
        expect(formatUTC(result, 'MM')).toBe('12');
      });
    });

    describe('Adding/Subtracting years', () => {
      it('should handle adding years', () => {
        const date = parse('2024-06-15T12:00:00Z');
        const result = addYears(date, 1);
        expect(formatUTC(result, 'yyyy-MM-dd')).toBe('2025-06-15');
      });

      it('should handle subtracting years', () => {
        const date = parse('2024-06-15T12:00:00Z');
        const result = subYears(date, 1);
        expect(formatUTC(result, 'yyyy-MM-dd')).toBe('2023-06-15');
      });

      it('should handle Feb 29 + 4 years (to next leap year)', () => {
        const feb29 = parse('2024-02-29T12:00:00Z');
        const result = addYears(feb29, 4);
        expect(formatUTC(result, 'yyyy-MM-dd')).toBe('2028-02-29');
      });
    });
  });

  // ============================================================
  // DATE BOUNDARY TESTS
  // ============================================================
  describe('Date Boundaries', () => {
    describe('Day boundaries', () => {
      it('should get correct start of day', () => {
        const date = parse('2024-06-15T14:30:45.123Z');
        const start = startOfDay(date);
        // startOfDay works in local time, verify time components are zeroed
        expect(getMinutes(start)).toBe(0);
        expect(getSeconds(start)).toBe(0);
        expect(getMilliseconds(start)).toBe(0);
      });

      it('should get correct end of day', () => {
        const date = parse('2024-06-15T14:30:45.123Z');
        const end = endOfDay(date);
        // endOfDay works in local time, verify time components are at day end
        expect(getMinutes(end)).toBe(59);
        expect(getSeconds(end)).toBe(59);
        expect(getMilliseconds(end)).toBe(999);
      });
    });

    describe('Month boundaries', () => {
      it('should get correct start of month', () => {
        const date = parse('2024-06-15T14:30:45Z');
        const start = startOfMonth(date);
        expect(getDate(start)).toBe(1);
      });

      it('should get correct end of month for 31-day months', () => {
        const jan = parse('2024-01-15');
        expect(getDate(endOfMonth(jan))).toBe(31);

        const mar = parse('2024-03-15');
        expect(getDate(endOfMonth(mar))).toBe(31);

        const may = parse('2024-05-15');
        expect(getDate(endOfMonth(may))).toBe(31);

        const jul = parse('2024-07-15');
        expect(getDate(endOfMonth(jul))).toBe(31);

        const aug = parse('2024-08-15');
        expect(getDate(endOfMonth(aug))).toBe(31);

        const oct = parse('2024-10-15');
        expect(getDate(endOfMonth(oct))).toBe(31);

        const dec = parse('2024-12-15');
        expect(getDate(endOfMonth(dec))).toBe(31);
      });

      it('should get correct end of month for 30-day months', () => {
        const apr = parse('2024-04-15');
        expect(getDate(endOfMonth(apr))).toBe(30);

        const jun = parse('2024-06-15');
        expect(getDate(endOfMonth(jun))).toBe(30);

        const sep = parse('2024-09-15');
        expect(getDate(endOfMonth(sep))).toBe(30);

        const nov = parse('2024-11-15');
        expect(getDate(endOfMonth(nov))).toBe(30);
      });
    });

    describe('Year boundaries', () => {
      it('should get correct start of year', () => {
        const date = parse('2024-06-15T14:30:45Z');
        const start = startOfYear(date);
        expect(getMonth(start)).toBe(1);
        expect(getDate(start)).toBe(1);
      });

      it('should get correct end of year', () => {
        const date = parse('2024-06-15T14:30:45Z');
        const end = endOfYear(date);
        expect(getMonth(end)).toBe(12);
        expect(getDate(end)).toBe(31);
      });
    });
  });

  // ============================================================
  // DATE COMPONENT GETTERS
  // ============================================================
  describe('Date Component Getters', () => {
    // Note: getYear, getMonth, getDate, getHours, etc. return LOCAL time values
    // Use formatUTC for UTC-based assertions

    it('should get correct year', () => {
      const testDate = parse('2024-06-15T14:30:45.123Z');
      expect(getYear(testDate)).toBe(2024);
    });

    it('should get correct month (1-indexed)', () => {
      const testDate = parse('2024-06-15T12:00:00Z');
      // Month 6 in UTC should be June
      expect(formatUTC(testDate, 'MM')).toBe('06');
    });

    it('should get correct date', () => {
      const testDate = parse('2024-06-15T12:00:00Z');
      expect(formatUTC(testDate, 'dd')).toBe('15');
    });

    it('should get correct day of week', () => {
      // June 15, 2024 is a Saturday (6)
      const testDate = parse('2024-06-15T12:00:00Z');
      expect(getDay(testDate)).toBe(6);
    });

    it('should get correct hours via UTC format', () => {
      const testDate = parse('2024-06-15T14:30:45.123Z');
      expect(formatUTC(testDate, 'HH')).toBe('14');
    });

    it('should get correct minutes', () => {
      const testDate = parse('2024-06-15T14:30:45.123Z');
      expect(getMinutes(testDate)).toBe(30);
    });

    it('should get correct seconds', () => {
      const testDate = parse('2024-06-15T14:30:45.123Z');
      expect(getSeconds(testDate)).toBe(45);
    });

    it('should get correct milliseconds', () => {
      const testDate = parse('2024-06-15T14:30:45.123Z');
      expect(getMilliseconds(testDate)).toBe(123);
    });

    it('should get all components at once (local time)', () => {
      const testDate = parse('2024-06-15T14:30:45.123Z');
      const components = getComponents(testDate);
      // Year should be 2024 regardless of timezone
      expect(components.year).toBe(2024);
      // Minutes/seconds/milliseconds don't shift with timezone
      expect(components.minute).toBe(30);
      expect(components.second).toBe(45);
      expect(components.millisecond).toBe(123);
    });
  });

  // ============================================================
  // DAY OF WEEK TESTS
  // ============================================================
  describe('Day of Week Calculations', () => {
    // Note: Using UTC noon to avoid timezone day shifts

    it('should correctly identify Sunday (0)', () => {
      // June 16, 2024 is a Sunday
      expect(getDay(parse('2024-06-16T12:00:00Z'))).toBe(0);
    });

    it('should correctly identify Monday (1)', () => {
      // June 17, 2024 is a Monday
      expect(getDay(parse('2024-06-17T12:00:00Z'))).toBe(1);
    });

    it('should correctly identify Saturday (6)', () => {
      // June 15, 2024 is a Saturday
      expect(getDay(parse('2024-06-15T12:00:00Z'))).toBe(6);
    });

    it('should handle epoch date (Jan 1, 1970 was Thursday)', () => {
      expect(getDay(parse('1970-01-01T12:00:00Z'))).toBe(4);
    });

    it('should handle dates across year boundaries', () => {
      // Jan 1, 2024 is a Monday
      expect(getDay(parse('2024-01-01T12:00:00Z'))).toBe(1);
      // Dec 31, 2024 is a Tuesday
      expect(getDay(parse('2024-12-31T12:00:00Z'))).toBe(2);
    });
  });

  // ============================================================
  // DATE DIFFERENCE TESTS
  // ============================================================
  describe('Date Differences', () => {
    describe('diffInDays', () => {
      it('should calculate days between dates', () => {
        const date1 = parse('2024-06-15');
        const date2 = parse('2024-06-20');
        expect(diffInDays(date2, date1)).toBe(5);
      });

      it('should return negative for earlier dates', () => {
        const date1 = parse('2024-06-15');
        const date2 = parse('2024-06-10');
        expect(diffInDays(date2, date1)).toBe(-5);
      });

      it('should handle year boundaries', () => {
        const date1 = parse('2024-12-31');
        const date2 = parse('2025-01-01');
        expect(diffInDays(date2, date1)).toBe(1);
      });

      it('should account for leap years', () => {
        const date1 = parse('2024-02-28');
        const date2 = parse('2024-03-01');
        expect(diffInDays(date2, date1)).toBe(2); // Feb 28 -> Feb 29 -> Mar 1
      });
    });

    describe('diffInMonths', () => {
      it('should count complete local months', () => {
        const date1 = parse('2024-01-15T12:00:00Z');
        const date2 = parse('2024-06-16T12:00:00Z');
        expect(diffInMonths(date2, date1)).toBe(5);
      });

      it('should handle year boundaries', () => {
        const date1 = parse('2024-11-15T12:00:00Z');
        const date2 = parse('2025-02-16T12:00:00Z');
        expect(diffInMonths(date2, date1)).toBe(3);
      });
    });

    describe('diffInYears', () => {
      it('should calculate years between dates', () => {
        const date1 = parse('2020-06-15');
        const date2 = parse('2024-06-15');
        expect(diffInYears(date2, date1)).toBe(4);
      });
    });
  });

  // ============================================================
  // DATE COMPARISON TESTS
  // ============================================================
  describe('Date Comparisons', () => {
    describe('isBefore / isAfter', () => {
      it('should correctly identify before relationship', () => {
        const date1 = parse('2024-06-15');
        const date2 = parse('2024-06-20');
        expect(isBefore(date1, date2)).toBe(true);
        expect(isBefore(date2, date1)).toBe(false);
      });

      it('should correctly identify after relationship', () => {
        const date1 = parse('2024-06-15');
        const date2 = parse('2024-06-20');
        expect(isAfter(date2, date1)).toBe(true);
        expect(isAfter(date1, date2)).toBe(false);
      });

      it('should handle equal dates', () => {
        const date1 = parse('2024-06-15');
        const date2 = parse('2024-06-15');
        expect(isBefore(date1, date2)).toBe(false);
        expect(isAfter(date1, date2)).toBe(false);
      });
    });

    describe('isSameDay / isSameMonth / isSameYear', () => {
      it('should identify same day (local time comparison)', () => {
        // Use local time strings - these should be same day in any timezone
        const date1 = parse('2024-06-15T10:00:00');
        const date2 = parse('2024-06-15T20:00:00');
        expect(isSameDay(date1, date2)).toBe(true);
      });

      it('should identify different days (local time comparison)', () => {
        const date1 = parse('2024-06-15T12:00:00');
        const date2 = parse('2024-06-16T12:00:00');
        expect(isSameDay(date1, date2)).toBe(false);
      });

      it('should identify same month (local time comparison)', () => {
        const date1 = parse('2024-06-01T12:00:00');
        const date2 = parse('2024-06-30T12:00:00');
        expect(isSameMonth(date1, date2)).toBe(true);
      });

      it('should identify same year (local time comparison)', () => {
        const date1 = parse('2024-01-15T12:00:00');
        const date2 = parse('2024-12-15T12:00:00');
        expect(isSameYear(date1, date2)).toBe(true);
      });
    });
  });

  // ============================================================
  // EXTREME DATE VALUES
  // ============================================================
  describe('Extreme Date Values', () => {
    describe('Pre-epoch dates (before 1970)', () => {
      it('should handle dates before Unix epoch', () => {
        const result = parse('1969-12-31T23:59:59Z');
        expect(result).toBeValidTimestamp();
        expect(result).toBeLessThan(0); // Negative timestamp
      });

      it('should handle year 1900', () => {
        const result = parse('1900-06-15T12:00:00Z');
        expect(result).toBeValidTimestamp();
        expect(formatUTC(result, 'yyyy')).toBe('1900');
      });

      it('should handle early 20th century dates', () => {
        const result = parse('1950-06-15T12:00:00Z');
        expect(result).toBeValidTimestamp();
        expect(formatUTC(result, 'yyyy')).toBe('1950');
      });
    });

    describe('Far future dates', () => {
      it('should handle year 2100', () => {
        const result = parse('2100-06-15T12:00:00Z');
        expect(result).toBeValidTimestamp();
        expect(formatUTC(result, 'yyyy')).toBe('2100');
      });

      it('should handle year 3000', () => {
        const result = parse('3000-06-15T12:00:00Z');
        expect(result).toBeValidTimestamp();
        expect(formatUTC(result, 'yyyy')).toBe('3000');
      });
    });

    describe('Epoch boundary', () => {
      it('should correctly handle Unix epoch (1970-01-01T00:00:00Z)', () => {
        const epoch = parse('1970-01-01T00:00:00Z');
        expect(epoch).toBe(0);
      });

      it('should handle one millisecond before epoch', () => {
        const result = parse('1969-12-31T23:59:59.999Z');
        expect(result).toBe(-1);
      });

      it('should handle one millisecond after epoch', () => {
        const result = parse('1970-01-01T00:00:00.001Z');
        expect(result).toBe(1);
      });
    });
  });

  // ============================================================
  // INVALID INPUT HANDLING
  // ============================================================
  describe('Invalid Input Handling', () => {
    // Strict ISO-8601: invalid calendar dates and non-ISO strings are rejected.

    describe('Malformed strings', () => {
      it('should reject empty string', () => {
        expect(tryParse('')).toBeNull();
      });

      it('should reject random text', () => {
        expect(tryParse('not-a-date')).toBeNull();
        expect(tryParse('hello world')).toBeNull();
      });

      it('should reject clearly invalid formats', () => {
        expect(tryParse('abc-def-ghi')).toBeNull();
        expect(tryParse('12-34-5678')).toBeNull();
      });
    });

    describe('Calendar validation', () => {
      it('should reject Feb 30 rather than overflowing to March', () => {
        expect(tryParse('2024-02-30')).toBeNull();
        expect(() => parse('2024-02-30')).toThrow(/Invalid ISO-8601/);
      });

      it('should parse standard dates without issue', () => {
        expect(tryParse('2024-06-15')).not.toBeNull();
        expect(tryParse('2024-12-31')).not.toBeNull();
        expect(tryParse('2024-01-01')).not.toBeNull();
      });
    });
  });

  // ============================================================
  // FORMAT TOKEN TESTS
  // ============================================================
  describe('Format Tokens', () => {
    const testDate = parse('2024-06-05T09:05:03.007Z');

    describe('Year tokens', () => {
      it('should format yyyy (4-digit year)', () => {
        expect(formatUTC(testDate, 'yyyy')).toBe('2024');
      });

      it('should format yy (2-digit year)', () => {
        expect(formatUTC(testDate, 'yy')).toBe('24');
      });
    });

    describe('Month tokens', () => {
      it('should format MM (2-digit month)', () => {
        expect(formatUTC(testDate, 'MM')).toBe('06');
      });

      it('should format M as the narrow month name', () => {
        expect(formatUTC(testDate, 'M')).toBe('J');
      });
    });

    describe('Day tokens', () => {
      it('should format dd (2-digit day)', () => {
        expect(formatUTC(testDate, 'dd')).toBe('05');
      });

      it('should format d (1-digit day)', () => {
        expect(formatUTC(testDate, 'd')).toBe('5');
      });
    });

    describe('Hour tokens', () => {
      it('should format HH (24-hour, 2-digit)', () => {
        expect(formatUTC(testDate, 'HH')).toBe('09');
      });

      it('should format H (24-hour, 1-digit)', () => {
        expect(formatUTC(testDate, 'H')).toBe('9');
      });

      it('should format hh (12-hour, 2-digit)', () => {
        expect(formatUTC(testDate, 'hh')).toBe('09');
      });
    });

    describe('Minute tokens', () => {
      it('should format mm (2-digit)', () => {
        expect(formatUTC(testDate, 'mm')).toBe('05');
      });

      it('should format m (1-digit)', () => {
        expect(formatUTC(testDate, 'm')).toBe('5');
      });
    });

    describe('Second tokens', () => {
      it('should format ss (2-digit)', () => {
        expect(formatUTC(testDate, 'ss')).toBe('03');
      });

      it('should format s (1-digit)', () => {
        expect(formatUTC(testDate, 's')).toBe('3');
      });
    });

    describe('Millisecond tokens', () => {
      it('should format SSS (3-digit)', () => {
        expect(formatUTC(testDate, 'SSS')).toBe('007');
      });
    });

    describe('AM/PM tokens', () => {
      it('should format A (uppercase AM/PM)', () => {
        const am = parse('2024-06-15T09:00:00Z');
        const pm = parse('2024-06-15T15:00:00Z');
        expect(formatUTC(am, 'A')).toBe('AM');
        expect(formatUTC(pm, 'A')).toBe('PM');
      });

      it('should format a (lowercase)', () => {
        const am = parse('2024-06-15T09:00:00Z');
        const pm = parse('2024-06-15T15:00:00Z');
        expect(formatUTC(am, 'a')).toBe('a');
        expect(formatUTC(pm, 'a')).toBe('p');
      });
    });

    describe('Complex patterns', () => {
      it('should handle full datetime pattern', () => {
        const date = parse('2024-12-25T14:30:45.123Z');
        expect(formatUTC(date, 'yyyy-MM-dd HH:mm:ss.SSS')).toBe(
          '2024-12-25 14:30:45.123'
        );
      });

      it('should handle pattern with separators', () => {
        const date = parse('2024-06-15T12:00:00Z');
        expect(formatUTC(date, 'yyyy/MM/dd')).toBe('2024/06/15');
      });

      it('should handle time-only pattern', () => {
        const date = parse('2024-06-15T14:30:45Z');
        expect(formatUTC(date, 'HH:mm:ss')).toBe('14:30:45');
      });
    });
  });

  // ============================================================
  // DAYS IN MONTH TESTS
  // ============================================================
  describe('Days in Month', () => {
    it('should return 31 for January', () => {
      expect(getDaysInMonth(parse('2024-01-15'))).toBe(31);
    });

    it('should return 28/29 for February', () => {
      expect(getDaysInMonth(parse('2024-02-15'))).toBe(29); // Leap year
      expect(getDaysInMonth(parse('2023-02-15'))).toBe(28); // Non-leap year
    });

    it('should return 31 for March', () => {
      expect(getDaysInMonth(parse('2024-03-15'))).toBe(31);
    });

    it('should return 30 for April', () => {
      expect(getDaysInMonth(parse('2024-04-15'))).toBe(30);
    });

    it('should return 31 for May', () => {
      expect(getDaysInMonth(parse('2024-05-15'))).toBe(31);
    });

    it('should return 30 for June', () => {
      expect(getDaysInMonth(parse('2024-06-15'))).toBe(30);
    });

    it('should return 31 for July', () => {
      expect(getDaysInMonth(parse('2024-07-15'))).toBe(31);
    });

    it('should return 31 for August', () => {
      expect(getDaysInMonth(parse('2024-08-15'))).toBe(31);
    });

    it('should return 30 for September', () => {
      expect(getDaysInMonth(parse('2024-09-15'))).toBe(30);
    });

    it('should return 31 for October', () => {
      expect(getDaysInMonth(parse('2024-10-15'))).toBe(31);
    });

    it('should return 30 for November', () => {
      expect(getDaysInMonth(parse('2024-11-15'))).toBe(30);
    });

    it('should return 31 for December', () => {
      expect(getDaysInMonth(parse('2024-12-15'))).toBe(31);
    });
  });
});
