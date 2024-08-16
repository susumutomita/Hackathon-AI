"use client";

import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { abi, contractAddress } from "../constants/contract";
import "./submit-senryu.css"; // CSSファイルをインポート

declare global {
  interface Window {
    ethereum: any;
  }
}

export default function SubmitSenryu() {
  const [content, setContent] = useState("");
  const [generatedSenryu, setGeneratedSenryu] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSenryu = async () => {
    setLoading(true);
    setError(null); // Clear any existing errors

    try {
      const response = await fetch("/api/generate-senryu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: content }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedSenryu(data.senryu);
      } else {
        setError("Failed to generate senryu: " + data.error);
      }
    } catch (error) {
      console.error("Error generating senryu:", error);
      setError("Error generating senryu");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any existing errors

    if (!generatedSenryu.trim()) {
      setError("Generated Senryu cannot be empty!");
      return;
    }

    setSubmitting(true);

    if (!window.ethereum) {
      setError("MetaMask is not installed!");
      setSubmitting(false);
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, abi, signer);
      await contract.submitSenryu(generatedSenryu);
      alert("Senryu submitted successfully!");
      setGeneratedSenryu("");
      setContent(""); // Clear the form
    } catch (error: any) {
      console.error("Error submitting senryu:", error);
      if (error.code === 4001) {
        setError("MetaMask access denied");
      } else {
        setError("Failed to submit senryu");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 dark-mode-bg">
      <h1 className="text-3xl font-bold mb-4">Submit a Senryu</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">What is a Senryu?</h2>
        <p>
          A <strong>Senryu</strong> (川柳) is a form of Japanese short poetry
          similar to haiku in construction: three lines with a total of 17
          syllables, arranged in a 5-7-5 pattern. However, unlike haiku, which
          often deals with nature and the changing seasons, Senryu is more
          focused on human nature, humor, and satire.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium dark-mode-label">
            What would you like to say? (in English):
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 p-2 border rounded-md shadow-sm w-full dark-mode-input"
            placeholder="Enter your idea or prompt here..."
            style={{ color: "#000000" }} // ここでフォントカラーを設定
          />
        </div>
        <button
          type="button"
          onClick={generateSenryu}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-md dark-mode-button"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Senryu"}
        </button>

        {error && <p className="text-red-600 mt-4">{error}</p>}

        {generatedSenryu && (
          <div className="mt-4">
            <h2 className="text-xl font-bold">Generated Senryu:</h2>
            <textarea
              className="mt-2 p-4 bg-gray-100 text-gray-900 rounded-md border border-gray-300 w-full"
              value={generatedSenryu}
              onChange={(e) => setGeneratedSenryu(e.target.value)}
              style={{ color: "#000000" }} // ここでフォントカラーを設定
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 mt-4 rounded-full shadow-md dark-mode-button"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Senryu"}
            </button>
          </div>
        )}
      </form>

      <button
        onClick={() => window.history.back()}
        className="mt-6 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full shadow-md dark-mode-button"
      >
        Back
      </button>
    </div>
  );
}
