/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { 
      tsconfig: 'tsconfig.json',
      useESM: true
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|@react-email|@auth0|oauth4webapi)/)'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Add timeout for database tests
  testTimeout: 10000,
  // Improve error reporting
  verbose: true,
  // Run tests in sequence for database tests to avoid connection issues
  maxWorkers: 1,
  // Mock React components and JSX to prevent parsing issues in node environment
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  // Global teardown to close database connections
  globalTeardown: '<rootDir>/tests/jest.teardown.js',
  // Detect open handles to help identify connection leaks
  detectOpenHandles: false,
  // Force exit after tests complete
  forceExit: true
};
