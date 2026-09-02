import {
  parse,
  formatUTC,
  getTimezone,
  getTimezoneOffset,
  getOffsetInTimezone,
  formatInTimezone,
  getAvailableTimezones,
  isValidTimezone,
  toTimezone,
  toUTC,
  formatInUTC,
  now,
  addDays,
  subDays,
  isTodayInTz,
  isTomorrowInTz,
  isYesterdayInTz,
  isSameDayInTz,
  isSameMonthInTz,
  isSameYearInTz,
  startOfDayInTz,
  endOfDayInTz,
} from '../src/index';

describe('Timezone Functions', () => {
  const testDate = parse('2024-06-15T12:00:00');

  describe('getTimezone()', () => {
    it('should return a timezone string', () => {
      const tz = getTimezone();
      expect(typeof tz).toBe('string');
      expect(tz.length).toBeGreaterThan(0);
    });
  });

  describe('getTimezoneOffset()', () => {
    it('should return a number', () => {
      const offset = getTimezoneOffset();
      expect(typeof offset).toBe('number');
    });

    it('should be within the east-positive range covering UTC-12..UTC+14', () => {
      // East-positive minutes (Tokyo = +540), opposite of Date#getTimezoneOffset.
      const offset = getTimezoneOffset();
      expect(offset).toBeGreaterThanOrEqual(-720);
      expect(offset).toBeLessThanOrEqual(840);
    });
  });

  describe('formatInTimezone()', () => {
    it('should format date in specified timezone', () => {
      const result = formatInTimezone(
        testDate,
        'yyyy-MM-dd',
        'America/New_York'
      );
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should format time in specified timezone', () => {
      const result = formatInTimezone(testDate, 'HH:mm:ss', 'UTC');
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('getAvailableTimezones()', () => {
    it('should return an array of timezone strings', () => {
      const timezones = getAvailableTimezones();
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it('should include common timezones', () => {
      const timezones = getAvailableTimezones();
      expect(timezones).toContain('UTC');
      expect(timezones).toContain('America/New_York');
    });
  });

  describe('isValidTimezone()', () => {
    it('should return true for valid timezones', () => {
      expect(isValidTimezone('UTC')).toBe(true);
      expect(isValidTimezone('America/New_York')).toBe(true);
      expect(isValidTimezone('Asia/Tokyo')).toBe(true);
    });

    it('should return false for invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(isValidTimezone('')).toBe(false);
      expect(isValidTimezone('Not_A_Timezone')).toBe(false);
      expect(isValidTimezone('America/NewYork')).toBe(false);
    });

    it('should accept UTC aliases', () => {
      expect(isValidTimezone('UTC')).toBe(true);
      expect(isValidTimezone('utc')).toBe(true);
      expect(isValidTimezone('Etc/UTC')).toBe(true);
      expect(isValidTimezone('Z')).toBe(true);
    });
  });

  describe('invalid timezone names throw (Q4)', () => {
    const ts = parse('2024-06-15T12:00:00Z');

    it('throws Invalid timezone for unknown names', () => {
      expect(() => formatInTimezone(ts, 'yyyy', 'America/NewYork')).toThrow(
        /Invalid timezone: 'America\/NewYork'/
      );
      expect(() => getOffsetInTimezone(ts, 'Not_A_Timezone')).toThrow(
        /Invalid timezone/
      );
    });
  });

  describe('toTimezone() shifted-epoch semantics (Q5)', () => {
    it('shifts the epoch so formatUTC shows the zone wall clock', () => {
      const ts = parse('2024-06-15T12:00:00Z');
      const tokyo = toTimezone(ts, 'Asia/Tokyo');
      expect(formatUTC(tokyo, 'HH:mm')).toBe('21:00');
      expect(formatInTimezone(ts, 'HH:mm', 'Asia/Tokyo')).toBe('21:00');
      expect(tokyo).not.toBe(ts);
    });

    it('is a no-op for UTC', () => {
      const ts = parse('2024-06-15T12:00:00Z');
      expect(toTimezone(ts, 'UTC')).toBe(ts);
      expect(toTimezone(ts, 'utc')).toBe(ts);
      expect(toUTC(ts)).toBe(ts);
    });
  });

  describe('abbreviation aliases', () => {
    it('GMT and WET are offset 0 year-round', () => {
      const july = parse('2024-07-15T12:00:00Z');
      const january = parse('2024-01-15T12:00:00Z');
      expect(getOffsetInTimezone(july, 'GMT')).toBe(0);
      expect(getOffsetInTimezone(january, 'WET')).toBe(0);
    });

    it('Kolkata is fixed +330', () => {
      const july = parse('2024-07-15T12:00:00Z');
      expect(getOffsetInTimezone(july, 'Asia/Kolkata')).toBe(330);
      expect(getOffsetInTimezone(july, 'IST')).toBe(330);
    });
  });

  describe('toUTC()', () => {
    it('should convert timestamp to UTC', () => {
      const result = toUTC(testDate);
      expect(typeof result).toBe('number');
      expect(result).toBeValidTimestamp();
    });
  });

  describe('formatInUTC()', () => {
    it('should format date in UTC', () => {
      const result = formatInUTC(testDate, 'yyyy-MM-dd HH:mm:ss');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('getOffsetInTimezone()', () => {
    it('should return 0 for UTC', () => {
      const offset = getOffsetInTimezone(testDate, 'UTC');
      expect(offset).toBe(0);
    });

    it('should return correct offset for known timezone', () => {
      // UTC timestamp for Jan 15, 2024 12:00 UTC
      const utcDate = parse('2024-01-15T12:00:00Z');
      const nyOffset = getOffsetInTimezone(utcDate, 'America/New_York');
      // In January, NY is EST (UTC-5), so offset should be -300 minutes
      expect(nyOffset).toBe(-300);
    });

    it('should handle DST correctly', () => {
      // In summer, NY is EDT (UTC-4)
      const summerDate = parse('2024-06-15T12:00:00Z');
      const nyOffset = getOffsetInTimezone(summerDate, 'America/New_York');
      // In June, NY is EDT (UTC-4), so offset should be -240 minutes
      expect(nyOffset).toBe(-240);
    });
  });
});

describe('Timezone-Aware Predicates (InTz)', () => {
  describe('isTodayInTz()', () => {
    it('should return true for current time in any timezone', () => {
      const current = now();
      expect(isTodayInTz(current, 'America/New_York')).toBe(true);
      expect(isTodayInTz(current, 'Asia/Tokyo')).toBe(true);
      expect(isTodayInTz(current, 'UTC')).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = subDays(now(), 1);
      expect(isTodayInTz(yesterday, 'UTC')).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = addDays(now(), 1);
      expect(isTodayInTz(tomorrow, 'UTC')).toBe(false);
    });
  });

  describe('isTomorrowInTz()', () => {
    it('should return true for tomorrow', () => {
      const tomorrow = addDays(now(), 1);
      expect(isTomorrowInTz(tomorrow, 'UTC')).toBe(true);
    });

    it('should return false for today', () => {
      expect(isTomorrowInTz(now(), 'UTC')).toBe(false);
    });
  });

  describe('isYesterdayInTz()', () => {
    it('should return true for yesterday', () => {
      const yesterday = subDays(now(), 1);
      expect(isYesterdayInTz(yesterday, 'UTC')).toBe(true);
    });

    it('should return false for today', () => {
      expect(isYesterdayInTz(now(), 'UTC')).toBe(false);
    });
  });

  describe('isSameDayInTz()', () => {
    it('should return true for same day in timezone', () => {
      const date1 = parse('2024-06-15T10:00:00Z');
      const date2 = parse('2024-06-15T22:00:00Z');
      expect(isSameDayInTz(date1, date2, 'UTC')).toBe(true);
    });

    it('should return false for different days in timezone', () => {
      const date1 = parse('2024-06-15T12:00:00Z');
      const date2 = parse('2024-06-16T12:00:00Z');
      expect(isSameDayInTz(date1, date2, 'UTC')).toBe(false);
    });

    it('should handle timezone boundary correctly', () => {
      // 11pm UTC on June 15 = 8am June 16 in Tokyo (UTC+9)
      const date1 = parse('2024-06-15T23:00:00Z');
      const date2 = parse('2024-06-16T08:00:00Z');
      // In Tokyo, both are June 16
      expect(isSameDayInTz(date1, date2, 'Asia/Tokyo')).toBe(true);
      // In UTC, they're different days
      expect(isSameDayInTz(date1, date2, 'UTC')).toBe(false);
    });
  });

  describe('isSameMonthInTz()', () => {
    it('should return true for same month in timezone', () => {
      const date1 = parse('2024-06-01T12:00:00Z');
      const date2 = parse('2024-06-30T12:00:00Z');
      expect(isSameMonthInTz(date1, date2, 'UTC')).toBe(true);
    });

    it('should return false for different months', () => {
      const date1 = parse('2024-06-30T12:00:00Z');
      const date2 = parse('2024-07-01T12:00:00Z');
      expect(isSameMonthInTz(date1, date2, 'UTC')).toBe(false);
    });
  });

  describe('isSameYearInTz()', () => {
    it('should return true for same year in timezone', () => {
      const date1 = parse('2024-01-15T12:00:00Z');
      const date2 = parse('2024-12-15T12:00:00Z');
      expect(isSameYearInTz(date1, date2, 'UTC')).toBe(true);
    });

    it('should return false for different years', () => {
      const date1 = parse('2024-12-31T12:00:00Z');
      const date2 = parse('2025-01-01T12:00:00Z');
      expect(isSameYearInTz(date1, date2, 'UTC')).toBe(false);
    });
  });

  describe('startOfDayInTz()', () => {
    it('should return midnight UTC for UTC timezone', () => {
      const date = parse('2024-06-15T14:30:00Z');
      const startOfDay = startOfDayInTz(date, 'UTC');
      const formatted = formatInTimezone(
        startOfDay,
        'yyyy-MM-dd HH:mm:ss',
        'UTC'
      );
      expect(formatted).toBe('2024-06-15 00:00:00');
    });

    it('should return midnight in specified timezone', () => {
      const date = parse('2024-06-15T14:30:00Z');
      const startOfDay = startOfDayInTz(date, 'America/New_York');
      const formatted = formatInTimezone(
        startOfDay,
        'yyyy-MM-dd HH:mm:ss',
        'America/New_York'
      );
      expect(formatted).toBe('2024-06-15 00:00:00');
    });

    it('should return correct UTC timestamp for timezone midnight', () => {
      // Midnight in NY (UTC-4 in June) should be 04:00 UTC
      const date = parse('2024-06-15T14:30:00Z');
      const startOfDay = startOfDayInTz(date, 'America/New_York');
      const formattedUTC = formatInTimezone(startOfDay, 'HH:mm:ss', 'UTC');
      expect(formattedUTC).toBe('04:00:00');
    });
  });

  describe('endOfDayInTz()', () => {
    it('should return end of day in specified timezone', () => {
      const date = parse('2024-06-15T14:30:00Z');
      const endOfDay = endOfDayInTz(date, 'UTC');
      const formatted = formatInTimezone(
        endOfDay,
        'yyyy-MM-dd HH:mm:ss',
        'UTC'
      );
      expect(formatted).toBe('2024-06-15 23:59:59');
    });

    it('should be 1ms before next day start', () => {
      const date = parse('2024-06-15T14:30:00Z');
      const endOfDay = endOfDayInTz(date, 'UTC');
      const nextDayStart = startOfDayInTz(addDays(date, 1), 'UTC');
      expect(nextDayStart - endOfDay).toBe(1);
    });
  });
});
