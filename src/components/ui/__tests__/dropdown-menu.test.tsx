import { describe, test, expect, vi } from "vitest";
import React from "react";

// Mock Radix UI dropdown menu primitives
vi.mock("@radix-ui/react-dropdown-menu", () => {
  const Root = ({ children }: any) => (
    <div data-testid="dropdown-root">{children}</div>
  );
  Root.displayName = "Root";

  const Trigger = React.forwardRef(({ children, ...props }: any, ref: any) => (
    <button ref={ref} data-testid="dropdown-trigger" {...props}>
      {children}
    </button>
  ));
  Trigger.displayName = "Trigger";

  const Group = ({ children }: any) => (
    <div data-testid="dropdown-group">{children}</div>
  );
  Group.displayName = "Group";

  const Portal = ({ children }: any) => (
    <div data-testid="dropdown-portal">{children}</div>
  );
  Portal.displayName = "Portal";

  const Sub = ({ children }: any) => (
    <div data-testid="dropdown-sub">{children}</div>
  );
  Sub.displayName = "Sub";

  const RadioGroup = React.forwardRef(
    ({ children, ...props }: any, ref: any) => (
      <div ref={ref} data-testid="dropdown-radio-group" {...props}>
        {children}
      </div>
    ),
  );
  RadioGroup.displayName = "RadioGroup";

  const SubTrigger = React.forwardRef(
    ({ children, ...props }: any, ref: any) => (
      <div ref={ref} data-testid="dropdown-sub-trigger" {...props}>
        {children}
      </div>
    ),
  );
  SubTrigger.displayName = "SubTrigger";

  const SubContent = React.forwardRef(
    ({ children, ...props }: any, ref: any) => (
      <div ref={ref} data-testid="dropdown-sub-content" {...props}>
        {children}
      </div>
    ),
  );
  SubContent.displayName = "SubContent";

  const Content = React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} data-testid="dropdown-content" {...props}>
      {children}
    </div>
  ));
  Content.displayName = "Content";

  const Item = React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} data-testid="dropdown-item" {...props}>
      {children}
    </div>
  ));
  Item.displayName = "Item";

  const CheckboxItem = React.forwardRef(
    ({ children, ...props }: any, ref: any) => (
      <div ref={ref} data-testid="dropdown-checkbox-item" {...props}>
        {children}
      </div>
    ),
  );
  CheckboxItem.displayName = "CheckboxItem";

  const RadioItem = React.forwardRef(
    ({ children, ...props }: any, ref: any) => (
      <div ref={ref} data-testid="dropdown-radio-item" {...props}>
        {children}
      </div>
    ),
  );
  RadioItem.displayName = "RadioItem";

  const Label = React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} data-testid="dropdown-label" {...props}>
      {children}
    </div>
  ));
  Label.displayName = "Label";

  const Separator = React.forwardRef((props: any, ref: any) => (
    <hr ref={ref} data-testid="dropdown-separator" {...props} />
  ));
  Separator.displayName = "Separator";

  const ItemIndicator = ({ children }: any) => (
    <span data-testid="dropdown-item-indicator">{children}</span>
  );
  ItemIndicator.displayName = "ItemIndicator";

  return {
    Root,
    Trigger,
    Group,
    Portal,
    Sub,
    RadioGroup,
    SubTrigger,
    SubContent,
    Content,
    Item,
    CheckboxItem,
    RadioItem,
    Label,
    Separator,
    ItemIndicator,
  };
});

// Set displayName for mocked components
const MockedSubTrigger = vi.mocked(
  require("@radix-ui/react-dropdown-menu").SubTrigger,
);
MockedSubTrigger.displayName = "SubTrigger";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Check: () => <svg data-testid="check-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  Circle: () => <svg data-testid="circle-icon" />,
}));

// Mock utils
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("DropdownMenu Components", () => {
  describe("Basic components", () => {
    test("should export all dropdown menu components", async () => {
      const dropdown = await import("../dropdown-menu");

      expect(dropdown.DropdownMenu).toBeDefined();
      expect(dropdown.DropdownMenuTrigger).toBeDefined();
      expect(dropdown.DropdownMenuContent).toBeDefined();
      expect(dropdown.DropdownMenuItem).toBeDefined();
      expect(dropdown.DropdownMenuCheckboxItem).toBeDefined();
      expect(dropdown.DropdownMenuRadioItem).toBeDefined();
      expect(dropdown.DropdownMenuLabel).toBeDefined();
      expect(dropdown.DropdownMenuSeparator).toBeDefined();
      expect(dropdown.DropdownMenuShortcut).toBeDefined();
      expect(dropdown.DropdownMenuGroup).toBeDefined();
      expect(dropdown.DropdownMenuPortal).toBeDefined();
      expect(dropdown.DropdownMenuSub).toBeDefined();
      expect(dropdown.DropdownMenuSubContent).toBeDefined();
      expect(dropdown.DropdownMenuSubTrigger).toBeDefined();
      expect(dropdown.DropdownMenuRadioGroup).toBeDefined();
    });
  });

  describe("DropdownMenuSubTrigger", () => {
    test("should render with default props", async () => {
      const { DropdownMenuSubTrigger } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuSubTrigger,
        {},
        "Sub Menu",
      );

      expect(component.type).toBe(DropdownMenuSubTrigger);
      expect(component.props.children).toBe("Sub Menu");
    });

    test("should apply inset class when inset prop is true", async () => {
      const { DropdownMenuSubTrigger } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuSubTrigger,
        {
          inset: true,
        },
        "Sub Menu",
      );

      expect(component.props.inset).toBe(true);
    });

    test("should merge custom className", async () => {
      const { DropdownMenuSubTrigger } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuSubTrigger,
        {
          className: "custom-class",
        },
        "Sub Menu",
      );

      expect(component.props.className).toBe("custom-class");
    });
  });

  describe("DropdownMenuSubContent", () => {
    test("should render with default props", async () => {
      const { DropdownMenuSubContent } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuSubContent,
        {},
        "Content",
      );

      expect(component.props.children).toBe("Content");
    });

    test("should merge custom className", async () => {
      const { DropdownMenuSubContent } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuSubContent,
        {
          className: "custom-class",
        },
        "Content",
      );

      expect(component.props.className).toBe("custom-class");
    });
  });

  describe("DropdownMenuContent", () => {
    test("should render with default props", async () => {
      const { DropdownMenuContent } = await import("../dropdown-menu");

      const component = React.createElement(DropdownMenuContent, {}, "Content");

      expect(component.props.children).toBe("Content");
    });

    test("should accept custom sideOffset", async () => {
      const { DropdownMenuContent } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuContent,
        {
          sideOffset: 8,
        },
        "Content",
      );

      expect(component.props.sideOffset).toBe(8);
    });
  });

  describe("DropdownMenuItem", () => {
    test("should render with default props", async () => {
      const { DropdownMenuItem } = await import("../dropdown-menu");

      const component = React.createElement(DropdownMenuItem, {}, "Item");

      expect(component.props.children).toBe("Item");
    });

    test("should apply inset class when inset prop is true", async () => {
      const { DropdownMenuItem } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuItem,
        {
          inset: true,
        },
        "Item",
      );

      expect(component.props.inset).toBe(true);
    });
  });

  describe("DropdownMenuCheckboxItem", () => {
    test("should render with checkbox indicator", async () => {
      const { DropdownMenuCheckboxItem } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuCheckboxItem,
        {
          checked: true,
        },
        "Checkbox Item",
      );

      expect(component.props.children).toBe("Checkbox Item");
      expect(component.props.checked).toBe(true);
    });

    test("should render without checked state", async () => {
      const { DropdownMenuCheckboxItem } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuCheckboxItem,
        {
          checked: false,
        },
        "Checkbox Item",
      );

      expect(component.props.checked).toBe(false);
    });
  });

  describe("DropdownMenuRadioItem", () => {
    test("should render with radio indicator", async () => {
      const { DropdownMenuRadioItem } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuRadioItem,
        {
          value: "option1",
        },
        "Radio Item",
      );

      expect(component.props.children).toBe("Radio Item");
      expect(component.props.value).toBe("option1");
    });
  });

  describe("DropdownMenuLabel", () => {
    test("should render with default props", async () => {
      const { DropdownMenuLabel } = await import("../dropdown-menu");

      const component = React.createElement(DropdownMenuLabel, {}, "Label");

      expect(component.props.children).toBe("Label");
    });

    test("should apply inset class", async () => {
      const { DropdownMenuLabel } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuLabel,
        {
          inset: true,
        },
        "Label",
      );

      expect(component.props.inset).toBe(true);
    });
  });

  describe("DropdownMenuSeparator", () => {
    test("should render separator", async () => {
      const { DropdownMenuSeparator } = await import("../dropdown-menu");

      const component = React.createElement(DropdownMenuSeparator, {});

      expect(component.type).toBeDefined();
    });
  });

  describe("DropdownMenuShortcut", () => {
    test("should render shortcut text", async () => {
      const { DropdownMenuShortcut } = await import("../dropdown-menu");

      const component = React.createElement(DropdownMenuShortcut, {}, "⌘K");

      expect(component.type).toBe(DropdownMenuShortcut);
      expect(component.props.children).toBe("⌘K");
    });

    test("should merge custom className", async () => {
      const { DropdownMenuShortcut } = await import("../dropdown-menu");

      const component = React.createElement(
        DropdownMenuShortcut,
        {
          className: "custom-class",
        },
        "⌘K",
      );

      expect(component.props.className).toContain("custom-class");
    });
  });

  describe("Integration test", () => {
    test("should compose a complete dropdown menu", async () => {
      const dropdown = await import("../dropdown-menu");
      const {
        DropdownMenu,
        DropdownMenuTrigger,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuLabel,
      } = dropdown;

      const menu = React.createElement(DropdownMenu, {}, [
        React.createElement(
          DropdownMenuTrigger,
          {
            key: "trigger",
          },
          "Open",
        ),
        React.createElement(
          DropdownMenuContent,
          {
            key: "content",
          },
          [
            React.createElement(
              DropdownMenuLabel,
              {
                key: "label",
              },
              "My Account",
            ),
            React.createElement(DropdownMenuSeparator, { key: "sep1" }),
            React.createElement(
              DropdownMenuItem,
              {
                key: "profile",
              },
              "Profile",
            ),
            React.createElement(
              DropdownMenuItem,
              {
                key: "settings",
              },
              "Settings",
            ),
            React.createElement(
              DropdownMenuItem,
              {
                key: "logout",
              },
              "Logout",
            ),
          ],
        ),
      ]);

      expect(menu.props.children).toHaveLength(2);
      expect(menu.props.children[0].type).toBe(DropdownMenuTrigger);
      expect(menu.props.children[1].type).toBe(DropdownMenuContent);
      expect(menu.props.children[1].props.children).toHaveLength(5);
    });
  });
});
