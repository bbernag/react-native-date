// Jest setup file
// Add any global test configuration here

export {};

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
