/**
 * Facade contract tests: every `DateInput` string goes through the native
 * ISO 8601 parser (same as `parse()`), and the error policy is uniform:
 * parse, format and arithmetic throw; try-variants return null; predicates
 * return false.
 */
import {
  parse,
  tryParse,
  tryParseFormat,
  format,
  formatUTC,
  getYear,
  getComponents,
  getDaysInMonth,
  add,
  addDays,
  subDays,
  subMonths,
  startOf,
  startOfDay,
  endOfDay,
  endOfMonth,
  diffInDays,
  clamp,
  min,
  max,
  now,
  isValid,
  isWeekend,
  isLeapYear,
  isBefore,
  isAfter,
  isSame,
  isPast,
  isFuture,
  isToday,
  isTomorrow,
  isYesterday,
  isSameDay,
  isSameMonth,
  isSameYear,
  isTodayInTz,
  isSameDayInTz,
  isSameMonthInTz,
  isSameYearInTz,
  formatDistance,
  formatInTimezone,
  startOfDayInTz,
  fromComponents,
  setYear,
  NativeDateModule,
  getAvailableLocales,
} from '../src/index';

// Accepted by JS `Date.parse()` but not by the library's ISO 8601 parser.
// Used to prove that strings are no longer routed through `Date.parse()`.
const NON_ISO_STRING = 'Dec 25, 2024';
const ISO_DATE = '2024-12-25';
const ISO_DATETIME = '2024-12-25T10:30:00';

describe('DateInput strings use the native parser', () => {
  it('sanity: the non-ISO fixture is accepted by Date.parse()', () => {
    expect(Number.isFinite(Date.parse(NON_ISO_STRING))).toBe(true);
  });

  it('arithmetic on a string equals arithmetic on parse()', () => {
    const ts = parse(ISO_DATE);
    expect(addDays(ISO_DATE, 1)).toBe(addDays(ts, 1));
    expect(subMonths(ISO_DATE, 2)).toBe(subMonths(ts, 2));
    expect(add(ISO_DATETIME, 3, 'hour')).toBe(
      add(parse(ISO_DATETIME), 3, 'hour')
    );
    expect(diffInDays(ISO_DATE, '2024-12-01')).toBe(
      diffInDays(ts, parse('2024-12-01'))
    );
  });

  it('boundaries on a string equal boundaries on parse()', () => {
    const ts = parse(ISO_DATE);
    expect(startOfDay(ISO_DATE)).toBe(startOfDay(ts));
    expect(startOf(ISO_DATE, 'month')).toBe(startOf(ts, 'month'));
    expect(endOfMonth(ISO_DATE)).toBe(endOfMonth(ts));
    expect(startOfDayInTz(ISO_DATE, 'UTC')).toBe(startOfDayInTz(ts, 'UTC'));
  });

  it('predicates and date info on a string equal parse()', () => {
    expect(isWeekend('2024-12-28')).toBe(true); // Saturday
    expect(getDaysInMonth('2024-02-01')).toBe(29);
    expect(isLeapYear(ISO_DATE)).toBe(isLeapYear(parse(ISO_DATE)));
    expect(isSame(ISO_DATE, parse(ISO_DATE), 'day')).toBe(true);
  });

  it('clamp / formatDistance / formatInTimezone accept strings', () => {
    const ts = parse(ISO_DATE);
    expect(clamp('2024-12-31', ISO_DATE, '2024-12-26')).toBe(
      clamp(parse('2024-12-31'), ts, parse('2024-12-26'))
    );
    expect(formatDistance(ISO_DATE, '2024-12-20')).toBe(
      formatDistance(ts, parse('2024-12-20'))
    );
    expect(formatInTimezone(ISO_DATE, 'yyyy-MM-dd HH:mm', 'UTC')).toBe(
      formatInTimezone(ts, 'yyyy-MM-dd HH:mm', 'UTC')
    );
  });

  it('non-ISO strings are rejected everywhere, not parsed by Date.parse()', () => {
    expect(() => addDays(NON_ISO_STRING, 1)).toThrow();
    expect(() => startOfDay(NON_ISO_STRING)).toThrow();
    expect(() => getDaysInMonth(NON_ISO_STRING)).toThrow();
    expect(() => clamp(NON_ISO_STRING, 0, 1)).toThrow();
    expect(() => formatDistance(NON_ISO_STRING, 0)).toThrow();
    expect(isWeekend(NON_ISO_STRING)).toBe(false);
    expect(isValid(NON_ISO_STRING)).toBe(false);
  });

  it('Date objects pass through getTime()', () => {
    const date = new Date(Date.UTC(2024, 11, 25, 10, 30));
    expect(addDays(date, 1)).toBe(addDays(date.getTime(), 1));
    expect(getYear(date)).toBe(2024);
  });
});

describe('Error policy: parse*/format*/arithmetic throw on invalid input', () => {
  const invalidNumbers = [NaN, Infinity, -Infinity];

  it('parse() throws on invalid strings', () => {
    expect(() => parse('')).toThrow();
    expect(() => parse('invalid')).toThrow();
    expect(() => parse(NON_ISO_STRING)).toThrow();
  });

  it.each(invalidNumbers)('format(%p) throws before reaching native', (n) => {
    expect(() => format(n, 'yyyy')).toThrow(/Invalid date input/);
    expect(() => formatUTC(n, 'yyyy')).toThrow(/Invalid date input/);
  });

  it.each(invalidNumbers)('getters throw on %p', (n) => {
    expect(() => getYear(n)).toThrow(/Invalid date input/);
    expect(() => getComponents(n)).toThrow(/Invalid date input/);
    expect(() => getDaysInMonth(n)).toThrow(/Invalid date input/);
  });

  it.each(invalidNumbers)('arithmetic and boundaries throw on %p', (n) => {
    expect(() => add(n, 1, 'day')).toThrow(/Invalid date input/);
    expect(() => startOf(n, 'day')).toThrow(/Invalid date input/);
    expect(() => diffInDays(n, 0)).toThrow(/Invalid date input/);
    expect(() => clamp(0, n, 1)).toThrow(/Invalid date input/);
  });

  it('an invalid Date object is rejected like NaN', () => {
    const invalidDate = new Date(NaN);
    expect(() => format(invalidDate, 'yyyy')).toThrow(/Invalid date input/);
    expect(() => addDays(invalidDate, 1)).toThrow(/Invalid date input/);
  });

  it('format() with an invalid string throws', () => {
    expect(() => format('invalid', 'yyyy')).toThrow();
    expect(() => formatUTC(NON_ISO_STRING, 'yyyy')).toThrow();
  });
});

describe('Error policy: try* return null', () => {
  it('tryParse returns a timestamp for valid input', () => {
    expect(tryParse(ISO_DATE)).toBe(parse(ISO_DATE));
    expect(tryParse(ISO_DATETIME)).toBe(parse(ISO_DATETIME));
  });

  it('tryParse returns null for invalid input', () => {
    expect(tryParse('')).toBeNull();
    expect(tryParse('invalid')).toBeNull();
    expect(tryParse('not-a-date')).toBeNull();
    expect(tryParse(NON_ISO_STRING)).toBeNull();
  });

  it('tryParseFormat returns null for invalid input', () => {
    expect(tryParseFormat('12/25/2024', 'MM/dd/yyyy')).not.toBeNull();
    expect(tryParseFormat('invalid', 'MM/dd/yyyy')).toBeNull();
    expect(tryParseFormat('', 'MM/dd/yyyy')).toBeNull();
    expect(tryParseFormat('2024', 'yyyy-MM-dd')).toBeNull();
    expect(tryParseFormat('12/25', 'MM/dd/yyyy')).toBeNull();
  });
});

describe('Error policy: predicates return false', () => {
  const invalidInputs: Array<number | string | Date> = [
    NaN,
    Infinity,
    -Infinity,
    'invalid',
    NON_ISO_STRING,
    new Date(NaN),
  ];
  const valid = parse(ISO_DATE);

  it.each(invalidInputs)('unary predicates return false for %p', (input) => {
    expect(isValid(input)).toBe(false);
    expect(isWeekend(input)).toBe(false);
    expect(isLeapYear(input)).toBe(false);
    expect(isPast(input)).toBe(false);
    expect(isFuture(input)).toBe(false);
    expect(isToday(input)).toBe(false);
    expect(isTomorrow(input)).toBe(false);
    expect(isYesterday(input)).toBe(false);
    expect(isTodayInTz(input, 'UTC')).toBe(false);
  });

  it.each(invalidInputs)('binary predicates return false for %p', (input) => {
    expect(isBefore(input, valid)).toBe(false);
    expect(isBefore(valid, input)).toBe(false);
    expect(isAfter(input, valid)).toBe(false);
    expect(isSame(input, valid, 'day')).toBe(false);
    expect(isSameDay(input, valid)).toBe(false);
    expect(isSameMonth(valid, input)).toBe(false);
    expect(isSameYear(input, valid)).toBe(false);
    expect(isSameDayInTz(input, valid, 'UTC')).toBe(false);
    expect(isSameMonthInTz(valid, input, 'UTC')).toBe(false);
    expect(isSameYearInTz(input, valid, 'UTC')).toBe(false);
  });

  it('predicates still work for valid input', () => {
    expect(isValid(valid)).toBe(true);
    expect(isValid(ISO_DATE)).toBe(true);
    expect(isBefore(ISO_DATE, '2024-12-26')).toBe(true);
    expect(isAfter('2024-12-26', ISO_DATE)).toBe(true);
    expect(isSameDay(ISO_DATE, ISO_DATETIME)).toBe(true);
    expect(isSameMonth(ISO_DATE, '2024-12-01')).toBe(true);
    expect(isSameYear(ISO_DATE, '2024-01-01')).toBe(true);
    expect(isToday(now())).toBe(true);
    expect(isSameDayInTz(ISO_DATE, ISO_DATETIME, 'UTC')).toBe(true);
  });
});

describe('min() / max()', () => {
  it('throw on an empty array', () => {
    expect(() => min([])).toThrow(/non-empty/);
    expect(() => max([])).toThrow(/non-empty/);
  });

  it('accept any DateInput and return the extreme timestamp', () => {
    const dates = [
      '2024-06-01',
      parse('2024-01-01'),
      new Date(Date.UTC(2024, 2, 1)),
    ];
    expect(min(dates)).toBe(parse('2024-01-01'));
    expect(max(dates)).toBe(parse('2024-06-01'));
  });

  it('throw when an element is invalid', () => {
    expect(() => min([NaN, 0])).toThrow(/Invalid date input/);
    expect(() => max(['invalid'])).toThrow();
  });
});

describe('two-digit years are taken literally', () => {
  it('fromComponents({ year: 99 }) is the year 99, not 1999', () => {
    const y99 = fromComponents({ year: 99, month: 1, day: 1 });
    const y1999 = fromComponents({ year: 1999, month: 1, day: 1 });
    expect(y99).not.toBe(y1999);
    expect(new Date(y99).getUTCFullYear()).toBe(99);
    expect(new Date(y1999).getUTCFullYear()).toBe(1999);
  });

  it('fromComponents keeps the UTC time fields and month/day', () => {
    const ts = fromComponents({
      year: 42,
      month: 7,
      day: 4,
      hour: 12,
      minute: 34,
      second: 56,
      millisecond: 789,
    });
    const d = new Date(ts);
    expect(d.getUTCFullYear()).toBe(42);
    expect(d.getUTCMonth()).toBe(6);
    expect(d.getUTCDate()).toBe(4);
    expect(d.getUTCHours()).toBe(12);
    expect(d.getUTCMinutes()).toBe(34);
    expect(d.getUTCSeconds()).toBe(56);
    expect(d.getUTCMilliseconds()).toBe(789);
  });

  it('year 0 is a leap year (Feb 29 is preserved)', () => {
    const d = new Date(fromComponents({ year: 0, month: 2, day: 29 }));
    expect(d.getUTCFullYear()).toBe(0);
    expect(d.getUTCMonth()).toBe(1);
    expect(d.getUTCDate()).toBe(29);
  });

  it('years >= 100 are unaffected', () => {
    expect(
      new Date(fromComponents({ year: 100, month: 1, day: 1 })).getUTCFullYear()
    ).toBe(100);
    expect(fromComponents({ year: 2024, month: 12, day: 25 })).toBe(
      Date.UTC(2024, 11, 25)
    );
  });

  it('setYear(ts, 99) produces the year 99 in local time', () => {
    const base = parse('2024-06-15T14:30:45.123');
    expect(getYear(setYear(base, 99))).toBe(99);
    expect(getYear(setYear(base, 1999))).toBe(1999);
    expect(getComponents(setYear(base, 99))).toMatchObject({
      month: 6,
      day: 15,
      hour: 14,
      minute: 30,
      second: 45,
      millisecond: 123,
    });
  });
});

describe('lazy native binding', () => {
  it('does not create the HybridObject at import time, then caches it', () => {
    jest.isolateModules(() => {
      const nitro =
        require('react-native-nitro-modules') as typeof import('react-native-nitro-modules');
      const spy = jest.spyOn(nitro.NitroModules, 'createHybridObject');

      const lib = require('../src/index') as typeof import('../src/index');
      expect(spy).not.toHaveBeenCalled();

      lib.now();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('NativeDate');

      lib.parse('2024-12-25');
      lib.format(0, 'yyyy');
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });

  it('throws a setup error when the native module cannot be created', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native-nitro-modules', () => ({
        NitroModules: {
          createHybridObject: () => {
            throw new Error('HybridObject "NativeDate" not found');
          },
        },
      }));
      const { getNative } =
        require('../src/native') as typeof import('../src/native');
      expect(() => getNative()).toThrow(/development build/);
      expect(() => getNative()).toThrow(/HybridObject "NativeDate" not found/);
      jest.dontMock('react-native-nitro-modules');
    });
  });

  it('a missing native module surfaces as a setup error, not as invalid input', () => {
    jest.isolateModules(() => {
      jest.doMock('react-native-nitro-modules', () => ({
        NitroModules: {
          createHybridObject: () => {
            throw new Error('HybridObject "NativeDate" not found');
          },
        },
      }));
      const lib = require('../src/index') as typeof import('../src/index');
      expect(() => lib.isValid('2024-12-25')).toThrow(/development build/);
      expect(() => lib.isToday('2024-12-25')).toThrow(/development build/);
      expect(() => lib.tryParse('2024-12-25')).toThrow(/development build/);
      jest.dontMock('react-native-nitro-modules');
    });
  });

  it('NativeDateModule stays available as a lazily-bound proxy', () => {
    expect(NativeDateModule.parse('2024-12-25')).toBe(parse('2024-12-25'));
    expect(NativeDateModule.format(parse('2024-12-25'), 'yyyy-MM-dd')).toBe(
      '2024-12-25'
    );
    expect('parse' in NativeDateModule).toBe(true);
  });
});

describe('formatDistance()', () => {
  const base = parse('2024-06-15T12:00:00Z');
  const twoHoursEarlier = base - 2 * 60 * 60 * 1000;

  it('options object matches the positional form', () => {
    expect(formatDistance(twoHoursEarlier, { base })).toBe(
      formatDistance(twoHoursEarlier, base, true)
    );
    expect(formatDistance(twoHoursEarlier, { base, addSuffix: false })).toBe(
      formatDistance(twoHoursEarlier, base, false)
    );
  });

  it('addSuffix defaults to true and can be disabled', () => {
    expect(formatDistance(twoHoursEarlier, { base })).toMatch(/ago$/);
    expect(
      formatDistance(twoHoursEarlier, { base, addSuffix: false })
    ).not.toMatch(/ago$/);
    expect(formatDistance(twoHoursEarlier, base)).toMatch(/ago$/);
  });

  it('base accepts any DateInput and defaults to now', () => {
    expect(formatDistance(twoHoursEarlier, { base: new Date(base) })).toBe(
      formatDistance(twoHoursEarlier, { base })
    );
    expect(
      formatDistance(twoHoursEarlier, { base: '2024-06-15T12:00:00Z' })
    ).toBe(formatDistance(twoHoursEarlier, { base }));
    expect(formatDistance(now() - 5 * 60 * 1000)).toBe(
      formatDistance(now() - 5 * 60 * 1000, {})
    );
  });

  it('a Date passed positionally is a base date, not an options object', () => {
    expect(formatDistance(twoHoursEarlier, new Date(base))).toBe(
      formatDistance(twoHoursEarlier, base)
    );
  });

  it('throws on invalid date or base', () => {
    expect(() => formatDistance(NaN, { base })).toThrow(/Invalid date input/);
    expect(() => formatDistance(base, { base: 'invalid' })).toThrow();
  });
});

describe('getAvailableLocales()', () => {
  it('maps every available locale to itself', () => {
    const locales = getAvailableLocales();
    expect(locales.en).toBe('en');
    expect(locales.es).toBe('es');
    expect(locales.xx).toBeUndefined();
    expect(Object.keys(locales)).toEqual(['en', 'es', 'fr', 'pt_BR']);
  });

  it('is memoized and frozen', () => {
    const first = getAvailableLocales();
    expect(getAvailableLocales()).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
  });
});

describe('native isToday / isTomorrow / isYesterday (E-02)', () => {
  type LocalDay = { year: number; month: number; day: number };

  function sameLocalDay(a: LocalDay, b: LocalDay): boolean {
    return a.year === b.year && a.month === b.month && a.day === b.day;
  }

  function previousComponents(date: number | string | Date): LocalDay | null {
    if (typeof date === 'string') {
      try {
        return NativeDateModule.getComponentsFromString(date);
      } catch {
        return null;
      }
    }
    const timestamp = typeof date === 'number' ? date : date.getTime();
    return Number.isFinite(timestamp)
      ? NativeDateModule.getComponents(timestamp)
      : null;
  }

  function previousIsToday(date: number | string | Date): boolean {
    const d = previousComponents(date);
    return d !== null && sameLocalDay(d, NativeDateModule.getComponents(now()));
  }

  function previousIsTomorrow(date: number | string | Date): boolean {
    const d = previousComponents(date);
    return (
      d !== null &&
      sameLocalDay(d, NativeDateModule.getComponents(addDays(now(), 1)))
    );
  }

  function previousIsYesterday(date: number | string | Date): boolean {
    const d = previousComponents(date);
    return (
      d !== null &&
      sameLocalDay(d, NativeDateModule.getComponents(subDays(now(), 1)))
    );
  }

  it('matches the previous local-component implementation', () => {
    const current = now();
    const todayStart = startOfDay(current);
    const todayEnd = endOfDay(current);
    const samples: Array<number | string | Date> = [
      current,
      todayStart,
      todayEnd,
      todayStart - 1,
      todayEnd + 1,
      addDays(current, 1),
      subDays(current, 1),
      parse(ISO_DATE),
      ISO_DATE,
      ISO_DATETIME,
      new Date(current),
    ];
    for (const sample of samples) {
      expect(isToday(sample)).toBe(previousIsToday(sample));
      expect(isTomorrow(sample)).toBe(previousIsTomorrow(sample));
      expect(isYesterday(sample)).toBe(previousIsYesterday(sample));
    }
  });

  it('treats local midnight edges as calendar days', () => {
    const todayStart = startOfDay(now());
    const todayEnd = endOfDay(now());
    expect(isToday(todayStart)).toBe(true);
    expect(isToday(todayEnd)).toBe(true);
    expect(isYesterday(todayStart - 1)).toBe(true);
    expect(isToday(todayStart - 1)).toBe(false);
    expect(isTomorrow(todayEnd + 1)).toBe(true);
    expect(isToday(todayEnd + 1)).toBe(false);
  });

  it('is a single native call for a timestamp', () => {
    const native = (
      require('../src/native') as typeof import('../src/native')
    ).getNative();
    const todaySpy = jest.spyOn(native, 'isToday');
    const tomorrowSpy = jest.spyOn(native, 'isTomorrow');
    const yesterdaySpy = jest.spyOn(native, 'isYesterday');
    const componentsSpy = jest.spyOn(native, 'getComponents');
    const addSpy = jest.spyOn(native, 'add');

    const ts = now();
    expect(isToday(ts)).toBe(true);
    expect(todaySpy).toHaveBeenCalledTimes(1);
    expect(todaySpy).toHaveBeenCalledWith(ts);
    expect(componentsSpy).not.toHaveBeenCalled();

    const tomorrow = addDays(ts, 1);
    addSpy.mockClear();
    expect(isTomorrow(tomorrow)).toBe(true);
    expect(tomorrowSpy).toHaveBeenCalledTimes(1);
    expect(tomorrowSpy).toHaveBeenCalledWith(tomorrow);
    expect(addSpy).not.toHaveBeenCalled();
    expect(componentsSpy).not.toHaveBeenCalled();

    const yesterday = subDays(ts, 1);
    addSpy.mockClear();
    expect(isYesterday(yesterday)).toBe(true);
    expect(yesterdaySpy).toHaveBeenCalledTimes(1);
    expect(yesterdaySpy).toHaveBeenCalledWith(yesterday);
    expect(addSpy).not.toHaveBeenCalled();
    expect(componentsSpy).not.toHaveBeenCalled();

    todaySpy.mockRestore();
    tomorrowSpy.mockRestore();
    yesterdaySpy.mockRestore();
    componentsSpy.mockRestore();
    addSpy.mockRestore();
  });
});
