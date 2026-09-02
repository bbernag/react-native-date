# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0] - 2026-09-01

### Changed

- Upgrade Nitro Modules and Nitrogen generation to the 0.36 line (pin 0.36.5).
- Require `react-native-nitro-modules >=0.36.0 <0.37.0` for native integration.
- Validate the existing native spec against Nitrogen 0.36.5 with no generated API changes (same 17 files as 0.35.7).

### Migration

- Upgrade consuming apps to `react-native-nitro-modules >=0.36.0 <0.37.0` (install `react-native-nitro-modules@0.36.5`).
- Reinstall iOS pods and rebuild native apps after upgrading.
- Keep the JavaScript date API unchanged from v3.x.

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

## [0.1.0] - 2024-XX-XX

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
- Configuration: `configure()`, `getConfig()`, `resetConfig()`, `getDefaultTimezone()`, `formatInDefaultTimezone()`, `formatDateInDefaultTimezone()`, `formatDateTimeInDefaultTimezone()`, `toDefaultTimezone()`
- Async batch operations: `parseManyAsync()`, `formatManyAsync()`, `getComponentsManyAsync()`
- TypeScript types: `DateComponents`, `TimeUnit`, `NativeDateConfig`
- C++ implementation with Nitro Modules for native performance
- Full IANA timezone support via bundled timezone data
- Example app with demo and benchmark screens
- Comprehensive test suite (146 tests)
- Performance benchmarks vs date-fns and dayjs

### Performance

- Native C++ implementation with JSI bindings
- Async batch operations run on background thread
- Minimal bridge overhead with Nitro Modules
- Benchmark results show 2-22x improvement over date-fns/dayjs for various operations

[Unreleased]: https://github.com/bbernag/react-native-date/compare/v4.0.0...HEAD
[4.0.0]: https://github.com/bbernag/react-native-date/compare/v3.0.0...v4.0.0
[3.0.0]: https://github.com/bbernag/react-native-date/compare/v2.0.0...v3.0.0
[0.1.0]: https://github.com/bbernag/react-native-date/releases/tag/v0.1.0
