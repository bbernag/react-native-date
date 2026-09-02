# Semantics

Contracts for `@bernagl/react-native-date` v4. Function signatures live in the [API reference](./api-reference.md). This page is the shipped behavior.

## Error policy

| Kind of API | Invalid input |
|-------------|----------------|
| `parse`, `parseFormat`, `format*`, getters, setters, arithmetic, boundaries, `clamp`, `min`, `max`, timezone **value** functions | **throw** (`Error`; native `std::invalid_argument`) |
| `tryParse`, `tryParseFormat` | **`null`** (except oversized input — see [Parsing](#parsing)) |
| Batch async (`parseManyAsync`, `formatManyAsync`, `getComponentsManyAsync`) | **per-element** `NaN` / `""` / NaN fields; the Promise still fulfills |
| `is*` predicates (`isToday`, `isBefore`, `isWeekend`, …) | **`false`** |
| Invalid **timezone name** (including on `*InTz` predicates) | **throw** |
| Non-finite timestamps passed **directly** to `NativeDateModule` timezone / InTz methods | **throw** |
| Empty `min([])` / `max([])` | **throw** |
| Native module missing (Expo Go, web, no rebuild) | **throw** on first call, not at import |

Strings are never fed to `Date.parse()`. Every `DateInput` string uses the native ISO parser (`parse()`). Non-ISO strings (`'Dec 25, 2024'`, `'12/25/2024'`) throw (or yield `null` / `false` per the table).

```typescript
parse('not-a-date');          // throws
tryParse('not-a-date');       // null
isToday('not-a-date');        // false
min([]);                      // throws
format(NaN, 'yyyy');          // throws
formatDistance(NaN);          // throws
isTodayInTz(ts, 'Not/AZone'); // throws (bad zone)
isTodayInTz('nope', 'UTC');   // false (bad date)
```

## Validity range

A timestamp is valid when it is finite **and** within **±8.64e15 ms** of the Unix epoch (the ECMAScript `Date` range). `isValid(1e20)` is `false`. Values outside that range throw from value-returning APIs.

UTC conversions are 64-bit civil math (no `time_t` truncation). Local-time APIs on **Apple** platforms go through libc `mktime` and **reject years before 1900**. UTC helpers (`formatUTC`, `parse('…Z')`, `fromComponents`) cover the full range.

## Parsing

### ISO 8601 (`parse` / `tryParse` / every `DateInput` string)

Grammar:

```
YYYY-MM-DD[(T| )HH:mm[:ss[.S{1,9}]]][Z|±hh:mm|±hhmm|±hh]
```

| Rule | Result |
|------|--------|
| Date-only, no designator (`'2024-12-25'`) | **local midnight** |
| Date-only **with** designator (`'2024-01-15Z'`, `'2024-01-15+05:00'`) | UTC midnight shifted by the offset |
| `T`/`space` present | `HH:mm` is mandatory; seconds and fraction optional |
| `24:00` | **rejected** (use the next day's midnight) |
| Lowercase `t` / `z` | **rejected** (only `T` and `Z`) |
| Fraction | 1–9 digits, **truncated** to milliseconds (`.9999` → 999 ms) |
| Trailing junk / whitespace | rejected |
| Length | **128** characters max |
| Calendar | year 0000–9999, month 1–12, day 1..daysInMonth, hour 0–23, minute/second 0–59 |

```typescript
parse('2024-12-25');              // local midnight
parse('2024-12-25T14:30:00Z');    // absolute instant
parse('2024-01-15T14:30');        // local 14:30 (seconds optional)
parse('2024-01-15T14:30Z');       // 14:30 UTC (time is not dropped)
parse('2024-02-31');              // throws
parse('2024-01-15t14:30:00z');    // throws (lowercase)
parse('2024-01-15T24:00:00');     // throws
```

`startOfDay('2024-12-25')` equals `startOfDay(parse('2024-12-25'))` in every zone.

### `parseFormat` / `tryParseFormat`

- Whole **pattern** and whole **input** must be consumed. No prefix parse, no filling omitted fields from the input (omitted tokens still default to `1970-01-01 00:00:00.000`).
- Variable-width tokens `M d H h m s` read 1–2 digits and fail on a third.
- Fixed-width tokens need a digit in every position.
- `hh`/`h` are 1–12. Without `a`/`A`, the hour is **AM** (`12:00` with `hh:mm` → 00:00).
- Locale name tokens (`MMM`, `MMMM`, `ddd`, `dddd`, `E`…) are **not** parse tokens and fail.
- Date string **> 256** characters or pattern **> 128** characters **throws** (even from `tryParseFormat`; the input is not echoed). Other mismatches: `parseFormat` throws, `tryParseFormat` returns `null`.

Parse tokens are **not** the same as format tokens. In particular, parse `M` is a 1–2 digit **numeric** month; format `M` is the locale **narrow month name**. `M` does not round-trip; `MM` does.

## Arithmetic

| Unit | `add` / `subtract` | Amount | `diff` |
|------|--------------------|--------|--------|
| `millisecond` … `hour` | elapsed duration | fractions allowed | truncate toward zero (duration) |
| `day` / `week` | **calendar** math: shift the local date, keep the wall clock across DST | **whole numbers only** | 24 h / 168 h **durations**, truncate toward zero |
| `month` / `year` | **clamp** to the last valid day (Jan 31 + 1 month = Feb 29/28) | **whole numbers only** | **complete** local months/years with the same clamp |

```typescript
addDays(parse('2024-03-10T00:00:00'), 1);
// America/New_York: 2024-03-11 00:00 EDT, not 01:00

addMonths(parse('2024-01-31'), 1); // 2024-02-29 (leap) or Feb 28
addMonths(ts, 1.5);                // throws
```

`startOf` / `endOf` / `isSame` for second, minute, and hour floor on the **local** grid (correct in half-hour zones such as `Asia/Kolkata`). `endOf(day|week|month|year)` is `startOf(next) - 1` ms, so 23-hour and 25-hour days are right. Weeks start on **Sunday**.

`diff` is antisymmetric for millisecond…week. Month/year count complete local units (`diff(Feb 29, Jan 31, 'month') === 1`, `diff(Jan 15 2024, Dec 15 2023, 'year') === 0`).

Setters and chain setters use the same month/year clamp. Years `0`–`99` are literal (`fromComponents({ year: 99, month: 1, day: 1 })` is year 99, not 1999).

## Time zones

`Timezone` is a convenience union of common IANA IDs **plus any string the OS accepts**. It is not a complete IANA list and does not type-check unknown names. Use `isValidTimezone()` at runtime. Unknown, empty, ill-formed, or oversized names **throw**.

Aliases (case-insensitive where noted):

| Input | Meaning |
|-------|---------|
| `UTC`, `utc`, `Etc/UTC`, `Z` | offset 0 |
| `GMT`, `WET` | fixed-offset `Etc/GMT` (offset 0 **year-round**, no BST) |
| `EST`/`EDT`/`CST`/… | **US-centric** abbreviations (`IST` → `Asia/Kolkata`, `CST` → `America/Chicago`) |

Prefer IANA IDs. `WET` as IANA observes summer time; this library's `WET` does not — use `Europe/Lisbon` if you want DST.

Offsets are **east-positive** minutes (`Asia/Tokyo` = `+540`, New York in winter = `-300`). `Date.prototype.getTimezoneOffset()` has the opposite sign.

### `toTimezone` / `toUTC`

`toTimezone(ts, zone)` is **not** “the same instant in another zone”. It returns a **shifted epoch** whose UTC fields equal the wall clock in `zone`, intended only for `formatUTC`:

```typescript
formatUTC(toTimezone(ts, 'Asia/Tokyo'), 'HH:mm'); // wall clock in Tokyo
formatInTimezone(ts, 'HH:mm', 'Asia/Tokyo');      // prefer this
```

Feeding the result to `format`, `isToday`, or `addDays` applies the device zone a second time. `toUTC` is an **identity** (a timestamp is already UTC) and is **deprecated**.

### Zoned midnight

`startOfDayInTz` is midnight of that civil date in the named zone:

- DST **gap** (midnight skipped) → first instant after the gap
- DST **overlap** (midnight twice) → the **earlier** instant

`endOfDayInTz` is the next civil date's zoned midnight minus 1 ms (correct on 23 h / 25 h days). `isTomorrowInTz` / `isYesterdayInTz` compare civil day numbers ±1 in that zone, not ±24 h.

## Locales

Localized tokens (`MMMM`, `EEE`, …) work with **zero config**. The device locale is loaded on first use. The old `"Locale not set"` error is gone. `setLocale` is an override.

`setLocale('pt_BR')` and `setLocale('pt-br')` both work. `getLocale()` returns the **canonical hyphenated** tag (`'pt-BR'`). Month and day names are always **Gregorian**, even when the locale's default calendar is Islamic or Hebrew (`ar-SA` + `MMMM` is a Gregorian Arabic month).

## Relative time

`formatDistance` accepts either `formatDistance(date, { base?, addSuffix? })` or the positional form `formatDistance(date, base?, addSuffix?)`. Default `addSuffix` is `true`.

- `addSuffix: false` returns the **bare quantity** (`"2 hours"`, `"2 horas"`) with no “ago” / “in”.
- One bucket table on every platform (date-fns thresholds). Localized output has **no** “about” / “over” / “less than a” qualifiers; those words exist only in the English fallback.
- Both `formatDistance` and `formatDuration` **throw** on `NaN` / `Infinity`.
- Durations clamp at `Number.MAX_SAFE_INTEGER` ms. Negative durations format as their magnitude. Android durations are localized (same narrow style as iOS).

## Async batch

`formatManyAsync` is the **full** formatter (locale names, quotes, brackets). `'MMMM d'` yields `"June 15"`, not `"0606 15"`.

| Invalid element | Result |
|-----------------|--------|
| `parseManyAsync` | `NaN` at that index |
| `formatManyAsync` | `""` at that index |
| `getComponentsManyAsync` | all-NaN component fields |

Hard caps **throw** on the JS thread (the Promise is not created): batch size **> 100000**, format pattern **> 128** characters. Empty batches are allowed.

## Today / tomorrow / yesterday

`isToday`, `isTomorrow`, and `isYesterday` are single native calls that compare **civil dates in the system zone** (not ±24 h, not formatted strings). Invalid input is `false`. Tomorrow/yesterday stay correct on 23-hour and 25-hour DST days.

## Native binding

The HybridObject is created on **first call**, not at import. In Expo Go or on web the error is:

> `@bernagl/react-native-date: the native module could not be created. This library requires a development build with native code (not Expo Go / web).`

`NativeDateModule` is a lazily-bound proxy (advanced / internal, not semver). Prefer the exported functions. `import { nativeDate } from '@bernagl/react-native-date/chain'` does not load the rest of the barrel.

Chain instances serialize as an ISO UTC string (`toJSON` / `JSON.stringify`); `toString()` is local `yyyy-MM-dd HH:mm:ss`.
