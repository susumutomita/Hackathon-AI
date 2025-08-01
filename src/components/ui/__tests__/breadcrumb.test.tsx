import { describe, test, expect, vi } from "vitest";
import React from "react";

// Mock Radix UI Slot
vi.mock("@radix-ui/react-slot", () => {
  const Slot = React.forwardRef(({ children, ...props }: any, ref: any) => {
    const child = React.Children.only(children);
    return React.cloneElement(child, { ...props, ref });
  });
  Slot.displayName = "Slot";
  return { Slot };
});

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ChevronRight: () => <svg data-testid="chevron-right" />,
  MoreHorizontal: () => <svg data-testid="more-horizontal" />,
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

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

  describe("Breadcrumb component", () => {
    test("should render nav with correct attributes", async () => {
      const { Breadcrumb } = await import("../breadcrumb");

      const component = React.createElement(
        Breadcrumb,
        {
          className: "custom-class",
        },
        "Content",
      );

      expect(component.type).toBe(Breadcrumb);
      expect(component.props.className).toBe("custom-class");
      expect(component.props.children).toBe("Content");
    });

    test("should forward ref correctly", async () => {
      const { Breadcrumb } = await import("../breadcrumb");
      expect(Breadcrumb.displayName).toBe("Breadcrumb");
    });
  });

  describe("BreadcrumbList component", () => {
    test("should render ol with correct styles", async () => {
      const { BreadcrumbList } = await import("../breadcrumb");

      const component = React.createElement(BreadcrumbList, {}, "Items");

      expect(component.type).toBe(BreadcrumbList);
      expect(component.props.children).toBe("Items");
    });

    test("should merge custom className", async () => {
      const { BreadcrumbList } = await import("../breadcrumb");

      const component = React.createElement(
        BreadcrumbList,
        {
          className: "custom-class",
        },
        "Items",
      );

      expect(component.props.className).toBe("custom-class");
    });

    test("should have correct displayName", async () => {
      const { BreadcrumbList } = await import("../breadcrumb");
      expect(BreadcrumbList.displayName).toBe("BreadcrumbList");
    });
  });

  describe("BreadcrumbItem component", () => {
    test("should render li with correct styles", async () => {
      const { BreadcrumbItem } = await import("../breadcrumb");

      const component = React.createElement(BreadcrumbItem, {}, "Item");

      expect(component.type).toBe(BreadcrumbItem);
      expect(component.props.children).toBe("Item");
    });

    test("should merge custom className", async () => {
      const { BreadcrumbItem } = await import("../breadcrumb");

      const component = React.createElement(
        BreadcrumbItem,
        {
          className: "custom-class",
        },
        "Item",
      );

      expect(component.props.className).toBe("custom-class");
    });

    test("should have correct displayName", async () => {
      const { BreadcrumbItem } = await import("../breadcrumb");
      expect(BreadcrumbItem.displayName).toBe("BreadcrumbItem");
    });
  });

  describe("BreadcrumbLink component", () => {
    test("should render anchor by default", async () => {
      const { BreadcrumbLink } = await import("../breadcrumb");

      const component = React.createElement(
        BreadcrumbLink,
        {
          href: "/home",
        },
        "Home",
      );

      expect(component.type).toBe(BreadcrumbLink);
      expect(component.props.href).toBe("/home");
      expect(component.props.children).toBe("Home");
    });

    test("should handle asChild prop", async () => {
      const { BreadcrumbLink } = await import("../breadcrumb");

      const component = React.createElement(
        BreadcrumbLink,
        {
          asChild: true,
        },
        React.createElement("button", {}, "Button"),
      );

      expect(component.props.asChild).toBe(true);
    });

    test("should merge custom className", async () => {
      const { BreadcrumbLink } = await import("../breadcrumb");

      const component = React.createElement(
        BreadcrumbLink,
        {
          className: "custom-class",
        },
        "Link",
      );

      expect(component.props.className).toBe("custom-class");
    });

    test("should have correct displayName", async () => {
      const { BreadcrumbLink } = await import("../breadcrumb");
      expect(BreadcrumbLink.displayName).toBe("BreadcrumbLink");
    });
  });

  describe("BreadcrumbPage component", () => {
    test("should render span with correct attributes", async () => {
      const { BreadcrumbPage } = await import("../breadcrumb");

      const component = React.createElement(BreadcrumbPage, {}, "Current Page");

      expect(component.type).toBe(BreadcrumbPage);
      expect(component.props.children).toBe("Current Page");
    });

    test("should merge custom className", async () => {
      const { BreadcrumbPage } = await import("../breadcrumb");

      const component = React.createElement(
        BreadcrumbPage,
        {
          className: "custom-class",
        },
        "Page",
      );

      expect(component.props.className).toBe("custom-class");
    });

    test("should have correct displayName", async () => {
      const { BreadcrumbPage } = await import("../breadcrumb");
      expect(BreadcrumbPage.displayName).toBe("BreadcrumbPage");
    });
  });

  describe("BreadcrumbSeparator component", () => {
    test("should render with default ChevronRight icon", async () => {
      const { BreadcrumbSeparator } = await import("../breadcrumb");

      const component = BreadcrumbSeparator({});

      expect(component.type).toBe("li");
      expect(component.props.role).toBe("presentation");
      expect(component.props["aria-hidden"]).toBe("true");
      expect(component.props.children.type.name).toBe("ChevronRight");
    });

    test("should render with custom children", async () => {
      const { BreadcrumbSeparator } = await import("../breadcrumb");

      const component = BreadcrumbSeparator({
        children: "/",
      });

      expect(component.props.children).toBe("/");
    });

    test("should merge custom className", async () => {
      const { BreadcrumbSeparator } = await import("../breadcrumb");

      const component = BreadcrumbSeparator({
        className: "custom-class",
      });

      expect(component.props.className).toContain("custom-class");
    });
  });

  describe("BreadcrumbEllipsis component", () => {
    test("should render with MoreHorizontal icon and sr-only text", async () => {
      const { BreadcrumbEllipsis } = await import("../breadcrumb");

      const component = BreadcrumbEllipsis({});

      expect(component.type).toBe("span");
      expect(component.props.role).toBe("presentation");
      expect(component.props["aria-hidden"]).toBe("true");
      expect(component.props.className).toContain("flex h-9 w-9");

      // Check children
      expect(component.props.children).toHaveLength(2);
      expect(component.props.children[0].type.name).toBe("MoreHorizontal");
      expect(component.props.children[0].props.className).toBe("h-4 w-4");
      expect(component.props.children[1].type).toBe("span");
      expect(component.props.children[1].props.className).toBe("sr-only");
      expect(component.props.children[1].props.children).toBe("More");
    });

    test("should merge custom className", async () => {
      const { BreadcrumbEllipsis } = await import("../breadcrumb");

      const component = BreadcrumbEllipsis({
        className: "custom-class",
      });

      expect(component.props.className).toContain("custom-class");
    });
  });

  describe("Integration test", () => {
    test("should compose a complete breadcrumb", async () => {
      const bread = await import("../breadcrumb");
      const {
        Breadcrumb,
        BreadcrumbList,
        BreadcrumbItem,
        BreadcrumbLink,
        BreadcrumbPage,
        BreadcrumbSeparator,
      } = bread;

      const breadcrumb = React.createElement(
        Breadcrumb,
        {},
        React.createElement(BreadcrumbList, {}, [
          React.createElement(
            BreadcrumbItem,
            {
              key: "home",
            },
            [
              React.createElement(
                BreadcrumbLink,
                {
                  href: "/",
                },
                "Home",
              ),
            ],
          ),
          React.createElement(BreadcrumbSeparator, { key: "sep1" }),
          React.createElement(
            BreadcrumbItem,
            {
              key: "products",
            },
            [
              React.createElement(
                BreadcrumbLink,
                {
                  href: "/products",
                },
                "Products",
              ),
            ],
          ),
          React.createElement(BreadcrumbSeparator, { key: "sep2" }),
          React.createElement(
            BreadcrumbItem,
            {
              key: "current",
            },
            [React.createElement(BreadcrumbPage, {}, "Current Product")],
          ),
        ]),
      );

      expect(breadcrumb.type).toBe(Breadcrumb);
      expect(breadcrumb.props.children.type).toBe(BreadcrumbList);
      expect(breadcrumb.props.children.props.children).toHaveLength(5);
    });
  });
});
