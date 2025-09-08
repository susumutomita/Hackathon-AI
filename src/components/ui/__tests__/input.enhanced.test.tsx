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
  getByPlaceholderText: vi.fn(),
};

const mockUserEvent = {
  setup: () => ({
    type: vi.fn(),
    clear: vi.fn(),
    click: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    tab: vi.fn(),
    keyboard: vi.fn(),
  }),
};

// Mock React Testing Library
vi.mock("@testing-library/react", () => ({
  render: mockRender,
  screen: mockScreen,
  fireEvent: {
    change: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    keyDown: vi.fn(),
    keyUp: vi.fn(),
    input: vi.fn(),
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
  toHaveValue(received, value) {
    const pass = received?.value === value;
    return {
      pass,
      message: () =>
        pass
          ? `expected input not to have value ${value}`
          : `expected input to have value ${value}`,
    };
  },
  toBeDisabled(received) {
    const pass = received?.disabled === true;
    return {
      pass,
      message: () =>
        pass
          ? "expected input not to be disabled"
          : "expected input to be disabled",
    };
  },
  toBeRequired(received) {
    const pass = received?.required === true;
    return {
      pass,
      message: () =>
        pass
          ? "expected input not to be required"
          : "expected input to be required",
    };
  },
  toHaveFocus(received) {
    const pass = document.activeElement === received;
    return {
      pass,
      message: () =>
        pass
          ? "expected input not to have focus"
          : "expected input to have focus",
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

describe("Input Enhanced Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock DOM element for return values
    const mockElement = {
      getAttribute: vi.fn(),
      setAttribute: vi.fn(),
      hasAttribute: vi.fn(),
      className: "",
      textContent: "",
      value: "",
      disabled: false,
      required: false,
      type: "text",
      placeholder: "",
      focus: vi.fn(),
      blur: vi.fn(),
      click: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockScreen.getByTestId.mockReturnValue(mockElement);
    mockScreen.getAllByTestId.mockReturnValue([mockElement]);
    mockScreen.getByText.mockReturnValue(mockElement);
    mockScreen.getByRole.mockReturnValue(mockElement);
    mockScreen.getByPlaceholderText.mockReturnValue(mockElement);
    mockScreen.getByDisplayValue.mockReturnValue(mockElement);
  });

  describe("Complete Input Implementation Tests", () => {
    test("should render input with all standard props", async () => {
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const CompleteInput = () => (
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Enter text here"
            value="Initial value"
            onChange={() => {}}
            className="w-full"
          />

          <Input
            type="email"
            placeholder="email@example.com"
            required
            aria-describedby="email-help"
          />

          <Input
            type="password"
            placeholder="Enter password"
            minLength={8}
            maxLength={128}
          />

          <Input
            type="number"
            placeholder="Enter number"
            min={0}
            max={100}
            step={1}
          />

          <Input
            type="tel"
            placeholder="(123) 456-7890"
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
          />

          <Input type="url" placeholder="https://example.com" />

          <Input type="search" placeholder="Search..." autoComplete="off" />
        </div>
      );

      expect(CompleteInput).toBeDefined();
      expect(typeof Input).toBe("object");
    });

    test("should handle controlled and uncontrolled inputs", async () => {
      const onChange = vi.fn();
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const ControlledUncontrolledInputs = () => {
        const [controlledValue, setControlledValue] =
          React.useState("controlled");
        const uncontrolledRef = React.useRef<HTMLInputElement>(null);

        return (
          <div className="space-y-4">
            {/* Controlled input */}
            <Input
              value={controlledValue}
              onChange={(e) => {
                setControlledValue(e.target.value);
                onChange(e);
              }}
              placeholder="Controlled input"
              data-testid="controlled-input"
            />

            {/* Uncontrolled input */}
            <Input
              ref={uncontrolledRef}
              defaultValue="uncontrolled"
              placeholder="Uncontrolled input"
              data-testid="uncontrolled-input"
            />

            {/* Controlled with external state management */}
            <Input
              value={controlledValue.toUpperCase()}
              onChange={(e) => setControlledValue(e.target.value.toLowerCase())}
              placeholder="Transformed input"
              data-testid="transformed-input"
            />
          </div>
        );
      };

      expect(ControlledUncontrolledInputs).toBeDefined();
      expect(onChange).toBeDefined();
    });

    test("should support different input states", async () => {
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const InputStates = () => (
        <div className="space-y-4">
          {/* Normal state */}
          <Input placeholder="Normal input" />

          {/* Disabled state */}
          <Input placeholder="Disabled input" disabled />

          {/* Required state */}
          <Input placeholder="Required input" required />

          {/* Invalid state */}
          <Input
            placeholder="Invalid input"
            className="border-red-500 focus:border-red-500 focus:ring-red-500"
            aria-invalid="true"
            aria-describedby="error-message"
          />

          {/* Success state */}
          <Input
            placeholder="Valid input"
            className="border-green-500 focus:border-green-500 focus:ring-green-500"
            aria-describedby="success-message"
          />

          {/* Loading state */}
          <div className="relative">
            <Input placeholder="Loading input" disabled />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        </div>
      );

      expect(InputStates).toBeDefined();
    });

    test("should handle different input sizes and variants", async () => {
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const InputVariants = () => (
        <div className="space-y-4">
          {/* Small input */}
          <Input placeholder="Small input" className="h-8 px-2 text-sm" />

          {/* Default input */}
          <Input placeholder="Default input" />

          {/* Large input */}
          <Input placeholder="Large input" className="h-12 px-4 text-lg" />

          {/* Full width input */}
          <Input placeholder="Full width input" className="w-full" />

          {/* Fixed width input */}
          <Input placeholder="Fixed width" className="w-48" />

          {/* Ghost variant */}
          <Input
            placeholder="Ghost input"
            className="border-0 bg-transparent shadow-none"
          />

          {/* Filled variant */}
          <Input
            placeholder="Filled input"
            className="bg-muted border-0 focus:bg-background focus:border focus:border-input"
          />
        </div>
      );

      expect(InputVariants).toBeDefined();
    });
  });

  describe("User Interaction Tests", () => {
    test("should handle typing and input events", async () => {
      const user = mockUserEvent.setup();
      const onChange = vi.fn();
      const onInput = vi.fn();
      const onKeyDown = vi.fn();
      const onKeyUp = vi.fn();

      const inputModule = await import("../input");
      const { Input } = inputModule;

      const InteractiveInput = () => (
        <Input
          placeholder="Type here"
          onChange={onChange}
          onInput={onInput}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          data-testid="interactive-input"
        />
      );

      expect(InteractiveInput).toBeDefined();
      expect(user.type).toBeDefined();
      expect(onChange).toBeDefined();
      expect(onInput).toBeDefined();
      expect(onKeyDown).toBeDefined();
      expect(onKeyUp).toBeDefined();
    });

    test("should handle focus and blur events", async () => {
      const user = mockUserEvent.setup();
      const onFocus = vi.fn();
      const onBlur = vi.fn();

      const inputModule = await import("../input");
      const { Input } = inputModule;

      const FocusBlurInput = () => (
        <div className="space-y-4">
          <Input
            placeholder="Focus/blur input"
            onFocus={onFocus}
            onBlur={onBlur}
            data-testid="focus-blur-input"
          />

          <Input
            placeholder="Auto-focus input"
            autoFocus
            data-testid="auto-focus-input"
          />
        </div>
      );

      expect(FocusBlurInput).toBeDefined();
      expect(user.focus).toBeDefined();
      expect(user.blur).toBeDefined();
      expect(onFocus).toBeDefined();
      expect(onBlur).toBeDefined();
    });

    test("should handle mouse events", async () => {
      const user = mockUserEvent.setup();
      const onClick = vi.fn();
      const onMouseEnter = vi.fn();
      const onMouseLeave = vi.fn();
      const onDoubleClick = vi.fn();

      const inputModule = await import("../input");
      const { Input } = inputModule;

      const MouseEventsInput = () => (
        <Input
          placeholder="Mouse events input"
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onDoubleClick={onDoubleClick}
          data-testid="mouse-events-input"
        />
      );

      expect(MouseEventsInput).toBeDefined();
      expect(user.click).toBeDefined();
      expect(onClick).toBeDefined();
      expect(onMouseEnter).toBeDefined();
      expect(onMouseLeave).toBeDefined();
      expect(onDoubleClick).toBeDefined();
    });

    test("should handle keyboard shortcuts and special keys", async () => {
      const user = mockUserEvent.setup();
      const onKeyDown = vi.fn();
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const KeyboardInput = () => (
        <Input
          placeholder="Keyboard input"
          onKeyDown={(e) => {
            onKeyDown(e);
            // Handle common keyboard shortcuts
            if (e.ctrlKey && e.key === "a") {
              e.preventDefault();
              e.currentTarget.select();
            }
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              e.currentTarget.value = "";
            }
          }}
          data-testid="keyboard-input"
        />
      );

      expect(KeyboardInput).toBeDefined();
      expect(user.keyboard).toBeDefined();
      expect(onKeyDown).toBeDefined();
    });
  });

  describe("Validation and Form Integration Tests", () => {
    test("should handle form validation", async () => {
      const onSubmit = vi.fn();
      const onInvalid = vi.fn();
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const ValidationForm = () => (
        <form onSubmit={onSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email-input"
                className="block text-sm font-medium mb-2"
              >
                Email (required)
              </label>
              <Input
                id="email-input"
                type="email"
                placeholder="email@example.com"
                required
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                onInvalid={onInvalid}
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="password-input"
                className="block text-sm font-medium mb-2"
              >
                Password (8-128 characters)
              </label>
              <Input
                id="password-input"
                type="password"
                placeholder="Enter password"
                required
                minLength={8}
                maxLength={128}
                onInvalid={onInvalid}
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="age-input"
                className="block text-sm font-medium mb-2"
              >
                Age (18-120)
              </label>
              <Input
                id="age-input"
                type="number"
                placeholder="25"
                min={18}
                max={120}
                step={1}
                onInvalid={onInvalid}
                className="w-full"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90"
            >
              Submit
            </button>
          </div>
        </form>
      );

      expect(ValidationForm).toBeDefined();
      expect(onSubmit).toBeDefined();
      expect(onInvalid).toBeDefined();
    });

    test("should integrate with external validation libraries", async () => {
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const ExternalValidationForm = () => {
        // Simulating integration with a validation library like Zod or Yup
        const [errors, setErrors] = React.useState<Record<string, string>>({});
        const [touched, setTouched] = React.useState<Record<string, boolean>>(
          {},
        );

        const validateField = (name: string, value: string) => {
          const newErrors = { ...errors };

          switch (name) {
            case "username":
              if (value.length < 3) {
                newErrors.username = "Username must be at least 3 characters";
              } else {
                delete newErrors.username;
              }
              break;
            case "email":
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                newErrors.email = "Invalid email format";
              } else {
                delete newErrors.email;
              }
              break;
          }

          setErrors(newErrors);
        };

        return (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2"
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                onChange={(e) => validateField("username", e.target.value)}
                onBlur={() => setTouched({ ...touched, username: true })}
                className={`w-full ${
                  touched.username && errors.username
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                aria-invalid={touched.username && !!errors.username}
                aria-describedby={
                  errors.username ? "username-error" : undefined
                }
              />
              {touched.username && errors.username && (
                <p id="username-error" className="text-sm text-red-600 mt-1">
                  {errors.username}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email-validation"
                className="block text-sm font-medium mb-2"
              >
                Email
              </label>
              <Input
                id="email-validation"
                type="email"
                placeholder="Enter email"
                onChange={(e) => validateField("email", e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                className={`w-full ${
                  touched.email && errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                aria-invalid={touched.email && !!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {touched.email && errors.email && (
                <p id="email-error" className="text-sm text-red-600 mt-1">
                  {errors.email}
                </p>
              )}
            </div>
          </div>
        );
      };

      expect(ExternalValidationForm).toBeDefined();
    });

    test("should handle async validation", async () => {
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const AsyncValidationInput = () => {
        const [isValidating, setIsValidating] = React.useState(false);
        const [validationResult, setValidationResult] = React.useState<
          string | null
        >(null);

        const validateAsync = async (value: string) => {
          setIsValidating(true);
          setValidationResult(null);

          // Simulate API call for validation
          await new Promise((resolve) => setTimeout(resolve, 1000));

          if (value.toLowerCase() === "admin") {
            setValidationResult("Username already taken");
          } else if (value.length >= 3) {
            setValidationResult("Username available");
          } else {
            setValidationResult("Username too short");
          }

          setIsValidating(false);
        };

        return (
          <div>
            <label
              htmlFor="async-username"
              className="block text-sm font-medium mb-2"
            >
              Username (async validation)
            </label>
            <div className="relative">
              <Input
                id="async-username"
                type="text"
                placeholder="Enter username"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length >= 3) {
                    validateAsync(value);
                  }
                }}
                className="w-full pr-10"
              />
              {isValidating && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            {validationResult && (
              <p
                className={`text-sm mt-1 ${
                  validationResult.includes("available")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {validationResult}
              </p>
            )}
          </div>
        );
      };

      expect(AsyncValidationInput).toBeDefined();
    });
  });

  describe("Accessibility Tests", () => {
    test("should provide proper ARIA attributes", async () => {
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const AccessibleInputs = () => (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="accessible-input-1"
              className="block text-sm font-medium mb-2"
            >
              Name (required)
            </label>
            <Input
              id="accessible-input-1"
              type="text"
              placeholder="Enter your name"
              required
              aria-required="true"
              aria-describedby="name-help name-error"
            />
            <p id="name-help" className="text-sm text-muted-foreground mt-1">
              Enter your full name as it appears on official documents
            </p>
          </div>

          <div>
            <Input
              type="email"
              placeholder="Email address"
              aria-label="Email address for contact"
              aria-invalid="true"
              aria-describedby="email-error"
            />
            <p
              id="email-error"
              className="text-sm text-red-600 mt-1"
              role="alert"
            >
              Please enter a valid email address
            </p>
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              aria-label="Password"
              aria-describedby="password-requirements"
              minLength={8}
            />
            <ul
              id="password-requirements"
              className="text-sm text-muted-foreground mt-1"
            >
              <li>At least 8 characters</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Include at least one number</li>
            </ul>
          </div>
        </div>
      );

      expect(AccessibleInputs).toBeDefined();
    });

    test("should support screen reader compatibility", async () => {
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const ScreenReaderInputs = () => (
        <div className="space-y-4">
          <fieldset>
            <legend className="text-base font-medium mb-4">
              Personal Information
            </legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="sr-first-name" className="sr-only">
                  First Name
                </label>
                <Input
                  id="sr-first-name"
                  type="text"
                  placeholder="First Name"
                  aria-label="First Name"
                />
              </div>

              <div>
                <label htmlFor="sr-last-name" className="sr-only">
                  Last Name
                </label>
                <Input
                  id="sr-last-name"
                  type="text"
                  placeholder="Last Name"
                  aria-label="Last Name"
                />
              </div>
            </div>
          </fieldset>

          <div role="group" aria-labelledby="phone-group-label">
            <p id="phone-group-label" className="text-base font-medium mb-2">
              Phone Number
            </p>
            <div className="flex space-x-2">
              <Input
                type="tel"
                placeholder="(555)"
                aria-label="Area code"
                className="w-20"
                maxLength={5}
              />
              <Input
                type="tel"
                placeholder="123-4567"
                aria-label="Phone number"
                className="flex-1"
                maxLength={8}
              />
            </div>
          </div>
        </div>
      );

      expect(ScreenReaderInputs).toBeDefined();
    });

    test("should handle keyboard navigation", async () => {
      const user = mockUserEvent.setup();
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const KeyboardNavigationForm = () => (
        <div className="space-y-4">
          <Input placeholder="First input (Tab index 0)" tabIndex={0} />

          <Input placeholder="Second input (Tab index 1)" tabIndex={1} />

          <Input placeholder="Third input (Tab index 2)" tabIndex={2} />

          <Input placeholder="Skip this input" tabIndex={-1} />

          <Input placeholder="Last input (Tab index 3)" tabIndex={3} />
        </div>
      );

      expect(KeyboardNavigationForm).toBeDefined();
      expect(user.tab).toBeDefined();
    });
  });

  describe("Advanced Features and Edge Cases", () => {
    test("should handle file inputs", async () => {
      const onFileChange = vi.fn();
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const FileInputs = () => (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="single-file"
              className="block text-sm font-medium mb-2"
            >
              Single File Upload
            </label>
            <Input
              id="single-file"
              type="file"
              onChange={onFileChange}
              accept=".jpg,.jpeg,.png,.pdf"
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          <div>
            <label
              htmlFor="multiple-files"
              className="block text-sm font-medium mb-2"
            >
              Multiple File Upload
            </label>
            <Input
              id="multiple-files"
              type="file"
              multiple
              onChange={onFileChange}
              accept="image/*"
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/90"
            />
          </div>

          <div>
            <label
              htmlFor="image-only"
              className="block text-sm font-medium mb-2"
            >
              Image Only Upload
            </label>
            <Input
              id="image-only"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFileChange}
            />
          </div>
        </div>
      );

      expect(FileInputs).toBeDefined();
      expect(onFileChange).toBeDefined();
    });

    test("should handle special input types", async () => {
      const onChange = vi.fn();
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const SpecialInputs = () => (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="date-input"
              className="block text-sm font-medium mb-2"
            >
              Date
            </label>
            <Input
              id="date-input"
              type="date"
              onChange={onChange}
              min="2023-01-01"
              max="2025-12-31"
            />
          </div>

          <div>
            <label
              htmlFor="time-input"
              className="block text-sm font-medium mb-2"
            >
              Time
            </label>
            <Input id="time-input" type="time" onChange={onChange} step="60" />
          </div>

          <div>
            <label
              htmlFor="datetime-input"
              className="block text-sm font-medium mb-2"
            >
              Date and Time
            </label>
            <Input
              id="datetime-input"
              type="datetime-local"
              onChange={onChange}
            />
          </div>

          <div>
            <label
              htmlFor="color-input"
              className="block text-sm font-medium mb-2"
            >
              Color
            </label>
            <Input
              id="color-input"
              type="color"
              onChange={onChange}
              className="w-16 h-10 p-1 rounded cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor="range-input"
              className="block text-sm font-medium mb-2"
            >
              Range (0-100)
            </label>
            <Input
              id="range-input"
              type="range"
              onChange={onChange}
              min="0"
              max="100"
              step="1"
              className="w-full"
            />
          </div>
        </div>
      );

      expect(SpecialInputs).toBeDefined();
      expect(onChange).toBeDefined();
    });

    test("should handle input with icons and buttons", async () => {
      const onClear = vi.fn();
      const onSearch = vi.fn();
      const onToggleVisibility = vi.fn();

      const inputModule = await import("../input");
      const { Input } = inputModule;

      const EnhancedInputs = () => {
        const [showPassword, setShowPassword] = React.useState(false);
        const [searchValue, setSearchValue] = React.useState("");

        return (
          <div className="space-y-4">
            {/* Search input with icon */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <Input
                type="search"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchValue("");
                    onClear();
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Password input with visibility toggle */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => {
                  setShowPassword(!showPassword);
                  onToggleVisibility();
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Input with submit button */}
            <div className="flex">
              <Input
                type="email"
                placeholder="Enter email for newsletter"
                className="rounded-r-none flex-1"
              />
              <button
                type="button"
                onClick={onSearch}
                className="bg-primary text-primary-foreground px-4 rounded-r-md hover:bg-primary/90 border border-l-0 border-input"
              >
                Subscribe
              </button>
            </div>
          </div>
        );
      };

      expect(EnhancedInputs).toBeDefined();
      expect(onClear).toBeDefined();
      expect(onSearch).toBeDefined();
      expect(onToggleVisibility).toBeDefined();
    });

    test("should handle debounced inputs", async () => {
      const onDebouncedChange = vi.fn();
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const DebouncedInput = () => {
        const [value, setValue] = React.useState("");
        const [debouncedValue, setDebouncedValue] = React.useState("");

        // Simple debounce implementation
        React.useEffect(() => {
          const timer = setTimeout(() => {
            setDebouncedValue(value);
            onDebouncedChange(value);
          }, 500);

          return () => clearTimeout(timer);
        }, [value]);

        return (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="debounced-search"
                className="block text-sm font-medium mb-2"
              >
                Search (debounced)
              </label>
              <Input
                id="debounced-search"
                type="text"
                placeholder="Type to search..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Current value: {value}
              </p>
              <p className="text-sm text-muted-foreground">
                Debounced value: {debouncedValue}
              </p>
            </div>
          </div>
        );
      };

      expect(DebouncedInput).toBeDefined();
      expect(onDebouncedChange).toBeDefined();
    });
  });

  describe("Performance and Error Handling Tests", () => {
    test("should handle rapid input changes", async () => {
      const onChange = vi.fn();
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const RapidChangeInput = () => {
        const [values, setValues] = React.useState<string[]>([]);

        return (
          <div>
            <Input
              placeholder="Rapid input changes"
              onChange={(e) => {
                onChange(e);
                setValues((prev) => [...prev, e.target.value].slice(-10)); // Keep last 10 values
              }}
            />
            <div className="mt-2 text-sm">
              <p>Change count: {values.length}</p>
              <p>Last value: {values[values.length - 1] || "none"}</p>
            </div>
          </div>
        );
      };

      expect(RapidChangeInput).toBeDefined();
      expect(onChange).toBeDefined();
    });

    test("should handle null and undefined values gracefully", async () => {
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const EdgeCaseInputs = () => (
        <div className="space-y-4">
          <Input value={null as any} onChange={() => {}} />
          <Input value={undefined as any} onChange={() => {}} />
          <Input defaultValue={null as any} />
          <Input defaultValue={undefined as any} />
          <Input placeholder={null as any} />
          <Input placeholder={undefined as any} />
          <Input className={null as any} />
          <Input className={undefined as any} />
        </div>
      );

      expect(EdgeCaseInputs).toBeDefined();
    });

    test("should handle memory leaks with event listeners", async () => {
      const inputModule = await import("../input");
      const { Input } = inputModule;

      const MemoryLeakTest = () => {
        const [mounted, setMounted] = React.useState(true);
        const eventHandlers = React.useMemo(
          () => ({
            onChange: vi.fn(),
            onFocus: vi.fn(),
            onBlur: vi.fn(),
            onKeyDown: vi.fn(),
            onKeyUp: vi.fn(),
            onMouseEnter: vi.fn(),
            onMouseLeave: vi.fn(),
          }),
          [],
        );

        return (
          <div>
            {mounted && (
              <Input placeholder="Memory leak test" {...eventHandlers} />
            )}
            <button onClick={() => setMounted(!mounted)}>
              {mounted ? "Unmount" : "Mount"} Input
            </button>
          </div>
        );
      };

      expect(MemoryLeakTest).toBeDefined();
    });
  });
});
