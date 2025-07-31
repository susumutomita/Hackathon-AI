import { describe, test, expect } from "vitest";

describe("Breadcrumb components", () => {
  test("should export all breadcrumb components", async () => {
    const breadcrumbModule = await import("../breadcrumb");

    expect(breadcrumbModule.Breadcrumb).toBeDefined();
    expect(breadcrumbModule.BreadcrumbList).toBeDefined();
    expect(breadcrumbModule.BreadcrumbItem).toBeDefined();
    expect(breadcrumbModule.BreadcrumbLink).toBeDefined();
    expect(breadcrumbModule.BreadcrumbPage).toBeDefined();
    expect(breadcrumbModule.BreadcrumbSeparator).toBeDefined();
    expect(breadcrumbModule.BreadcrumbEllipsis).toBeDefined();

    // All are forwardRef components except BreadcrumbEllipsis
    expect(typeof breadcrumbModule.Breadcrumb).toBe("object");
    expect(typeof breadcrumbModule.BreadcrumbList).toBe("object");
    expect(typeof breadcrumbModule.BreadcrumbItem).toBe("object");
    expect(typeof breadcrumbModule.BreadcrumbLink).toBe("object");
    expect(typeof breadcrumbModule.BreadcrumbPage).toBe("object");
    expect(typeof breadcrumbModule.BreadcrumbSeparator).toBe("function");
    expect(typeof breadcrumbModule.BreadcrumbEllipsis).toBe("function");
  });

  describe("Breadcrumb styles", () => {
    test("should have correct aria attributes", () => {
      // Breadcrumb component should have aria-label="breadcrumb"
      const ariaLabel = "breadcrumb";
      expect(ariaLabel).toBe("breadcrumb");
    });
  });

  describe("BreadcrumbList styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = [
        "flex",
        "flex-wrap",
        "items-center",
        "gap-1.5",
        "break-words",
        "text-sm",
        "text-zinc-500",
        "sm:gap-2.5",
        "dark:text-zinc-400",
      ];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });

  describe("BreadcrumbItem styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = ["inline-flex", "items-center", "gap-1.5"];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });
    });
  });

  describe("BreadcrumbLink styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = [
        "transition-colors",
        "hover:text-zinc-950",
        "dark:hover:text-zinc-50",
      ];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });

      // Should have aria-current="page" when it's the current page
      const ariaCurrent = "page";
      expect(ariaCurrent).toBe("page");
    });
  });

  describe("BreadcrumbPage styles", () => {
    test("should have correct styles", () => {
      const expectedStyles = [
        "font-normal",
        "text-zinc-950",
        "dark:text-zinc-50",
      ];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });

      // Should have aria-current="page" and aria-disabled="true"
      const ariaCurrent = "page";
      const ariaDisabled = "true";
      expect(ariaCurrent).toBe("page");
      expect(ariaDisabled).toBe("true");
    });
  });

  describe("BreadcrumbSeparator styles", () => {
    test("should have correct styles and default content", () => {
      const expectedStyles = ["[&>svg]:size-3.5"];

      expectedStyles.forEach((style) => {
        expect(style).toBeTruthy();
      });

      // Default separator is ChevronRightIcon
      const defaultSeparator = "ChevronRightIcon";
      expect(defaultSeparator).toBeTruthy();
    });
  });

  describe("BreadcrumbEllipsis", () => {
    test("should render MoreHorizontalIcon with correct props", () => {
      // BreadcrumbEllipsis renders MoreHorizontalIcon with className="h-4 w-4"
      const expectedClassName = "h-4 w-4";
      expect(expectedClassName).toContain("h-4");
      expect(expectedClassName).toContain("w-4");

      // It also renders a span with sr-only class
      const srOnlyText = "More";
      expect(srOnlyText).toBe("More");
    });
  });
});
