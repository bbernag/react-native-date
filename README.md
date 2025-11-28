# react-native-date

The fastest date library for React Native. Native C++ performance with zero-config localization.

[![npm version](https://img.shields.io/npm/v/@bernagl/react-native-date.svg)](https://www.npmjs.com/package/@bernagl/react-native-date)
[![license](https://img.shields.io/npm/l/@bernagl/react-native-date.svg)](https://github.com/bbernag/react-native-date/blob/main/LICENSE)

> **Beta**: This library is in active development. APIs may change.

## Is this library for you?

**Perfect for:**
- Apps that **render many dates** (calendars, timelines, feeds, chat apps)
- Apps targeting **low-end devices** where JS performance matters
- Apps requiring **multiple locales** without bundle size bloat
- Apps that need **timezone conversions** at scale

**Maybe not needed:**
If your app only formats a few dates occasionally, **date-fns or Day.js work fine**. This library shines when performance and localization are critical.

## Why react-native-date?

### Zero-Config Localization

**No locale plugins. No imports. No bundles.** Reads locales directly from the OS.

| Library | Locale Support |
|---------|----------------|
| date-fns | Import each locale (~3KB each) |
| Day.js | Plugin + import each locale |
| Moment.js | Full bundle (~300KB) |
| **react-native-date** | **Built-in. Zero config.** |

```typescript
import { format, setLocale } from '@bernagl/react-native-date';

// Uses device language automatically
format(Date.now(), 'MMMM'); // "November" (or user's language)

// Or set explicitly - no imports needed
setLocale('ja');
format(Date.now(), 'MMMM'); // "11月"
```

All 150+ locales supported by iOS/Android work out of the box.

### Native Performance

Built with C++ and [Nitro Modules](https://nitro.margelo.com/) for synchronous, near-native speed.

**iPhone 14 Pro** (ops/sec - higher is better):

| Operation | Native | date-fns | Day.js | Luxon | Gain |
|-----------|--------|----------|--------|-------|------|
| `parse()` | **2.0M** | 94K | 329K | 28K | 🟢 21x |
| `format()` | **771K** | 31K | 103K | 34K | 🟢 25x |
| `diffInDays()` | **1.6M** | 74K | 104K | 8K | 🟢 22x |
| `formatUTC()` | **805K** | 18K | 80K | 29K | 🟢 45x |

**Low-End Android** (ops/sec - higher is better):

| Operation | Native | date-fns | Day.js | Luxon | Gain |
|-----------|--------|----------|--------|-------|------|
| `parse()` | **465K** | 13K | 46K | 4K | 🟢 35x |
| `format()` | **270K** | 5K | 16K | 5K | 🟢 54x |
| `diffInDays()` | **351K** | 13K | 15K | 1K | 🟢 27x |
| `formatUTC()` | **292K** | 2K | 12K | 4K | 🟢 146x |

> **Performance gap widens on budget devices:** `format()` is 25x faster on iOS but **54x faster** on low-end Android. The native C++ implementation shines where JavaScript is constrained. Essential for apps targeting emerging markets.

*Benchmarks from the [example app](./packages/native-date/example) Benchmark tab (1,000 iterations). We're actively working on optimizing `addMonths()` to win all 16 benchmarks.*

See [full benchmarks](https://bbernag.github.io/react-native-date/#native-performance) for all operations.

### Familiar API

Works like [date-fns](https://date-fns.org/) or [Day.js](https://day.js.org/):

```typescript
// Functional (date-fns style)
import { format, addDays } from '@bernagl/react-native-date';
format(addDays(Date.now(), 7), 'yyyy-MM-dd');

// Chainable (Day.js style)
import { nativeDate } from '@bernagl/react-native-date';
nativeDate().addDays(7).format('yyyy-MM-dd');
```

## Requirements

| Platform | Minimum Version |
|----------|-----------------|
| iOS | 13.0+ |
| Android | API 24+ (Android 7.0) |
| React Native | 0.76+ (New Architecture) |

## Installation

```bash
npm install @bernagl/react-native-date react-native-nitro-modules
```

```bash
cd ios && pod install
```

No additional setup required.

## Quick Start

```typescript
import {
  now,
  format,
  addDays,
  diffInDays,
  isToday,
  setLocale,
  getTimezone
} from '@bernagl/react-native-date';

// Current timestamp
const timestamp = now();

// Format (uses device locale automatically)
format(timestamp, 'EEEE, MMMM d, yyyy');

// Date math
const nextWeek = addDays(timestamp, 7);
diffInDays(nextWeek, timestamp); // 7

// Predicates
isToday(timestamp); // true

// Timezone
getTimezone(); // "America/New_York"

// Localization
setLocale('es');
format(timestamp, 'EEEE, d MMMM'); // "domingo, 30 noviembre"
```

## Features

- **Fast** - C++ core, no bridge overhead
- **Zero-config locales** - Reads from OS
- **150+ locales** - All iOS/Android locales
- **Timezone support** - Full IANA database
- **Tiny footprint** - No locale bundles
- **Type-safe** - Full TypeScript support
- **Two API styles** - Functional or chainable

## How Locales Work

Uses native OS APIs - no JavaScript locale data:

| Platform | Native Classes |
|----------|----------------|
| iOS | [NSLocale](https://developer.apple.com/documentation/foundation/nslocale), [NSDateFormatter](https://developer.apple.com/documentation/foundation/nsdateformatter) |
| Android | [java.util.Locale](https://developer.android.com/reference/java/util/Locale), [DateFormatSymbols](https://developer.android.com/reference/java/text/DateFormatSymbols) |

If `setLocale()` is never called, the library uses the device's language automatically.

## Documentation

Full documentation available at the [docs site](https://bbernag.github.io/react-native-date/).

- [API Reference](https://bbernag.github.io/react-native-date/api-reference)
- [Examples](https://bbernag.github.io/react-native-date/examples)
- [Locales](https://bbernag.github.io/react-native-date/locales)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT © [Luis Garcia](https://github.com/bbernag)
