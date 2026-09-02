// Pin the process timezone so date-only and local-time assertions are deterministic
// regardless of the developer's or CI runner's zone (see audit H-03).
process.env.TZ = 'UTC';

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__', '<rootDir>/benchmarks'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/benchmarks/**/*.test.ts'],
  // Benchmarks are opt-in via `yarn benchmark`; they measure the JS mock, not native code.
  testPathIgnorePatterns: ['/node_modules/', '/benchmarks/'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '^react-native-nitro-modules$':
      '<rootDir>/__tests__/__mocks__/react-native-nitro-modules.ts',
  },
};
