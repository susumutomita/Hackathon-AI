"use client";
import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
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
import { useLlmProgress } from "@/hooks/use-llm-progress";

const IdeaForm = memo(function IdeaForm() {
  const [idea, setIdea] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [improvedIdea, setImprovedIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const streamingEnabled =
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_STREAM_IMPROVEMENT === "1";
  const {
    phase,
    partial,
    error,
    start: startStream,
    reset: resetStream,
  } = useLlmProgress();

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
        const projectsFoundText =
          data.projects.length > 0
            ? `${data.projects.length}件の類似プロジェクトを参考に改善版を生成中...`
            : "類似プロジェクトは見つかりませんでしたが、専門知識を活用してアイデアを改善中...";
        setSearchStatus(
          `${projectsFoundText} (AI処理には最大2分程度かかることがあります)`,
        );

        if (streamingEnabled) {
          // Streaming path (live progress and partial output)
          try {
            await startStream({
              idea: sanitizedIdea,
              similarProjects: data.projects,
            });
            setImprovedIdea(partial);
          } catch (e) {
            // Fallback to non-streaming if streaming fails
            const improvedResponse = await fetch("/api/improve-idea", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                idea: sanitizedIdea,
                similarProjects: data.projects,
              }),
            });
            if (!improvedResponse.ok) {
              throw new Error("Failed to generate improved idea");
            }
            const improvedData = await improvedResponse.json();
            setImprovedIdea(improvedData.improvedIdea);
          }
        } else {
          // Existing non-streaming behavior
          const improvedResponse = await fetch("/api/improve-idea", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idea: sanitizedIdea,
              similarProjects: data.projects,
            }),
          });
          if (!improvedResponse.ok) {
            const errorData = await improvedResponse.text();
            console.error(
              `Improve idea API error (${improvedResponse.status}):`,
              errorData,
            );
            throw new Error(
              `Failed to generate improved idea (${improvedResponse.status}): ${errorData}`,
            );
          }
          const improvedData = await improvedResponse.json();
          setImprovedIdea(improvedData.improvedIdea);
        }

        const completionText =
          data.projects.length > 0
            ? `検索完了: ${data.projects.length}件の類似プロジェクトが見つかりました`
            : "検索完了: 類似プロジェクトは見つかりませんでしたが、改善されたアイデアを生成しました";
        setSearchStatus(completionText);
      } catch (error: any) {
        console.error("Error during search:", error);
        setSearchStatus("エラーが発生しました。もう一度お試しください。");
      } finally {
        setLoading(false);
      }
    },
    [idea, validateField, clearErrors, startStream, partial, streamingEnabled],
  );

  const handleIdeaChange = useCallback(
    (value: string) => {
      setIdea(value);
      // Clear error when user starts typing
      if (errors.idea) {
        clearErrors();
      }
    },
    [errors.idea, clearErrors],
  );

  const checkLLMStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/debug/llm-status");
      const data = await response.json();
      setDiagnostics(data);
      setShowDiagnostics(true);
    } catch (error) {
      console.error("Failed to check LLM status:", error);
      setDiagnostics({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setShowDiagnostics(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // When streaming finishes, persist final text into editable state
  useEffect(() => {
    if (streamingEnabled && phase === "done" && partial) {
      setImprovedIdea(partial);
    }
  }, [streamingEnabled, phase, partial]);

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
                {errors.idea ||
                  "Describe your project idea, target audience, and key features. The more detail you provide, the better suggestions you'll receive."}
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

        {/* Diagnostics Section */}
        {showDiagnostics && diagnostics && (
          <section className="mb-8 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">LLM Service Diagnostics</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDiagnostics(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Environment:</strong>{" "}
                  {diagnostics.diagnostics?.environment}
                </div>
                <div>
                  <strong>Mode:</strong>{" "}
                  {diagnostics.diagnostics?.isProduction
                    ? "Production"
                    : "Development"}
                </div>
              </div>

              {diagnostics.diagnostics?.ollama && (
                <div className="border rounded p-3 bg-white">
                  <h3 className="font-semibold text-blue-600 mb-2">
                    Ollama (Development)
                  </h3>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs ${
                          diagnostics.diagnostics.ollama.status === "connected"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {diagnostics.diagnostics.ollama.status}
                      </span>
                    </div>
                    {diagnostics.diagnostics.ollama.targetModel && (
                      <div>
                        <strong>Target Model:</strong>{" "}
                        {diagnostics.diagnostics.ollama.targetModel}
                      </div>
                    )}
                    {diagnostics.diagnostics.ollama.targetModelExists !==
                      undefined && (
                      <div>
                        <strong>Model Available:</strong>
                        <span
                          className={`ml-2 ${
                            diagnostics.diagnostics.ollama.targetModelExists
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {diagnostics.diagnostics.ollama.targetModelExists
                            ? "✓"
                            : "✗"}
                        </span>
                      </div>
                    )}
                    {diagnostics.diagnostics.ollama.error && (
                      <div className="text-red-600">
                        <strong>Error:</strong>{" "}
                        {diagnostics.diagnostics.ollama.error}
                      </div>
                    )}
                    {diagnostics.diagnostics.ollama.warning && (
                      <div className="text-yellow-600">
                        <strong>Warning:</strong>{" "}
                        {diagnostics.diagnostics.ollama.warning}
                      </div>
                    )}
                    {diagnostics.diagnostics.ollama.suggestion && (
                      <div className="text-blue-600">
                        <strong>Suggestion:</strong>{" "}
                        {diagnostics.diagnostics.ollama.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {diagnostics.diagnostics?.groq && (
                <div className="border rounded p-3 bg-white">
                  <h3 className="font-semibold text-purple-600 mb-2">
                    Groq (Production)
                  </h3>
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs ${
                          diagnostics.diagnostics.groq.status === "connected"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {diagnostics.diagnostics.groq.status}
                      </span>
                    </div>
                    {diagnostics.diagnostics.groq.model && (
                      <div>
                        <strong>Model:</strong>{" "}
                        {diagnostics.diagnostics.groq.model}
                      </div>
                    )}
                    {diagnostics.diagnostics.groq.error && (
                      <div className="text-red-600">
                        <strong>Error:</strong>{" "}
                        {diagnostics.diagnostics.groq.error}
                      </div>
                    )}
                    {diagnostics.diagnostics.groq.suggestion && (
                      <div className="text-blue-600">
                        <strong>Suggestion:</strong>{" "}
                        {diagnostics.diagnostics.groq.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Improved Idea Section */}
        <section
          className="flex-1 h-full"
          aria-labelledby="improved-idea-heading"
        >
          <h2 id="improved-idea-heading" className="text-xl font-bold mb-4">
            Improved Idea
          </h2>
          {streamingEnabled && (
            <div className="mb-2 text-sm text-gray-600" aria-live="polite">
              {phase !== "idle" && phase !== "done" && !error && (
                <span>LLM is reviewing... ({phase.replaceAll("_", " ")})</span>
              )}
              {error && (
                <span className="text-red-600">
                  An error occurred. Falling back.
                </span>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="improved-idea-input"
              className="text-sm font-medium text-gray-700"
            >
              AI-enhanced version of your idea
            </label>
            <TextareaAutosize
              id="improved-idea-input"
              value={streamingEnabled && partial ? partial : improvedIdea}
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
                        href={
                          sanitizeUrl(`https://ethglobal.com${result.link}`) ||
                          "#"
                        }
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

      {/* Footer with diagnostic button - subtle placement */}
      <footer className="mt-12 pt-6 border-t border-gray-200">
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={checkLLMStatus}
            className="text-xs text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1"
            disabled={loading}
          >
            {loading ? "Checking..." : "System Status"}
          </Button>
        </div>
      </footer>
    </div>
  );
});

export default IdeaForm;
