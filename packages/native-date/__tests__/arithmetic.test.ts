import {
  parse,
  format,
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
} from '../src/index';

describe('Date Arithmetic', () => {
  const baseDate = parse('2024-06-15T12:00:00');

  describe('add()', () => {
    it('should add days', () => {
      const result = add(baseDate, 5, 'day');
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-06-20');
    });

    it('should add months', () => {
      const result = add(baseDate, 2, 'month');
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-08-15');
    });

    it('should add years', () => {
      const result = add(baseDate, 1, 'year');
      expect(format(result, 'yyyy-MM-dd')).toBe('2025-06-15');
    });

    it('should add weeks', () => {
      const result = add(baseDate, 2, 'week');
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-06-29');
    });

    it('should add hours', () => {
      const result = add(baseDate, 3, 'hour');
      expect(format(result, 'HH:mm')).toBe('15:00');
    });

    it('should add minutes', () => {
      const result = add(baseDate, 45, 'minute');
      expect(format(result, 'HH:mm')).toBe('12:45');
    });

    it('should add seconds', () => {
      const result = add(baseDate, 30, 'second');
      expect(format(result, 'HH:mm:ss')).toBe('12:00:30');
    });
  });

  describe('subtract()', () => {
    it('should subtract days', () => {
      const result = subtract(baseDate, 5, 'day');
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-06-10');
    });

    it('should subtract months', () => {
      const result = subtract(baseDate, 2, 'month');
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-04-15');
    });

    it('should subtract years', () => {
      const result = subtract(baseDate, 1, 'year');
      expect(format(result, 'yyyy-MM-dd')).toBe('2023-06-15');
    });
  });

  describe('Convenience functions', () => {
    it('addDays should add days', () => {
      expect(format(addDays(baseDate, 10), 'yyyy-MM-dd')).toBe('2024-06-25');
    });

    it('subDays should subtract days', () => {
      expect(format(subDays(baseDate, 10), 'yyyy-MM-dd')).toBe('2024-06-05');
    });

    it('addMonths should add months', () => {
      expect(format(addMonths(baseDate, 3), 'yyyy-MM-dd')).toBe('2024-09-15');
    });

    it('subMonths should subtract months', () => {
      expect(format(subMonths(baseDate, 3), 'yyyy-MM-dd')).toBe('2024-03-15');
    });

    it('addYears should add years', () => {
      expect(format(addYears(baseDate, 2), 'yyyy-MM-dd')).toBe('2026-06-15');
    });

    it('subYears should subtract years', () => {
      expect(format(subYears(baseDate, 2), 'yyyy-MM-dd')).toBe('2022-06-15');
    });

    it('addWeeks should add weeks', () => {
      expect(format(addWeeks(baseDate, 1), 'yyyy-MM-dd')).toBe('2024-06-22');
    });

    it('subWeeks should subtract weeks', () => {
      expect(format(subWeeks(baseDate, 1), 'yyyy-MM-dd')).toBe('2024-06-08');
    });

    it('addHours should add hours', () => {
      expect(format(addHours(baseDate, 5), 'HH:mm')).toBe('17:00');
    });

    it('subHours should subtract hours', () => {
      expect(format(subHours(baseDate, 5), 'HH:mm')).toBe('07:00');
    });

    it('addMinutes should add minutes', () => {
      expect(format(addMinutes(baseDate, 30), 'HH:mm')).toBe('12:30');
    });

    it('subMinutes should subtract minutes', () => {
      expect(format(subMinutes(baseDate, 30), 'HH:mm')).toBe('11:30');
    });

    it('addSeconds should add seconds', () => {
      expect(format(addSeconds(baseDate, 45), 'HH:mm:ss')).toBe('12:00:45');
    });

    it('subSeconds should subtract seconds', () => {
      const base = parse('2024-06-15T12:01:00');
      expect(format(subSeconds(base, 30), 'HH:mm:ss')).toBe('12:00:30');
    });
  });

  describe('Edge cases', () => {
    it('should clamp Jan 31 + 1 month to Feb 29 in a leap year', () => {
      const jan31 = parse('2024-01-31T12:00:00');
      const result = addMonths(jan31, 1);
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-02-29');
    });

    it('should handle year boundary', () => {
      const dec31 = parse('2024-12-31T12:00:00');
      const result = addDays(dec31, 1);
      const resultDate = new Date(result);
      expect(resultDate.getFullYear()).toBe(2025);
      expect(resultDate.getMonth()).toBe(0); // January
      expect(resultDate.getDate()).toBe(1);
    });

    it('should handle negative amounts', () => {
      const result = add(baseDate, -5, 'day');
      expect(format(result, 'yyyy-MM-dd')).toBe('2024-06-10');
    });
  });
});
