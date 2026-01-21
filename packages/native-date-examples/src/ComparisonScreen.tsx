import { useState, useMemo } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

// Our library
import {
  now,
  parse,
  format,
  getYear,
  getMonth,
  getDate,
  getHours,
  getMinutes,
  getSeconds,
  addDays,
  addMonths,
  addHours,
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isToday,
  isTomorrow,
  isYesterday,
  isSameDay,
  isSameMonth,
  isPast,
  isFuture,
  isWeekend,
  isLeapYear,
  getDaysInMonth,
  diffInDays,
  diffInMonths,
  diffInHours,
  formatInTimezone,
  getTimezone,
  toISOString,
  // New Phase 1 functions
  setYear,
  setMonth,
  setDate,
  setHours,
  setMinutes,
  isTodayInTz,
  isSameDayInTz,
  startOfDayInTz,
  endOfDayInTz,
  getOffsetInTimezone,
} from '@bernagl/react-native-date';

// dayjs
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isLeapYearPlugin from 'dayjs/plugin/isLeapYear';
import isTodayPlugin from 'dayjs/plugin/isToday';
import isTomorrowPlugin from 'dayjs/plugin/isTomorrow';
import isYesterdayPlugin from 'dayjs/plugin/isYesterday';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isLeapYearPlugin);
dayjs.extend(isTodayPlugin);
dayjs.extend(isTomorrowPlugin);
dayjs.extend(isYesterdayPlugin);

// date-fns
import {
  format as dfFormat,
  getYear as dfGetYear,
  getMonth as dfGetMonth,
  getDate as dfGetDate,
  getHours as dfGetHours,
  getMinutes as dfGetMinutes,
  getSeconds as dfGetSeconds,
  addDays as dfAddDays,
  addMonths as dfAddMonths,
  addHours as dfAddHours,
  subDays as dfSubDays,
  startOfDay as dfStartOfDay,
  endOfDay as dfEndOfDay,
  startOfMonth as dfStartOfMonth,
  endOfMonth as dfEndOfMonth,
  isToday as dfIsToday,
  isTomorrow as dfIsTomorrow,
  isYesterday as dfIsYesterday,
  isSameDay as dfIsSameDay,
  isSameMonth as dfIsSameMonth,
  isPast as dfIsPast,
  isFuture as dfIsFuture,
  isWeekend as dfIsWeekend,
  isLeapYear as dfIsLeapYear,
  getDaysInMonth as dfGetDaysInMonth,
  differenceInDays as dfDiffInDays,
  differenceInMonths as dfDiffInMonths,
  differenceInHours as dfDiffInHours,
  setYear as dfSetYear,
  setMonth as dfSetMonth,
  setDate as dfSetDate,
  setHours as dfSetHours,
  setMinutes as dfSetMinutes,
} from 'date-fns';
import { TZDate } from '@date-fns/tz';

type ComparisonRow = {
  name: string;
  native: string;
  dayjs: string;
  dateFns: string;
  match?: boolean;
};

type ComparisonSection = {
  title: string;
  rows: ComparisonRow[];
};

function ComparisonScreen() {
  const [currentTs, setCurrentTs] = useState(() => now());

  const comparisons = useMemo(() => {
    // Use current timestamp for all comparisons
    const currentDate = new Date(currentTs);
    const currentDayjs = dayjs(currentTs);

    const tomorrow = addDays(currentTs, 1);
    const yesterday = subDays(currentTs, 1);

    const tz = 'America/New_York';

    const sections: ComparisonSection[] = [
      {
        title: 'Parsing & Formatting',
        rows: [
          {
            name: 'now()',
            native: String(currentTs),
            dayjs: String(currentDayjs.valueOf()),
            dateFns: String(currentDate.getTime()),
          },
          {
            name: 'format(yyyy-MM-dd)',
            native: format(currentTs, 'yyyy-MM-dd'),
            dayjs: currentDayjs.format('YYYY-MM-DD'),
            dateFns: dfFormat(currentDate, 'yyyy-MM-dd'),
          },
          {
            name: 'format(HH:mm:ss)',
            native: format(currentTs, 'HH:mm:ss'),
            dayjs: currentDayjs.format('HH:mm:ss'),
            dateFns: dfFormat(currentDate, 'HH:mm:ss'),
          },
          {
            name: 'toISOString()',
            native: toISOString(currentTs),
            dayjs: currentDayjs.toISOString(),
            dateFns: currentDate.toISOString(),
          },
        ],
      },
      {
        title: 'Component Getters',
        rows: [
          {
            name: 'getYear()',
            native: String(getYear(currentTs)),
            dayjs: String(currentDayjs.year()),
            dateFns: String(dfGetYear(currentDate)),
          },
          {
            name: 'getMonth()',
            native: String(getMonth(currentTs)),
            dayjs: String(currentDayjs.month() + 1),
            dateFns: String(dfGetMonth(currentDate) + 1),
          },
          {
            name: 'getDate()',
            native: String(getDate(currentTs)),
            dayjs: String(currentDayjs.date()),
            dateFns: String(dfGetDate(currentDate)),
          },
          {
            name: 'getHours()',
            native: String(getHours(currentTs)),
            dayjs: String(currentDayjs.hour()),
            dateFns: String(dfGetHours(currentDate)),
          },
          {
            name: 'getMinutes()',
            native: String(getMinutes(currentTs)),
            dayjs: String(currentDayjs.minute()),
            dateFns: String(dfGetMinutes(currentDate)),
          },
          {
            name: 'getSeconds()',
            native: String(getSeconds(currentTs)),
            dayjs: String(currentDayjs.second()),
            dateFns: String(dfGetSeconds(currentDate)),
          },
        ],
      },
      {
        title: 'Date Arithmetic',
        rows: [
          {
            name: 'addDays(1)',
            native: format(addDays(currentTs, 1), 'yyyy-MM-dd'),
            dayjs: currentDayjs.add(1, 'day').format('YYYY-MM-DD'),
            dateFns: dfFormat(dfAddDays(currentDate, 1), 'yyyy-MM-dd'),
          },
          {
            name: 'addMonths(1)',
            native: format(addMonths(currentTs, 1), 'yyyy-MM-dd'),
            dayjs: currentDayjs.add(1, 'month').format('YYYY-MM-DD'),
            dateFns: dfFormat(dfAddMonths(currentDate, 1), 'yyyy-MM-dd'),
          },
          {
            name: 'addHours(5)',
            native: format(addHours(currentTs, 5), 'HH:mm'),
            dayjs: currentDayjs.add(5, 'hour').format('HH:mm'),
            dateFns: dfFormat(dfAddHours(currentDate, 5), 'HH:mm'),
          },
          {
            name: 'subDays(7)',
            native: format(subDays(currentTs, 7), 'yyyy-MM-dd'),
            dayjs: currentDayjs.subtract(7, 'day').format('YYYY-MM-DD'),
            dateFns: dfFormat(dfSubDays(currentDate, 7), 'yyyy-MM-dd'),
          },
        ],
      },
      {
        title: 'Boundaries',
        rows: [
          {
            name: 'startOfDay()',
            native: format(startOfDay(currentTs), 'HH:mm:ss'),
            dayjs: currentDayjs.startOf('day').format('HH:mm:ss'),
            dateFns: dfFormat(dfStartOfDay(currentDate), 'HH:mm:ss'),
          },
          {
            name: 'endOfDay()',
            native: format(endOfDay(currentTs), 'HH:mm:ss'),
            dayjs: currentDayjs.endOf('day').format('HH:mm:ss'),
            dateFns: dfFormat(dfEndOfDay(currentDate), 'HH:mm:ss'),
          },
          {
            name: 'startOfMonth()',
            native: format(startOfMonth(currentTs), 'yyyy-MM-dd'),
            dayjs: currentDayjs.startOf('month').format('YYYY-MM-DD'),
            dateFns: dfFormat(dfStartOfMonth(currentDate), 'yyyy-MM-dd'),
          },
          {
            name: 'endOfMonth()',
            native: format(endOfMonth(currentTs), 'yyyy-MM-dd'),
            dayjs: currentDayjs.endOf('month').format('YYYY-MM-DD'),
            dateFns: dfFormat(dfEndOfMonth(currentDate), 'yyyy-MM-dd'),
          },
        ],
      },
      {
        title: 'Predicates (now)',
        rows: [
          {
            name: 'isToday(now)',
            native: String(isToday(currentTs)),
            dayjs: String(currentDayjs.isToday()),
            dateFns: String(dfIsToday(currentDate)),
          },
          {
            name: 'isTomorrow(+1d)',
            native: String(isTomorrow(tomorrow)),
            dayjs: String(dayjs(tomorrow).isTomorrow()),
            dateFns: String(dfIsTomorrow(new Date(tomorrow))),
          },
          {
            name: 'isYesterday(-1d)',
            native: String(isYesterday(yesterday)),
            dayjs: String(dayjs(yesterday).isYesterday()),
            dateFns: String(dfIsYesterday(new Date(yesterday))),
          },
          {
            name: 'isPast(-1d)',
            native: String(isPast(yesterday)),
            dayjs: String(dayjs(yesterday).isBefore(dayjs())),
            dateFns: String(dfIsPast(new Date(yesterday))),
          },
          {
            name: 'isFuture(+1d)',
            native: String(isFuture(tomorrow)),
            dayjs: String(dayjs(tomorrow).isAfter(dayjs())),
            dateFns: String(dfIsFuture(new Date(tomorrow))),
          },
        ],
      },
      {
        title: 'Comparisons',
        rows: [
          {
            name: 'isSameDay(now, now)',
            native: String(isSameDay(currentTs, currentTs)),
            dayjs: String(currentDayjs.isSame(currentDayjs, 'day')),
            dateFns: String(dfIsSameDay(currentDate, currentDate)),
          },
          {
            name: 'isSameMonth(now, +1m)',
            native: String(isSameMonth(currentTs, addMonths(currentTs, 1))),
            dayjs: String(currentDayjs.isSame(currentDayjs.add(1, 'month'), 'month')),
            dateFns: String(dfIsSameMonth(currentDate, dfAddMonths(currentDate, 1))),
          },
          {
            name: 'isWeekend(Sat)',
            native: String(isWeekend(parse('2024-06-15'))), // Saturday
            dayjs: String(dayjs('2024-06-15').day() === 0 || dayjs('2024-06-15').day() === 6),
            dateFns: String(dfIsWeekend(new Date('2024-06-15'))),
          },
          {
            name: 'isLeapYear(2024)',
            native: String(isLeapYear(parse('2024-01-01'))),
            dayjs: String(dayjs('2024-01-01').isLeapYear()),
            dateFns: String(dfIsLeapYear(new Date('2024-01-01'))),
          },
        ],
      },
      {
        title: 'Date Info',
        rows: [
          {
            name: 'getDaysInMonth(Feb 2024)',
            native: String(getDaysInMonth(parse('2024-02-15'))),
            dayjs: String(dayjs('2024-02-15').daysInMonth()),
            dateFns: String(dfGetDaysInMonth(new Date('2024-02-15'))),
          },
          {
            name: 'getDaysInMonth(Feb 2023)',
            native: String(getDaysInMonth(parse('2023-02-15'))),
            dayjs: String(dayjs('2023-02-15').daysInMonth()),
            dateFns: String(dfGetDaysInMonth(new Date('2023-02-15'))),
          },
        ],
      },
      {
        title: 'Differences',
        rows: [
          {
            name: 'diffInDays(now, -7d)',
            native: String(diffInDays(currentTs, subDays(currentTs, 7))),
            dayjs: String(currentDayjs.diff(currentDayjs.subtract(7, 'day'), 'day')),
            dateFns: String(dfDiffInDays(currentDate, dfSubDays(currentDate, 7))),
          },
          {
            name: 'diffInMonths(now, -3m)',
            native: String(diffInMonths(currentTs, addMonths(currentTs, -3))),
            dayjs: String(currentDayjs.diff(currentDayjs.subtract(3, 'month'), 'month')),
            dateFns: String(dfDiffInMonths(currentDate, dfAddMonths(currentDate, -3))),
          },
          {
            name: 'diffInHours(now, -24h)',
            native: String(diffInHours(currentTs, addHours(currentTs, -24))),
            dayjs: String(currentDayjs.diff(currentDayjs.subtract(24, 'hour'), 'hour')),
            dateFns: String(dfDiffInHours(currentDate, dfAddHours(currentDate, -24))),
          },
        ],
      },
      {
        title: 'Setters (NEW)',
        rows: [
          {
            name: 'setYear(2025)',
            native: format(setYear(currentTs, 2025), 'yyyy-MM-dd'),
            dayjs: currentDayjs.year(2025).format('YYYY-MM-DD'),
            dateFns: dfFormat(dfSetYear(currentDate, 2025), 'yyyy-MM-dd'),
          },
          {
            name: 'setMonth(12)',
            native: format(setMonth(currentTs, 12), 'yyyy-MM-dd'),
            dayjs: currentDayjs.month(11).format('YYYY-MM-DD'), // 0-indexed
            dateFns: dfFormat(dfSetMonth(currentDate, 11), 'yyyy-MM-dd'), // 0-indexed
          },
          {
            name: 'setDate(1)',
            native: format(setDate(currentTs, 1), 'yyyy-MM-dd'),
            dayjs: currentDayjs.date(1).format('YYYY-MM-DD'),
            dateFns: dfFormat(dfSetDate(currentDate, 1), 'yyyy-MM-dd'),
          },
          {
            name: 'setHours(9)',
            native: format(setHours(currentTs, 9), 'HH:mm'),
            dayjs: currentDayjs.hour(9).format('HH:mm'),
            dateFns: dfFormat(dfSetHours(currentDate, 9), 'HH:mm'),
          },
          {
            name: 'setMinutes(0)',
            native: format(setMinutes(currentTs, 0), 'HH:mm'),
            dayjs: currentDayjs.minute(0).format('HH:mm'),
            dateFns: dfFormat(dfSetMinutes(currentDate, 0), 'HH:mm'),
          },
        ],
      },
      {
        title: 'Timezone Functions',
        rows: [
          {
            name: 'getTimezone()',
            native: getTimezone(),
            dayjs: dayjs.tz.guess(),
            dateFns: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          {
            name: `formatInTz(${tz})`,
            native: formatInTimezone(currentTs, 'HH:mm', tz),
            dayjs: currentDayjs.tz(tz).format('HH:mm'),
            dateFns: dfFormat(new TZDate(currentDate, tz), 'HH:mm'),
          },
          {
            name: 'getOffsetInTz(NY)',
            native: String(getOffsetInTimezone(currentTs, tz)) + ' min',
            dayjs: String(currentDayjs.tz(tz).utcOffset()) + ' min',
            dateFns: String(new TZDate(currentDate, tz).getTimezoneOffset() * -1) + ' min',
          },
        ],
      },
      {
        title: 'TZ-Aware Predicates (NEW)',
        rows: [
          {
            name: 'isTodayInTz(UTC)',
            native: String(isTodayInTz(currentTs, 'UTC')),
            dayjs: 'N/A (plugin issue)',
            dateFns: String(dfIsToday(new TZDate(currentDate, 'UTC'))),
          },
          {
            name: 'isSameDayInTz(UTC)',
            native: String(isSameDayInTz(currentTs, currentTs, 'UTC')),
            dayjs: 'N/A',
            dateFns: String(dfIsSameDay(new TZDate(currentDate, 'UTC'), new TZDate(currentDate, 'UTC'))),
          },
          {
            name: 'startOfDayInTz(NY)',
            native: formatInTimezone(startOfDayInTz(currentTs, tz), 'HH:mm', tz),
            dayjs: currentDayjs.tz(tz).startOf('day').format('HH:mm'),
            dateFns: dfFormat(dfStartOfDay(new TZDate(currentDate, tz)), 'HH:mm'),
          },
          {
            name: 'endOfDayInTz(NY)',
            native: formatInTimezone(endOfDayInTz(currentTs, tz), 'HH:mm:ss', tz),
            dayjs: currentDayjs.tz(tz).endOf('day').format('HH:mm:ss'),
            dateFns: dfFormat(dfEndOfDay(new TZDate(currentDate, tz)), 'HH:mm:ss'),
          },
        ],
      },
    ];

    // Calculate matches
    for (const section of sections) {
      for (const row of section.rows) {
        row.match = row.native === row.dayjs && row.dayjs === row.dateFns;
      }
    }

    return sections;
  }, [currentTs]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Library Comparison</Text>
      <Text style={styles.subtitle}>
        react-native-date vs dayjs vs date-fns
      </Text>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => setCurrentTs(now())}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
      <Text style={styles.currentDateLabel}>
        Using: {format(currentTs, 'yyyy-MM-dd HH:mm:ss')}
      </Text>

      {comparisons.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.funcCell]}>Function</Text>
            <Text style={[styles.headerCell, styles.valueCell]}>Native</Text>
            <Text style={[styles.headerCell, styles.valueCell]}>dayjs</Text>
            <Text style={[styles.headerCell, styles.valueCell]}>date-fns</Text>
          </View>

          {/* Rows */}
          {section.rows.map((row, idx) => (
            <View
              key={row.name}
              style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
            >
              <Text style={[styles.cell, styles.funcCell]} numberOfLines={1}>
                {row.name}
              </Text>
              <Text
                style={[styles.cell, styles.valueCell, styles.nativeValue]}
                numberOfLines={1}
              >
                {row.native}
              </Text>
              <Text style={[styles.cell, styles.valueCell]} numberOfLines={1}>
                {row.dayjs}
              </Text>
              <Text style={[styles.cell, styles.valueCell]} numberOfLines={1}>
                {row.dateFns}
              </Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Notes:</Text>
        <Text style={styles.legendText}>
          - Our library uses 1-indexed months (1-12)
        </Text>
        <Text style={styles.legendText}>
          - dayjs/date-fns use 0-indexed months (0-11)
        </Text>
        <Text style={styles.legendText}>
          - TZ-aware predicates are unique to our library
        </Text>
        <Text style={styles.legendText}>
          - Results shown are at time of render
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  currentDateLabel: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
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
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 6,
    marginBottom: 4,
  },
  headerCell: {
    fontWeight: '600',
    fontSize: 11,
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  cell: {
    fontSize: 10,
    color: '#333',
  },
  funcCell: {
    flex: 1.2,
    paddingRight: 4,
  },
  valueCell: {
    flex: 1,
    paddingHorizontal: 2,
  },
  nativeValue: {
    color: '#007AFF',
    fontWeight: '500',
  },
  legend: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  legendTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#856404',
  },
  legendText: {
    fontSize: 12,
    color: '#856404',
    marginTop: 2,
  },
});

export default ComparisonScreen;
