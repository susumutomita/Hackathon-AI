"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { searchIdeas } from "@/lib/searchIdeas";
import { Project } from "@/types";

export default function IdeaForm() {
  const [idea, setIdea] = useState("");
  const [results, setResults] = useState<Project[]>([]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const matches = await searchIdeas(idea);
    setResults(matches);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Enter your idea"
          className="input"
        />
        <Button type="submit">Submit</Button>
      </form>
      <div className="mt-4">
        {results.length > 0 ? (
          <ul>
            {results.map((result, index) => (
              <li key={index} className="border-b py-2">
                {result.title} - {result.description}
              </li>
            ))}
          </ul>
        ) : (
          <p>No matching ideas found.</p>
        )}
      </div>
    </div>
  );
}
