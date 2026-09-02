/**
 * Facade + mock coverage for the native contract (Q1–Q4): clamp, calendar
 * math, strict parse, timezone throws, locale APIs, and NaN/empty policy.
 */
import {
  parse,
  tryParse,
  parseFormat,
  tryParseFormat,
  format,
  formatUTC,
  formatDistance,
  formatDuration,
  fromComponents,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOf,
  diff,
  min,
  max,
  isValid,
  getMilliseconds,
  getHours,
  getMinutes,
  getOffsetInTimezone,
  formatInTimezone,
  toTimezone,
  getLocale,
  setLocale,
  getLocaleDisplayName,
  getLocaleInfo,
  getAvailableLocalesInfo,
  NativeDateModule,
} from '../src/index';

describe('strict ISO-8601 parse', () => {
  it('rejects incomplete time after T, 24:00, lowercase designators, and trailing junk', () => {
    expect(() => parse('2024-01-15T14')).toThrow(/Invalid ISO-8601/);
    expect(() => parse('2024-01-15T24:00')).toThrow(/Invalid ISO-8601/);
    expect(() => parse('2024-01-15t14:30Z')).toThrow(/Invalid ISO-8601/);
    expect(() => parse('2024-01-15T14:30:00Z ')).toThrow(/Invalid ISO-8601/);
    expect(tryParse('2023-02-29')).toBeNull();
  });

  it('truncates fractional seconds and honors date-only offsets', () => {
    expect(parse('2024-01-15T14:30:00.9999Z')).toBe(
      Date.UTC(2024, 0, 15, 14, 30, 0, 999)
    );
    expect(parse('2024-01-15Z')).toBe(Date.UTC(2024, 0, 15));
    expect(parse('2024-01-15+05:00')).toBe(Date.UTC(2024, 0, 14, 19));
  });

  it('throws on input longer than 128 characters', () => {
    expect(() => parse('2024-01-15T14:30:00Z' + 'x'.repeat(120))).toThrow(
      /longer than 128/
    );
  });
});

describe('parseFormat / tryParseFormat', () => {
  it('interprets the result as local wall-clock time', () => {
    const ts = parseFormat('06/15/2024 14:30', 'MM/dd/yyyy HH:mm');
    expect(format(ts, 'yyyy-MM-dd HH:mm')).toBe('2024-06-15 14:30');
  });

  it('requires the whole pattern and whole input to be consumed', () => {
    expect(() => parseFormat('2024', 'yyyy-MM-dd')).toThrow(/Unable to parse/);
    expect(() => parseFormat('2024-01-15garbage', 'yyyy-MM-dd')).toThrow(
      /Unable to parse/
    );
    expect(tryParseFormat('12/25', 'MM/dd/yyyy')).toBeNull();
  });

  it('caps variable-width tokens at 2 digits and rejects name tokens', () => {
    expect(tryParseFormat('999', 'M')).toBeNull();
    expect(tryParseFormat('June', 'MMMM')).toBeNull();
    expect(tryParseFormat('Mon', 'E')).toBeNull();
  });

  it('treats hh without AM/PM as AM and requires 1-12', () => {
    expect(format(parseFormat('12:00', 'hh:mm'), 'HH:mm')).toBe('00:00');
    expect(tryParseFormat('13:00', 'hh:mm')).toBeNull();
  });

  it('accepts YYYY/YY/DD/D and [literal] aliases', () => {
    const ts = parseFormat('2024/06/05', 'YYYY/MM/DD');
    expect(format(ts, 'yyyy-MM-dd')).toBe('2024-06-05');
    expect(format(parseFormat('5', 'D'), 'd')).toBe('5');
    expect(format(parseFormat('the 15', "'the' dd"), 'd')).toBe('15');
    expect(format(parseFormat('the 15', '[the] dd'), 'd')).toBe('15');
  });
});

describe('month clamp and calendar day math (Q1/Q2)', () => {
  it('clamps Jan 31 + 1 month to the last day of February', () => {
    expect(
      format(addMonths(parse('2024-01-31T12:00:00'), 1), 'yyyy-MM-dd')
    ).toBe('2024-02-29');
    expect(
      format(addMonths(parse('2023-01-31T12:00:00'), 1), 'yyyy-MM-dd')
    ).toBe('2023-02-28');
    expect(
      format(addYears(parse('2024-02-29T12:00:00'), 1), 'yyyy-MM-dd')
    ).toBe('2025-02-28');
  });

  it('adds days and weeks on the local calendar', () => {
    const start = parse('2024-03-10T00:00:00');
    expect(format(addDays(start, 1), 'yyyy-MM-dd HH:mm')).toBe(
      '2024-03-11 00:00'
    );
    expect(format(addWeeks(start, 1), 'yyyy-MM-dd HH:mm')).toBe(
      '2024-03-17 00:00'
    );
  });

  it('requires whole numbers for day/week/month/year amounts', () => {
    const ts = parse('2024-06-15T12:00:00');
    expect(() => addDays(ts, 1.5)).toThrow(/whole number/);
    expect(() => addMonths(ts, 1.5)).toThrow(/whole number/);
    expect(() => addYears(ts, 0.5)).toThrow(/whole number/);
  });
});

describe('local startOf hour and complete-month diff', () => {
  it('floors hour on the local grid (half-hour zones included)', () => {
    const ts = parse('2024-06-15T12:30:00');
    expect(format(startOf(ts, 'hour'), 'HH:mm')).toBe('12:00');
    expect(getHours(startOf(ts, 'hour'))).toBe(12);
    expect(getMinutes(startOf(ts, 'hour'))).toBe(0);
  });

  it('counts complete local months with clamp', () => {
    const jan31 = parse('2024-01-31T12:00:00');
    const feb29 = parse('2024-02-29T12:00:00');
    const mar1 = parse('2024-03-01T12:00:00');
    expect(diff(feb29, jan31, 'month')).toBe(1);
    expect(diff(mar1, jan31, 'month')).toBe(1);
  });
});

describe('isValid range and NaN / empty inputs', () => {
  it('isValid is finite AND within ±8.64e15', () => {
    expect(isValid(0)).toBe(true);
    expect(isValid(8.64e15)).toBe(true);
    expect(isValid(8.64e15 + 1)).toBe(false);
    expect(isValid(1e20)).toBe(false);
    expect(isValid(NaN)).toBe(false);
    expect(isValid(Infinity)).toBe(false);
  });

  it('getMilliseconds(-1) is 999 (pre-epoch remainder)', () => {
    expect(getMilliseconds(-1)).toBe(999);
  });

  it('JS min/max throw on empty; native min/max of empty is NaN', () => {
    expect(() => min([])).toThrow(/non-empty/);
    expect(() => max([])).toThrow(/non-empty/);
    expect(NativeDateModule.min([])).toBeNaN();
    expect(NativeDateModule.max([])).toBeNaN();
  });

  it('native min/max propagate NaN regardless of position', () => {
    expect(NativeDateModule.min([1, NaN, 3])).toBeNaN();
    expect(NativeDateModule.max([NaN, 2])).toBeNaN();
  });

  it('NativeDateModule.isToday(NaN) throws; public isToday does not', () => {
    expect(() => NativeDateModule.isToday(NaN)).toThrow();
  });
});

describe('fromComponents and Date / string inputs', () => {
  it('fromComponents takes years 0-99 literally as UTC', () => {
    const ts = fromComponents({
      year: 99,
      month: 6,
      day: 15,
      hour: 12,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    expect(new Date(ts).getUTCFullYear()).toBe(99);
    expect(new Date(ts).getUTCMonth()).toBe(5);
    expect(new Date(ts).getUTCDate()).toBe(15);
  });

  it('accepts Date objects as DateInput', () => {
    const date = new Date(Date.UTC(2024, 5, 15, 12));
    expect(addDays(date, 1)).toBe(addDays(date.getTime(), 1));
    expect(formatUTC(date, 'yyyy-MM-dd')).toBe('2024-06-15');
  });
});

describe('formatDistance / formatDuration', () => {
  const base = parse('2024-06-15T12:00:00Z');

  it('uses the shared bucket table and honors addSuffix', () => {
    expect(formatDistance(base - 2 * 60 * 60 * 1000, base, false)).toBe(
      'about 2 hours'
    );
    expect(formatDistance(base - 2 * 60 * 60 * 1000, base, true)).toBe(
      'about 2 hours ago'
    );
    expect(formatDistance(base + 90 * 1000, base, false)).toBe('2 minutes');
    expect(formatDistance(base - 10 * 1000, base, false)).toBe(
      'less than a minute'
    );
  });

  it('throws on non-finite input', () => {
    expect(() => formatDistance(NaN, base, false)).toThrow(
      /Invalid date input/
    );
    expect(() => formatDuration(NaN)).toThrow();
    expect(() => NativeDateModule.formatDuration(Infinity)).toThrow();
  });

  it('formats durations as d/h/m/s', () => {
    expect(formatDuration(3600000)).toBe('1h 0m 0s');
    expect(formatDuration(86400000)).toBe('1d 0h 0m 0s');
  });
});

describe('format token M is the narrow month name', () => {
  it('emits a narrow name rather than a numeric month', () => {
    const june = parse('2024-06-05T09:05:03.007Z');
    expect(formatUTC(june, 'M')).toBe('J');
    expect(formatUTC(june, 'MM')).toBe('06');
    expect(formatUTC(june, 'MMM')).toBe('Jun');
  });
});

describe('locale APIs', () => {
  afterEach(() => {
    setLocale('en');
  });

  it('defaults to a locale without an explicit setLocale call', () => {
    expect(typeof getLocale()).toBe('string');
    expect(getLocale().length).toBeGreaterThan(0);
    expect(format(parse('2024-06-15T12:00:00'), 'MMMM')).toBe('June');
  });

  it('normalizes _ to - and rejects unknown or unsafe tags', () => {
    expect(setLocale('pt_BR')).toBe(true);
    expect(getLocale()).toBe('pt-BR');
    expect(setLocale('xx-INVALID')).toBe(false);
    expect(setLocale('en\x80')).toBe(false);
    expect(setLocale('en_US')).toBe(true);
    expect(getLocale()).toBe('en-US');
  });

  it('exposes display names and locale info', () => {
    expect(getLocaleDisplayName('en').toLowerCase()).toContain('english');
    const ja = getLocaleInfo('ja');
    expect(ja.nativeName).toBe('日本語');
    expect(ja.languageCode).toBe('ja');
    const all = getAvailableLocalesInfo();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0]).toEqual(
      expect.objectContaining({
        code: expect.any(String),
        displayName: expect.any(String),
        nativeName: expect.any(String),
      })
    );
  });

  it('formats MMMM in Japanese after setLocale', () => {
    expect(setLocale('ja')).toBe(true);
    expect(format(parse('2024-06-15T12:00:00'), 'MMMM')).toBe('6月');
  });
});

describe('New York DST offsets (2024)', () => {
  it('uses EST in January and EDT in June', () => {
    const jan = parse('2024-01-15T12:00:00Z');
    const jun = parse('2024-06-15T12:00:00Z');
    expect(getOffsetInTimezone(jan, 'America/New_York')).toBe(-300);
    expect(getOffsetInTimezone(jun, 'America/New_York')).toBe(-240);
  });

  it('switches on the second Sunday of March 2024', () => {
    const before = parse('2024-03-10T06:59:00Z');
    const after = parse('2024-03-10T07:00:00Z');
    expect(getOffsetInTimezone(before, 'America/New_York')).toBe(-300);
    expect(getOffsetInTimezone(after, 'America/New_York')).toBe(-240);
  });
});

describe('toTimezone shifted epoch', () => {
  it('feeds formatUTC, not local format', () => {
    const ts = parse('2024-06-15T12:00:00Z');
    const shifted = toTimezone(ts, 'America/New_York');
    expect(formatUTC(shifted, 'HH:mm')).toBe(
      formatInTimezone(ts, 'HH:mm', 'America/New_York')
    );
    expect(shifted).toBe(ts + -240 * 60 * 1000);
  });
});
