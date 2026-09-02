import { NitroModules } from 'react-native-nitro-modules';

import type { NativeDate } from './NativeDate.nitro';

let instance: NativeDate | undefined;

const UNAVAILABLE_MESSAGE =
  '@bernagl/react-native-date: the native module could not be created. ' +
  'This library requires a development build with native code ' +
  '(not Expo Go / web). Rebuild the app after installing the package.';

/**
 * Returns the native `NativeDate` HybridObject, creating it on first use.
 *
 * Nothing native runs at import time: the HybridObject is created the first time
 * any function of this library is called, then cached for the process lifetime.
 *
 * @throws Error with setup guidance if the native module is unavailable
 * (for example in Expo Go, on web, or before the app was rebuilt).
 */
export function getNative(): NativeDate {
  if (instance !== undefined) return instance;
  try {
    instance = NitroModules.createHybridObject<NativeDate>('NativeDate');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${UNAVAILABLE_MESSAGE} (${detail})`);
  }
  return instance;
}

/**
 * Direct access to the native C++ module (advanced / internal).
 *
 * Kept for backwards compatibility. It is a lazily-initialized proxy: the first
 * property access creates the HybridObject via {@link getNative}. Methods obtained
 * through it are bound to the native instance, which costs one extra allocation per
 * access, so prefer the exported functions (`parse`, `format`, ...) in hot paths.
 * Its surface follows the internal Nitro spec and is not covered by semver.
 *
 * @example
 * ```typescript
 * import { NativeDateModule } from '@bernagl/react-native-date';
 *
 * const timestamp = NativeDateModule.parse('2024-12-25');
 * const formatted = NativeDateModule.format(timestamp, 'yyyy-MM-dd');
 * ```
 */
export const NativeDateModule: NativeDate = new Proxy({} as NativeDate, {
  get(_target, property) {
    const native = getNative();
    const value = Reflect.get(native, property, native);
    return typeof value === 'function' ? value.bind(native) : value;
  },
  has(_target, property) {
    return Reflect.has(getNative(), property);
  },
  ownKeys() {
    return Reflect.ownKeys(getNative());
  },
  getOwnPropertyDescriptor(_target, property) {
    const descriptor = Reflect.getOwnPropertyDescriptor(getNative(), property);
    return descriptor === undefined
      ? undefined
      : { ...descriptor, configurable: true };
  },
});
