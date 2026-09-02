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

describe('module graph', () => {
  it('importing ./chain does not evaluate the index barrel', () => {
    jest.isolateModules(() => {
      const indexEvaluated = jest.fn();
      jest.doMock('../src/index', () => {
        indexEvaluated();
        return {};
      });

      const chain = require('../src/chain') as typeof import('../src/chain');
      expect(indexEvaluated).not.toHaveBeenCalled();
      expect(chain.nativeDate('2024-01-01').format('yyyy')).toBe('2024');
      jest.dontMock('../src/index');
    });
  });
});

describe('Coercion: toJSON / toString / Symbol.toPrimitive', () => {
  const iso = '2024-06-15T10:30:45.123Z';
  const chain = nativeDate(parse(iso));

  it('JSON.stringify emits the ISO 8601 UTC string, not the internal field', () => {
    expect(chain.toJSON()).toBe(iso);
    expect(JSON.stringify(chain)).toBe(`"${iso}"`);
    expect(JSON.stringify({ at: chain })).toBe(`{"at":"${iso}"}`);
    expect(JSON.stringify(chain)).not.toContain('ts');
  });

  it('does not expose the timestamp as an own enumerable property', () => {
    expect(Object.keys(chain)).toEqual([]);
    expect((chain as unknown as Record<string, unknown>).ts).toBeUndefined();
  });

  it('toString() is the local yyyy-MM-dd HH:mm:ss text', () => {
    expect(chain.toString()).toBe(chain.formatDateTime());
    expect(String(chain)).toBe('2024-06-15 10:30:45');
    expect(`${chain}`).toBe('2024-06-15 10:30:45');
  });

  it('numeric and default hints give the timestamp', () => {
    const ts = parse(iso);
    expect(+chain).toBe(ts);
    expect(Number(chain) - 0).toBe(ts);
    expect(chain[Symbol.toPrimitive]('default')).toBe(ts);
    expect(chain[Symbol.toPrimitive]('string')).toBe('2024-06-15 10:30:45');
    expect(chain > nativeDate(ts - 1)).toBe(true);
  });
});

describe('Comparators accept any DateInput or chain', () => {
  const a = nativeDate('2024-06-15T10:00:00Z');
  const laterTs = parse('2024-06-16T10:00:00Z');

  it('isBefore / isAfter / isSame with chain, number, string and Date', () => {
    expect(a.isBefore(nativeDate(laterTs))).toBe(true);
    expect(a.isBefore(laterTs)).toBe(true);
    expect(a.isBefore('2024-06-16T10:00:00Z')).toBe(true);
    expect(a.isBefore(new Date(laterTs))).toBe(true);
    expect(a.isAfter(new Date(laterTs))).toBe(false);
    expect(a.isSame('2024-06-15T23:00:00', 'day')).toBe(true);
  });

  it('isSameDay / isSameMonth / isSameYear with strings and Dates', () => {
    expect(a.isSameDay('2024-06-15')).toBe(true);
    expect(a.isSameDay(new Date(laterTs))).toBe(false);
    expect(a.isSameMonth('2024-06-01')).toBe(true);
    expect(a.isSameYear(nativeDate('2024-01-01'))).toBe(true);
  });

  it('diff helpers with strings, Dates and chains', () => {
    expect(a.diffInDays('2024-06-10T10:00:00Z')).toBe(5);
    expect(a.diffInHours(new Date(laterTs))).toBe(-24);
    expect(a.diff(nativeDate(laterTs), 'day')).toBe(-1);
  });

  it('predicates return false for invalid input; diff throws', () => {
    expect(a.isBefore('invalid')).toBe(false);
    expect(a.isSameDay(NaN)).toBe(false);
    expect(() => a.diffInDays('invalid')).toThrow();
  });

  it('factories accept another chain', () => {
    expect(nativeDate(a).valueOf()).toBe(a.valueOf());
    expect(NativeDateChain.from(a)).not.toBe(a);
  });
});
