# Release Notes v3.0.0

## Highlights

This release upgrades the native Nitro integration to the Nitro Modules 0.35 line while keeping the JavaScript date API unchanged from v2.x.

The package now builds and publishes with:

- `react-native-nitro-modules` 0.35.7 for development and example validation
- `nitrogen` 0.35.7 for generated native specs
- `react-native-nitro-modules >=0.35.0 <0.36.0` as the public peer dependency

## Breaking Changes

### Nitro Modules 0.35.x Is Required

Consumers must install a Nitro Modules 0.35 release. Older Nitro Modules 0.31.x apps are no longer compatible with this package version.

```bash
npm install @bernagl/react-native-date@3.0.0 react-native-nitro-modules@0.35.7
# or
yarn add @bernagl/react-native-date@3.0.0 react-native-nitro-modules@0.35.7
```

## Migration Guide

1. Upgrade the packages:

   ```bash
   npm install @bernagl/react-native-date@3.0.0 react-native-nitro-modules@0.35.7
   # or
   yarn add @bernagl/react-native-date@3.0.0 react-native-nitro-modules@0.35.7
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

- No JavaScript date API changes were introduced in v3.0.0.
- Existing v2.x parsing, formatting, timezone, locale, chain, and async APIs remain unchanged.
- The version bump is major because the native Nitro peer dependency changed.
- The peer range intentionally stops before Nitro Modules 0.36 until that line is validated.

## Validation

Release validation included:

- TypeScript check for `@bernagl/react-native-date`
- Jest suite: 923 tests passing
- iOS example build on simulator
- iOS in-app native tests: 194/194 passing
- Android example debug build on emulator
- Android in-app native tests: 194/194 passing
