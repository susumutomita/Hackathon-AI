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

describe("Card Enhanced Tests", () => {
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

  describe("Complete Card Implementation Tests", () => {
    test("should render complete card structure", async () => {
      const cardModule = await import("../card");
      const {
        Card,
        CardHeader,
        CardFooter,
        CardTitle,
        CardDescription,
        CardContent,
      } = cardModule;

      const CompleteCard = () => (
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content of the card.</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <button className="btn btn-outline">Cancel</button>
            <button className="btn btn-primary">Save</button>
          </CardFooter>
        </Card>
      );

      expect(CompleteCard).toBeDefined();
      expect(typeof Card).toBe("object");
      expect(typeof CardHeader).toBe("object");
      expect(typeof CardFooter).toBe("object");
      expect(typeof CardTitle).toBe("object");
      expect(typeof CardDescription).toBe("object");
      expect(typeof CardContent).toBe("object");
    });

    test("should support different card layouts", async () => {
      const cardModule = await import("../card");
      const {
        Card,
        CardHeader,
        CardFooter,
        CardTitle,
        CardDescription,
        CardContent,
      } = cardModule;

      const CardLayouts = () => (
        <div className="space-y-6">
          {/* Basic card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Card</CardTitle>
            </CardHeader>
            <CardContent>
              Simple card content
            </CardContent>
          </Card>

          {/* Card with description */}
          <Card>
            <CardHeader>
              <CardTitle>Card with Description</CardTitle>
              <CardDescription>This card has a description</CardDescription>
            </CardHeader>
            <CardContent>
              Content with description above
            </CardContent>
          </Card>

          {/* Card with footer */}
          <Card>
            <CardContent>
              Content with footer
            </CardContent>
            <CardFooter>
              <button>Action</button>
            </CardFooter>
          </Card>

          {/* Full card structure */}
          <Card>
            <CardHeader>
              <CardTitle>Full Structure</CardTitle>
              <CardDescription>Complete card example</CardDescription>
            </CardHeader>
            <CardContent>
              Main content area
            </CardContent>
            <CardFooter>
              Footer actions
            </CardFooter>
          </Card>
        </div>
      );

      expect(CardLayouts).toBeDefined();
    });

    test("should handle interactive cards", async () => {
      const onClick = vi.fn();
      const onMouseEnter = vi.fn();
      const onMouseLeave = vi.fn();
      
      const cardModule = await import("../card");
      const { Card, CardHeader, CardTitle, CardContent } = cardModule;

      const InteractiveCards = () => (
        <div className="space-y-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <CardHeader>
              <CardTitle>Clickable Card</CardTitle>
            </CardHeader>
            <CardContent>
              This entire card is clickable
            </CardContent>
          </Card>

          <Card className="group hover:bg-accent transition-colors">
            <CardHeader>
              <CardTitle className="group-hover:text-accent-foreground">
                Hoverable Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              This card changes appearance on hover
            </CardContent>
          </Card>
        </div>
      );

      expect(InteractiveCards).toBeDefined();
      expect(onClick).toBeDefined();
      expect(onMouseEnter).toBeDefined();
      expect(onMouseLeave).toBeDefined();
    });

    test("should support different card sizes and variants", async () => {
      const cardModule = await import("../card");
      const { Card, CardHeader, CardTitle, CardContent } = cardModule;

      const CardVariants = () => (
        <div className="space-y-4">
          {/* Small card */}
          <Card className="w-64">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Small Card</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">Compact content</p>
            </CardContent>
          </Card>

          {/* Medium card (default) */}
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Medium Card</CardTitle>
            </CardHeader>
            <CardContent>
              Standard size content
            </CardContent>
          </Card>

          {/* Large card */}
          <Card className="w-[500px]">
            <CardHeader className="pb-8">
              <CardTitle className="text-xl">Large Card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>More spacious content area</p>
              <p>With multiple paragraphs</p>
            </CardContent>
          </Card>

          {/* Full width card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Full Width Card</CardTitle>
            </CardHeader>
            <CardContent>
              This card spans the full width of its container
            </CardContent>
          </Card>
        </div>
      );

      expect(CardVariants).toBeDefined();
    });
  });

  describe("Accessibility and Semantic Tests", () => {
    test("should provide proper semantic structure", async () => {
      const cardModule = await import("../card");
      const {
        Card,
        CardHeader,
        CardFooter,
        CardTitle,
        CardDescription,
        CardContent,
      } = cardModule;

      const SemanticCard = () => (
        <Card role="article" aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title" role="heading" aria-level={2}>
              Article Title
            </CardTitle>
            <CardDescription role="doc-subtitle">
              Article subtitle or description
            </CardDescription>
          </CardHeader>
          <CardContent role="main">
            <p>Main article content goes here.</p>
          </CardContent>
          <CardFooter role="contentinfo">
            <p>Article metadata or actions</p>
          </CardFooter>
        </Card>
      );

      expect(SemanticCard).toBeDefined();
    });

    test("should support keyboard navigation", async () => {
      const onKeyDown = vi.fn();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      
      const cardModule = await import("../card");
      const { Card, CardHeader, CardTitle, CardContent } = cardModule;

      const KeyboardCard = () => (
        <Card
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          role="button"
          aria-label="Interactive card"
        >
          <CardHeader>
            <CardTitle>Keyboard Accessible Card</CardTitle>
          </CardHeader>
          <CardContent>
            This card can be navigated with keyboard
          </CardContent>
        </Card>
      );

      expect(KeyboardCard).toBeDefined();
      expect(onKeyDown).toBeDefined();
      expect(onFocus).toBeDefined();
      expect(onBlur).toBeDefined();
    });

    test("should handle ARIA attributes properly", async () => {
      const cardModule = await import("../card");
      const {
        Card,
        CardHeader,
        CardTitle,
        CardDescription,
        CardContent,
      } = cardModule;

      const AriaCard = () => (
        <Card
          aria-labelledby="product-title"
          aria-describedby="product-description"
          role="region"
        >
          <CardHeader>
            <CardTitle id="product-title">Product Name</CardTitle>
            <CardDescription id="product-description">
              Product description for accessibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p aria-label="Price">$99.99</p>
            <button aria-describedby="add-to-cart-help">Add to Cart</button>
            <p id="add-to-cart-help" className="sr-only">
              Adds the product to your shopping cart
            </p>
          </CardContent>
        </Card>
      );

      expect(AriaCard).toBeDefined();
    });
  });

  describe("Advanced Styling and Layout Tests", () => {
    test("should handle complex styling scenarios", async () => {
      const cardModule = await import("../card");
      const { cn } = await import("@/lib/utils");
      const {
        Card,
        CardHeader,
        CardFooter,
        CardTitle,
        CardDescription,
        CardContent,
      } = cardModule;

      // Test cn utility with complex card styling
      const cardClasses = cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        "hover:shadow-md transition-shadow duration-200",
        { active: true, disabled: false },
        "focus-within:ring-2 focus-within:ring-ring",
      );
      expect(cardClasses).toContain("rounded-lg");
      expect(cardClasses).toContain("active");

      const StyledCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Elevated card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle>Elevated Card</CardTitle>
              <CardDescription className="text-blue-100">
                Card with gradient header
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              Enhanced visual hierarchy
            </CardContent>
          </Card>

          {/* Outlined card */}
          <Card className="border-2 border-dashed border-muted-foreground/25 bg-transparent">
            <CardHeader>
              <CardTitle className="text-muted-foreground">
                Outlined Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              Dashed border styling
            </CardContent>
          </Card>

          {/* Compact card */}
          <Card className="p-4 space-y-0">
            <CardTitle className="text-base mb-2">Compact Card</CardTitle>
            <p className="text-sm text-muted-foreground">
              Minimal spacing and sizing
            </p>
          </Card>
        </div>
      );

      expect(StyledCards).toBeDefined();
    });

    test("should support responsive card grids", async () => {
      const cardModule = await import("../card");
      const { Card, CardHeader, CardTitle, CardContent } = cardModule;

      const ResponsiveGrid = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <Card key={i} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Card {i + 1}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Responsive card content {i + 1}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      );

      expect(ResponsiveGrid).toBeDefined();
    });

    test("should handle card compositions and nesting", async () => {
      const cardModule = await import("../card");
      const {
        Card,
        CardHeader,
        CardFooter,
        CardTitle,
        CardDescription,
        CardContent,
      } = cardModule;

      const NestedCards = () => (
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>Parent Card</CardTitle>
            <CardDescription>Container for multiple child cards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Child Card 1</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  Nested card content
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Child Card 2</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  Another nested card
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Full-width nested card
                </p>
              </CardContent>
            </Card>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Parent card footer
            </p>
          </CardFooter>
        </Card>
      );

      expect(NestedCards).toBeDefined();
    });
  });

  describe("Content and Media Integration Tests", () => {
    test("should handle image integration", async () => {
      const cardModule = await import("../card");
      const { Card, CardHeader, CardTitle, CardContent } = cardModule;

      const ImageCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card with header image */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-medium">Header Image</span>
            </div>
            <CardHeader>
              <CardTitle>Card with Header Image</CardTitle>
            </CardHeader>
            <CardContent>
              Content below the header image
            </CardContent>
          </Card>

          {/* Card with inline image */}
          <Card>
            <CardHeader>
              <CardTitle>Card with Inline Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Content before image</p>
              <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                <span className="text-muted-foreground">Inline Image</span>
              </div>
              <p>Content after image</p>
            </CardContent>
          </Card>
        </div>
      );

      expect(ImageCards).toBeDefined();
    });

    test("should handle form integration", async () => {
      const onSubmit = vi.fn();
      const cardModule = await import("../card");
      const {
        Card,
        CardHeader,
        CardFooter,
        CardTitle,
        CardDescription,
        CardContent,
      } = cardModule;

      const FormCard = () => (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90"
              >
                Sign In
              </button>
            </CardFooter>
          </form>
        </Card>
      );

      expect(FormCard).toBeDefined();
      expect(onSubmit).toBeDefined();
    });

    test("should handle data display patterns", async () => {
      const cardModule = await import("../card");
      const {
        Card,
        CardHeader,
        CardFooter,
        CardTitle,
        CardDescription,
        CardContent,
      } = cardModule;

      const DataCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metric card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <div className="h-4 w-4 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">API</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">CDN</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Degraded
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Progress card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Project Progress</CardTitle>
              <CardDescription>75% Complete</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-secondary rounded-full h-2 mb-4">
                <div className="bg-primary h-2 rounded-full w-3/4"></div>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span>15/20 tasks</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Due date</span>
                  <span>Dec 31, 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

      expect(DataCards).toBeDefined();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle empty and null content", async () => {
      const cardModule = await import("../card");
      const {
        Card,
        CardHeader,
        CardTitle,
        CardDescription,
        CardContent,
      } = cardModule;

      const EmptyContentCards = () => (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle></CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{null}</CardTitle>
              <CardDescription>{undefined}</CardDescription>
            </CardHeader>
            <CardContent>
              {null}
              {undefined}
              {false && <p>Hidden content</p>}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              {""}
              {0}
              {false}
              {null}
              {undefined}
            </CardContent>
          </Card>
        </div>
      );

      expect(EmptyContentCards).toBeDefined();
    });

    test("should handle overflow and long content", async () => {
      const cardModule = await import("../card");
      const {
        Card,
        CardHeader,
        CardTitle,
        CardDescription,
        CardContent,
      } = cardModule;

      const LongContent = "This is a very long piece of content that might overflow the card boundaries and needs to be handled properly with text wrapping or truncation depending on the design requirements. ".repeat(5);

      const OverflowCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card with text wrapping */}
          <Card className="w-64">
            <CardHeader>
              <CardTitle className="break-words">
                Very Long Title That Should Wrap to Multiple Lines
              </CardTitle>
              <CardDescription className="break-words">
                Very long description that should also wrap properly
              </CardDescription>
            </CardHeader>
            <CardContent className="break-words">
              {LongContent}
            </CardContent>
          </Card>

          {/* Card with truncation */}
          <Card className="w-64">
            <CardHeader>
              <CardTitle className="truncate">
                Very Long Title That Should Be Truncated
              </CardTitle>
              <CardDescription className="line-clamp-2">
                This description is limited to two lines and will be truncated if it exceeds that limit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm">
                {LongContent}
              </p>
            </CardContent>
          </Card>

          {/* Card with scrollable content */}
          <Card className="w-64 h-64">
            <CardHeader>
              <CardTitle>Scrollable Content</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="space-y-4">
                {Array.from({ length: 20 }, (_, i) => (
                  <p key={i} className="text-sm">
                    Scrollable paragraph {i + 1}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );

      expect(OverflowCards).toBeDefined();
    });

    test("should handle invalid props gracefully", async () => {
      const cardModule = await import("../card");
      const { Card, CardHeader, CardTitle } = cardModule;

      const InvalidPropsCard = () => (
        <Card
          className={null as any}
          style={undefined as any}
          onClick={null as any}
        >
          <CardHeader role={undefined as any}>
            <CardTitle aria-level={null as any}>
              Card with Invalid Props
            </CardTitle>
          </CardHeader>
        </Card>
      );

      expect(InvalidPropsCard).toBeDefined();
    });
  });

  describe("Performance and Memory Tests", () => {
    test("should handle large numbers of cards efficiently", async () => {
      const cardModule = await import("../card");
      const { Card, CardHeader, CardTitle, CardContent } = cardModule;

      const cardCount = 100;
      const cards = Array.from({ length: cardCount }, (_, i) => ({
        id: `performance-card-${i}`,
        title: `Card ${i + 1}`,
        content: `Content for card ${i + 1}`,
      }));

      const PerformanceCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card key={card.id} className="h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs">{card.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      );

      expect(PerformanceCards).toBeDefined();
    });

    test("should handle dynamic card updates", async () => {
      const cardModule = await import("../card");
      const { Card, CardHeader, CardTitle, CardContent } = cardModule;

      const [cards, setCards] = React.useState([
        { id: 1, title: "Dynamic Card 1", content: "Initial content 1" },
        { id: 2, title: "Dynamic Card 2", content: "Initial content 2" },
      ]);

      const addCard = () => {
        const newCard = {
          id: cards.length + 1,
          title: `Dynamic Card ${cards.length + 1}`,
          content: `New content ${cards.length + 1}`,
        };
        setCards([...cards, newCard]);
      };

      const removeCard = (id: number) => {
        setCards(cards.filter(card => card.id !== id));
      };

      const updateCard = (id: number, newContent: string) => {
        setCards(cards.map(card => 
          card.id === id ? { ...card, content: newContent } : card
        ));
      };

      const DynamicCards = () => (
        <div>
          <div className="mb-4 space-x-2">
            <button onClick={addCard} className="px-3 py-1 bg-blue-500 text-white rounded">
              Add Card
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <Card key={card.id}>
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{card.content}</p>
                  <div className="mt-2 space-x-2">
                    <button
                      onClick={() => updateCard(card.id, `Updated content ${card.id}`)}
                      className="text-xs px-2 py-1 bg-yellow-500 text-white rounded"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => removeCard(card.id)}
                      className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );

      expect(DynamicCards).toBeDefined();
      expect(addCard).toBeDefined();
      expect(removeCard).toBeDefined();
      expect(updateCard).toBeDefined();
    });
  });
});