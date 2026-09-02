import {
  parse,
  now,
  addDays,
  subDays,
  isWeekend,
  isLeapYear,
  isValid,
  isPast,
  isFuture,
  getDaysInMonth,
  getComponents,
  getYear,
  getMonth,
  getDate,
  getDay,
  getHours,
  getMinutes,
  getSeconds,
  getMilliseconds,
} from '../src/index';

describe('Date Predicates', () => {
  describe('isWeekend()', () => {
    it('should return true for Saturday', () => {
      // June 15, 2024 is Saturday - use noon to avoid timezone issues
      const saturday = parse('2024-06-15T12:00:00');
      expect(isWeekend(saturday)).toBe(true);
    });

    it('should return true for Sunday', () => {
      // June 16, 2024 is Sunday
      const sunday = parse('2024-06-16T12:00:00');
      expect(isWeekend(sunday)).toBe(true);
    });

    it('should return false for weekdays', () => {
      // Use noon to avoid timezone boundary issues
      const monday = parse('2024-06-17T12:00:00'); // Monday
      const wednesday = parse('2024-06-19T12:00:00'); // Wednesday
      const friday = parse('2024-06-14T12:00:00'); // Friday
      expect(isWeekend(monday)).toBe(false);
      expect(isWeekend(wednesday)).toBe(false);
      expect(isWeekend(friday)).toBe(false);
    });
  });

  describe('isLeapYear()', () => {
    it('should return true for leap years divisible by 4', () => {
      const year2024 = parse('2024-06-15');
      expect(isLeapYear(year2024)).toBe(true);
    });

    it('should return false for years divisible by 100 but not 400', () => {
      const year1900 = parse('1900-06-15');
      expect(isLeapYear(year1900)).toBe(false);
    });

    it('should return true for years divisible by 400', () => {
      const year2000 = parse('2000-06-15');
      expect(isLeapYear(year2000)).toBe(true);
    });

    it('should return false for non-leap years', () => {
      const year2023 = parse('2023-06-15');
      expect(isLeapYear(year2023)).toBe(false);
    });
  });

  describe('isValid()', () => {
    it('should return true for valid timestamps', () => {
      expect(isValid(now())).toBe(true);
      expect(isValid(parse('2024-06-15'))).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isValid(NaN)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isValid(Infinity)).toBe(false);
      expect(isValid(-Infinity)).toBe(false);
    });
  });

  describe('getDaysInMonth()', () => {
    it('should return 31 for January', () => {
      const jan = parse('2024-01-15');
      expect(getDaysInMonth(jan)).toBe(31);
    });

    it('should return 29 for February in leap year', () => {
      const feb2024 = parse('2024-02-15');
      expect(getDaysInMonth(feb2024)).toBe(29);
    });

    it('should return 28 for February in non-leap year', () => {
      const feb2023 = parse('2023-02-15');
      expect(getDaysInMonth(feb2023)).toBe(28);
    });

    it('should return 30 for April', () => {
      const apr = parse('2024-04-15');
      expect(getDaysInMonth(apr)).toBe(30);
    });

    it('should return 31 for December', () => {
      const dec = parse('2024-12-15');
      expect(getDaysInMonth(dec)).toBe(31);
    });
  });
});

describe('Date Getters', () => {
  const testDate = parse('2024-06-15T14:30:45.123');

  describe('getComponents()', () => {
    it('should return all date components', () => {
      const components = getComponents(testDate);
      expect(components.year).toBe(2024);
      expect(components.month).toBe(6);
      expect(components.day).toBe(15);
      expect(components.hour).toBe(14);
      expect(components.minute).toBe(30);
      expect(components.second).toBe(45);
      expect(components.millisecond).toBe(123);
      expect(components.dayOfWeek).toBe(6); // Saturday
    });
  });

  describe('Individual getters', () => {
    it('getYear should return year', () => {
      expect(getYear(testDate)).toBe(2024);
    });

    it('getMonth should return month (1-12)', () => {
      expect(getMonth(testDate)).toBe(6);
    });

    it('getDate should return day of month', () => {
      expect(getDate(testDate)).toBe(15);
    });

    it('getDay should return day of week (0-6)', () => {
      expect(getDay(testDate)).toBe(6); // Saturday
    });

    it('getHours should return hours', () => {
      expect(getHours(testDate)).toBe(14);
    });

    it('getMinutes should return minutes', () => {
      expect(getMinutes(testDate)).toBe(30);
    });

    it('getSeconds should return seconds', () => {
      expect(getSeconds(testDate)).toBe(45);
    });

    it('getMilliseconds should return milliseconds', () => {
      expect(getMilliseconds(testDate)).toBe(123);
    });
  });
});

describe('Relative Date Predicates', () => {
  describe('isPast() / isFuture()', () => {
    it('should identify past and future dates relative to now', () => {
      const currentTime = now();
      const pastDate = subDays(currentTime, 10);
      const futureDate = addDays(currentTime, 10);

      expect(isPast(pastDate)).toBe(true);
      expect(isPast(futureDate)).toBe(false);
      expect(isFuture(futureDate)).toBe(true);
      expect(isFuture(pastDate)).toBe(false);
      expect(isPast(currentTime)).toBe(false);
      expect(isFuture(currentTime)).toBe(false);
    });

    it('should return false for invalid input', () => {
      expect(isPast(NaN)).toBe(false);
      expect(isFuture('not-a-date')).toBe(false);
    });
  });
});
