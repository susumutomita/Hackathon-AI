import { Project } from "@/types";

export async function searchIdeas(idea: string): Promise<Project[]> {
  return [
    {
      title: "Example Project 1",
      link: "https://example.com/project1",
      description: "This is an example description for Project 1.",
    },
    {
      title: "Example Project 2",
      link: "https://example.com/project2",
      description: "This is an example description for Project 2.",
    },
  ];
}
