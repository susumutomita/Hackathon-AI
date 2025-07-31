import { NextApiRequest, NextApiResponse } from "next";
import { checkAndUpdateEvents } from "@/lib/eventUpdater";

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
    const result = await checkAndUpdateEvents();

    if (result.success) {
      res.status(200).json({
        message: "Events updated successfully",
        added: result.added,
        total: result.total,
      });
    } else {
      res.status(500).json({
        error: "Failed to update events",
        details: result.error,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: "Internal server error",
      details: error.message || "An unknown error occurred",
    });
  }
}
