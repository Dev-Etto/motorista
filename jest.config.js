module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/'],
  testTimeout: 15000,
  moduleNameMapper: {
    '^@(app|application|config|data|domain|features|shared)/(.*)$': '<rootDir>/src/$1/$2',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
  },
};
