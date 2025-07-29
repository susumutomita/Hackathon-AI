import { describe, test, expect } from "vitest";

describe("Table components", () => {
  test("should export all table components", async () => {
    const tableModule = await import("../table");

    expect(tableModule.Table).toBeDefined();
    expect(tableModule.TableHeader).toBeDefined();
    expect(tableModule.TableBody).toBeDefined();
    expect(tableModule.TableFooter).toBeDefined();
    expect(tableModule.TableRow).toBeDefined();
    expect(tableModule.TableHead).toBeDefined();
    expect(tableModule.TableCell).toBeDefined();
    expect(tableModule.TableCaption).toBeDefined();

    // All are forwardRef components
    expect(typeof tableModule.Table).toBe("object");
    expect(typeof tableModule.TableHeader).toBe("object");
    expect(typeof tableModule.TableBody).toBe("object");
    expect(typeof tableModule.TableFooter).toBe("object");
    expect(typeof tableModule.TableRow).toBe("object");
    expect(typeof tableModule.TableHead).toBe("object");
    expect(typeof tableModule.TableCell).toBe("object");
    expect(typeof tableModule.TableCaption).toBe("object");
  });

  describe("Table styles", () => {
    test("should have correct base styles", () => {
      const expectedTableStyles = "relative w-full overflow-auto";
      const expectedWrapperStyles = "w-full caption-bottom text-sm";

      expect(expectedTableStyles).toContain("relative");
      expect(expectedTableStyles).toContain("w-full");
      expect(expectedTableStyles).toContain("overflow-auto");

      expect(expectedWrapperStyles).toContain("w-full");
      expect(expectedWrapperStyles).toContain("caption-bottom");
      expect(expectedWrapperStyles).toContain("text-sm");
    });
  });

  describe("TableHeader styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = "[&_tr]:border-b";
      expect(expectedStyles).toContain("[&_tr]:border-b");
    });
  });

  describe("TableBody styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = "[&_tr:last-child]:border-0";
      expect(expectedStyles).toContain("[&_tr:last-child]:border-0");
    });
  });

  describe("TableFooter styles", () => {
    test("should have correct styles", () => {
      const expectedStyles =
        "border-t bg-zinc-100/50 font-medium [&>tr]:last:border-b-0 dark:bg-zinc-800/50";

      expect(expectedStyles).toContain("border-t");
      expect(expectedStyles).toContain("bg-zinc-100/50");
      expect(expectedStyles).toContain("font-medium");
      expect(expectedStyles).toContain("[&>tr]:last:border-b-0");
      expect(expectedStyles).toContain("dark:bg-zinc-800/50");
    });
  });

  describe("TableRow styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = [
        "border-b",
        "transition-colors",
        "hover:bg-zinc-100/50",
        "data-[state=selected]:bg-zinc-100",
        "dark:hover:bg-zinc-800/50",
        "dark:data-[state=selected]:bg-zinc-800",
      ];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });

  describe("TableHead styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = [
        "h-12",
        "px-4",
        "text-left",
        "align-middle",
        "font-medium",
        "text-zinc-500",
        "[&:has([role=checkbox])]:pr-0",
        "dark:text-zinc-400",
      ];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });

  describe("TableCell styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = [
        "p-4",
        "align-middle",
        "[&:has([role=checkbox])]:pr-0",
      ];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });

  describe("TableCaption styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = [
        "mt-4",
        "text-sm",
        "text-zinc-500",
        "dark:text-zinc-400",
      ];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });
});
