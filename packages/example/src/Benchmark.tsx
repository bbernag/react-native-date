import { useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

// NativeDate
import {
  now,
  parse,
  format,
  formatUTC,
  addDays,
  addMonths,
  addHours,
  addMinutes,
  addSeconds,
  diffInDays,
  startOfDay,
  endOfDay,
  isWeekend,
  isLeapYear,
  getComponents,
  formatInTimezone,
} from '@bernagl/react-native-date';

// date-fns
import {
  format as dateFnsFormat,
  addDays as dateFnsAddDays,
  addMonths as dateFnsAddMonths,
  addHours as dateFnsAddHours,
  addMinutes as dateFnsAddMinutes,
  addSeconds as dateFnsAddSeconds,
  differenceInDays as dateFnsDiffInDays,
  startOfDay as dateFnsStartOfDay,
  endOfDay as dateFnsEndOfDay,
  isWeekend as dateFnsIsWeekend,
  isLeapYear as dateFnsIsLeapYear,
  constructNow as dateFnsConstructNow,
  parseISO as dateFnsParseISO,
  getYear as dateFnsGetYear,
  getMonth as dateFnsGetMonth,
  getDate as dateFnsGetDate,
  getHours as dateFnsGetHours,
  getMinutes as dateFnsGetMinutes,
  getSeconds as dateFnsGetSeconds,
} from 'date-fns';
import { TZDate } from '@date-fns/tz';

// dayjs
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isLeapYearPlugin from 'dayjs/plugin/isLeapYear';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isLeapYearPlugin);

// luxon
import { DateTime } from 'luxon';

type BenchmarkResult = {
  name: string;
  nativeOps: number;
  dateFnsOps: number;
  dayjsOps: number;
  luxonOps: number;
  nativeTimeMs: number;
  dateFnsTimeMs: number;
  dayjsTimeMs: number;
  luxonTimeMs: number;
  winner: 'native' | 'date-fns' | 'dayjs' | 'luxon';
};

type DisplayMode = 'ops' | 'time';

const ITERATION_OPTIONS = [20, 100, 1000, 5000, 10000] as const;
const ROUNDS = 3; // Run each benchmark multiple times for reliability

// Generate random test data to prevent caching
function generateTestData(count: number) {
  const baseTimestamp = Date.parse('2020-01-01T00:00:00.000Z');
  const fourYearsMs = 4 * 365 * 24 * 60 * 60 * 1000;

  const timestamps: number[] = [];
  const isoStrings: string[] = [];
  const amounts: number[] = [];

  for (let i = 0; i < count; i++) {
    const ts = baseTimestamp + Math.floor(Math.random() * fourYearsMs);
    timestamps.push(ts);
    isoStrings.push(new Date(ts).toISOString());
    amounts.push(Math.floor(Math.random() * 100) + 1);
  }

  return { timestamps, isoStrings, amounts };
}

function runSingleRound(
  fn: (i: number) => void,
  iterations: number
): { ops: number; timeMs: number } {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn(i);
  const end = performance.now();

  const totalMs = end - start;
  const meanMs = totalMs / iterations;
  return {
    ops: Math.round(1000 / meanMs),
    timeMs: totalMs,
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function runDynamicBenchmark(
  fn: (i: number) => void,
  iterations: number
): { ops: number; timeMs: number } {
  // Warmup - scale with iterations (min 50, max 200)
  const warmup = Math.min(200, Math.max(50, Math.floor(iterations / 10)));
  for (let i = 0; i < warmup; i++) fn(i % iterations);

  // Run multiple rounds and collect results
  const opsResults: number[] = [];
  const timeResults: number[] = [];

  for (let round = 0; round < ROUNDS; round++) {
    const result = runSingleRound(fn, iterations);
    opsResults.push(result.ops);
    timeResults.push(result.timeMs);
  }

  // Return median values (more stable than mean)
  return {
    ops: Math.round(median(opsResults)),
    timeMs: median(timeResults),
  };
}

function Benchmark() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [running, setRunning] = useState(false);
  const [iterations, setIterations] = useState<number>(5000);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('ops');

  const runComparisonBenchmarks = useCallback(() => {
    // Generate fresh random data for each benchmark run
    const { timestamps, isoStrings, amounts } = generateTestData(iterations);

    // Pre-create second set of timestamps for diff operations
    const futureTimestamps = timestamps.map(
      (ts, i) => ts + 86400000 * amounts[i]!
    );

    const benchmarks: BenchmarkResult[] = [];
    const tz = 'America/New_York';

    // Helper to create comparison result
    const compare = (
      name: string,
      nativeFn: (i: number) => void,
      dateFnsFn: (i: number) => void,
      dayjsFn: (i: number) => void,
      luxonFn: (i: number) => void
    ): BenchmarkResult => {
      const nativeResult = runDynamicBenchmark(nativeFn, iterations);
      const dateFnsResult = runDynamicBenchmark(dateFnsFn, iterations);
      const dayjsResult = runDynamicBenchmark(dayjsFn, iterations);
      const luxonResult = runDynamicBenchmark(luxonFn, iterations);

      const maxOps = Math.max(
        nativeResult.ops,
        dateFnsResult.ops,
        dayjsResult.ops,
        luxonResult.ops
      );
      const winner =
        maxOps === nativeResult.ops
          ? 'native'
          : maxOps === dateFnsResult.ops
          ? 'date-fns'
          : maxOps === dayjsResult.ops
          ? 'dayjs'
          : 'luxon';

      return {
        name,
        nativeOps: nativeResult.ops,
        dateFnsOps: dateFnsResult.ops,
        dayjsOps: dayjsResult.ops,
        luxonOps: luxonResult.ops,
        nativeTimeMs: nativeResult.timeMs,
        dateFnsTimeMs: dateFnsResult.timeMs,
        dayjsTimeMs: dayjsResult.timeMs,
        luxonTimeMs: luxonResult.timeMs,
        winner,
      };
    };

    // now() - get current timestamp (native uses C++ std::chrono)
    benchmarks.push(
      compare(
        'now()',
        () => now(), // Native C++ std::chrono
        () => dateFnsConstructNow(new Date()).getTime(),
        () => dayjs().valueOf(),
        () => DateTime.now().toMillis()
      )
    );

    // parse() - different string each iteration
    benchmarks.push(
      compare(
        'parse()',
        (i) => parse(isoStrings[i]!),
        (i) => dateFnsParseISO(isoStrings[i]!).getTime(),
        (i) => dayjs(isoStrings[i]).valueOf(),
        (i) => DateTime.fromISO(isoStrings[i]!).toMillis()
      )
    );

    // format() - different timestamp each iteration
    benchmarks.push(
      compare(
        'format()',
        (i) => format(timestamps[i]!, 'yyyy-MM-dd HH:mm:ss'),
        (i) => dateFnsFormat(new Date(timestamps[i]!), 'yyyy-MM-dd HH:mm:ss'),
        (i) => dayjs(timestamps[i]!).format('YYYY-MM-DD HH:mm:ss'),
        (i) =>
          DateTime.fromMillis(timestamps[i]!).toFormat('yyyy-MM-dd HH:mm:ss')
      )
    );

    // addDays() - different timestamp and amount each iteration
    benchmarks.push(
      compare(
        'addDays()',
        (i) => addDays(timestamps[i]!, amounts[i]!),
        (i) => dateFnsAddDays(new Date(timestamps[i]!), amounts[i]!),
        (i) => dayjs(timestamps[i]!).add(amounts[i]!, 'day').valueOf(),
        (i) =>
          DateTime.fromMillis(timestamps[i]!)
            .plus({ days: amounts[i]! })
            .toMillis()
      )
    );

    // addMonths()
    benchmarks.push(
      compare(
        'addMonths()',
        (i) => addMonths(timestamps[i]!, amounts[i]! % 12),
        (i) => dateFnsAddMonths(new Date(timestamps[i]!), amounts[i]! % 12),
        (i) =>
          dayjs(timestamps[i]!)
            .add(amounts[i]! % 12, 'month')
            .valueOf(),
        (i) =>
          DateTime.fromMillis(timestamps[i]!)
            .plus({ months: amounts[i]! % 12 })
            .toMillis()
      )
    );

    // diffInDays() - different pair of timestamps each iteration
    benchmarks.push(
      compare(
        'diffInDays()',
        (i) => diffInDays(futureTimestamps[i]!, timestamps[i]!),
        (i) =>
          dateFnsDiffInDays(
            new Date(futureTimestamps[i]!),
            new Date(timestamps[i]!)
          ),
        (i) => dayjs(futureTimestamps[i]!).diff(dayjs(timestamps[i]!), 'day'),
        (i) =>
          DateTime.fromMillis(futureTimestamps[i]!).diff(
            DateTime.fromMillis(timestamps[i]!),
            'days'
          ).days
      )
    );

    // startOfDay()
    benchmarks.push(
      compare(
        'startOfDay()',
        (i) => startOfDay(timestamps[i]!),
        (i) => dateFnsStartOfDay(new Date(timestamps[i]!)),
        (i) => dayjs(timestamps[i]!).startOf('day').valueOf(),
        (i) => DateTime.fromMillis(timestamps[i]!).startOf('day').toMillis()
      )
    );

    // endOfDay()
    benchmarks.push(
      compare(
        'endOfDay()',
        (i) => endOfDay(timestamps[i]!),
        (i) => dateFnsEndOfDay(new Date(timestamps[i]!)),
        (i) => dayjs(timestamps[i]!).endOf('day').valueOf(),
        (i) => DateTime.fromMillis(timestamps[i]!).endOf('day').toMillis()
      )
    );

    // isWeekend()
    benchmarks.push(
      compare(
        'isWeekend()',
        (i) => isWeekend(timestamps[i]!),
        (i) => dateFnsIsWeekend(new Date(timestamps[i]!)),
        (i) => {
          const d = dayjs(timestamps[i]!).day();
          return d === 0 || d === 6;
        },
        (i) => DateTime.fromMillis(timestamps[i]!).weekday >= 6
      )
    );

    // isLeapYear()
    benchmarks.push(
      compare(
        'isLeapYear()',
        (i) => isLeapYear(timestamps[i]!),
        (i) => dateFnsIsLeapYear(new Date(timestamps[i]!)),
        (i) => dayjs(timestamps[i]!).isLeapYear?.() ?? false,
        (i) => DateTime.fromMillis(timestamps[i]!).isInLeapYear
      )
    );

    // getComponents()
    benchmarks.push(
      compare(
        'getComponents()',
        (i) => getComponents(timestamps[i]!),
        (i) => {
          const ts = timestamps[i]!;
          return {
            year: dateFnsGetYear(ts),
            month: dateFnsGetMonth(ts) + 1,
            day: dateFnsGetDate(ts),
            hour: dateFnsGetHours(ts),
            minute: dateFnsGetMinutes(ts),
            second: dateFnsGetSeconds(ts),
          };
        },
        (i) => {
          const d = dayjs(timestamps[i]!);
          return {
            year: d.year(),
            month: d.month() + 1,
            day: d.date(),
            hour: d.hour(),
            minute: d.minute(),
            second: d.second(),
          };
        },
        (i) => {
          const d = DateTime.fromMillis(timestamps[i]!);
          return {
            year: d.year,
            month: d.month,
            day: d.day,
            hour: d.hour,
            minute: d.minute,
            second: d.second,
          };
        }
      )
    );

    // addHours()
    benchmarks.push(
      compare(
        'addHours()',
        (i) => addHours(timestamps[i]!, amounts[i]!),
        (i) => dateFnsAddHours(new Date(timestamps[i]!), amounts[i]!),
        (i) => dayjs(timestamps[i]!).add(amounts[i]!, 'hour').valueOf(),
        (i) =>
          DateTime.fromMillis(timestamps[i]!)
            .plus({ hours: amounts[i]! })
            .toMillis()
      )
    );

    // addMinutes()
    benchmarks.push(
      compare(
        'addMinutes()',
        (i) => addMinutes(timestamps[i]!, amounts[i]!),
        (i) => dateFnsAddMinutes(new Date(timestamps[i]!), amounts[i]!),
        (i) => dayjs(timestamps[i]!).add(amounts[i]!, 'minute').valueOf(),
        (i) =>
          DateTime.fromMillis(timestamps[i]!)
            .plus({ minutes: amounts[i]! })
            .toMillis()
      )
    );

    // addSeconds()
    benchmarks.push(
      compare(
        'addSeconds()',
        (i) => addSeconds(timestamps[i]!, amounts[i]!),
        (i) => dateFnsAddSeconds(new Date(timestamps[i]!), amounts[i]!),
        (i) => dayjs(timestamps[i]!).add(amounts[i]!, 'second').valueOf(),
        (i) =>
          DateTime.fromMillis(timestamps[i]!)
            .plus({ seconds: amounts[i]! })
            .toMillis()
      )
    );

    // formatUTC()
    benchmarks.push(
      compare(
        'formatUTC()',
        (i) => formatUTC(timestamps[i]!, 'yyyy-MM-dd HH:mm:ss'),
        (i) =>
          dateFnsFormat(
            new TZDate(timestamps[i]!, 'UTC'),
            'yyyy-MM-dd HH:mm:ss'
          ),
        (i) => dayjs(timestamps[i]!).utc().format('YYYY-MM-DD HH:mm:ss'),
        (i) =>
          DateTime.fromMillis(timestamps[i]!)
            .toUTC()
            .toFormat('yyyy-MM-dd HH:mm:ss')
      )
    );

    // formatInTimezone()
    benchmarks.push(
      compare(
        'formatInTZ()',
        (i) => formatInTimezone(timestamps[i]!, 'yyyy-MM-dd HH:mm', tz),
        (i) =>
          dateFnsFormat(new TZDate(timestamps[i]!, tz), 'yyyy-MM-dd HH:mm'),
        (i) => dayjs(timestamps[i]!).tz(tz).format('YYYY-MM-DD HH:mm'),
        (i) =>
          DateTime.fromMillis(timestamps[i]!)
            .setZone(tz)
            .toFormat('yyyy-MM-dd HH:mm')
      )
    );

    return benchmarks;
  }, [iterations]);

  const handleRunBenchmarks = useCallback(async () => {
    setRunning(true);
    setResults([]);

    // Small delay to let UI update
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const benchmarkResults = runComparisonBenchmarks();
      setResults(benchmarkResults);
    } catch (error) {
      console.error('Benchmark error:', error);
    } finally {
      setRunning(false);
    }
  }, [runComparisonBenchmarks]);

  const formatOps = (ops: number): string => {
    if (ops >= 1000000) return `${(ops / 1000000).toFixed(1)}M`;
    if (ops >= 1000) return `${(ops / 1000).toFixed(1)}K`;
    return ops.toString();
  };

  const formatTime = (ms: number): string => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms >= 1) return `${ms.toFixed(1)}ms`;
    return `${(ms * 1000).toFixed(0)}µs`;
  };

  const getSpeedMultiplier = (r: BenchmarkResult): string => {
    const ops = [r.nativeOps, r.dateFnsOps, r.dayjsOps, r.luxonOps];
    const winnerOps = Math.max(...ops);
    const slowestOps = Math.min(...ops);

    // When NativeDate wins, compare vs slowest; when other wins, compare vs NativeDate
    const compareToOps = r.winner === 'native' ? slowestOps : r.nativeOps;

    if (compareToOps === 0) return '';

    const multiplier = winnerOps / compareToOps;
    if (multiplier >= 10) return `${Math.round(multiplier)}x`;
    if (multiplier >= 2) return `${multiplier.toFixed(1)}x`;
    return `${multiplier.toFixed(2)}x`;
  };

  const formatValue = (
    r: BenchmarkResult,
    lib: 'native' | 'date-fns' | 'dayjs' | 'luxon'
  ): string => {
    if (displayMode === 'ops') {
      const opsMap = {
        'native': r.nativeOps,
        'date-fns': r.dateFnsOps,
        'dayjs': r.dayjsOps,
        'luxon': r.luxonOps,
      };
      return formatOps(opsMap[lib]);
    } else {
      const timeMap = {
        'native': r.nativeTimeMs,
        'date-fns': r.dateFnsTimeMs,
        'dayjs': r.dayjsTimeMs,
        'luxon': r.luxonTimeMs,
      };
      return formatTime(timeMap[lib]);
    }
  };

  const formatValueWithMultiplier = (
    r: BenchmarkResult,
    lib: 'native' | 'date-fns' | 'dayjs' | 'luxon'
  ): string => {
    const value = formatValue(r, lib);
    if (r.winner === lib && displayMode === 'ops') {
      const multiplier = getSpeedMultiplier(r);
      return `${value} (${multiplier})`;
    }
    return value;
  };

  const getWinnerStyle = (
    winner: string,
    column: 'native' | 'date-fns' | 'dayjs' | 'luxon'
  ) => {
    if (winner === column) {
      return styles.winnerCell;
    }
    return {};
  };

  // Calculate summary
  const nativeWins = results.filter((r) => r.winner === 'native').length;
  const dateFnsWins = results.filter((r) => r.winner === 'date-fns').length;
  const dayjsWins = results.filter((r) => r.winner === 'dayjs').length;
  const luxonWins = results.filter((r) => r.winner === 'luxon').length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Performance Comparison</Text>
      <Text style={styles.subtitle}>
        NativeDate vs date-fns vs dayjs vs luxon
      </Text>

      {/* Iteration Selector */}
      <View style={styles.iterationSelector}>
        <Text style={styles.iterationLabel}>Iterations:</Text>
        <View style={styles.iterationOptions}>
          {ITERATION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.iterationOption,
                iterations === opt && styles.iterationOptionActive,
              ]}
              onPress={() => setIterations(opt)}
              disabled={running}
            >
              <Text
                style={[
                  styles.iterationOptionText,
                  iterations === opt && styles.iterationOptionTextActive,
                ]}
              >
                {opt.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Display Mode Selector */}
      <View style={styles.iterationSelector}>
        <Text style={styles.iterationLabel}>Display:</Text>
        <View style={styles.iterationOptions}>
          <TouchableOpacity
            style={[
              styles.iterationOption,
              displayMode === 'ops' && styles.iterationOptionActive,
            ]}
            onPress={() => setDisplayMode('ops')}
          >
            <Text
              style={[
                styles.iterationOptionText,
                displayMode === 'ops' && styles.iterationOptionTextActive,
              ]}
            >
              ops/sec
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iterationOption,
              displayMode === 'time' && styles.iterationOptionActive,
            ]}
            onPress={() => setDisplayMode('time')}
          >
            <Text
              style={[
                styles.iterationOptionText,
                displayMode === 'time' && styles.iterationOptionTextActive,
              ]}
            >
              time (ms)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, running && styles.buttonDisabled]}
        onPress={handleRunBenchmarks}
        disabled={running}
      >
        {running ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run Benchmarks</Text>
        )}
      </TouchableOpacity>

      {results.length > 0 && (
        <>
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Results Summary</Text>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryItem, styles.nativeBg]}>
                <Text style={styles.summaryLabel}>Native</Text>
                <Text style={styles.summaryValue}>{nativeWins}</Text>
              </View>
              <View style={[styles.summaryItem, styles.dateFnsBg]}>
                <Text style={styles.summaryLabel}>date-fns</Text>
                <Text style={styles.summaryValue}>{dateFnsWins}</Text>
              </View>
              <View style={[styles.summaryItem, styles.dayjsBg]}>
                <Text style={styles.summaryLabel}>dayjs</Text>
                <Text style={styles.summaryValue}>{dayjsWins}</Text>
              </View>
              <View style={[styles.summaryItem, styles.luxonBg]}>
                <Text style={styles.summaryLabel}>luxon</Text>
                <Text style={styles.summaryValue}>{luxonWins}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Detailed Results -{' '}
              {displayMode === 'ops' ? 'ops/sec' : 'total time'} (
              {iterations.toLocaleString()} iter)
            </Text>
            <View style={styles.table}>
              <View style={styles.headerRow}>
                <Text style={[styles.cell, styles.headerCell, styles.nameCell]}>
                  Op
                </Text>
                <Text
                  style={[styles.cell, styles.headerCell, styles.valueColCell]}
                >
                  Native
                </Text>
                <Text
                  style={[styles.cell, styles.headerCell, styles.valueColCell]}
                >
                  d-fns
                </Text>
                <Text
                  style={[styles.cell, styles.headerCell, styles.valueColCell]}
                >
                  dayjs
                </Text>
                <Text
                  style={[styles.cell, styles.headerCell, styles.valueColCell]}
                >
                  luxon
                </Text>
              </View>
              {results.map((r) => (
                <View key={r.name} style={styles.row}>
                  <Text style={[styles.cell, styles.nameCell]}>{r.name}</Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.valueColCell,
                      getWinnerStyle(r.winner, 'native'),
                    ]}
                  >
                    {formatValueWithMultiplier(r, 'native')}
                  </Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.valueColCell,
                      getWinnerStyle(r.winner, 'date-fns'),
                    ]}
                  >
                    {formatValueWithMultiplier(r, 'date-fns')}
                  </Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.valueColCell,
                      getWinnerStyle(r.winner, 'dayjs'),
                    ]}
                  >
                    {formatValueWithMultiplier(r, 'dayjs')}
                  </Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.valueColCell,
                      getWinnerStyle(r.winner, 'luxon'),
                    ]}
                  >
                    {formatValueWithMultiplier(r, 'luxon')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <View style={styles.notes}>
        <Text style={styles.notesTitle}>Notes:</Text>
        <Text style={styles.notesText}>
          • {ROUNDS} rounds per benchmark, median result{'\n'}• Dynamic warmup
          (50-200) for JIT optimization{'\n'}• NativeDate: Hybrid JS + C++ via
          Nitro{'\n'}• ops/sec: higher = better | time: lower = better{'\n'}•
          Green = winner for that operation
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 12,
    paddingTop: 12,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  iterationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  iterationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  iterationOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  iterationOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  iterationOptionActive: {
    backgroundColor: '#007AFF',
  },
  iterationOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  iterationOptionTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 70,
  },
  nativeBg: {
    backgroundColor: '#e8f5e9',
  },
  dateFnsBg: {
    backgroundColor: '#e3f2fd',
  },
  dayjsBg: {
    backgroundColor: '#fff3e0',
  },
  luxonBg: {
    backgroundColor: '#f3e5f5',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 10,
  },
  headerCell: {
    fontWeight: '600',
    color: '#666',
    fontSize: 9,
  },
  nameCell: {
    flex: 1.3,
  },
  valueColCell: {
    flex: 1,
    textAlign: 'right',
  },
  winnerCell: {
    backgroundColor: '#c8e6c9',
    fontWeight: '700',
    color: '#2e7d32',
  },
  notes: {
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 10,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  notesText: {
    fontSize: 10,
    color: '#666',
    lineHeight: 16,
  },
});

export default Benchmark;
