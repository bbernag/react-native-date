# react-native-date

The fastest date library for React Native. Powered by C++ and [Nitro Modules](https://nitro.margelo.com/) with zero-config localization.

## Is this library for you?

::: tip Perfect for
- Apps that **render many dates** (calendars, timelines, feeds, chat apps)
- Apps targeting **low-end devices** where JS performance matters
- Apps requiring **multiple locales** without bundle size bloat
- Apps that need **timezone conversions** at scale
:::

::: info Maybe not needed
If your app only formats a few dates occasionally, **date-fns or Day.js work fine**. This library shines when performance and localization are critical - rendering hundreds of dates, supporting many languages, or running smoothly on budget devices.
:::

## Why react-native-date?

### Zero-Config Localization

**No locale plugins. No imports. No bundles.** The library reads locales directly from the operating system.

| Library | Locale Support |
|---------|----------------|
| date-fns | Import each locale separately (~3KB per locale) |
| Day.js | Install `locale` plugin + import each locale |
| Moment.js | Import locales or full bundle (~300KB) |
| **react-native-date** | **Built-in. Reads from device OS. Zero config.** |

```typescript
import { format, setLocale } from '@bernagl/react-native-date';

// Works immediately - uses device's language
format(Date.now(), 'MMMM'); // "November" (or user's language)

// Or set explicitly - no imports needed
setLocale('ja');
format(Date.now(), 'MMMM'); // "11月"

setLocale('ar');
format(Date.now(), 'MMMM'); // "نوفمبر"
```

All 150+ locales supported by iOS/Android work out of the box.

### Native Performance

Built with C++ and [Nitro Modules](https://nitro.margelo.com/) for synchronous, near-native speed.

#### iPhone 14 Pro (ops/sec - higher is better)

<table class="benchmark-table">
<thead>
<tr><th>Operation</th><th>NativeDate</th><th>date-fns</th><th>Day.js</th><th>Luxon</th></tr>
</thead>
<tbody>
<tr><td><code>now()</code></td><td class="winner">445K <span class="speed-badge medium">3.2x</span></td><td>278K</td><td>214K</td><td>139K</td></tr>
<tr><td><code>parse()</code></td><td class="winner">2.0M <span class="speed-badge extreme">71x</span></td><td>94K</td><td>329K</td><td>28K</td></tr>
<tr><td><code>format()</code></td><td class="winner">771K <span class="speed-badge extreme">25x</span></td><td>31K</td><td>103K</td><td>34K</td></tr>
<tr><td><code>addDays()</code></td><td class="winner">1.7M <span class="speed-badge extreme">65x</span></td><td>612K</td><td>68K</td><td>26K</td></tr>
<tr><td><code>addMonths()</code></td><td>279K</td><td class="winner">400K <span class="speed-badge low">1.4x</span></td><td>32K</td><td>26K</td></tr>
<tr><td><code>diffInDays()</code></td><td class="winner">1.6M <span class="speed-badge extreme">200x</span></td><td>74K</td><td>104K</td><td>8K</td></tr>
<tr><td><code>startOfDay()</code></td><td class="winner">1.8M <span class="speed-badge extreme">31x</span></td><td>727K</td><td>136K</td><td>58K</td></tr>
<tr><td><code>endOfDay()</code></td><td class="winner">1.8M <span class="speed-badge extreme">164x</span></td><td>727K</td><td>136K</td><td>11K</td></tr>
<tr><td><code>isWeekend()</code></td><td class="winner">2.1M <span class="speed-badge extreme">16x</span></td><td>711K</td><td>383K</td><td>134K</td></tr>
<tr><td><code>isLeapYear()</code></td><td class="winner">1.8M <span class="speed-badge high">8.9x</span></td><td>693K</td><td>400K</td><td>202K</td></tr>
<tr><td><code>getComponents()</code></td><td class="winner">673K <span class="speed-badge high">4.6x</span></td><td>147K</td><td>296K</td><td>180K</td></tr>
<tr><td><code>addHours()</code></td><td class="winner">1.7M <span class="speed-badge extreme">65x</span></td><td>414K</td><td>158K</td><td>26K</td></tr>
<tr><td><code>addMinutes()</code></td><td class="winner">1.7M <span class="speed-badge extreme">65x</span></td><td>642K</td><td>158K</td><td>26K</td></tr>
<tr><td><code>addSeconds()</code></td><td class="winner">1.7M <span class="speed-badge extreme">65x</span></td><td>456K</td><td>159K</td><td>26K</td></tr>
<tr><td><code>formatUTC()</code></td><td class="winner">805K <span class="speed-badge extreme">45x</span></td><td>18K</td><td>80K</td><td>29K</td></tr>
<tr><td><code>formatInTZ()</code></td><td class="winner">400K <span class="speed-badge extreme">27x</span></td><td>19K</td><td>15K</td><td>23K</td></tr>
</tbody>
</table>

#### Low-End Android Device (ops/sec - higher is better)

<table class="benchmark-table">
<thead>
<tr><th>Operation</th><th>NativeDate</th><th>date-fns</th><th>Day.js</th><th>Luxon</th></tr>
</thead>
<tbody>
<tr><td><code>now()</code></td><td class="winner">530K <span class="speed-badge extreme">17x</span></td><td>162K</td><td>76K</td><td>32K</td></tr>
<tr><td><code>parse()</code></td><td class="winner">465K <span class="speed-badge extreme">116x</span></td><td>13K</td><td>46K</td><td>4K</td></tr>
<tr><td><code>format()</code></td><td class="winner">270K <span class="speed-badge extreme">54x</span></td><td>5K</td><td>16K</td><td>5K</td></tr>
<tr><td><code>addDays()</code></td><td class="winner">378K <span class="speed-badge extreme">95x</span></td><td>107K</td><td>10K</td><td>4K</td></tr>
<tr><td><code>addMonths()</code></td><td class="winner">80K <span class="speed-badge extreme">20x</span></td><td>69K</td><td>5K</td><td>4K</td></tr>
<tr><td><code>diffInDays()</code></td><td class="winner">351K <span class="speed-badge extreme">351x</span></td><td>13K</td><td>15K</td><td>1K</td></tr>
<tr><td><code>startOfDay()</code></td><td class="winner">392K <span class="speed-badge extreme">49x</span></td><td>130K</td><td>20K</td><td>8K</td></tr>
<tr><td><code>endOfDay()</code></td><td class="winner">396K <span class="speed-badge extreme">198x</span></td><td>129K</td><td>20K</td><td>2K</td></tr>
<tr><td><code>isWeekend()</code></td><td class="winner">445K <span class="speed-badge extreme">23x</span></td><td>128K</td><td>59K</td><td>19K</td></tr>
<tr><td><code>isLeapYear()</code></td><td class="winner">419K <span class="speed-badge extreme">14x</span></td><td>125K</td><td>70K</td><td>29K</td></tr>
<tr><td><code>getComponents()</code></td><td class="winner">141K <span class="speed-badge high">5.6x</span></td><td>25K</td><td>47K</td><td>27K</td></tr>
<tr><td><code>addHours()</code></td><td class="winner">367K <span class="speed-badge extreme">92x</span></td><td>75K</td><td>24K</td><td>4K</td></tr>
<tr><td><code>addMinutes()</code></td><td class="winner">377K <span class="speed-badge extreme">94x</span></td><td>113K</td><td>23K</td><td>4K</td></tr>
<tr><td><code>addSeconds()</code></td><td class="winner">376K <span class="speed-badge extreme">94x</span></td><td>81K</td><td>23K</td><td>4K</td></tr>
<tr><td><code>formatUTC()</code></td><td class="winner">292K <span class="speed-badge extreme">146x</span></td><td>2K</td><td>12K</td><td>4K</td></tr>
<tr><td><code>formatInTZ()</code></td><td class="winner">38K <span class="speed-badge extreme">225x</span></td><td>2K</td><td>169</td><td>973</td></tr>
</tbody>
</table>

::: tip Performance Summary
react-native-date wins **15/16** on iOS and **16/16** on Android. Only `addMonths()` loses to date-fns on iOS - we're actively working on optimizing this.
:::

::: warning Low-End Device Impact
The performance gap **widens significantly** on budget devices:
- `format()`: 25x faster on iOS → **54x faster** on Android
- `formatUTC()`: 45x faster on iOS → **146x faster** on Android

The native C++ implementation shines on low-end devices where JavaScript performance is constrained. Essential for apps targeting emerging markets.
:::

::: info Benchmark Methodology
Results obtained from the [example app](https://github.com/bbernag/react-native-date/tree/main/packages/native-date/example) using the **Benchmark** tab. Each operation runs 1,000 iterations to calculate ops/sec. Run the example app on your own device to verify results.
:::

### Familiar API

Works like [date-fns](https://date-fns.org/) or [Day.js](https://day.js.org/) - pick your style:

```typescript
// Functional (date-fns style)
import { format, addDays, startOfMonth } from '@bernagl/react-native-date';
format(addDays(Date.now(), 7), 'yyyy-MM-dd');

// Chainable (Day.js style)
import { nativeDate } from '@bernagl/react-native-date';
nativeDate().addDays(7).format('yyyy-MM-dd');
```

### Tree-Shakeable

The library is fully tree-shakeable. Only import what you need:

```typescript
// Only these functions are included in your bundle
import { format, addDays } from '@bernagl/react-native-date';
```

For optimal bundle size, the chainable API can be imported separately:

```typescript
// Functional API only (smaller bundle)
import { format, addDays } from '@bernagl/react-native-date';

// Chainable API (explicit import)
import { nativeDate } from '@bernagl/react-native-date/chain';
```

---

## Features

- **Fast** - C++ core, no bridge overhead, synchronous calls
- **Zero-config locales** - Reads from OS, no plugins or imports
- **150+ locales** - Every locale supported by iOS/Android
- **Timezone support** - Full IANA timezone database from the OS
- **Tiny footprint** - No locale bundles, minimal JS
- **Tree-shakeable** - Only bundle what you use
- **Type-safe** - Full TypeScript support
- **Two API styles** - Functional or chainable

---

## Requirements

| Platform | Minimum Version |
|----------|-----------------|
| iOS | 13.0+ |
| Android | API 24+ (Android 7.0) |
| React Native | 0.76+ (New Architecture) |

---

## Installation

```bash
npm install @bernagl/react-native-date react-native-nitro-modules
```

```bash
cd ios && pod install
```

No additional setup. No locale configuration. Just install and use.

---

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
// "Sunday, November 30, 2025" (or localized)

// Date math
const nextWeek = addDays(timestamp, 7);
diffInDays(nextWeek, timestamp); // 7

// Predicates
isToday(timestamp); // true

// Timezone (from device)
getTimezone(); // "America/New_York"

// Change locale (optional - defaults to device language)
setLocale('es');
format(timestamp, 'EEEE, d MMMM'); // "domingo, 30 noviembre"
```

---

## How Locales Work

The library uses native OS APIs - no JavaScript locale data needed:

| Platform | Native Classes |
|----------|----------------|
| iOS | [`NSLocale`](https://developer.apple.com/documentation/foundation/nslocale), [`NSDateFormatter`](https://developer.apple.com/documentation/foundation/nsdateformatter) |
| Android | [`java.util.Locale`](https://developer.android.com/reference/java/util/Locale), [`DateFormatSymbols`](https://developer.android.com/reference/java/text/DateFormatSymbols) |

**Default behavior:** If you never call `setLocale()`, the library automatically uses the device's language setting. Month names, day names, and formatting respect the user's preferences with zero configuration.

```typescript
// User's device is set to French
format(Date.now(), 'EEEE d MMMM yyyy');
// "dimanche 30 novembre 2025" - automatic!
```

---

## Next Steps

- [API Reference](./api-reference.md) - All functions
- [Examples](./examples.md) - Code samples
- [Locales](./locales.md) - Internationalization details
