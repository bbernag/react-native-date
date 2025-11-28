import {
  parse,
  isBefore,
  isAfter,
  isSame,
  isSameDay,
  isSameMonth,
  isSameYear,
  diff,
  diffInDays,
  diffInMonths,
  diffInYears,
  diffInWeeks,
  diffInHours,
  diffInMinutes,
  diffInSeconds,
  clamp,
  min,
  max,
} from '../src/index';

describe('Date Comparisons', () => {
  const earlier = parse('2024-06-10T10:00:00');
  const later = parse('2024-06-20T15:00:00');
  const same = parse('2024-06-10T10:00:00');

  describe('isBefore()', () => {
    it('should return true when first date is before second', () => {
      expect(isBefore(earlier, later)).toBe(true);
    });

    it('should return false when first date is after second', () => {
      expect(isBefore(later, earlier)).toBe(false);
    });

    it('should return false for equal dates', () => {
      expect(isBefore(earlier, same)).toBe(false);
    });
  });

  describe('isAfter()', () => {
    it('should return true when first date is after second', () => {
      expect(isAfter(later, earlier)).toBe(true);
    });

    it('should return false when first date is before second', () => {
      expect(isAfter(earlier, later)).toBe(false);
    });

    it('should return false for equal dates', () => {
      expect(isAfter(earlier, same)).toBe(false);
    });
  });

  describe('isSame()', () => {
    it('should compare at day level', () => {
      const date1 = parse('2024-06-15T10:00:00');
      const date2 = parse('2024-06-15T20:00:00');
      expect(isSame(date1, date2, 'day')).toBe(true);
    });

    it('should compare at month level', () => {
      const date1 = parse('2024-06-01T12:00:00');
      const date2 = parse('2024-06-15T12:00:00');
      expect(isSame(date1, date2, 'month')).toBe(true);
    });

    it('should compare at year level', () => {
      const date1 = parse('2024-03-15T12:00:00');
      const date2 = parse('2024-09-15T12:00:00');
      expect(isSame(date1, date2, 'year')).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = parse('2024-06-15');
      const date2 = parse('2024-06-16');
      expect(isSame(date1, date2, 'day')).toBe(false);
    });
  });

  describe('Convenience comparison functions', () => {
    it('isSameDay should compare days', () => {
      const date1 = parse('2024-06-15T10:00:00');
      const date2 = parse('2024-06-15T20:00:00');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('isSameMonth should compare months', () => {
      const date1 = parse('2024-06-01T12:00:00');
      const date2 = parse('2024-06-15T12:00:00');
      expect(isSameMonth(date1, date2)).toBe(true);
    });

    it('isSameYear should compare years', () => {
      const date1 = parse('2024-03-15T12:00:00');
      const date2 = parse('2024-09-15T12:00:00');
      expect(isSameYear(date1, date2)).toBe(true);
    });
  });
});

describe('Date Differences', () => {
  describe('diff()', () => {
    it('should calculate difference in days', () => {
      const date1 = parse('2024-06-20');
      const date2 = parse('2024-06-10');
      expect(diff(date1, date2, 'day')).toBe(10);
    });

    it('should calculate difference in hours', () => {
      const date1 = parse('2024-06-15T15:00:00');
      const date2 = parse('2024-06-15T10:00:00');
      expect(diff(date1, date2, 'hour')).toBe(5);
    });

    it('should return negative for reversed order', () => {
      const date1 = parse('2024-06-10');
      const date2 = parse('2024-06-20');
      expect(diff(date1, date2, 'day')).toBe(-10);
    });
  });

  describe('Convenience diff functions', () => {
    it('diffInDays should return days', () => {
      const date1 = parse('2024-06-25');
      const date2 = parse('2024-06-15');
      expect(diffInDays(date1, date2)).toBe(10);
    });

    it('diffInMonths should return months', () => {
      const date1 = parse('2024-09-15');
      const date2 = parse('2024-06-15');
      expect(diffInMonths(date1, date2)).toBeGreaterThanOrEqual(2);
    });

    it('diffInYears should return years', () => {
      const date1 = parse('2026-06-15');
      const date2 = parse('2024-06-15');
      expect(diffInYears(date1, date2)).toBeGreaterThanOrEqual(1);
    });

    it('diffInWeeks should return weeks', () => {
      const date1 = parse('2024-06-29');
      const date2 = parse('2024-06-15');
      expect(diffInWeeks(date1, date2)).toBe(2);
    });

    it('diffInHours should return hours', () => {
      const date1 = parse('2024-06-15T20:00:00');
      const date2 = parse('2024-06-15T10:00:00');
      expect(diffInHours(date1, date2)).toBe(10);
    });

    it('diffInMinutes should return minutes', () => {
      const date1 = parse('2024-06-15T10:45:00');
      const date2 = parse('2024-06-15T10:00:00');
      expect(diffInMinutes(date1, date2)).toBe(45);
    });

    it('diffInSeconds should return seconds', () => {
      const date1 = parse('2024-06-15T10:01:00');
      const date2 = parse('2024-06-15T10:00:00');
      expect(diffInSeconds(date1, date2)).toBe(60);
    });
  });
});

describe('Utility Functions', () => {
  describe('clamp()', () => {
    it('should return value when within range', () => {
      const value = parse('2024-06-15');
      const minDate = parse('2024-06-01');
      const maxDate = parse('2024-06-30');
      expect(clamp(value, minDate, maxDate)).toBe(value);
    });

    it('should return min when value is below range', () => {
      const value = parse('2024-05-15');
      const minDate = parse('2024-06-01');
      const maxDate = parse('2024-06-30');
      expect(clamp(value, minDate, maxDate)).toBe(minDate);
    });

    it('should return max when value is above range', () => {
      const value = parse('2024-07-15');
      const minDate = parse('2024-06-01');
      const maxDate = parse('2024-06-30');
      expect(clamp(value, minDate, maxDate)).toBe(maxDate);
    });
  });

  describe('min()', () => {
    it('should return earliest timestamp', () => {
      const dates = [
        parse('2024-06-15'),
        parse('2024-06-10'),
        parse('2024-06-20'),
      ];
      expect(min(dates)).toBe(dates[1]);
    });

    it('should handle single element array', () => {
      const dates = [parse('2024-06-15')];
      expect(min(dates)).toBe(dates[0]);
    });
  });

  describe('max()', () => {
    it('should return latest timestamp', () => {
      const dates = [
        parse('2024-06-15'),
        parse('2024-06-10'),
        parse('2024-06-20'),
      ];
      expect(max(dates)).toBe(dates[2]);
    });

    it('should handle single element array', () => {
      const dates = [parse('2024-06-15')];
      expect(max(dates)).toBe(dates[0]);
    });
  });
});
