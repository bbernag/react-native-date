# Release Notes v4.0.0

## Highlights

This release upgrades the native Nitro integration to the Nitro Modules 0.36 line **and** aligns the public date contract with the C++ core: strict parsing, a single error policy, calendar arithmetic, validated time zones, and a lazy native binding.

The package now builds and publishes with:

- `react-native-nitro-modules` 0.36.5 for development and example validation
- `nitrogen` 0.36.5 for generated native specs
- `react-native-nitro-modules >=0.36.0 <0.37.0` as the public peer dependency

Toolchain: React Native **0.81+**, iOS **15.1+**, Xcode **16.1+**, Android API **24+**.

## Breaking Changes

### Nitro Modules 0.36.x Is Required

Consumers must install a Nitro Modules 0.36 release. Older Nitro Modules 0.35 releases are no longer compatible with this package version.

```bash
npm install @bernagl/react-native-date@4.0.0 react-native-nitro-modules@0.36.5
# or
yarn add @bernagl/react-native-date@4.0.0 react-native-nitro-modules@0.36.5
```

### Strict parsing

`parse()` (and every `DateInput` string) uses a strict ISO-8601 grammar. Invalid calendars, incomplete times, `24:00`, lowercase `t`/`z`, trailing characters, and strings longer than 128 characters **throw**. Date-only strings remain **local midnight**. Date-only with `Z` / `±offset` is UTC midnight shifted by the offset.

`parseFormat` requires the whole pattern and whole input to be consumed. Format token `M` is a narrow **month name**; parse token `M` is a **number**.

Non-ISO strings that `Date.parse` used to accept (`'Dec 25, 2024'`) now throw. `toTimestamp` no longer calls `Date.parse`.

### Error policy

| API | Invalid input |
|-----|----------------|
| `parse*` / `format*` / getters / arithmetic / timezone values | throw |
| `tryParse` / `tryParseFormat` | `null` |
| Batch async | `NaN` / `""` per element |
| `is*` predicates | `false` |
| Unknown timezone name | throw |
| `min([])` / `max([])` | throw |

`isValid` is finite **and** within ±8.64e15 ms. `formatDistance` / `formatDuration` throw on `NaN` / `Infinity`.

### Calendar math and clamp

`addDays` / `addWeeks` keep the wall clock across DST (calendar days, not 24 h). `addMonths` / `addYears` **clamp** to the last valid day (Jan 31 + 1 month = Feb 29/28). Day/week/month/year amounts must be whole numbers.

### Timezone validation

Unknown zone names throw (no silent fallback). `toTimezone` is still a **shifted epoch for `formatUTC`**, not a converted instant — prefer `formatInTimezone`. `toUTC` is a deprecated identity. Offsets are east-positive minutes.

### Lazy native binding

The HybridObject is created on first call, not at import. Expo Go / web throw then:

> This library requires a development build with native code (not Expo Go / web).

### Other caller-visible changes

- Zero-config device locale (the `"Locale not set"` error is gone).
- `formatDistance(date, { addSuffix: false })` returns the bare quantity. Options-object overload added; positional form kept.
- `formatManyAsync` uses the full formatter (`'MMMM d'` → `"June 15"`). Batches > 100000 throw.
- Chain `JSON.stringify` is an ISO UTC string; setters clamp like the functional API.
- Publish is tag-driven with provenance; `release:patch` / `minor` / `major` scripts are gone.

## Migration Guide

1. Upgrade the packages:

   ```bash
   npm install @bernagl/react-native-date@4.0.0 react-native-nitro-modules@0.36.5
   # or
   yarn add @bernagl/react-native-date@4.0.0 react-native-nitro-modules@0.36.5
   ```

2. Reinstall iOS pods:

   ```bash
   cd ios
   pod install
   ```

3. Rebuild the native app:

   ```bash
   npx react-native run-ios
   npx react-native run-android
   ```

4. For Expo Dev Client apps, prebuild before running:

   ```bash
   npx expo prebuild --clean
   npx expo run:ios
   npx expo run:android
   ```

5. Audit call sites:

   - Wrap or replace `parse` of untrusted input; use `tryParse` when you want `null`.
   - Stop passing non-ISO strings.
   - Replace `toUTC` with nothing (or `formatUTC` for display).
   - Prefer `formatInTimezone` over `toTimezone`.
   - Expect month-end clamp and calendar `addDays`.
   - Do not call `setLocale` only to silence a missing-locale error.

Expo Go is not supported because this package includes native code.

## Compatibility Notes

- The version bump is major because the Nitro peer **and** the date contract changed.
- The peer range intentionally stops before Nitro Modules 0.37 until that line is validated.
- Nitrogen 0.36.5 emits the same 17 files as Nitrogen 0.35.7 for the current spec (byte-identical generated tree at the Nitro upgrade; later v4 commits added `isToday` / `isTomorrow` / `isYesterday` to the spec).
- Full semantics: [docs/semantics](https://bbernag.github.io/react-native-date/semantics).

## Validation

Release validation included:

- `corepack yarn install` with a single `react-native-nitro-modules@0.36.5` resolution (`yarn why`)
- `yarn workspace @bernagl/react-native-date prepare` (Nitrogen 0.36.5 + bob)
- `diff -rq` of generated `nitrogen/` against a Nitrogen 0.35.7 tree at the upgrade commit: empty (17 files)
- TypeScript check, ESLint, Jest (JS mock; `TZ=UTC`)
- C++ doctest suite (`test:cpp`) with sanitizers on Ubuntu CI
- Example `pod install` (CocoaPods 1.16.2): NativeDate 4.0.0, NitroModules 0.36.5

Native iOS simulator / Android Gradle builds and the in-app NativeTestScreen are integration gates on `audit/stack`.
