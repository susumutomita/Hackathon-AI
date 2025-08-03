import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock React hooks
const mockUseEffect = vi.fn((fn: Function, deps: any[]) => {
  fn(); // Execute the effect immediately
});
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useEffect: mockUseEffect,
  };
});

// Mock logger.client
vi.mock("@/lib/logger.client", () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock useErrorHandler hook
const mockReportError = vi.fn();
vi.mock("@/components/ErrorBoundary", () => ({
  useErrorHandler: () => ({ reportError: mockReportError }),
}));

describe("ErrorComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should export default component", async () => {
    const errorModule = await import("../error");
    expect(errorModule.default).toBeDefined();
    expect(typeof errorModule.default).toBe("function");
  });

  test("should render error message", async () => {
    const errorModule = await import("../error");
    const ErrorComponent = errorModule.default;

    const mockError = new Error("Test error message");
    const mockReset = vi.fn();

    const component = ErrorComponent({
      error: mockError,
      reset: mockReset,
    }) as any;

    // Check structure
    expect(component.type).toBe("main");
    expect(component.props.className).toBe("p-4 md:p-6");

    // Check heading
    const div = component.props.children;
    expect(div.type).toBe("div");
    expect(div.props.className).toBe("mb-8 space-y-4");

    // Check that div has multiple children (icon, text, buttons, etc)
    expect(Array.isArray(div.props.children)).toBe(true);
    const [iconDiv, textDiv] = div.props.children;

    // Check icon div
    expect(iconDiv.type).toBe("div");
    expect(iconDiv.props.className).toContain(
      "flex items-center justify-center",
    );

    // Check text div contains h1
    expect(textDiv.type).toBe("div");
    expect(textDiv.props.className).toBe("text-center");
    const h1 = textDiv.props.children[0];
    expect(h1.type).toBe("h1");
    expect(h1.props.className).toContain("font-semibold text-lg md:text-2xl");
    expect(h1.props.children).toBe("予期しないエラーが発生しました");
  });

  test("should call useEffect with error", async () => {
    const errorModule = await import("../error");
    const ErrorComponent = errorModule.default;

    const mockError = new Error("Test error");
    const mockReset = vi.fn();

    ErrorComponent({
      error: mockError,
      reset: mockReset,
    });

    // Check useEffect was called
    expect(mockUseEffect).toHaveBeenCalled();

    // Check logger.error was called
    const loggerModule = await import("@/lib/logger.client");
    expect(loggerModule.default.error).toHaveBeenCalledWith(
      "Next.js Error Boundary triggered",
      expect.objectContaining({
        error: expect.objectContaining({
          name: mockError.name,
          message: mockError.message,
        }),
      }),
    );

    // Check reportError was called
    expect(mockReportError).toHaveBeenCalledWith(mockError, {
      digest: undefined,
    });
  });

  test("should handle error with digest property", async () => {
    const errorModule = await import("../error");
    const ErrorComponent = errorModule.default;

    const mockError = new Error("Test error with digest") as Error & {
      digest?: string;
    };
    mockError.digest = "ERROR_DIGEST_123";

    const mockReset = vi.fn();

    ErrorComponent({
      error: mockError,
      reset: mockReset,
    });

    // Check logger was called with error details
    const loggerModule = await import("@/lib/logger.client");
    expect(loggerModule.default.error).toHaveBeenCalledWith(
      "Next.js Error Boundary triggered",
      expect.objectContaining({
        error: expect.objectContaining({
          digest: "ERROR_DIGEST_123",
        }),
      }),
    );

    // Check reportError was called with digest
    expect(mockReportError).toHaveBeenCalledWith(mockError, {
      digest: "ERROR_DIGEST_123",
    });
  });

  test("should handle different error types", async () => {
    const errorModule = await import("../error");
    const ErrorComponent = errorModule.default;

    // Test with TypeError
    const typeError = new TypeError("Type error test");
    ErrorComponent({
      error: typeError,
      reset: vi.fn(),
    });

    // Check logger was called with TypeError
    const loggerModule = await import("@/lib/logger.client");
    expect(loggerModule.default.error).toHaveBeenCalledWith(
      "Next.js Error Boundary triggered",
      expect.objectContaining({
        error: expect.objectContaining({
          name: "TypeError",
          message: "Type error test",
        }),
      }),
    );

    // Clear mock calls
    vi.clearAllMocks();

    // Test with ReferenceError
    const refError = new ReferenceError("Reference error test");
    ErrorComponent({
      error: refError,
      reset: vi.fn(),
    });

    expect(loggerModule.default.error).toHaveBeenCalledWith(
      "Next.js Error Boundary triggered",
      expect.objectContaining({
        error: expect.objectContaining({
          name: "ReferenceError",
          message: "Reference error test",
        }),
      }),
    );
  });

  test("should re-run effect when error changes", async () => {
    const errorModule = await import("../error");
    const ErrorComponent = errorModule.default;

    const error1 = new Error("First error");
    const error2 = new Error("Second error");
    const mockReset = vi.fn();

    // First render
    ErrorComponent({
      error: error1,
      reset: mockReset,
    });

    expect(mockUseEffect).toHaveBeenCalledWith(expect.any(Function), [
      error1,
      mockReportError,
    ]);

    // Second render with different error
    ErrorComponent({
      error: error2,
      reset: mockReset,
    });

    expect(mockUseEffect).toHaveBeenCalledWith(expect.any(Function), [
      error2,
      mockReportError,
    ]);
  });
});
