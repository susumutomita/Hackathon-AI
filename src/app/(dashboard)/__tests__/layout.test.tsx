import { describe, test, expect, vi } from "vitest";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Home: () => <svg data-icon="home" />,
  LineChart: () => <svg data-icon="line-chart" />,
  Package: () => <svg data-icon="package" />,
  PanelLeft: () => <svg data-testid="panel-left" data-icon="panel-left" />,
  Settings: () => <svg data-icon="settings" />,
}));

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, className, size, variant }: any) => (
    <button className={className} data-size={size} data-variant={variant}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: any) => (
    <div data-testid="sheet" data-component="sheet">
      {children}
    </div>
  ),
  SheetContent: ({ children, side, className }: any) => (
    <div
      data-testid="sheet-content"
      data-component="sheet-content"
      data-side={side}
      className={className}
    >
      {children}
    </div>
  ),
  SheetTrigger: ({ asChild, children }: any) => (
    <div
      data-testid="sheet-trigger"
      data-component="sheet-trigger"
      data-as-child={asChild}
    >
      {children}
    </div>
  ),
}));

// Mock Analytics
vi.mock("@vercel/analytics/react", () => ({
  Analytics: () => <div data-component="analytics" />,
}));

// Mock Providers
vi.mock("@/app/(dashboard)/providers", () => ({
  default: ({ children }: any) => (
    <div data-component="providers">{children}</div>
  ),
}));

describe("DashboardLayout", () => {
  test("should export default layout component", async () => {
    const layoutModule = await import("../layout");
    expect(layoutModule.default).toBeDefined();
    expect(typeof layoutModule.default).toBe("function");
  });

  test("should render layout with children", async () => {
    const layoutModule = await import("../layout");
    const DashboardLayout = layoutModule.default;

    const testChildren = <div data-testid="test-content">Test Content</div>;
    const component = DashboardLayout({ children: testChildren }) as any;

    // Check root structure
    expect(component.type).toBeDefined();

    // The actual structure is Providers > div > (div + Analytics)
    const mainWrapper = component.props.children;
    expect(mainWrapper.type).toBe("div");
    expect(mainWrapper.props.className).toBe(
      "flex min-h-screen w-full flex-col bg-muted/40",
    );

    // Check inner structure - first child is the content div
    const innerDiv = mainWrapper.props.children[0];
    expect(innerDiv.type).toBe("div");
    expect(innerDiv.props.className).toBe(
      "flex flex-col sm:gap-4 sm:py-4 sm:pl-14",
    );

    // Check header
    const header = innerDiv.props.children[0];
    expect(header.type).toBe("header");
    expect(header.props.className).toContain("sticky top-0 z-30");

    // Check main content area
    const mainContent = innerDiv.props.children[1];
    expect(mainContent.type).toBe("main");
    expect(mainContent.props.className).toContain(
      "grid flex-1 items-start gap-2",
    );
    expect(mainContent.props.children).toEqual(testChildren);

    // Check Analytics
    const analytics = mainWrapper.props.children[1];
    expect(analytics.type.name).toBe("Analytics");
  });

  test("should render MobileNav in header", async () => {
    const layoutModule = await import("../layout");
    const DashboardLayout = layoutModule.default;

    const component = DashboardLayout({ children: null }) as any;

    const mainWrapper = component.props.children;
    const innerDiv = mainWrapper.props.children[0];
    const header = innerDiv.props.children[0];
    const mobileNav = header.props.children;

    // MobileNav should be rendered
    expect(mobileNav).toBeDefined();
  });

  test("MobileNav should render Sheet with trigger button", async () => {
    const layoutModule = await import("../layout");
    const DashboardLayout = layoutModule.default;

    const component = DashboardLayout({ children: <div>Test</div> }) as any;

    // Navigate to MobileNav
    const mainWrapper = component.props.children;
    const innerDiv = mainWrapper.props.children[0];
    const header = innerDiv.props.children[0];
    const mobileNav = header.props.children;

    // Call MobileNav to get its rendered output
    const mobileNavRendered = mobileNav.type();

    // Verify the complete structure
    expect(mobileNavRendered.type.name).toBe("Sheet");

    // Check SheetTrigger and Button
    const sheetTrigger = mobileNavRendered.props.children[0];
    const button = sheetTrigger.props.children;

    expect(button.props.size).toBe("icon");
    expect(button.props.variant).toBe("outline");
    expect(button.props.className).toBe("sm:hidden");

    // Check button contains PanelLeft icon and sr-only text
    const [icon, srText] = button.props.children;
    expect(icon.type.name).toBe("PanelLeft");
    expect(icon.props.className).toBe("h-5 w-5");
    expect(srText.props.className).toBe("sr-only");
    expect(srText.props.children).toBe("Toggle Menu");

    // Check SheetContent
    const sheetContent = mobileNavRendered.props.children[1];
    expect(sheetContent.props.side).toBe("left");
    expect(sheetContent.props.className).toBe("sm:max-w-xs");

    // Check nav element
    const nav = sheetContent.props.children;
    expect(nav.type).toBe("nav");
    expect(nav.props.className).toBe("grid gap-6 text-lg font-medium");
  });

  test("MobileNav component structure", async () => {
    // Direct test of MobileNav component
    const layoutModule = await import("../layout");

    // Access MobileNav through the module
    const component = layoutModule.default({ children: null }) as any;
    const mainWrapper = component.props.children;
    const innerDiv = mainWrapper.props.children[0];
    const header = innerDiv.props.children[0];
    const mobileNav = header.props.children;

    // Verify MobileNav is a function component
    expect(typeof mobileNav.type).toBe("function");
    expect(mobileNav.type.name).toBe("MobileNav");

    // Call MobileNav to get its rendered output
    const mobileNavRendered = mobileNav.type();

    // Check Sheet component
    expect(mobileNavRendered.type.name).toBe("Sheet");
    expect(mobileNavRendered.props.children).toHaveLength(2);

    // Check SheetTrigger
    const sheetTrigger = mobileNavRendered.props.children[0];
    expect(sheetTrigger.type.name).toBe("SheetTrigger");
    expect(sheetTrigger.props.asChild).toBe(true);

    // Check Button inside SheetTrigger
    const button = sheetTrigger.props.children;
    expect(button.type.name).toBe("Button");
    expect(button.props.size).toBe("icon");
    expect(button.props.variant).toBe("outline");
    expect(button.props.className).toBe("sm:hidden");

    // Check button children
    const buttonChildren = button.props.children;
    expect(buttonChildren).toHaveLength(2);
    expect(buttonChildren[0].type.name).toBe("PanelLeft");
    expect(buttonChildren[0].props.className).toBe("h-5 w-5");
    expect(buttonChildren[1].type).toBe("span");
    expect(buttonChildren[1].props.className).toBe("sr-only");
    expect(buttonChildren[1].props.children).toBe("Toggle Menu");

    // Check SheetContent
    const sheetContent = mobileNavRendered.props.children[1];
    expect(sheetContent.type.name).toBe("SheetContent");
    expect(sheetContent.props.side).toBe("left");
    expect(sheetContent.props.className).toBe("sm:max-w-xs");

    // Check nav inside SheetContent
    const nav = sheetContent.props.children;
    expect(nav.type).toBe("nav");
    expect(nav.props.className).toBe("grid gap-6 text-lg font-medium");
  });

  test("should handle different children types", async () => {
    const layoutModule = await import("../layout");
    const DashboardLayout = layoutModule.default;

    // Test with multiple children
    const multipleChildren = (
      <>
        <div>Child 1</div>
        <div>Child 2</div>
      </>
    );

    const component1 = DashboardLayout({ children: multipleChildren }) as any;
    const mainContent1 =
      component1.props.children.props.children[0].props.children[1];
    expect(mainContent1.props.children).toEqual(multipleChildren);

    // Test with string children
    const component2 = DashboardLayout({ children: "Text content" }) as any;
    const mainContent2 =
      component2.props.children.props.children[0].props.children[1];
    expect(mainContent2.props.children).toBe("Text content");

    // Test with null children
    const component3 = DashboardLayout({ children: null }) as any;
    const mainContent3 =
      component3.props.children.props.children[0].props.children[1];
    expect(mainContent3.props.children).toBe(null);
  });

  test("should apply correct responsive classes", async () => {
    const layoutModule = await import("../layout");
    const DashboardLayout = layoutModule.default;

    const component = DashboardLayout({ children: null }) as any;

    const mainWrapper = component.props.children;
    const innerDiv = mainWrapper.props.children[0];
    const header = innerDiv.props.children[0];
    const mainContent = innerDiv.props.children[1];

    // Check responsive classes on header
    expect(header.props.className).toContain("sm:static");
    expect(header.props.className).toContain("sm:h-auto");
    expect(header.props.className).toContain("sm:border-0");
    expect(header.props.className).toContain("sm:bg-transparent");
    expect(header.props.className).toContain("sm:px-6");

    // Check responsive classes on main content
    expect(mainContent.props.className).toContain("sm:px-6");
    expect(mainContent.props.className).toContain("sm:py-0");
    expect(mainContent.props.className).toContain("md:gap-4");

    // Check responsive classes on inner div
    expect(innerDiv.props.className).toContain("sm:gap-4");
    expect(innerDiv.props.className).toContain("sm:py-4");
    expect(innerDiv.props.className).toContain("sm:pl-14");
  });
});
