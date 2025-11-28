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

::: tip
If `setLocale()` is **never called**, the library uses the device's default locale automatically.
:::

```typescript
import { getLocale, format } from '@bernagl/react-native-date';

getLocale();              // Device default, e.g., "en"
format(Date.now(), 'MMMM'); // Month in device's language
```

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
  code: string;         // "pt_BR"
  languageCode: string; // "pt"
  regionCode: string;   // "BR"
  displayName: string;  // "Portuguese (Brazil)"
  nativeName: string;   // "Português (Brasil)"
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
| `EEEE` | Sunday | domingo | 日曜日 |
| `EEE` | Sun | dom | 日 |

```typescript
setLocale('es');
format(Date.now(), 'EEEE, d MMMM yyyy');
// "domingo, 30 noviembre 2025"

setLocale('ja');
format(Date.now(), 'yyyy年M月d日 EEEE');
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
setLocale('en_US'); // English (United States)
setLocale('en_GB'); // English (United Kingdom)
setLocale('pt_BR'); // Portuguese (Brazil)
setLocale('zh_Hans'); // Chinese (Simplified)
setLocale('zh_Hant'); // Chinese (Traditional)
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

1. Set locale once at app startup
2. Store user preference if app has language switcher
3. Use `getAvailableLocales()` to verify support
4. Test RTL locales (Arabic, Hebrew) if needed
