module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1', '^@modules/(.*)$': '<rootDir>/modules/$1' },
};
