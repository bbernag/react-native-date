import { getNative } from './native';

/**
 * Returns the current timestamp in milliseconds since Unix epoch (UTC)
 * Uses native C++ std::chrono::system_clock
 */
export function now(): number {
  return getNative().now();
}
