"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TextareaAutosize from "react-textarea-autosize";

export default function IdeaForm() {
  const [idea, setIdea] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [improvedIdea, setImprovedIdea] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/search-ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea }),
      });

      if (!response.ok) {
        throw new Error("Failed to search for similar projects");
      }

      const data = await response.json();
      setResults(data.projects);

      const improvedResponse = await fetch("/api/improve-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea, similarProjects: data.projects }),
      });

      if (!improvedResponse.ok) {
        throw new Error("Failed to generate improved idea");
      }

      const improvedData = await improvedResponse.json();
      setImprovedIdea(improvedData.improvedIdea);
    } catch (error: any) {
      console.error("Error during search:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      {/* Header with Link */}
      <div className="text-center my-6">
        <a
          href="https://github.com/susumutomita/Hackathon-AI"
          className="text-2xl font-bold text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Hackathon AI
        </a>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Submit Your Idea Section */}
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-4">Submit Your Idea</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextareaAutosize
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Enter your idea"
              className="input resize-none overflow-auto w-full p-2 border rounded"
              minRows={5}
            />
            <Button
              type="submit"
              className="w-full sm:w-auto self-center sm:self-start"
              disabled={loading}
            >
              {loading ? "Searching..." : "Submit"}
            </Button>
          </form>
        </div>

        {/* Improved Idea Section */}
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-4">Improved Idea</h2>
          <TextareaAutosize
            value={improvedIdea}
            onChange={(e) => setImprovedIdea(e.target.value)}
            placeholder="Your improved idea will appear here..."
            className="input resize-none overflow-auto w-full p-2 border rounded"
            minRows={5}
          />
        </div>
      </div>

      {/* Similar Projects Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">
          Past Finalist Projects with Similar Ideas
        </h2>
        {results.length > 0 ? (
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
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <a
                      href={`https://ethglobal.com${result.link}`}
                      className="text-blue-600 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {result.title}
                    </a>
                  </TableCell>
                  <TableCell>{result.description || "N/A"}</TableCell>
                  <TableCell>{result.howItsMade || "N/A"}</TableCell>
                  <TableCell>
                    {result.sourceCode ? (
                      <a
                        href={result.sourceCode}
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
          !loading && <p>No matching ideas found.</p>
        )}
      </div>
    </div>
  );
}
