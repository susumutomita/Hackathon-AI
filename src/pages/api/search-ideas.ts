import { NextApiRequest, NextApiResponse } from "next";
import { QdrantHandler } from "@/lib/qdrantHandler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { idea } = req.body;

  if (!idea) {
    return res.status(400).json({ message: "Idea is required" });
  }

  try {
    const qdrantHandler = new QdrantHandler();
    const embedding = await qdrantHandler.createEmbedding(idea);
    const similarProjects =
      await qdrantHandler.searchSimilarProjects(embedding);

    res.status(200).json({
      message: "Search completed successfully",
      projects: similarProjects,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Search failed",
      error: error.message || "An unknown error occurred",
    });
  }
}
