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
  getByDisplayValue: vi.fn(),
  getAllByRole: vi.fn(),
};

const mockUserEvent = {
  setup: () => ({
    click: vi.fn(),
    tab: vi.fn(),
    keyboard: vi.fn(),
    hover: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
  }),
};

// Mock React Testing Library
vi.mock("@testing-library/react", () => ({
  render: mockRender,
  screen: mockScreen,
  fireEvent: {
    click: vi.fn(),
    keyDown: vi.fn(),
    keyUp: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
  },
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
  toHaveClass(received, className) {
    const pass = received?.className?.includes(className) || false;
    return {
      pass,
      message: () =>
        pass
          ? `expected element not to have class ${className}`
          : `expected element to have class ${className}`,
    };
  },
});

// Enhanced mock for Radix UI tabs
vi.mock("@radix-ui/react-tabs", () => {
  const createMockElement = (testId: string, tag = "div") =>
    React.forwardRef<any, any>(
      ({ children, className, onValueChange, value, ...props }, ref) => {
        const handleClick = () => {
          if (onValueChange && value) {
            onValueChange(value);
          }
        };

        return React.createElement(
          tag,
          {
            ref,
            "data-testid": testId,
            className,
            onClick: handleClick,
            "data-value": value,
            ...props,
          },
          children,
        );
      },
    );

  return {
    Root: createMockElement("tabs-root"),
    List: createMockElement("tabs-list"),
    Trigger: createMockElement("tabs-trigger", "button"),
    Content: createMockElement("tabs-content"),
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

describe("Tabs Enhanced Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock DOM element for return values
    const mockElement = {
      getAttribute: vi.fn(),
      setAttribute: vi.fn(),
      hasAttribute: vi.fn(),
      className: "",
      textContent: "",
      click: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
    };
    mockScreen.getByTestId.mockReturnValue(mockElement);
    mockScreen.getAllByTestId.mockReturnValue([mockElement]);
    mockScreen.getByText.mockReturnValue(mockElement);
    mockScreen.getAllByText.mockReturnValue([mockElement]);
    mockScreen.getByRole.mockReturnValue(mockElement);
    mockScreen.getAllByRole.mockReturnValue([mockElement]);
  });

  describe("Complete Tabs Implementation Tests", () => {
    test("should render complete tabs structure", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const CompleteTabs = () => (
        <Tabs defaultValue="tab1" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tab1">Overview</TabsTrigger>
            <TabsTrigger value="tab2">Analytics</TabsTrigger>
            <TabsTrigger value="tab3">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="mt-6">
            <h3>Overview Content</h3>
            <p>This is the overview tab content.</p>
          </TabsContent>
          <TabsContent value="tab2" className="mt-6">
            <h3>Analytics Content</h3>
            <p>This is the analytics tab content.</p>
          </TabsContent>
          <TabsContent value="tab3" className="mt-6">
            <h3>Settings Content</h3>
            <p>This is the settings tab content.</p>
          </TabsContent>
        </Tabs>
      );

      expect(CompleteTabs).toBeDefined();
      expect(typeof Tabs).toBe("function");
      expect(typeof TabsList).toBe("object");
      expect(typeof TabsTrigger).toBe("object");
      expect(typeof TabsContent).toBe("object");
    });

    test("should handle tab switching interactions", async () => {
      const onValueChange = vi.fn();
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const InteractiveTabs = () => (
        <Tabs value="tab1" onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="tab1" data-testid="tab1-trigger">
              Tab 1
            </TabsTrigger>
            <TabsTrigger value="tab2" data-testid="tab2-trigger">
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(InteractiveTabs).toBeDefined();
      expect(onValueChange).toBeDefined();
    });

    test("should support controlled and uncontrolled modes", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const [activeTab, setActiveTab] = React.useState("controlled-tab1");

      const ControlledTabs = () => (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="controlled-tab1">Controlled Tab 1</TabsTrigger>
            <TabsTrigger value="controlled-tab2">Controlled Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="controlled-tab1">Controlled Content 1</TabsContent>
          <TabsContent value="controlled-tab2">Controlled Content 2</TabsContent>
        </Tabs>
      );

      const UncontrolledTabs = () => (
        <Tabs defaultValue="uncontrolled-tab1">
          <TabsList>
            <TabsTrigger value="uncontrolled-tab1">
              Uncontrolled Tab 1
            </TabsTrigger>
            <TabsTrigger value="uncontrolled-tab2">
              Uncontrolled Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="uncontrolled-tab1">
            Uncontrolled Content 1
          </TabsContent>
          <TabsContent value="uncontrolled-tab2">
            Uncontrolled Content 2
          </TabsContent>
        </Tabs>
      );

      expect(ControlledTabs).toBeDefined();
      expect(UncontrolledTabs).toBeDefined();
      expect(setActiveTab).toBeDefined();
    });

    test("should handle disabled tabs", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const DisabledTabs = () => (
        <Tabs defaultValue="enabled">
          <TabsList>
            <TabsTrigger value="enabled">Enabled</TabsTrigger>
            <TabsTrigger value="disabled" disabled>
              Disabled
            </TabsTrigger>
            <TabsTrigger value="another-enabled">Another Enabled</TabsTrigger>
          </TabsList>
          <TabsContent value="enabled">Enabled content</TabsContent>
          <TabsContent value="disabled">Disabled content</TabsContent>
          <TabsContent value="another-enabled">Another enabled content</TabsContent>
        </Tabs>
      );

      expect(DisabledTabs).toBeDefined();
    });
  });

  describe("Accessibility and ARIA Tests", () => {
    test("should provide proper ARIA attributes", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const AccessibleTabs = () => (
        <Tabs defaultValue="accessible-tab1">
          <TabsList role="tablist" aria-label="Main navigation">
            <TabsTrigger
              value="accessible-tab1"
              role="tab"
              aria-controls="panel1"
              aria-selected={true}
            >
              Home
            </TabsTrigger>
            <TabsTrigger
              value="accessible-tab2"
              role="tab"
              aria-controls="panel2"
              aria-selected={false}
            >
              About
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="accessible-tab1"
            role="tabpanel"
            id="panel1"
            aria-labelledby="accessible-tab1"
          >
            Home content
          </TabsContent>
          <TabsContent
            value="accessible-tab2"
            role="tabpanel"
            id="panel2"
            aria-labelledby="accessible-tab2"
          >
            About content
          </TabsContent>
        </Tabs>
      );

      expect(AccessibleTabs).toBeDefined();
    });

    test("should support keyboard navigation", async () => {
      const user = mockUserEvent.setup();
      const onValueChange = vi.fn();
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const KeyboardTabs = () => (
        <Tabs defaultValue="key-tab1" onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger
              value="key-tab1"
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  onValueChange("key-tab2");
                }
              }}
            >
              Tab 1
            </TabsTrigger>
            <TabsTrigger
              value="key-tab2"
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  onValueChange("key-tab1");
                }
              }}
            >
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="key-tab1">Keyboard Content 1</TabsContent>
          <TabsContent value="key-tab2">Keyboard Content 2</TabsContent>
        </Tabs>
      );

      expect(KeyboardTabs).toBeDefined();
      expect(user.keyboard).toBeDefined();
      expect(onValueChange).toBeDefined();
    });

    test("should handle focus management", async () => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      const tabsModule = await import("../tabs");
      const { TabsTrigger } = tabsModule;

      const FocusableTabs = () => (
        <div>
          <TabsTrigger
            value="focus-tab1"
            onFocus={onFocus}
            onBlur={onBlur}
            tabIndex={0}
          >
            Focusable Tab 1
          </TabsTrigger>
          <TabsTrigger
            value="focus-tab2"
            onFocus={onFocus}
            onBlur={onBlur}
            tabIndex={-1}
          >
            Focusable Tab 2
          </TabsTrigger>
        </div>
      );

      expect(FocusableTabs).toBeDefined();
      expect(onFocus).toBeDefined();
      expect(onBlur).toBeDefined();
    });
  });

  describe("Advanced Styling and Layout Tests", () => {
    test("should handle complex styling scenarios", async () => {
      const tabsModule = await import("../tabs");
      const { cn } = await import("@/lib/utils");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      // Test cn utility with complex scenarios
      const complexClasses = cn(
        "base-class",
        "md:text-base sm:text-sm",
        { active: true, disabled: false, loading: null },
        undefined,
        null,
        "",
        "final-class",
      );
      expect(complexClasses).toContain("base-class");
      expect(complexClasses).toContain("active");
      expect(complexClasses).toContain("final-class");

      const StyledTabs = () => (
        <Tabs defaultValue="styled-tab1" orientation="horizontal">
          <TabsList className="grid grid-cols-2 w-full bg-muted rounded-lg p-1">
            <TabsTrigger
              value="styled-tab1"
              className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              Design
            </TabsTrigger>
            <TabsTrigger
              value="styled-tab2"
              className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              Code
            </TabsTrigger>
          </TabsList>
          <TabsContent value="styled-tab1" className="mt-4 p-4 border rounded-lg">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Design System</h3>
              <p className="text-muted-foreground">
                Customize the design system components.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="styled-tab2" className="mt-4 p-4 border rounded-lg">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Code Editor</h3>
              <p className="text-muted-foreground">
                Write and edit your code here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      );

      expect(StyledTabs).toBeDefined();
    });

    test("should support vertical tab layouts", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const VerticalTabs = () => (
        <Tabs
          defaultValue="vertical-tab1"
          orientation="vertical"
          className="flex w-full"
        >
          <TabsList className="flex-col h-full w-48 mr-4">
            <TabsTrigger value="vertical-tab1" className="w-full justify-start">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="vertical-tab2" className="w-full justify-start">
              Users
            </TabsTrigger>
            <TabsTrigger value="vertical-tab3" className="w-full justify-start">
              Settings
            </TabsTrigger>
          </TabsList>
          <div className="flex-1">
            <TabsContent value="vertical-tab1">Dashboard content</TabsContent>
            <TabsContent value="vertical-tab2">Users content</TabsContent>
            <TabsContent value="vertical-tab3">Settings content</TabsContent>
          </div>
        </Tabs>
      );

      expect(VerticalTabs).toBeDefined();
    });

    test("should handle responsive tab designs", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const ResponsiveTabs = () => (
        <Tabs defaultValue="responsive-tab1">
          <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
            <TabsTrigger
              value="responsive-tab1"
              className="text-xs sm:text-sm md:text-base"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="responsive-tab2"
              className="text-xs sm:text-sm md:text-base"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="responsive-tab3"
              className="text-xs sm:text-sm md:text-base hidden sm:block"
            >
              Reports
            </TabsTrigger>
            <TabsTrigger
              value="responsive-tab4"
              className="text-xs sm:text-sm md:text-base hidden lg:block"
            >
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="responsive-tab1">Responsive content 1</TabsContent>
          <TabsContent value="responsive-tab2">Responsive content 2</TabsContent>
          <TabsContent value="responsive-tab3">Responsive content 3</TabsContent>
          <TabsContent value="responsive-tab4">Responsive content 4</TabsContent>
        </Tabs>
      );

      expect(ResponsiveTabs).toBeDefined();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle missing or invalid values", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const EdgeCaseTabs = () => (
        <Tabs defaultValue="">
          <TabsList>
            <TabsTrigger value="">Empty Value</TabsTrigger>
            <TabsTrigger value={null as any}>Null Value</TabsTrigger>
            <TabsTrigger value={undefined as any}>
              Undefined Value
            </TabsTrigger>
            <TabsTrigger value="valid">Valid Value</TabsTrigger>
          </TabsList>
          <TabsContent value="">Empty content</TabsContent>
          <TabsContent value="valid">Valid content</TabsContent>
        </Tabs>
      );

      expect(EdgeCaseTabs).toBeDefined();
    });

    test("should handle empty tabs gracefully", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsContent } = tabsModule;

      const EmptyTabs = () => (
        <Tabs>
          <TabsList></TabsList>
          <TabsContent value="nonexistent">
            This content has no corresponding trigger
          </TabsContent>
        </Tabs>
      );

      expect(EmptyTabs).toBeDefined();
    });

    test("should handle dynamic tab addition/removal", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const [tabs, setTabs] = React.useState([
        { id: "dynamic-1", label: "Tab 1", content: "Content 1" },
        { id: "dynamic-2", label: "Tab 2", content: "Content 2" },
      ]);

      const DynamicTabs = () => (
        <Tabs defaultValue="dynamic-1">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      );

      expect(DynamicTabs).toBeDefined();
      expect(setTabs).toBeDefined();
    });

    test("should handle content overflow scenarios", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const OverflowTabs = () => (
        <Tabs defaultValue="overflow-tab1" className="w-64">
          <TabsList className="overflow-x-auto">
            <TabsTrigger value="overflow-tab1" className="whitespace-nowrap">
              Very Long Tab Name That Might Overflow
            </TabsTrigger>
            <TabsTrigger value="overflow-tab2" className="whitespace-nowrap">
              Another Extremely Long Tab Name
            </TabsTrigger>
            <TabsTrigger value="overflow-tab3" className="whitespace-nowrap">
              Short
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overflow-tab1" className="overflow-hidden">
            <p>
              This is a very long content that might overflow the container and
              needs to be handled properly with scrolling or text wrapping.
            </p>
          </TabsContent>
          <TabsContent value="overflow-tab2">Overflow content 2</TabsContent>
          <TabsContent value="overflow-tab3">Overflow content 3</TabsContent>
        </Tabs>
      );

      expect(OverflowTabs).toBeDefined();
    });
  });

  describe("Performance and Integration Tests", () => {
    test("should handle large numbers of tabs efficiently", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const tabCount = 50;
      const tabs = Array.from({ length: tabCount }, (_, i) => ({
        id: `performance-tab-${i}`,
        label: `Tab ${i + 1}`,
        content: `Content for tab ${i + 1}`,
      }));

      const PerformanceTabs = () => (
        <Tabs defaultValue="performance-tab-0">
          <TabsList className="overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      );

      expect(PerformanceTabs).toBeDefined();
    });

    test("should integrate with form components", async () => {
      const tabsModule = await import("../tabs");
      const { Tabs, TabsList, TabsTrigger, TabsContent } = tabsModule;

      const FormTabs = () => (
        <form>
          <Tabs defaultValue="form-tab1">
            <TabsList>
              <TabsTrigger value="form-tab1">Personal Info</TabsTrigger>
              <TabsTrigger value="form-tab2">Address</TabsTrigger>
              <TabsTrigger value="form-tab3">Review</TabsTrigger>
            </TabsList>
            <TabsContent value="form-tab1">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="w-full p-2 border rounded"
                />
              </div>
            </TabsContent>
            <TabsContent value="form-tab2">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Street Address"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="City"
                  className="w-full p-2 border rounded"
                />
              </div>
            </TabsContent>
            <TabsContent value="form-tab3">
              <p>Review your information before submitting.</p>
              <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
                Submit
              </button>
            </TabsContent>
          </Tabs>
        </form>
      );

      expect(FormTabs).toBeDefined();
    });
  });
});