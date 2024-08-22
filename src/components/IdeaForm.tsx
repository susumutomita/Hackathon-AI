"use client";
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function IdeaForm() {
  const [idea, setIdea] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    } catch (error: any) {
      console.error("Error during search:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 sm:w-3/4 lg:w-1/2"
      >
        <textarea
          ref={textareaRef}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Enter your idea"
          className="input resize-none overflow-hidden w-full"
          rows={10}
        />
        <Button
          type="submit"
          className="w-full sm:w-auto self-center sm:self-start"
          disabled={loading}
        >
          {loading ? "Searching..." : "Submit"}
        </Button>
      </form>
      <div className="mt-4">
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
