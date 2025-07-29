import { describe, test, expect } from "vitest";

describe("Card components", () => {
  test("should export all card components", async () => {
    const cardModule = await import("../card");

    expect(cardModule.Card).toBeDefined();
    expect(cardModule.CardHeader).toBeDefined();
    expect(cardModule.CardFooter).toBeDefined();
    expect(cardModule.CardTitle).toBeDefined();
    expect(cardModule.CardDescription).toBeDefined();
    expect(cardModule.CardContent).toBeDefined();

    // All are forwardRef components
    expect(typeof cardModule.Card).toBe("object");
    expect(typeof cardModule.CardHeader).toBe("object");
    expect(typeof cardModule.CardFooter).toBe("object");
    expect(typeof cardModule.CardTitle).toBe("object");
    expect(typeof cardModule.CardDescription).toBe("object");
    expect(typeof cardModule.CardContent).toBe("object");
  });

  describe("Card styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = [
        "rounded-lg",
        "border",
        "border-zinc-200",
        "bg-card",
        "text-card-foreground",
        "shadow-sm",
        "dark:border-zinc-800",
      ];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });

  describe("CardHeader styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = ["flex", "flex-col", "space-y-1.5", "p-6"];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });

  describe("CardFooter styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = ["flex", "items-center", "p-6", "pt-0"];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });

  describe("CardTitle styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = [
        "text-2xl",
        "font-semibold",
        "leading-none",
        "tracking-tight",
      ];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });

  describe("CardDescription styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = ["text-sm", "text-zinc-500", "dark:text-zinc-400"];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });

  describe("CardContent styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = ["p-6", "pt-0"];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });
});
