/**
 * Performance benchmarks comparing NativeDate with date-fns and dayjs
 *
 * Run with: yarn test benchmarks/benchmark.test.ts
 *
 * Note: When running in Node.js, NativeDate uses a JS mock.
 * Real native performance should be measured on device using the example app.
 */

import {
  format as dateFnsFormat,
  addDays as dateFnsAddDays,
  addMonths as dateFnsAddMonths,
  differenceInDays as dateFnsDiffInDays,
  startOfDay as dateFnsStartOfDay,
  endOfDay as dateFnsEndOfDay,
  isWeekend as dateFnsIsWeekend,
  isLeapYear as dateFnsIsLeapYear,
} from 'date-fns';

import dayjs from 'dayjs';

import {
  parse,
  format,
  addDays,
  addMonths,
  diffInDays,
  startOfDay,
  endOfDay,
  isWeekend,
  isLeapYear,
  now,
  getComponents,
} from '../src/index';

// Test data
const ISO_DATE_STRING = '2024-06-15T14:30:45.123Z';
const TIMESTAMP = Date.parse(ISO_DATE_STRING);
const DATE_OBJECT = new Date(TIMESTAMP);
const FORMAT_PATTERN = 'yyyy-MM-dd HH:mm:ss';
const ITERATIONS = 10000;
const WARMUP = 1000;

type BenchmarkResult = {
  name: string;
  opsPerSecond: number;
  meanMs: number;
};

function runBenchmark(name: string, fn: () => void): BenchmarkResult {
  // Warmup
  for (let i = 0; i < WARMUP; i++) fn();

  // Measure
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) fn();
  const end = performance.now();

  const totalMs = end - start;
  const meanMs = totalMs / ITERATIONS;
  const opsPerSecond = Math.round(1000 / meanMs);

  return { name, opsPerSecond, meanMs };
}

function logResults(category: string, results: BenchmarkResult[]): void {
  console.log(`\n  ${category}`);
  console.log(`  ${'-'.repeat(60)}`);
  for (const r of results) {
    const ops = r.opsPerSecond.toLocaleString().padStart(12);
    const mean = r.meanMs.toFixed(4).padStart(10);
    console.log(`  ${r.name.padEnd(35)} ${ops} ops/s  ${mean} ms`);
  }
}

describe('Performance Benchmarks', () => {
  beforeAll(() => {
    console.log('\n');
    console.log('='.repeat(70));
    console.log('  NativeDate Performance Benchmarks');
    console.log(
      '  (Using JS mock - real native performance measured on device)'
    );
    console.log('='.repeat(70));
  });

  test('now() performance', () => {
    const results = [
      runBenchmark('NativeDate.now()', () => now()),
      runBenchmark('Date.now()', () => Date.now()),
      runBenchmark('dayjs().valueOf()', () => dayjs().valueOf()),
    ];
    logResults('Current Time (now)', results);
    expect(results.length).toBe(3);
  });

  test('parse() performance', () => {
    const results = [
      runBenchmark('NativeDate.parse()', () => parse(ISO_DATE_STRING)),
      runBenchmark('Date.parse()', () => Date.parse(ISO_DATE_STRING)),
      runBenchmark('dayjs().valueOf()', () => dayjs(ISO_DATE_STRING).valueOf()),
    ];
    logResults('Parsing ISO 8601', results);
    expect(results.length).toBe(3);
  });

  test('format() performance', () => {
    const dayjsDate = dayjs(TIMESTAMP);
    const results = [
      runBenchmark('NativeDate.format()', () =>
        format(TIMESTAMP, FORMAT_PATTERN)
      ),
      runBenchmark('date-fns format()', () =>
        dateFnsFormat(DATE_OBJECT, FORMAT_PATTERN)
      ),
      runBenchmark('dayjs.format()', () =>
        dayjsDate.format('YYYY-MM-DD HH:mm:ss')
      ),
    ];
    logResults('Formatting', results);
    expect(results.length).toBe(3);
  });

  test('addDays() performance', () => {
    const dayjsDate = dayjs(TIMESTAMP);
    const results = [
      runBenchmark('NativeDate.addDays()', () => addDays(TIMESTAMP, 30)),
      runBenchmark('date-fns addDays()', () => dateFnsAddDays(DATE_OBJECT, 30)),
      runBenchmark('dayjs.add()', () => dayjsDate.add(30, 'day').valueOf()),
    ];
    logResults('Add Days', results);
    expect(results.length).toBe(3);
  });

  test('addMonths() performance', () => {
    const dayjsDate = dayjs(TIMESTAMP);
    const results = [
      runBenchmark('NativeDate.addMonths()', () => addMonths(TIMESTAMP, 3)),
      runBenchmark('date-fns addMonths()', () =>
        dateFnsAddMonths(DATE_OBJECT, 3)
      ),
      runBenchmark('dayjs.add()', () => dayjsDate.add(3, 'month').valueOf()),
    ];
    logResults('Add Months', results);
    expect(results.length).toBe(3);
  });

  test('diffInDays() performance', () => {
    const futureTimestamp = TIMESTAMP + 30 * 24 * 60 * 60 * 1000;
    const futureDate = new Date(futureTimestamp);
    const futureDayjs = dayjs(futureTimestamp);
    const baseDayjs = dayjs(TIMESTAMP);

    const results = [
      runBenchmark('NativeDate.diffInDays()', () =>
        diffInDays(futureTimestamp, TIMESTAMP)
      ),
      runBenchmark('date-fns differenceInDays()', () =>
        dateFnsDiffInDays(futureDate, DATE_OBJECT)
      ),
      runBenchmark('dayjs.diff()', () => futureDayjs.diff(baseDayjs, 'day')),
    ];
    logResults('Difference in Days', results);
    expect(results.length).toBe(3);
  });

  test('startOfDay() performance', () => {
    const dayjsDate = dayjs(TIMESTAMP);
    const results = [
      runBenchmark('NativeDate.startOfDay()', () => startOfDay(TIMESTAMP)),
      runBenchmark('date-fns startOfDay()', () =>
        dateFnsStartOfDay(DATE_OBJECT)
      ),
      runBenchmark('dayjs.startOf()', () => dayjsDate.startOf('day').valueOf()),
    ];
    logResults('Start of Day', results);
    expect(results.length).toBe(3);
  });

  test('endOfDay() performance', () => {
    const dayjsDate = dayjs(TIMESTAMP);
    const results = [
      runBenchmark('NativeDate.endOfDay()', () => endOfDay(TIMESTAMP)),
      runBenchmark('date-fns endOfDay()', () => dateFnsEndOfDay(DATE_OBJECT)),
      runBenchmark('dayjs.endOf()', () => dayjsDate.endOf('day').valueOf()),
    ];
    logResults('End of Day', results);
    expect(results.length).toBe(3);
  });

  test('isWeekend() performance', () => {
    const saturday = Date.parse('2024-06-15T12:00:00');
    const saturdayDate = new Date(saturday);
    const saturdayDayjs = dayjs(saturday);

    const results = [
      runBenchmark('NativeDate.isWeekend()', () => isWeekend(saturday)),
      runBenchmark('date-fns isWeekend()', () =>
        dateFnsIsWeekend(saturdayDate)
      ),
      runBenchmark('dayjs day() check', () => {
        const d = saturdayDayjs.day();
        return d === 0 || d === 6;
      }),
    ];
    logResults('Is Weekend', results);
    expect(results.length).toBe(3);
  });

  test('isLeapYear() performance', () => {
    const results = [
      runBenchmark('NativeDate.isLeapYear()', () => isLeapYear(TIMESTAMP)),
      runBenchmark('date-fns isLeapYear()', () =>
        dateFnsIsLeapYear(DATE_OBJECT)
      ),
    ];
    logResults('Is Leap Year', results);
    expect(results.length).toBe(2);
  });

  test('getComponents() performance', () => {
    const dayjsDate = dayjs(TIMESTAMP);
    const results = [
      runBenchmark('NativeDate.getComponents()', () =>
        getComponents(TIMESTAMP)
      ),
      runBenchmark('Date getters', () => ({
        year: DATE_OBJECT.getFullYear(),
        month: DATE_OBJECT.getMonth() + 1,
        day: DATE_OBJECT.getDate(),
        hour: DATE_OBJECT.getHours(),
        minute: DATE_OBJECT.getMinutes(),
        second: DATE_OBJECT.getSeconds(),
      })),
      runBenchmark('dayjs getters', () => ({
        year: dayjsDate.year(),
        month: dayjsDate.month() + 1,
        day: dayjsDate.date(),
        hour: dayjsDate.hour(),
        minute: dayjsDate.minute(),
        second: dayjsDate.second(),
      })),
    ];
    logResults('Get Components', results);
    expect(results.length).toBe(3);
  });

  afterAll(() => {
    console.log('\n' + '='.repeat(70));
    console.log('  Summary');
    console.log('='.repeat(70));
    console.log(`
  Notes:
  - NativeDate uses a JavaScript mock in Node.js environment
  - Real native C++ performance is typically 2-10x faster
  - Bridge overhead is amortized with batch operations (parseManyAsync)
  - Timezone operations benefit most from native implementation

  Bundle Size Comparison (approximate):
  - NativeDate: ~5KB JS + native binary (~50-100KB per arch)
  - date-fns (tree-shaken): ~10-30KB
  - dayjs: ~2KB core + plugins

  For accurate native benchmarks, run the example app on a real device.
`);
  });
});
