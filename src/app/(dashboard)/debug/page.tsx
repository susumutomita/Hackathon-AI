"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Project } from "@/types";

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCrawl = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/crawl");
      if (!response.ok) {
        throw new Error("Failed to fetch crawling data");
      }
      const data = await response.json();

      const filteredProjects = data.projects.filter(
        (project: Project) => project.prize,
      );

      setProjects(filteredProjects);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>EthGlobal Showcase Crawler</h1>
      <Button onClick={handleCrawl} disabled={loading}>
        {loading ? "Crawling..." : "Start Crawling"}
      </Button>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <div className="mt-4">
        {projects.length > 0 ? (
          <ul>
            {projects.map((project, index) => (
              <li key={index} className="border-b py-2">
                <a
                  href={`https://ethglobal.com${project.link}`}
                  className="text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {project.title}
                </a>
                <p>{project.description}</p>
                <p className="text-gray-500">Hackathon: {project.hackathon}</p>
                {project.sourceCode && (
                  <p className="text-gray-500">
                    <strong>Source Code: </strong>
                    <a
                      href={project.sourceCode}
                      className="text-blue-600 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.sourceCode}
                    </a>
                  </p>
                )}
                {project.projectDescription && (
                  <p className="text-gray-500">
                    <strong>Project Description: </strong>
                    {project.projectDescription}
                  </p>
                )}
                {project.howItsMade && (
                  <p className="text-gray-500">
                    <strong>How it Made: </strong>
                    {project.howItsMade}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p>No projects found.</p>
        )}
      </div>
    </div>
  );
}
