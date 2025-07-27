import { describe, test, expect } from "vitest";
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
});
