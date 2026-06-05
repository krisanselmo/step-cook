import type { Config } from 'jest';

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  preset: 'ts-jest', // Use ts-jest for TypeScript
  moduleNameMapper: {
    // Handle module aliases (if you have them)
    '^@/(.*)$': '<rootDir>/$1',
    // Handle CSS imports (with CSS modules)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  modulePathIgnorePatterns: ['<rootDir>/private/', '<rootDir>/.next/'],
  transform: {
    // Use ts-jest to transform TypeScript files
    '^.+\\.(ts|tsx)$': 'ts-jest',
    // Use babel-jest for JavaScript/JSX files
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/private/', '/e2e/'], // e2e = Playwright
};

const jestConfig: Config = customJestConfig;

export default jestConfig;
