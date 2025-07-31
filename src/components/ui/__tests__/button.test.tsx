import { describe, test, expect, vi } from "vitest";
import { buttonVariants } from "../button";

// Mock dependencies
vi.mock("@radix-ui/react-slot", () => ({
  Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("Button", () => {
  describe("buttonVariants", () => {
    test("should generate default variant classes", () => {
      const classes = buttonVariants();
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("justify-center");
      expect(classes).toContain("whitespace-nowrap");
      expect(classes).toContain("rounded-md");
      expect(classes).toContain("text-sm");
      expect(classes).toContain("font-medium");
      expect(classes).toContain("ring-offset-background");
      expect(classes).toContain("transition-colors");
      expect(classes).toContain("focus-visible:outline-none");
      expect(classes).toContain("focus-visible:ring-2");
      expect(classes).toContain("focus-visible:ring-ring");
      expect(classes).toContain("focus-visible:ring-offset-2");
      expect(classes).toContain("disabled:pointer-events-none");
      expect(classes).toContain("disabled:opacity-50");
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
      expect(classes).toContain("hover:bg-primary/90");
      expect(classes).toContain("h-10");
      expect(classes).toContain("px-4");
      expect(classes).toContain("py-2");
    });

    test("should generate destructive variant classes", () => {
      const classes = buttonVariants({ variant: "destructive" });
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("text-destructive-foreground");
      expect(classes).toContain("hover:bg-destructive/90");
    });

    test("should generate outline variant classes", () => {
      const classes = buttonVariants({ variant: "outline" });
      expect(classes).toContain("border");
      expect(classes).toContain("border-input");
      expect(classes).toContain("bg-background");
      expect(classes).toContain("hover:bg-accent");
      expect(classes).toContain("hover:text-accent-foreground");
    });

    test("should generate secondary variant classes", () => {
      const classes = buttonVariants({ variant: "secondary" });
      expect(classes).toContain("bg-secondary");
      expect(classes).toContain("text-secondary-foreground");
      expect(classes).toContain("hover:bg-secondary/80");
    });

    test("should generate ghost variant classes", () => {
      const classes = buttonVariants({ variant: "ghost" });
      expect(classes).toContain("hover:bg-accent");
      expect(classes).toContain("hover:text-accent-foreground");
    });

    test("should generate link variant classes", () => {
      const classes = buttonVariants({ variant: "link" });
      expect(classes).toContain("text-primary");
      expect(classes).toContain("underline-offset-4");
      expect(classes).toContain("hover:underline");
    });

    test("should generate size variant classes", () => {
      // Small size
      const smClasses = buttonVariants({ size: "sm" });
      expect(smClasses).toContain("h-9");
      expect(smClasses).toContain("rounded-md");
      expect(smClasses).toContain("px-3");

      // Large size
      const lgClasses = buttonVariants({ size: "lg" });
      expect(lgClasses).toContain("h-11");
      expect(lgClasses).toContain("rounded-md");
      expect(lgClasses).toContain("px-8");

      // Icon size
      const iconClasses = buttonVariants({ size: "icon" });
      expect(iconClasses).toContain("h-10");
      expect(iconClasses).toContain("w-10");
    });

    test("should combine variant and size", () => {
      const classes = buttonVariants({ variant: "outline", size: "lg" });
      expect(classes).toContain("border");
      expect(classes).toContain("h-11");
      expect(classes).toContain("px-8");
    });
  });

  describe("Button component", () => {
    test("should export Button component", async () => {
      const buttonModule = await import("../button");
      expect(buttonModule.Button).toBeDefined();
      expect(typeof buttonModule.Button).toBe("object"); // forwardRef returns an object
      expect(buttonModule.Button.displayName).toBe("Button");
    });

    test("should handle Button as forwardRef component", async () => {
      const buttonModule = await import("../button");
      const { Button } = buttonModule;

      // Button is a forwardRef component, so we can't call it as a function
      // Test that it exports correctly
      expect(Button).toBeDefined();
      expect(Button.displayName).toBe("Button");

      // The actual rendering tests would require a React testing library
      // which is not available in this setup
    });
  });
});
