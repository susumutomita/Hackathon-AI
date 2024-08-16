"use client";
import { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import { abi, contractAddress } from "../constants/contract";

interface Senryu {
  id: number;
  content: string;
  voteCount: number;
}

export default function ViewSenryus() {
  const [senryus, setSenryus] = useState<Senryu[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10; // 一度に取得するSenryuの数
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSenryus = async () => {
      setLoading(true);
      setError(null); // 既存のエラーをクリア

      if (!window.ethereum) {
        setError("MetaMaskがインストールされていません！");
        setLoading(false);
        return;
      }

      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(contractAddress, abi, signer);
        const formattedSenryus = await fetchSenryusData(
          page,
          pageSize,
          contract,
        );

        setSenryus(formattedSenryus);
      } catch (error) {
        console.error("Senryuの取得中にエラーが発生しました:", error);
        setError("Senryuの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchSenryus();
  }, [page]);

  const vote = async (senryuId: number) => {
    setLoading(true);
    setError(null); // 既存のエラーをクリア

    if (!window.ethereum) {
      setError("MetaMaskがインストールされていません！");
      setLoading(false);
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, abi, signer);

      await contract.vote(senryuId);
      const formattedSenryus = await fetchSenryusData(page, pageSize, contract);
      setSenryus(formattedSenryus);
    } catch (error: any) {
      console.error("Senryuへの投票中にエラーが発生しました:", error);
      if (error.code === 4001) {
        setError("MetaMaskのアクセスが拒否されました");
      } else {
        setError("Senryuへの投票に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (senryus.length === pageSize) {
      setPage(page + 1);
    }
  };

  return (
    <div
      className="container mx-auto p-4 dark-mode-bg"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <h1 className="text-3xl font-bold mb-6 text-white">Explore Senryus</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-white">Loading...</p>
      ) : (
        <ul className="space-y-4">
          {senryus.map((senryu) => (
            <li
              key={senryu.id}
              className="p-4 bg-gray-900 text-white rounded-md shadow-sm"
            >
              <p className="text-lg font-semibold mb-2">"{senryu.content}"</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Votes: {senryu.voteCount}</span>
                <button
                  onClick={() => vote(senryu.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-md dark-mode-button"
                >
                  Vote
                </button>
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
          disabled={senryus.length < pageSize}
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

const fetchSenryusData = async (
  page: number,
  pageSize: number,
  contract: Contract,
) => {
  const senryuList = await contract.getSenryus(page, pageSize);
  return senryuList
    .map((senryu: Senryu) => ({
      id: senryu.id,
      content: senryu.content,
      voteCount: senryu.voteCount,
    }))
    .filter((senryu: Senryu) => senryu.content.trim() !== ""); // 空のコンテンツをフィルタリング
};
