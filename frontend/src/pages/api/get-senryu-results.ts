import type { NextApiRequest, NextApiResponse } from "next";

type Senryu = {
  id: string;
  content: string;
  voteCount: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { page = 1, pageSize = 10 } = req.query;

  try {
    const response = await fetch(
      process.env.GOLDSKY_API_URL ||
        "https://api.goldsky.com/api/public/project_clzjz50lmpswm01uq8oa85ws8/subgraphs/onchain-senryu/1.0.2/gn",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
          {
            senryus(first: ${pageSize}, skip: ${(Number(page) - 1) * Number(pageSize)}, orderBy: voteCount, orderDirection: desc) {
              id
              content
              voteCount
            }
          }
        `,
        }),
      },
    );

    const result = await response.json();

    const formattedSenryus = result.data.senryus.map((senryu: Senryu) => ({
      id: senryu.id,
      content: senryu.content,
      voteCount: senryu.voteCount,
    }));
    console.log("formattedSenryus", formattedSenryus);

    res.status(200).json({ topSenryus: formattedSenryus });
  } catch (error) {
    console.error("Error fetching top senryus:", error);
    res.status(500).json({ error: "Failed to fetch top senryus" });
  }
}
