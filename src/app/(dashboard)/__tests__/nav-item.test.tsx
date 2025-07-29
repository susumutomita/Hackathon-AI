import { describe, test, expect, vi } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ href, className, children }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock UI components
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children, side }: any) => (
    <div data-side={side}>{children}</div>
  ),
  TooltipTrigger: ({ asChild, children }: any) => <div>{children}</div>,
}));

// Mock clsx
vi.mock("clsx", () => ({
  default: (...args: any[]) => {
    const classes: string[] = [];
    args.forEach((arg: any) => {
      if (typeof arg === "string") {
        classes.push(arg);
      } else if (typeof arg === "object") {
        Object.entries(arg).forEach(([key, value]) => {
          if (value) classes.push(key);
        });
      }
    });
    return classes.join(" ");
  },
}));

describe("NavItem", () => {
  test("should export NavItem component", async () => {
    const navItemModule = await import("../nav-item");
    expect(navItemModule.NavItem).toBeDefined();
    expect(typeof navItemModule.NavItem).toBe("function");
  });

  test("should render with default state", async () => {
    const { usePathname } = await import("next/navigation");
    (usePathname as any).mockReturnValue("/dashboard");

    const navItemModule = await import("../nav-item");
    const { NavItem } = navItemModule;

    const component = NavItem({
      href: "/settings",
      label: "Settings",
      children: <span>⚙️</span>,
    }) as any;

    // Check structure
    expect(component.type.name).toBe("Tooltip");

    // Get the link inside
    const tooltipTrigger = component.props.children[0];
    const link = tooltipTrigger.props.children;

    expect(link.type).toBeDefined();
    expect(link.props.href).toBe("/settings");
    expect(link.props.className).toContain(
      "flex h-9 w-9 items-center justify-center rounded-lg",
    );
    expect(link.props.className).not.toContain("bg-accent text-black");

    // Check children
    const linkChildren = link.props.children;
    expect(linkChildren[0].type).toBe("span");
    expect(linkChildren[0].props.children).toBe("⚙️");
    expect(linkChildren[1].props.className).toBe("sr-only");
    expect(linkChildren[1].props.children).toBe("Settings");
  });

  test("should render with active state when pathname matches href", async () => {
    const { usePathname } = await import("next/navigation");
    (usePathname as any).mockReturnValue("/dashboard");

    const navItemModule = await import("../nav-item");
    const { NavItem } = navItemModule;

    const component = NavItem({
      href: "/dashboard",
      label: "Dashboard",
      children: <span>📊</span>,
    }) as any;

    // Get the link
    const tooltipTrigger = component.props.children[0];
    const link = tooltipTrigger.props.children;

    expect(link.props.className).toContain("bg-accent text-black");
  });

  test("should render tooltip content", async () => {
    const navItemModule = await import("../nav-item");
    const { NavItem } = navItemModule;

    const component = NavItem({
      href: "/profile",
      label: "User Profile",
      children: <span>👤</span>,
    }) as any;

    // Get tooltip content
    const tooltipContent = component.props.children[1];
    expect(tooltipContent.type.name).toBe("TooltipContent");
    expect(tooltipContent.props.side).toBe("right");
    expect(tooltipContent.props.children).toBe("User Profile");
  });

  test("should handle different pathnames", async () => {
    const { usePathname } = await import("next/navigation");

    // Test with different pathnames
    const testCases = [
      { pathname: "/", href: "/", shouldBeActive: true },
      { pathname: "/", href: "/dashboard", shouldBeActive: false },
      { pathname: "/settings", href: "/settings", shouldBeActive: true },
      {
        pathname: "/settings/profile",
        href: "/settings",
        shouldBeActive: false,
      },
    ];

    const navItemModule = await import("../nav-item");
    const { NavItem } = navItemModule;

    for (const testCase of testCases) {
      (usePathname as any).mockReturnValue(testCase.pathname);

      const component = NavItem({
        href: testCase.href,
        label: "Test",
        children: <span>T</span>,
      }) as any;

      const tooltipTrigger = component.props.children[0];
      const link = tooltipTrigger.props.children;

      if (testCase.shouldBeActive) {
        expect(link.props.className).toContain("bg-accent text-black");
      } else {
        expect(link.props.className).not.toContain("bg-accent text-black");
      }
    }
  });

  test("should apply correct hover styles", async () => {
    const navItemModule = await import("../nav-item");
    const { NavItem } = navItemModule;

    const component = NavItem({
      href: "/test",
      label: "Test",
      children: <span>T</span>,
    }) as any;

    const tooltipTrigger = component.props.children[0];
    const link = tooltipTrigger.props.children;

    expect(link.props.className).toContain("hover:text-foreground");
    expect(link.props.className).toContain("text-muted-foreground");
    expect(link.props.className).toContain("transition-colors");
  });

  test("should render different children types", async () => {
    const navItemModule = await import("../nav-item");
    const { NavItem } = navItemModule;

    // Test with text
    const textComponent = NavItem({
      href: "/text",
      label: "Text Link",
      children: "Text",
    }) as any;

    const textLink = textComponent.props.children[0].props.children;
    expect(textLink.props.children[0]).toBe("Text");

    // Test with JSX element
    const jsxComponent = NavItem({
      href: "/jsx",
      label: "JSX Link",
      children: <div data-test="icon">Icon</div>,
    }) as any;

    const jsxLink = jsxComponent.props.children[0].props.children;
    expect(jsxLink.props.children[0].type).toBe("div");
    expect(jsxLink.props.children[0].props["data-test"]).toBe("icon");
  });
});
