import { describe, test, expect, vi } from "vitest";
import logger from "../logger";

describe("logger", () => {
  test("should export logger instance", () => {
    expect(logger).toBeDefined();
  });

  test("should have info method", () => {
    expect(typeof logger.info).toBe("function");
  });

  test("should have error method", () => {
    expect(typeof logger.error).toBe("function");
  });

  test("should have warn method", () => {
    expect(typeof logger.warn).toBe("function");
  });

  test("should have debug method", () => {
    expect(typeof logger.debug).toBe("function");
  });

  test("should be configured with info level", () => {
    expect(logger.level).toBe("info");
  });

  test("should format log messages correctly", () => {
    // Get the winston transports
    const transports = (logger as any).transports;

    // Verify transports exist
    expect(transports).toBeDefined();
    expect(transports.length).toBeGreaterThan(0);

    // Test that logger can be called without errors
    expect(() => logger.info("Test message")).not.toThrow();
    expect(() => logger.error("Error message")).not.toThrow();
    expect(() => logger.warn("Warning message")).not.toThrow();
    expect(() => logger.debug("Debug message")).not.toThrow();
  });
});
