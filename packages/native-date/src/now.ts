import { getNative } from './native';

/**
 * Current timestamp in milliseconds since the Unix epoch (UTC).
 *
 * Read from the native system clock (`std::chrono::system_clock`),
 * so it agrees with the timestamps produced by every other function here.
 */
export function now(): number {
  return getNative().now();
}
