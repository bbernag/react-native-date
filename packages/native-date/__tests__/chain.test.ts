/**
 * Chainable API tests: parity with the functional API, immutability, valueOf.
 */
import { nativeDate, NativeDateChain } from '../src/chain';
import {
  parse,
  format,
  addDays,
  startOfDay,
  setYear,
  setMonth,
  setDate,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from '../src/index';

const BASE = '2024-06-15T14:30:45.123';

describe('NativeDateChain construction', () => {
  it('nativeDate(string) equals parse()', () => {
    expect(nativeDate('2024-12-25').valueOf()).toBe(parse('2024-12-25'));
    expect(nativeDate(BASE).valueOf()).toBe(parse(BASE));
  });

  it('nativeDate(number) and nativeDate(Date) keep the instant', () => {
    const ts = parse(BASE);
    expect(nativeDate(ts).valueOf()).toBe(ts);
    expect(nativeDate(new Date(ts)).valueOf()).toBe(ts);
  });

  it('nativeDate() is now()', () => {
    const before = Date.now();
    const value = nativeDate().valueOf();
    expect(value).toBeGreaterThanOrEqual(before);
    expect(value).toBeLessThanOrEqual(Date.now());
  });

  it('string input to the chain matches string input to the functional API', () => {
    expect(nativeDate('2024-12-25').startOfDay().valueOf()).toBe(
      startOfDay('2024-12-25')
    );
    expect(nativeDate('2024-12-25').addDays(1).valueOf()).toBe(
      addDays('2024-12-25', 1)
    );
  });

  it('invalid strings throw like parse()', () => {
    expect(() => nativeDate('invalid')).toThrow();
    expect(() => NativeDateChain.parse('Dec 25, 2024')).toThrow();
  });
});

describe('Chain setters delegate to the functional setters', () => {
  const ts = parse(BASE);

  it('setYear clamps Feb 29 to Feb 28 in a non-leap year (parity)', () => {
    const leap = parse('2024-02-29T12:00:00');
    const chained = nativeDate(leap).setYear(2023);
    expect(chained.valueOf()).toBe(setYear(leap, 2023));
    expect(chained.format('yyyy-MM-dd')).toBe('2023-02-28');
  });

  it('setYear keeps Feb 29 in a leap year (parity)', () => {
    const leap = parse('2024-02-29T12:00:00');
    const chained = nativeDate(leap).setYear(2028);
    expect(chained.valueOf()).toBe(setYear(leap, 2028));
    expect(chained.format('yyyy-MM-dd')).toBe('2028-02-29');
  });

  it('setMonth clamps Jan 31 to the end of the target month (parity)', () => {
    const jan31 = parse('2024-01-31T12:00:00');
    expect(nativeDate(jan31).setMonth(2).valueOf()).toBe(setMonth(jan31, 2));
    expect(nativeDate(jan31).setMonth(2).format('yyyy-MM-dd')).toBe(
      '2024-02-29'
    );
    expect(nativeDate(jan31).setMonth(4).format('yyyy-MM-dd')).toBe(
      '2024-04-30'
    );
    const jan31NonLeap = parse('2023-01-31T12:00:00');
    expect(nativeDate(jan31NonLeap).setMonth(2).format('yyyy-MM-dd')).toBe(
      '2023-02-28'
    );
  });

  it('setYear takes two-digit years literally (parity)', () => {
    expect(nativeDate(ts).setYear(99).valueOf()).toBe(setYear(ts, 99));
    expect(nativeDate(ts).setYear(99).year).toBe(99);
  });

  it.each([
    ['setDate', 25, setDate],
    ['setHours', 9, setHours],
    ['setMinutes', 45, setMinutes],
    ['setSeconds', 30, setSeconds],
    ['setMilliseconds', 500, setMilliseconds],
  ] as const)('%s matches the functional API', (method, value, fn) => {
    expect(nativeDate(ts)[method](value).valueOf()).toBe(fn(ts, value));
  });

  it('setters preserve the other components', () => {
    const result = nativeDate(ts).setDate(1).getComponents();
    expect(result).toMatchObject({
      year: 2024,
      month: 6,
      day: 1,
      hour: 14,
      minute: 30,
      second: 45,
      millisecond: 123,
    });
  });

  it('setters chain', () => {
    const result = nativeDate(parse('2024-01-15T10:30:00'))
      .setMonth(6)
      .setHours(14)
      .setMinutes(45);
    expect(result.format('yyyy-MM-dd HH:mm')).toBe('2024-06-15 14:45');
  });
});

describe('Immutability', () => {
  it('every operation returns a new instance and leaves the original intact', () => {
    const original = nativeDate(BASE);
    const ts = original.valueOf();

    const added = original.addDays(7);
    const set = original.setYear(2030);
    const bounded = original.startOfDay();
    const cloned = original.clone();

    expect(original.valueOf()).toBe(ts);
    expect(added).not.toBe(original);
    expect(set).not.toBe(original);
    expect(bounded).not.toBe(original);
    expect(cloned).not.toBe(original);
    expect(cloned.valueOf()).toBe(ts);
    expect(added.valueOf()).toBe(addDays(ts, 7));
  });

  it('toDate() returns a fresh Date each time', () => {
    const chain = nativeDate(BASE);
    const a = chain.toDate();
    const b = chain.toDate();
    expect(a).not.toBe(b);
    expect(a.getTime()).toBe(chain.valueOf());
    a.setFullYear(1990);
    expect(chain.valueOf()).toBe(parse(BASE));
  });
});

describe('valueOf()', () => {
  it('returns the timestamp and drives numeric coercion', () => {
    const ts = parse(BASE);
    const chain = nativeDate(ts);
    expect(chain.valueOf()).toBe(ts);
    expect(chain.timestamp).toBe(ts);
    expect(+chain).toBe(ts);
    expect(Number(chain)).toBe(ts);
  });

  it('allows relational comparison between chains', () => {
    const earlier = nativeDate('2024-01-01');
    const later = nativeDate('2024-06-01');
    expect(earlier < later).toBe(true);
    expect(later > earlier).toBe(true);
    expect(earlier.isBefore(later)).toBe(true);
    expect(later.isAfter(earlier.valueOf())).toBe(true);
  });

  it('format agrees with the functional API', () => {
    const chain = nativeDate(BASE);
    expect(chain.format('yyyy-MM-dd HH:mm:ss')).toBe(
      format(parse(BASE), 'yyyy-MM-dd HH:mm:ss')
    );
    expect(chain.formatDate()).toBe('2024-06-15');
  });
});
