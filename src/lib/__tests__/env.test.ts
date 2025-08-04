import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  validateEnv,
  getEnvVar,
  getOptionalEnvVar,
  isProduction,
  isDevelopment,
  resetEnvCache,
} from "../env";

describe("Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    // Reset the cached environment
    resetEnvCache();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    resetEnvCache();
  });

  describe("validateEnv", () => {
    it("should validate development environment with minimal variables", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";

      expect(() => validateEnv()).not.toThrow();
    });

    it("should require NOMIC_API_KEY in production", () => {
      process.env.NODE_ENV = "production";
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.QD_URL = "http://localhost:6333";
      process.env.QD_API_KEY = "test-key";
      delete process.env.NOMIC_API_KEY;

      expect(() => validateEnv()).toThrow(
        "Environment validation failed: NOMIC_API_KEY: Required",
      );
    });

    it("should validate QD_URL format", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      process.env.QD_URL = "invalid-url";

      expect(() => validateEnv()).toThrow();
    });

    it("should use default values for optional variables", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      delete process.env.QD_URL;

      const env = validateEnv();
      expect(env.QD_URL).toBe("http://localhost:6333");
    });

    it("should allow test environment", () => {
      process.env.NODE_ENV = "test";
      process.env.NEXT_PUBLIC_ENVIRONMENT = "test";

      expect(() => validateEnv()).not.toThrow();
    });
  });

  describe("getEnvVar", () => {
    it("should return validated environment variable", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      process.env.QD_URL = "http://test:6333";

      const url = getEnvVar("QD_URL");
      expect(url).toBe("http://test:6333");
    });

    it("should throw for missing required variable", () => {
      process.env.NODE_ENV = "production";
      process.env.NEXT_PUBLIC_ENVIRONMENT = "production";
      process.env.QD_URL = "http://localhost:6333";
      process.env.QD_API_KEY = "test-key";
      delete process.env.NOMIC_API_KEY;

      expect(() => getEnvVar("NOMIC_API_KEY")).toThrow();
    });
  });

  describe("getOptionalEnvVar", () => {
    it("should return default value for missing optional variable", () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_ENVIRONMENT = "development";
      delete process.env.QD_API_KEY;

      const apiKey = getOptionalEnvVar("QD_API_KEY", "default-key");
      expect(apiKey).toBe("default-key");
    });
  });

  describe("environment detection", () => {
    it("should detect production environment", () => {
      process.env.NODE_ENV = "production";
      expect(isProduction()).toBe(true);
    });

    it("should detect development environment", () => {
      process.env.NODE_ENV = "development";
      expect(isDevelopment()).toBe(true);
    });
  });
});
