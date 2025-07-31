import { NextApiRequest, NextApiResponse } from "next";
import { checkAndUpdateEvents } from "@/lib/eventUpdater";
import { crawlEthGlobalShowcase } from "@/lib/crawler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // セキュリティ: GitHub Actionsからのアクセスのみ許可
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Step 1: 最新のイベントを取得して更新
    const updateResult = await checkAndUpdateEvents();

    if (!updateResult.success) {
      return res.status(500).json({
        error: "Failed to update events",
        details: updateResult.error,
      });
    }

    // Step 2: 有効化されているイベントをクロール
    const projects = await crawlEthGlobalShowcase();

    res.status(200).json({
      message: "Auto crawl completed successfully",
      eventsUpdate: {
        added: updateResult.added,
        total: updateResult.total,
      },
      crawlResult: {
        projectsCount: projects.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Auto crawl failed",
      details: error.message || "An unknown error occurred",
    });
  }
}
