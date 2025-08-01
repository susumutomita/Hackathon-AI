import { describe, test, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { badgeVariants } from "../badge";

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("Badge", () => {
  describe("badgeVariants", () => {
    test("should generate default variant classes", () => {
      const classes = badgeVariants();
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("rounded-full");
      expect(classes).toContain("border");
      expect(classes).toContain("px-2.5");
      expect(classes).toContain("py-0.5");
      expect(classes).toContain("text-xs");
      expect(classes).toContain("font-semibold");
      expect(classes).toContain("transition-colors");
      expect(classes).toContain("focus:outline-none");
      expect(classes).toContain("focus:ring-2");
      expect(classes).toContain("focus:ring-ring");
      expect(classes).toContain("focus:ring-offset-2");
    });

    test("should generate default variant style classes", () => {
      const classes = badgeVariants({ variant: "default" });
      expect(classes).toContain("border-transparent");
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
      expect(classes).toContain("hover:bg-primary/80");
    });

    test("should generate secondary variant classes", () => {
      const classes = badgeVariants({ variant: "secondary" });
      expect(classes).toContain("border-transparent");
      expect(classes).toContain("bg-secondary");
      expect(classes).toContain("text-secondary-foreground");
      expect(classes).toContain("hover:bg-secondary/80");
    });

    test("should generate destructive variant classes", () => {
      const classes = badgeVariants({ variant: "destructive" });
      expect(classes).toContain("border-transparent");
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("text-destructive-foreground");
      expect(classes).toContain("hover:bg-destructive/80");
    });

    test("should generate outline variant classes", () => {
      const classes = badgeVariants({ variant: "outline" });
      expect(classes).toContain("text-foreground");
      expect(classes).not.toContain("border-transparent");
    });
  });

  describe("Badge component export", () => {
    test("should export Badge component", async () => {
      const badgeModule = await import("../badge");
      expect(badgeModule.Badge).toBeDefined();
      expect(typeof badgeModule.Badge).toBe("function");
    });

    test("should export badgeVariants", async () => {
      const badgeModule = await import("../badge");
      expect(badgeModule.badgeVariants).toBeDefined();
      expect(typeof badgeModule.badgeVariants).toBe("function");
    });
  });

  describe("Badge component", () => {
    test("should render with default variant", async () => {
      const { Badge } = await import("../badge");

      const component = React.createElement(Badge, {}, "Default Badge");

      const html = renderToString(component);
      expect(html).toContain("<div");
      expect(html).toContain("Default Badge");
      expect(html).toContain("bg-primary");
      expect(html).toContain("text-primary-foreground");
    });

    test("should render with secondary variant", async () => {
      const { Badge } = await import("../badge");

      const component = React.createElement(
        Badge,
        {
          variant: "secondary",
        },
        "Secondary Badge",
      );

      const html = renderToString(component);
      expect(html).toContain("Secondary Badge");
      expect(html).toContain("bg-secondary");
      expect(html).toContain("text-secondary-foreground");
    });

    test("should render with destructive variant", async () => {
      const { Badge } = await import("../badge");

      const component = React.createElement(
        Badge,
        {
          variant: "destructive",
        },
        "Destructive Badge",
      );

      const html = renderToString(component);
      expect(html).toContain("Destructive Badge");
      expect(html).toContain("bg-destructive");
      expect(html).toContain("text-destructive-foreground");
    });

    test("should render with outline variant", async () => {
      const { Badge } = await import("../badge");

      const component = React.createElement(
        Badge,
        {
          variant: "outline",
        },
        "Outline Badge",
      );

      const html = renderToString(component);
      expect(html).toContain("Outline Badge");
      expect(html).toContain("text-foreground");
    });

    test("should merge custom className", async () => {
      const { Badge } = await import("../badge");

      const component = React.createElement(
        Badge,
        {
          className: "custom-badge",
        },
        "Custom Badge",
      );

      const html = renderToString(component);
      expect(html).toContain("custom-badge");
      expect(html).toContain("Custom Badge");
    });

    test("should pass through additional props", async () => {
      const { Badge } = await import("../badge");

      const component = React.createElement(
        Badge,
        {
          id: "test-badge",
          "data-testid": "badge-test",
        },
        "Test Badge",
      );

      const html = renderToString(component);
      expect(html).toContain('id="test-badge"');
      expect(html).toContain('data-testid="badge-test"');
    });
  });
});
