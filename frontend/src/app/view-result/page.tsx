"use client";
import { useState, useEffect } from "react";

export default function VoteResult() {
  const [topSenryus, setTopSenryus] = useState<
    { id: number; content: string; voteCount: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchTopSenryus = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/get-senryu-results?page=${page}&pageSize=${pageSize}`,
        );
        const data = await response.json();

        setTopSenryus(data.topSenryus);
      } catch (error) {
        console.error("Error fetching top senryus:", error);
        alert("Failed to fetch top senryus");
      } finally {
        setLoading(false);
      }
    };

    fetchTopSenryus();
  }, [page]);

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (topSenryus.length === pageSize) {
      setPage(page + 1);
    }
  };

  return (
    <div
      className="container mx-auto p-6 dark-mode-bg"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        maxWidth: "800px",
      }}
    >
      <h1 className="text-3xl font-bold mb-6 text-center">Vote Results</h1>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <ul className="space-y-4">
          {topSenryus
            .filter((senryu) => senryu.content) // 空のコンテンツを除外
            .map((senryu) => (
              <li
                key={senryu.id.toString()}
                className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm"
              >
                <p className="text-lg font-semibold mb-2">"{senryu.content}"</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">
                    Votes: {senryu.voteCount.toString()}
                  </span>
                </div>
              </li>
            ))}
        </ul>
      )}
      <div className="mt-8 flex justify-between">
        <button
          onClick={handlePreviousPage}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-md dark-mode-button"
          disabled={page === 1}
        >
          Previous
        </button>
        <button
          onClick={handleNextPage}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-md dark-mode-button"
          disabled={topSenryus.length < pageSize}
        >
          Next
        </button>
      </div>
      <button
        onClick={() => window.history.back()}
        className="mt-6 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-md dark-mode-button"
        style={{ textTransform: "none" }}
      >
        Back
      </button>
    </div>
  );
}
