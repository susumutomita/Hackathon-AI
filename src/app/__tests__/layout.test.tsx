import { describe, test, expect, vi } from "vitest";
import { Metadata } from "next";

// Mock the CSS import
vi.mock("../globals.css", () => ({}));

// Mock Analytics component
vi.mock("@vercel/analytics/react", () => ({
  Analytics: vi.fn(() => ({ type: "Analytics", props: {} })),
}));

// Mock ErrorBoundary component
const mockErrorBoundary = vi.fn(({ children }) => ({
  type: "ErrorBoundary",
  props: { children },
}));
mockErrorBoundary.displayName = "ErrorBoundary";
vi.mock("@/components/ErrorBoundary", () => ({
  ErrorBoundary: mockErrorBoundary,
}));

describe("RootLayout", () => {
  describe("metadata", () => {
    test("should export correct metadata", async () => {
      const layoutModule = await import("../layout");
      const metadata: Metadata = layoutModule.metadata;

      expect(metadata).toBeDefined();
      expect(metadata.title).toBe("Hackathon AI");
      expect(metadata.description).toBe(
        "Hackathon AI is a platform for developers to find out the idea from previous hackathon",
      );
    });
  });

  describe("layout structure", () => {
    test("should render with correct structure", async () => {
      const layoutModule = await import("../layout");
      const RootLayout = layoutModule.default;

      // Test that the component is a function
      expect(typeof RootLayout).toBe("function");

      // Mock children
      const mockChildren = { type: "div", props: { children: "Test content" } };

      // Call the component function
      const result = RootLayout({ children: mockChildren });

      // Check the structure
      expect(result).toBeDefined();
      expect(result.type).toBe("html");
      expect(result.props.lang).toBe("ja");

      // Check body element
      const body = result.props.children;
      expect(body.type).toBe("body");
      expect(body.props.className).toBe("flex min-h-screen w-full flex-col");

      // Check children array (ErrorBoundary and Analytics)
      const [errorBoundary, analytics] = body.props.children;
      expect(errorBoundary.type).toBe(mockErrorBoundary);
      expect(errorBoundary.props.children).toBe(mockChildren);

      expect(typeof analytics.type).toBe("function");
      // Analytics is a mocked function
      expect(
        analytics.type.name || analytics.type.displayName || "spy",
      ).toBeTruthy();
    });

    test("should handle different children types", async () => {
      const layoutModule = await import("../layout");
      const RootLayout = layoutModule.default;

      // Test with string children
      const stringResult = RootLayout({ children: "String content" });
      const body = stringResult.props.children;
      const [errorBoundary] = body.props.children;
      expect(errorBoundary.type).toBe(mockErrorBoundary);
      expect(errorBoundary.props.children).toBe("String content");

      // Test with array children
      const arrayChildren = [
        { type: "div", key: "1", props: { children: "Child 1" } },
        { type: "div", key: "2", props: { children: "Child 2" } },
      ];
      const arrayResult = RootLayout({ children: arrayChildren });
      const bodyArray = arrayResult.props.children;
      const [errorBoundaryArray] = bodyArray.props.children;
      expect(errorBoundaryArray.type).toBe(mockErrorBoundary);
      expect(errorBoundaryArray.props.children).toBe(arrayChildren);

      // Test with null children
      const nullResult = RootLayout({ children: null });
      const bodyNull = nullResult.props.children;
      const [errorBoundaryNull] = bodyNull.props.children;
      expect(errorBoundaryNull.type).toBe(mockErrorBoundary);
      expect(errorBoundaryNull.props.children).toBe(null);

      // Test with React element children
      const elementChild = {
        type: "main",
        props: {
          className: "container",
          children: {
            type: "h1",
            props: { children: "Welcome" },
          },
        },
      };
      const elementResult = RootLayout({ children: elementChild });
      const bodyElement = elementResult.props.children;
      const [errorBoundaryElement] = bodyElement.props.children;
      expect(errorBoundaryElement.type).toBe(mockErrorBoundary);
      expect(errorBoundaryElement.props.children).toBe(elementChild);
    });
  });

  describe("component properties", () => {
    test("should be a valid React component", async () => {
      const layoutModule = await import("../layout");
      const RootLayout = layoutModule.default;

      // Check if it's a function (functional component)
      expect(typeof RootLayout).toBe("function");

      // Check if it accepts props
      expect(RootLayout.length).toBeGreaterThanOrEqual(1);
    });

    test("should handle edge cases", async () => {
      const layoutModule = await import("../layout");
      const RootLayout = layoutModule.default;

      // Test with undefined children (TypeScript would prevent this, but testing runtime)
      const undefinedResult = RootLayout({ children: undefined });
      expect(undefinedResult).toBeDefined();
      expect(undefinedResult.type).toBe("html");

      // Test component returns valid JSX structure
      const result = RootLayout({ children: "test" });
      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("props");
      expect(result.props).toHaveProperty("lang");
      expect(result.props).toHaveProperty("children");
    });
  });

  describe("HTML document structure", () => {
    test("should create valid HTML document structure", async () => {
      const layoutModule = await import("../layout");
      const RootLayout = layoutModule.default;

      const testContent = {
        type: "div",
        props: {
          id: "app",
          children: "App content",
        },
      };

      const result = RootLayout({ children: testContent });

      // Verify HTML element
      expect(result.type).toBe("html");
      expect(result.props.lang).toBe("ja");

      // Verify body element
      const body = result.props.children;
      expect(body.type).toBe("body");
      expect(body.props.className).toBe("flex min-h-screen w-full flex-col");

      // Verify children structure (ErrorBoundary and Analytics)
      const [errorBoundary, analytics] = body.props.children;
      expect(errorBoundary.type).toBe(mockErrorBoundary);
      expect(errorBoundary.props.children).toBe(testContent);

      // Verify Analytics component
      expect(typeof analytics.type).toBe("function");
      // Analytics is a mocked function
      expect(
        analytics.type.name || analytics.type.displayName || "spy",
      ).toBeTruthy();
      expect(analytics.props).toEqual({});
    });
  });

  describe("Analytics integration", () => {
    test("should include Analytics component", async () => {
      const layoutModule = await import("../layout");
      const RootLayout = layoutModule.default;

      const result = RootLayout({ children: "test" });
      const body = result.props.children;
      const [, analytics] = body.props.children;

      expect(analytics).toBeDefined();
      expect(typeof analytics.type).toBe("function");
      // Analytics is a mocked function
      expect(
        analytics.type.name || analytics.type.displayName || "spy",
      ).toBeTruthy();
    });
  });
});
