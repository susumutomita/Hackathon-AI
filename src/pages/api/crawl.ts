import { NextApiRequest, NextApiResponse } from "next";
import { crawlEthGlobalShowcase } from "@/lib/crawler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT === "production") {
    return res
      .status(403)
      .json({ error: "This API is disabled in the production environment." });
  }

  try {
    const projects = await crawlEthGlobalShowcase();
    res.status(200).json({
      message: "Crawling completed successfully",
      projects,
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Crawling failed",
      details: error.message || "An unknown error occurred",
    });
  }
}
