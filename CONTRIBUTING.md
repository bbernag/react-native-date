# Contributing

Yarn 4 monorepo. The published library lives in `packages/native-date`.

## Setup

```sh
corepack enable
corepack prepare yarn@4.11.0 --activate
yarn install
```

Node 22 (see the root `.nvmrc`). Do not add nested lockfiles; the root `yarn.lock` is the only one.

## Checks

From the repo root:

```sh
yarn workspace @bernagl/react-native-date typecheck
yarn workspace @bernagl/react-native-date lint
yarn workspace @bernagl/react-native-date test          # Jest (JS mock of Nitro)
yarn workspace @bernagl/react-native-date test:cpp      # doctest + ctest for the C++ core
yarn workspace @bernagl/react-native-date test:cpp:asan # same with ASan/UBSan (Linux CI)
yarn workspace @bernagl/react-native-date prepare       # Nitrogen + bob
yarn docs:build                                         # VitePress
```

Jest never executes native code. C++ changes need `test:cpp`. Platform helpers (JNI / Objective-C++) need the example apps.

## Example apps

| App | Path | Notes |
|-----|------|--------|
| Bare RN 0.81 | `packages/example` | Benchmark tab and Native Test tab |
| Shared screens | `packages/native-date-examples` | Used by both apps |
| Expo Dev Client | `packages/expo-example` | Not Expo Go; `npx expo prebuild` then `expo run:ios` / `run:android` |

```sh
yarn workspace @rn-packages/native-date-example ios
yarn workspace @rn-packages/native-date-example android
```

iOS needs CocoaPods (`bundle exec pod install` in `packages/example/ios`). Minimums: iOS 15.1, Xcode 16.1, Android API 24.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `perf:`, `chore:`, `ci:`). `commitlint` runs on `commit-msg`.

## Release

Publishing is tag-driven. There are no `release:patch` / `release:minor` / `release:major` scripts.

1. Land the change on the default branch.
2. Push a `v*` tag (or run the **Release** workflow via `workflow_dispatch`).
3. `.github/workflows/release.yml` runs `yarn workspace @bernagl/react-native-date release` then `npm publish --access public --provenance`.

The package peer is `react-native-nitro-modules >=0.36.0 <0.37.0` (dev pin `0.36.5`).
