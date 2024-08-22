"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Project } from "@/types";

export default function FinalistList() {
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
      setProjects(data.projects);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handleCrawl} disabled={loading}>
        {loading ? "Crawling..." : "Start Crawling"}
      </Button>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      <div className="mt-4">
        {projects.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Project Description</TableHead>
                <TableHead>How it’s Made</TableHead>
                <TableHead>Source Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <a
                      href={`https://ethglobal.com${project.link}`}
                      className="text-blue-600 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.title}
                    </a>
                  </TableCell>
                  <TableCell>{project.projectDescription || "N/A"}</TableCell>
                  <TableCell>{project.howItsMade || "N/A"}</TableCell>
                  <TableCell>
                    {project.sourceCode ? (
                      <a
                        href={project.sourceCode}
                        className="text-blue-600 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Source
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !loading
        )}
      </div>
    </div>
  );
}
