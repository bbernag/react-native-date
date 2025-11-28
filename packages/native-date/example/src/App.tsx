import { useEffect, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Benchmark from './Benchmark';
import TimezoneScreen from './TimezoneScreen';
import FormattingScreen from './FormattingScreen';
import {
  // Core
  now,
  parse,
  format,
  tryParse,
  // Configuration
  setLocale,
  // Getters
  getComponents,
  getYear,
  getMonth,
  getDate,
  // Date info
  getDaysInMonth,
  isLeapYear,
  isWeekend,
  isValid,
  // Arithmetic
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  // Boundaries
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  // Diff
  diffInDays,
  diffInMonths,
  diffInHours,
  // Comparisons
  isBefore,
  isAfter,
  isSameDay,
  // Predicates
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  // Utilities
  clamp,
  min,
  max,
  // Timezone
  getTimezone,
  getTimezoneOffset,
  formatInTimezone,
  getAvailableTimezones,
  isValidTimezone,
  toUTC,
  formatInUTC,
  // Formatting helpers
  formatDate,
  formatDateTime,
  toISOString,
  // Async batch operations
  parseManyAsync,
  formatManyAsync,
  getComponentsManyAsync,
} from '@bernagl/react-native-date';

// Initialize locale at module load time (before any component renders)
setLocale('en');

type Tab = 'demo' | 'formatting' | 'benchmark' | 'timezone';

function TabBar({
  activeTab,
  onChangeTab,
}: {
  activeTab: Tab;
  onChangeTab: (tab: Tab) => void;
}) {
  return (
    <View style={tabStyles.container}>
      <TouchableOpacity
        style={[tabStyles.tab, activeTab === 'demo' && tabStyles.activeTab]}
        onPress={() => onChangeTab('demo')}
      >
        <Text
          style={[
            tabStyles.tabText,
            activeTab === 'demo' && tabStyles.activeTabText,
          ]}
        >
          Demo
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          tabStyles.tab,
          activeTab === 'formatting' && tabStyles.activeTab,
        ]}
        onPress={() => onChangeTab('formatting')}
      >
        <Text
          style={[
            tabStyles.tabText,
            activeTab === 'formatting' && tabStyles.activeTabText,
          ]}
        >
          Format
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          tabStyles.tab,
          activeTab === 'benchmark' && tabStyles.activeTab,
        ]}
        onPress={() => onChangeTab('benchmark')}
      >
        <Text
          style={[
            tabStyles.tabText,
            activeTab === 'benchmark' && tabStyles.activeTabText,
          ]}
        >
          Bench
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[tabStyles.tab, activeTab === 'timezone' && tabStyles.activeTab]}
        onPress={() => onChangeTab('timezone')}
      >
        <Text
          style={[
            tabStyles.tabText,
            activeTab === 'timezone' && tabStyles.activeTabText,
          ]}
        >
          TZ
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

function DemoScreen() {
  const currentTime = now();

  // Async batch operations demo
  const [asyncResults, setAsyncResults] = useState<{
    parsed: number[];
    formatted: string[];
    components: Array<{ year: number; month: number; day: number }>;
  } | null>(null);

  useEffect(() => {
    const runAsyncDemo = async () => {
      const year = new Date().getFullYear();
      const dateStrings = [`${year}-01-15`, `${year}-06-20`, `${year}-12-25`];
      const parsed = await parseManyAsync(dateStrings);
      const formatted = await formatManyAsync(parsed, 'yyyy-MM-dd');
      const components = await getComponentsManyAsync(parsed);
      setAsyncResults({ parsed, formatted, components });
    };
    runAsyncDemo();
  }, []);

  // Basic operations
  const tomorrow = addDays(currentTime, 1);
  const yesterday = subDays(currentTime, 1);
  const nextWeek = addWeeks(currentTime, 1);
  const lastMonth = subMonths(currentTime, 1);
  const nextMonth = addMonths(currentTime, 1);

  // Boundaries
  const dayStart = startOfDay(currentTime);
  const dayEnd = endOfDay(currentTime);
  const weekStart = startOfWeek(currentTime);
  const weekEnd = endOfWeek(currentTime);
  const monthStart = startOfMonth(currentTime);
  const monthEnd = endOfMonth(currentTime);

  // Dynamic dates based on current year
  const currentYear = getYear(currentTime);
  const christmas = parse(`${currentYear}-12-25`);
  const nextChristmas =
    christmas > currentTime ? christmas : parse(`${currentYear + 1}-12-25`);
  const newYear = parse(`${currentYear + 1}-01-01`);

  // Diffs
  const daysUntilChristmas = diffInDays(nextChristmas, currentTime);
  const monthsUntilNewYear = diffInMonths(newYear, currentTime);
  const hoursInDay = Math.round(diffInHours(dayEnd, dayStart)) + 1; // endOf is 23:59:59.999

  // Comparisons
  const isChristmasFuture = isAfter(nextChristmas, currentTime);
  const isYesterdayPast = isBefore(yesterday, currentTime);
  const sameDay = isSameDay(currentTime, dayStart);

  // Clamp/min/max
  const timestamps = [nextChristmas, newYear, currentTime];
  const earliest = min(timestamps);
  const latest = max(timestamps);
  const clamped = clamp(currentTime, nextChristmas, newYear);

  // Timezone
  const availableTimezones = getAvailableTimezones();
  const sampleTimezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];

  // Components
  const components = getComponents(currentTime);

  // Error handling
  const validParse = tryParse('2024-06-15');
  const invalidParse = tryParse('not-a-date');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Native Date Library</Text>

      {/* Current Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Time</Text>
        <Text style={styles.value}>{formatDateTime(currentTime)}</Text>
        <Text style={styles.label}>Timestamp: {currentTime}</Text>
        <Text style={styles.label}>ISO: {toISOString(currentTime)}</Text>
        <Text style={styles.label}>
          UTC: {formatInUTC(currentTime, 'HH:mm:ss')}
        </Text>
      </View>

      {/* Device Timezone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Timezone</Text>
        <Text style={styles.value}>{getTimezone()}</Text>
        <Text style={styles.label}>Offset: {getTimezoneOffset()} minutes</Text>
        <Text style={styles.label}>UTC timestamp: {toUTC(currentTime)}</Text>
      </View>

      {/* Date Arithmetic */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date Arithmetic</Text>
        <Text style={styles.label}>Yesterday: {formatDate(yesterday)}</Text>
        <Text style={styles.label}>Tomorrow: {formatDate(tomorrow)}</Text>
        <Text style={styles.label}>Next Week: {formatDate(nextWeek)}</Text>
        <Text style={styles.label}>Last Month: {formatDate(lastMonth)}</Text>
        <Text style={styles.label}>Next Month: {formatDate(nextMonth)}</Text>
      </View>

      {/* Boundaries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Boundaries</Text>
        <Text style={styles.label}>
          Day: {format(dayStart, 'HH:mm')} → {format(dayEnd, 'HH:mm')}
        </Text>
        <Text style={styles.label}>
          Week: {formatDate(weekStart)} → {formatDate(weekEnd)}
        </Text>
        <Text style={styles.label}>
          Month: {formatDate(monthStart)} → {formatDate(monthEnd)}
        </Text>
      </View>

      {/* Diffs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date Differences</Text>
        <Text style={styles.label}>
          Days until Christmas: {Math.floor(daysUntilChristmas)}
        </Text>
        <Text style={styles.label}>
          Months until New Year: {Math.floor(monthsUntilNewYear)}
        </Text>
        <Text style={styles.label}>Hours in a day: {hoursInDay}</Text>
      </View>

      {/* Comparisons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comparisons</Text>
        <Text style={styles.label}>
          Christmas is future: {isChristmasFuture ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.label}>
          Yesterday is past: {isYesterdayPast ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.label}>
          Same day as day start: {sameDay ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Predicates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Predicates</Text>
        <Text style={styles.label}>
          isToday(now): {isToday(currentTime) ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.label}>
          isTomorrow(tomorrow): {isTomorrow(tomorrow) ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.label}>
          isYesterday(yesterday): {isYesterday(yesterday) ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.label}>
          isPast(yesterday): {isPast(yesterday) ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.label}>
          isFuture(tomorrow): {isFuture(tomorrow) ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Date Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date Info</Text>
        <Text style={styles.label}>
          Year: {getYear(currentTime)}, Month: {getMonth(currentTime)}, Day:{' '}
          {getDate(currentTime)}
        </Text>
        <Text style={styles.label}>
          Days in month: {getDaysInMonth(currentTime)}
        </Text>
        <Text style={styles.label}>
          Is weekend: {isWeekend(currentTime) ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.label}>
          Is leap year: {isLeapYear(currentTime) ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.label}>
          Is valid: {isValid(currentTime) ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Components */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date Components</Text>
        <Text style={styles.label}>
          {components.year}-{components.month}-{components.day}
        </Text>
        <Text style={styles.label}>
          {components.hour}:{components.minute}:{components.second}.
          {components.millisecond}
        </Text>
        <Text style={styles.label}>Day of week: {components.dayOfWeek}</Text>
      </View>

      {/* Clamp/Min/Max */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clamp / Min / Max</Text>
        <Text style={styles.label}>Timestamps: now, Christmas, New Year</Text>
        <Text style={styles.label}>Earliest: {formatDate(earliest)}</Text>
        <Text style={styles.label}>Latest: {formatDate(latest)}</Text>
        <Text style={styles.label}>
          Clamped (Christmas→NewYear): {formatDate(clamped)}
        </Text>
      </View>

      {/* Error Handling */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Handling (tryParse)</Text>
        <Text style={styles.label}>
          Valid "2024-06-15":{' '}
          {validParse !== null ? formatDate(validParse) : 'null'}
        </Text>
        <Text style={styles.label}>
          Invalid "not-a-date": {invalidParse !== null ? 'parsed' : 'null ✓'}
        </Text>
      </View>

      {/* Timezone Conversion */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timezone Conversion</Text>
        {sampleTimezones.map((tz) => (
          <Text key={tz} style={styles.label}>
            {tz}: {formatInTimezone(currentTime, 'HH:mm:ss', tz)}
          </Text>
        ))}
      </View>

      {/* Timezone Validation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timezone Validation</Text>
        <Text style={styles.label}>
          Asia/Tokyo: {isValidTimezone('Asia/Tokyo') ? 'Valid ✓' : 'Invalid'}
        </Text>
        <Text style={styles.label}>
          Invalid/Zone:{' '}
          {isValidTimezone('Invalid/Zone') ? 'Valid' : 'Invalid ✓'}
        </Text>
      </View>

      {/* Async Batch Operations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Async Batch Operations</Text>
        {asyncResults ? (
          <>
            <Text style={styles.label}>
              Parsed {asyncResults.parsed.length} dates on background thread
            </Text>
            <Text style={styles.label}>
              Formatted: {asyncResults.formatted.join(', ')}
            </Text>
            <Text style={styles.label}>
              Years: {asyncResults.components.map((c) => c.year).join(', ')}
            </Text>
          </>
        ) : (
          <Text style={styles.label}>Loading...</Text>
        )}
      </View>

      {/* Available Timezones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Available Timezones ({availableTimezones.length})
        </Text>
        <Text style={styles.label} numberOfLines={5}>
          {availableTimezones.slice(0, 10).join(', ')}...
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  value: {
    fontSize: 18,
    fontWeight: '500',
    color: '#007AFF',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('demo');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />
      {activeTab === 'demo' && <DemoScreen />}
      {activeTab === 'formatting' && <FormattingScreen />}
      {activeTab === 'benchmark' && <Benchmark />}
      {activeTab === 'timezone' && <TimezoneScreen />}
    </SafeAreaView>
  );
}

export default App;
