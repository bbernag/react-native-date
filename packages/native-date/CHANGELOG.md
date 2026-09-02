# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0] - 2026-09-01

v4 is a breaking native bump **and** a contract cleanup. The JavaScript date API is **not** unchanged from v3. See [RELEASE_NOTES_v4.0.0.md](./RELEASE_NOTES_v4.0.0.md) and [Semantics](https://bbernag.github.io/react-native-date/semantics).

### Breaking

- Require `react-native-nitro-modules >=0.36.0 <0.37.0` (dev/example pin **0.36.5**). Nitrogen 0.36.5 emits the same 17 spec files as 0.35.7.
- **Strict ISO-8601.** `parse` / every `DateInput` string rejects invalid calendars, incomplete times, `24:00`, lowercase `t`/`z`, trailing junk, and strings longer than 128 characters. `'2024-01-15T14:30Z'` now parses 14:30 UTC (the time is no longer dropped). Date-only with an offset (`'2024-01-15+05:00'`) is honored. `parse('not-a-date')` throws.
- **`toTimestamp` uses native parse.** Date-only strings are local midnight for `add*` / `startOf*` / `diff*` / `*InTz` / … — same as `parse()`. Non-ISO strings that `Date.parse` accepted (`'Dec 25, 2024'`) now throw.
- **Error policy (one table).** `parse*` / `format*` / getters / arithmetic / timezone **values** throw; `try*` return `null`; batch async yields `NaN` / `""` per element; `is*` predicates return `false`. Native rejects non-finite numbers. `min([])` / `max([])` throw.
- **Unknown time zones throw** (no silent system-zone / GMT fallback). `GMT` / `WET` are fixed-offset `Etc/GMT`. Abbreviations are case-insensitive and US-centric.
- **Calendar `addDays` / `addWeeks`** (same wall clock across DST). Hour and below stay durations. Day/week/month/year amounts must be **whole numbers**.
- **Month/year clamp** is the contract: Jan 31 + 1 month = Feb 29/28 (not JS `Date` overflow to March).
- **`isValid`** is finite **and** within ±8.64e15 ms. Local-time APIs on Apple platforms reject years before 1900.
- **`formatDistance(…, false)`** returns the bare quantity (no “ago” / “in”). `formatDistance` / `formatDuration` throw on `NaN` / `Infinity`. Durations clamp at `Number.MAX_SAFE_INTEGER` ms.
- **`formatManyAsync` is the full formatter** (`'MMMM d'` → `"June 15"`). Invalid elements → `""` / NaN fields. Batch size > 100000 or pattern > 128 characters throws.
- **Chain:** setters clamp like the functions; `JSON.stringify` is the ISO UTC string (`toJSON`), not `{ ts }`; years 0–99 are literal.
- **Lazy native binding.** The HybridObject is created on first call. Expo Go / web fail then, with a development-build message — not at import.
- **`toUTC` is deprecated** (identity). `toTimezone` remains a shifted epoch for `formatUTC`.

### Changed

- Device locale is the zero-config default (no `"Locale not set"`). `_` / `-` ids normalize; `getLocale()` is hyphenated. Month/day names are Gregorian regardless of the locale calendar.
- One relative-time bucket table on iOS, Android, and the mock. Localized output has no “about” / “over” qualifiers. Android `formatDuration` is localized.
- `startOf` / `endOf` / `isSame` for second/minute/hour floor on the **local** grid (half-hour zones, pre-epoch). `diff` truncates toward zero; month/year count complete local units.
- `isToday` / `isTomorrow` / `isYesterday` are native civil-date compares in the system zone.
- Offset minutes are **east-positive** (documented; opposite of `Date#getTimezoneOffset()`).
- `Timezone` is common IANA IDs plus any OS string, not a complete list.
- Release is **tag-driven** with npm provenance. `release:patch` / `minor` / `major` scripts are gone.
- CI runs `test:cpp` (doctest + ASan/UBSan on Ubuntu). Jest pins `TZ=UTC` and does not run Node mock “benchmarks” by default.

### Added

- `formatDistance(date, { base?, addSuffix? })` options overload (`FormatDistanceOptions`).
- C++ unit-test harness (`yarn workspace @bernagl/react-native-date test:cpp`).
- `CONTRIBUTING.md` (Yarn 4, example apps, commit conventions, release).

### Migration

- Install `react-native-nitro-modules@0.36.5`, reinstall iOS pods, rebuild.
- Catch `parse` / `format` / timezone throws; use `tryParse` where you previously relied on garbage timestamps.
- Replace `Date.parse` / non-ISO strings with `parse` / `parseFormat`.
- Prefer `formatInTimezone` over `toTimezone` + `formatUTC`. Drop `toUTC`.
- Expect Jan 31 + 1 month = last day of February; `addDays` keeps the wall clock across DST.
- Do not call `setLocale` just to avoid an error — the device locale is already loaded.

## [3.0.0] - 2026-05-26

### Changed

- Upgrade Nitro Modules and Nitrogen generation to the 0.35 line.
- Require `react-native-nitro-modules` 0.35.x for native integration.
- Regenerate Nitro native specs with Nitrogen 0.35.7.

### Fixed

- Update Android native registration for the Nitro Modules 0.35 runtime contract.
- Relax the example app duration test assertions so native-formatted duration separators do not create false failures.

### Migration

- Upgrade consuming apps to `react-native-nitro-modules >=0.35.0 <0.36.0`.
- Reinstall iOS pods and rebuild native apps after upgrading.
- Keep the JavaScript date API unchanged from v2.x.

## [2.0.0] - 2026-01-21

See [RELEASE_NOTES_v2.0.0.md](./RELEASE_NOTES_v2.0.0.md) for the full v2 notes.

### Breaking

- `parse()` treats date-only strings as **local midnight** (was UTC). Append `Z` for UTC.
- Getters return **local** components (was UTC). Use `formatUTC` for UTC text.

### Added

- Timezone-aware predicates (`isTodayInTz`, `startOfDayInTz`, …).
- Immutable setters, Expo Dev Client support.

## [0.1.0] - 2025-11-28

### Added

- Initial release
- Core date functions: `now()`, `parse()`, `tryParse()`, `format()`
- Date getters: `getComponents()`, `getYear()`, `getMonth()`, `getDate()`, `getDay()`, `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()`
- Date information: `getDaysInMonth()`, `isLeapYear()`, `isWeekend()`, `isValid()`
- Arithmetic functions: `add()`, `subtract()`, and convenience helpers (`addDays()`, `addMonths()`, `addYears()`, `addWeeks()`, `addHours()`, `addMinutes()`, `addSeconds()`, `subDays()`, `subMonths()`, `subYears()`, `subWeeks()`, `subHours()`, `subMinutes()`, `subSeconds()`)
- Comparison functions: `isBefore()`, `isAfter()`, `isSame()`, `isSameDay()`, `isSameMonth()`, `isSameYear()`
- Predicate functions: `isToday()`, `isTomorrow()`, `isYesterday()`, `isPast()`, `isFuture()`
- Boundary functions: `startOf()`, `endOf()`, and convenience helpers (`startOfDay()`, `endOfDay()`, `startOfWeek()`, `endOfWeek()`, `startOfMonth()`, `endOfMonth()`, `startOfYear()`, `endOfYear()`)
- Difference functions: `diff()` and convenience helpers (`diffInDays()`, `diffInMonths()`, `diffInYears()`, `diffInWeeks()`, `diffInHours()`, `diffInMinutes()`, `diffInSeconds()`)
- Utility functions: `clamp()`, `min()`, `max()`
- Timezone support: `getTimezone()`, `getTimezoneOffset()`, `getTimezoneOffsetForTimestamp()`, `toTimezone()`, `formatInTimezone()`, `getAvailableTimezones()`, `isValidTimezone()`, `toUTC()`, `formatInUTC()`
- Formatting helpers: `formatDate()`, `formatDateTime()`, `toISOString()`, `formatDateInTimezone()`, `formatDateTimeInTimezone()`
- Async batch operations: `parseManyAsync()`, `formatManyAsync()`, `getComponentsManyAsync()`
- TypeScript types: `DateComponents`, `TimeUnit`
- C++ implementation with Nitro Modules
- Example app with demo and benchmark screens

### Notes

- ~~Configuration: `configure()`, `getConfig()`, `resetConfig()`, `getDefaultTimezone()`, `formatInDefaultTimezone()`, `formatDateInDefaultTimezone()`, `formatDateTimeInDefaultTimezone()`, `toDefaultTimezone()`, `NativeDateConfig`~~ — **never shipped**. Those names were listed here in error and do not exist in the package.

[Unreleased]: https://github.com/bbernag/react-native-date/compare/v4.0.0...HEAD
[4.0.0]: https://github.com/bbernag/react-native-date/compare/v3.0.0...v4.0.0
[3.0.0]: https://github.com/bbernag/react-native-date/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/bbernag/react-native-date/releases/tag/v2.0.0
[0.1.0]: https://github.com/bbernag/react-native-date/releases/tag/v0.1.0
