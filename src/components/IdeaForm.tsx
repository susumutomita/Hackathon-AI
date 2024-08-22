"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { searchIdeas } from "@/lib/searchIdeas";
import { Project } from "@/types";

export default function IdeaForm() {
  const [idea, setIdea] = useState("");
  const [results, setResults] = useState<Project[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const matches = await searchIdeas(idea);
    setResults(matches);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [idea]);

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <textarea
          ref={textareaRef}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Enter your idea"
          className="input resize-none overflow-hidden w-full max-w-lg sm:max-w-full sm:w-3/4 lg:w-1/2"
          rows={10}
        />
      </form>
      <Button type="submit" className="w-full sm:w-auto">
        Submit
      </Button>
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
