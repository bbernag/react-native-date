import {
  parse,
  format,
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
} from '../src/index';

describe('Date Boundaries', () => {
  const baseDate = parse('2024-06-15T14:30:45.123');

  describe('startOf()', () => {
    it('should get start of day', () => {
      const result = startOf(baseDate, 'day');
      expect(format(result, 'yyyy-MM-dd HH:mm:ss')).toBe('2024-06-15 00:00:00');
    });

    it('should get start of month', () => {
      const result = startOf(baseDate, 'month');
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-06-01');
    });

    it('should get start of year', () => {
      const result = startOf(baseDate, 'year');
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-01-01');
    });

    it('should get start of week', () => {
      const result = startOf(baseDate, 'week');
      // June 15, 2024 is Saturday, start of week (Sunday) is June 9
      expect(format(result, 'HH:mm:ss')).toBe('00:00:00');
    });

    it('should get start of hour', () => {
      const result = startOf(baseDate, 'hour');
      expect(format(result, 'HH:mm:ss')).toBe('14:00:00');
    });

    it('should get start of minute', () => {
      const result = startOf(baseDate, 'minute');
      expect(format(result, 'HH:mm:ss')).toBe('14:30:00');
    });
  });

  describe('endOf()', () => {
    it('should get end of day', () => {
      const result = endOf(baseDate, 'day');
      expect(format(result, 'HH:mm:ss')).toBe('23:59:59');
    });

    it('should get end of month', () => {
      const result = endOf(baseDate, 'month');
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-06-30');
    });

    it('should get end of year', () => {
      const result = endOf(baseDate, 'year');
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-12-31');
    });

    it('should get end of hour', () => {
      const result = endOf(baseDate, 'hour');
      expect(format(result, 'HH:mm:ss')).toBe('14:59:59');
    });
  });

  describe('Convenience functions', () => {
    it('startOfDay should return midnight', () => {
      const result = startOfDay(baseDate);
      expect(format(result, 'HH:mm:ss')).toBe('00:00:00');
    });

    it('endOfDay should return 23:59:59', () => {
      const result = endOfDay(baseDate);
      expect(format(result, 'HH:mm:ss')).toBe('23:59:59');
    });

    it('startOfWeek should return start of week', () => {
      const result = startOfWeek(baseDate);
      expect(format(result, 'HH:mm:ss')).toBe('00:00:00');
    });

    it('endOfWeek should return end of week', () => {
      const result = endOfWeek(baseDate);
      expect(format(result, 'HH:mm:ss')).toBe('23:59:59');
    });

    it('startOfMonth should return first day of month', () => {
      const result = startOfMonth(baseDate);
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-06-01');
    });

    it('endOfMonth should return last day of month', () => {
      const result = endOfMonth(baseDate);
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-06-30');
    });

    it('startOfYear should return Jan 1', () => {
      const result = startOfYear(baseDate);
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-01-01');
    });

    it('endOfYear should return Dec 31', () => {
      const result = endOfYear(baseDate);
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-12-31');
    });
  });

  describe('Edge cases', () => {
    it('should handle February end of month in leap year', () => {
      const feb2024 = parse('2024-02-15');
      const result = endOfMonth(feb2024);
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-02-29');
    });

    it('should handle February end of month in non-leap year', () => {
      const feb2023 = parse('2023-02-15');
      const result = endOfMonth(feb2023);
      expect(format(result, 'yyyy-MM-dd')).toBe('2023-02-28');
    });

    it('should handle months with 31 days', () => {
      const jan = parse('2024-01-15');
      const result = endOfMonth(jan);
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-01-31');
    });

    it('should handle months with 30 days', () => {
      const apr = parse('2024-04-15');
      const result = endOfMonth(apr);
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-04-30');
    });
  });
});
