"use client";

import { useEffect } from "react";
import logger from "@/lib/logger";
import { useErrorHandler } from "@/components/ErrorBoundary";

export default function ErrorComponent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { reportError } = useErrorHandler();

  useEffect(() => {
    // Enhanced error logging
    logger.error("Next.js Error Boundary triggered", {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        digest: error.digest,
      },
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : "server",
    });

    // Report error using our error handler
    reportError(error, { digest: error.digest });
  }, [error, reportError]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <main className="p-4 md:p-6">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="font-semibold text-lg md:text-2xl text-gray-900 mb-4">
            予期しないエラーが発生しました
          </h1>
          <p className="text-gray-600 mb-6">
            申し訳ございませんが、ページの表示中にエラーが発生しました。
            以下のボタンをお試しください。
          </p>

          <div className="space-y-3 max-w-sm mx-auto">
            <button
              onClick={reset}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              再試行
            </button>
            <button
              onClick={handleReload}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-200"
            >
              ページを再読み込み
            </button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="mt-6 text-left max-w-2xl mx-auto">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                開発者向け詳細情報
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto">
                <div className="mb-2">
                  <strong>エラー:</strong> {error.message}
                </div>
                {error.digest && (
                  <div className="mb-2">
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                {error.stack && (
                  <div>
                    <strong>スタックトレース:</strong>
                    <pre className="whitespace-pre-wrap text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </main>
  );
}
