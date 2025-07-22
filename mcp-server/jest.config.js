/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: {
        moduleResolution: "node",
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      },
    },
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/test-*.ts",
    "!src/index.ts",
  ],
  // Note: Coverage thresholds are lower than ideal due to Jest's ESM module mocking limitations
  // Consider using Vitest or refactoring to use dependency injection for better testability
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 50,
      lines: 35,
      statements: 34,
    },
  },
};
