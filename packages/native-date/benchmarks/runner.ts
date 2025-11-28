/**
 * Simple benchmark runner for measuring performance
 */

export type BenchmarkResult = {
  name: string;
  opsPerSecond: number;
  meanMs: number;
  iterations: number;
  totalMs: number;
};

export type BenchmarkSuite = {
  name: string;
  results: BenchmarkResult[];
};

/**
 * Run a benchmark function and measure performance
 */
export function benchmark(
  name: string,
  fn: () => void,
  options: { iterations?: number; warmupIterations?: number } = {}
): BenchmarkResult {
  const { iterations = 10000, warmupIterations = 1000 } = options;

  // Warmup phase
  for (let i = 0; i < warmupIterations; i++) {
    fn();
  }

  // Measurement phase
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const totalMs = end - start;
  const meanMs = totalMs / iterations;
  const opsPerSecond = Math.round(1000 / meanMs);

  return {
    name,
    opsPerSecond,
    meanMs,
    iterations,
    totalMs,
  };
}

/**
 * Run a suite of benchmarks
 */
export function runSuite(
  name: string,
  benchmarks: Array<{ name: string; fn: () => void }>
): BenchmarkSuite {
  const results = benchmarks.map(({ name: benchName, fn }) =>
    benchmark(benchName, fn)
  );

  return { name, results };
}

/**
 * Format benchmark results as a table
 */
export function formatResults(suite: BenchmarkSuite): string {
  const lines: string[] = [];
  lines.push(`\n${'='.repeat(70)}`);
  lines.push(`  ${suite.name}`);
  lines.push(`${'='.repeat(70)}`);
  lines.push('');
  lines.push(
    `  ${'Operation'.padEnd(35)} ${'ops/sec'.padStart(
      12
    )} ${'mean (ms)'.padStart(12)}`
  );
  lines.push(`  ${'-'.repeat(35)} ${'-'.repeat(12)} ${'-'.repeat(12)}`);

  for (const result of suite.results) {
    const opsFormatted = result.opsPerSecond.toLocaleString();
    const meanFormatted = result.meanMs.toFixed(4);
    lines.push(
      `  ${result.name.padEnd(35)} ${opsFormatted.padStart(
        12
      )} ${meanFormatted.padStart(12)}`
    );
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Compare results between two libraries
 */
export function compareResults(
  baseline: BenchmarkResult,
  comparison: BenchmarkResult
): string {
  const ratio = comparison.opsPerSecond / baseline.opsPerSecond;
  const percentage = ((ratio - 1) * 100).toFixed(1);
  const faster = ratio > 1;

  return `${comparison.name} is ${Math.abs(Number(percentage))}% ${
    faster ? 'faster' : 'slower'
  } than ${baseline.name}`;
}
