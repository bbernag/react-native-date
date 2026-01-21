# Release Notes v2.0.0

## Highlights

This major release brings **timezone-aware predicates**, **consistent local time handling**, a **comprehensive test suite** with 923 Jest tests and 194 device tests, and **Expo compatibility**.

---

## Breaking Changes

### 1. `parse()` Now Uses Local Time for Date-Only Strings

```typescript
// v1.x - UTC midnight
parse('2024-06-15')  // → 2024-06-15T00:00:00Z

// v2.0 - Local midnight
parse('2024-06-15')  // → 2024-06-15T00:00:00 in user's timezone
```

**Migration:** If you need UTC parsing, append `Z`:
```typescript
parse('2024-06-15T00:00:00Z')  // Still parses as UTC
```

### 2. Getter Functions Now Return Local Time

All getters now use local time components:
- `getYear()`, `getMonth()`, `getDate()`, `getDay()`
- `getHours()`, `getMinutes()`, `getSeconds()`, `getMilliseconds()`
- `getComponents()`

**Migration:** Use `formatUTC()` if you need UTC representations:
```typescript
const utcString = formatUTC(timestamp, 'yyyy-MM-dd HH:mm:ss');
```

---

## New Features

### Timezone-Aware Predicates (8 new functions)

Native C++ functions for timezone-specific date operations:

```typescript
// Check if date is today/tomorrow/yesterday in a specific timezone
isTodayInTz(date, 'America/New_York')
isTomorrowInTz(date, 'Asia/Tokyo')
isYesterdayInTz(date, 'Europe/London')

// Compare dates in a specific timezone
isSameDayInTz(date1, date2, 'UTC')
isSameMonthInTz(date1, date2, 'America/Los_Angeles')
isSameYearInTz(date1, date2, 'Europe/Paris')

// Get day boundaries in a specific timezone
startOfDayInTz(date, 'Asia/Tokyo')      // Returns UTC timestamp for midnight in Tokyo
endOfDayInTz(date, 'America/New_York')  // Returns UTC timestamp for 23:59:59.999 in NY
```

### Timezone Offset Utility

```typescript
getOffsetInTimezone(date, timezone)  // Get timezone offset in minutes for a specific date
```

### Expo Compatibility

- Full support for Expo Dev Client
- Works with Expo SDK 54+
- Requires `npx expo prebuild` (not Expo Go)

---

## Bug Fixes

### Fixed `startOfMonth()` / `endOfMonth()` Timezone Issues

```typescript
// v1.x - In CST (UTC-6), January 1 midnight local was returning December 31
startOfMonth(parse('2024-01-15'))  // ❌ Returned Dec 31, 2023

// v2.0 - Uses local time components consistently
startOfMonth(parse('2024-01-15'))  // ✅ Returns Jan 1, 2024 midnight local
```

### Fixed `endOf()` Functions

- `endOf('month')` - Now correctly returns last day of month
- `endOf('year')` - Now correctly returns Dec 31
- `endOf('week')` - Now correctly returns Saturday
- `endOf('day')` - Now uses local time

### Fixed `tryParse()` for Invalid Strings

```typescript
// v1.x - Invalid strings returned garbage timestamps
tryParse('invalid-date')  // ❌ Returned random number

// v2.0 - Validates format before parsing
tryParse('invalid-date')  // ✅ Returns null
tryParse('2024-06-15')    // ✅ Returns timestamp
```

### Fixed `toISOString()` Output

Now uses `formatUTC()` to ensure proper UTC output with 'Z' suffix.

### Fixed Async Functions Local Time Consistency

`formatManyAsync()` and `getComponentsManyAsync()` now use local time, consistent with sync versions.

---

## Test Coverage

### Jest Tests: 923 passing

| Suite | Tests |
|-------|-------|
| Core | 45 |
| Arithmetic | 92 |
| Boundaries | 156 |
| Comparisons | 48 |
| Predicates | 67 |
| Setters | 34 |
| Timezone | 19 |
| Async | 12 |
| Standards | 35 |
| Library Comparison | ~100 |
| Benchmarks | ~315 |

### Device Tests: 194 tests

Run on real devices via the example app's Test tab.

---

## Migration Guide

### From v1.x to v2.0

1. **Date-only parsing behavior changed:**
   ```typescript
   // If you relied on UTC parsing for date-only strings:
   // Before
   const ts = parse('2024-06-15');  // Was UTC midnight

   // After - explicitly use UTC if needed
   const ts = parse('2024-06-15T00:00:00Z');  // UTC midnight
   // Or
   const ts = parse('2024-06-15');  // Now local midnight
   ```

2. **Getter functions return local time:**
   ```typescript
   // If you expected UTC values from getters,
   // use formatUTC() instead for UTC representations
   const utcString = formatUTC(timestamp, 'yyyy-MM-dd HH:mm:ss');
   ```

3. **New InTz functions available:**
   ```typescript
   import { isTodayInTz, startOfDayInTz } from '@bernagl/react-native-date';
   ```

---

## Installation

```bash
npm install @bernagl/react-native-date@2.0.0
# or
yarn add @bernagl/react-native-date@2.0.0
```

### iOS
```bash
cd ios && pod install
```

### Expo
```bash
npx expo prebuild --clean
npx expo run:ios
```

---

## Full Changelog

See [CHANGELOG_v2.md](./CHANGELOG_v2.md) for detailed commit history and file changes.
