import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {
  now,
  parse,
  format,
  getYear,
  getMonth,
  getDate,
  addDays,
  startOfMonth,
  endOfMonth,
  isToday,
  formatDistance,
  getTimezone,
} from '@bernagl/react-native-date';

type TestResult = {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
};

export default function App() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = () => {
    setLoading(true);
    const testResults: TestResult[] = [];

    // Test: now()
    try {
      const timestamp = now();
      const isValid = typeof timestamp === 'number' && timestamp > 0;
      testResults.push({
        name: 'now() returns valid timestamp',
        passed: isValid,
        expected: 'number > 0',
        actual: String(timestamp),
      });
    } catch (e) {
      testResults.push({
        name: 'now() returns valid timestamp',
        passed: false,
        expected: 'number > 0',
        actual: `Error: ${e}`,
      });
    }

    // Test: parse()
    try {
      const ts = parse('2024-06-15');
      const year = getYear(ts);
      testResults.push({
        name: 'parse() + getYear()',
        passed: year === 2024,
        expected: '2024',
        actual: String(year),
      });
    } catch (e) {
      testResults.push({
        name: 'parse() + getYear()',
        passed: false,
        expected: '2024',
        actual: `Error: ${e}`,
      });
    }

    // Test: format()
    try {
      const ts = parse('2024-06-15');
      const formatted = format(ts, 'yyyy-MM-dd');
      testResults.push({
        name: 'format() yyyy-MM-dd',
        passed: formatted === '2024-06-15',
        expected: '2024-06-15',
        actual: formatted,
      });
    } catch (e) {
      testResults.push({
        name: 'format() yyyy-MM-dd',
        passed: false,
        expected: '2024-06-15',
        actual: `Error: ${e}`,
      });
    }

    // Test: getMonth()
    try {
      const ts = parse('2024-06-15');
      const month = getMonth(ts);
      testResults.push({
        name: 'getMonth() returns 6 (June)',
        passed: month === 6,
        expected: '6',
        actual: String(month),
      });
    } catch (e) {
      testResults.push({
        name: 'getMonth() returns 6 (June)',
        passed: false,
        expected: '6',
        actual: `Error: ${e}`,
      });
    }

    // Test: getDate()
    try {
      const ts = parse('2024-06-15');
      const day = getDate(ts);
      testResults.push({
        name: 'getDate() returns 15',
        passed: day === 15,
        expected: '15',
        actual: String(day),
      });
    } catch (e) {
      testResults.push({
        name: 'getDate() returns 15',
        passed: false,
        expected: '15',
        actual: `Error: ${e}`,
      });
    }

    // Test: addDays()
    try {
      const ts = parse('2024-06-15');
      const newTs = addDays(ts, 5);
      const day = getDate(newTs);
      testResults.push({
        name: 'addDays(5) → day 20',
        passed: day === 20,
        expected: '20',
        actual: String(day),
      });
    } catch (e) {
      testResults.push({
        name: 'addDays(5) → day 20',
        passed: false,
        expected: '20',
        actual: `Error: ${e}`,
      });
    }

    // Test: startOfMonth()
    try {
      const ts = parse('2024-06-15');
      const start = startOfMonth(ts);
      const day = getDate(start);
      testResults.push({
        name: 'startOfMonth() → day 1',
        passed: day === 1,
        expected: '1',
        actual: String(day),
      });
    } catch (e) {
      testResults.push({
        name: 'startOfMonth() → day 1',
        passed: false,
        expected: '1',
        actual: `Error: ${e}`,
      });
    }

    // Test: endOfMonth()
    try {
      const ts = parse('2024-06-15');
      const end = endOfMonth(ts);
      const day = getDate(end);
      testResults.push({
        name: 'endOfMonth() June → day 30',
        passed: day === 30,
        expected: '30',
        actual: String(day),
      });
    } catch (e) {
      testResults.push({
        name: 'endOfMonth() June → day 30',
        passed: false,
        expected: '30',
        actual: `Error: ${e}`,
      });
    }

    // Test: isToday()
    try {
      const todayTs = now();
      const result = isToday(todayTs);
      testResults.push({
        name: 'isToday(now()) = true',
        passed: result === true,
        expected: 'true',
        actual: String(result),
      });
    } catch (e) {
      testResults.push({
        name: 'isToday(now()) = true',
        passed: false,
        expected: 'true',
        actual: `Error: ${e}`,
      });
    }

    // Test: formatDistance()
    try {
      const past = parse('2024-01-01');
      const future = parse('2024-01-10');
      const distance = formatDistance(past, future, true);
      const hasText = typeof distance === 'string' && distance.length > 0;
      testResults.push({
        name: 'formatDistance() returns string',
        passed: hasText,
        expected: 'non-empty string',
        actual: distance,
      });
    } catch (e) {
      testResults.push({
        name: 'formatDistance() returns string',
        passed: false,
        expected: 'non-empty string',
        actual: `Error: ${e}`,
      });
    }

    // Test: getTimezone()
    try {
      const tz = getTimezone();
      const isValid = typeof tz === 'string' && tz.length > 0;
      testResults.push({
        name: 'getTimezone() returns string',
        passed: isValid,
        expected: 'non-empty string',
        actual: tz,
      });
    } catch (e) {
      testResults.push({
        name: 'getTimezone() returns string',
        passed: false,
        expected: 'non-empty string',
        actual: `Error: ${e}`,
      });
    }

    setResults(testResults);
    setLoading(false);
  };

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Expo + react-native-date</Text>
      <Text style={styles.subtitle}>Testing Nitro Modules compatibility</Text>

      <TouchableOpacity style={styles.button} onPress={runTests}>
        <Text style={styles.buttonText}>
          {loading ? 'Running...' : 'Run Tests'}
        </Text>
      </TouchableOpacity>

      {results.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            ✅ {passedCount} passed | ❌ {failedCount} failed
          </Text>
        </View>
      )}

      <ScrollView style={styles.results}>
        {results.map((result, index) => (
          <View
            key={index}
            style={[
              styles.resultItem,
              result.passed ? styles.passed : styles.failed,
            ]}
          >
            <Text style={styles.resultName}>
              {result.passed ? '✅' : '❌'} {result.name}
            </Text>
            {!result.passed && (
              <Text style={styles.resultDetails}>
                Expected: {result.expected} | Actual: {result.actual}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summary: {
    padding: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  passed: {
    backgroundColor: '#d4edda',
  },
  failed: {
    backgroundColor: '#f8d7da',
  },
  resultName: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
