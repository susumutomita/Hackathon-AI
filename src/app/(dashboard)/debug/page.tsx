"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DebugPage() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]); // プロジェクトデータを保存するためのステート
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
      setProjects(data.projects); // APIからのプロジェクトデータをステートに保存
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
