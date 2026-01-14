import {
  parse,
  getComponents,
  setYear,
  setMonth,
  setDate,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  format,
} from '../src/index';

describe('Setter Functions', () => {
  const baseDate = parse('2024-06-15T14:30:45.123');

  describe('setYear()', () => {
    it('should change the year', () => {
      const result = setYear(baseDate, 2025);
      const components = getComponents(result);
      expect(components.year).toBe(2025);
      expect(components.month).toBe(6);
      expect(components.day).toBe(15);
    });

    it('should not modify the original timestamp', () => {
      const original = parse('2024-06-15T12:00:00');
      const modified = setYear(original, 2025);
      expect(getComponents(original).year).toBe(2024);
      expect(getComponents(modified).year).toBe(2025);
    });

    it('should handle Feb 29 to non-leap year', () => {
      const leapDate = parse('2024-02-29T12:00:00'); // 2024 is leap year
      const result = setYear(leapDate, 2023); // 2023 is not leap year
      const components = getComponents(result);
      expect(components.year).toBe(2023);
      expect(components.month).toBe(2);
      expect(components.day).toBe(28); // Should clamp to Feb 28
    });

    it('should preserve Feb 29 for leap year', () => {
      const leapDate = parse('2024-02-29T12:00:00');
      const result = setYear(leapDate, 2028); // 2028 is leap year
      const components = getComponents(result);
      expect(components.year).toBe(2028);
      expect(components.month).toBe(2);
      expect(components.day).toBe(29); // Should keep Feb 29
    });
  });

  describe('setMonth()', () => {
    it('should change the month', () => {
      const result = setMonth(baseDate, 12);
      const components = getComponents(result);
      expect(components.year).toBe(2024);
      expect(components.month).toBe(12);
      expect(components.day).toBe(15);
    });

    it('should clamp day when needed', () => {
      // Jan 31 -> Feb should become Feb 28/29
      const jan31 = parse('2024-01-31T12:00:00');
      const result = setMonth(jan31, 2); // February
      const components = getComponents(result);
      expect(components.month).toBe(2);
      expect(components.day).toBe(29); // 2024 is leap year
    });

    it('should clamp day for non-leap February', () => {
      const jan31 = parse('2023-01-31T12:00:00');
      const result = setMonth(jan31, 2); // February in non-leap year
      const components = getComponents(result);
      expect(components.month).toBe(2);
      expect(components.day).toBe(28);
    });

    it('should handle month with 30 days', () => {
      // Jan 31 -> April (30 days)
      const jan31 = parse('2024-01-31T12:00:00');
      const result = setMonth(jan31, 4); // April
      const components = getComponents(result);
      expect(components.month).toBe(4);
      expect(components.day).toBe(30);
    });
  });

  describe('setDate()', () => {
    it('should change the day', () => {
      const result = setDate(baseDate, 25);
      const components = getComponents(result);
      expect(components.day).toBe(25);
      expect(components.month).toBe(6);
    });

    it('should preserve time components', () => {
      const result = setDate(baseDate, 1);
      const components = getComponents(result);
      expect(components.day).toBe(1);
      expect(components.hour).toBe(14);
      expect(components.minute).toBe(30);
      expect(components.second).toBe(45);
    });
  });

  describe('setHours()', () => {
    it('should change the hours', () => {
      const result = setHours(baseDate, 9);
      const components = getComponents(result);
      expect(components.hour).toBe(9);
      expect(components.minute).toBe(30);
      expect(components.second).toBe(45);
    });

    it('should handle midnight', () => {
      const result = setHours(baseDate, 0);
      const components = getComponents(result);
      expect(components.hour).toBe(0);
    });

    it('should handle 23:00', () => {
      const result = setHours(baseDate, 23);
      const components = getComponents(result);
      expect(components.hour).toBe(23);
    });
  });

  describe('setMinutes()', () => {
    it('should change the minutes', () => {
      const result = setMinutes(baseDate, 45);
      const components = getComponents(result);
      expect(components.minute).toBe(45);
      expect(components.hour).toBe(14);
      expect(components.second).toBe(45);
    });

    it('should handle 0 minutes', () => {
      const result = setMinutes(baseDate, 0);
      const components = getComponents(result);
      expect(components.minute).toBe(0);
    });

    it('should handle 59 minutes', () => {
      const result = setMinutes(baseDate, 59);
      const components = getComponents(result);
      expect(components.minute).toBe(59);
    });
  });

  describe('setSeconds()', () => {
    it('should change the seconds', () => {
      const result = setSeconds(baseDate, 30);
      const components = getComponents(result);
      expect(components.second).toBe(30);
      expect(components.minute).toBe(30);
    });

    it('should handle 0 seconds', () => {
      const result = setSeconds(baseDate, 0);
      const components = getComponents(result);
      expect(components.second).toBe(0);
    });

    it('should handle 59 seconds', () => {
      const result = setSeconds(baseDate, 59);
      const components = getComponents(result);
      expect(components.second).toBe(59);
    });
  });

  describe('setMilliseconds()', () => {
    it('should change the milliseconds', () => {
      const result = setMilliseconds(baseDate, 500);
      const components = getComponents(result);
      expect(components.millisecond).toBe(500);
    });

    it('should handle 0 milliseconds', () => {
      const result = setMilliseconds(baseDate, 0);
      const components = getComponents(result);
      expect(components.millisecond).toBe(0);
    });

    it('should handle 999 milliseconds', () => {
      const result = setMilliseconds(baseDate, 999);
      const components = getComponents(result);
      expect(components.millisecond).toBe(999);
    });
  });

  describe('Chaining setters', () => {
    it('should work when chained', () => {
      const date = parse('2024-01-15T10:30:00');
      const result = setMinutes(setHours(setMonth(date, 6), 14), 45);
      const components = getComponents(result);
      expect(components.month).toBe(6);
      expect(components.hour).toBe(14);
      expect(components.minute).toBe(45);
    });
  });
});
