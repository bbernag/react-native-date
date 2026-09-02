# @bernagl/react-native-date

High-performance native date library for React Native, powered by C++ and [Nitro Modules](https://nitro.margelo.com/).

> **v4.0 Native Requirement:** This release requires `react-native-nitro-modules >=0.36.0 <0.37.0`. See [RELEASE_NOTES_v4.0.0.md](./RELEASE_NOTES_v4.0.0.md) for migration steps.

> **v2.0 Breaking Changes:** `parse()` and getter functions now use local time for date-only strings (previously UTC). See [RELEASE_NOTES_v2.0.0.md](./RELEASE_NOTES_v2.0.0.md) for migration guide.

## Features

- **Native Performance**: C++ implementation with JSI bindings for minimal bridge overhead
- **date-fns-like API**: Familiar functional API with 80+ functions
- **Timezone Support**: Full IANA timezone support with formatting and conversion
- **Timezone-Aware Predicates**: Check dates in specific timezones (isToday in Tokyo, etc.)
- **Async Batch Operations**: Background thread processing for heavy workloads
- **Expo Compatible**: Works with Expo Dev Client (SDK 54+)
- **Tree-shakeable**: Import only what you need
- **TypeScript First**: Full type definitions included

## Requirements

- React Native 0.76+ (New Architecture required)
- Nitro Modules 0.36.x
- iOS 13.0+
- Android SDK 24+

## Installation

```sh
npm install @bernagl/react-native-date react-native-nitro-modules@0.36.5
# or
yarn add @bernagl/react-native-date react-native-nitro-modules@0.36.5
```

### iOS

```sh
cd ios && pod install
```

### Android

No additional setup required.

### Expo

Requires Expo Dev Client (not Expo Go):

```sh
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

## Quick Start

```typescript
import {
  now,
  parse,
  format,
  addDays,
  diffInDays,
  formatDateTime,
} from '@bernagl/react-native-date';

// Get current timestamp
const timestamp = now();

// Parse ISO 8601 string
const christmas = parse('2024-12-25');

// Format with pattern
const formatted = format(timestamp, 'yyyy-MM-dd HH:mm:ss');

// Date arithmetic
const nextWeek = addDays(timestamp, 7);

// Calculate difference
const daysUntil = diffInDays(christmas, timestamp);

// Convenience formatters
console.log(formatDateTime(timestamp)); // "2024-06-15 14:30:45"
```

## Chainable API

Day.js-style chainable interface:

```typescript
import { nativeDate } from '@bernagl/react-native-date';

nativeDate()
  .addDays(7)
  .startOfMonth()
  .format('yyyy-MM-dd');

// Or import separately for optimal tree-shaking
import { nativeDate } from '@bernagl/react-native-date/chain';
```

## API Reference

### Core Functions

| Function | Description |
|----------|-------------|
| `now()` | Returns current timestamp in milliseconds |
| `parse(dateString)` | Parse ISO 8601 string to timestamp |
| `tryParse(dateString)` | Safe parse, returns null on invalid input |
| `format(timestamp, pattern)` | Format timestamp with pattern |

### Getters

| Function | Description |
|----------|-------------|
| `getComponents(timestamp)` | Get all date components at once |
| `getYear(timestamp)` | Get year |
| `getMonth(timestamp)` | Get month (1-12) |
| `getDate(timestamp)` | Get day of month |
| `getDay(timestamp)` | Get day of week (0-6, Sunday=0) |
| `getHours(timestamp)` | Get hours (0-23) |
| `getMinutes(timestamp)` | Get minutes (0-59) |
| `getSeconds(timestamp)` | Get seconds (0-59) |
| `getMilliseconds(timestamp)` | Get milliseconds (0-999) |

### Date Information

| Function | Description |
|----------|-------------|
| `getDaysInMonth(timestamp)` | Days in the month |
| `isLeapYear(timestamp)` | Check if leap year |
| `isWeekend(timestamp)` | Check if Saturday or Sunday |
| `isValid(timestamp)` | Check if valid timestamp |

### Arithmetic

| Function | Description |
|----------|-------------|
| `add(timestamp, amount, unit)` | Add time units |
| `subtract(timestamp, amount, unit)` | Subtract time units |
| `addDays(timestamp, days)` | Add days |
| `addMonths(timestamp, months)` | Add months |
| `addYears(timestamp, years)` | Add years |
| `addWeeks(timestamp, weeks)` | Add weeks |
| `addHours(timestamp, hours)` | Add hours |
| `addMinutes(timestamp, minutes)` | Add minutes |
| `addSeconds(timestamp, seconds)` | Add seconds |
| `subDays(timestamp, days)` | Subtract days |
| `subMonths(timestamp, months)` | Subtract months |
| `subYears(timestamp, years)` | Subtract years |
| `subWeeks(timestamp, weeks)` | Subtract weeks |
| `subHours(timestamp, hours)` | Subtract hours |
| `subMinutes(timestamp, minutes)` | Subtract minutes |
| `subSeconds(timestamp, seconds)` | Subtract seconds |

### Comparisons

| Function | Description |
|----------|-------------|
| `isBefore(t1, t2)` | Check if t1 is before t2 |
| `isAfter(t1, t2)` | Check if t1 is after t2 |
| `isSame(t1, t2, unit)` | Check if same at unit level |
| `isSameDay(t1, t2)` | Check if same day |
| `isSameMonth(t1, t2)` | Check if same month |
| `isSameYear(t1, t2)` | Check if same year |

### Predicates

| Function | Description |
|----------|-------------|
| `isToday(timestamp)` | Check if today |
| `isTomorrow(timestamp)` | Check if tomorrow |
| `isYesterday(timestamp)` | Check if yesterday |
| `isPast(timestamp)` | Check if in the past |
| `isFuture(timestamp)` | Check if in the future |

### Timezone-Aware Predicates

Check dates in specific timezones (useful for global apps):

| Function | Description |
|----------|-------------|
| `isTodayInTz(timestamp, tz)` | Check if today in timezone |
| `isTomorrowInTz(timestamp, tz)` | Check if tomorrow in timezone |
| `isYesterdayInTz(timestamp, tz)` | Check if yesterday in timezone |
| `isSameDayInTz(t1, t2, tz)` | Check if same day in timezone |
| `isSameMonthInTz(t1, t2, tz)` | Check if same month in timezone |
| `isSameYearInTz(t1, t2, tz)` | Check if same year in timezone |
| `startOfDayInTz(timestamp, tz)` | Start of day in timezone |
| `endOfDayInTz(timestamp, tz)` | End of day in timezone |

```typescript
import { isTodayInTz, startOfDayInTz } from '@bernagl/react-native-date';

// Check if a timestamp is "today" in Tokyo
isTodayInTz(timestamp, 'Asia/Tokyo');

// Get midnight in New York
startOfDayInTz(timestamp, 'America/New_York');
```

### Setters

Immutable setters that return new timestamps:

| Function | Description |
|----------|-------------|
| `setYear(timestamp, year)` | Set year |
| `setMonth(timestamp, month)` | Set month (1-12) |
| `setDate(timestamp, day)` | Set day of month |
| `setHours(timestamp, hours)` | Set hours |
| `setMinutes(timestamp, minutes)` | Set minutes |
| `setSeconds(timestamp, seconds)` | Set seconds |
| `setMilliseconds(timestamp, ms)` | Set milliseconds |

```typescript
import { setMonth, setDate } from '@bernagl/react-native-date';

// Set to March 15th
const newDate = setDate(setMonth(timestamp, 3), 15);
```

### Boundaries

| Function | Description |
|----------|-------------|
| `startOf(timestamp, unit)` | Start of time unit |
| `endOf(timestamp, unit)` | End of time unit |
| `startOfDay(timestamp)` | Start of day (00:00:00) |
| `endOfDay(timestamp)` | End of day (23:59:59.999) |
| `startOfWeek(timestamp)` | Start of week (Sunday) |
| `endOfWeek(timestamp)` | End of week (Saturday) |
| `startOfMonth(timestamp)` | First day of month |
| `endOfMonth(timestamp)` | Last day of month |
| `startOfYear(timestamp)` | January 1st |
| `endOfYear(timestamp)` | December 31st |

### Differences

| Function | Description |
|----------|-------------|
| `diff(t1, t2, unit)` | Difference in time units |
| `diffInDays(t1, t2)` | Difference in days |
| `diffInMonths(t1, t2)` | Difference in months |
| `diffInYears(t1, t2)` | Difference in years |
| `diffInWeeks(t1, t2)` | Difference in weeks |
| `diffInHours(t1, t2)` | Difference in hours |
| `diffInMinutes(t1, t2)` | Difference in minutes |
| `diffInSeconds(t1, t2)` | Difference in seconds |

### Utilities

| Function | Description |
|----------|-------------|
| `clamp(timestamp, min, max)` | Clamp to range |
| `min(timestamps)` | Earliest timestamp |
| `max(timestamps)` | Latest timestamp |

### Timezone

| Function | Description |
|----------|-------------|
| `getTimezone()` | Get device timezone |
| `getTimezoneOffset()` | Get timezone offset in minutes |
| `getOffsetInTimezone(timestamp, tz)` | Get offset for specific timezone at specific time |
| `getAvailableTimezones()` | List all available timezones |
| `isValidTimezone(tz)` | Check if timezone is valid |
| `toTimezone(timestamp, tz)` | Convert to timezone |
| `formatInTimezone(timestamp, pattern, tz)` | Format in timezone |
| `toUTC(timestamp)` | Convert to UTC |
| `formatInUTC(timestamp, pattern)` | Format in UTC |

### Formatting Helpers

| Function | Description |
|----------|-------------|
| `formatDate(timestamp)` | Format as "yyyy-MM-dd" |
| `formatDateTime(timestamp)` | Format as "yyyy-MM-dd HH:mm:ss" |
| `toISOString(timestamp)` | Format as ISO 8601 |
| `formatDateInTimezone(timestamp, tz)` | Date in timezone |
| `formatDateTimeInTimezone(timestamp, tz)` | DateTime in timezone |

### Async Batch Operations

For processing large datasets without blocking the UI:

```typescript
import {
  parseManyAsync,
  formatManyAsync,
  getComponentsManyAsync,
} from '@bernagl/react-native-date';

// Parse many dates on background thread
const timestamps = await parseManyAsync([
  '2024-01-15',
  '2024-06-20',
  '2024-12-25',
]);

// Format many timestamps
const formatted = await formatManyAsync(timestamps, 'yyyy-MM-dd');

// Get components for many timestamps
const components = await getComponentsManyAsync(timestamps);
```

## Format Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| `yyyy` | 4-digit year | 2024 |
| `MM` | 2-digit month | 06 |
| `dd` | 2-digit day | 15 |
| `HH` | 2-digit hour (24h) | 14 |
| `mm` | 2-digit minute | 30 |
| `ss` | 2-digit second | 45 |
| `SSS` | 3-digit millisecond | 123 |

## Time Units

Available units for `add()`, `subtract()`, `diff()`, `startOf()`, `endOf()`, `isSame()`:

- `year`
- `month`
- `week`
- `day`
- `hour`
- `minute`
- `second`
- `millisecond`

## Performance

NativeDate is optimized for performance with C++ implementation and JSI bindings.

Benchmark results (vs date-fns/dayjs):

| Operation | NativeDate | Improvement |
|-----------|------------|-------------|
| format() | 425K ops/s | ~2x faster |
| addMonths() | 3.4M ops/s | ~2.5x faster |
| diffInDays() | 5.7M ops/s | ~22x faster |

Run benchmarks:
```sh
yarn benchmark
```

## Migration from date-fns

```typescript
// date-fns
import { format, addDays, differenceInDays } from 'date-fns';
const date = new Date();
format(date, 'yyyy-MM-dd');
addDays(date, 7);
differenceInDays(date1, date2);

// NativeDate
import { format, addDays, diffInDays, now } from '@bernagl/react-native-date';
const timestamp = now();
format(timestamp, 'yyyy-MM-dd');
addDays(timestamp, 7);
diffInDays(timestamp1, timestamp2);
```

Key differences:
- NativeDate uses timestamps (numbers) instead of Date objects
- Use `now()` instead of `new Date()`
- Use `parse()` instead of `new Date(string)`
- `differenceInDays` → `diffInDays`

## Migration from dayjs

```typescript
// dayjs
import dayjs from 'dayjs';
dayjs().format('YYYY-MM-DD');
dayjs().add(7, 'day');
dayjs(date1).diff(date2, 'day');

// NativeDate
import { format, addDays, diffInDays, now } from '@bernagl/react-native-date';
format(now(), 'yyyy-MM-dd');
addDays(now(), 7);
diffInDays(timestamp1, timestamp2);
```

Key differences:
- Functional API vs method chaining
- Format patterns use lowercase (`yyyy` vs `YYYY`)
- Timestamps instead of dayjs objects

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow.

## License

MIT

---

Made with [Nitro Modules](https://nitro.margelo.com/) and [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
