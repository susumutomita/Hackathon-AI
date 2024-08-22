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
        >
          Submit
        </Button>
      </form>
      <div className="mt-4">
        {results !== null && results.length > 0 ? (
          <ul>
            {results.map((result, index) => (
              <li key={index} className="border-b py-2">
                {result.title} - {result.description}
              </li>
            ))}
          </ul>
        ) : (
          results !== null && <p>No matching ideas found.</p>
        )}
      </div>
    </div>
  );
}
