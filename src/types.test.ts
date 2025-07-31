import { describe, it, expect } from "vitest";
import type { Project } from "./types";

describe("Project type", () => {
  it("should accept valid Project objects", () => {
    const validProject: Project = {
      title: "Test Project",
      description: "A test project description",
    };

    expect(validProject.title).toBe("Test Project");
    expect(validProject.description).toBe("A test project description");
  });

  it("should accept Project with all optional fields", () => {
    const completeProject: Project = {
      title: "Complete Project",
      description: "A complete project",
      prize: true,
      link: "https://example.com",
      hackathon: "ETHGlobal 2024",
      sourceCode: "https://github.com/example/project",
      projectDescription: "Detailed description",
      howItsMade: "Built with React and Node.js",
    };

    expect(completeProject.prize).toBe(true);
    expect(completeProject.link).toBe("https://example.com");
    expect(completeProject.hackathon).toBe("ETHGlobal 2024");
    expect(completeProject.sourceCode).toBe(
      "https://github.com/example/project",
    );
    expect(completeProject.projectDescription).toBe("Detailed description");
    expect(completeProject.howItsMade).toBe("Built with React and Node.js");
  });

  it("should accept Project with empty string for projectDescription", () => {
    const projectWithEmptyDescription: Project = {
      title: "Empty Description Project",
      description: "Main description",
      projectDescription: "",
    };

    expect(projectWithEmptyDescription.projectDescription).toBe("");
  });

  it("should work with undefined optional fields", () => {
    const minimalProject: Project = {
      title: "Minimal Project",
      description: "Minimal description",
    };

    expect(minimalProject.prize).toBeUndefined();
    expect(minimalProject.link).toBeUndefined();
    expect(minimalProject.hackathon).toBeUndefined();
    expect(minimalProject.sourceCode).toBeUndefined();
    expect(minimalProject.projectDescription).toBeUndefined();
    expect(minimalProject.howItsMade).toBeUndefined();
  });

  it("should work with arrays of Projects", () => {
    const projects: Project[] = [
      { title: "Project 1", description: "Description 1" },
      { title: "Project 2", description: "Description 2", prize: true },
      {
        title: "Project 3",
        description: "Description 3",
        link: "https://example.com",
      },
    ];

    expect(projects).toHaveLength(3);
    expect(projects[0].title).toBe("Project 1");
    expect(projects[1].prize).toBe(true);
    expect(projects[2].link).toBe("https://example.com");
  });
});
