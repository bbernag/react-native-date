// Jest setup file
// Add any global test configuration here

import { getNative } from '../src/native';

export {};

beforeEach(() => {
  // The mock locale is process-global per Jest worker; reset so files that
  // call setLocale cannot leak into format-token tests in other files.
  getNative().setLocale('en');
});

// Extend Jest matchers if needed
expect.extend({
  toBeValidTimestamp(received: number) {
    const pass =
      typeof received === 'number' && !isNaN(received) && isFinite(received);
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid timestamp`
          : `expected ${received} to be a valid timestamp`,
      pass,
    };
  },
});

// Type declaration for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidTimestamp(): R;
    }
  }
}
