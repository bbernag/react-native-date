# Release Notes v4.0.0

## Highlights

This release upgrades the native Nitro integration to the Nitro Modules 0.36 line while keeping the JavaScript date API unchanged from v3.x.

The package now builds and publishes with:

- `react-native-nitro-modules` 0.36.5 for development and example validation
- `nitrogen` 0.36.5 for generated native specs
- `react-native-nitro-modules >=0.36.0 <0.37.0` as the public peer dependency

## Breaking Changes

### Nitro Modules 0.36.x Is Required

Consumers must install a Nitro Modules 0.36 release. Older Nitro Modules 0.35 releases are no longer compatible with this package version.

```bash
npm install @bernagl/react-native-date@4.0.0 react-native-nitro-modules@0.36.5
# or
yarn add @bernagl/react-native-date@4.0.0 react-native-nitro-modules@0.36.5
```

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

Expo Go is not supported because this package includes native code.

## Compatibility Notes

- No JavaScript date API changes were introduced in v4.0.0.
- Existing v3.x parsing, formatting, timezone, locale, chain, and async APIs remain unchanged.
- The version bump is major because the native Nitro peer dependency changed.
- The peer range intentionally stops before Nitro Modules 0.37 until that line is validated.
- Nitrogen 0.36.5 emits the same 17 files as Nitrogen 0.35.7 for the current spec (byte-identical generated tree; no native glue changes).

## Validation

Release validation included:

- `corepack yarn install` with a single `react-native-nitro-modules@0.36.5` resolution (`yarn why`)
- `yarn workspace @bernagl/react-native-date prepare` (Nitrogen 0.36.5 + bob)
- `diff -rq` of generated `nitrogen/` against a Nitrogen 0.35.7 tree: empty (17 files)
- TypeScript check for `@bernagl/react-native-date`
- ESLint for `@bernagl/react-native-date`
- Jest suite: 912 tests passing
- Example `pod install` (CocoaPods 1.16.2): NativeDate 4.0.0, NitroModules 0.36.5

Native iOS simulator / Android Gradle builds were left to integration (not run in this change).
