# API Reference

All functions accept flexible date inputs and return timestamps (milliseconds since Unix Epoch).

```typescript
type DateInput = number | string | Date;
```

Every `DateInput` string is parsed by the native ISO 8601 grammar (same as `parse()`). Date-only strings are **local midnight**. See [Semantics](./semantics.md) for the full contracts.

::: warning v4.0
Requires `react-native-nitro-modules >=0.36.0 <0.37.0`, React Native **0.81+**, iOS **15.1+**, Xcode **16.1+**, Android API **24+**. Parsing, arithmetic, time zones, and errors are stricter than v3 — see [Release Notes](https://github.com/bbernag/react-native-date/blob/main/packages/native-date/RELEASE_NOTES_v4.0.0.md) and [Semantics](./semantics.md).
:::

::: warning v2.0
`parse()` and getters use **local time** for date-only strings (was UTC). See [v2 notes](https://github.com/bbernag/react-native-date/blob/main/packages/native-date/RELEASE_NOTES_v2.0.0.md).
:::

## Error policy

| API | Invalid input |
|-----|----------------|
| `parse*` / `format*` / getters / setters / arithmetic / boundaries / `clamp` / `min` / `max` / timezone values | **throw** |
| `tryParse` / `tryParseFormat` | **`null`** |
| Batch async | **`NaN` / `""` per element** (Promise fulfills) |
| `is*` predicates | **`false`** |
| Unknown timezone name | **throw** (including on `*InTz` predicates) |
| `min([])` / `max([])` | **throw** |

`isValid` is finite **and** within ±8.64e15 ms. Non-finite numbers never reach native code from the JS wrappers.

---

## Parsing

| Function | Description |
|----------|-------------|
| `now()` | Current timestamp |
| `parse(string)` | Parse ISO 8601; **throws** on invalid input |
| `tryParse(string)` | Same parser; returns `null` on failure |
| `parseFormat(string, pattern)` | Parse with custom format; **throws** |
| `tryParseFormat(string, pattern)` | Safe parse with format |
| `fromComponents(obj)` | Create from `{ year, month, day, ... }` (UTC) |
| `fromComponentsLocal(obj)` | Same, in local time |

```typescript
now();
parse('2025-11-30T12:00:00Z');
parse('2025-11-30');                 // local midnight
tryParse('invalid');                 // null
parseFormat('12/25/2025', 'MM/dd/yyyy');
fromComponents({ year: 2025, month: 12, day: 25 });
```

Accepted ISO form: `YYYY-MM-DD[(T\| )HH:mm[:ss[.S{1,9}]]][Z|±hh:mm|±hhmm|±hh]`. `HH:mm` is required after `T`/space. `24:00`, lowercase `t`/`z`, trailing junk, and strings longer than 128 characters throw. Full grammar: [Semantics → Parsing](./semantics.md#parsing).

### Parse tokens (`parseFormat`)

These tokens **read** input. They are not the format tokens.

| Token | Reads | Notes |
|-------|-------|-------|
| `yyyy` / `YYYY` | 4-digit year | |
| `yy` / `YY` | 2-digit year | 70–99 → 1970–1999, 00–69 → 2000–2069 |
| `MM` | 2-digit month | 01–12 |
| `M` | 1–2 **digit** month | numeric; **not** a month name |
| `dd` / `DD` | 2-digit day | |
| `d` / `D` | 1–2 digit day | validated against the month |
| `HH` | 2-digit hour 00–23 | |
| `H` | 1–2 digit hour 00–23 | |
| `hh` | 2-digit hour 01–12 | AM if no `a`/`A` |
| `h` | 1–2 digit hour 01–12 | |
| `mm` | 2-digit minute | |
| `m` | 1–2 digit minute | |
| `ss` | 2-digit second | |
| `s` | 1–2 digit second | |
| `SSS` | millisecond 000–999 | |
| `a` / `aa` / `aaa` / `A` | AM/PM | `a`/`p`, `am`/`pm`, `a.m.`/`p.m.`, case-insensitive |

`'literal'` and `[literal]` are literals. `MMM` / `MMMM` / `ddd` / `dddd` / `E…` are **not** parse tokens. Whole input and whole pattern must be consumed. Date string > 256 or pattern > 128 characters throws (including from `tryParseFormat`).

---

## Formatting

| Function | Description |
|----------|-------------|
| `format(date, pattern)` | Format in local time |
| `formatUTC(date, pattern)` | Format in UTC |
| `formatInTimezone(date, pattern, tz)` | Format in a named zone |
| `toISOString(date)` | ISO 8601 UTC string |
| `formatDate(date)` | `yyyy-MM-dd` (local) |
| `formatDateTime(date)` | `yyyy-MM-dd HH:mm:ss` (local) |

```typescript
format(date, 'yyyy-MM-dd');              // "2025-11-30"
format(date, 'MMMM d, yyyy');            // "November 30, 2025"
format(date, 'EEEE');                    // "Sunday"
formatUTC(date, 'HH:mm:ss');
formatInTimezone(date, 'HH:mm', 'Asia/Tokyo');
toISOString(date);                       // "2025-11-30T12:00:00.000Z"
```

Month and day names follow the [device locale](./locales.md) (or `setLocale`). Years outside 0000–9999 print in full (`10000`, `-0001`).

### Format tokens (`format` / `formatUTC` / `formatInTimezone`)

These tokens **emit** text. They are not the parse tokens.

| Token | Example | Description |
|-------|---------|-------------|
| `yyyy` / `YYYY` | 2025 | Year (full signed value outside 0000–9999) |
| `yy` / `YY` | 25 | Last two digits |
| `MMMM` | November | Full month name (localized) |
| `MMM` | Nov | Abbreviated month (localized) |
| `MM` | 11 | 2-digit month |
| `M` | N | **Narrow month name** (localized), not a number |
| `dddd` | Sunday | Full weekday (localized) |
| `ddd` | Sun | Abbreviated weekday (localized) |
| `dd` / `DD` | 30 | 2-digit day |
| `d` / `D` | 30 | Day |
| `EEEE` | Sunday | Full weekday (localized) |
| `EEE` | Sun | Abbreviated weekday |
| `EE` | Su | Short weekday |
| `E` | S | Narrow weekday |
| `HH` | 14 | 24h hour, 2-digit |
| `H` | 14 | 24h hour |
| `hh` | 02 | 12h hour, 2-digit |
| `h` | 2 | 12h hour |
| `mm` | 30 | Minute |
| `ss` | 45 | Second |
| `SSS` | 123 | Millisecond |
| `A` | PM | AM/PM |
| `a` / `aa` / `aaa` | p / pm / p.m. | lowercase meridians |

**Escape text:** `'literal'` or `[literal]`.

```typescript
format(date, "'Today:' EEEE"); // "Today: Sunday"
```

::: warning `M` does not round-trip
Format `M` is a narrow **name** (`"M"` for March in English). Parse `M` is a **number**. Use `MM` when you need to parse what you formatted.
:::

---

## Getters

Local-time components. Use `formatUTC` / `formatInTimezone` for other zones.

| Function | Returns |
|----------|---------|
| `getYear(date)` | Year |
| `getMonth(date)` | Month 1–12 |
| `getDate(date)` | Day of month 1–31 |
| `getDay(date)` | Day of week 0–6 (Sun–Sat) |
| `getHours(date)` | Hours 0–23 |
| `getMinutes(date)` | Minutes 0–59 |
| `getSeconds(date)` | Seconds 0–59 |
| `getMilliseconds(date)` | Milliseconds 0–999 (also for pre-epoch instants) |
| `getDaysInMonth(date)` | Days in month (28–31) |
| `getComponents(date)` | All components object |

```typescript
getYear(date);        // 2025
getMonth(date);       // 11
getDaysInMonth(date); // 30
getComponents(date);  // { year, month, day, hour, minute, second, millisecond, dayOfWeek }
```

---

## Setters

Immutable; return a new timestamp. Month/year **clamp** the day of month (Jan 31 → February 28/29). Years 0–99 are literal.

| Function | Description |
|----------|-------------|
| `setYear(date, year)` | Set year |
| `setMonth(date, month)` | Set month (1–12) |
| `setDate(date, day)` | Set day of month |
| `setHours(date, hours)` | Set hours |
| `setMinutes(date, minutes)` | Set minutes |
| `setSeconds(date, seconds)` | Set seconds |
| `setMilliseconds(date, ms)` | Set milliseconds |

```typescript
setYear(date, 2026);
setMonth(date, 3);
setDate(setMonth(parse('2024-01-31'), 2), 15); // Feb 15
```

---

## Arithmetic

| Function | Description |
|----------|-------------|
| `add(date, n, unit)` | Add time |
| `subtract(date, n, unit)` | Subtract time |
| `addDays` / `addWeeks` / `addMonths` / `addYears` | Convenience |
| `addHours` / `addMinutes` / `addSeconds` | Convenience |
| `subDays` / `subWeeks` / `subMonths` / `subYears` | Convenience |
| `subHours` / `subMinutes` / `subSeconds` | Convenience |

**Units:** `'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'`

- `day` / `week`: **calendar** math (same wall clock across DST). Amounts must be **whole numbers**.
- `month` / `year`: **clamp** to the last valid day (`Jan 31 + 1 month` → Feb 29/28). Amounts must be whole numbers.
- Smaller units: elapsed duration; fractions allowed.

```typescript
addDays(date, 7);
addMonths(parse('2024-01-31'), 1); // 2024-02-29
add(date, 2, 'week');
subtract(date, 1, 'year');
```

Details: [Semantics → Arithmetic](./semantics.md#arithmetic).

---

## Comparisons

Invalid dates yield `false` (these are predicates).

| Function | Description |
|----------|-------------|
| `isBefore(date1, date2)` | date1 < date2 |
| `isAfter(date1, date2)` | date1 > date2 |
| `isSame(date1, date2, unit)` | Same local unit? (`isSame(a,b,u) ⇔ startOf(a,u) === startOf(b,u)`) |
| `isSameDay(date1, date2)` | Same local day? |
| `isSameMonth(date1, date2)` | Same local month? |
| `isSameYear(date1, date2)` | Same local year? |

```typescript
isBefore(date1, date2);
isSame(date1, date2, 'month');
isSameDay(date1, date2);
```

---

## Predicates

Invalid dates yield `false`. `isToday` / `isTomorrow` / `isYesterday` are one native call each: civil dates in the **system zone**, not ±24 h.

| Function | Description |
|----------|-------------|
| `isValid(date)` | Finite and within ±8.64e15 ms? |
| `isToday(date)` | Today in the system zone? |
| `isTomorrow(date)` | Tomorrow (civil date + 1)? |
| `isYesterday(date)` | Yesterday (civil date − 1)? |
| `isPast(date)` | Strictly before `now()`? |
| `isFuture(date)` | Strictly after `now()`? |
| `isWeekend(date)` | Saturday or Sunday (local)? |
| `isLeapYear(date)` | Leap year (local calendar year)? |

```typescript
isToday(date);
isWeekend(date);
isValid(8.64e15);     // true
isValid(8.64e15 + 1); // false
```

---

## Timezone-aware predicates

Check civil dates in a named zone. An **invalid date** yields `false`; an **unknown zone name** throws.

| Function | Description |
|----------|-------------|
| `isTodayInTz(date, tz)` | Today in timezone? |
| `isTomorrowInTz(date, tz)` | Tomorrow in timezone? |
| `isYesterdayInTz(date, tz)` | Yesterday in timezone? |
| `isSameDayInTz(date1, date2, tz)` | Same civil day in timezone? |
| `isSameMonthInTz(date1, date2, tz)` | Same month in timezone? |
| `isSameYearInTz(date1, date2, tz)` | Same year in timezone? |
| `startOfDayInTz(date, tz)` | Zoned midnight (gap → after; overlap → earlier) |
| `endOfDayInTz(date, tz)` | Next zoned midnight − 1 ms |

```typescript
isTodayInTz(date, 'Asia/Tokyo');
startOfDayInTz(date, 'America/New_York');
isSameDayInTz(date1, date2, 'Europe/London');
```

---

## Boundaries

Computed on the **local** grid. Second/minute/hour floors use the offset in effect at that instant (half-hour zones included). `endOf(unit)` is `startOf(next) - 1` ms. Weeks start on Sunday.

| Function | Description |
|----------|-------------|
| `startOf(date, unit)` | Start of unit |
| `endOf(date, unit)` | End of unit |
| `startOfDay(date)` | 00:00:00.000 local |
| `endOfDay(date)` | 23:59:59.999 local (or 22:59:59.999 on a 23 h day) |
| `startOfWeek(date)` | Sunday 00:00 |
| `endOfWeek(date)` | Saturday 23:59:59.999 |
| `startOfMonth(date)` | First of month |
| `endOfMonth(date)` | Last millisecond of month |
| `startOfYear(date)` | Jan 1 |
| `endOfYear(date)` | Dec 31 |

```typescript
startOfDay(date);
endOfMonth(date);
startOf(date, 'year');
```

---

## Differences

`diff` truncates toward zero. `day`/`week` are 24 h / 168 h **durations**. `month`/`year` count **complete local** months/years with `add`'s clamp.

| Function | Description |
|----------|-------------|
| `diff(date1, date2, unit)` | `date1 - date2` in `unit` |
| `diffInDays` / `diffInWeeks` / `diffInMonths` / `diffInYears` | Convenience |
| `diffInHours` / `diffInMinutes` / `diffInSeconds` | Convenience |

```typescript
diffInDays(date1, date2);
diff(date1, date2, 'week');
```

---

## Relative time

| Function | Description |
|----------|-------------|
| `formatDistance(date, options?)` | Human-readable distance |
| `formatDistance(date, base?, addSuffix?)` | Positional form (kept) |
| `formatDuration(ms)` | Duration string |

```typescript
formatDistance(pastDate);                             // "2 hours ago"
formatDistance(futureDate, { addSuffix: true });      // "in 3 days"
formatDistance(pastDate, { addSuffix: false });       // "2 hours"  (no direction)
formatDistance(ts, { base: otherTs, addSuffix: false });
formatDuration(3600000);                              // "1h 0m 0s"
```

`addSuffix: false` is the bare quantity on every platform. Localized output has no “about” / “over” qualifiers. Both functions **throw** on `NaN` / `Infinity`. Durations clamp at `Number.MAX_SAFE_INTEGER` ms. Android durations are localized.

Type: `FormatDistanceOptions = { base?: DateInput; addSuffix?: boolean }`.

---

## Timezone

`Timezone` is a list of common IANA IDs **plus any OS string** (`string & {}`). It is for autocomplete, not a complete or validated set. Unknown names **throw**. Aliases: `UTC` / `utc` / `Etc/UTC` / `Z`; case-insensitive **US-centric** abbreviations; `GMT` / `WET` → fixed `Etc/GMT` (offset 0, no DST). See [Semantics](./semantics.md#time-zones).

Offsets are **east-positive** minutes (`+540` for Tokyo). That is the opposite sign of `Date.prototype.getTimezoneOffset()`.

| Function | Description |
|----------|-------------|
| `getTimezone()` | Device timezone ID |
| `getTimezoneOffset()` | Current offset, east-positive |
| `getTimezoneOffsetForTimestamp(date)` | Device offset at `date` |
| `getOffsetInTimezone(date, tz)` | Offset of `tz` at `date` |
| `toTimezone(date, tz)` | **Shifted epoch** for `formatUTC` — not a real instant |
| `toUTC(date)` | **Deprecated** identity |
| `formatInTimezone(date, pattern, tz)` | Wall clock in `tz` |
| `getAvailableTimezones()` | IDs known to the device |
| `isValidTimezone(tz)` | Runtime check |

```typescript
getTimezone();                    // "America/New_York"
getOffsetInTimezone(date, 'Asia/Tokyo'); // 540
formatInTimezone(date, 'HH:mm', 'Asia/Tokyo');
formatUTC(toTimezone(date, 'Asia/Tokyo'), 'HH:mm'); // same wall clock; prefer formatInTimezone
isValidTimezone('Europe/London'); // true
isValidTimezone('America/NewYork'); // false; formatting with it throws
```

::: warning `toTimezone` is a display helper
The result is `date + offset(tz)`. Read it with `formatUTC` only. Prefer `formatInTimezone`.
:::

---

## Locale

Zero-config: the **device locale** is used until `setLocale` is called. There is no `"Locale not set"` error. `_` and `-` are both accepted; `getLocale()` returns the canonical hyphenated tag. Names are always Gregorian. See [Locales](./locales.md).

| Function | Description |
|----------|-------------|
| `getLocale()` | Effective locale (hyphenated) |
| `setLocale(code)` | Override; `true` on success |
| `getAvailableLocales()` | Frozen `{ en: 'en', … }` lookup |
| `getLocaleDisplayName(code)` | English display name |
| `getLocaleInfo(code)` | Full locale info |
| `getAvailableLocalesInfo()` | All locales with info |

```typescript
getLocale();               // "en" or "en-US"
setLocale('es');           // true
setLocale('pt_BR');        // true; getLocale() → "pt-BR"
getLocaleDisplayName('ja'); // "Japanese"
```

---

## Utilities

| Function | Description |
|----------|-------------|
| `clamp(date, min, max)` | Clamp to range; throws if any argument is invalid |
| `min(dates[])` | Earliest; **throws** on `[]` |
| `max(dates[])` | Latest; **throws** on `[]` |

```typescript
clamp(date, minDate, maxDate);
min([date1, date2, date3]);
```

---

## Async batch

Background-thread loops. `formatManyAsync` uses the **same formatter as `format()`** (locale names, quotes, brackets).

| Function | Invalid element | Caps (throw) |
|----------|-----------------|--------------|
| `parseManyAsync(strings[])` | `NaN` | size > 100000 |
| `formatManyAsync(dates[], pattern)` | `""` | size > 100000 or pattern > 128 chars |
| `getComponentsManyAsync(dates[])` | NaN fields | size > 100000 |

```typescript
const timestamps = await parseManyAsync(['2025-01-01', '2025-02-15']);
const formatted = await formatManyAsync(timestamps, 'MMMM d'); // "January 1", …
```

---

## Chainable API

Immutable, fluent interface similar to [Day.js](https://day.js.org/). Same parsing, clamp, and error policy as the functions.

```typescript
import { nativeDate } from '@bernagl/react-native-date';
import { nativeDate as chain } from '@bernagl/react-native-date/chain'; // barrel not loaded

nativeDate()
  .addDays(7)
  .startOfMonth()
  .format('yyyy-MM-dd');

nativeDate().year;
nativeDate().month;      // 1–12
nativeDate().date;
nativeDate().timestamp;

JSON.stringify(nativeDate(0)); // "1970-01-01T00:00:00.000Z"  (toJSON)
String(nativeDate(0));         // "1970-01-01 00:00:00"       (local toString)
```

`import … from '@bernagl/react-native-date/chain'` does not evaluate the main entry.

---

## Types

```typescript
type TimeUnit =
  | 'millisecond' | 'second' | 'minute' | 'hour'
  | 'day' | 'week' | 'month' | 'year';

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

type FormatDistanceOptions = {
  base?: DateInput;
  addSuffix?: boolean; // default true
};

type Timezone = 'UTC' | 'America/New_York' | /* common IANA ids */ | (string & {});
```

`Timezone` is **not** exhaustive. Any OS time-zone string is accepted at the type level; runtime validation is `isValidTimezone` / a thrown error.

---

## Advanced: `NativeDateModule`

The native HybridObject is created **lazily** on first use. `NativeDateModule` is a proxy around that instance (advanced / internal, not covered by semver). Prefer the exported functions.

```typescript
import { NativeDateModule } from '@bernagl/react-native-date';

const timestamp = NativeDateModule.parse('2025-12-25');
```

If the native module is missing (Expo Go, web, no rebuild), the **first call** throws with a development-build message — import itself is silent.
