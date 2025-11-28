# Examples

Two API styles: **functional** (like [date-fns](https://date-fns.org/)) and **chainable** (like [Day.js](https://day.js.org/)).

## Formatting

```typescript
import { format, formatUTC, formatInTimezone } from '@bernagl/react-native-date';

format(Date.now(), 'yyyy-MM-dd');           // "2025-11-30"
format(Date.now(), 'MMMM d, yyyy');         // "November 30, 2025"
format(Date.now(), 'EEEE');                 // "Sunday"
format(Date.now(), 'hh:mm A');              // "02:30 PM"
formatUTC(Date.now(), 'HH:mm:ss');          // UTC time
formatInTimezone(Date.now(), 'HH:mm', 'Asia/Tokyo');
```

```typescript
// Chainable
import { nativeDate } from '@bernagl/react-native-date';

nativeDate().format('yyyy-MM-dd');
nativeDate().formatUTC('HH:mm:ss');
nativeDate().formatInTimezone('HH:mm', 'Asia/Tokyo');
```

### Localized

```typescript
import { setLocale, format } from '@bernagl/react-native-date';

setLocale('es');
format(Date.now(), 'EEEE, d MMMM'); // "domingo, 30 noviembre"

setLocale('ja');
format(Date.now(), 'yyyy年M月d日 EEEE'); // "2025年11月30日 日曜日"
```

---

## Parsing

```typescript
import { parse, tryParse, parseFormat, tryParseFormat } from '@bernagl/react-native-date';

// ISO 8601
parse('2025-12-25');
parse('2025-12-25T14:30:00Z');
tryParse('invalid');  // null

// Custom format
parseFormat('12/25/2025', 'MM/dd/yyyy');
parseFormat('25-12-2025', 'dd-MM-yyyy');
parseFormat('12/25/2025 02:30 PM', 'MM/dd/yyyy hh:mm A');
tryParseFormat('invalid', 'MM/dd/yyyy'); // null
```

```typescript
// Chainable
import { nativeDate } from '@bernagl/react-native-date';

nativeDate('2025-12-25');
nativeDate('2025-12-25T14:30:00Z');
```

---

## Arithmetic

```typescript
import { addDays, addMonths, addYears, subDays, add, subtract } from '@bernagl/react-native-date';

addDays(Date.now(), 7);
addMonths(Date.now(), 3);
addYears(Date.now(), 1);
subDays(Date.now(), 7);
add(Date.now(), 30, 'minute');
subtract(Date.now(), 2, 'week');
```

```typescript
// Chainable
import { nativeDate } from '@bernagl/react-native-date';

nativeDate().addDays(7);
nativeDate().addMonths(3);
nativeDate().subDays(7);
nativeDate().add(30, 'minute');

// Chain multiple
nativeDate()
  .addMonths(3)
  .subDays(5)
  .startOfMonth()
  .format('yyyy-MM-dd');
```

---

## Comparisons

```typescript
import { isBefore, isAfter, isSame, isSameDay } from '@bernagl/react-native-date';

isBefore(date1, date2);        // true if date1 < date2
isAfter(date1, date2);         // true if date1 > date2
isSame(date1, date2, 'month'); // same month?
isSameDay(date1, date2);       // same day?
```

```typescript
// Chainable
nativeDate(date1).isBefore(date2);
nativeDate(date1).isSame(date2, 'month');
nativeDate(date1).isSameDay(date2);
```

---

## Predicates

```typescript
import { isToday, isTomorrow, isYesterday, isPast, isFuture, isWeekend, isLeapYear } from '@bernagl/react-native-date';

isToday(date);
isTomorrow(date);
isYesterday(date);
isPast(date);
isFuture(date);
isWeekend(date);
isLeapYear(date);
```

```typescript
// Chainable
nativeDate().isToday();
nativeDate().isPast();
nativeDate().isWeekend();
```

---

## Boundaries

```typescript
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from '@bernagl/react-native-date';

startOfDay(date);   // 00:00:00.000
endOfDay(date);     // 23:59:59.999
startOfMonth(date);
endOfMonth(date);
startOfYear(date);
endOfYear(date);
```

```typescript
// Chainable
nativeDate().startOfDay();
nativeDate().endOfMonth();
nativeDate().startOf('week');
```

---

## Differences

```typescript
import { diffInDays, diffInMonths, diffInYears, diff } from '@bernagl/react-native-date';

diffInDays(date1, date2);
diffInMonths(date1, date2);
diffInYears(date1, date2);
diff(date1, date2, 'week');
```

```typescript
// Chainable
nativeDate(date1).diffInDays(date2);
nativeDate(date1).diff(date2, 'week');
```

---

## Relative Time

```typescript
import { formatDistance, formatDuration, now } from '@bernagl/react-native-date';

formatDistance(pastDate, now(), true);   // "2 hours ago"
formatDistance(futureDate, now(), true); // "in 3 days"
formatDuration(3600000);                 // "1h 0m 0s"
```

---

## Timezones

```typescript
import { getTimezone, toTimezone, formatInTimezone, getAvailableTimezones, isValidTimezone } from '@bernagl/react-native-date';

getTimezone();                           // "America/New_York"
toTimezone(date, 'Asia/Tokyo');
formatInTimezone(date, 'HH:mm', 'Europe/London');
getAvailableTimezones();                 // ["Africa/Abidjan", ...]
isValidTimezone('America/New_York');     // true
```

```typescript
// Chainable
nativeDate().toTimezone('Asia/Tokyo');
nativeDate().toUTC();
```

---

## Locales

```typescript
import { getLocale, setLocale, getAvailableLocales, getLocaleInfo } from '@bernagl/react-native-date';

getLocale();           // "en" (device default)
setLocale('es');       // true
getAvailableLocales(); // { en: 'en', es: 'es', ... }
getLocaleInfo('es');   // { code, displayName, nativeName, ... }
```

---

## Components

```typescript
import { getYear, getMonth, getDate, getComponents, fromComponents } from '@bernagl/react-native-date';

getYear(date);       // 2025
getMonth(date);      // 11 (1-12)
getDate(date);       // 30
getComponents(date); // { year, month, day, hour, minute, second, ... }

fromComponents({ year: 2025, month: 12, day: 25 });
```

```typescript
// Chainable
nativeDate().year;   // 2025
nativeDate().month;  // 11
nativeDate().date;   // 30
nativeDate().getComponents();
```

---

## Utilities

```typescript
import { clamp, min, max } from '@bernagl/react-native-date';

clamp(date, minDate, maxDate);
min([date1, date2, date3]);
max([date1, date2, date3]);
```

---

## Batch Processing

```typescript
import { parseManyAsync, formatManyAsync, getComponentsManyAsync } from '@bernagl/react-native-date';

const timestamps = await parseManyAsync(['2025-01-01', '2025-02-15']);
const formatted = await formatManyAsync(timestamps, 'MMMM d');
const components = await getComponentsManyAsync(timestamps);
```
