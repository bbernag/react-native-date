import {
  parse,
  getTimezone,
  getTimezoneOffset,
  formatInTimezone,
  getAvailableTimezones,
  isValidTimezone,
  toUTC,
  formatInUTC,
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

    it('should be within valid range (-720 to 840)', () => {
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
});
