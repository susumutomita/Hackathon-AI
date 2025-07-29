import { describe, test, expect, vi } from "vitest";

// Mock UI components
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
}));

describe("Providers", () => {
  test("should export default component", async () => {
    const providersModule = await import("../providers");
    expect(providersModule.default).toBeDefined();
    expect(typeof providersModule.default).toBe("function");
  });

  test("should render TooltipProvider with children", async () => {
    const providersModule = await import("../providers");
    const Providers = providersModule.default;

    const testChildren = <div data-testid="test-child">Test Content</div>;
    const component = Providers({ children: testChildren }) as any;

    // Check that it renders TooltipProvider
    expect(component.type.name).toBe("TooltipProvider");
    expect(component.props.children).toEqual(testChildren);
  });

  test("should render multiple children", async () => {
    const providersModule = await import("../providers");
    const Providers = providersModule.default;

    const multipleChildren = (
      <>
        <div>Child 1</div>
        <div>Child 2</div>
        <span>Child 3</span>
      </>
    );

    const component = Providers({ children: multipleChildren }) as any;
    expect(component.props.children).toEqual(multipleChildren);
  });

  test("should render with null children", async () => {
    const providersModule = await import("../providers");
    const Providers = providersModule.default;

    const component = Providers({ children: null }) as any;
    expect(component.props.children).toBe(null);
  });

  test("should render with undefined children", async () => {
    const providersModule = await import("../providers");
    const Providers = providersModule.default;

    const component = Providers({ children: undefined }) as any;
    expect(component.props.children).toBe(undefined);
  });

  test("should render with text children", async () => {
    const providersModule = await import("../providers");
    const Providers = providersModule.default;

    const component = Providers({ children: "Text content" }) as any;
    expect(component.props.children).toBe("Text content");
  });

  test("should render with fragment children", async () => {
    const providersModule = await import("../providers");
    const Providers = providersModule.default;

    const fragmentChildren = (
      <>
        <header>Header</header>
        <main>Main Content</main>
        <footer>Footer</footer>
      </>
    );

    const component = Providers({ children: fragmentChildren }) as any;
    expect(component.props.children).toEqual(fragmentChildren);
  });
});
