import { describe, test, expect } from "vitest";

describe("Icons", () => {
  test("should export UsersIcon component", async () => {
    const iconsModule = await import("../icons");
    expect(iconsModule.UsersIcon).toBeDefined();
    expect(typeof iconsModule.UsersIcon).toBe("function");
  });

  test("should export SettingsIcon component", async () => {
    const iconsModule = await import("../icons");
    expect(iconsModule.SettingsIcon).toBeDefined();
    expect(typeof iconsModule.SettingsIcon).toBe("function");
  });

  test("should export SearchIcon component", async () => {
    const iconsModule = await import("../icons");
    expect(iconsModule.SearchIcon).toBeDefined();
    expect(typeof iconsModule.SearchIcon).toBe("function");
  });

  test("should export Spinner component", async () => {
    const iconsModule = await import("../icons");
    expect(iconsModule.Spinner).toBeDefined();
    expect(typeof iconsModule.Spinner).toBe("function");
  });

  test("should export Logo component", async () => {
    const iconsModule = await import("../icons");
    expect(iconsModule.Logo).toBeDefined();
    expect(typeof iconsModule.Logo).toBe("function");
  });

  test("should export VercelLogo component", async () => {
    const iconsModule = await import("../icons");
    expect(iconsModule.VercelLogo).toBeDefined();
    expect(typeof iconsModule.VercelLogo).toBe("function");
  });

  test("UsersIcon should render SVG with correct attributes", async () => {
    const { UsersIcon } = await import("../icons");

    const component = UsersIcon({
      className: "test-class",
      "data-testid": "users-icon",
    }) as any;

    expect(component.type).toBe("svg");
    expect(component.props.xmlns).toBe("http://www.w3.org/2000/svg");
    expect(component.props.width).toBe("24");
    expect(component.props.height).toBe("24");
    expect(component.props.viewBox).toBe("0 0 24 24");
    expect(component.props.fill).toBe("none");
    expect(component.props.stroke).toBe("currentColor");
    expect(component.props.strokeWidth).toBe("2");
    expect(component.props.strokeLinecap).toBe("round");
    expect(component.props.strokeLinejoin).toBe("round");
    expect(component.props.className).toBe("test-class");
    expect(component.props["data-testid"]).toBe("users-icon");
  });

  test("SettingsIcon should render SVG with correct attributes", async () => {
    const { SettingsIcon } = await import("../icons");

    const component = SettingsIcon({
      className: "settings-class",
    }) as any;

    expect(component.type).toBe("svg");
    expect(component.props.xmlns).toBe("http://www.w3.org/2000/svg");
    expect(component.props.width).toBe("24");
    expect(component.props.height).toBe("24");
    expect(component.props.viewBox).toBe("0 0 24 24");
    expect(component.props.fill).toBe("none");
    expect(component.props.stroke).toBe("currentColor");
    expect(component.props.strokeWidth).toBe("2");
    expect(component.props.className).toBe("settings-class");
  });

  test("SearchIcon should render SVG with correct attributes", async () => {
    const { SearchIcon } = await import("../icons");

    const component = SearchIcon({
      style: { color: "red" },
    }) as any;

    expect(component.type).toBe("svg");
    expect(component.props.xmlns).toBe("http://www.w3.org/2000/svg");
    expect(component.props.width).toBe("24");
    expect(component.props.height).toBe("24");
    expect(component.props.viewBox).toBe("0 0 24 24");
    expect(component.props.fill).toBe("none");
    expect(component.props.stroke).toBe("currentColor");
    expect(component.props.strokeWidth).toBe("2");
    expect(component.props.style).toEqual({ color: "red" });
  });

  test("Spinner should render div with correct structure", async () => {
    const { Spinner } = await import("../icons");

    const component = Spinner() as any;

    expect(component.type).toBe("div");
    expect(component.props.className).toBe(
      "absolute right-0 top-0 bottom-0 flex items-center justify-center",
    );
    expect(component.props["aria-busy"]).toBe("true");

    // Check inner SVG
    const svg = component.props.children;
    expect(svg.type).toBe("svg");
    expect(svg.props.className).toBe(
      "animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700",
    );
    expect(svg.props.xmlns).toBe("http://www.w3.org/2000/svg");
    expect(svg.props.fill).toBe("none");
    expect(svg.props.viewBox).toBe("0 0 24 24");
  });

  test("Logo should render SVG with correct structure", async () => {
    const { Logo } = await import("../icons");

    const component = Logo() as any;

    expect(component.type).toBe("svg");
    expect(component.props.width).toBe("32");
    expect(component.props.height).toBe("32");
    expect(component.props.viewBox).toBe("0 0 32 32");
    expect(component.props.fill).toBe("none");
    expect(component.props.className).toBe("text-gray-100");
    expect(component.props.xmlns).toBe("http://www.w3.org/2000/svg");

    // Check children
    const children = component.props.children;
    expect(Array.isArray(children)).toBe(true);
    expect(children.length).toBe(2);

    // Check rect
    const rect = children[0];
    expect(rect.type).toBe("rect");
    expect(rect.props.width).toBe("100%");
    expect(rect.props.height).toBe("100%");
    expect(rect.props.rx).toBe("16");
    expect(rect.props.fill).toBe("currentColor");

    // Check path
    const path = children[1];
    expect(path.type).toBe("path");
    expect(path.props.fillRule).toBe("evenodd");
    expect(path.props.clipRule).toBe("evenodd");
    expect(path.props.fill).toBe("black");
  });

  test("VercelLogo should render SVG with correct attributes", async () => {
    const { VercelLogo } = await import("../icons");

    const component = VercelLogo({
      className: "vercel-logo",
      width: "32",
    }) as any;

    expect(component.type).toBe("svg");
    expect(component.props["aria-label"]).toBe("Vercel logomark");
    expect(component.props.height).toBe("64");
    expect(component.props.role).toBe("img");
    expect(component.props.viewBox).toBe("0 0 74 64");
    expect(component.props.className).toBe("vercel-logo");
    expect(component.props.width).toBe("32");

    // Check path
    const path = component.props.children;
    expect(path.type).toBe("path");
    expect(path.props.d).toBe(
      "M37.5896 0.25L74.5396 64.25H0.639648L37.5896 0.25Z",
    );
    expect(path.props.fill).toBe("currentColor");
  });

  test("SVG icons should spread props correctly", async () => {
    const { UsersIcon, SettingsIcon, SearchIcon, VercelLogo } = await import(
      "../icons"
    );

    const commonProps = {
      id: "test-id",
      "data-custom": "custom-value",
      onClick: () => {},
      className: "custom-class",
    };

    // Test UsersIcon
    const usersIcon = UsersIcon(commonProps) as any;
    expect(usersIcon.props.id).toBe("test-id");
    expect(usersIcon.props["data-custom"]).toBe("custom-value");
    expect(usersIcon.props.onClick).toBe(commonProps.onClick);
    expect(usersIcon.props.className).toBe("custom-class");

    // Test SettingsIcon
    const settingsIcon = SettingsIcon(commonProps) as any;
    expect(settingsIcon.props.id).toBe("test-id");
    expect(settingsIcon.props["data-custom"]).toBe("custom-value");

    // Test SearchIcon
    const searchIcon = SearchIcon(commonProps) as any;
    expect(searchIcon.props.id).toBe("test-id");
    expect(searchIcon.props["data-custom"]).toBe("custom-value");

    // Test VercelLogo
    const vercelLogo = VercelLogo(commonProps) as any;
    expect(vercelLogo.props.id).toBe("test-id");
    expect(vercelLogo.props["data-custom"]).toBe("custom-value");
  });

  test("should handle empty props for SVG components", async () => {
    const { UsersIcon, SettingsIcon, SearchIcon, VercelLogo } = await import(
      "../icons"
    );

    // Test with empty props
    const usersIcon = UsersIcon({}) as any;
    expect(usersIcon.type).toBe("svg");
    expect(usersIcon.props.width).toBe("24");

    const settingsIcon = SettingsIcon({}) as any;
    expect(settingsIcon.type).toBe("svg");
    expect(settingsIcon.props.height).toBe("24");

    const searchIcon = SearchIcon({}) as any;
    expect(searchIcon.type).toBe("svg");
    expect(searchIcon.props.viewBox).toBe("0 0 24 24");

    const vercelLogo = VercelLogo({}) as any;
    expect(vercelLogo.type).toBe("svg");
    expect(vercelLogo.props.height).toBe("64");
  });

  test("Spinner should render loading animation elements", async () => {
    const { Spinner } = await import("../icons");

    const component = Spinner() as any;
    const svg = component.props.children;
    const svgChildren = svg.props.children;

    expect(Array.isArray(svgChildren)).toBe(true);
    expect(svgChildren.length).toBe(2);

    // Check circle
    const circle = svgChildren[0];
    expect(circle.type).toBe("circle");
    expect(circle.props.className).toBe("opacity-25");
    expect(circle.props.cx).toBe("12");
    expect(circle.props.cy).toBe("12");
    expect(circle.props.r).toBe("10");
    expect(circle.props.stroke).toBe("currentColor");
    expect(circle.props.strokeWidth).toBe("4");

    // Check path
    const path = svgChildren[1];
    expect(path.type).toBe("path");
    expect(path.props.className).toBe("opacity-75");
    expect(path.props.fill).toBe("currentColor");
    expect(path.props.d).toBe(
      "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
    );
  });

  test("components should render with proper path elements", async () => {
    const { UsersIcon, SettingsIcon, SearchIcon } = await import("../icons");

    // Test UsersIcon paths
    const usersIcon = UsersIcon({}) as any;
    const usersChildren = usersIcon.props.children;
    expect(Array.isArray(usersChildren)).toBe(true);
    expect(usersChildren.length).toBe(4); // 3 paths + 1 circle

    // Test SettingsIcon paths
    const settingsIcon = SettingsIcon({}) as any;
    const settingsChildren = settingsIcon.props.children;
    expect(Array.isArray(settingsChildren)).toBe(true);
    expect(settingsChildren.length).toBe(2); // 1 path + 1 circle

    // Test SearchIcon paths
    const searchIcon = SearchIcon({}) as any;
    const searchChildren = searchIcon.props.children;
    expect(Array.isArray(searchChildren)).toBe(true);
    expect(searchChildren.length).toBe(2); // 1 circle + 1 path
  });
});
