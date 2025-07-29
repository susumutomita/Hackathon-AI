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

describe("ErrorComponent", () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
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

    const h1 = div.props.children;
    expect(h1.type).toBe("h1");
    expect(h1.props.className).toBe("font-semibold text-lg md:text-2xl");
    expect(h1.props.children).toBe("An error occurred");
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

    // Check console.error was called (useEffect executes immediately in our mock)
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
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

    expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
    expect(mockError.digest).toBe("ERROR_DIGEST_123");
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

    expect(consoleErrorSpy).toHaveBeenCalledWith(typeError);

    // Clear mock calls
    consoleErrorSpy.mockClear();

    // Test with ReferenceError
    const refError = new ReferenceError("Reference error test");
    ErrorComponent({
      error: refError,
      reset: vi.fn(),
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(refError);
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

    expect(mockUseEffect).toHaveBeenCalledWith(expect.any(Function), [error1]);

    // Second render with different error
    ErrorComponent({
      error: error2,
      reset: mockReset,
    });

    expect(mockUseEffect).toHaveBeenCalledWith(expect.any(Function), [error2]);
  });
});
