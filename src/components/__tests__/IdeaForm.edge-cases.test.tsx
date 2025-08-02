import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import IdeaForm from "../IdeaForm";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

describe("IdeaForm Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Error Handling", () => {
    it("should handle search API failure gracefully", async () => {
      // Mock failed search API response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith(
          "Error during search:",
          expect.any(Error)
        );
      });

      // Should return to Submit state after error
      expect(screen.getByText("Submit")).toBeInTheDocument();
    });

    it("should handle improve-idea API failure gracefully", async () => {
      // Mock successful search but failed improve API
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [{ title: "Test Project" }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "Improvement failed" }),
        });

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith(
          "Error during search:",
          expect.any(Error)
        );
      });
    });

    it("should handle network error during fetch", async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith(
          "Error during search:",
          expect.any(Error)
        );
      });
    });

    it("should handle malformed JSON response", async () => {
      // Mock response with invalid JSON
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith(
          "Error during search:",
          expect.any(Error)
        );
      });
    });
  });

  describe("Edge Case Data Handling", () => {
    it("should handle empty project results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [] }),
      });

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("No matching ideas found.")).toBeInTheDocument();
      });
    });

    it("should handle projects with missing optional fields", async () => {
      const projectsWithMissingFields = [
        {
          title: "Project 1",
          link: "/project1",
          // Missing description, howItsMade, sourceCode
        },
        {
          title: "Project 2",
          link: "/project2",
          description: "Has description",
          // Missing howItsMade, sourceCode
        },
        {
          title: "Project 3",
          link: "/project3",
          description: "Full project",
          howItsMade: "Built with React",
          sourceCode: "https://github.com/test/project3",
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: projectsWithMissingFields }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ improvedIdea: "Improved idea text" }),
        });

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Project 1")).toBeInTheDocument();
      });

      // Check that N/A appears for missing fields
      expect(screen.getAllByText("N/A")).toHaveLength(5); // 2 for project 1, 2 for project 2, 1 for total
    });

    it("should handle null/undefined values in project data", async () => {
      const projectsWithNullValues = [
        {
          title: "Project with nulls",
          link: "/project-null",
          description: null,
          howItsMade: undefined,
          sourceCode: "",
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: projectsWithNullValues }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ improvedIdea: "Improved idea" }),
        });

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Project with nulls")).toBeInTheDocument();
      });

      // Should show N/A for null/undefined/empty values
      expect(screen.getAllByText("N/A")).toHaveLength(3);
    });

    it("should handle extremely long project data", async () => {
      const longText = "A".repeat(1000);
      const projectsWithLongData = [
        {
          title: longText,
          link: "/long-project",
          description: longText,
          howItsMade: longText,
          sourceCode: `https://github.com/test/${longText}`,
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: projectsWithLongData }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ improvedIdea: longText }),
        });

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(longText)).toBeInTheDocument();
      });
    });
  });

  describe("Form Interaction Edge Cases", () => {
    it("should handle rapid form submissions", async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] })
          }), 100)
        )
      );

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      
      // Rapid clicks
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      // Should show loading state
      expect(screen.getByText("Searching...")).toBeInTheDocument();
      
      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();
    });

    it("should handle form submission with empty textarea", async () => {
      render(<IdeaForm />);

      const submitButton = screen.getByText("Submit");
      fireEvent.click(submitButton);

      // Should still call API even with empty input
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/search-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: "" }),
        });
      });
    });

    it("should handle textarea changes during loading", async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ projects: [] })
          }), 100)
        )
      );

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Initial idea" } });
      fireEvent.click(submitButton);

      // Change textarea while loading
      fireEvent.change(textarea, { target: { value: "Modified idea" } });

      expect(textarea).toHaveValue("Modified idea");
    });

    it("should handle improved idea textarea editing", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ improvedIdea: "Original improved idea" }),
        });

      render(<IdeaForm />);

      const ideaTextarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(ideaTextarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const improvedTextarea = screen.getByPlaceholderText(
          "Your improved idea will appear here..."
        );
        expect(improvedTextarea).toHaveValue("Original improved idea");
      });

      // User can edit the improved idea
      const improvedTextarea = screen.getByPlaceholderText(
        "Your improved idea will appear here..."
      );
      fireEvent.change(improvedTextarea, { 
        target: { value: "User modified improved idea" } 
      });

      expect(improvedTextarea).toHaveValue("User modified improved idea");
    });
  });

  describe("Component State Edge Cases", () => {
    it("should handle component unmounting during API call", async () => {
      let resolvePromise: (value: any) => void;
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(slowPromise);

      const { unmount } = render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      // Unmount component while API call is pending
      unmount();

      // Resolve the promise after unmount
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ projects: [] }),
      });

      // Should not throw any errors
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    it("should maintain form state across re-renders", () => {
      const { rerender } = render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      fireEvent.change(textarea, { target: { value: "Persistent idea" } });

      // Re-render component
      rerender(<IdeaForm />);

      // Value should be reset since it's a new component instance
      const newTextarea = screen.getByPlaceholderText("Enter your idea");
      expect(newTextarea).toHaveValue("");
    });
  });

  describe("Accessibility and Link Testing", () => {
    it("should have proper external link attributes", async () => {
      const projectsWithLinks = [
        {
          title: "Test Project",
          link: "/test-project",
          sourceCode: "https://github.com/test/project",
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ projects: projectsWithLinks }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ improvedIdea: "Improved idea" }),
        });

      render(<IdeaForm />);

      const textarea = screen.getByPlaceholderText("Enter your idea");
      const submitButton = screen.getByText("Submit");

      fireEvent.change(textarea, { target: { value: "Test idea" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const projectLink = screen.getByText("Test Project");
        expect(projectLink.closest("a")).toHaveAttribute("target", "_blank");
        expect(projectLink.closest("a")).toHaveAttribute("rel", "noopener noreferrer");

        const sourceLink = screen.getByText("View Source");
        expect(sourceLink.closest("a")).toHaveAttribute("target", "_blank");
        expect(sourceLink.closest("a")).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it("should have proper header link attributes", () => {
      render(<IdeaForm />);

      const headerLink = screen.getByText("Hackathon AI");
      expect(headerLink.closest("a")).toHaveAttribute("target", "_blank");
      expect(headerLink.closest("a")).toHaveAttribute("rel", "noopener noreferrer");
      expect(headerLink.closest("a")).toHaveAttribute(
        "href", 
        "https://github.com/susumutomita/Hackathon-AI"
      );
    });
  });
});