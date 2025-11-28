# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/bbernag/react-native-date/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/bbernag/react-native-date/releases/tag/v0.1.0
