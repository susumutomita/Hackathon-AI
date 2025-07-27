import { describe, test, expect } from "vitest";
import { cn } from "../utils";

describe("cn utility function", () => {
  test("should merge single class name", () => {
    expect(cn("foo")).toBe("foo");
  });

  test("should merge multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("should handle conditional classes", () => {
    expect(cn("foo", true && "bar", false && "baz")).toBe("foo bar");
  });

  test("should merge tailwind classes correctly", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  test("should handle array of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  test("should handle object notation", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  test("should handle undefined and null values", () => {
    expect(cn("foo", undefined, "bar", null)).toBe("foo bar");
  });

  test("should handle empty strings", () => {
    expect(cn("", "foo", "", "bar", "")).toBe("foo bar");
  });

  test("should merge complex tailwind utilities", () => {
    expect(cn("hover:bg-red-500", "hover:bg-blue-500")).toBe(
      "hover:bg-blue-500",
    );
  });

  test("should handle no arguments", () => {
    expect(cn()).toBe("");
  });

  test("should handle mixed input types", () => {
    expect(cn("foo", ["bar", "baz"], { qux: true, quux: false })).toBe(
      "foo bar baz qux",
    );
  });
});
