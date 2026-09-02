# Locales

The library uses native platform APIs for localization, ensuring accurate month names, day names, and formatting that respects device settings.

## How It Works

```
JavaScript API
      ↓
C++ Cache (fast lookups)
      ↓
Native Platform APIs
```

When `setLocale()` is called, the library fetches all localized strings **once** from native APIs and caches them in C++. Subsequent formatting uses cached data with no bridge overhead.

### Platform APIs

| Platform | Classes |
|----------|---------|
| iOS | [`NSLocale`](https://developer.apple.com/documentation/foundation/nslocale), [`NSDateFormatter`](https://developer.apple.com/documentation/foundation/nsdateformatter) |
| Android | [`java.util.Locale`](https://developer.android.com/reference/java/util/Locale), [`DateFormatSymbols`](https://developer.android.com/reference/java/text/DateFormatSymbols) |

**iOS** uses [`NSDateFormatter`](https://developer.apple.com/documentation/foundation/nsdateformatter) symbols:
- [`monthSymbols`](https://developer.apple.com/documentation/foundation/nsdateformatter/1415016-monthsymbols)
- [`shortMonthSymbols`](https://developer.apple.com/documentation/foundation/nsdateformatter/1408066-shortmonthsymbols)
- [`weekdaySymbols`](https://developer.apple.com/documentation/foundation/nsdateformatter/1411087-weekdaysymbols)
- [`shortWeekdaySymbols`](https://developer.apple.com/documentation/foundation/nsdateformatter/1409335-shortweekdaysymbols)

**Android** uses [`DateFormatSymbols`](https://developer.android.com/reference/java/text/DateFormatSymbols):
- [`getMonths()`](https://developer.android.com/reference/java/text/DateFormatSymbols#getMonths())
- [`getShortMonths()`](https://developer.android.com/reference/java/text/DateFormatSymbols#getShortMonths())
- [`getWeekdays()`](https://developer.android.com/reference/java/text/DateFormatSymbols#getWeekdays())
- [`getShortWeekdays()`](https://developer.android.com/reference/java/text/DateFormatSymbols#getShortWeekdays())

---

## Default Behavior

::: tip Zero config
If `setLocale()` is **never called**, the device locale is loaded on first use. Localized tokens such as `MMMM` work immediately. The `"Locale not set"` error from earlier versions is gone.
:::

```typescript
import { getLocale, format } from '@bernagl/react-native-date';

getLocale();              // Canonical hyphenated tag, e.g. "en" or "en-US"
format(Date.now(), 'MMMM'); // Month in the device language
```

`setLocale` accepts both `pt_BR` and `pt-BR` (and `pt-br`). `getLocale()` then returns the **canonical hyphenated** identifier from the device list (`pt-BR`). Unknown or unsafe tags return `false` and do not change the locale.

Month and day names are always **Gregorian**, even when the locale's default calendar is Islamic or Hebrew (`ar-SA` + `MMMM` is a Gregorian Arabic month).

---

## API

```typescript
import {
  getLocale,
  setLocale,
  getAvailableLocales,
  getLocaleDisplayName,
  getLocaleInfo,
  getAvailableLocalesInfo
} from '@bernagl/react-native-date';
```

| Function | Description |
|----------|-------------|
| `getLocale()` | Current locale code |
| `setLocale(code)` | Set locale, returns `true` on success |
| `getAvailableLocales()` | Object of available locales |
| `getLocaleDisplayName(code)` | English name for locale |
| `getLocaleInfo(code)` | Full locale details |
| `getAvailableLocalesInfo()` | Array of all locale details |

---

## Setting a Locale

```typescript
setLocale('es'); // Spanish
setLocale('fr'); // French
setLocale('ja'); // Japanese
setLocale('pt_BR'); // Portuguese (Brazil)
```

::: warning Performance
Set locale **once** at app startup. Each call refreshes the cache from native APIs.
:::

---

## Locale Info

```typescript
type LocaleInfo = {
  code: string;         // "pt-BR" (canonical hyphenated tag)
  languageCode: string; // "pt"
  regionCode: string;   // "BR"
  displayName: string;  // "Portuguese (Brazil)"
  nativeName: string;   // "Português (Brasil)" — in that locale's language
};
```

```typescript
getLocaleInfo('es');
// { code: 'es', languageCode: 'es', displayName: 'Spanish', nativeName: 'Español' }

getLocaleDisplayName('ja'); // "Japanese"
```

---

## Localized Tokens

| Token | en | es | ja |
|-------|----|----|-----|
| `MMMM` | November | noviembre | 11月 |
| `MMM` | Nov | nov | 11月 |
| `M` | N | n | narrow name (not `11`) |
| `EEEE` | Sunday | domingo | 日曜日 |
| `EEE` | Sun | dom | 日 |

```typescript
setLocale('es');
format(Date.now(), 'EEEE, d MMMM yyyy');
// "domingo, 30 noviembre 2025"

setLocale('ja');
format(Date.now(), 'yyyy年MM月d日 EEEE');
// "2025年11月30日 日曜日"
```

---

## Common Locales

| Code | Language |
|------|----------|
| `en` | English |
| `es` | Spanish |
| `fr` | French |
| `de` | German |
| `it` | Italian |
| `pt` | Portuguese |
| `ja` | Japanese |
| `zh` | Chinese |
| `ko` | Korean |
| `ar` | Arabic |
| `ru` | Russian |
| `hi` | Hindi |

### Regional Variants

```typescript
setLocale('en_US');   // true; getLocale() → "en-US"
setLocale('en-GB');   // English (United Kingdom)
setLocale('pt_BR');   // true; getLocale() → "pt-BR"
setLocale('zh-Hans'); // Chinese (Simplified)
setLocale('zh-Hant'); // Chinese (Traditional)
```

---

## Locale Picker Example

```typescript
import { getAvailableLocalesInfo, setLocale } from '@bernagl/react-native-date';

function LocalePicker() {
  const locales = getAvailableLocalesInfo();

  return (
    <FlatList
      data={locales}
      keyExtractor={(item) => item.code}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => setLocale(item.code)}>
          <Text>{item.displayName}</Text>
          <Text>{item.nativeName}</Text>
        </TouchableOpacity>
      )}
    />
  );
}
```

---

## Best Practices

1. You do not have to call `setLocale()` — the device locale is the default
2. If the app has a language switcher, call `setLocale` once when it changes
3. Use `getAvailableLocales()` to verify support (`locales.es` is truthy when present)
4. Test RTL locales (Arabic, Hebrew) if needed; month names stay Gregorian
