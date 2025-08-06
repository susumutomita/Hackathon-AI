"use client";
import React, { useState, useCallback, useMemo, memo } from "react";
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
import { useFormValidation } from "@/hooks/useFormValidation";
import { sanitizeString } from "@/lib/validation";
import { sanitizeUrl, escapeHtmlAttribute } from "@/lib/sanitizer";

const IdeaForm = memo(function IdeaForm() {
  const [idea, setIdea] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [improvedIdea, setImprovedIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  
  const { errors, validateField, clearErrors } = useFormValidation();

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      
      // Clear previous errors
      clearErrors();
      
      // Validate the idea input
      const validation = validateField("idea", idea);
      if (!validation.isValid) {
        setSearchStatus(`エラー: ${validation.error}`);
        return;
      }

      setLoading(true);
      setSearchStatus("アイデアを検索中...");

      try {
        // Use sanitized value for API request
        const sanitizedIdea = validation.sanitizedValue;
        const response = await fetch("/api/search-ideas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idea: sanitizedIdea }),
        });

        if (!response.ok) {
          throw new Error("Failed to search for similar projects");
        }

        const data = await response.json();
        setResults(data.projects);
        setSearchStatus("改善されたアイデアを生成中...");

        const improvedResponse = await fetch("/api/improve-idea", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idea: sanitizedIdea, similarProjects: data.projects }),
        });

        if (!improvedResponse.ok) {
          throw new Error("Failed to generate improved idea");
        }

        const improvedData = await improvedResponse.json();
        setImprovedIdea(improvedData.improvedIdea);
        setSearchStatus(
          `検索完了: ${data.projects.length}件の類似プロジェクトが見つかりました`,
        );
      } catch (error: any) {
        console.error("Error during search:", error);
        setSearchStatus("エラーが発生しました。もう一度お試しください。");
      } finally {
        setLoading(false);
      }
    },
    [idea, validateField, clearErrors],
  );

  const handleIdeaChange = useCallback((value: string) => {
    setIdea(value);
    // Clear error when user starts typing
    if (errors.idea) {
      clearErrors();
    }
  }, [errors.idea, clearErrors]);

  return (
    <div className="container mx-auto px-4">
      {/* Header with Link */}
      <header className="text-center my-6">
        <h1>
          <a
            href="https://github.com/susumutomita/Hackathon-AI"
            className="text-2xl font-bold text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hackathon AI - GitHubリポジトリを新しいタブで開く"
          >
            Hackathon AI
          </a>
        </h1>
        <p className="mt-2 text-gray-600">
          Hackathon AI helps you enhance your project ideas by leveraging data
          from past hackathon projects. Analyze similar projects and receive
          improvement suggestions to increase your chances of success in
          hackathons.
        </p>
      </header>

      {/* Live region for status announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="search-status"
      >
        {searchStatus}
      </div>

      {/* Main Content Wrapper */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Submit Your Idea Section */}
        <section
          className="flex-1 h-full"
          aria-labelledby="submit-idea-heading"
        >
          <h2 id="submit-idea-heading" className="text-xl font-bold mb-4">
            Submit Your Idea
          </h2>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 h-full"
            role="form"
            aria-describedby="search-status"
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="idea-input"
                className="text-sm font-medium text-gray-700"
              >
                Enter your hackathon project idea
              </label>
              <TextareaAutosize
                id="idea-input"
                value={idea}
                onChange={(e) => handleIdeaChange(e.target.value)}
                placeholder="あなたのハッカソンプロジェクトのアイデアを説明してください。ターゲットユーザー、主要機能など、詳細に記載するほど良い提案を受けられます。"
                className={`resize-none overflow-auto w-full p-3 border rounded-md h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                  errors.idea ? "border-red-500" : "border-gray-300"
                }`}
                minRows={10}
                required
                aria-describedby="idea-input-description"
              />
              <div
                id="idea-input-description"
                className={`text-sm ${errors.idea ? "text-red-500" : "text-gray-500"}`}
              >
                {errors.idea || "Describe your project idea, target audience, and key features. The more detail you provide, the better suggestions you'll receive."}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full sm:w-auto self-center sm:self-start focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={loading || !idea.trim()}
              aria-describedby="submit-button-status"
            >
              {loading ? "Searching..." : "Submit"}
            </Button>
            {loading && (
              <div id="submit-button-status" className="text-sm text-gray-600">
                Processing your request...
              </div>
            )}
          </form>
        </section>

        {/* Improved Idea Section */}
        <section
          className="flex-1 h-full"
          aria-labelledby="improved-idea-heading"
        >
          <h2 id="improved-idea-heading" className="text-xl font-bold mb-4">
            Improved Idea
          </h2>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="improved-idea-input"
              className="text-sm font-medium text-gray-700"
            >
              AI-enhanced version of your idea
            </label>
            <TextareaAutosize
              id="improved-idea-input"
              value={improvedIdea}
              onChange={(e) => setImprovedIdea(e.target.value)}
              placeholder="あなたのアイデアの改善版がここに表示されます..."
              className="resize-none overflow-auto w-full p-3 border border-gray-300 rounded-md h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
              minRows={10}
              readOnly={!improvedIdea}
              aria-describedby="improved-idea-description"
            />
            <div
              id="improved-idea-description"
              className="text-sm text-gray-500"
            >
              This field will be automatically populated with an enhanced
              version of your idea based on analysis of similar successful
              projects.
            </div>
          </div>
        </section>
      </div>

      {/* Similar Projects Section */}
      <section className="mt-8" aria-labelledby="similar-projects-heading">
        <h2 id="similar-projects-heading" className="text-xl font-bold mb-4">
          Past Finalist Projects with Similar Ideas
        </h2>
        {results.length > 0 ? (
          <div className="overflow-x-auto">
            <Table role="table" aria-label="Similar hackathon projects">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Title</TableHead>
                  <TableHead scope="col">Project Description</TableHead>
                  <TableHead scope="col">How it&apos;s Made</TableHead>
                  <TableHead scope="col">Source Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <a
                        href={sanitizeUrl(`https://ethglobal.com${result.link}`) || "#"}
                        className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${escapeHtmlAttribute(result.title)} project on ETHGlobal (opens in new tab)`}
                      >
                        {result.title}
                      </a>
                    </TableCell>
                    <TableCell>
                      {result.description ? (
                        <span>{result.description}</span>
                      ) : (
                        <span className="text-gray-500 italic">
                          No description available
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.howItsMade ? (
                        <span>{result.howItsMade}</span>
                      ) : (
                        <span className="text-gray-500 italic">
                          No technical details available
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.sourceCode ? (
                        <a
                          href={sanitizeUrl(result.sourceCode) || "#"}
                          className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View source code for ${escapeHtmlAttribute(result.title)} (opens in new tab)`}
                        >
                          View Source
                        </a>
                      ) : (
                        <span className="text-gray-500 italic">
                          Source code not available
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          !loading && (
            <p className="text-gray-600" role="status" aria-live="polite">
              {idea.trim()
                ? "No matching ideas found. Try submitting your idea to see similar projects."
                : "Submit your idea above to find similar projects."}
            </p>
          )
        )}
      </section>
    </div>
  );
});

export default IdeaForm;
