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
    'node_modules/(?!(uuid|@react-email)/)'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Add timeout for database tests
  testTimeout: 10000,
  // Improve error reporting
  verbose: true,
  // Run tests in sequence for database tests to avoid connection issues
  maxWorkers: 1
};
