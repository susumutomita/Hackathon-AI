import { describe, test, expect, vi } from "vitest";

// Mock IdeaForm component
vi.mock("@/components/IdeaForm", () => ({
  default: () => <div data-component="idea-form">IdeaForm Component</div>,
}));

describe("DashboardPage", () => {
  test("should export default component", async () => {
    const pageModule = await import("../page");
    expect(pageModule.default).toBeDefined();
    expect(typeof pageModule.default).toBe("function");
  });

  test("should render page with IdeaForm", async () => {
    const pageModule = await import("../page");
    const DashboardPage = pageModule.default;

    const component = DashboardPage() as any;

    // Check root structure
    expect(component.type).toBe("div");

    // Check inner div
    const innerDiv = component.props.children;
    expect(innerDiv.type).toBe("div");
    expect(innerDiv.props.className).toBe("mb-8");

    // Check IdeaForm
    const ideaForm = innerDiv.props.children;
    expect(ideaForm).toBeDefined();
  });

  test("should render with correct styling classes", async () => {
    const pageModule = await import("../page");
    const DashboardPage = pageModule.default;

    const component = DashboardPage() as any;

    const innerDiv = component.props.children;
    expect(innerDiv.props.className).toBe("mb-8");
  });

  test("should maintain component structure", async () => {
    const pageModule = await import("../page");
    const DashboardPage = pageModule.default;

    // Call the component multiple times to ensure consistency
    const component1 = DashboardPage() as any;
    const component2 = DashboardPage() as any;

    // Both should have the same structure
    expect(component1.type).toBe(component2.type);
    expect(component1.props.children.type).toBe(component2.props.children.type);
    expect(component1.props.children.props.className).toBe(
      component2.props.children.props.className,
    );
  });
});
