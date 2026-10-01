# Release Notes v4.0.0

## Highlights

This release upgrades the native integration to Nitro Modules 0.37 while keeping the JavaScript date API unchanged from v3.x.

The package now builds and publishes with:

- `react-native-nitro-modules` 0.37.1 for development and example validation
- `nitrogen` 0.37.1 for generated native specs
- `react-native-nitro-modules >=0.37.0 <0.38.0` as the public peer dependency

## Breaking Changes

### Nitro Modules 0.37.x Is Required

Consumers must install a Nitro Modules 0.37 release. Nitro Modules 0.35.x and 0.36.x are no longer compatible with this package version.

```bash
npm install @bernagl/react-native-date@4.0.0 react-native-nitro-modules@0.37.1
# or
yarn add @bernagl/react-native-date@4.0.0 react-native-nitro-modules@0.37.1
```

## Migration Guide

1. Upgrade the packages:

   ```bash
   npm install @bernagl/react-native-date@4.0.0 react-native-nitro-modules@0.37.1
   # or
   yarn add @bernagl/react-native-date@4.0.0 react-native-nitro-modules@0.37.1
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
- The peer range intentionally stops before Nitro Modules 0.38 until that line is validated.
- Nitrogen 0.37.1 generates byte-identical native code for the current spec as Nitrogen 0.35.7.
- Nitro Modules 0.36 and 0.37 change only the Nitro View pipeline and Kotlin/JNI internals; `NativeDate` is a plain C++ HybridObject and needs no source changes.
