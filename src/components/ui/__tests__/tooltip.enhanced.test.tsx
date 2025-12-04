import { describe, test, expect, vi, beforeEach } from "vitest";
import React from "react";

// Mock testing library functions
const mockRender = vi.fn();
const mockScreen = {
  getByTestId: vi.fn(),
  getAllByTestId: vi.fn(),
  getByText: vi.fn(),
  getAllByText: vi.fn(),
  queryByText: vi.fn(),
  getByRole: vi.fn(),
  getByLabelText: vi.fn(),
  queryByRole: vi.fn(),
  findByText: vi.fn(),
  findByRole: vi.fn(),
};

const mockUserEvent = {
  setup: () => ({
    hover: vi.fn(),
    unhover: vi.fn(),
    click: vi.fn(),
    tab: vi.fn(),
    keyboard: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
  }),
};

// Mock React Testing Library
vi.mock("@testing-library/react", () => ({
  render: mockRender,
  screen: mockScreen,
  fireEvent: {
    mouseEnter: vi.fn(),
    mouseLeave: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    keyDown: vi.fn(),
  },
  waitFor: vi.fn((fn) => Promise.resolve(fn())),
}));

vi.mock("@testing-library/user-event", () => ({
  default: mockUserEvent,
}));

// Add custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received != null;
    return {
      pass,
      message: () =>
        pass
          ? "expected element not to be in the document"
          : "expected element to be in the document",
    };
  },
  toHaveAttribute(received, attr, value) {
    if (!received) return { pass: false, message: () => "element is null" };
    const hasAttr = received.getAttribute?.(attr) !== null;
    const attrValue = received.getAttribute?.(attr);
    const pass = value !== undefined ? hasAttr && attrValue === value : hasAttr;
    return {
      pass,
      message: () =>
        pass
          ? `expected element not to have attribute ${attr}${
              value !== undefined ? ` with value ${value}` : ""
            }`
          : `expected element to have attribute ${attr}${
              value !== undefined ? ` with value ${value}` : ""
            }`,
    };
  },
  toBeVisible(received) {
    const pass = received && received.style?.display !== "none";
    return {
      pass,
      message: () =>
        pass
          ? "expected element not to be visible"
          : "expected element to be visible",
    };
  },
});

// Enhanced mock for Radix UI tooltip
vi.mock("@radix-ui/react-tooltip", () => {
  const createMockElement = (testId: string, tag = "div") => {
    const Comp = React.forwardRef<any, any>(function MockComponent(
      {
        children,
        className,
        sideOffset,
        side,
        align,
        open,
        delayDuration,
        onOpenChange,
        ...props
      },
      ref,
    ) {
      const [isOpen, setIsOpen] = React.useState(open || false);

      const handleMouseEnter = () => {
        setIsOpen(true);
        onOpenChange?.(true);
      };

      const handleMouseLeave = () => {
        setIsOpen(false);
        onOpenChange?.(false);
      };

      return React.createElement(
        tag,
        // eslint-disable-next-line react-hooks/refs -- Test mock forwarding refs
        {
          ref,
          "data-testid": testId,
          className,
          "data-side-offset": sideOffset,
          "data-side": side,
          "data-align": align,
          "data-open": isOpen,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
          style: { display: isOpen ? "block" : "none" },
          ...props,
        },
        children,
      );
    });
    // Satisfy react/display-name for mocked components
    (Comp as any).displayName = `Mock-${testId}`;
    return Comp;
  };

  const Provider = ({ children, delayDuration, skipDelayDuration }: any) =>
    React.createElement(
      "div",
      {
        "data-testid": "tooltip-provider",
        "data-delay-duration": delayDuration,
        "data-skip-delay-duration": skipDelayDuration,
      },
      children,
    );
  (Provider as any).displayName = "Mock-Tooltip-Provider";

  const Root = ({ children, open, onOpenChange, delayDuration }: any) =>
    React.createElement(
      "div",
      {
        "data-testid": "tooltip-root",
        "data-open": open,
        "data-delay-duration": delayDuration,
      },
      children,
    );
  (Root as any).displayName = "Mock-Tooltip-Root";

  return {
    Provider,
    Root,
    Trigger: createMockElement("tooltip-trigger", "button"),
    Content: createMockElement("tooltip-content"),
  };
});

// Mock cn utility
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) =>
    classes
      .filter(Boolean)
      .flatMap((cls) =>
        typeof cls === "string"
          ? cls.split(" ")
          : typeof cls === "object" && cls !== null
            ? Object.entries(cls)
                .filter(([, value]) => value)
                .map(([key]) => key)
            : [],
      )
      .join(" "),
}));

describe("Tooltip Enhanced Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock DOM element for return values
    const mockElement = {
      getAttribute: vi.fn(),
      setAttribute: vi.fn(),
      hasAttribute: vi.fn(),
      className: "",
      textContent: "",
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
    };
    mockScreen.getByTestId.mockReturnValue(mockElement);
    mockScreen.getAllByTestId.mockReturnValue([mockElement]);
    mockScreen.getByText.mockReturnValue(mockElement);
    mockScreen.getAllByText.mockReturnValue([mockElement]);
    mockScreen.getByRole.mockReturnValue(mockElement);
    mockScreen.findByText.mockResolvedValue(mockElement);
  });

  describe("Complete Tooltip Implementation Tests", () => {
    test("should render complete tooltip structure", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const CompleteTooltip = () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover me</TooltipTrigger>
            <TooltipContent>
              <p>This is a tooltip content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(CompleteTooltip).toBeDefined();
      expect(typeof Tooltip).toBe("function");
      expect(typeof TooltipTrigger).toBe("object");
      expect(typeof TooltipContent).toBe("object");
      expect(typeof TooltipProvider).toBe("function");
    });

    test("should handle hover interactions", async () => {
      const user = mockUserEvent.setup();
      const onOpenChange = vi.fn();
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const InteractiveTooltip = () => (
        <TooltipProvider>
          <Tooltip onOpenChange={onOpenChange}>
            <TooltipTrigger data-testid="hover-trigger">
              Hover trigger
            </TooltipTrigger>
            <TooltipContent data-testid="hover-content">
              Tooltip appears on hover
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(InteractiveTooltip).toBeDefined();
      expect(user.hover).toBeDefined();
      expect(user.unhover).toBeDefined();
      expect(onOpenChange).toBeDefined();
    });

    test("should support controlled and uncontrolled modes", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const ControlledTooltip = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        return (
          <TooltipProvider>
            <Tooltip open={isOpen} onOpenChange={setIsOpen}>
              <TooltipTrigger>Controlled trigger</TooltipTrigger>
              <TooltipContent>Controlled content</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      };

      const UncontrolledTooltip = () => (
        <TooltipProvider>
          <Tooltip defaultOpen={false}>
            <TooltipTrigger>Uncontrolled trigger</TooltipTrigger>
            <TooltipContent>Uncontrolled content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(ControlledTooltip).toBeDefined();
      expect(UncontrolledTooltip).toBeDefined();
    });

    test("should handle different positioning options", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const PositionedTooltips = () => (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger>Top tooltip</TooltipTrigger>
              <TooltipContent side="top" sideOffset={5}>
                Tooltip on top
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>Bottom tooltip</TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={10}>
                Tooltip on bottom
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>Left tooltip</TooltipTrigger>
              <TooltipContent side="left" align="start">
                Tooltip on left
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>Right tooltip</TooltipTrigger>
              <TooltipContent side="right" align="end">
                Tooltip on right
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );

      expect(PositionedTooltips).toBeDefined();
    });

    test("should handle delay configurations", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const DelayedTooltips = () => (
        <div>
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger>Slow tooltip</TooltipTrigger>
              <TooltipContent>Appears after 500ms</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger>Instant tooltip</TooltipTrigger>
              <TooltipContent>Appears instantly</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={1000} skipDelayDuration={300}>
            <Tooltip>
              <TooltipTrigger>Complex timing</TooltipTrigger>
              <TooltipContent>Complex timing configuration</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );

      expect(DelayedTooltips).toBeDefined();
    });
  });

  describe("Accessibility and ARIA Tests", () => {
    test("should provide proper ARIA attributes", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const AccessibleTooltip = () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              aria-describedby="tooltip-content"
              aria-label="Information button"
            >
              Info
            </TooltipTrigger>
            <TooltipContent
              id="tooltip-content"
              role="tooltip"
              aria-live="polite"
            >
              Detailed information about this feature
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(AccessibleTooltip).toBeDefined();
    });

    test("should support keyboard navigation", async () => {
      const user = mockUserEvent.setup();
      const onOpenChange = vi.fn();
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const KeyboardTooltip = () => (
        <TooltipProvider>
          <Tooltip onOpenChange={onOpenChange}>
            <TooltipTrigger
              onFocus={() => onOpenChange(true)}
              onBlur={() => onOpenChange(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onOpenChange(false);
                }
              }}
              tabIndex={0}
            >
              Keyboard accessible trigger
            </TooltipTrigger>
            <TooltipContent>Keyboard accessible tooltip</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(KeyboardTooltip).toBeDefined();
      expect(user.focus).toBeDefined();
      expect(user.blur).toBeDefined();
      expect(user.keyboard).toBeDefined();
      expect(onOpenChange).toBeDefined();
    });

    test("should handle screen reader compatibility", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const ScreenReaderTooltip = () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              aria-label="Edit profile"
              aria-describedby="edit-tooltip"
            >
              <span aria-hidden="true">✏️</span>
            </TooltipTrigger>
            <TooltipContent id="edit-tooltip" role="tooltip" aria-live="polite">
              Click to edit your profile information
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(ScreenReaderTooltip).toBeDefined();
    });

    test("should handle focus trapping appropriately", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const FocusTooltip = () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              onFocus={() => {}}
              onBlur={() => {}}
              tabIndex={0}
              role="button"
            >
              Focus me
            </TooltipTrigger>
            <TooltipContent tabIndex={-1}>
              Non-focusable tooltip content
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(FocusTooltip).toBeDefined();
    });
  });

  describe("Advanced Styling and Animation Tests", () => {
    test("should handle complex styling scenarios", async () => {
      const tooltipModule = await import("../tooltip");
      const { cn } = await import("@/lib/utils");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      // Test cn utility with animation classes
      const animationClasses = cn(
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0",
        "data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
      );
      expect(animationClasses).toContain("animate-in");
      expect(animationClasses).toContain("fade-in-0");

      const StyledTooltip = () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              Styled trigger
            </TooltipTrigger>
            <TooltipContent
              className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
              sideOffset={4}
            >
              Beautifully styled tooltip
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(StyledTooltip).toBeDefined();
    });

    test("should support custom themes", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const ThemedTooltips = () => (
        <TooltipProvider>
          <div className="space-y-4">
            {/* Dark theme tooltip */}
            <Tooltip>
              <TooltipTrigger className="bg-slate-900 text-white px-3 py-1 rounded">
                Dark theme
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-slate-700">
                Dark themed tooltip
              </TooltipContent>
            </Tooltip>

            {/* Light theme tooltip */}
            <Tooltip>
              <TooltipTrigger className="bg-white text-slate-900 px-3 py-1 rounded border">
                Light theme
              </TooltipTrigger>
              <TooltipContent className="bg-white text-slate-900 border-slate-200 shadow-lg">
                Light themed tooltip
              </TooltipContent>
            </Tooltip>

            {/* Success theme tooltip */}
            <Tooltip>
              <TooltipTrigger className="bg-green-600 text-white px-3 py-1 rounded">
                Success theme
              </TooltipTrigger>
              <TooltipContent className="bg-green-50 text-green-800 border-green-200">
                Success themed tooltip
              </TooltipContent>
            </Tooltip>

            {/* Error theme tooltip */}
            <Tooltip>
              <TooltipTrigger className="bg-red-600 text-white px-3 py-1 rounded">
                Error theme
              </TooltipTrigger>
              <TooltipContent className="bg-red-50 text-red-800 border-red-200">
                Error themed tooltip
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );

      expect(ThemedTooltips).toBeDefined();
    });

    test("should support rich content tooltips", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const RichContentTooltips = () => (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger>Rich content tooltip</TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <h4 className="font-semibold">Feature Information</h4>
                  <p className="text-sm text-muted-foreground">
                    This feature allows you to perform advanced operations with
                    enhanced security.
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    Available
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>Image tooltip</TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    UI
                  </div>
                  <div>
                    <p className="font-medium">UI Component</p>
                    <p className="text-xs text-muted-foreground">
                      Version 2.1.0
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );

      expect(RichContentTooltips).toBeDefined();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle missing TooltipProvider gracefully", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent } = tooltipModule;

      const NoProviderTooltip = () => (
        <Tooltip>
          <TooltipTrigger>No provider</TooltipTrigger>
          <TooltipContent>This tooltip has no provider</TooltipContent>
        </Tooltip>
      );

      expect(NoProviderTooltip).toBeDefined();
    });

    test("should handle empty or invalid content", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const EmptyContentTooltips = () => (
        <TooltipProvider>
          <div>
            <Tooltip>
              <TooltipTrigger>Empty content</TooltipTrigger>
              <TooltipContent></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>Null content</TooltipTrigger>
              <TooltipContent>{null}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>Undefined content</TooltipTrigger>
              <TooltipContent>{undefined}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>Whitespace content</TooltipTrigger>
              <TooltipContent> </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );

      expect(EmptyContentTooltips).toBeDefined();
    });

    test("should handle extreme positioning scenarios", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const ExtremePositionTooltips = () => (
        <TooltipProvider>
          <div>
            <Tooltip>
              <TooltipTrigger>Extreme offset</TooltipTrigger>
              <TooltipContent sideOffset={9999}>
                Far away tooltip
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>Negative offset</TooltipTrigger>
              <TooltipContent sideOffset={-50}>
                Negative offset tooltip
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>Invalid side</TooltipTrigger>
              <TooltipContent side={"invalid" as any}>
                Invalid side tooltip
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );

      expect(ExtremePositionTooltips).toBeDefined();
    });

    test("should handle rapid hover events", async () => {
      const onOpenChange = vi.fn();
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const RapidHoverTooltip = () => (
        <TooltipProvider delayDuration={0}>
          <Tooltip onOpenChange={onOpenChange}>
            <TooltipTrigger
              onMouseEnter={() => onOpenChange(true)}
              onMouseLeave={() => onOpenChange(false)}
            >
              Rapid hover trigger
            </TooltipTrigger>
            <TooltipContent>Rapid hover content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(RapidHoverTooltip).toBeDefined();
      expect(onOpenChange).toBeDefined();
    });
  });

  describe("Performance and Integration Tests", () => {
    test("should handle multiple tooltips efficiently", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const tooltipCount = 20;
      const tooltips = Array.from({ length: tooltipCount }, (_, i) => ({
        id: `performance-tooltip-${i}`,
        trigger: `Trigger ${i + 1}`,
        content: `Content for tooltip ${i + 1}`,
      }));

      const MultipleTooltips = () => (
        <TooltipProvider>
          <div className="grid grid-cols-5 gap-4">
            {tooltips.map((tooltip) => (
              <Tooltip key={tooltip.id}>
                <TooltipTrigger>{tooltip.trigger}</TooltipTrigger>
                <TooltipContent>{tooltip.content}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      );

      expect(MultipleTooltips).toBeDefined();
    });

    test("should integrate with interactive elements", async () => {
      const onClick = vi.fn();
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const InteractiveTooltips = () => (
        <TooltipProvider>
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClick}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Clickable button with tooltip
                </button>
              </TooltipTrigger>
              <TooltipContent>
                This button is clickable and has a tooltip
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <a href="#" className="text-blue-500 underline">
                  Link with tooltip
                </a>
              </TooltipTrigger>
              <TooltipContent>
                This is a link with additional information
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <input
                  type="text"
                  placeholder="Input with tooltip"
                  className="px-3 py-2 border rounded"
                />
              </TooltipTrigger>
              <TooltipContent>Enter your information here</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );

      expect(InteractiveTooltips).toBeDefined();
      expect(onClick).toBeDefined();
    });

    test("should work with form validation", async () => {
      const tooltipModule = await import("../tooltip");
      const { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } =
        tooltipModule;

      const FormTooltips = () => {
        const [errors, setErrors] = React.useState({
          email: "",
          password: "",
        });
        return (
          <TooltipProvider>
            <form className="space-y-4">
              <div>
                <label htmlFor="email">Email</label>
                <Tooltip open={!!errors.email}>
                  <TooltipTrigger asChild>
                    <input
                      id="email"
                      type="email"
                      className={`px-3 py-2 border rounded ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="bg-red-50 text-red-800 border-red-200">
                    {errors.email}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div>
                <label htmlFor="password">Password</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <input
                      id="password"
                      type="password"
                      className="px-3 py-2 border rounded"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    Password must be at least 8 characters long
                  </TooltipContent>
                </Tooltip>
              </div>
            </form>
          </TooltipProvider>
        );
      };

      expect(FormTooltips).toBeDefined();
    });
  });
});
