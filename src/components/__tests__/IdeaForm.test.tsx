import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactElement } from "react";

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, disabled, onClick, type }: any) => (
    <button type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableCell: ({ children, className }: any) => (
    <td className={className}>{children}</td>
  ),
}));

vi.mock("react-textarea-autosize", () => ({
  default: ({ value, onChange, placeholder, className, minRows }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      rows={minRows}
    />
  ),
}));

// Global fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock React hooks
let mockIdea = "";
let mockResults: any[] = [];
let mockImprovedIdea = "";
let mockLoading = false;

const mockSetIdea = vi.fn((value: any) => {
  mockIdea = typeof value === "function" ? value(mockIdea) : value;
});
const mockSetResults = vi.fn((value: any) => {
  mockResults = typeof value === "function" ? value(mockResults) : value;
});
const mockSetImprovedIdea = vi.fn((value: any) => {
  mockImprovedIdea =
    typeof value === "function" ? value(mockImprovedIdea) : value;
});
const mockSetLoading = vi.fn((value: any) => {
  mockLoading = typeof value === "function" ? value(mockLoading) : value;
});

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  // Track call count to determine which state hook is being called
  let callIndex = 0;

  return {
    ...actual,
    useState: (initial: any) => {
      const currentCallIndex = callIndex++;

      // Reset for next component render
      if (callIndex >= 4) {
        callIndex = 0;
      }

      // Return states based on the order they appear in the component
      if (currentCallIndex === 0) {
        // idea state
        return [mockIdea !== undefined ? mockIdea : initial, mockSetIdea];
      } else if (currentCallIndex === 1) {
        // results state
        return [mockResults, mockSetResults];
      } else if (currentCallIndex === 2) {
        // improvedIdea state
        return [mockImprovedIdea, mockSetImprovedIdea];
      } else if (currentCallIndex === 3) {
        // loading state
        return [mockLoading, mockSetLoading];
      }

      return [initial, vi.fn()];
    },
  };
});

describe("IdeaForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdea = "";
    mockResults = [];
    mockImprovedIdea = "";
    mockLoading = false;
    mockFetch.mockReset();
    mockSetIdea.mockClear();
    mockSetResults.mockClear();
    mockSetImprovedIdea.mockClear();
    mockSetLoading.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should render component with initial state", async () => {
    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Check component type
    expect(component.type).toBe("div");
    expect(component.props.className).toBe("container mx-auto px-4");

    // Check initial states
    expect(mockIdea).toBe(""); // idea
    expect(mockResults).toEqual([]); // results
    expect(mockImprovedIdea).toBe(""); // improvedIdea
    expect(mockLoading).toBe(false); // loading
  });

  test("should handle successful form submission", async () => {
    const projectsData = [
      {
        title: "Similar Project 1",
        description: "Description 1",
        link: "/project1",
      },
    ];

    // Set the idea value before creating the component
    mockIdea = "Test idea";

    // Mock successful search API response followed by successful improve API response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: projectsData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          improvedIdea: "Improved idea based on similar projects",
        }),
      });

    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Simulate form submission
    const formElement = component.props.children[1].props.children[0].props
      .children[1] as ReactElement;
    const handleSubmit = formElement.props.onSubmit;

    const mockEvent = {
      preventDefault: vi.fn(),
    };

    await handleSubmit(mockEvent);

    // Verify search API was called correctly
    expect(mockFetch).toHaveBeenCalledWith("/api/search-ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: "Test idea" }),
    });

    // Verify improve API was called correctly with search results (lines 52-53)
    expect(mockFetch).toHaveBeenCalledWith("/api/improve-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idea: "Test idea",
        similarProjects: projectsData,
      }),
    });

    // Verify setImprovedIdea was called with the response (line 53)
    expect(mockSetImprovedIdea).toHaveBeenCalledWith(
      "Improved idea based on similar projects",
    );

    // Verify setResults was called with search results
    expect(mockSetResults).toHaveBeenCalledWith(projectsData);

    // Verify loading state was set properly
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  test("should handle search API error", async () => {
    // Set the idea value before creating the component
    mockIdea = "Test idea";

    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Simulate form submission
    const formElement = component.props.children[1].props.children[0].props
      .children[1] as ReactElement;
    const handleSubmit = formElement.props.onSubmit;

    const mockEvent = {
      preventDefault: vi.fn(),
    };

    await handleSubmit(mockEvent);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error during search:",
      expect.any(Error),
    );
    expect(mockSetLoading).toHaveBeenCalledWith(false); // loading end

    consoleErrorSpy.mockRestore();
  });

  test("should handle improve API error", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Simulate form submission
    const formElement = component.props.children[1].props.children[0].props
      .children[1] as ReactElement;
    const handleSubmit = formElement.props.onSubmit;

    const mockEvent = {
      preventDefault: vi.fn(),
    };

    await handleSubmit(mockEvent);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error during search:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  test("should handle network error", async () => {
    // Set the idea value before creating the component
    mockIdea = "Test idea";

    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Simulate form submission
    const formElement = component.props.children[1].props.children[0].props
      .children[1] as ReactElement;
    const handleSubmit = formElement.props.onSubmit;

    const mockEvent = {
      preventDefault: vi.fn(),
    };

    await handleSubmit(mockEvent);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error during search:",
      expect.any(Error),
    );
    expect(mockSetLoading).toHaveBeenCalledWith(false); // loading end

    consoleErrorSpy.mockRestore();
  });

  test("should update idea state on textarea change", async () => {
    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Get idea textarea
    const ideaTextarea = component.props.children[1].props.children[0].props
      .children[1].props.children[0] as ReactElement;

    // Simulate onChange
    const mockEvent = {
      target: { value: "New idea text" },
    };
    ideaTextarea.props.onChange(mockEvent);

    expect(mockSetIdea).toHaveBeenCalledWith("New idea text");
  });

  test("should update improvedIdea state on textarea change", async () => {
    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Get improved idea textarea
    const improvedTextarea = component.props.children[1].props.children[1].props
      .children[1] as ReactElement;

    // Simulate onChange
    const mockEvent = {
      target: { value: "Updated improved idea" },
    };
    improvedTextarea.props.onChange(mockEvent);

    expect(mockSetImprovedIdea).toHaveBeenCalledWith("Updated improved idea");
  });

  test("should disable submit button when loading", async () => {
    // Set loading state to true
    mockLoading = true;

    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Get submit button
    const submitButton = component.props.children[1].props.children[0].props
      .children[1].props.children[1] as ReactElement;

    expect(submitButton.props.disabled).toBe(true);
    expect(submitButton.props.children).toBe("Searching...");
  });

  test("should render results table when results exist", async () => {
    const testResults = [
      {
        title: "Project 1",
        description: "Description 1",
        link: "/project-1",
        howItsMade: "Made with love",
        sourceCode: "https://github.com/test/project1",
      },
      {
        title: "Project 2",
        description: null,
        link: "/project-2",
        howItsMade: null,
        sourceCode: null,
      },
    ];

    // Set results state
    mockResults = testResults;

    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Get results section
    const resultsSection = component.props.children[2] as ReactElement;
    const tableContent = resultsSection.props.children[1] as ReactElement;

    expect(tableContent.type.name).toBe("Table");

    // Check table rows
    const tableBody = tableContent.props.children[1] as ReactElement;
    expect(tableBody.props.children).toHaveLength(2);

    // Check first row content
    const firstRow = tableBody.props.children[0] as ReactElement;
    const firstRowCells = firstRow.props.children;

    // Title cell with link
    const titleLink = firstRowCells[0].props.children;
    expect(titleLink.props.href).toBe("https://ethglobal.com/project-1");
    expect(titleLink.props.children).toBe("Project 1");

    // Description cell
    expect(firstRowCells[1].props.children).toBe("Description 1");

    // Source code cell with link
    const sourceLink = firstRowCells[3].props.children;
    expect(sourceLink.props.href).toBe("https://github.com/test/project1");

    // Check second row for N/A values
    const secondRow = tableBody.props.children[1] as ReactElement;
    const secondRowCells = secondRow.props.children;

    expect(secondRowCells[1].props.children).toBe("N/A");
    expect(secondRowCells[2].props.children).toBe("N/A");
    expect(secondRowCells[3].props.children).toBe("N/A");
  });

  test("should show no results message when not loading and no results", async () => {
    // Set results to empty and loading to false
    mockResults = [];
    mockLoading = false;

    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Get results section
    const resultsSection = component.props.children[2] as ReactElement;
    const noResultsMessage = resultsSection.props.children[1] as ReactElement;

    expect(noResultsMessage.type).toBe("p");
    expect(noResultsMessage.props.children).toBe("No matching ideas found.");
  });

  test("should not show no results message when loading", async () => {
    // Set results to empty and loading to true
    mockResults = [];
    mockLoading = true;

    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Get results section
    const resultsSection = component.props.children[2] as ReactElement;
    const content = resultsSection.props.children[1];

    // Should be false (no message shown)
    expect(content).toBe(false);
  });

  test("should render header with correct link and description", async () => {
    const ideaFormModule = await import("../IdeaForm");
    const IdeaForm = ideaFormModule.default;

    const component = IdeaForm({}) as ReactElement;

    // Get header section
    const headerSection = component.props.children[0] as ReactElement;
    const headerLink = headerSection.props.children[0] as ReactElement;
    const description = headerSection.props.children[1] as ReactElement;

    expect(headerLink.type).toBe("a");
    expect(headerLink.props.href).toBe(
      "https://github.com/susumutomita/Hackathon-AI",
    );
    expect(headerLink.props.children).toBe("Hackathon AI");
    expect(headerLink.props.target).toBe("_blank");
    expect(headerLink.props.rel).toBe("noopener noreferrer");

    expect(description.type).toBe("p");
    expect(description.props.children).toContain(
      "Hackathon AI helps you enhance your project ideas",
    );
  });
});
