# API Reference

All functions accept flexible date inputs and return timestamps (milliseconds since Unix Epoch).

```typescript
type DateInput = number | string | Date;
```

::: warning v4.0 Native Requirement
v4.0 requires `react-native-nitro-modules >=0.36.0 <0.37.0`. Reinstall pods and rebuild native apps after upgrading.

See [Release Notes](https://github.com/bbernag/react-native-date/blob/main/packages/native-date/RELEASE_NOTES_v4.0.0.md) for migration steps.
:::

::: warning v2.0 Breaking Changes
- `parse()` now uses **local time** for date-only strings (was UTC)
- Getter functions now return **local time** components (was UTC)

See [Release Notes](https://github.com/bbernag/react-native-date/blob/main/packages/native-date/RELEASE_NOTES_v2.0.0.md) for migration guide.
:::

## Parsing

| Function | Description |
|----------|-------------|
| `now()` | Current timestamp |
| `parse(string)` | Parse ISO 8601 string |
| `tryParse(string)` | Safe parse, returns `null` on failure |
| `parseFormat(string, pattern)` | Parse with custom format |
| `tryParseFormat(string, pattern)` | Safe parse with format |
| `fromComponents(obj)` | Create from `{ year, month, day, ... }` |

```typescript
now();                                    // 1732982400000
parse('2025-11-30T12:00:00Z');           // 1732968000000
tryParse('invalid');                      // null
parseFormat('12/25/2025', 'MM/dd/yyyy'); // 1735084800000
fromComponents({ year: 2025, month: 12, day: 25 });
```

### Parse Format Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `yyyy` | 4-digit year | 2025 |
| `yy` | 2-digit year | 25 |
| `MM` | 2-digit month | 01-12 |
| `M` | Month | 1-12 |
| `dd` | 2-digit day | 01-31 |
| `d` | Day | 1-31 |
| `HH` | 24h hour | 00-23 |
| `hh` | 12h hour | 01-12 |
| `mm` | Minute | 00-59 |
| `ss` | Second | 00-59 |
| `SSS` | Millisecond | 000-999 |
| `A` | AM/PM | AM, PM |

---

## Formatting

| Function | Description |
|----------|-------------|
| `format(date, pattern)` | Format with pattern |
| `formatUTC(date, pattern)` | Format in UTC |
| `formatInTimezone(date, pattern, tz)` | Format in timezone |
| `toISOString(date)` | ISO 8601 string |
| `formatDate(date)` | `yyyy-MM-dd` |
| `formatDateTime(date)` | `yyyy-MM-dd HH:mm:ss` |

```typescript
format(date, 'yyyy-MM-dd');              // "2025-11-30"
format(date, 'MMMM d, yyyy');            // "November 30, 2025"
format(date, 'EEEE');                    // "Sunday"
formatUTC(date, 'HH:mm:ss');             // "20:00:00"
formatInTimezone(date, 'HH:mm', 'Asia/Tokyo');
toISOString(date);                       // "2025-11-30T12:00:00.000Z"
```

### Format Tokens

| Token | Output | Description |
|-------|--------|-------------|
| `yyyy` | 2025 | 4-digit year |
| `yy` | 25 | 2-digit year |
| `MMMM` | November | Full month (localized) |
| `MMM` | Nov | Short month (localized) |
| `MM` | 11 | 2-digit month |
| `M` | N | Single letter |
| `dd` | 30 | 2-digit day |
| `d` | 30 | Day |
| `EEEE` | Sunday | Full day (localized) |
| `EEE` | Sun | Short day (localized) |
| `EE` | Su | 2-char day |
| `E` | S | 1-char day |
| `HH` | 14 | 24h hour (2-digit) |
| `H` | 14 | 24h hour |
| `hh` | 02 | 12h hour (2-digit) |
| `h` | 2 | 12h hour |
| `mm` | 30 | Minute |
| `ss` | 45 | Second |
| `SSS` | 123 | Millisecond |
| `A` | PM | AM/PM |
| `aa` | pm | am/pm |

**Escape text:** `'literal'` or `[literal]`

```typescript
format(date, "'Today:' EEEE"); // "Today: Sunday"
```

---

## Getters

| Function | Returns |
|----------|---------|
| `getYear(date)` | Year (e.g., 2025) |
| `getMonth(date)` | Month 1-12 |
| `getDate(date)` | Day of month 1-31 |
| `getDay(date)` | Day of week 0-6 (Sun-Sat) |
| `getHours(date)` | Hours 0-23 |
| `getMinutes(date)` | Minutes 0-59 |
| `getSeconds(date)` | Seconds 0-59 |
| `getMilliseconds(date)` | Milliseconds 0-999 |
| `getDaysInMonth(date)` | Days in month (28-31) |
| `getComponents(date)` | All components object |

```typescript
getYear(date);       // 2025
getMonth(date);      // 11
getDaysInMonth(date); // 30
getComponents(date); // { year: 2025, month: 11, day: 30, ... }
```

---

## Setters

Immutable setters that return new timestamps:

| Function | Description |
|----------|-------------|
| `setYear(date, year)` | Set year |
| `setMonth(date, month)` | Set month (1-12) |
| `setDate(date, day)` | Set day of month |
| `setHours(date, hours)` | Set hours |
| `setMinutes(date, minutes)` | Set minutes |
| `setSeconds(date, seconds)` | Set seconds |
| `setMilliseconds(date, ms)` | Set milliseconds |

```typescript
setYear(date, 2026);           // New timestamp with year 2026
setMonth(date, 3);             // New timestamp with March
setDate(setMonth(date, 3), 15); // March 15th
```

::: tip
Setters handle edge cases automatically. Setting month to February when day is 31 will clamp to 28/29.
:::

---

## Arithmetic

| Function | Description |
|----------|-------------|
| `add(date, n, unit)` | Add time |
| `subtract(date, n, unit)` | Subtract time |
| `addDays(date, n)` | Add days |
| `addWeeks(date, n)` | Add weeks |
| `addMonths(date, n)` | Add months |
| `addYears(date, n)` | Add years |
| `addHours(date, n)` | Add hours |
| `addMinutes(date, n)` | Add minutes |
| `addSeconds(date, n)` | Add seconds |
| `subDays(date, n)` | Subtract days |
| `subWeeks(date, n)` | Subtract weeks |
| `subMonths(date, n)` | Subtract months |
| `subYears(date, n)` | Subtract years |
| `subHours(date, n)` | Subtract hours |
| `subMinutes(date, n)` | Subtract minutes |
| `subSeconds(date, n)` | Subtract seconds |

**Units:** `'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'`

```typescript
addDays(date, 7);
addMonths(date, 3);
add(date, 2, 'week');
subtract(date, 1, 'year');
```

---

## Comparisons

| Function | Description |
|----------|-------------|
| `isBefore(date1, date2)` | date1 < date2 |
| `isAfter(date1, date2)` | date1 > date2 |
| `isSame(date1, date2, unit)` | Same unit? |
| `isSameDay(date1, date2)` | Same day? |
| `isSameMonth(date1, date2)` | Same month? |
| `isSameYear(date1, date2)` | Same year? |

```typescript
isBefore(date1, date2);       // true/false
isSame(date1, date2, 'month'); // true/false
isSameDay(date1, date2);       // true/false
```

---

## Predicates

| Function | Description |
|----------|-------------|
| `isValid(date)` | Valid timestamp? |
| `isToday(date)` | Today? |
| `isTomorrow(date)` | Tomorrow? |
| `isYesterday(date)` | Yesterday? |
| `isPast(date)` | In the past? |
| `isFuture(date)` | In the future? |
| `isWeekend(date)` | Saturday or Sunday? |
| `isLeapYear(date)` | Leap year? |

```typescript
isToday(date);    // true
isWeekend(date);  // false
isLeapYear(date); // false
```

---

## Timezone-Aware Predicates

Check dates in specific timezones. Essential for global apps where "today" depends on location.

| Function | Description |
|----------|-------------|
| `isTodayInTz(date, tz)` | Today in timezone? |
| `isTomorrowInTz(date, tz)` | Tomorrow in timezone? |
| `isYesterdayInTz(date, tz)` | Yesterday in timezone? |
| `isSameDayInTz(date1, date2, tz)` | Same day in timezone? |
| `isSameMonthInTz(date1, date2, tz)` | Same month in timezone? |
| `isSameYearInTz(date1, date2, tz)` | Same year in timezone? |
| `startOfDayInTz(date, tz)` | Midnight in timezone |
| `endOfDayInTz(date, tz)` | 23:59:59.999 in timezone |

```typescript
// Check if timestamp is "today" in Tokyo
isTodayInTz(date, 'Asia/Tokyo');

// Get midnight in New York (returns UTC timestamp)
startOfDayInTz(date, 'America/New_York');

// Compare two dates in London timezone
isSameDayInTz(date1, date2, 'Europe/London');
```

::: tip Use Case
A global restaurant app needs to check if an order was placed "today" in the restaurant's local timezone, not the user's device timezone.
:::

---

## Boundaries

| Function | Description |
|----------|-------------|
| `startOf(date, unit)` | Start of unit |
| `endOf(date, unit)` | End of unit |
| `startOfDay(date)` | 00:00:00.000 |
| `endOfDay(date)` | 23:59:59.999 |
| `startOfWeek(date)` | Start of week |
| `endOfWeek(date)` | End of week |
| `startOfMonth(date)` | First of month |
| `endOfMonth(date)` | Last of month |
| `startOfYear(date)` | Jan 1 |
| `endOfYear(date)` | Dec 31 |

```typescript
startOfDay(date);        // 2025-11-30 00:00:00.000
endOfMonth(date);        // 2025-11-30 23:59:59.999
startOf(date, 'year');   // 2025-01-01 00:00:00.000
```

---

## Differences

| Function | Description |
|----------|-------------|
| `diff(date1, date2, unit)` | Difference in unit |
| `diffInDays(date1, date2)` | Difference in days |
| `diffInWeeks(date1, date2)` | Difference in weeks |
| `diffInMonths(date1, date2)` | Difference in months |
| `diffInYears(date1, date2)` | Difference in years |
| `diffInHours(date1, date2)` | Difference in hours |
| `diffInMinutes(date1, date2)` | Difference in minutes |
| `diffInSeconds(date1, date2)` | Difference in seconds |

```typescript
diffInDays(date1, date2);   // 30
diff(date1, date2, 'week'); // 4
```

---

## Relative Time

| Function | Description |
|----------|-------------|
| `formatDistance(date, base?, suffix?)` | Human-readable distance |
| `formatDuration(ms)` | Duration string |

```typescript
formatDistance(pastDate, now(), true);  // "2 hours ago"
formatDistance(futureDate, now(), true); // "in 3 days"
formatDuration(3600000);                 // "1h 0m 0s"
```

---

## Timezone

| Function | Description |
|----------|-------------|
| `getTimezone()` | Device timezone ID |
| `getTimezoneOffset()` | Offset in minutes |
| `getTimezoneOffsetForTimestamp(date)` | Offset at date |
| `getOffsetInTimezone(date, tz)` | Offset for timezone at date |
| `toTimezone(date, tz)` | Convert to timezone |
| `toUTC(date)` | Convert to UTC |
| `getAvailableTimezones()` | All timezone IDs |
| `isValidTimezone(tz)` | Valid timezone? |

```typescript
getTimezone();                    // "America/New_York"
toTimezone(date, 'Asia/Tokyo');
getAvailableTimezones();          // ["Africa/Abidjan", ...]
isValidTimezone('Europe/London'); // true
```

---

## Locale

Uses native APIs for localization:
- **iOS:** [`NSLocale`](https://developer.apple.com/documentation/foundation/nslocale), [`NSDateFormatter`](https://developer.apple.com/documentation/foundation/nsdateformatter)
- **Android:** [`java.util.Locale`](https://developer.android.com/reference/java/util/Locale), [`DateFormatSymbols`](https://developer.android.com/reference/java/text/DateFormatSymbols)

| Function | Description |
|----------|-------------|
| `getLocale()` | Current locale code |
| `setLocale(code)` | Set locale |
| `getAvailableLocales()` | Available locales object |
| `getLocaleDisplayName(code)` | Display name in English |
| `getLocaleInfo(code)` | Full locale info |
| `getAvailableLocalesInfo()` | All locales with info |

```typescript
getLocale();              // "en"
setLocale('es');          // true
getLocaleDisplayName('ja'); // "Japanese"
getLocaleInfo('pt_BR');
// { code: 'pt_BR', languageCode: 'pt', displayName: 'Portuguese (Brazil)', ... }
```

::: tip
If `setLocale()` is never called, the device's default locale is used.
:::

---

## Utilities

| Function | Description |
|----------|-------------|
| `clamp(date, min, max)` | Clamp to range |
| `min(dates[])` | Earliest date |
| `max(dates[])` | Latest date |

```typescript
clamp(date, minDate, maxDate);
min([date1, date2, date3]);
max([date1, date2, date3]);
```

---

## Async Batch

Process large arrays without blocking UI.

| Function | Description |
|----------|-------------|
| `parseManyAsync(strings[])` | Parse array of strings |
| `formatManyAsync(dates[], pattern)` | Format array of dates |
| `getComponentsManyAsync(dates[])` | Get components array |

```typescript
const timestamps = await parseManyAsync(['2025-01-01', '2025-02-15']);
const formatted = await formatManyAsync(timestamps, 'MMMM d');
```

---

## Chainable API

Immutable, fluent interface similar to [Day.js](https://day.js.org/).

```typescript
// Standard import (also re-exports chainable API)
import { nativeDate } from '@bernagl/react-native-date';

// Optimized import (better tree-shaking if only using chainable API)
import { nativeDate } from '@bernagl/react-native-date/chain';

nativeDate()
  .addDays(7)
  .startOfMonth()
  .format('yyyy-MM-dd');

// Properties
nativeDate().year;        // 2025
nativeDate().month;       // 11
nativeDate().date;        // 30
nativeDate().timestamp;   // milliseconds

// Methods (return new instance)
.add(n, unit)
.subtract(n, unit)
.addDays(n) / .subDays(n)
.addMonths(n) / .subMonths(n)
.startOf(unit) / .endOf(unit)
.setYear(n) / .setMonth(n) / .setDate(n)
.clone()

// Terminal methods (return values)
.format(pattern)
.toISOString()
.valueOf()
.toDate()
.isBefore(date)
.isAfter(date)
.isToday()
```

---

## Types

```typescript
type TimeUnit = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

type DateComponents = {
  year: number;
  month: number;       // 1-12
  day: number;         // 1-31
  hour: number;        // 0-23
  minute: number;      // 0-59
  second: number;      // 0-59
  millisecond: number; // 0-999
  dayOfWeek: number;   // 0-6 (Sun-Sat)
};

type LocaleInfo = {
  code: string;
  languageCode: string;
  regionCode: string;
  displayName: string;
  nativeName: string;
};

type DateInput = number | string | Date;
```

---

## Advanced: Direct Native Access

For advanced use cases, you can access the native C++ module directly:

```typescript
import { NativeDateModule } from '@bernagl/react-native-date';

// Call native methods directly (bypasses JS wrapper optimizations)
const timestamp = NativeDateModule.parse('2025-12-25');
const formatted = NativeDateModule.format(timestamp, 'yyyy-MM-dd');
```

::: warning
The wrapper functions (`parse`, `format`, etc.) include performance optimizations like using JS `Date.parse()` to avoid bridge crossings for simple operations. Use `NativeDateModule` directly only when you need specific native behavior.
:::
